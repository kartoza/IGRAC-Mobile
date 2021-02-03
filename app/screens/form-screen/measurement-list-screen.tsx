/* eslint-disable react-native/no-color-literals */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/camelcase */
import React, { useState, useEffect } from "react"
import Moment from 'moment'
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase, } from "@react-navigation/native"
import { View, ActivityIndicator, Text, StyleSheet } from "react-native"
import { Header, ListItem, Button, Icon } from 'react-native-elements'
import { styles } from "../form-screen/styles"
import { getWellByField, saveWellByField } from "../../models/well/well.store"
import { ScrollView } from "react-native-gesture-handler"

export interface MeasurementListScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const MeasurementListScreen: React.FunctionComponent<MeasurementListScreenProps> = props => {
  const { route } = props
  const [measurementData, setMeasurementData] = useState([])
  const [newDataOnly, setNewDataOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [wellData, setWellData] = useState(null)

  useEffect(() => {
    ;(async () => {
      let _wellData = null
      if (route.params.wellData) {
        _wellData = route.params.wellData
      } else {
        _wellData = await getWellByField("pk", route.params.wellPk)
      }
      setMeasurementData(_wellData[route.params.measurementType])
      setWellData(_wellData)
      setLoading(false)
    })()
  }, [])

  const displayNewDataOnly = (_measurementData) => {
    if (newDataOnly && !_measurementData.id) {
      return true
    }
    if (!newDataOnly && _measurementData.id) {
      return true
    }
    return false
  }

  const goToMeasurementFormScreen = React.useMemo(() => (measurementData, measurementIndex?) => props.navigation.navigate("measurementForm", {
    wellId: wellData.pk,
    measurementType: route.params.measurementType,
    selectedParameter: measurementData.parameter,
    selectedUnit: measurementData.unit,
    methodology: measurementData.methodology,
    value: measurementData.value,
    datetime: measurementData.datetime,
    onGoBack: async (_measurementData) => {
      route.params.onGoBack(_measurementData, measurementIndex)
      props.navigation.goBack()
    }
  }), [
    props.navigation,
    wellData,
    route.params,
  ])

  return (
    <View style={StyleSheet.absoluteFill}>
      <Header
        placement="center"
        leftComponent={{ icon: "chevron-left", size: 30, color: "#fff", onPress: () => props.navigation.goBack() }}
        centerComponent={{ text: "Measurement Data", style: { fontSize: 18, color: "#fff", fontWeight: "bold" } }}
        containerStyle={ styles.HEADER_CONTAINER }
      />
      { loading ? <View style={styles.LOADING}>
        <ActivityIndicator animating color="rgb(241, 137, 3)" size='large' />
      </View> : null }
      <ScrollView>
        {
          typeof measurementData !== "undefined"
            ? measurementData.map((l, i) => displayNewDataOnly(l)
              ? <ListItem key={i} bottomDivider pad={10}>
                <ListItem.Content >
                  <ListItem.Title><Text style={{ fontSize: 18, fontWeight: "bold" }}>{l.parameter}</Text></ListItem.Title>
                  <ListItem.Subtitle style={{ padding: 5 }}><Icon
                    name="circle"
                    type="font-awesome"
                    color="rgb(135, 135, 135)"
                    size={10}
                  ></Icon>  <Text style={{ fontSize: 15 }}>{l.value} {l.unit}</Text></ListItem.Subtitle>
                  <ListItem.Subtitle style={{ padding: 5 }}><Icon
                    name="calendar"
                    type="font-awesome"
                    color="rgb(135, 135, 135)"
                    size={10}
                  ></Icon>  {Moment.unix(l.datetime).format('YYYY-MM-DD HH:mm')}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Content right style={{ flexDirection: "row", marginRight: -15 }}>
                  <Button
                    icon={
                      <Icon
                        name="trash"
                        type="font-awesome"
                        size={25}
                        color="#ffffff"
                      ></Icon>
                    }
                    buttonStyle={{ marginRight: 20, backgroundColor: "rgb(241, 137, 3)" }}
                    onPress={() => console.log('delete')}
                  ></Button>
                  <Button
                    icon={
                      <Icon
                        name="pencil"
                        type="font-awesome"
                        size={25}
                        color="#ffffff"
                      ></Icon>
                    }
                    buttonStyle={{ backgroundColor: "rgb(241, 137, 3)" }}
                    onPress={() => goToMeasurementFormScreen(l, i)}
                  ></Button>
                </ListItem.Content>
              </ListItem>
              : null)
            : null}
      </ScrollView>
    </View>
  )
}
