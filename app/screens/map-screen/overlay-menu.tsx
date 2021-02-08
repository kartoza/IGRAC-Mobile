/* eslint-disable react-native/no-color-literals */
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react'
import { View, Text, Alert } from "react-native"
import { Button, Overlay } from 'react-native-elements'
import { load, save } from '../../utils/storage'
import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"

export interface OverlayMenuProps {
  visible: boolean,
  navigation: NativeStackNavigationProp<ParamListBase>
}

export function OverlayMenu(props: OverlayMenuProps) {
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [user, setUser] = useState({})

  useEffect(() => {
    ;(async () => {
      setOverlayVisible(props.visible)
      const userData = await load("user")
      setUser(userData)
    })()
  }, [props.visible])

  const goToLoginScreen = React.useMemo(() => () => props.navigation.navigate("login"), [props.navigation])

  const logout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          onPress: () => setOverlayVisible(false),
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            await save('uuid', '')
            await save('wells', [])
            await save('terms', [])
            goToLoginScreen()
          }
        }
      ],
      { cancelable: false }
    )
  }

  return (
    <Overlay isVisible={ overlayVisible } onBackdropPress={ () => setOverlayVisible(false) }>
      <View style={{ width: 300, padding: 20 }}>
        <View style={{ paddingBottom: 20 }}><Text>{ typeof user.username !== "undefined" ? "Hello " + user.username + "," : "" }</Text></View>
        <Button
          title="Log out"
          raised
          titleStyle={{ color: "#ffffff" }}
          containerStyle={{ width: "100%" }}
          onPress={ () => { logout() }}
        />
      </View>
    </Overlay>
  )
}
