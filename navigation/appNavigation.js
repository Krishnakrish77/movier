import React, { useState, useEffect } from 'react'
import { Text, View } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import MovieScreen from '../screens/MovieScreen';
import PersonScreen from '../screens/PersonScreen';
import SearchScreen from '../screens/SearchScreen';
import Loading from '../components/loading';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebaseConfig";

const Stack = createNativeStackNavigator();


export default function AppNavigation() {
  const auth = getAuth(app);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  const onAuthStateChangedHandler = (user) => {
    setUser(user);
    if (initializing) {
      setInitializing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, onAuthStateChangedHandler);

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <Loading/>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user == null ? ( 
        <>
        <Stack.Screen name="Login" options={{headerShown: false}} component={LoginScreen}/>
        <Stack.Screen name="SignUp" options={{headerShown: false}} component={SignUpScreen}/>
        </>  
      ) : (
        <>
        <Stack.Screen name="Home" options={{headerShown: false}} component={HomeScreen} />
        <Stack.Screen name="Movie" options={{headerShown: false}} component={MovieScreen} />
        <Stack.Screen name="Person" options={{headerShown: false}} component={PersonScreen} />
        <Stack.Screen name="Search" options={{headerShown: false}} component={SearchScreen} />
        </>
      )}
      </Stack.Navigator>
    </NavigationContainer>
  )
  
}
