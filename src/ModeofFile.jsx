import { StyleSheet, Text, View , TouchableOpacity} from 'react-native'
import React from 'react'
import { DocumentPicker } from '@react-native-documents/picker'
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';


const ModeofFile = ({navigation}) => {

     // Get existing images from the route params
    
      // Function to pick images from the user's library
      const pickImages = async () => {
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
          else if (result.assets) {
            const newImages = result.assets.map(item => ({
              uri: item.uri,
              base64: item.base64,
              type: item.type || 'image/jpeg',
              name: item.fileName || `image_${Date.now()}`,
            }));
            // Navigate to the GalleryScreen with the combined images
            navigation.navigate('GalleryScreen', { images: newImages });
    
          }
        } catch (error) {
          // Log any errors
          console.log('Error: ', error);
        }
      };

      const pickDocument = async () => {
        try {
          const result = await DocumentPicker.pick({
            allowMultiSelection: true,
        });
    
          const newDocs = result.map(file => ({
            uri: file.uri,
            name: file.name,
            type: file.type,
            size: file.size,
          }));
    
          navigation.navigate('GalleryScreen', { documents: newDocs });
        } catch (err) {
          if (DocumentPicker.isCancel(err)) {
            console.log('User cancelled document picker');
          } else {
            console.error('DocumentPicker Error: ', err);
          }
        }
      };
  return (

    <View style={styles.container}>
    <View style={styles.buttonContainer}>

        <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={pickImages}
                  activeOpacity={0.8}
                >
                  <Entypo name="images" size={24} color="#fff" style={styles.icon} />
                  <Text style={styles.buttonText}>Pick Images from Gallery</Text>
                </TouchableOpacity>


    </View>
    </View>
  )
}

export default ModeofFile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 24,
        paddingTop: 40,
        justifyContent: 'center',
      },
      button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      buttonContainer: {
        width: '100%',
        marginBottom: 40,
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
})