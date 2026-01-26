import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import RNFS from 'react-native-fs';
import axios from 'axios';

// Document Picker
const DocumentPicker =
  require('@react-native-documents/picker').default ||
  require('@react-native-documents/picker');


const Answerpicker = ({navigation, route}) => {
  const { modelId } = route.params;
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPDFs = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: 'application/pdf',
        allowMultiSelection: true, // 🔥 IMPORTANT
        copyTo: 'cachesDirectory',
      });
  
      const files = await Promise.all(
        results.map(async (file) => {
          const path = (file.fileCopyUri || file.uri).replace('file://', '');
          const base64 = await RNFS.readFile(path, 'base64');
  
          return {
            name: file.name,
            size: file.size,
            base64,
          };
        })
      );
  

      setPdfFiles(prev =>
        [...prev, ...files].filter(
          (v, i, a) => a.findIndex(t => t.name === v.name) === i
        )
      );
      
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', err.message);
      }
    }
  };
  
  const handleRemoveFile = (indexToRemove) => {
    setPdfFiles(prev =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };
  


  const handleUpload = async () => {
    if (pdfFiles.length === 0) {
      Alert.alert('Select at least one PDF');
      return;
    }
  
    setIsLoading(true);
  
    try {
      const response = await axios.post(
        'http://192.168.0.198:5000/upload',
        {
          pdfs: pdfFiles.map(f => `data:application/pdf;base64,${f.base64}`)
        }
      );
      
      const students = response.data.students;
      console.log('Students:', students);
  
      navigation.navigate('SubmitAnswerScreen', {
        modelId,
        students ,
        isStudentAnswer: true
      });
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
  
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Student Answer Upload</Text>
          <Text style={styles.subtitle}>
            Upload one or more PDFs containing students' answers
          </Text>
        </View>
  
        {/* Select PDFs */}
        <TouchableOpacity
          style={styles.selectCard}
          onPress={handleSelectPDFs}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.selectEmoji}>📑</Text>
          <Text style={styles.selectText}>Select PDF Files</Text>
          <Text style={styles.selectHint}>Multiple PDFs allowed</Text>
        </TouchableOpacity>
  
        {/* Selected PDFs */}
        {pdfFiles.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              Selected Files ({pdfFiles.length})
            </Text>
  
            {pdfFiles.map((file, index) => (
              <View key={index} style={styles.fileRow}>
                <View style={styles.fileLeft}>
                  <Text style={styles.fileEmoji}>📄</Text>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
                
                 {/* ❌ REMOVE BUTTON */}
      <TouchableOpacity
        onPress={() => handleRemoveFile(index)}
        hitSlop={10}
      >
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

         {/* ✅ ADD MORE FILES BUTTON — PERFECT LOCATION */}
    <TouchableOpacity
      style={styles.addMoreButton}
      onPress={handleSelectPDFs}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      <Text style={styles.addMoreText}>＋ Add more files</Text>
    </TouchableOpacity>
      </ScrollView>

      
  
      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (pdfFiles.length === 0 || isLoading) && styles.disabledButton,
        ]}
        onPress={handleUpload}
        disabled={pdfFiles.length === 0 || isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadText}>Upload & Evaluate</Text>
        )}
      </TouchableOpacity>


    </View>
  );
  
  
}

export default Answerpicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },

  scroll: {
    padding: 20,
    paddingBottom: 120,
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e272e',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: '#636e72',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  selectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 25,
  },

  selectEmoji: {
    fontSize: 44,
    marginBottom: 10,
  },

  selectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0984e3',
  },

  selectHint: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },

  listContainer: {
    marginTop: 10,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 10,
  },

  fileRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  addMoreButton: {
    marginTop: 10,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0984e3',
  },
  
  addMoreText: {
    color: '#0984e3',
    fontSize: 14,
    fontWeight: '600',
  },
  

  fileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  fileEmoji: {
    fontSize: 22,
    marginRight: 10,
  },

  fileName: {
    fontSize: 14,
    color: '#2d3436',
    flexShrink: 1,
  },

  fileSize: {
    fontSize: 13,
    color: '#636e72',
    marginLeft: 10,
  },

  uploadButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#00b894',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 5,
  },

  disabledButton: {
    backgroundColor: '#b2bec3',
  },

  uploadText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  removeText: {
    fontSize: 20,
    color: '#ff3b30', // iOS system red (very clear)
    fontWeight: '800',
  },
  fileRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  removeText: {
    fontSize: 18,
    color: '#d63031',
    fontWeight: '700',
  },
    
});
