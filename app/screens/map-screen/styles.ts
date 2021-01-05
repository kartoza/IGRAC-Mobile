import { StyleSheet, ViewStyle, Platform, TextStyle } from "react-native"

const ACTIVITY_INDICATOR: ViewStyle = {
  top: 10,
}
const ACTIVITY_INDICATOR_WRAPPER: ViewStyle = {
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: 10,
  display: "flex",
  height: 140,
  justifyContent: "space-around",
  width: 140,
}
const BOTTOM_VIEW: ViewStyle = {
  alignItems: "center",
  backgroundColor: "white",
  bottom: 0,
  flexDirection: "row-reverse",
  height: (Platform.OS === "ios") ? 80 : 60,
  justifyContent: "center",
  paddingBottom: (Platform.OS === "ios") ? 20 : 0,
  position: "absolute",
  width: "100%",
}
const CONTAINER: ViewStyle = {
  height: "100%"
}
const MAP: ViewStyle = {
  height: "100%",
  marginVertical: 0,
}
const MODAL_TEXT: TextStyle = {
  fontSize: 14,
  textAlign: "center"
}
const MODAL_BACKGROUND: ViewStyle = {
  alignItems: "center",
  backgroundColor: "#00000040",
  flex: 1,
  flexDirection: "column",
  justifyContent: "space-around"
}
const LOCATE_ME_BUTTON: ViewStyle = {
  borderColor: 'rgb(241, 137, 3)',
  backgroundColor: "rgb(241, 137, 3)",
  width: "50%",
  marginBottom: 20,
  height: "100%"
}
const LOCATE_ME_CONTAINER: ViewStyle = {
  width: "30%",
  alignItems: "center"
}
const USER_BUTTON: ViewStyle = {
  marginRight: -20,
  backgroundColor: "#ffffff"
}
const USER_BUTTON_CONTAINER: ViewStyle = {
  width: "30%"
}
const SYNC_BUTTON: ViewStyle = {
  marginLeft: -10, backgroundColor: "#ffffff"
}
const SYNC_BUTTON_CONTAINER: ViewStyle = {
  width: "30%"
}
const SYNC_BADGE: ViewStyle = {
  position: 'absolute',
  right: "20%",
  top: 5
}

export const styles = StyleSheet.create({
  ACTIVITY_INDICATOR,
  ACTIVITY_INDICATOR_WRAPPER,
  BOTTOM_VIEW,
  CONTAINER,
  LOCATE_ME_BUTTON,
  LOCATE_ME_CONTAINER,
  MAP,
  MODAL_BACKGROUND,
  MODAL_TEXT,
  SYNC_BADGE,
  SYNC_BUTTON,
  SYNC_BUTTON_CONTAINER,
  USER_BUTTON,
  USER_BUTTON_CONTAINER
})
