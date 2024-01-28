import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, FlatList, TextInput, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeftIcon, ClipboardDocumentIcon } from 'react-native-heroicons/outline';
import { MaterialIcons } from '@expo/vector-icons';
import { firestoreDB } from '../firebaseConfig';
import { arrayRemove, collection, doc, getDoc, runTransaction } from "firebase/firestore";
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { encrypt } from '../utils/cryptoUtils';
import { getAuth } from 'firebase/auth';

const ios = Platform.OS === 'ios';
const web = Platform.OS === 'web';
const topMargin = ios? '': web? 'py-4':'py-3';

const GroupInfoScreen = () => {
  const {params: groupId} = useRoute();
  const [editMode, setEditMode] = useState(false);
  const [groupInfo, setGroupInfo] = useState({});
  const [groupUsers, setGroupUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const navigation = useNavigation();
  const [inviteCode, setInviteCode] = useState('');
  const auth = getAuth();

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(inviteCode);
    alert("Invite code copied!")
  };

  useEffect(()=>{
    // Generate the invite code when the component mounts
    setInviteCode(encrypt(groupId));
    const fetchGroupInfo = async () => {
        // Fetch group information using the groupId
        const groupDocRef = doc(collection(firestoreDB, 'groups'), groupId);
        const docSnapshot = await getDoc(groupDocRef);
        const groupData = docSnapshot.data();
        if(docSnapshot.exists()){
            // Set the group information in the state
            setGroupInfo(groupData);
            setNewGroupName(groupData.name);
        }
        // Fetch user atagroupDatarmation for each user ID in the group
        const userPromises = groupData.users.map(async (userId) => {
            const userDocRef = doc(collection(firestoreDB, 'users'), userId);
            const userDocSnapshot = await getDoc(userDocRef);
            return { ...userDocSnapshot.data() };
        });

        // Wait for all user information to be fetched
        const userInfos = await Promise.all(userPromises);

        // Set the user information in the state
        setGroupUsers(userInfos);
      };
  
      fetchGroupInfo();
  },[groupId]);

  const handleSave = async () => {
    if (groupInfo.name !== newGroupName && newGroupName !== undefined && newGroupName !== '') {
      try {
        // Use a transaction to update group name in group and each user's groups
        await runTransaction(firestoreDB, async (transaction) => {
            const groupDocRef = doc(firestoreDB, 'groups', groupId);
            const groupDoc = await transaction.get(groupDocRef);
    
            if (groupDoc.exists()) {
                transaction.update(groupDocRef, { name: newGroupName });
            }
  
            // Update group name for each user in the group
            const usersCollectionRef = collection(firestoreDB, 'users');
            for (const userId of groupInfo.users) {
                const userDocRef = doc(usersCollectionRef, userId, 'groups', groupId);
                transaction.update(userDocRef, { name: newGroupName });
            }
        });
  
        setGroupInfo((prevGroupInfo) => ({
            ...prevGroupInfo,
            name: newGroupName,
        }));
        // Disable edit mode after saving    
        setEditMode(false);
      } catch (error) {
        alert('Error updating group name:', error.message);
        // Handle the error appropriately
      }
    }
  };

  const deleteGroup = async () => {
    try {
        await runTransaction(firestoreDB, async (transaction) => {
          // Fetch the list of users in the group
          const groupUsersRef = doc(firestoreDB, 'groups', groupId);
          const groupUsersSnapshot = await getDoc(groupUsersRef);
          const groupUsers = groupUsersSnapshot.data().users

          // Delete the group from the groups subcollection for each user
          for (const userId of groupUsers) {
            const userGroupsDocRef = doc(firestoreDB, 'users', userId, 'groups', groupId);
            transaction.delete(userGroupsDocRef);
          }

          // Delete the group document
          const groupDocRef = doc(firestoreDB, 'groups', groupId);
          transaction.delete(groupDocRef);
        });

        // Navigate to the Groups screen or any other screen
        navigation.navigate('Groups');
      } catch (error) {
          console.log(error);
          alert('An error occured while trying to delete the group');
      }
  }

  const handleDelete = async () => {
    if(Platform.OS == 'web') {
        if (confirm('Are you sure that you want to delete this group?')) {
            // Delete Group
            await deleteGroup();
          } else {
            // Do nothing!
            console.log('User Operation Cancelled');
          }
    }
    else {
        Alert.alert(
            '',
            'Are you sure that you want to delete this group?',
            [
                { text: 'Cancel', onPress: () => console.log('User Operation Cancelled'), style: 'cancel' },
                {
                text: 'OK',
                onPress: async () => { await deleteGroup(); },
                },
            ],
            { cancelable: false }
        );
    }
  };

  const leaveGroup = async () => {
    try {
        await runTransaction(firestoreDB, async (transaction) => {
          // Remove the user from the group's users array
          const groupDocRef = doc(firestoreDB, 'groups', groupId);
          const groupDoc = await transaction.get(groupDocRef);
          if (groupDoc.exists()) {
            transaction.update(groupDocRef, {
              users: arrayRemove(auth.currentUser.uid),
            });
          }

          // Delete the group from the user's groups subcollection
          const userGroupsDocRef = doc(firestoreDB, 'users', auth.currentUser.uid, 'groups', groupId);
          transaction.delete(userGroupsDocRef);
        });

        // Navigate to the Groups screen
        navigation.navigate('Groups');
      } catch (error) {
        alert('An error occured while trying to leave the group');
      }
  };

  const handleLeaveGroup = async () => {
    if(Platform.OS == 'web') {
        if (confirm('Are you sure that you want to leave this group?')) {
            // Leave Group
            await leaveGroup();
          } else {
            // Do nothing!
            console.log('User Operation Cancelled');
          }
    }
    else {
        Alert.alert(
        '',
        'Are you sure that you want to leave this group?',
        [
            { text: 'Cancel', onPress: () => console.log('User Operation Cancelled'), style: 'cancel' },
            {
            text: 'OK',
            onPress: async () => { await leaveGroup(); },
            },
        ],
        { cancelable: false }
        );
    }
  };

  return (
    <View className="flex-1 bg-neutral-800">
      <SafeAreaView className={"w-full flex-row bg-neutral-700 justify-between items-center px-4 "+topMargin}>
        <StatusBar style="auto" />
        <Pressable className="rounded-xl p-1" onPress={()=> navigation.goBack()}>
            <ChevronLeftIcon size="24" strokeWidth={2.5} color="white" />
        </Pressable>
        { 
            auth.currentUser.uid == groupInfo.createdBy ? (
            <Pressable className="p-1" onPress={handleDelete}>
                <MaterialIcons name="delete" size={24} color="white" />
            </Pressable> ) : (
            <Pressable className="p-1" onPress={handleLeaveGroup}>
                <MaterialIcons name="exit-to-app" size={24} color="white" />
            </Pressable>
            )
        }
      </SafeAreaView>
        <View className="mx-4">
            <View className="p-2 items-center">
                <MaterialIcons name="group" size={60} color="black" style={{backgroundColor:'#eee', borderRadius: 50, padding: 16}}/>
                { editMode ? (
                    <View className="flex-row py-2 items-center justify-center">
                        <TextInput
                            className="font-bold text-2xl text-white"
                            value={newGroupName}
                            onChangeText={(text) => setNewGroupName(text)}
                        />
                        <Pressable className="pl-3" onPress={handleSave}>
                            <MaterialIcons name="save" size={22} color="white" />
                        </Pressable>
                        <Pressable className="pl-3" onPress={() => setEditMode(false)}>
                            <MaterialIcons name="cancel" size={22} color="white" />
                        </Pressable>
                    </View>
                    ) : (
                    <View className="flex-row py-2 items-center justify-center">
                        <Text className="font-bold text-2xl text-white">{groupInfo.name}</Text>
                        {
                            auth.currentUser.uid == groupInfo.createdBy ? 
                            <Pressable className="pl-3" onPress={() => setEditMode(true)}>
                                <MaterialIcons name="edit" size={22} color="white" />
                            </Pressable> : null
                        }

                    </View>
                    )
                }
            </View>
            <View className="h-full bg-slate-200 px-6 pt-6 rounded-t-3xl justify-center">
                <Text className="font-bold text-lg self-center">Invite Code</Text>
                <View className="flex-row items-center justify-center bg-zinc-500 rounded-lg p-4">
                    <Text className="text-white items-center px-2">{inviteCode}</Text>
                    <Pressable className="px-2" onPress={copyToClipboard}>
                        <ClipboardDocumentIcon size="24" color="white" />
                    </Pressable>
                </View>
                <Text className="font-bold text-lg self-center mt-4">Users</Text>
                <FlatList
                    data={groupUsers}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <View key={index} className="flex-row bg-zinc-500 my-0.5 p-2 rounded-lg items-center">
                            <Image
                                className="w-12 h-12 items-center"
                                source={{
                                    uri: 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png',
                                }}
                            />
                            <Text className="text-white text-lg mx-2 items-center">{auth.currentUser.uid == item._id ? 'You' : item.providerData.displayName}</Text>
                            { groupInfo.createdBy == item._id && <Text className="rounded-full text-xs bg-slate-300 p-1">Owner</Text> }
                        </View>
                    )}
                /> 
            </View>
        </View>
    </View>
  );
};

export default GroupInfoScreen;
