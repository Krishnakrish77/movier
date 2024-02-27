import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, Pressable } from 'react-native';
import {
  Menu,
  MenuProvider,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/header';
import Loading from '../components/loading';
import { getAuth } from "firebase/auth";
import { firestoreDB } from '../firebaseConfig';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { fallbackMoviePoster, image185 } from '../api/moviedb';
import { CircularProgress } from 'react-native-circular-progress';

const WatchlistScreen = ({ }) => {
  const auth = getAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
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


  const removeFromWatchlist = async (movieId) => {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('watchlist')
      .doc(movieId)
      .delete();
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
                    <MenuOption value="Completed" text="Mark as Completed" />
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
      {
          loading? (
            <Loading/>
          ) : (
        watchlist.length ? (
          <MenuProvider>
            <FlatList
              data={watchlist}
              renderItem={renderItem}
              keyExtractor={item => item.id}
            />
          </MenuProvider>
          ) : (
            <Text className="p-2 text-white font-lg text-center">
              You have no items in your watchlist!
            </Text>
          ))
      }
    </View>
  );
};

export default WatchlistScreen;
