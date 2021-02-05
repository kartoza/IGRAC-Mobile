import { Picker } from '@react-native-picker/picker'
import React, { useEffect, useState } from 'react'
import { View, processColor, ViewStyle } from 'react-native'
import { LineChart } from 'react-native-charts-wrapper'
import { styles } from '../../screens/form-screen/styles'
import { Button } from 'react-native-elements'
import { MeasurementType } from '../../models/well/well'
import { metersToFeet } from '../../utils/convert'

const PICKER_CONTAINER_STYLE: ViewStyle = {
  borderWidth: 0,
  padding: 0,
  backgroundColor: "#FFF",
  borderBottomWidth: 1,
  borderBottomColor: "#EEE",
  borderRightWidth: 1,
  borderRightColor: "#EEE"
}

export interface MeasurementChartProps {
  measurementData: any[],
  onAddClicked?: any,
  onEditClicked?: any,
  measurementType: any,
  editable?: boolean,
  isUnsyncedDataExist?: boolean
}

export function MeasurementChart(props: MeasurementChartProps) {
  const [chartData, setChartData] = useState({})
  const [chartParameters, setChartParameters] = useState([])
  const [chartUnits, setChartUnits] = useState({})
  const [selectedParameter, setSelectedParameter] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const [editable, setEditable] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (typeof props.editable !== "undefined") {
        setEditable(props.editable)
      }
      const _chartData = {}
      const _allParameters = []
      const _allUnits = {}
      const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ]
      if (typeof props.measurementData === "undefined") {
        return
      }
      const measurementData = props.measurementData
      measurementData.sort((a, b) => (a.datetime < b.datetime ? -1 : 1))
      measurementData.forEach(element => {
        const dateTime = new Date(element.datetime * 1000)
        const parameter = `${element.parameter} (${element.unit})`
        if (!_chartData[parameter]) {
          _chartData[parameter] = {
            data: [],
            labels: [],
            datetime: []
          }
        }
        if (!_allParameters.includes(element.parameter)) {
          _allParameters.push(element.parameter)
        }
        if (!Object.keys(_allUnits).includes(element.parameter)) {
          _allUnits[element.parameter] = []
        }
        if (!_allUnits[element.parameter].includes(element.unit)) {
          _allUnits[element.parameter].push(element.unit)
        }

        // If measurement type is level measurement, add feet data
        if (props.measurementType === MeasurementType.LevelMeasurements) {
          const feetUnit = "ft"
          const feetParameter = `${element.parameter} (${feetUnit})`
          if (!_allUnits[element.parameter].includes(feetUnit)) {
            _allUnits[element.parameter].push(feetUnit)
          }
          if (!_chartData[feetParameter]) {
            _chartData[feetParameter] = {
              data: [],
              labels: [],
              datetime: []
            }
          }
          _chartData[feetParameter].data.push({ y: metersToFeet(parseFloat(element.value)) })
          _chartData[feetParameter].labels.push(dateTime.getDate() + ' ' + monthShortNames[dateTime.getMonth()])
          _chartData[feetParameter].datetime.push(dateTime)
        }

        _chartData[parameter].data.push({ y: parseFloat(element.value) })
        _chartData[parameter].labels.push(dateTime.getDate() + ' ' + monthShortNames[dateTime.getMonth()])
        _chartData[parameter].datetime.push(dateTime)
        if (selectedParameter === "") {
          setSelectedParameter(element.parameter)
        }
        if (selectedUnit === "") {
          setSelectedUnit(element.unit)
        }
      })
      setChartParameters(_allParameters)
      setChartUnits(_allUnits)
      setChartData(_chartData)
    })()
  }, [props.measurementData])

  return (
    <View style={ styles.chart }>
      <View style={ PICKER_CONTAINER_STYLE }>
        <Picker
          selectedValue={ selectedParameter }
          onValueChange={(itemValue, itemIndex) => {
            setSelectedParameter(itemValue + "")
            if (typeof chartUnits[itemValue] !== "undefined") {
              setSelectedUnit(chartUnits[itemValue][0])
            }
          }
          }>
          {
            chartParameters.map(r => <Picker.Item key={ r } label={ r } value={ r } />)
          }
        </Picker>
      </View>
      <View style={ PICKER_CONTAINER_STYLE }>
        <Picker
          selectedValue={ selectedUnit }
          onValueChange={(itemValue, itemIndex) => {
            setSelectedUnit(itemValue + "")
          }
          }>
          {
            Object.keys(chartUnits).length > 0 && typeof chartUnits[selectedParameter] !== 'undefined'
              ? chartUnits[selectedParameter].map(r => <Picker.Item key={ r } label={ r } value={ r } />)
              : <Picker.Item key="" label="" value=""></Picker.Item>
          }
        </Picker>
      </View>
      { Object.keys(chartData).length > 0 && typeof chartData[`${selectedParameter} (${selectedUnit})`] !== 'undefined' ? <LineChart
        key={ `${selectedParameter} (${selectedUnit})` }
        style={ styles.chart }
        data={{
          dataSets: [{
            label: `${selectedParameter} (${selectedUnit})`,
            values: chartData[`${selectedParameter} (${selectedUnit})`].data,
            config: {
              color: processColor("red")
            }
          }]
        }}
        xAxis={{
          valueFormatter: chartData[`${selectedParameter} (${selectedUnit})`].labels,
        }}
      /> : <View></View>}
      { editable ? <View><Button
        containerStyle={{ marginTop: 5 }}
        title="Add measurement"
        onPress={ () => { props.onAddClicked(selectedParameter, selectedUnit) }}></Button>
      <Button
        disabled={ typeof props.isUnsyncedDataExist !== "undefined" ? !props.isUnsyncedDataExist : false }
        containerStyle={{ marginTop: 5}} title="Edit unsynced data" onPress={ () => { typeof props.onEditClicked !== "undefined" ? props.onEditClicked() : console.log('Edit') }}></Button></View> : null
      }
    </View>
  )
}
