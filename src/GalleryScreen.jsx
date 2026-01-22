import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Dimensions, View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import DocumentPicker from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { FLASK_SERVER_URL } from '@env';



const GalleryScreen = ({ route, navigation }) => {
  const [pdfFile, setPdfFile] = useState(null); // Store single PDF file
  const [isLoading, setIsLoading] = useState(false);
  const { width, height } = Dimensions.get('window');

  const handleSelectPDF = async () => {
    try {
      const result = await DocumentPicker.pick({
        mode: 'open',
        type: 'application/pdf', // Specific MIME type for PDFs
        copyTo: 'cachesDirectory',
      });

      if (result) {
        const file = Array.isArray(result) ? result[0] : result;
        console.log('PDF selected:', file);
        
        // Read file as base64
        const filePath = file.fileCopyUri || file.uri;
        
        // Clean URI if needed (remove file:// prefix)
        const cleanPath = filePath.replace('file://', '');
        const base64 = await RNFS.readFile(cleanPath, 'base64');
        
        setPdfFile({
          name: file.name,
          uri: file.uri,
          base64: base64,
          size: file.size,
        });
        
        Alert.alert('Success', `PDF "${file.name}" loaded successfully`);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled PDF picker');
      } else {
        console.error('Error picking PDF:', error);
        Alert.alert('Error', 'Failed to select PDF: ' + error.message);
      }
    }
  };

  const handleUpload = async () => {
    if (!pdfFile || !pdfFile.base64) {
      Alert.alert('Error', 'Please select a PDF file first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Uploading model answer PDF...');
      
      const response = await axios.post(
        "http://192.168.0.198:5000/upload-model",
        {
          pdf: `data:application/pdf;base64,${pdfFile.base64}`
        }
      );

      // Handle response
      console.log('Server response:', response.data);

      navigation.navigate('ResultsScreen', {
        results: [response.data], // Wrap in array for compatibility
        isModelAnswer: true,
        totalQuestions: response.data.total_questions
      });
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Error', error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Upload Model Answer PDF</Text>
        <Text style={styles.subtitle}>
          Select a PDF containing question numbers and model answers
        </Text>
        
        {pdfFile ? (
          <View style={styles.pdfCard}>
            <Text style={styles.pdfIcon}>📄</Text>
            <View style={styles.pdfInfo}>
              <Text style={styles.pdfName} numberOfLines={1}>
                {pdfFile.name}
              </Text>
              <Text style={styles.pdfSize}>
                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setPdfFile(null)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectPDF}
            disabled={isLoading}
          >
            <Text style={styles.selectButtonIcon}>📁</Text>
            <Text style={styles.selectButtonText}>Select PDF</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.uploadButton, (!pdfFile || isLoading) && styles.disabledButton]}
          onPress={handleUpload}
          disabled={!pdfFile || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Upload & Process</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  selectButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
  },
  selectButtonIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pdfCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
  },
  pdfIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pdfSize: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 10,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  uploadButton: {
    backgroundColor: '#03dac6',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GalleryScreen;

