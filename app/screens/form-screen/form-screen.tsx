/* eslint-disable @typescript-eslint/camelcase */
import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { Button, Header } from 'react-native-elements'
import { View, ScrollView, Text, Alert, ActivityIndicator } from 'react-native'
import { Formik } from 'formik'
import { styles } from "../form-screen/styles"
import { getWellByField, saveWellByField } from "../../models/well/well.store"
import Well, { MeasurementType } from "../../models/well/well"
import { loadTerms } from "../../models/well/term.store"
import { MeasurementChart } from "../../components/measurement-chart/measurement-chart"
import { FormInput } from "../../components/form-input/form-input"
import { styles as mapStyles } from "../../screens/map-screen/styles"
import { WellStatusBadge } from "../../components/well/well-status-badge"

const countryList = require("country-list")

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const FormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const { route, navigation } = props
  const [wellData, setWellData] = useState({} as any)
  const [measurementData, setMeasurementData] = useState({} as any)
  const [updatedWellData, setUpdatedWellData] = useState({} as Well)
  const [updated, setUpdated] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [terms, setTerms] = useState({
    organisation: [],
    units: {}
  } as any)

  const goToMapScreen = React.useMemo(() => () => props.navigation.pop(), [
    props.navigation,
  ])

  const loadWellData = async () => {
    const _wellData = await getWellByField("pk", route.params.wellPk)
    if (!_wellData) {
      goToMapScreen()
    }
    setWellData(_wellData)
    setMeasurementData({
      level_measurements: _wellData.level_measurements,
      yield_measurements: _wellData.yield_measurements,
      quality_measurements: _wellData.quality_measurements
    })
    setUpdatedWellData(new Well(Object.assign({}, _wellData)))
    const _terms = await loadTerms()
    setTerms(_terms)
    setLoading(false)
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
      if (typeof route.params.editMode !== "undefined") {
        setEditMode(route.params.editMode)
      }
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

  function yearValidation(year) {
    if (year !== 0) {
      if (("" + year).length !== 4) {
        return "Year is not proper. Please check"
      }
      const currentYear = new Date().getFullYear()
      if ((year < 1920) || (year > currentYear)) {
        return "Year should be in range 1920 to current year"
      }
      return "ok"
    }
  }

  const validateForm = (): any => {
    const requiredFieldsOk = checkRequiredFields()
    if (!requiredFieldsOk) {
      return { kind: "bad", errorMessage: "Missing required value" }
    }
    if (updatedWellData.construction_year) {
      const validation = yearValidation(updatedWellData.construction_year)
      if (validation !== "ok") {
        return { kind: "bad", errorMessage: validation }
      }
    }
    return { kind: "ok", errorMessage: "" }
  }

  const submitForm = async () => {
    const validated = validateForm()
    if (validated.kind === "ok") {
      updatedWellData.synced = false
      await saveWellByField('pk', updatedWellData.pk, updatedWellData)
      setUpdated(false)
      if (route.params.onBackToMap) {
        route.params.onBackToMap()
      }
      props.navigation.navigate("map")
    } else {
      Alert.alert(
        "Error",
        validated.errorMessage
      )
    }
  }

  const editRecord = React.useMemo(() => () => props.navigation.push("form", {
    wellPk: route.params.wellPk,
    editMode: true,
    onBackToMap: () => route.params.onBackToMap()
  }), [
    props.navigation,
    route.params
  ])

  return (
    <View style={{ height: "100%" }}>
      <Header
        placement="center"
        leftComponent={{ icon: "chevron-left", size: 30, color: "#fff", onPress: () => goToMapScreen() }}
        centerComponent={{ text: editMode ? "Edit Record" : "View Record", style: { fontSize: 18, color: "#fff", fontWeight: "bold" } }}
        containerStyle={ styles.HEADER_CONTAINER }
        rightComponent={ wellData.editable && !editMode ? { icon: "mode-edit", size: 20, color: "#fff", onPress: () => editRecord() } : {}}
      />
      { updated && terms.units ? <View style={[mapStyles.BOTTOM_VIEW, { zIndex: 99 } ]}>
        <Button
          title="Submit"
          buttonStyle={{ width: "100%", backgroundColor: "rgb(241, 137, 3)"}}
          onPress={submitForm}
        />
      </View> : <View></View>}
      { loading ? <View style={styles.LOADING}>
        <ActivityIndicator animating color="rgb(241, 137, 3)" size='large' />
      </View> : null }
      <ScrollView style = { styles.CONTAINER }>
        <WellStatusBadge well={wellData}></WellStatusBadge>
        { wellData.last_update ? <Text style={ styles.LAST_UPDATE_TEXT }>Last update : { wellData.last_update }</Text> : null }
        <Text style={ styles.FORM_HEADER }>GENERAL INFORMATION</Text>
        <Formik
          initialValues={{ original_id: '-', status: '-', feature_type: '-', purpose: '-', description: '-' }}
          onSubmit={values => console.log(values)}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <View>
              <Text style={ styles.FORM_SUB_HEADER }>Identification</Text>
              <FormInput editable={ editMode } key="organisation" value={ wellData.organisation } required options={ terms.organisation } onChange={ val => formOnChange(val, "organisation")} title="Organisation"></FormInput>
              <FormInput
                editable={ editMode }
                key="original_id"
                value={ wellData.id }
                title="Original ID"
                required
                onChange={ (val) => formOnChange(val, "id") }></FormInput>
              <FormInput editable={ editMode } key="name" required value={ wellData.name } title="Name" onChange={ val => formOnChange(val, "name")}></FormInput>
              <FormInput editable={ editMode } key="feature_type" required value={ wellData.feature_type } options={ terms.termfeaturetype } title="Feature type" onChange={ val => formOnChange(val, "feature_type")}></FormInput>
              <FormInput editable={ editMode } key="purpose" value={ wellData.purpose } options={ terms.termwellpurpose } title="Purpose" onChange={ val => formOnChange(val, "purpose")}></FormInput>
              <FormInput editable={ editMode } key="status" value={ wellData.status } options={ terms.termwellstatus } title="Status" onChange={ val => formOnChange(val, "status")}></FormInput>
              <FormInput editable={ editMode } key="description" value={ wellData.description } title="Description" multiline onChange={ val => formOnChange(val, "description")}></FormInput>

              <Text style={ styles.FORM_SUB_HEADER }>Location</Text>
              <FormInput editable={ editMode } key="latitude" value={ wellData.latitude } numeric required title="Latitude" onChange={ val => formOnChange(parseFloat(val), "latitude")}></FormInput>
              <FormInput editable={ editMode } key="longitude" value={ wellData.longitude } numeric required title="Longitude" onChange={ val => formOnChange(parseFloat(val), "longitude")}></FormInput>
              <FormInput editable={ editMode } key="ground_surface_elevation" value={ wellData.ground_surface_elevation } title="Ground surface elevation" units={ terms.units.length } numeric onChange={ val => formOnChange(val, "ground_surface_elevation")}></FormInput>
              <FormInput editable={ editMode } key="top_borehole_elevation" value={ wellData.top_borehole_elevation } title="Top borehole elevation" units={ terms.units.length } numeric onChange={ val => formOnChange(val, "top_borehole_elevation")}></FormInput>
              <FormInput editable={ editMode } key="country" value={ wellData.country } title="Country" options={ countryList.getNames() } onChange={ val => formOnChange(val, "country")}></FormInput>
              <FormInput editable={ editMode } key="address" value={ wellData.address } title="Address" multiline onChange={ val => formOnChange(val, "address")}></FormInput>

              <Text style={ styles.FORM_HEADER }>DRILLING AND CONSTRUCTION</Text>
              <Text style={ styles.FORM_SUB_HEADER }>For wells and boreholes</Text>
              <FormInput editable={ editMode } key="total_depth" value={ wellData.total_depth } title="Total depth" units={ terms.units.length } numeric onChange={ val => formOnChange(val, "total_depth")}></FormInput>
              <FormInput editable={ editMode } key="total_depth_reference_elevation" value={ wellData.total_depth_reference_elevation } options={ terms.termreferenceelevationtype } title="Total depth reference elevation" onChange={ val => formOnChange(val, "total_depth_reference_elevation")}></FormInput>
              <FormInput editable={ editMode } key="construction_year" value={ wellData.construction_year } title="Construction year" numeric onChange={ val => formOnChange(val, "construction_year")}></FormInput>
              <FormInput editable={ editMode } key="excavation_method" value={ wellData.excavation_method } title="Excavation method" options={ terms.termdrillingmethod } onChange={ val => formOnChange(val, "excavation_method")}></FormInput>
              <FormInput editable={ editMode } key="contractor" value={ wellData.contractor } title="Contractor" onChange={ val => formOnChange(val, "contractor")}></FormInput>
              <FormInput editable={ editMode } key="successful" value={ wellData.successful } title="Successful" options={['Yes', 'No']} onChange={ val => formOnChange(val, "successful")}></FormInput>
              { updatedWellData.successful === "No" ? (
                <FormInput key="cause_of_failure" value={ wellData.cause_of_failure } title="Cause of failure" multiline onChange={ val => formOnChange(val, "cause_of_failure")}></FormInput>
              ) : null }

              <Text style={ styles.FORM_HEADER }>HYDROGEOLOGY</Text>
              <Text style={ styles.FORM_SUB_HEADER }>Aquifer</Text>
              <FormInput editable={ editMode } key="aquifer_name" value={ wellData.aquifer_name } title="Aquifer name" onChange={ val => formOnChange(val, "aquifer_name")}></FormInput>
              <FormInput editable={ editMode } key="aquifer_material" value={ wellData.aquifer_material } title="Aquifer material" onChange={ val => formOnChange(val, "aquifer_material")}></FormInput>
              <FormInput editable={ editMode } key="aquifer_type" value={ wellData.aquifer_type } title="Aquifer type" options={ terms.termaquifertype } onChange={ val => formOnChange(val, "aquifer_type")}></FormInput>
              <FormInput editable={ editMode } key="aquifer_thickness" value={ wellData.aquifer_thickness } title="Aquifer thickness" onChange={ val => formOnChange(val, "aquifer_thickness")}></FormInput>
              <FormInput editable={ editMode } key="confinement" value={ wellData.confinement } title="Confinement" options={ terms.termconfinement } onChange={ val => formOnChange(val, "confinement")}></FormInput>

              <Text style={ styles.FORM_SUB_HEADER }>Hydraulic properties</Text>
              <FormInput editable={ editMode } key="porosity"
                value={ wellData.porosity }
                title="Porosity"
                numeric
                unitValue={ wellData.porosity_unit }
                units={ terms.units.Percentage }
                onUnitChange={ val => formOnChange(val, "porosity_unit") }
                onChange={ val => formOnChange(val, "porosity")}></FormInput>
              <FormInput editable={ editMode } key="hydraulic_conductivity"
                value={ wellData.hydraulic_conductivity }
                unitValue={ wellData.hydraulic_conductivity_unit }
                numeric
                units={ terms.units[wellData.hydraulic_conductivity_unit_key] }
                onUnitChange={ val => formOnChange(val, "hydraulic_conductivity_unit")}
                title="Hydraulic conductivity"
                onChange={ val => formOnChange(val, "hydraulic_conductivity")}></FormInput>
              <FormInput editable={ editMode } key="transmissivity"
                value={ wellData.transmissivity }
                unitValue={ wellData.transmissivity_unit }
                numeric
                units={ terms.units[wellData.transmissivity_unit_key] }
                onUnitChange={ val => formOnChange(val, "transmissivity_unit") }
                title="Transmissivity"
                onChange={ val => formOnChange(val, "transmissivity")}></FormInput>
              <FormInput
                editable={ editMode }
                key="specific_storage"
                value={ wellData.specific_storage }
                unitValue={ wellData.specific_storage_unit }
                numeric
                units={ terms.units[wellData.specific_storage_unit_key] }
                onUnitChange={ val => formOnChange(val, "specific_storage_unit") }
                title="Specific storage"
                onChange={ val => formOnChange(val, "specific_storage")}></FormInput>
              <FormInput editable={ editMode } key="specific_yield" value={ wellData.specific_yield } title="Specific yield" onChange={ val => formOnChange(val, "specific_yield")}></FormInput>
              <FormInput editable={ editMode } key="specific_capacity"
                value={ wellData.specific_capacity }
                unitValue={ wellData.specific_capacity_unit }
                numeric
                units={ terms.units[wellData.specific_capacity_unit_key] }
                title="Specific capacity"
                onUnitChange={ val => formOnChange(val, "specific_capacity_unit") }
                onChange={ val => formOnChange(val, "specific_capacity")}></FormInput>
              <FormInput editable={ editMode } key="yield"
                value={ wellData.yield }
                unitValue={ wellData.yield_unit }
                title="Yield"
                numeric
                units={ terms.units[wellData.yield_unit_key] }
                onUnitChange={ val => formOnChange(val, "yield_unit") }
                onChange={ val => formOnChange(val, "yield")}></FormInput>
              <FormInput editable={ editMode } key="test_type" value={ wellData.test_type } title="Test type" onChange={ val => formOnChange(val, "test_type")}></FormInput>
            </View>
          )}
        </Formik>
        <View style={ styles.CHART_CONTAINER }>
          <Text style={ styles.FORM_HEADER }>GROUNDWATER LEVEL</Text>
          { typeof wellData.level_measurements !== "undefined"
            ? <MeasurementChart
              editable={ editMode }
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
              editable={ editMode }
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
              editable={ editMode }
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
