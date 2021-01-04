
import { TextStyle, ViewStyle, Platform, StyleSheet } from 'react-native'

const CONTAINER: ViewStyle = {
  height: "100%",
  backgroundColor: 'rgb(248, 248, 248)',
  paddingLeft: 20,
  paddingRight: 20
}

const FORM_HEADER: TextStyle = {
  color: '#005198',
  fontWeight: 'bold',
  letterSpacing: 2,
  textAlign: 'center',
  backgroundColor: 'rgb(236, 236, 236)',
  padding: 5,
  marginTop: 10,
}

const FORM_SUB_HEADER: TextStyle = {
  color: '#000000',
  marginTop: 15,
  marginBottom: -10,
  fontWeight: 'bold',
  textAlign: 'center',
}

const CHART_CONTAINER: ViewStyle = {
  marginTop: 10
}

const EMPTY_CHART_CONTAINER: ViewStyle = {
  height: 50,
  marginTop: 10
}

const LABEL: TextStyle = {
  color: '#000000',
  fontSize: 13,
  marginTop: 10
}

const CHART_LABEL: TextStyle = {
  ...LABEL,
  marginTop: 0,
  marginBottom: 15
}

const TEXT_INPUT_STYLE: ViewStyle = {
  minHeight: 40,
  backgroundColor: "#ffffff",
  borderRadius: 5,
  marginTop: 5,
  paddingLeft: 10
}

const HEADER_CONTAINER: ViewStyle = {
  backgroundColor: "#005198",
  height: 80,
  marginTop: (Platform.OS === "ios") ? -25 : 0
}

export const styles = StyleSheet.create({
  CHART_CONTAINER,
  CHART_LABEL,
  CONTAINER,
  EMPTY_CHART_CONTAINER,
  FORM_HEADER,
  FORM_SUB_HEADER,
  HEADER_CONTAINER,
  LABEL,
  TEXT_INPUT_STYLE,
  chart: {
    flex: 1,
    marginBottom: 10,
    marginTop: 10,
  }
})
