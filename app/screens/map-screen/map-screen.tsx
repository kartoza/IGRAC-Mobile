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
import { getUnsynced, pushUnsyncedData, SyncResult, syncPullData, pushUnsyncedWells } from "../../models/sync/sync"
import { delay } from "../../utils/delay"
import NetInfo from "@react-native-community/netinfo"
import * as Progress from 'react-native-progress'
import { Api } from "../../services/api/api"
import { getWellsByField, loadWells, saveWells } from "../../models/well/well.store"
import { saveTerms } from "../../models/well/term.store"
import Well from "../../models/well/well"

const mapViewRef = createRef()
let SUBS = null

export interface MapScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  const { navigation } = props
  const [wells, setWells] = useState([])
  const [markers, setMarkers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [isViewRecord, setIsViewRecord] = useState(false)
  const [selectedWell, setSelectedWell] = useState({} as Well)
  const [unsyncedData, setUnsyncedData] = useState([])
  const [syncProgress, setSyncProgress] = useState(0)

  useFocusEffect(
    React.useCallback(() => {
      const getUnsyncedData = async () => {
        const _unsyncedData = await getWellsByField('synced', false) || []
        setUnsyncedData(_unsyncedData)
      }
      getUnsyncedData()
    }, [])
  )

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

  const getWells = async() => {
    let wells = await loadWells()
    if (wells.length === 0) {
      const api = new Api()
      await api.setup()
      const apiResult = await api.getWells()
      if (apiResult.kind === "ok") {
        wells = apiResult.wells
        await saveTerms(apiResult.terms)
      }
      await saveWells(wells)
    }
    if (wells) {
      setWells(wells)
      drawMarkers(wells)
      setIsViewRecord(false)
      setIsLoading(false)
    }
  }

  const refreshMap = useCallback(async () => {
    setMarkers([])
    await getWells()
  }, [])

  const onRegionChange = async (region) => {
    // setCurrentRegion(region)
    // console.log('Region changed', region)
  }

  const markerSelected = (marker) => {
    wells.forEach((_well, index) => {
      if (_well.pk === marker.key) {
        setSelectedWell(_well)
      }
      return true
    })
    setIsViewRecord(true)
  }

  const markerDeselected = () => {
    setIsViewRecord(false)
  }

  const mapSelected = async (e) => {
    markerDeselected()
  }

  const updateSearch = _search => {
    setSearch(_search)
  }

  const watchLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        mapViewRef.current.animateCamera({
          center: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        })
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

  const submitSearch = async() => {
    setIsLoading(true)
    const results = []
    wells.forEach((data) => {
      if (data.id.toLowerCase().includes(search.toLowerCase())) {
        results.push(data)
      }
    })
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
        break
      }
      unsyncedData[i].synced = true
      setSyncProgress((i + 1) / unsyncedData.length)
    }
    setUnsyncedData(await getUnsynced())
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

    if (unsyncedData.length > 0) {
      await pushUnsynced()
    }
    await syncUpdateWell()

    await delay(250)
    setSyncMessage('')
    setIsSyncing(false)
    setMarkers([])
    setSelectedWell(null)
    await getWells()
    setSyncProgress(0)
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
              { !selectedWell.synced ? <Badge
                status="error"
                containerStyle={{ position: 'absolute', top: 10, left: 10 }}
                value="Unsynced"
              /> : <View></View>}
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

      <View style={ styles.BOTTOM_VIEW }>
        <Button
          icon={
            <Icon
              name="user-circle"
              type="font-awesome"
              size={25}
              color="rgb(196, 196, 196)"
            ></Icon>
          }
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
