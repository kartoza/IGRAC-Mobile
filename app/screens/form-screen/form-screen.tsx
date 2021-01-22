/* eslint-disable @typescript-eslint/camelcase */
import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { Button, Header } from 'react-native-elements'
import { View, ScrollView, Text, Alert } from 'react-native'
import { Formik } from 'formik'
import { styles } from "../form-screen/styles"
import { getWellByField, saveWellByField } from "../../models/well/well.store"
import Well, { MeasurementType } from "../../models/well/well"
import { loadTerms } from "../../models/well/term.store"
import { MeasurementChart } from "../../components/measurement-chart/measurement-chart"
import { FormInput } from "../../components/form-input/form-input"
import { styles as mapStyles } from "../../screens/map-screen/styles"
import { WellStatusBadge } from "../../components/well/well-status-badge"

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const FormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const { route, navigation } = props
  const [wellData, setWellData] = useState({} as any)
  const [measurementData, setMeasurementData] = useState({} as any)
  const [updatedWellData, setUpdatedWellData] = useState({} as Well)
  const [updated, setUpdated] = useState(false)
  const [terms, setTerms] = useState({
    organisation: []
  } as any)

  const goToMapScreen = React.useMemo(() => () => props.navigation.pop(), [
    props.navigation,
  ])

  const loadWellData = async () => {
    const _wellData = await getWellByField("pk", route.params.wellPk)
    setWellData(_wellData)
    setMeasurementData({
      level_measurements: _wellData.level_measurements,
      yield_measurements: _wellData.yield_measurements,
      quality_measurements: _wellData.quality_measurements
    })
    setUpdatedWellData(new Well(Object.assign({}, _wellData)))
    const _terms = await loadTerms()
    setTerms(_terms)
  }

  const goToMeasurementFormScreen = React.useMemo(() => (measurementType, selectedParameter?, selectedUnit?) => props.navigation.navigate("measurementForm", {
    wellId: wellData.pk || '',
    measurementType: measurementType,
    selectedParameter: selectedParameter,
    selectedUnit: selectedUnit,
    onGoBack: async (_measurementData) => {
      setUpdated(true)
      await updatedWellData.addMeasurementData(measurementType, _measurementData)
      await setMeasurementData({
        level_measurements: [],
        yield_measurements: [],
        quality_measurements: []
      })
      await setMeasurementData({ ...measurementData, [measurementType]: updatedWellData[measurementType] })
      await setUpdatedWellData({ ...updatedWellData })
    }
  }), [
    props.navigation,
    wellData,
    updatedWellData,
    measurementData
  ])

  useEffect(() => {
    ;(async () => {
      await loadWellData()
    })()
  }, [])

  const formOnChange = async (value, key) => {
    updatedWellData[key] = value
    await setUpdated(true)
    await setUpdatedWellData({ ...updatedWellData, [key]: value })
  }

  const checkRequiredFields = () => {
    return (
      updatedWellData.id &&
      updatedWellData.name &&
      updatedWellData.longitude &&
      updatedWellData.latitude
    )
  }

  const submitForm = async () => {
    const checked = checkRequiredFields()
    if (checked) {
      updatedWellData.synced = false
      await saveWellByField('pk', updatedWellData.pk, updatedWellData)
      setUpdated(false)
      if (route.params.onBackToMap) {
        route.params.onBackToMap()
      }
      props.navigation.goBack()
    } else {
      Alert.alert(
        "Error",
        "Missing required value"
      )
    }
  }

  return (
    <View style={{ height: "100%" }}>
      <Header
        placement="center"
        leftComponent={{ icon: "chevron-left", size: 30, color: "#fff", onPress: () => goToMapScreen() }}
        centerComponent={{ text: "View Record", style: { fontSize: 18, color: "#fff", fontWeight: "bold" } }}
        containerStyle={ styles.HEADER_CONTAINER }
      />
      { updated ? <View style={[mapStyles.BOTTOM_VIEW, { zIndex: 99 } ]}>
        <Button
          title="Submit"
          buttonStyle={{ width: "100%", backgroundColor: "rgb(241, 137, 3)"}}
          onPress={submitForm}
        />
      </View> : <View></View>}
      <ScrollView style = { styles.CONTAINER }>
        <WellStatusBadge well={wellData}></WellStatusBadge>
        <Text style={ styles.LAST_UPDATE_TEXT }>Last update : { wellData.last_update }</Text>
        <Text style={ styles.FORM_HEADER }>GENERAL INFORMATION</Text>
        <Formik
          initialValues={{ original_id: '-', status: '-', feature_type: '-', purpose: '-', description: '-' }}
          onSubmit={values => console.log(values)}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <View>
              <Text style={ styles.FORM_SUB_HEADER }>Identification</Text>
              <FormInput key="organisation" value={ wellData.organisation } required options={ terms.organisation } title="Organisation"></FormInput>
              <FormInput
                key="original_id"
                value={ wellData.id }
                title="Original ID"
                required
                onChange={ (val) => formOnChange(val, "id") }></FormInput>
              <FormInput key="name" required value={ wellData.name } title="Name" onChange={ val => formOnChange(val, "name")}></FormInput>
              <FormInput key="feature_type" required value={ wellData.feature_type } options={ terms.termfeaturetype } title="Feature type" onChange={ val => formOnChange(val, "feature_type")}></FormInput>
              <FormInput key="purpose" value={ wellData.purpose } options={ terms.termwellpurpose } title="Purpose" onChange={ val => formOnChange(val, "purpose")}></FormInput>
              <FormInput key="status" value={ wellData.status } options={ terms.termwellstatus } title="Status" onChange={ val => formOnChange(val, "status")}></FormInput>
              <FormInput key="description" value={ wellData.description } title="Description" multiline onChange={ val => formOnChange(val, "description")}></FormInput>

              <Text style={ styles.FORM_SUB_HEADER }>Location</Text>
              <FormInput key="latitude" value={ wellData.latitude } numeric required title="Latitude" onChange={ val => formOnChange(val, "latitude")}></FormInput>
              <FormInput key="longitude" value={ wellData.longitude } numeric required title="Longitude" onChange={ val => formOnChange(val, "longitude")}></FormInput>
              <FormInput key="ground_surface_elevation" value={ wellData.ground_surface_elevation } title="Ground surface elevation" units={ terms.unit_length } numeric onChange={ val => formOnChange(val, "ground_surface_elevation")}></FormInput>
              <FormInput key="top_borehole_elevation" value={ wellData.top_borehole_elevation } title="Top borehole elevation" units={ terms.unit_length } numeric onChange={ val => formOnChange(val, "top_borehole_elevation")}></FormInput>
              <FormInput key="country" value={ wellData.country } title="Country" onChange={ val => formOnChange(val, "country")}></FormInput>
              <FormInput key="address" value={ wellData.address } title="Address" multiline onChange={ val => formOnChange(val, "address")}></FormInput>
            </View>
          )}
        </Formik>
        <View style={ styles.CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>GROUNDWATER LEVEL</Text>
          { typeof wellData.level_measurements !== "undefined"
            ? <MeasurementChart
              measurementData={measurementData.level_measurements}
              measurementType={MeasurementType.LevelMeasurements}
              onAddClicked={ (selectedParameter, selectedUnit) => goToMeasurementFormScreen(MeasurementType.LevelMeasurements, selectedParameter, selectedUnit)}
            ></MeasurementChart> : null
          }
        </View>
        <View style={ styles.CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>GROUNDWATER QUALITY</Text>
          { typeof wellData.quality_measurements !== "undefined"
            ? <MeasurementChart
              measurementData={measurementData.quality_measurements}
              measurementType={MeasurementType.QualityMeasurements}
              onAddClicked={ (selectedParameter, selectedUnit) => goToMeasurementFormScreen(MeasurementType.QualityMeasurements, selectedParameter, selectedUnit)}
            ></MeasurementChart> : null
          }
        </View>
        <View style={ styles.CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>ABSTRACTION / DISCHARGE</Text>
          { typeof wellData.yield_measurements !== "undefined"
            ? <MeasurementChart
              measurementData={measurementData.yield_measurements}
              measurementType={MeasurementType.YieldMeasurements}
              onAddClicked={ (selectedParameter, selectedUnit) => goToMeasurementFormScreen(MeasurementType.YieldMeasurements, selectedParameter, selectedUnit)}
            ></MeasurementChart> : null
          }
        </View>
        <View style={{ height: 100 }}></View>

      </ScrollView>
    </View>
  )
}
