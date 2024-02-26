import { View, Text, ScrollView, Image, Dimensions, Linking, Pressable } from 'react-native'
import React from 'react'
import { fallbackWatchProviderImage, image185 } from '../api/moviedb'

const WatchProviders = ({watchproviders, links, title}) => {
    const handleWatchProviderLink = async (provider_name) => {
        const encodedTitle = encodeURIComponent(title); // Encode the movie title
        var baseurl = links[provider_name]?.searchURL || links[provider_name]?.url || null
        if(baseurl && links[provider_name]?.searchURL != null){
            const url = `${baseurl}${encodedTitle}`; // Construct the URL with the encoded movie title
            Linking.openURL(url); // Open the URL
        }
        else {
            Linking.openURL(baseurl); // Open the URL
        }
    };
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
                      <Pressable
                          key={index} 
                          className="mx-2.5 items-center"
                          onPress={() => handleWatchProviderLink(watchprovider?.provider_name)}>
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
                      </Pressable>
                  )
              })
          }
          
      </ScrollView>

  </View>
  )
}

export default WatchProviders