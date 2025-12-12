import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons'

// Component to pick images from the user's library
const ImagePickerScreen = ({ navigation }) => {
 


  // Render the button to select images
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ai AnswerEvaluator</Text>
        <Text style={styles.subtitle}>Upload or select saved models</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('ModeofFile')}
          activeOpacity={0.8}
        >
          <Icon name="add-circle" size={24} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Create New Evaluation Model</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('SavedModelScreen')}
          activeOpacity={0.8}
        >
          <Icons name="folder-sync" size={24} color="#007AFF" style={styles.icon} />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Use Existing Model</Text>
        </TouchableOpacity>

        

      </View>

      <View style={styles.illustrationContainer}>
        <Icon
          name="document-scanner"
          size={120}
          color="#007AFF"
        />
      </View>
    </View>
  );
};

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

export default ImagePickerScreen