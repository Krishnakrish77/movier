// ChatScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Pressable, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth } from "firebase/auth";
import { firestoreDB } from '../firebaseConfig';
import { collection, query, addDoc, doc, onSnapshot, getDoc, orderBy } from 'firebase/firestore';
import MessageCard from '../components/moviecard';

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
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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
    return ('0' + dateTime.getHours()).slice(-2) + ':' + ('0' + dateTime.getMinutes()).slice(-2);
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
    // setMessages((prevMessages) => [newMessageObj, ...prevMessages]);
    setNewMessage('');
  };

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
        keyExtractor={(item, index) => index.toString()}
        inverted={true} // Display latest messages at the bottom
        renderItem={({ item }) => (
          <View>
            <View className={item.senderId === auth.currentUser.uid ? 'rounded-lg bg-zinc-100 self-end m-1' : 'rounded-lg bg-zinc-100 self-start m-1'}>
              <Text className="text-sm text-white bg-zinc-500 px-1 font-semibold">{item.sender}</Text>
              <View className="p-1">
                <MessageCard item={item}/>
              </View>
            </View>
            <View className={item.senderId === auth.currentUser.uid ? 'self-end mr-1' : 'self-start ml-1'}>
              <Text className="text-sm text-white">{item && timestamp(item.sentAt.seconds)}</Text>
            </View>
          </View>
        )}
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
