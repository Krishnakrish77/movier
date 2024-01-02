import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig";
import { styles } from '../theme';

const LoginScreen = ({ navigation: { navigate } }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const auth = getAuth(app);

  const handleEmailPasswordLogin = async () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        console.log("Logged in!");
        console.log(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        switch(errorCode) {
          case "auth/invalid-email":
            alert("The email address you entered is invalid.");
            break;
          case "auth/wrong-password":
            alert("The password you entered is incorrect.");
            break;
          default:
            alert("An unexpected error occurred. Unable to log in");
            break;
        }
      });
  };

  const handleForgetPassword = async () => {
    sendPasswordResetEmail(auth, email)
    .then((userCredential) => {
        // Signed up 
        const user = userCredential.user;
        alert(`Password reset sent to inbox`)
    })
    .catch((error) => {
        const errorCode = error.code;
        alert(error);
    });
  };

  return (
    <View className="flex-1 w-full items-center justify-center bg-neutral-500">
      <SafeAreaView className="flex">
        <StatusBar style="light" />
        <View  className="flex-row justify-center">
          <Image source={require('../assets/images/login.png')} 
          style={{width: 200, height: 200}} />
        </View>
      </SafeAreaView>
        <Text className="text-white text-3xl font-bold py-5">
          <Text style={styles.text}>M</Text>ovie<Text style={styles.text}>R</Text>
        </Text>
        <View className="flex-1 bg-white w-full px-16 pt-10">
          <View className="form space-y-2">
            <Text className="text-gray-700 ml-4">Email Address</Text>
            <TextInput 
              className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-3"
              placeholder="Enter email address"
              value={email}
              onChangeText={(text) => setEmail(text)} 
            />
            <Text className="text-gray-700 ml-4">Password</Text>
            <TextInput 
              className="p-4 bg-gray-100 text-gray-700 rounded-2xl"
              secureTextEntry
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => setPassword(text)} 
            />
            <Pressable className="flex items-end">
              <Text className="text-gray-700 mb-5" onPress={handleForgetPassword}>Forgot Password?</Text>
            </Pressable>
            <Pressable 
              className="py-3 bg-yellow-400 rounded-xl">
                <Text className="text-xl font-bold text-center text-gray-700" onPress={handleEmailPasswordLogin} >
                    Login
                </Text>
             </Pressable> 
          </View>

          <View className="flex-row justify-center mt-7">
              <Text className="text-gray-500 font-semibold">
                  Don't have an account?
              </Text>
              <Pressable onPress={()=> navigate('SignUp')}>
                  <Text className="font-semibold text-yellow-500"> Sign Up</Text>
              </Pressable>
          </View>
        </View>
    </View>
  );
};

export default LoginScreen;