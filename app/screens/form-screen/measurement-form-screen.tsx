/* eslint-disable @typescript-eslint/camelcase */
import React, { useState, useEffect } from "react"
import Moment from 'moment'
import { Picker } from "@react-native-picker/picker"
import { Button, Header } from 'react-native-elements'
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import DateTimePicker from '@react-native-community/datetimepicker'
import { ParamListBase } from "@react-navigation/native"
import { Formik } from 'formik'
import { TextInput, View, ScrollView, Text, Platform, Alert, LogBox } from 'react-native'
import { styles } from "../form-screen/styles"
import { TouchableWithoutFeedback } from "react-native-gesture-handler"
import { delay } from "../../utils/delay"
import { feetToMeters } from "../../utils/convert"
import { loadTerms } from "../../models/well/term.store"
import { updateWellMeasurement } from "../../models/well/well.store"
import { MeasurementType } from "../../models/well/well"

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

export interface MeasurementFormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const MeasurementFormScreen: React.FunctionComponent<MeasurementFormScreenProps> = props => {
  const { route } = props
  const [date, setDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [wellId, setWellId] = useState(route.params.wellId || '')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mode, setMode] = useState('date')
  const [levelMeasurementParameters, setLevelMeasurementParameters] = useState([])
  const [levelMeasurementUnits, setLevelMeasurementUnits] = useState({})
  const [selectedLevelMeasurement, setSelectedLevelMeasurement] = useState('')
  const [units, setUnits] = useState([])
  const [selectedUnit, setSelectedUnit] = useState('')
  const [headerLabel, setHeaderLabel] = useState('')

  const openDatePicker = (mode = 'date') => {
    setShowDatePicker(true)
    setMode(mode)
  }

  const onChange = (event, selectedDate, setFieldValue) => {
    const currentDate = selectedDate || date
    setShowDatePicker(Platform.OS === 'ios')
    setDate(currentDate)
    if (mode === 'date') {
      openDatePicker('time')
    } else {
      setFieldValue('datetime', Moment(currentDate).unix())
    }
  }

  const submitForm = async (data) => {
    if (loading) return
    if ('value' in data && data.value) {
      setLoading(true)
      let dataValue = data.value
      if (data.unit === 'ft') {
        dataValue = feetToMeters(data.value)
      }
      const measurementData = {
        id: "",
        datetime: data.datetime || Moment(date).unix(),
        methodology: data.methodology || "",
        parameter: data.parameter,
        value: dataValue,
        unit: data.unit || ""
      }
      await updateWellMeasurement(
        wellId,
        measurementData,
        route.params.measurementType)
      await delay(500).then(() => console.log('Processed'))
      setLoading(false)
      route.params.onGoBack()
      props.navigation.goBack()
    } else {
      Alert.alert(
        "Error",
        "Missing required value"
      )
    }
  }

  useEffect(() => {
    ;(async () => {
      const terms = await loadTerms()
      let measurementTerm = ""
      let measurementTitle = ""
      if (route.params.measurementType === MeasurementType.LevelMeasurements) {
        measurementTerm = "Level Measurement"
        measurementTitle = "Groundwater Level"
      } else if (route.params.measurementType === MeasurementType.YieldMeasurements) {
        measurementTerm = "Yield Measurement"
        measurementTitle = "Abstraction / Discharge"
      } else if (route.params.measurementType === MeasurementType.QualityMeasurements) {
        measurementTerm = "Quality Measurement"
        measurementTitle = "Groundwater Quality"
      }
      setHeaderLabel(measurementTitle)
      const measurementParams = terms.measurement_parameters[measurementTerm]
      setLevelMeasurementParameters(Object.keys(measurementParams))
      setSelectedLevelMeasurement(levelMeasurementParameters[0])
      setLevelMeasurementUnits(measurementParams)
      setUnits(measurementParams[Object.keys(measurementParams)[0]])
      setSelectedUnit(measurementParams[Object.keys(measurementParams)[0]][0])
    })()
  }, [])

  return (
    <View>
      <Header
        placement="center"
        leftComponent={{ icon: "chevron-left", size: 30, color: "#fff", onPress: () => props.navigation.goBack() }}
        centerComponent={{ text: headerLabel, style: { fontSize: 18, color: "#fff", fontWeight: "bold" } }}
        containerStyle={ styles.HEADER_CONTAINER }
      />
      <ScrollView style = { styles.CONTAINER }>
        <Text style={ styles.FORM_HEADER }>ADD MEASUREMENT</Text>
        <Formik
          initialValues={{}}
          onSubmit={submitForm}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <View>
              <Text style={ styles.LABEL }>Date and Time</Text>
              <TouchableWithoutFeedback onPress={ () => openDatePicker('date') }>
                <View pointerEvents="none">
                  <TextInput
                    value={ Moment(date).format('YYYY-MM-DD HH:mm') }
                    style={ styles.TEXT_INPUT_STYLE }
                  />
                </View>
              </TouchableWithoutFeedback>
              <Text style={ styles.LABEL }>Parameter</Text>
              <View style={ styles.TEXT_INPUT_STYLE }>
                <Picker
                  selectedValue={ selectedLevelMeasurement }
                  style={ styles.PICKER_INPUT_STYLE }
                  onValueChange={(itemValue, itemIndex) => {
                    setSelectedLevelMeasurement(itemValue + '')
                    setUnits(levelMeasurementUnits[itemValue])
                    setSelectedUnit(levelMeasurementUnits[itemValue][0])
                    setFieldValue('parameter', itemValue)
                  }
                  }>
                  {
                    levelMeasurementParameters.map(r => <Picker.Item key={ r } label={ r } value={ r } />)
                  }
                </Picker>
              </View>
              <Text style={ styles.LABEL }>Methodology</Text>
              <TextInput
                onChangeText={ handleChange('methodology') }
                onBlur={ handleBlur('methodology') }
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={ styles.REQUIRED_LABEL }>Value*</Text>
              <View style={ styles.MULTIPLE_INPUT_STYLE }>
                <TextInput onChangeText={ handleChange('value') } keyboardType='numeric' style={{ width: "60%" }}/>
                <Picker
                  selectedValue={ selectedUnit }
                  onValueChange={(itemValue, itemIndex) => {
                    setSelectedUnit(itemValue + '')
                    setFieldValue('unit', itemValue)
                  }}
                  style={{ width: "40%" }}>
                  {
                    units.map(r => <Picker.Item key={ r } label={ r } value={ r } />)
                  }
                </Picker>
              </View>
              <Button loading={loading} containerStyle={ styles.SUBMIT_BUTTON } onPress={handleSubmit} title="Submit" />
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode={mode}
                  is24Hour={true}
                  display="default"
                  onChange={ (e, selectedDate) => {
                    onChange(e, selectedDate, setFieldValue)
                  }}
                />
              )}
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  )
}
