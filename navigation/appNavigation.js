import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import MovieScreen from '../screens/MovieScreen';
import PersonScreen from '../screens/PersonScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Loading from '../components/loading';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "../firebaseConfig";
import GroupScreen from '../screens/GroupScreen';
import ChatScreen from '../screens/ChatScreen';
import GroupInfoScreen from '../screens/GroupInfoScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

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

  const handleLogout = async () => {
    signOut(auth).then(() => {
      // Sign-out successful.
    }).catch((error) => {
      // An error happened.
      alert(error)
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, onAuthStateChangedHandler);

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <Loading/>
    );
  };

  function DrawerStack() {
    return (
    <Drawer.Navigator
    drawerContent={props => {
      return (
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
          <DrawerItem label="Logout" onPress={handleLogout} inactiveTintColor='#fff' icon={({ color, size }) => (
            <MaterialCommunityIcons name="logout" color={color} size={size} />
        )}/>
        </DrawerContentScrollView>
      )
    }}
      screenOptions={{
        drawerActiveTintColor: '#eab308',
        drawerInactiveTintColor: '#fff',
        drawerStyle: {
          backgroundColor: '#333',
          borderTopWidth: 0,
          paddingVertical: 5
        }
      }}>
      <Drawer.Screen name="Home" 
        options={{headerShown: false, drawerIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="home" color={color} size={size} />
        ),}} 
        component={HomeScreen} />
      <Drawer.Screen name="Groups"
        options={{headerShown: false, drawerIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account-group" color={color} size={size} />
        ),}}  
        component={GroupScreen} />
      <Drawer.Screen name="Profile"
        options={{headerShown: false, drawerIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" color={color} size={size} />
        ),}}  
        component={ProfileScreen} />
    </Drawer.Navigator>
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
        <Stack.Screen name="App" options={{headerShown: false}} component={DrawerStack} />
        <Stack.Screen name="Movie" options={{headerShown: false}} component={MovieScreen} />
        <Stack.Screen name="Person" options={{headerShown: false}} component={PersonScreen} />
        <Stack.Screen name="Search" options={{headerShown: false}} component={SearchScreen} />
        <Stack.Screen name="Chat" options={{headerShown: false}} component={ChatScreen} />
        <Stack.Screen name="GroupInfo" options={{headerShown: false}} component={GroupInfoScreen} />
        </>
      )}
      </Stack.Navigator>
    </NavigationContainer>
  )
  
}
