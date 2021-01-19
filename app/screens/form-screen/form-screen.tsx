/* eslint-disable @typescript-eslint/camelcase */
import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { Picker } from "@react-native-picker/picker"
import { Badge, Button, Header } from 'react-native-elements'
import { TextInput, View, ScrollView, Text, processColor } from 'react-native'
import { Formik } from 'formik'
import { styles } from "../form-screen/styles"
import { getWellByField, saveWellByField } from "../../models/well/well.store"
import { MeasurementType } from "../../models/well/well"
import { loadTerms } from "../../models/well/term.store"
import { MeasurementChart } from "../../components/measurement-chart/measurement-chart"
import { FormInput } from "../../components/form-input/form-input"
import { styles as mapStyles } from "../../screens/map-screen/styles"
import { save } from "../../utils/storage"

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const FormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const { route, navigation } = props
  const [wellData, setWellData] = useState({} as any)
  const [updatedWellData, setUpdatedWellData] = useState({} as any)
  const [updated, setUpdated] = useState(false)
  const [terms, setTerms] = useState({
    organisation: []
  } as any)

  const goToMapScreen = React.useMemo(() => () => props.navigation.pop(), [
    props.navigation,
  ])

  const loadWellData = async (measurementType?, selectedParameter?, selectedUnit?) => {
    const _wellData = await getWellByField("pk", route.params.wellPk)
    setWellData(_wellData)
    setUpdatedWellData(Object.assign({}, _wellData))
    const _terms = await loadTerms()
    setTerms(_terms)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refresh = async (measurementType, selectedParameter, selectedUnit) => {
    loadWellData(measurementType, selectedParameter, selectedUnit)
  }

  const goToMeasurementFormScreen = React.useMemo(() => (measurementType, selectedParameter?, selectedUnit?) => props.navigation.navigate("measurementForm", {
    wellId: wellData.pk || '',
    measurementType: measurementType,
    selectedParameter: selectedParameter,
    selectedUnit: selectedUnit,
    onGoBack: (parameter, unit) => refresh(measurementType, parameter, unit)
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

  const pickerForm = (term) => {
    return <Picker
      selectedValue={ '' }
      style={ styles.PICKER_INPUT_STYLE }
      onValueChange={(itemValue, itemIndex) => {
      }}>
      {
        (typeof terms[term] !== "undefined")
          ? terms[term].map((value, index) => {
            const _key = Object.keys(value)[0]
            const _name = value[_key]
            return <Picker.Item key={ _key } label={ _name } value={ _name } />})
          : <Picker.Item key={ "" } label={ "" } value={ "" } />
      }
    </Picker>
  }

  const formOnChange = (value, key) => {
    updatedWellData[key] = value
    setUpdated(true)
    setUpdatedWellData(updatedWellData)
  }

  const submitForm = async () => {
    updatedWellData.synced = false
    await saveWellByField('pk', updatedWellData.pk, updatedWellData)
    setUpdated(false)
    route.params.onGoBack()
    props.navigation.goBack()
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
        {!wellData.synced ? <Badge
          status="error"
          containerStyle={{ position: 'absolute', top: 10, left: 0 }}
          value="Unsynced"
        /> : <Badge
          status="success"
          containerStyle={{ position: 'absolute', top: 10, left: 0 }}
          value="Synced"
        />}
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
              <FormInput key="country" value={ wellData.country } title="Country"></FormInput>
              <FormInput key="address" value={ wellData.address } title="Address" multiline></FormInput>
            </View>
          )}
        </Formik>
        <View style={ styles.CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>GROUNDWATER LEVEL</Text>
          { typeof wellData.level_measurements !== "undefined"
            ? <MeasurementChart
              measurementData={wellData.level_measurements}
              measurementType={MeasurementType.LevelMeasurements}
              onAddClicked={ (selectedParameter, selectedUnit) => goToMeasurementFormScreen(MeasurementType.LevelMeasurements, selectedParameter, selectedUnit)}
            ></MeasurementChart> : <View></View>
          }
        </View>
        <View style={ styles.CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>GROUNDWATER QUALITY</Text>
          { typeof wellData.quality_measurements !== "undefined"
            ? <MeasurementChart
              measurementData={wellData.quality_measurements}
              measurementType={MeasurementType.QualityMeasurements}
              onAddClicked={ (selectedParameter, selectedUnit) => goToMeasurementFormScreen(MeasurementType.QualityMeasurements, selectedParameter, selectedUnit)}
            ></MeasurementChart> : <View></View>
          }
        </View>
        <View style={ styles.CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>ABSTRACTION / DISCHARGE</Text>
          { typeof wellData.yield_measurements !== "undefined"
            ? <MeasurementChart
              measurementData={wellData.yield_measurements}
              measurementType={MeasurementType.YieldMeasurements}
              onAddClicked={ (selectedParameter, selectedUnit) => goToMeasurementFormScreen(MeasurementType.YieldMeasurements, selectedParameter, selectedUnit)}
            ></MeasurementChart> : <View></View>
          }
        </View>
        <View style={{ height: 100 }}></View>

      </ScrollView>
    </View>
  )
}
