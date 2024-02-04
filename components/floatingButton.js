// components/FloatingButton.js

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export const FloatingButton = ({ onPress }) => {
  return (
    <TouchableOpacity className="w-14 h-14 items-center justify-center bg-yellow-500 rounded-full absolute bottom-8 right-8" onPress={onPress}>
      <Text className="text-white text-3xl">+</Text>
    </TouchableOpacity>
  );
};
