import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { Picker } from "@react-native-picker/picker"
import { Button, Header } from 'react-native-elements'
import { TextInput, View, ScrollView, Text, processColor } from 'react-native'
import { Formik } from 'formik'
import { LineChart } from 'react-native-charts-wrapper'
import { styles } from "../form-screen/styles"
import { getWellByField, loadWells } from "../../models/well/well.store"
import { MeasurementType } from "../../models/well/well"
import { loadTerms } from "../../models/well/term.store"
import { metersToFeet } from "../../utils/convert"
import { MeasurementChart } from "../../components/measurement-chart/measurement-chart"

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const FormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const { route, navigation } = props
  const [wellData, setWellData] = useState({} as any)

  const goToMapScreen = React.useMemo(() => () => props.navigation.pop(), [
    props.navigation,
  ])

  const loadWellData = async (measurementType?, selectedParameter?, selectedUnit?) => {
    const _wellData = await getWellByField("id", route.params.wellName)
    setWellData(_wellData)
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
