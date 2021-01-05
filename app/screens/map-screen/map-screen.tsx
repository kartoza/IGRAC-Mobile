import React, { useState, useEffect, createRef } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { SearchBar, Button, Icon, Badge } from 'react-native-elements'
import { PERMISSIONS, request } from "react-native-permissions"
import { View, Text, ActivityIndicator, Modal, Platform, PermissionsAndroid } from "react-native"
import Geolocation from '@react-native-community/geolocation'
import MapView, { Marker } from "react-native-maps"
import { CancelToken } from "apisauce"
import { styles } from "../map-screen/styles"
import Axios from "axios"
import {
  Observable
} from "rxjs"
import { load, save } from "../../utils/storage"
import { TouchableWithoutFeedback } from "react-native-gesture-handler"
import { delay } from "../../utils/delay"
const { API_URL } = require("../../config/env")

const mapViewRef = createRef()
let SUBS = null
const WELL_DATA_URL = `${API_URL}/groundwater/api/well/minimized/`

export interface MapScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  const { navigation } = props
  const [wells, setWells] = useState([])
  const [markers, setMarkers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isViewRecord, setIsViewRecord] = useState(false)
  const [selectedWell, setSelectedWell] = useState('')

  const renderWells = (data) => {
    const _markers = []
    data.forEach((data) => {
      _markers.push({
        coordinate: {
          latitude: data.loc[0],
          longitude: data.loc[1]
        },
        title: data.id,
        key: data.id
      })
    })
    setMarkers(_markers)
  }

  const getWells = async (wellUrl) => {
    const source = CancelToken.source()
    setTimeout(() => {
      source.cancel()
    }, 10 * 1000)

    const uuid = await load("uuid")
    const well = await load("wells")

    if (well) {
      renderWells(well)
      setIsViewRecord(false)
      setIsLoading(false)
      setWells(well)
      return
    }

    const observable$ = Observable.create(observer => {
      Axios.get(`${wellUrl}`, {
        cancelToken: source.token,
        headers: {
          Authorization: `Token ${uuid}`
        }
      })
        .then(response => {
          observer.next(response.data)
          observer.complete()
        }).catch(error => {
          console.log(error)
        })
    })
    SUBS = await observable$.subscribe({
      next: async data => {
        if (data) {
          setWells(data.wells)
          await save('wells', data.wells)
          await save('terms', data.terms)
          await renderWells(data.wells)
          setIsViewRecord(false)
          setIsLoading(false)
        }
      }
    })
  }

  const onRegionChange = async (region) => {
    // setCurrentRegion(region)
    // console.log('Region changed', region)
  }

  const markerSelected = (marker) => {
    setSelectedWell(marker.title)
    setIsViewRecord(true)
  }

  const markerDeselected = () => {
    setIsViewRecord(false)
  }

  const mapSelected = async (e) => {
    // console.log('Map selected', e)
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
      { enableHighAccuracy: true, timeout: 20000 },
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

  const viewRecord = React.useMemo(() => () => {
    return props.navigation.navigate("form", { wellName: selectedWell }), [
      props.navigation,
    ]
  })

  const submitSearch = () => {
    setIsLoading(true)
    const results = []
    wells.forEach((data) => {
      if (data.id.toLowerCase().includes(search.toLowerCase())) {
        results.push(data)
      }
    })
    renderWells(results)
    setIsLoading(false)
  }

  const onClearSearch = async() => {
    getWells(WELL_DATA_URL)
  }

  useEffect(() => {
    navigation.addListener('beforeRemove', (e) => {
      // e.preventDefault()
    })
  }, [navigation])

  useEffect(() => {
    ;(async () => {
      await getWells(WELL_DATA_URL)
      requestLocation()
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

      { isViewRecord
        ? (
          <View style={ styles.MID_BOTTOM_CONTAINER }>
            <View style={ styles.MID_BOTTOM_CONTENTS }>
              <Text style={ styles.MID_BOTTOM_TEXT }>{ selectedWell }</Text>
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
              color="rgb(196, 196, 196)"
            ></Icon>
          }
          buttonStyle={ styles.SYNC_BUTTON }
          containerStyle={ styles.SYNC_BUTTON_CONTAINER }
          TouchableComponent={TouchableWithoutFeedback}
        ></Button>
        <Badge value="4" status="error" containerStyle={ styles.SYNC_BADGE } />
      </View>
    </View>
  )
}
