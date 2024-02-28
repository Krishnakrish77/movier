// screens/ProfileScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserCircleIcon, EnvelopeIcon } from 'react-native-heroicons/solid'
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth, updateProfile } from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage"
import { useNavigation } from '@react-navigation/native';
import Header from '../components/header';
import { collection, doc, getDocs, query, runTransaction, updateDoc, where } from 'firebase/firestore';
import { firestoreDB } from '../firebaseConfig';

const ios = Platform.OS === 'ios';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [editMode, setEditMode] = useState(false);
  const auth = getAuth();
  const storage = getStorage();
  const [displayName, setDisplayName] = useState(auth.currentUser.displayName);
  const [profilePic, setProfilePic] = useState(auth.currentUser.photoURL)

  const handleProfilePicUpdate = async () => {
    // console.log(auth.currentUser)
    /// Configure image picker options
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    };

    const getBlobFroUri = async (uri) => {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });
    
      return blob;
    };

    // Show image picker
    let image = await ImagePicker.launchImageLibraryAsync(options);
      if (!image.canceled) {
        // Upload selected image to Firebase Storage
        const uploadTask = ref(storage, `images/${auth.currentUser.uid}/profilePhoto`);
        const imageBlob = await getBlobFroUri(image.assets[0].uri)
        uploadBytes(uploadTask, imageBlob).then(async (snapshot) => {
          const downloadUrl = await getDownloadURL(snapshot.ref);
          updateProfile(auth.currentUser, {
            photoURL: downloadUrl
          }).then(() => {
            // Profile updated!
            updateDoc(doc(firestoreDB, "users", auth.currentUser.uid), { "providerData.photoURL": downloadUrl }).then(() => {
              setProfilePic(downloadUrl);
            });
            alert("Profile Picture updated!")
          }).catch((error) => {
            // An error occurred
            console.log(error);
            alert(`Error occured in updating the profile picture!`);
          });
        })
      }
  };

  const handleSave = async () => {
    // Update the user's display name in Firestore
    if (auth.currentUser.displayName != displayName) {
      updateProfile(auth.currentUser, {
        displayName: displayName
      }).then(() => {
        // Profile updated!
        updateDoc(doc(firestoreDB, "users", auth.currentUser.uid), { "providerData.displayName": displayName }).then(() => {
          setDisplayName(displayName);
        });
      }).catch((error) => {
        // An error occurred
        console.log(error);
        alert(`Error occured in updating the user!`);
      });

      const transaction = async (transactionFirestore) => {
        const querySnapshot = await getDocs(collection(firestoreDB, "users", auth.currentUser.uid, "groups"));
        for (const document of querySnapshot.docs) {
          // doc.data() is never undefined for query doc snapshots
          const messagesRef = collection(firestoreDB, 'groups', document.id, 'messages');

          // Fetch messages for the current group
          const messagesQuery = query(messagesRef, where('senderId', '==', auth.currentUser.uid));
          const messagesSnapshot = await getDocs(messagesQuery);

          // Update sender name in each message
          if (messagesSnapshot.docs != undefined) {
            for (const messageDoc of messagesSnapshot.docs) {
              const messageRef = doc(messagesRef, messageDoc.id);
              await updateDoc(messageRef, { sender: displayName });
            };
          }
        };
      }
      await runTransaction(firestoreDB, transaction);
    }
    // Disable edit mode after saving
    setEditMode(false);
  };

  return (
    <View className="flex-1 bg-neutral-800">
      <Header />
      <View className="flex-row justify-center px-16 pt-2">
        <Text className="text-white text-3xl font-bold p-5 text-center">Profile</Text>
      </View>
      {auth.currentUser && (
        <View className="flex-1 mx-3 bg-white px-16 pt-6 rounded-t-3xl items-center">
          <Pressable className="px-1" onPress={handleProfilePicUpdate}>
            {
              profilePic == null || undefined ?
                <UserCircleIcon size="150" strokeWidth={1} color="black" /> :
                <Image 
                  className="rounded-full h-32 w-32"
                  source={{
                    uri: profilePic,
                  }} />
            }
          </Pressable>
          {editMode ? (
            <View className="flex-row items-center justify-center">
              <TextInput
                className="p-2 w-2/3 text-gray-700 font-bold text-2xl text-center"
                value={displayName}
                onChangeText={(text) => setDisplayName(text)}
              />
              <Pressable className="px-1" onPress={handleSave}>
                <MaterialIcons name="save" size={22} color="black" />
              </Pressable>
              <Pressable className="px-1" onPress={() => setEditMode(false)}>
                <MaterialIcons name="cancel" size={22} color="red" />
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center justify-center">
              <Text className="p-2 text-gray-700 rounded-2xl font-bold text-2xl">{displayName}</Text>
              <Pressable className="px-1" onPress={() => setEditMode(true)}>
                <MaterialIcons name="edit" size={22} color="black" />
              </Pressable>
            </View>
          )
          }
          <View className="flex-row">
            <EnvelopeIcon size="22" strokeWidth={1} color="black" />
            <Text className="px-1 text-gray-700 rounded-2xl">{auth.currentUser.email}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProfileScreen;
