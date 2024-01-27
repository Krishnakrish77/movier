import { View, Text, Image, Dimensions, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { fallbackMoviePoster, fetchMovieDetails, fetchTVDetails, image185 } from '../api/moviedb'
import { useNavigation } from '@react-navigation/native';

var { width, height } = Dimensions.get("window");

const MessageCard = ({item}) => {
    const [movie, setMovie] = useState({});
    const navigation = useNavigation();

    useEffect(()=>{
        if(item.type == "movieCard"){
            getMovieDetails(item.message);
        }
        else if(item.type == "tvSeriesCard"){
            getTvSeriesDetails(item.message);
        }
      },[item]);

    const getMovieDetails = async id=>{
        const data = await fetchMovieDetails(id);
        if(data) {
            setMovie({...movie, ...data});
        }
    }
    const getTvSeriesDetails = async id=>{
        const data = await fetchTVDetails(id);
        if(data) {
            setMovie({...movie, ...data});
        }
    }
    return (
        <View>
            { 
                item?.type == "movieCard" || item?.type == "tvSeriesCard"? (
                    <Pressable className="bg-yellow-500 rounded-lg p-2" onPress={()=>navigation.navigate('Movie', movie)}>
                        <Image
                            source={{uri: image185(movie.poster_path) || fallbackMoviePoster}}
                            style={{height: height/4}}
                            resizeMode="cover"
                        />
                        <View className="flex-row justify-center items-center" style={{ width: 2 * width/5}}>
                            <View className="p-2 flex-1">
                                <Text className="text-base font-bold text-center text-white">{movie?.title ? movie?.title : movie?.name}</Text>
                                <Text className="text-center text-white ">{movie?.runtime ? movie?.runtime + ' min' : movie?.number_of_episodes + ' episodes'}</Text>
                            </View>
                            { movie?.vote_average ? 
                            <View className="bg-yellow-700 rounded-full p-2 my-2 justify-center items-center w-12">
                                <Text className="text-center font-bold text-white">{movie.vote_average.toFixed(2)}</Text>
                            </View> : null
                            }
                        </View>
                    </Pressable>
                ):( 
                    <Text className="text-base w-32">{item?.message}</Text>
                ) 
            }       
        </View>
    )
}

export default MessageCard