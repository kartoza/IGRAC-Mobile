import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { TextInput, View, ScrollView, Text, processColor } from 'react-native'
import { Formik } from 'formik'
import { LineChart } from 'react-native-charts-wrapper'
import { Header } from "react-native-elements"
import { load } from "../../utils/storage"
import { styles } from "../form-screen/styles"


export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const FormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const { route, navigation } = props
  const [wellData, setWellData] = useState({})
  const [glmLabels, setGlmLabes] = useState([]) // Groundwater Level Measurement labels for chart
  const [glmData, setGlmData] = useState([]) // Groundwater Level Measurement data for chart

  const goToMapScreen = React.useMemo(() => () => props.navigation.pop(), [
    props.navigation,
  ])

  useEffect(() => {
    ;(async () => {
      const wells = await load('well')
      let _wellData = null
      const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ]
      if (wells) {
        wells.forEach((data) => {
          if (data.id === route.params.wellName) {
            setWellData(data)
            _wellData = data
          }
        })
      }
      if (_wellData) {
        const _glmLabels = []
        const _glmData = []
        _wellData.lm.reverse().forEach(element => {
          const dateTime = new Date(element.dt * 1000)
          if (!glmLabels.includes(dateTime)) {
            _glmLabels.push(dateTime.getDate() + ' ' + monthShortNames[dateTime.getMonth()])
            _glmData.push({
              y: parseFloat(element.v)
            })
          }
        })
        setGlmLabes(_glmLabels.slice(0, 8))
        setGlmData(_glmData.slice(0, 8))
      }
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
              <Text style={styles.LABEL}>Status</Text>
              <TextInput
                onChangeText={handleChange('status')}
                onBlur={handleBlur('status')}
                value={wellData.st}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={styles.LABEL}>Feature type</Text>
              <TextInput
                onChangeText={handleChange('feature_type')}
                onBlur={handleBlur('feature_type')}
                value={wellData.ft}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={ styles.LABEL }>Purpose</Text>
              <TextInput
                onChangeText={handleChange('purpose')}
                onBlur={handleBlur('purpose')}
                value={wellData.p}
                style={ styles.TEXT_INPUT_STYLE }
              />
              <Text style={styles.LABEL}>Description</Text>
              <TextInput
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                value={wellData.dsc}
                multiline
                style={ styles.TEXT_INPUT_STYLE }
              />
            </View>
          )}
        </Formik>
        <View style={ styles.CHART_CONTAINER }>
          <Text style={ styles.CHART_LABEL }>Groundwater Level Measurement</Text>
          <LineChart style={styles.chart}
            data={{
              dataSets: [{
                label: "Groundwater Level",
                values: glmData,
                config: {
                  color: processColor("teal")
                }
              }]
            }}
            xAxis={{
              valueFormatter: glmLabels,
            }}
          />
        </View>
      </ScrollView>
    </View>
  )
}
