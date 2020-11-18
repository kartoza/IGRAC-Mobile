import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { SearchBar, Button, Icon } from 'react-native-elements'
import { View, ViewStyle, Text, ActivityIndicator, Modal, Platform, TextStyle } from "react-native"
import MapView, { Marker } from "react-native-maps"
import { CancelToken } from "apisauce"
import Axios from "axios"
import {
  Observable
} from "rxjs"
import { load, save } from "../../utils/storage"
const { API_URL } = require("../../config/env")

const ACTIVITY_INDICATOR: ViewStyle = {
  top: 10,
}
const ACTIVITY_INDICATOR_WRAPPER: ViewStyle = {
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: 10,
  display: "flex",
  height: 140,
  justifyContent: "space-around",
  width: 140,
}
const BOTTOM_VIEW: ViewStyle = {
  alignItems: "center",
  backgroundColor: "white",
  bottom: 0,
  flexDirection: "row-reverse",
  height: (Platform.OS === "ios") ? 80 : 60,
  justifyContent: "center",
  paddingBottom: (Platform.OS === "ios") ? 20 : 0,
  position: "absolute",
  width: "100%",
}
const CONTAINER: ViewStyle = {
  height: "100%"
}
const MAP: ViewStyle = {
  height: "100%",
  marginVertical: 0,
}
const MODAL_TEXT: TextStyle = {
  fontSize: 14,
  textAlign: "center"
}
const MODAL_BACKGROUND: ViewStyle = {
  alignItems: "center",
  backgroundColor: "#00000040",
  flex: 1,
  flexDirection: "column",
  justifyContent: "space-around"
}

let mapViewRef = null
let SUBS = null
const WELL_BASE_URL = `${API_URL}/geoserver/groundwater/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=groundwater:Groundwater_Well&maxFeatures=50&outputFormat=application%2Fjson&viewparams=uuid:68bd8b0e-cd05-493b-9590-f00a0d677cfa`
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
    const well = await load("well")

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
          setWells(data)
          await save('well', well)
          await renderWells(data)
          setIsViewRecord(false)
          setIsLoading(false)
        }
      }
    })
  }

  const onRegionChange = async (region) => {
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

  const addNewWell = () => {
    //
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

  const buttonSpace = () => {
    return (
      <View style={{ width: "5%" }}></View>
    )
  }

  useEffect(() => {
    navigation.addListener('beforeRemove', (e) => {
      // e.preventDefault()
    })
  }, [navigation])

  useEffect(() => {
    ;(async () => {
      getWells(WELL_DATA_URL)
    })()
    return function cleanup() {
      if (SUBS) {
        SUBS.unsubscribe()
        SUBS = null
      }
    }
  }, [])

  return (
    <View style = { CONTAINER }>
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
        initialRegion={{
          latitude: -42.000264798711555,
          latitudeDelta: 4.996117525719413,
          longitude: 146.6129632294178,
          longitudeDelta: 3.703794702887535
        }}
        ref = {(mapView) => { mapViewRef = mapView }}
        onRegionChange={ onRegionChange }
        style={ MAP }
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
        <View style={ MODAL_BACKGROUND }>
          <View style={ ACTIVITY_INDICATOR_WRAPPER }>
            <ActivityIndicator
              animating={ isLoading } size="large" color="#ff8000" style={ ACTIVITY_INDICATOR } />
            <Text style={ MODAL_TEXT }>Loading...</Text>
          </View>
        </View>
      </Modal>

      { isViewRecord ? ( // Refresh map
        (() => {
          return (
            <View style={ BOTTOM_VIEW }>
              <Button
                title="View Record"
                type="outline"
                raised
                buttonStyle={{ borderColor: '#005198', backgroundColor: "#005198", width: "100%" }}
                titleStyle={{ color: "#ffffff" }}
                containerStyle={{ width: "90%" }}
                onPress={ () => { viewRecord() }}
              />
            </View>
          )
        })()) : (
        <View style={ BOTTOM_VIEW }>
          <Button
            icon={
              <Icon
                name="plus"
                type="font-awesome"
                size={15}
                color="#ffffff"
              />
            }
            title="  Add New Well"
            type="outline"
            raised
            buttonStyle={{ borderColor: '#ff6b0d', backgroundColor: "#ff6b0d", width: "100%" }}
            titleStyle={{ color: "#ffffff" }}
            containerStyle={{ width: "90%" }}
            onPress={ () => { addNewWell() }}
          />
        </View>
      )}
    </View>
  )
}
