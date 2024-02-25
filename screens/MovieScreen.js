import { View, Text, Image, Dimensions, Pressable, ScrollView, Platform, Modal, FlatList } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { BookmarkIcon, ShareIcon, PaperAirplaneIcon, XMarkIcon, CheckCircleIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';
import Cast from '../components/cast';
import MovieList from '../components/movieList';
import { fallbackMoviePoster, fetchMovieCredits, fetchMovieDetails, fetchSimilarMovies, fetchMovieWatchProviders, image500, fetchTVDetails, fetchTvWatchProviders, fetchMovieVideos } from '../api/moviedb';
import { styles, theme } from '../theme';
import Loading from '../components/loading';
import WatchProviders from '../components/watchproviders';
import { getAuth } from "firebase/auth";
import { firestoreDB } from '../firebaseConfig';
import { collection, query, addDoc, onSnapshot, serverTimestamp, orderBy, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import YoutubePlayer from "react-native-youtube-iframe";
import { CircularProgress } from 'react-native-circular-progress';
import { Dropdown } from 'react-native-element-dropdown';

const ios = Platform.OS == 'ios';
const topMargin = ios? '':' mt-3';
var {width, height} = Dimensions.get('window');

export default function MovieScreen() {
  const {params: item} = useRoute();
  const navigation = useNavigation();
  const [isModalVisible, setModalVisible] = useState(false);
  const [movie, setMovie] = useState({});
  const [tv, setTv] = useState({});
  const [mediaType, setMediaType] = useState(null);
  const [cast, setCast] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [watchProviders, setWatchProviders] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoes, setVideos] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isWatchListed, setIsWatchListed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [tvWatchProviders, setTvWatchProviders] = useState([]);
  const unsubscribeRef = useRef(null);
  const auth = getAuth();
  const [playing, setPlaying] = useState(false);
  const onStateChange = useCallback((state) => { if (state === "ended") { setPlaying(false); }}, []);

  useEffect(()=>{
    setLoading(true);
    if(item.first_air_date || item.type == 'Series'){
      setMediaType('tv');
      isInWatchList(item.id, 'tv');
      getTvDetails(item.id);
      getTvWatchProviders(item.id);
    }
    else {
      setMediaType('movie');
      isInWatchList(item.id, 'movie');
      getMovieDetials(item.id);
      getMovieCredits(item.id);
      getSimilarMovies(item.id);
      getMovieWatchProviders(item.id);
      getMovieVideos(item.id);
    }
  },[item]);

  const getMovieDetials = async id=>{
    const data = await fetchMovieDetails(id);
    console.log('got movie details');
    setLoading(false);
    if(data) {
        setMovie({...movie, ...data});
    }
  }
  const getMovieCredits = async id=>{
    const data = await fetchMovieCredits(id);
    console.log('got movie credits')
    if(data && data.cast){
        setCast(data.cast);
    }

  }
  const getSimilarMovies = async id=>{
    const data = await fetchSimilarMovies(id);
    console.log('got similar movies');
    if(data && data.results){
        setSimilarMovies(data.results);
    }
  }
  const getMovieVideos = async id=>{
    const data = await fetchMovieVideos(id);
    console.log('got movie videos');
    if(data && data.results) {
        const videos = data.results.filter((item) => item.site === "YouTube" && item.official == true);
        if(videos.length != 0){
          setVideos(videos);
          setVideo(videos[0].key)
        }
    }
  }
  const getMovieWatchProviders = async id=>{
    const data = await fetchMovieWatchProviders(id);
    console.log('got watchproviders');

    if(data && data.results.IN){
        let watchproviders = [...data.results.IN.buy || [] , ...data.results.IN.rent || [] , ...data.results.IN.flatrate || []]
        
        const uniqueproviders = watchproviders.reduce((accumulator, currentProvider) => {
            const isProviderExists = accumulator.some(provider => provider.provider_name === currentProvider.provider_name);
        
            if (!isProviderExists) {
                accumulator.push(currentProvider);
            }
        
            return accumulator;
        },[]);
        setWatchProviders(uniqueproviders);
    }

  }
  const getTvWatchProviders = async id=>{
    const data = await fetchTvWatchProviders(id);
    console.log('got tv watchproviders');

    if(data && data.results.IN){
        let watchproviders = [...data.results.IN.buy || [] , ...data.results.IN.rent || [] , ...data.results.IN.flatrate || []]
        
        const uniqueproviders = watchproviders.reduce((accumulator, currentProvider) => {
            const isProviderExists = accumulator.some(provider => provider.provider_name === currentProvider.provider_name);
        
            if (!isProviderExists) {
                accumulator.push(currentProvider);
            }
        
            return accumulator;
        },[]);
        setTvWatchProviders(uniqueproviders);
    }

  }
  const getTvDetails = async id=>{
    const data = await fetchTVDetails(id);
    console.log('got tv details');
    setLoading(false);
    if(data) {
        setTv({...tv, ...data});
    }
  }
  const toggleShareToGroups = () => {
    // Call the unsubscribe function when the "x" button is pressed
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    // Reset the useRef to null
    unsubscribeRef.current = null;
    setModalVisible(!isModalVisible);
  };
  const shareToGroups = async ()=>{
    setLoading(true);
    toggleShareToGroups();
    const userUid = auth.currentUser.uid;
    const q = query(collection(firestoreDB, `users/${userUid}/groups`), orderBy('joinedAt','desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    setLoading(false);
    // Save the unsubscribe function to the useRef
    unsubscribeRef.current = unsubscribe;

  }
  const sendToGroups = async (id)=>{
    let type = mediaType == 'tv' ? 'tvSeriesCard' : 'movieCard';

    for (const groupId of selectedGroups) {
      const message = {
        message: id,
        type: type,
        senderId: auth.currentUser.uid,
        sender: auth.currentUser.displayName,
        sentAt: serverTimestamp()
      };
      const messagesRef = collection(firestoreDB, `groups/${groupId}/messages`);
      await addDoc(messagesRef, message);
    }
    alert("Shared!")
    toggleShareToGroups();
    return () => {
        unsubscribe();
      };

  }
  const toggleSelection = (groupId) => {
    setSelectedGroups((prevSelected) => {
      if (prevSelected.includes(groupId)) {
        // If already selected, remove from the selectedGroups
        return prevSelected.filter((id) => id !== groupId);
      } else {
        // If not selected, add to the selectedGroups
        return [...prevSelected, groupId];
      }
    });
  }
  const isInWatchList = async(id, type) => {
    let docSnap;
    if(type == 'movie'){
      docSnap = await getDoc(doc(firestoreDB, 'users', auth.currentUser.uid, 'watchlist', `M${id}`));
    }
    else {
      docSnap = await getDoc(doc(firestoreDB, 'users', auth.currentUser.uid, 'watchlist', `T${id}`));
    }
    if (docSnap.exists()) {
      setIsWatchListed(true);
    }
  }
  const watchListHandler = async() => {
    if (!isWatchListed) {
      // Add the movie/series to user's watchlist
      if(movie.id) {
        await setDoc(doc(firestoreDB, 'users', auth.currentUser.uid, 'watchlist', `M${movie.id}`), { name: movie.title, type: 'Movie', status: "Watchlisted", rating: Math.round(movie.vote_average * 10), poster_path: movie.poster_path, watchListedAt: serverTimestamp() });
      }
      else {
        await setDoc(doc(firestoreDB, 'users', auth.currentUser.uid, 'watchlist', `T${tv.id}`), { name: tv.name, type: 'Series', status: "Watchlisted", rating: Math.round(tv.vote_average * 10), poster_path: tv.poster_path, watchListedAt: serverTimestamp() });
      }
    } else {
      // Remove the movie/series from the user's watchlist
      if(movie.id) {
        await deleteDoc(doc(firestoreDB, 'users', auth.currentUser.uid, 'watchlist', `M${movie.id}`));
      }
      else {
        await deleteDoc(doc(firestoreDB, 'users', auth.currentUser.uid, 'watchlist', `T${tv.id}`));
      }
    }
    setIsWatchListed(!isWatchListed);
  };
  return (
    <ScrollView 
        contentContainerStyle={{paddingBottom: 20}} 
        className="flex-1 bg-neutral-900">

      {/* back button and movie poster */}
      <View className="w-full">
        <SafeAreaView className={"absolute z-20 w-full flex-row justify-between items-center px-4 "+topMargin}>
            <Pressable style={styles.background} className="rounded-xl p-1" onPress={()=> navigation.goBack()}>
                <ChevronLeftIcon size="28" strokeWidth={2.5} color="white" />
            </Pressable>

            <Pressable onPress={()=> watchListHandler()}>
                <BookmarkIcon size="35" color={isWatchListed? theme.background: 'white'} />
            </Pressable>
        </SafeAreaView>
        {
            loading? (
                <Loading />
            ):(
                <View>  
                    <Image 
                        // source={require('../assets/images/moviePoster2.png')} 
                        source={{uri: image500(movie.poster_path ? movie.poster_path: tv.poster_path ? tv.poster_path : null ) || fallbackMoviePoster }}
                        style={{width, height: height*0.55}} 
                    />
                    <LinearGradient 
                        colors={['transparent', 'rgba(23, 23, 23, 0.8)', 'rgba(23, 23, 23, 1)']} 
                        style={{width, height: height*0.40}}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        className="absolute bottom-0"
                    />
                </View>
            )
        }
       
        
        
      </View>
        
      {/* movie details */}
      
      <View style={{marginTop: -(height*0.09)}} className="space-y-3">
        {/* title */}
        <Text className="text-white text-center text-3xl font-bold tracking-widest">
                {
                    movie?.title? movie?.title : (tv?.name? tv?.name : null)
                }
        </Text>
        
        <View className="flex-row items-center justify-center space-x-4">

          {/* Popularity Component */}
          {
              movie?.vote_average ? 
          <View className="flex items-center justify-center">
            <CircularProgress
              fill={Math.round(movie?.vote_average * 10)}
              size={50}
              width={6}
              rotation={0}
              tintColor={Math.round(movie?.vote_average * 10) > 80 ? '#14A44D' : Math.round(movie?.vote_average * 10) > 60 ? '#E4A11B' : '#DC4C64' }
              backgroundColor="#3d5875"
            >
              {
                (vote_average) => (
                  <Text className="text-white font-semibold">
                    { `${vote_average}%` }
                  </Text>
                )
              }
              </CircularProgress>
          </View> : tv?.vote_average ?
          <View className="flex items-center justify-center">
            <CircularProgress
                fill={Math.round(tv?.vote_average * 10)}
                size={50}
                width={6}
                rotation={0}
                tintColor={Math.round(tv?.vote_average * 10) >= 80 ? '#14A44D' : Math.round(tv?.vote_average * 10) >= 60 ? '#E4A11B' : '#DC4C64' }
                backgroundColor="#3d5875"
              >
                {
                  (vote_average) => (
                    <Text className="text-white font-semibold">
                      { `${vote_average}%` }
                    </Text>
                  )
                }
              </CircularProgress>
        </View> : null
          }
          <View className="flex flex-col w-2/3">
        {/* status, release year, runtime */}
        {
            movie?.id? (
                <Text className="text-neutral-400 font-semibold text-base">
                    {movie?.status} • {movie?.release_date?.split('-')[0] || 'N/A'} • {movie?.runtime} min
                </Text>
            ): tv?.id? (
              <Text className="text-neutral-400 font-semibold text-base">
                    {tv?.status} • {tv?.first_air_date?.split('-')[0] == tv?.last_air_date?.split('-')[0] ? tv?.last_air_date?.split('-')[0] : tv?.first_air_date?.split('-')[0] + '-' + tv?.last_air_date?.split('-')[0] || 'N/A'}
                    {"\n"}{tv?.number_of_seasons} {tv?.number_of_seasons == 1 ? 'season' : 'seasons'} • {tv?.number_of_episodes} episodes
              </Text>
            ): null
        }
        

        
        {/* genres  */}
        <View className="flex-row flex-wrap">
            {
              movie?.genres ?
                movie?.genres?.map((genre,index)=>{
                    let showDot = index+1 != movie.genres.length;
                    return (
                        <Text key={index} className="text-neutral-400 font-semibold text-base text-center">
                            {genre?.name} {showDot? " • ":null}
                        </Text>
                    )
                }) : (tv?.genres ?
                tv?.genres?.map((genre,index)=>{
                  let showDot = index+1 != tv.genres.length;
                  return (
                      <Text key={index} className="text-neutral-400 font-semibold text-base text-center">
                          {genre?.name} {showDot? " • ":null}
                      </Text>
                  )
              }) : null)
            }
        </View>
        </View>
        </View>

        {/* description */}
        <Text className="text-neutral-400 mx-4 tracking-wide">
            {
                movie?.overview? movie.overview: (tv?.overview ? tv.overview : null )
            }
        </Text>
        
     </View>
     <View className="w-full flex-row justify-center items-center px-6">
            { 
                watchProviders.length>0 ? <WatchProviders watchproviders={watchProviders} /> : tvWatchProviders.length>0 ? <WatchProviders watchproviders={tvWatchProviders} /> : null
            }
            <Pressable className="p-3" onPress={shareToGroups}>
                <ShareIcon size="26" color={'white'} />
            </Pressable>
     </View>

      {/* trailer */}
      { videoes.length > 0 &&  (
      <View className="mt-1">
        <Dropdown
          activeColor='#ccc'
          style={{padding: 8, backgroundColor: 'rgb(64 64 64)'}}
          selectedTextStyle={{color: 'white'}}
          value={video}
          autoScroll={false}
          labelField="label"
          valueField="value"
          data={videoes.map((video) => ({ label: video.name, value: video.key, }))} 
          onChange={(videoId) => {
            setVideo(videoId.value);
          }}
        />
        <YoutubePlayer
                key={video}
                height={260}
                play={playing}
                videoId={video}
                onChangeState={onStateChange}
        />
      </View>
      )}
      
      {/* cast */}
      {
        movie?.id ? movie?.id && cast.length>0 && <Cast navigation={navigation} cast={cast} /> : tv?.id ? tv.credits?.cast?.length>0 && <Cast navigation={navigation} cast={tv.credits.cast} /> : null
      }
      
      {/* similar movies section */}
      {
        movie?.id ? movie?.id && similarMovies.length>0 && <MovieList title={'Similar Movies'} hideSeeAll={true} data={similarMovies} /> : tv?.id ? tv?.similar?.results.length>0 && <MovieList title={'Similar Series'} hideSeeAll={true} data={tv.similar.results} /> : null
      }
      <Modal animationType="slide" 
              transparent visible={isModalVisible}  
              presentationStyle="overFullScreen" 
              onRequestClose={toggleShareToGroups}
              > 
          <View className="flex-1 items-center justify-center bg-current"> 
              <View className="py-6 items-center bg-white rounded-lg w-80 h-96">
              <Text className="font-bold text-lg p-2">Share to Groups</Text>
                <View className="flex-row items-center px-4">
                {
                loading? (
                    <Loading />
                ):(
                <FlatList
                    data={groups}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                    <Pressable className="bg-gray-950 mb-0.5 rounded-md" onPress={() => toggleSelection(item.id)}>
                        <View className="flex-row justify-between p-2 w-64">
                            <Text className="px-2 text-lg font-bold text-white">{item.name}</Text>
                            {selectedGroups.includes(item.id) && (
                            <View className="items-center">
                                <CheckCircleIcon size="28" color='green'/>
                            </View>
                            )}
                        </View>
                    </Pressable>
                    )}
                />
                  )
                }
                </View>
                <View className="flex-row py-2 absolute bottom-8">
                  <Pressable className="bg-red-400 rounded-xl p-2 mx-4" onPress={toggleShareToGroups}>
                    {/* <Text className="font-xl font-bold text-center text-gray-700 p-3">Cancel</Text> */}
                    <XMarkIcon size="24" strokeWidth={2.5} color="white"/>
                  </Pressable>
                  <Pressable className="bg-green-400 rounded-xl p-2 mx-4" onPress={() => sendToGroups(movie?.id? movie.id : tv.id)}>
                    {/* <Text className="font-xl font-bold text-center text-gray-700 p-3">Send to Groups</Text> */}
                    <PaperAirplaneIcon size="24" strokeWidth={2.5} color="white"/>
                  </Pressable>
                </View>
              </View>
          </View> 
      </Modal> 
    </ScrollView>
  )
}