import React from 'react';
import {View,Text, Pressable, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline'
import { StatusBar } from 'expo-status-bar';
import { Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../theme';

const ios = Platform.OS === 'ios';

export default function Header(){
 const navigation = useNavigation();

  return(
    <SafeAreaView className={ios? "-mb-2": "my-3"}>
        <StatusBar style="light" />
        <View className="flex-row justify-between items-center mx-4">
        <Pressable onPress={()=>navigation.toggleDrawer()}>
            <Entypo name="menu" size={30} color="white" />
        </Pressable>
          <Text 
            className="text-white text-3xl font-bold">
              <Text style={styles.text}>M</Text>ovie<Text style={styles.text}>R</Text>
          </Text>
          <Pressable onPress={()=> navigation.navigate('Search')}>
            <MagnifyingGlassIcon size="30" strokeWidth={2} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
  )
}
