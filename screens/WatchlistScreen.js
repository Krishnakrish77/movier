import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, Pressable, Modal, Linking, ScrollView } from 'react-native';
import {
  Menu,
  MenuProvider,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/header';
import Loading from '../components/loading';
import { getAuth } from "firebase/auth";
import { firestoreDB } from '../firebaseConfig';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { fallbackMoviePoster, image185 } from '../api/moviedb';
import { CircularProgress } from 'react-native-circular-progress';

const WatchlistScreen = ({ }) => {
  const auth = getAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [otherLinks, setOtherLinks] = useState([]);
  const [bots, setBots] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    // setLoading(true);
    const q = query(collection(firestoreDB, `users/${auth.currentUser.uid}/watchlist`), orderBy("watchListedAt", 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWatchlist(snapshot.docs.map((doc) => ({ id: doc.id.substring(1), docId: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const getOtherLinks = async () => {
    const links = await getDoc(doc(firestoreDB, 'watchproviders', 'others'));
    setOtherLinks(links.data().Links);
    setBots(links.data().Bots)
  };

  const toggleOtherLinks = () => {
    if(!isModalVisible){
      getOtherLinks();
    }
    setModalVisible(!isModalVisible);
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(firestoreDB, "users", auth.currentUser.uid, "watchlist", id), { status: status });
  };

  const renderItem = ({ item }) => (
    <Pressable className='flex-row p-2 bg-neutral-700 my-0.5 rounded-lg' onPress={()=>navigation.navigate('Movie', item)}>
      <View className='flex items-center justify-center'>
          <Image
              source={{uri: image185(item.poster_path) || fallbackMoviePoster }}
              style={{width: 69.375, height: 104.25}} 
          />
      </View>
      <View className='flex-1 px-4 justify-center space-y-2'>
        <View className='flex-row items-center justify-between'>
          <Text className='text-white text-lg font-bold'>{item.name}</Text>
          <View className='self-end'>
            <Menu onSelect={async (value) => { if(value=='Remove') { await deleteDoc(doc(firestoreDB, 'users', auth.currentUser.uid, 'watchlist', item.docId)); alert(`${item.name} is removed from your watchlist`)} else {updateStatus(item.docId, value)}}}>
              <MenuTrigger>
                <View>
                  <MaterialIcons name="more-vert" size={24} color="white" />
                </View>
              </MenuTrigger>
              <MenuOptions>
                {item.status === 'Watchlisted' && (
                  <>
                    <MenuOption value="Watching" text="Watching" />
                    <MenuOption value="Completed" text="Completed" />
                    <MenuOption value="Dropped" text="Drop" />
                    <MenuOption value="Remove" text="Remove from Watchlist" />
                  </>
                )}
                {item.status === 'Watching' && (
                  <>
                    <MenuOption value="Watchlisted" text="Watch Later" />
                    <MenuOption value="Completed" text="Completed" />
                    <MenuOption value="Dropped" text="Drop" />
                    <MenuOption value="Remove" text="Remove from Watchlist" />
                  </>
                )}
                {item.status === 'Completed' && (
                  <>
                    <MenuOption value="Watchlisted" text="Watch Again" />
                    <MenuOption value="Watching" text="Watching" />
                    <MenuOption value="Remove" text="Remove from Watchlist"/>
                  </>
                )}
                {item.status === 'Dropped' && (
                  <>
                    <MenuOption value="Watchlisted" text="Watch Later" />
                    <MenuOption value="Watching" text="Watching" />
                    <MenuOption value="Completed" text="Completed" />
                    <MenuOption value="Remove" text="Remove from Watchlist" />
                  </>
                )}
              </MenuOptions>
            </Menu>
            </View>
        </View>
        <View className='flex-row'>
          <Text className={'text-center text-white rounded-xl self-center px-2 bg-gray-600 mr-4'}>{item.type}</Text>
          <Text className={item.status == 'Watchlisted' ? 'text-white text-center rounded-xl self-center px-3 bg-amber-600' : item.status == 'Completed' ? 'text-white text-center rounded-xl self-center px-3 bg-green-600' : item.status == 'Dropped' ? 'text-white text-center rounded-xl self-center px-3 bg-red-600' : item.status == 'Watching' ? 'text-white text-center rounded-xl self-center px-3 bg-cyan-600' : 'text-white rounded-lg'}>{item.status}</Text>
        </View>
        {
          item.rating ? (
            <View>
              <CircularProgress
                  fill={item.rating}
                  size={42}
                  width={6}
                  rotation={0}
                  tintColor={item.rating > 80 ? '#14A44D' : item.rating > 60 ? '#E4A11B' : '#DC4C64' }
                  backgroundColor="#3d5875"
                >
                  {
                    (rating) => (
                      <Text className="text-white text-xs">
                        { `${rating}%` }
                      </Text>
                    )
                  }
            </CircularProgress>
          </View>
          ) : null
        }
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-neutral-800">
      <Header/>
      <Text className="text-white text-xl font-bold text-center mb-4">Your Watchlist</Text>
      <Pressable className='z-10 absolute items-center justify-center bg-yellow-500 bottom-10 right-4 p-4 rounded-full' onPress={toggleOtherLinks}>
        <MaterialCommunityIcons name="movie-search" size={24} color="white" />
      </Pressable>
      {
          loading? (
            <Loading/>
          ) : (
        watchlist.length ? (
          <MenuProvider>
            <FlatList
              data={watchlist}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          </MenuProvider>
          ) : (
            <Text className="p-2 text-white font-lg text-center">
              You have no items in your watchlist!
            </Text>
          ))
      }
      <Modal animationType="slide" 
              transparent visible={isModalVisible}  
              presentationStyle="overFullScreen" 
              onRequestClose={toggleOtherLinks}
              > 
          <View className="flex-1 items-center justify-center bg-current"> 
              <View className="py-6 items-center bg-white rounded-lg w-80 h-1/2">
                <Text className="font-bold text-lg p-2">Find Movies/Series</Text>
                <ScrollView>
                <View className="px-4 items-center">
                  <Text className='font-semibold pb-2'>Telegram Bots/Channels</Text>
                  <View className='flex-row flex-wrap justify-center'>
                    {
                      bots.length > 0 &&
                      bots.map((item, index) => {
                        return (
                        <Pressable key={item.name} className='rounded-lg justify-center items-center bg-gray-600 p-2 m-1 w-32 h-32' onPress={()=>Linking.openURL(item.link)}>
                                 <Image
                                   source={{uri: item.logo || "https://cdn-icons-png.flaticon.com/512/8636/8636861.png"}}
                                   style={{width: 56, height: 56, borderRadius: 28}} 
                                 />
                                 <Text className="text-neutral-200 font-bold text-center" numberOfLines={1}>
                                     {item?.name}
                                 </Text>
                                 <Text className="text-neutral-400 text-xs text-center" numberOfLines={2}>
                                   {item?.description}
                                 </Text>
                            </Pressable>
                      )})
                  }
                  </View>
                </View>
                <View className="items-center px-4">
                  <Text className='flex-row font-semibold py-2'>Other Links</Text>
                  <View className='flex-row flex-wrap justify-center'>
                {
                  otherLinks.length > 0 && 
                  otherLinks.map((item, index) => {
                    return (
                      <Pressable key={index} className='rounded-lg justify-center items-center bg-gray-600 p-2 m-1 w-32 h-32' onPress={()=>Linking.openURL(item.link)}>
                         <Image
                            resizeMode = 'contain'
                            source={{uri: item.logo || "https://cdn-icons-png.flaticon.com/512/8636/8636861.png"}}
                            style={{width: 56, height: 56}} 
                          />
                          <Text className="text-neutral-200 font-bold text-center" numberOfLines={1}>
                            {item?.name}
                          </Text>
                          <Text className="text-neutral-400 text-xs text-center" numberOfLines={2}>
                            {item?.description}
                          </Text>
                        </Pressable>
                    )
                  })
              }
                </View>
                </View>
                </ScrollView>
              </View>
              <Pressable className="rounded-full bg-yellow-500 p-3 my-3" onPress={toggleOtherLinks}>
                <MaterialIcons name="close" size={24} color="white" /> 
              </Pressable>
          </View> 
      </Modal> 
    </View>
  );
};

export default WatchlistScreen;
