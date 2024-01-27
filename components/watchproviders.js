import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native'
import React from 'react'
import { fallbackWatchProviderImage, image185 } from '../api/moviedb'
var {width, height} = Dimensions.get('window');

const WatchProviders = ({watchproviders}) => {
  return (
    <View className="my-6">
      <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 15}}
      >
          {
              watchproviders && watchproviders.map((watchprovider, index)=>{
                  return (
                      <TouchableOpacity 
                          key={index} 
                          className="mx-2.5 items-center">
                          <View 
                              className="overflow-hidden rounded-full h-12 w-12 items-center border border-neutral-500">
                              <Image 
                                  className="rounded-2xl h-12 w-12"
                                  source={{uri: image185(watchprovider?.logo_path) || fallbackWatchProviderImage}} 
                              />
                          </View>
                          
                          <Text className="text-white text-center text-xs mt-1 w-16">
                              {
                                  watchprovider?.provider_name
                              }
                          </Text>
                      </TouchableOpacity>
                  )
              })
          }
          
      </ScrollView>

  </View>
  )
}

export default WatchProviders