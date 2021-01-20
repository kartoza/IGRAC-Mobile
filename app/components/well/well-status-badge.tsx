import React from 'react'
import { View, ViewStyle } from "react-native"
import { Badge } from 'react-native-elements'
import Well from "../../models/well/well"

export interface WellStatusBadgeProps {
  well: Well,
  containerStyle?: ViewStyle
}

const BADGE_STYLE: ViewStyle = {
  position: 'absolute',
  top: 10,
  left: 10
}

export function WellStatusBadge(props: WellStatusBadgeProps) {
  return (
    <View style={[BADGE_STYLE, props.containerStyle]}>
      {typeof props.well.synced !== "undefined" || typeof props.well.new_data !== "undefined" ? (
        props.well.new_data ? <Badge
          status="warning"
          value="New Data"
        /> : (
          props.well.synced === false ? <Badge
            status="error"
            value="Unsynced"
          /> : <Badge
            status="success"
            value="Synced"
          />
        )) : null}
    </View>
  )
}
