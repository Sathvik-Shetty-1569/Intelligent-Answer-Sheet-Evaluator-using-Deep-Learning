import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Dimensions, View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

import { FLASK_SERVER_URL } from '@env';

const UploadAnswerServer = ({ route, navigation }) => {
  const { modelId } = route.params;

  // Initialize with proper image objects containing both uri and base64
  const [images, setImages] = useState(() => {
    // Convert existing URIs to proper image objects if needed
    const initialImages = route.params?.images || [];
    return initialImages
    .map(img => {
      if (typeof img === 'string') {
        console.warn('Image has no base64 data and will be skipped.');
        return null;
      }
      return img;
    })
    .filter(Boolean); // remove nulls
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { width, height } = Dimensions.get('window');

  const handleAddMore = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 0, // 0 means no limit
        includeBase64: true,
      });

      if (result.assets) {
        const newImages = result.assets.map(asset => {
          console.log('Asset received:', {
            uri: asset?.uri,
            hasBase64: !!asset?.base64,
            type: asset?.type
          });

          return {
            uri: asset?.uri,
            base64: asset?.base64, // This must exist
            type: asset?.type || 'image/jpeg',
            name: asset?.fileName || `image_${Date.now()}`,
          };
        });
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.log('Error adding more images:', error);
      Alert.alert('Error', 'Failed to add images');
    }
  };

  const handleUpload = async () => {
    if (images.length === 0) return;

    setIsLoading(true);
    try {
      // Only include images with base64 data
      const uploadableImages = images.filter(img => img.base64);

     const response = await axios.post(
  "http://10.224.44.199:5000/upload",
  {
    images: uploadableImages.map(img => `data:${img.type};base64,${img.base64}`)
  }
);


      // Handle response
      console.log('Server response:', response.data);

      navigation.navigate('SubmitAnswerScreen', {
        results: response.data.results,
        modelId
      });
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Error', error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={images}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <Image
              source={{ uri: item?.uri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleAddMore}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Add More Files</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.uploadButton]}
          onPress={handleUpload}
          disabled={isLoading || images.length === 0}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Upload</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 3,
    minWidth: 120,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#03dac6',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default UploadAnswerServer;

