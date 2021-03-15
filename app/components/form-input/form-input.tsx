import { Picker } from "@react-native-picker/picker"
import React, { useState, useEffect } from "react"
import { View, Text, TextInput } from "react-native"
import { styles } from '../../screens/form-screen/styles'
import { feetToMeters, cmToMeeters } from "../../utils/convert"

export interface FormInputProps {
  options?: {},
  onChange?: any,
  onUnitChange?: any,
  unitValue?: string,
  key: string,
  title: string,
  value: string | number,
  numeric?: boolean,
  required?: boolean,
  multiline?: boolean,
  editable?: boolean,
  units?: []
}

export function FormInput(props: FormInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [unitValue, setUnitValue] = useState("")
  const [updated, setUpdated] = useState(false)
  const [editable, setEditable] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (typeof props.value !== "undefined") {
        setInputValue(props.value + "")
      }
      if (typeof props.unitValue !== "undefined") {
        setUnitValue(props.unitValue + "")
      }
      if (typeof props.editable !== "undefined") {
        setEditable(props.editable)
      }
    })()
  }, [props.value, props.unitValue])

  const handleChange = (value, isUnit = false) => {
    let outputValue = null
    if (isUnit) {
      setUnitValue(value)
      if (value === "ft") {
        outputValue = feetToMeters(inputValue)
      } else if (value === "cm") {
        outputValue = cmToMeeters(inputValue)
      } else {
        outputValue = inputValue
        if (typeof props.onUnitChange !== "undefined") {
          setUpdated(true)
          props.onUnitChange(value)
          return
        }
      }
    } else {
      setInputValue(value)
      outputValue = value
    }
    if (typeof props.onChange !== "undefined") {
      setUpdated(true)
      props.onChange(outputValue)
    }
  }
  const pickerForm = (options, isUnit = false) => {
    return <View style={[styles.TEXT_INPUT_STYLE, isUnit ? { width: "40%"} : {}] }>
      <Picker
        selectedValue={ isUnit ? unitValue : inputValue }
        style={styles.PICKER_INPUT_STYLE}
        enabled={ editable }
        onValueChange={(itemValue, itemIndex) => {
          handleChange(itemValue, isUnit)
        }}>
        { !isUnit ? <Picker.Item key={ "" } label={ "-------" } value={ "" } /> : null}
        {
          (typeof options !== "undefined")
            ? options.map((value, index) => {
              let _key = ""
              let _name = ""
              if (value.constructor === String) {
                _key = value
                _name = value
              } else {
                _key = Object.keys(value)[0]
                _name = value[_key]
              }
              return <Picker.Item key={ _key } label={ _name } value={ _name } />
            })
            : null
        }
      </Picker>
    </View>
  }
  return (
    <View>
      <Text style={[(props.required ? styles.LABEL_IMPORTANT : styles.LABEL), (updated ? { backgroundColor: "rgba(189, 202, 18, 0.2)"}:{})]}> { props.title }</Text>
      <View style={props.units ? styles.MULTIPLE_INPUT_STYLE : styles.TEXT_INPUT_STYLE}>
        { props.options
          ? pickerForm(props.options)
          : <TextInput
            editable={ editable }
            onChangeText={ (value) => handleChange(value) }
            value={ inputValue }
            style={[styles.TEXT_INPUT_STYLE, (props.multiline ? { height: 100, textAlignVertical: 'top' } : {}), (props.units ? { width : '60%'} : {})]}
            multiline={ props.multiline }
            keyboardType={ props.numeric ? "numeric" : "default" }
          />
        }
        { props.units ? pickerForm(props.units, true) : <View></View>}
      </View>
    </View>
  )
}
