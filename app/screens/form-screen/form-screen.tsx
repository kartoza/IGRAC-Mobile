import React, { useState, useEffect } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase } from "@react-navigation/native"
import { Button, TextInput, TextStyle, View, ViewStyle, Pla } from 'react-native'
import { Formik } from 'formik'
import { Text } from "../../components"
import { Header } from "react-native-elements"

const CONTAINER: ViewStyle = {
  height: "100%"
}

const LABEL: TextStyle = {
  color: '#005198',
  fontSize: 13,
  fontWeight: "bold",
  marginTop: 10
}

const HEADER_CONTAINER: ViewStyle = {
  backgroundColor: "#005198",
  height: 80,
  marginTop: (Platform.OS === "ios") ? -25 : 0
}

export interface FormScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>,
}

export const FormScreen: React.FunctionComponent<FormScreenProps> = props => {
  const { route, navigation } = props
  const [wellName, setWellName] = useState('')

  const goToMapScreen = React.useMemo(() => () => props.navigation.pop(), [
    props.navigation,
  ])

  useEffect(() => {
    ;(async () => {
      console.log('route.params.wellName', route.params)
      // setWellName(route.params.wellName)
    })()
  }, [])

  return (
    <View style = { CONTAINER }>
      <Header
        placement="center"
        leftComponent={{ icon: "chevron-left", size: 30, color: "#fff", onPress: () => goToMapScreen() }}
        centerComponent={{ text: "View Record", style: { fontSize: 18, color: "#fff", fontWeight: "bold" } }}
        containerStyle={ HEADER_CONTAINER }
      />
      <Formik
        initialValues={{ original_id: route.params.wellName, status: 'active', feature_type: 'Borehole', purpose: 'Production', description: 'Test description' }}
        onSubmit={values => console.log(values)}
      >
        {({ handleChange, handleBlur, handleSubmit, values }) => (
          <View style={{ padding: "5%" }}>
            <Text style={LABEL}>Original ID</Text>
            <TextInput
              onChangeText={handleChange('original_id')}
              onBlur={handleBlur('original_id')}
              value={route.params.wellName}
              style={{ height: 40, borderBottomWidth: 0.8, borderColor: "#ff6b0d", borderRadius: 5 }}
            />
            <Text style={LABEL}>Status</Text>
            <TextInput
              onChangeText={handleChange('status')}
              onBlur={handleBlur('status')}
              value={values.status}
              style={{ height: 40, borderBottomWidth: 0.8, borderColor: "#ff6b0d", borderRadius: 5 }}
            />
            <Text style={LABEL}>Feature type</Text>
            <TextInput
              onChangeText={handleChange('feature_type')}
              onBlur={handleBlur('feature_type')}
              value={values.feature_type}
              style={{ height: 40, borderBottomWidth: 0.8, borderColor: "#ff6b0d", borderRadius: 5 }}
            />
            <Text style={LABEL}>Purpose</Text>
            <TextInput
              onChangeText={handleChange('purpose')}
              onBlur={handleBlur('purpose')}
              value={values.purpose}
              style={{ height: 40, borderBottomWidth: 0.8, borderColor: "#ff6b0d", borderRadius: 5 }}
            />
            <Text style={LABEL}>Description</Text>
            <TextInput
              onChangeText={handleChange('description')}
              onBlur={handleBlur('description')}
              value={values.stdescriptionatus}
              multiline
              style={{ height: 40, borderBottomWidth: 0.8, borderColor: "#ff6b0d", borderRadius: 5 }}
            />
            <View style={{height: 10}}></View>
            <Button onPress={handleSubmit} title="Update" disabled />
          </View>
        )}
      </Formik>
    </View>
  )
}
