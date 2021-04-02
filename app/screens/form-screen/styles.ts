
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
  marginTop: 10,
  height: 500
}

const EMPTY_CHART_CONTAINER: ViewStyle = {
  height: 70,
  marginTop: 10
}

const LABEL: TextStyle = {
  color: '#000000',
  fontSize: 13,
  marginTop: 10,
  paddingBottom: 2
}

const LABEL_IMPORTANT: TextStyle = {
  ...LABEL,
  fontWeight: 'bold'
}

const REQUIRED_LABEL: TextStyle = {
  ...LABEL,
  fontWeight: 'bold'
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
  paddingLeft: 10,
  color: "black"
}

const PICKER_INPUT_STYLE: ViewStyle = {
  transform: [{ scaleX: 0.90 }, { scaleY: 0.90 }],
  left: -25,
}

const PICKER_SM_INPUT_STYLE: ViewStyle = {
  // transform: [{ scaleX: 0.70 }, { scaleY: 0.70 }],
  // left: 0,
}

const MULTIPLE_INPUT_STYLE: ViewStyle = {
  ...TEXT_INPUT_STYLE,
  flex: 1,
  flexDirection: "row"
}

const HEADER_CONTAINER: ViewStyle = {
  backgroundColor: "#005198",
  height: 100,
  marginTop: (Platform.OS === "ios") ? -25 : 0
}

const SUBMIT_BUTTON: ViewStyle = {
  marginTop: 10
}

const LAST_UPDATE_TEXT: TextStyle = {
  marginTop: 10,
  fontSize: 12,
  textAlign: 'right',
  fontStyle: 'italic'
}

const LOADING: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999999,
}

const ERROR_INPUT: TextStyle = {
  color: "red",
  fontSize: 12,
  paddingLeft: 3
}

export const styles = StyleSheet.create({
  CHART_CONTAINER,
  CHART_LABEL,
  CONTAINER,
  EMPTY_CHART_CONTAINER,
  ERROR_INPUT,
  FORM_HEADER,
  FORM_SUB_HEADER,
  HEADER_CONTAINER,
  LABEL,
  LABEL_IMPORTANT,
  LAST_UPDATE_TEXT,
  LOADING,
  MULTIPLE_INPUT_STYLE,
  PICKER_INPUT_STYLE,
  PICKER_SM_INPUT_STYLE,
  REQUIRED_LABEL,
  SUBMIT_BUTTON,
  TEXT_INPUT_STYLE,
  chart: {
    flex: 1,
    marginBottom: 10,
    marginTop: 10,
    minHeight: 150
  }
})
