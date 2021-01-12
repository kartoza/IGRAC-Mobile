import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { Button, Header } from 'react-native-elements'
import { TextInput, View, ScrollView, Text, processColor } from 'react-native'
import { Formik } from 'formik'
import { LineChart } from 'react-native-charts-wrapper'
import { styles } from "../form-screen/styles"
import { getWellByField, loadWells } from "../../models/well/well.store"

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const FormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const { route, navigation } = props
  const [wellData, setWellData] = useState({} as any)
  const [glmCharts, setGlmCharts] = useState({}) // Groundwater Level Measurement charts
  const [gqCharts, setGqCharts] = useState({}) // Groundwater Quality charts
  const [gyCharts, setGyCharts] = useState({}) // Yield Measurement charts

  const goToMapScreen = React.useMemo(() => () => props.navigation.pop(), [
    props.navigation,
  ])

  const loadWellData = async () => {
    const _wellData = await getWellByField("id", route.params.wellName)
    setWellData(_wellData)
    const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
    if (_wellData) {
      const _chartData = {
        levelMeasurements: {}, // Groundwater Level Measurement charts
        qualityMeasurements: {}, // Groundwater Quality charts
        yieldMeasurements: {} // Yield Measurement charts
      }
      const wellMeasurementsData = _wellData.allMeasurements()
      for (const measurement in wellMeasurementsData) {
        wellMeasurementsData[measurement].sort((a, b) => (a.datetime < b.datetime ? -1 : 1))
        wellMeasurementsData[measurement].forEach(element => {
          const dateTime = new Date(element.datetime * 1000)
          if (!_chartData[measurement][element.parameter]) {
            _chartData[measurement][element.parameter] = {
              data: [],
              labels: [],
              datetime: []
            }
          }
          _chartData[measurement][element.parameter].data.push({ y: parseFloat(element.value) })
          _chartData[measurement][element.parameter].labels.push(dateTime.getDate() + ' ' + monthShortNames[dateTime.getMonth()])
          _chartData[measurement][element.parameter].datetime.push(dateTime)
        })
      }
      setGlmCharts(_chartData.levelMeasurements)
      setGqCharts(_chartData.qualityMeasurements)
      setGyCharts(_chartData.yieldMeasurements)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refresh = async () => {
    loadWellData()
  }

  const goToMeasurementFormScreen = React.useMemo(() => () => props.navigation.navigate("measurementForm", {
    wellId: wellData.pk || '',
    onGoBack: () => refresh()
  }), [
    props.navigation,
    wellData,
    refresh
  ])

  useEffect(() => {
    ;(async () => {
      await loadWellData()
    })()
  }, [])

  return (
    <View>
      <Header
        placement="center"
        leftComponent={{ icon: "chevron-left", size: 30, color: "#fff", onPress: () => goToMapScreen() }}
        centerComponent={{ text: "View Record", style: { fontSize: 18, color: "#fff", fontWeight: "bold" } }}
        containerStyle={ styles.HEADER_CONTAINER }
      />
      <ScrollView style = { styles.CONTAINER }>
        <Text style={ styles.FORM_HEADER }>GENERAL INFORMATION</Text>
        <Text style={ styles.FORM_SUB_HEADER }>Identification</Text>
        <Formik
          initialValues={{ original_id: route.params.wellName, status: '-', feature_type: '-', purpose: '-', description: '-' }}
          onSubmit={values => console.log(values)}
        >
          {({ handleChange, handleBlur, handleSubmit, values }) => (
            <View>
              <Text style={ styles.LABEL }>Original ID</Text>
              <TextInput
                onChangeText={handleChange('original_id')}
                onBlur={handleBlur('original_id')}
                value={wellData.id}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={ styles.LABEL }>Organisation</Text>
              <TextInput
                onChangeText={handleChange('organisation')}
                onBlur={handleBlur('organisation')}
                value={wellData.organisation}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={ styles.LABEL }>Name</Text>
              <TextInput
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={wellData.name}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={styles.LABEL}>Status</Text>
              <TextInput
                onChangeText={handleChange('status')}
                onBlur={handleBlur('status')}
                value={wellData.status}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={styles.LABEL}>Feature type</Text>
              <TextInput
                onChangeText={handleChange('feature_type')}
                onBlur={handleBlur('feature_type')}
                value={wellData.featureType}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={ styles.LABEL }>Purpose</Text>
              <TextInput
                onChangeText={handleChange('purpose')}
                onBlur={handleBlur('purpose')}
                value={wellData.purpose}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={styles.LABEL}>Description</Text>
              <TextInput
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                value={wellData.description}
                multiline
                style={ styles.TEXT_INPUT_STYLE }
              />
            </View>
          )}
        </Formik>
        <View style={ Object.keys(glmCharts).length > 0 ? (styles.CHART_CONTAINER, { height: Object.keys(glmCharts).length * 250 }) : styles.EMPTY_CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>GROUNDWATER LEVEL</Text>
          {
            Object.keys(glmCharts).map(r => <LineChart
              key={ r }
              style={styles.chart}
              data={{
                dataSets: [{
                  label: r,
                  values: glmCharts[r].data,
                  config: {
                    color: processColor("red")
                  }
                }]
              }}
              xAxis={{
                valueFormatter: glmCharts[r].labels,
              }}
            />)
          }
          <Button containerStyle={{ marginTop: 5 }} title="Add measurement" onPress={ () => { goToMeasurementFormScreen() }}></Button>
        </View>
        <View style={ Object.keys(gqCharts).length > 0 ? (styles.CHART_CONTAINER, { height: Object.keys(gqCharts).length * 250 }) : styles.EMPTY_CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>GROUNDWATER QUALITY</Text>
          {
            Object.keys(gqCharts).map(r => <LineChart
              key={ r }
              style={styles.chart}
              data={{
                dataSets: [{
                  label: r,
                  values: gqCharts[r].data,
                  config: {
                    color: processColor("red")
                  }
                }]
              }}
              xAxis={{
                valueFormatter: gqCharts[r].labels,
              }}
            />)
          }
        </View>
        <View style={ Object.keys(gyCharts).length > 0 ? (styles.CHART_CONTAINER, { height: Object.keys(gyCharts).length * 250 }) : styles.EMPTY_CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>ABSTRACTION / DISCHARGE</Text>
          {
            Object.keys(gyCharts).map(r => <LineChart
              key={ r }
              style={styles.chart}
              data={{
                dataSets: [{
                  label: r,
                  values: gyCharts[r].data,
                  config: {
                    color: processColor("red")
                  }
                }]
              }}
              xAxis={{
                valueFormatter: gyCharts[r].labels,
              }}
            />)
          }
        </View>
        <View style={{ height: 100 }}></View>
      </ScrollView>
    </View>
  )
}
