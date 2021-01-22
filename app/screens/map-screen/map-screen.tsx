import React, { useState, useEffect, createRef, useCallback } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase, useFocusEffect } from "@react-navigation/native"
import { SearchBar, Button, Icon, Badge } from 'react-native-elements'
import { PERMISSIONS, request } from "react-native-permissions"
import { View, Text, ActivityIndicator, Modal, Platform, Alert } from "react-native"
import Geolocation from '@react-native-community/geolocation'
import MapView, { Marker } from "react-native-maps"
import { styles } from "../map-screen/styles"
import { TouchableWithoutFeedback } from "react-native-gesture-handler"
import { getUnsynced, syncPullData, pushUnsyncedWells } from "../../models/sync/sync"
import { delay } from "../../utils/delay"
import NetInfo from "@react-native-community/netinfo"
import * as Progress from 'react-native-progress'
import { Api } from "../../services/api/api"
import { clearTemporaryNewWells, createNewWell, getWellsByField, loadWells, saveWells } from "../../models/well/well.store"
import { saveTerms } from "../../models/well/term.store"
import Well from "../../models/well/well"
import { WellStatusBadge } from "../../components/well/well-status-badge"

const mapViewRef = createRef()
let SUBS = null

export interface MapScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  const { navigation } = props
  const [wells, setWells] = useState([])
  const [markers, setMarkers] = useState([])
  const [newRecordMarker, setNewRecordMarker] = useState(null)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [isViewRecord, setIsViewRecord] = useState(false)
  const [isAddRecord, setIsAddRecord] = useState(false)
  const [selectedWell, setSelectedWell] = useState({} as Well)
  const [unsyncedData, setUnsyncedData] = useState([])
  const [syncProgress, setSyncProgress] = useState(0)
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)

  const drawMarkers = (data) => {
    const _markers = []
    data.forEach((data) => {
      _markers.push({
        coordinate: {
          latitude: data.latitude,
          longitude: data.longitude
        },
        title: data.id,
        key: data.pk
      })
    })
    setMarkers(_markers)
  }

  const getWells = async(_latitude?, _longitude?) => {
    await clearTemporaryNewWells()
    let wells = await loadWells()
    if (wells.length === 0) {
      const userLatitude = _latitude || latitude
      const userLongitude = _longitude || longitude
      const api = new Api()
      await api.setup()
      const apiResult = await api.getWells(
        userLatitude,
        userLongitude
      )
      if (apiResult.kind === "ok") {
        wells = apiResult.wells
        await saveTerms(apiResult.terms)
      }
      await saveWells(wells)
    }
    if (wells) {
      setNewRecordMarker(null)
      setIsAddRecord(false)
      setWells(wells)
      drawMarkers(wells)
      setIsViewRecord(false)
      setIsLoading(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      const getUnsyncedData = async () => {
        const _unsyncedData = await getWellsByField('synced', false) || []
        setUnsyncedData(_unsyncedData)
      }
      getUnsyncedData()
      getWells()
    }, [])
  )

  const refreshMap = useCallback(async () => {
    setMarkers([])
    await getWells()
  }, [])

  const onRegionChange = async (region) => {
    // setCurrentRegion(region)
    // console.log('Region changed', region)
  }

  const markerSelected = (marker) => {
    if (isAddRecord) return
    for (const index in wells) {
      const _well = wells[index]
      if (_well.pk === marker.key) {
        setSelectedWell(_well)
      }
    }
    setIsViewRecord(true)
  }

  const markerDeselected = () => {
    setIsViewRecord(false)
  }

  const mapSelected = async (e) => {
    if (isAddRecord) {
      setNewRecordMarker({
        coordinate: e.nativeEvent.coordinate
      })
    }
    markerDeselected()
  }

  const updateSearch = _search => {
    setSearch(_search)
  }

  const watchLocation = async () => {
    await Geolocation.getCurrentPosition(
      async (position) => {
        if (mapViewRef) {
          await setLatitude(position.coords.latitude)
          await setLongitude(position.coords.longitude)
          mapViewRef.current.animateCamera({
            center: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          })
          if (wells.length === 0) {
            getWells(position.coords.latitude, position.coords.longitude)
          }
        }
      },
      error => {
        console.log(error)
      },
      { enableHighAccuracy: true, timeout: 1000 },
    )
  }

  const requestLocation = () => {
    try {
      request(
        Platform.select({
          android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        })
      ).then(res => {
        if (res === "granted") {
          watchLocation()
        } else {
          getWells()
        }
      })
    } catch (error) {
      console.log("location set error:", error)
    }
  }

  const viewRecord = React.useMemo(() => () => props.navigation.navigate("form", {
    wellPk: selectedWell.pk,
    onBackToMap: () => refreshMap()
  }), [
    props.navigation,
    selectedWell,
    refreshMap
  ])

  const addNewRecord = async () => {
    const newWell = await createNewWell(newRecordMarker.coordinate.latitude, newRecordMarker.coordinate.longitude)
    props.navigation.navigate("form", {
      wellPk: newWell.pk,
      onBackToMap: () => refreshMap()
    })
  }

  const submitSearch = async() => {
    setIsLoading(true)
    const results = []
    if (wells) {
      for (const index in wells) {
        if (wells[index].id.toLowerCase().includes(search.toLowerCase())) {
          results.push(wells[index])
        }
      }
    }
    drawMarkers(results)
    setIsLoading(false)
  }

  const onClearSearch = async() => {
    getWells()
  }

  const showError = (errorMessage) => {
    Alert.alert(
      "Error",
      errorMessage
    )
  }

  const checkConnection = async() => {
    return NetInfo.fetch().then(state => {
      return state.isConnected
    })
  }

  const syncUpdateWell = async() => {
    setSyncMessage("Updating well data")
    await syncPullData(setSyncProgress, setSyncMessage, showError)
  }

  const pushUnsynced = async() => {
    const _unsyncedData = Object.assign([], unsyncedData)
    let syncResult = true
    for (let i = 0; i < _unsyncedData.length; i++) {
      setSyncMessage(`${i + 1} records of ${unsyncedData.length} are synced`)
      syncResult = await pushUnsyncedWells([_unsyncedData[i]])
      if (!syncResult) {
        showError("One of the data can't be synchronized")
        return unsyncedData
      } else {
        unsyncedData[i].synced = true
        setSyncProgress((i + 1) / unsyncedData.length)
      }
    }
    const currentUnsyncedData = await getUnsynced()
    setUnsyncedData(currentUnsyncedData)
    return currentUnsyncedData
  }

  const syncData = async() => {
    if (isSyncing) {
      return
    }
    const isConnected = await checkConnection()
    if (!isConnected) {
      showError("No internet connection available, please try again later")
      return
    }
    markerDeselected()
    setIsSyncing(true)
    let currentUnsyncedData = unsyncedData
    if (currentUnsyncedData.length > 0) {
      currentUnsyncedData = await pushUnsynced()
    }
    if (currentUnsyncedData.length === 0) {
      await syncUpdateWell()
      await delay(250)
      setSyncMessage('')
      setMarkers([])
      setSelectedWell(null)
      await getWells()
      setSyncProgress(0)
    }
    setIsSyncing(false)
  }

  useEffect(() => {
    ;(async () => {
      await getWells()
      delay(500).then(() => requestLocation())
    })()
    return function cleanup() {
      if (SUBS) {
        SUBS.unsubscribe()
        SUBS = null
      }
    }
  }, [])

  return (
    <View style = { styles.CONTAINER }>
      <SearchBar
        placeholder="Search"
        lightTheme
        round
        onChangeText={ updateSearch }
        onClear={ onClearSearch }
        onSubmitEditing={ submitSearch }
        value={ search }
        showLoading={ isLoading }
      />
      <MapView
        ref = { mapViewRef }
        onRegionChange={ onRegionChange }
        followsUserLocation
        style={ styles.MAP }
        loadingEnabled={true}
        showsUserLocation={true}
        moveOnMarkerPress = {true}
        onPress={(e) => { mapSelected(e) }}>
        {markers.map(marker => {
          return (
            <Marker
              key={marker.key}
              coordinate={marker.coordinate}
              title={marker.title}
              ref={ref => { marker.ref = ref }}
              onPress={() => { markerSelected(marker) }}
              onDeselect={() => { markerDeselected() }}
              onSelect={() => { markerSelected(marker) }}
            />
          )
        })}
        {newRecordMarker
          ? <Marker
            key={'newRecord'}
            coordinate={newRecordMarker.coordinate}
            title={'New Record'}
            pinColor={'orange'}
          /> : null }
      </MapView>

      <Modal
        transparent={true}
        animationType={"none"}
        visible={ isLoading }
        onRequestClose={() => { setIsLoading(false) }}>
        <View style={ styles.MODAL_BACKGROUND }>
          <View style={ styles.ACTIVITY_INDICATOR_WRAPPER }>
            <ActivityIndicator
              animating={ isLoading } size="large" color="#ff8000" style={ styles.ACTIVITY_INDICATOR } />
            <Text style={ styles.MODAL_TEXT }>Loading...</Text>
          </View>
        </View>
      </Modal>

      { isSyncing
        ? (
          <View style={ styles.MID_BOTTOM_CONTAINER }>
            <View style={ styles.MID_BOTTOM_CONTENTS }>
              <Text style={ styles.MID_BOTTOM_TEXT }>Sync is on</Text>
              <Text style={ styles.MID_BOTTOM_SUB_TEXT }>{ syncMessage }</Text>
              <Progress.Bar color={ "rgb(241, 137, 3)" } height={ 12 } progress={ syncProgress } width={250} />
            </View>
          </View>
        ) : <View></View>}

      { isViewRecord
        ? (
          <View style={ styles.MID_BOTTOM_CONTAINER }>
            <View style={ styles.MID_BOTTOM_CONTENTS }>
              <WellStatusBadge well={selectedWell} containerStyle={{ position: 'absolute', top: 10, left: 10 }}></WellStatusBadge>
              <Text style={ styles.MID_BOTTOM_TEXT }>{ selectedWell.id } </Text>
              <Button
                title="View Record"
                type="outline"
                raised
                buttonStyle={ styles.MID_BOTTOM_BUTTON }
                titleStyle={{ color: "#ffffff" }}
                containerStyle={{ width: "60%" }}
                onPress={ () => { viewRecord() }}
              />
            </View>
          </View>
        ) : <View></View>}

      { isAddRecord
        ? (
          <View style={styles.MID_BOTTOM_CONTAINER}>
            <View style={styles.MID_BOTTOM_CONTENTS}>
              <Text style={styles.MID_BOTTOM_TEXT}>Select location on the map</Text>
              <View style={{ flexDirection: "row"}}>
                <Button
                  title="Cancel"
                  type="outline"
                  raised
                  buttonStyle={ styles.MID_BOTTOM_BUTTON }
                  titleStyle={{ color: "#ffffff" }}
                  containerStyle={{ width: "30%" }}
                  onPress={ () => { setNewRecordMarker(null); setIsAddRecord(false) }}
                />
                { newRecordMarker ? <Button
                  title="Add"
                  type="outline"
                  raised
                  buttonStyle={ styles.MID_BOTTOM_BUTTON }
                  titleStyle={{ color: "#ffffff" }}
                  containerStyle={{ width: "30%", marginLeft: 10 }}
                  onPress={ () => { addNewRecord() }}
                /> : null }
              </View>
            </View>
          </View>
        ) : null
      }

      <View style={ styles.BOTTOM_VIEW }>
        <Button
          icon={
            <Icon
              name="plus-circle"
              type="font-awesome"
              size={25}
              color="rgb(196, 196, 196)"
            ></Icon>
          }
          onPress={ () => setIsAddRecord(true) }
          buttonStyle={ styles.USER_BUTTON }
          containerStyle={ styles.USER_BUTTON_CONTAINER }
          TouchableComponent={TouchableWithoutFeedback}
        >
        </Button>
        <Button
          icon={
            <Icon
              name="location-arrow"
              type="font-awesome"
              size={30}
              color="#ffffff"
            />
          }
          title=""
          type="outline"
          buttonStyle={ styles.LOCATE_ME_BUTTON }
          containerStyle={ styles.LOCATE_ME_CONTAINER }
          onPress={ () => { watchLocation() }}
        />
        <Button
          icon={
            <Icon
              name="refresh"
              type="font-awesome"
              size={25}
              color={ isSyncing ? "rgb(241, 137, 3)" : "rgb(196, 196, 196)" }
            ></Icon>
          }
          onPress={() => syncData() }
          buttonStyle={ styles.SYNC_BUTTON }
          containerStyle={ styles.SYNC_BUTTON_CONTAINER }
          TouchableComponent={TouchableWithoutFeedback}
        ></Button>
        { unsyncedData.length > 0 ? <Badge value={ unsyncedData.length } status="error" containerStyle={ styles.SYNC_BADGE } /> : <View></View> }
      </View>
    </View>
  )
}
