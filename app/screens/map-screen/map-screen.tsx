import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { SearchBar, ListItem, Button, Header, Icon } from 'react-native-elements'
import { View, Image, ViewStyle, TextStyle, ImageStyle, SafeAreaView, Platform } from "react-native"
import MapView, { Marker } from "react-native-maps"
import { CancelToken } from "apisauce"
import Axios from "axios"
import {
  Observable
} from "rxjs"
import Geolocation from "@react-native-community/geolocation"

const CONTAINER: ViewStyle = {
  height: "100%"
}
const MAP: ViewStyle = {
  height: "100%",
  marginVertical: 0,
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

let _mapView = null
let SUBS = null
const WELL_BASE_URL = 'https://staging.igrac.kartoza.com/geoserver/groundwater/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=groundwater:Groundwater_Well&maxFeatures=50&outputFormat=application%2Fjson&viewparams=uuid:68bd8b0e-cd05-493b-9590-f00a0d677cfa'

export interface MapScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const MapScreen: React.FunctionComponent<MapScreenProps> = props => {
  const { navigation } = props
  const [markers, setMarkers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isViewRecord, setIsViewRecord] = useState(false)
  const [selectedWell, setSelectedWell] = useState('')

  const getWells = async (wellUrl) => {
    const source = CancelToken.source()
    setTimeout(() => {
      source.cancel()
    }, 10 * 1000)
    console.log(wellUrl)

    const observable$ = Observable.create(observer => {
      Axios.get(`${wellUrl}`, { cancelToken: source.token })
        .then(response => {
          observer.next(response.data)
          observer.complete()
        }).catch(error => {
          console.log(error)
        })
    })
    SUBS = await observable$.subscribe({
      next: data => {
        if (data) {
          const _markers = []
          setIsViewRecord(false)
          data.features.forEach((data) => {
            _markers.push({
              coordinate: {
                latitude: data.geometry.coordinates[1],
                longitude: data.geometry.coordinates[0]
              },
              title: data.properties.original_id,
              key: data.id
            })
          })
          setMarkers(_markers)
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
    console.log('selectedWell', selectedWell)
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
  }

  const viewRecord = React.useMemo(() => () => {
    return props.navigation.navigate("form", { wellName: selectedWell }), [
      props.navigation,
    ]
  })

  const submitSearch = () => {
    setIsLoading(true)
    const searchUrl = `${WELL_BASE_URL}&CQL_FILTER=(strToLowerCase(%22original_id%22)%20LIKE%20%27%25${search.toLowerCase()}%25%27)`
    getWells(searchUrl)
  }

  const onClearSearch = async() => {
    getWells(WELL_BASE_URL)
  }

  const buttonSpace = () => {
    return (
      <View style={{ width: "5%" }}></View>
    )
  }

  useEffect(() => {
    ;(async () => {
      getWells(WELL_BASE_URL)
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
        ref = {(mapView) => { _mapView = mapView }}
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
