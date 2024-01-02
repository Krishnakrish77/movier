import { View, Text, Pressable, Image, TextInput } from 'react-native'
import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { styles } from '../theme';

// subscribe for more videos like this :)
export default function SignUpScreen({ navigation: { navigate } }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();

    const auth = getAuth();
    const handleUserCreation = async () => {
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            updateProfile(auth.currentUser, {
                displayName: name
              }).then(() => {
                // Profile updated!
                // ...
                alert(`User ${name} created. Logging in...`)
              }).catch((error) => {
                // An error occurred
                alert(`Error occured in updating ${name}`);
              });
            // alert(`User ${name} created. Logging in...`)
        })
        .catch((error) => {
            const errorCode = error.code;
            alert(error);
        });
        updateProfile
    };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex">
        <StatusBar style="light" />
        <View className="flex-row justify-center py-3">
            <Image source={require('../assets/images/signup.png')} 
                style={{width: 165, height: 110}} />
        </View>
      </SafeAreaView>
      <Text className="text-white text-3xl font-bold p-5 text-center">
          <Text style={styles.text}>M</Text><Text className="text-neutral-500">ovie</Text><Text style={styles.text}>R</Text>
        </Text>
      <View className="flex-1 bg-white px-8 pt-8"
        style={{borderTopLeftRadius: 50, borderTopRightRadius: 50}}
      >
        <View className="form space-y-2">
            <Text className="text-gray-700 ml-4">Name</Text>
            <TextInput
                className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-3"  
                value={name}
                placeholder='Enter Name'
                onChangeText={(text) => setName(text)}
            />
            <Text className="text-gray-700 ml-4">Email Address</Text>
            <TextInput
                className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-3"
                value={email}
                placeholder='Enter Email'
                onChangeText={(text) => setEmail(text)} 
            />
            <Text className="text-gray-700 ml-4">Password</Text>
            <TextInput
                className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-7"
                secureTextEntry
                value={password}
                placeholder='Enter Password'
                onChangeText={(text) => setPassword(text)}
            />
            <Pressable
                className="py-3 bg-yellow-400 rounded-xl"
            >
                <Text className="font-xl font-bold text-center text-gray-700" onPress={handleUserCreation} onClick={handleUserCreation}>
                    Sign Up
                </Text>
            </Pressable>
        </View>
        <View className="flex-row justify-center mt-7">
            <Text className="text-gray-500 font-semibold">Already have an account?</Text>
            <Pressable onPress={()=> navigate('Login')}>
                <Text className="font-semibold text-yellow-500"> Login</Text>
            </Pressable>
        </View>
      </View>
    </View>
  )
}