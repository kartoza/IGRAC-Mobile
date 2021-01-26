import { StyleSheet, ViewStyle, Platform, TextStyle, Dimensions } from "react-native"

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
  height: "100%",
}
const SEARCH_BAR_CONTAINER: ViewStyle = {
  height: 65,
}
const MAP_VIEW_CONTAINER: ViewStyle = {
  height: Dimensions.get('window').height - ((Platform.OS === "ios") ? 100 : 80) - 65,
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

const MID_BOTTOM_CONTAINER: ViewStyle = {
  alignItems: "center",
  alignContent: "center",
  bottom: (Platform.OS === "ios") ? 100 : 80,
  paddingBottom: (Platform.OS === "ios") ? 20 : 0,
  width: "100%",
  position: "absolute",
  justifyContent: "center",
  flexDirection: "row-reverse",
}

const MID_BOTTOM_CONTENTS: ViewStyle = {
  alignItems: "center",
  alignContent: "center",
  backgroundColor: "white",
  height: 120,
  width: "80%",
  borderRadius: 5
}

const MID_BOTTOM_TEXT: TextStyle = {
  padding: 18,
  fontWeight: "bold",
  color: "rgb(74, 74, 74)"
}

const MID_BOTTOM_SUB_TEXT: TextStyle = {
  fontSize: 12,
  color: "rgb(74, 74, 74)"
}

const MID_BOTTOM_BUTTON: ViewStyle = {
  backgroundColor: "rgb(241, 137, 3)",
  borderColor: "rgb(241, 137, 3)"
}

export const styles = StyleSheet.create({
  ACTIVITY_INDICATOR,
  ACTIVITY_INDICATOR_WRAPPER,
  BOTTOM_VIEW,
  CONTAINER,
  LOCATE_ME_BUTTON,
  LOCATE_ME_CONTAINER,
  MAP,
  MAP_VIEW_CONTAINER,
  MID_BOTTOM_BUTTON,
  MID_BOTTOM_CONTAINER,
  MID_BOTTOM_CONTENTS,
  MID_BOTTOM_SUB_TEXT,
  MID_BOTTOM_TEXT,
  MODAL_BACKGROUND,
  MODAL_TEXT,
  SEARCH_BAR_CONTAINER,
  SYNC_BADGE,
  SYNC_BUTTON,
  SYNC_BUTTON_CONTAINER,
  USER_BUTTON,
  USER_BUTTON_CONTAINER
})
