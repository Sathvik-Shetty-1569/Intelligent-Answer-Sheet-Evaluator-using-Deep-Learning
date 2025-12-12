import { StyleSheet, Text, View , TouchableOpacity} from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';


const Answerpicker = ({navigation, route}) => {

  const { modelId } = route.params;

      const pickImages = async ()  => {
        try {
    
          // Launch the image picker
        const result = await launchImageLibrary({
          mediaType: 'photo',
          selectionLimit: 10,
          includeBase64: true, // ✅ This makes sure base64 is included
        });
          // If there is an error, log it
        if (result.error) {
            console.log('ImagePicker Error: ', result.error);
        }
          // If images are selected, map the selected images to their URIs
        else if (result.assets) {
          //with the help of map it loops through the assets and take the only uri from it
          const newImages = result.assets.map(item => ({
            uri: item.uri,
            base64: item.base64,
            type: item.type || 'image/jpeg',
            name: item.fileName || `image_${Date.now()}`,
        }));
            // Navigate to the GalleryScreen with the combined images
          navigation.navigate('UploadAnswerServer', { images: newImages, modelId});
    
      }
     } catch(error) {
        // Log any errors
        console.log('Error: ', error);
      }};

  return (
    <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={pickImages}
              activeOpacity={0.8}
            >
              <Icon name="add-circle" size={24} color="#fff" style={styles.icon} />
              <Text style={styles.buttonText}>Upload Students Answers</Text>
            </TouchableOpacity>
            </View>
  )
}

export default Answerpicker;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 24,
      paddingTop: 40,
    },
    header: {
      marginBottom: 40,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#2d3436',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#636e72',
    },
    buttonContainer: {
        justifyContent: 'center',
        flex: 1,
      width: '100%',
      marginBottom: 40,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      margin: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButton: {
      backgroundColor: '#007AFF',
    },
    secondaryButton: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#007AFF',
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 12,
    },
    secondaryButtonText: {
      color: '#007AFF',
    },
    icon: {
      marginRight: 8,
    },
    illustrationContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 40,
    },
  
  })