import Axios from "axios"
import React, { useState } from "react"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { ParamListBase, useFocusEffect } from "@react-navigation/native"
import LoginScreen from "react-native-login-screen"
import { save, load } from "../../utils/storage"
import { API_URL } from "@env"
import { Alert } from "react-native"

const defaultImage = require("../../components/wallpaper/igrac.png")

export interface LoginScreenProps {
    navigation: NativeStackNavigationProp<ParamListBase>
  }

export const LoginScreenPage: React.FunctionComponent<LoginScreenProps> = props => {
  const [spinnerVisibility, setSpinnerVisibility] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const loginUrl = `${API_URL}/groundwater/token-auth`

  const goToMapScreen = React.useMemo(() => () => props.navigation.navigate("map"), [props.navigation])

  // TODO : Don't do this
  useFocusEffect(() => {
    ;(async () => {
      const uuid = await load('uuid')
      if (uuid) goToMapScreen()
    })()
  })

  const login = async () => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    console.log(loginUrl)
    Axios.post(
      `${loginUrl}`,
      formData
    ).then(async response => {
      const uuid = response.data
      if (uuid) {
        await save('uuid', uuid)
        goToMapScreen()
      }
      setSpinnerVisibility(false)
    }).catch(error => {
      console.log(error)
      Alert.alert(
        "Login Failed",
        "Invalid username or password"
      )
      setSpinnerVisibility(false)
    })
  }

  return (
    <LoginScreen
      spinnerEnable
      spinnerVisibility={ spinnerVisibility }
      usernameOnChangeText={(_username) => setUsername(_username)}
      passwordOnChangeText={(_password) => setPassword(_password)}
      source={ defaultImage }
      disableSignupButton
      disableSettings
      onPressLogin={() => {
        if (!username || !password) {
          return
        }
        setSpinnerVisibility(true)
        setTimeout(() => {
          login()
        }, 500)
      }}
    >
    </LoginScreen>
  )
}
