// screens/GroupScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/header';
import { getAuth } from "firebase/auth";
import { firestoreDB } from '../firebaseConfig';
import { collection, query, setDoc, doc, onSnapshot, serverTimestamp, where, getDoc, updateDoc, arrayUnion, orderBy, limit, getDocs } from 'firebase/firestore';
import { decrypt } from '../utils/cryptoUtils';
import Loading from '../components/loading';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get("window");

const GroupScreen = ({ navigation }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupId, setJoinGroupId] = useState('');
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  
  const loadGroups = () => {
    setLoading(true);
    const userUid = auth.currentUser.uid;
  
    // Query to get the user's groups sorted by joinedAt
    const groupsQuery = query(collection(firestoreDB, `users/${userUid}/groups`), orderBy('joinedAt', 'desc'));
  
    // Set up a snapshot listener for the user's groups
    const unsubscribeGroups = onSnapshot(groupsQuery, async (snapshot) => {
      const groupsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const groupData = { id: doc.id, ...doc.data() };
  
        // Query to get the last message for each group, ordered by sentAt in descending order
        const lastMessageQuery = query(collection(firestoreDB, `groups/${groupData.id}/messages`), orderBy('sentAt', 'desc'), limit(1));
  
        // Set up a snapshot listener for the last message of each group
        const unsubscribeLastMessage = onSnapshot(lastMessageQuery, (lastMessageSnapshot) => {
          if (!lastMessageSnapshot.empty) {
            // If there is a last message, update the lastMessage property in groupData
            groupData.lastMessage = lastMessageSnapshot.docs[0].data();
          } else {
            // If there is no last message, set lastMessage to null or handle it as needed
            groupData.lastMessage = null;
          }
  
          // Update the state with the modified groupData
          setGroups((prevGroups) => {
            // Find the index of the groupData in the array
            const index = prevGroups.findIndex((group) => group.id === groupData.id);
  
            // If found, replace the old groupData with the modified one
            if (index !== -1) {
              return [...prevGroups.slice(0, index), groupData, ...prevGroups.slice(index + 1)];
            }
  
            // If not found, simply return the previous array
            return prevGroups;
          });
        });
        
        return { ...groupData, unsubscribeLastMessage };
      }));
      setLoading(false);
      // Update the state with the modified groupsData
      setGroups(groupsData);
    });
  
    // Return a function to unsubscribe both group and last message listeners
    return () => {
      unsubscribeGroups();
      groupsData.forEach((groupData) => {
        groupData.unsubscribeLastMessage();
      });
    };
  };
  
  // UseEffect hook to load groups and set up listeners when the component mounts
  useEffect(() => {
    const unsubscribeLoadGroups = loadGroups();
  
    // Return another function to unsubscribe when the component unmounts
    return () => {
      unsubscribeLoadGroups();
    };
  }, []);
  
  const handleCreateGroup = async () => {
    const userUid = auth.currentUser.uid;
    // const firestoreDB = getFirestore();
    if(newGroupName == null || newGroupName == ''){
      alert("Please specify a group name!")
    }
    else {
      try {
        // Generate a unique group ID
        // const groupsCollectionRef = collection(firestoreDB, 'groups');
        const groupDocRef = doc(collection(firestoreDB, 'groups'));

        const data = {
          name: newGroupName,
          users: [userUid],
          createdBy: userUid,
          createdAt: serverTimestamp()
        }
        // Create group and add the user
        const groupMembersDocRef = doc(firestoreDB, 'groups', groupDocRef.id);
        await setDoc(groupMembersDocRef, data);

        // Add the group to the user's groups
        const userGroupsDocRef = doc(firestoreDB, 'users', userUid, 'groups', groupDocRef.id);
        await setDoc(userGroupsDocRef, { name: newGroupName, joinedAt: serverTimestamp() });

        // Reset input field
        setNewGroupName('');
        toggleGroupCreation();
      } catch (error) {
        alert('Error creating group:', error)
        console.error('Error creating group:', error.message);
      }
    }
  };

  const handleJoinGroup = async () => {
    const userUid = auth.currentUser.uid;
    if(joinGroupId == null || joinGroupId == ''){
      alert("Please enter a group invite code!")
    }
    else {
      const groupId = decrypt(joinGroupId);
      if(groupId == null || groupId == ''){
        alert("Invalid invite code!");
      }
      else {
        try {
          // Check if the group exists
          const groupDocRef = doc(collection(firestoreDB, 'groups'), groupId);
          const docSnapshot = await getDoc(groupDocRef);
          if(docSnapshot.exists()){
            // Add the user to the group
            await updateDoc(groupDocRef, {
              users: arrayUnion(userUid)
            })
  
            // Add the group to the user's groups
            await setDoc(doc(firestoreDB, 'users', userUid, 'groups', groupId), { name: docSnapshot.data().name, joinedAt: serverTimestamp() })
  
            // Reset input field
            setJoinGroupId('');
            toggleGroupCreation();
          }
          else {
            alert("Invalid invite code!");
  
            // Reset input field
            setJoinGroupId('');
            } 
          } catch (error) {
          alert('Error joining group:', error)
          console.error('Error joining group:', error);
        }
      }
    }
  };

  const handleGroupClick = (groupId, groupName) => {
    navigation.navigate('Chat', { groupId, groupName });
  };

  const toggleGroupCreation = () => {
      setModalVisible(!isModalVisible);
  };

  return (
    <View className="flex-1 bg-neutral-800">
      <Header/>
      <View className="flex-row justify-between items-center mx-4 mb-3">
        <Text className="text-white text-xl font-bold text-center">Groups</Text>
        <Pressable className="rounded-lg bg-yellow-500 p-2" onPress={toggleGroupCreation}>
          <MaterialIcons name="add" size={22} color="white" />
        </Pressable>
      </View>
      {
        loading? (
          <Loading/>
        ) : (
          <FlatList
            data={groups}
            onRefresh={loadGroups}
            refreshing={loading}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity className="bg-neutral-700 my-0.5 mx-2 rounded-lg"  onPress={() => handleGroupClick(item.id, item.name)}>
                <View className="flex-row p-4">
                  <MaterialIcons name="groups" size={24} color="#404040" backgroundColor='#eab308' style={{
                    backgroundColor: '#eab308',
                    borderRadius: 50, // Assuming the icon is a circle, adjust the radius as needed
                    padding: 14, // Add padding to ensure the border doesn't touch the icon
                  }}/>
                  <View>
                    <Text className="px-4 text-lg font-bold text-white">{item.name}</Text>
                    <Text className="px-4 text-white">{item.lastMessage ? item.lastMessage.type == 'text' ? `${item.lastMessage.sender}: ${item.lastMessage.message}` : (item.lastMessage.type == 'movieCard' ? `${item.lastMessage.sender} shared a movie`: `${item.lastMessage.sender} shared a series` ) : 'No messages yet'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      }
      <Modal animationType="slide" 
              transparent visible={isModalVisible}  
              presentationStyle="overFullScreen" 
              onRequestClose={toggleGroupCreation}
              > 
          <View className="flex-1 items-center justify-center bg-current"> 
              <View className="justify-center bg-white rounded-lg w-80 h-80">
                <View className="flex-row justify-center items-center px-10">
                <MaterialIcons name="group-add" size={24} color="black" />
                  <TextInput placeholder="Enter Group Name" 
                              value={newGroupName} style={styles.textInput}  
                              onChangeText={(value) => setNewGroupName(value)} /> 
                </View>
                  <Pressable className="py-3 bg-yellow-400 rounded-xl mx-12 my-2" onPress={handleCreateGroup}>
                    <Text className="font-xl font-bold text-center text-gray-700">Create Group</Text>
                  </Pressable>
                <Text className="font-xl font-bold text-center text-gray-700">OR</Text>
                <View className="flex-row items-center px-10">
                  <MaterialIcons name="groups" size={24} color="black" />
                  <TextInput placeholder="Enter Group Invite Code" 
                              value={joinGroupId} style={styles.textInput}
                              onChangeText={(value) => setJoinGroupId(value)} /> 
                </View>
                  <Pressable className="py-3 bg-yellow-400 rounded-xl mx-12 my-2" onPress={handleJoinGroup}>
                    <Text className="font-xl font-bold text-center text-gray-700">Join Group</Text>
                  </Pressable>
              </View>
              <Pressable className="rounded-full bg-yellow-500 p-2 my-3" onPress={toggleGroupCreation}>
                <MaterialIcons name="close" size={22} color="white" /> 
              </Pressable>
          </View> 
      </Modal> 
    </View>
  );
};

const styles = StyleSheet.create({  
  textInput: { 
      width: "80%", 
      borderRadius: 5, 
      paddingVertical: 8, 
      paddingHorizontal: 16, 
      borderColor: "rgba(0, 0, 0, 0.2)", 
      borderWidth: 2, 
      margin: 8, 
  }, 
});

export default GroupScreen;