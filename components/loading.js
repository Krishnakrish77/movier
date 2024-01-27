import { View, Dimensions, ActivityIndicator } from 'react-native'
import React from 'react'
import { theme } from '../theme';
const {width, height} =  Dimensions.get('window');

export default function Loading() {
  return (
    <View style={{height, width}} className="absolute flex-row justify-center items-center">
        <ActivityIndicator size="large" color={theme.background} />
    </View>
  )
}