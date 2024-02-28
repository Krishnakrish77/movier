// ChatScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth } from "firebase/auth";
import { firestoreDB } from '../firebaseConfig';
import { collection, query, addDoc, doc, onSnapshot, getDoc, orderBy } from 'firebase/firestore';
import MessageCard from '../components/moviecard';
import { UserCircleIcon } from 'react-native-heroicons/solid';

const ios = Platform.OS === 'ios';
const web = Platform.OS === 'web';
const topMargin = ios? '': web? 'py-4':'py-3';

const ChatScreen = ({ route }) => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const isFocused = useIsFocused();
  const auth = getAuth();

  useEffect(() => {
    // Fetch messages or load initial messages when the component mounts
    // You can use Firebase or any other backend service to fetch and send messages
    // For simplicity, let's assume messages are an array of objects with a 'message', 'sender', and 'timestamp' field
    if(isFocused){
      getGroupName(route.params.groupId);
      const q = query(collection(firestoreDB, `groups/${route.params.groupId}/messages`), orderBy("sentAt", 'desc'));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
      const senderIds = new Set(snapshot.docs.map(doc => doc.data().senderId));
      const senderProfilePicURLs = {};
      await Promise.all(Array.from(senderIds).map(async (senderId) => {
        const senderDoc = await getDoc(doc(firestoreDB, 'users', senderId));
        if(senderDoc.exists()) {
          senderProfilePicURLs[senderId] = senderDoc.data()?.providerData?.photoURL;
        }
        else {
          alert("An unexpected error occured.")
        }
      }));
      const updatedMessages = snapshot.docs.map((doc) => {
        const messageData = doc.data();
        return { id: doc.id, ...messageData, senderProfilePicURL: senderProfilePicURLs[messageData.senderId] };
      });
        setMessages(updatedMessages);
      });
      return () => {
        unsubscribe();
      };
    }
  },[isFocused]);

  const getGroupName = async(groupId) => {
    const groupDocRef = doc(firestoreDB, 'groups', groupId);
    const docSnap = await getDoc(groupDocRef);
    setGroupName(docSnap.data().name)
  };

  const timestamp = (epoch) => {
    var dateTime = new Date(epoch * 1000);
    const year = dateTime.getFullYear();
    const month = dateTime.toLocaleString('default', { month: 'short' });
    const day = ('0' + dateTime.getDate()).slice(-2);

    const hours = ('0' + dateTime.getHours()).slice(-2);
    const minutes = ('0' + dateTime.getMinutes()).slice(-2);

    // Format: DD-MM-YYYY HH:mm
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const handleSend = async() => {
    // Handle sending a new message
    // You can use Firebase or any other backend service to send messages
    // For simplicity, let's simulate sending a message by updating the local state
    if (newMessage.trim() === '') {
      return;
    }

    const message = {
      message: newMessage,
      type: 'text',
      senderId: auth.currentUser.uid,
      sender: auth.currentUser.displayName,
      sentAt: new Date(Date.now())
    };
    // Add the message to Firestore
    const messagesRef = collection(firestoreDB, `groups/${route.params.groupId}/messages`);
    await addDoc(messagesRef, message);
    setNewMessage('');
  };

  const renderItem = ({ item }) => (
    <View>
      <View className={item.senderId === auth.currentUser.uid ? 'self-end flex-row-reverse m-1' : 'self-start flex-row m-1'}>
        {
          item.senderProfilePicURL == null ? (
          <View className='p-1'>
            <UserCircleIcon size="40" strokeWidth={1} color="white" />
          </View>
          ) : (
            <View className='p-1'>
              <Image
                source={{ uri: item.senderProfilePicURL }}
                style={{ width: 40, height: 40, borderRadius: 25 }}
              />
            </View>
          )
        }
        <View className="p-1 rounded-lg bg-zinc-100">
          <Text className="text-sm text-black font-semibold">{item.sender}</Text>
          <MessageCard item={item} />
        </View>
      </View>
      <View className={item.senderId === auth.currentUser.uid ? 'flex-row self-end mr-14' : 'flex-row self-start ml-14'}>
          <Text className="text-sm text-white">{item && timestamp(item.sentAt.seconds)}</Text>
        </View>
    </View>
  );

  return (
    <View className="flex-1 bg-neutral-800">
      <SafeAreaView className={"absolute z-20 w-full flex-row bg-neutral-700 justify-between items-center px-4 "+topMargin}>
        <StatusBar style="auto" />
        <Pressable className="rounded-xl p-1" onPress={()=> navigation.goBack()}>
            <ChevronLeftIcon size="24" strokeWidth={2.5} color="white" />
        </Pressable>
        <TouchableOpacity className="p-1" onPress={() => navigation.navigate("GroupInfo", route.params.groupId)}>
            <Text className="text-white font-bold text-lg">{groupName}</Text>
        </TouchableOpacity>
        <Pressable className="p-1" onPress={()=> navigation.navigate("Home")}>
            <MaterialIcons name="home" size={24} color="white" />
        </Pressable>
      </SafeAreaView>

      <FlatList
        className="mt-28"
        data={messages}
        keyExtractor={(item, index) => index}
        inverted={true} // Display latest messages at the bottom
        renderItem={renderItem}
        initialNumToRender={10}
      />

      <View className="flex-row items-center p-4 bg-neutral-700">
        <TextInput
          className="flex-1 rounded-lg items-center p-2 border border-white/80 mr-2 bg-white"
          placeholder="Type your message..."
          placeholderTextColor="black"
          value={newMessage}
          onChangeText={(message) => setNewMessage(message)}
        />
        <TouchableOpacity className="rounded-lg bg-yellow-500 p-3" onPress={handleSend}>
          <MaterialIcons name="send" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e6f7ff',
    padding: 8,
    margin: 5,
    borderRadius: 10,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 5,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    padding: 10,
  }
});

export default ChatScreen;
