import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db } from '../firebaseConfig'; // adjust path
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\n/g, ' ')           // replace newlines with space
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .replace(/^[^a-zA-Z]+/, '')    // remove starting non-letters/punctuation
    .trim();                        // remove leading/trailing spaces
};

const ResultsScreen = ({ route, navigation }) => {
  const { results, isModelAnswer = false } = route.params || {};
  const [marks, setMarks] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [modelName, setModelName] = useState(''); // State for model name input
  const [isSaving, setIsSaving] = useState(false); // Loading state for save operation

  // Debug: Log route params on mount
  useEffect(() => {
    console.log('=== ResultsScreen Mounted ===');
    console.log('Route params:', route.params);
    console.log('results:', results);
    console.log('isModelAnswer:', isModelAnswer);
    if (results?.[0]) {
      console.log('results[0] keys:', Object.keys(results[0]));
      console.log('results[0].qa_dict exists:', !!results[0].qa_dict);
    }
  }, []);

  const handleMarkChange = (questionKey, value) => {
    setMarks(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const toggleExpand = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (isSaving) {
      console.log('Save already in progress, ignoring duplicate call');
      return;
    }

    try {
      setIsSaving(true);
      console.log('=== Save button pressed ===');

      if (!modelName.trim()) {
        alert('Please enter a model name');
        setIsSaving(false);
        return;
      }

      // Debug logging
      console.log('=== Save Model Debug ===');
      console.log('isModelAnswer:', isModelAnswer);
      console.log('results:', results);
      console.log('results[0]:', results?.[0]);
      console.log('results[0]?.qa_dict:', results?.[0]?.qa_dict);

      // Validate results data
      if (!results || !Array.isArray(results) || results.length === 0) {
        console.error('❌ Results data is missing or invalid');
        alert('Error: No results data found. Please try uploading again.');
        setIsSaving(false);
        return;
      }

      if (!isModelAnswer) {
        console.error('❌ isModelAnswer is false');
        alert('Error: This screen is not configured for model answers.');
        setIsSaving(false);
        return;
      }

      if (!results[0]?.qa_dict) {
        console.error('❌ qa_dict is missing from results');
        console.error('Available keys in results[0]:', Object.keys(results[0] || {}));
        alert('Error: Question-answer data not found. Please try uploading again.');
        setIsSaving(false);
        return;
      }

      const finalData = [];
      const qa_dict = results[0].qa_dict;

      // Build final data array
      Object.entries(qa_dict).forEach(([questionKey, answer]) => {
        const markValue = marks[questionKey] || '0';
        finalData.push({
          question: questionKey,
          answer: cleanText(answer), // cleaned before saving
          mark: parseInt(markValue) || 0,
        });
      });

      // Validate finalData is not empty
      if (finalData.length === 0) {
        console.error('❌ finalData is empty after processing');
        alert('Error: No questions found to save. Please check the uploaded data.');
        setIsSaving(false);
        return;
      }

      console.log('Final Structured Data:', finalData);
      console.log('Total questions:', finalData.length);
      console.log('Model name:', modelName.trim());

      // Verify Firebase connection
      console.log('Checking Firebase connection...');
      console.log('db object:', db);
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      // Prepare data for Firebase
      const firebaseData = {
        modelName: modelName.trim(),
        data: finalData,
        createdAt: serverTimestamp(),
        totalQuestions: finalData.length
      };
      console.log('Data to save (summary):', {
        modelName: firebaseData.modelName,
        totalQuestions: firebaseData.totalQuestions,
        dataLength: firebaseData.data.length,
        firstQuestion: firebaseData.data[0]?.question
      });

      // Save to Firebase
      console.log('Attempting to save to Firestore...');
      console.log('Collection path: models');
      
      try {
        const docRef = await addDoc(collection(db, 'models'), firebaseData);
        console.log(`✅ Saved to Firestore as ${modelName}`);
        console.log('Document ID:', docRef.id);
        console.log('Document path:', docRef.path);

        // Navigate after successful save
        console.log('Navigating to ImagePicker...');
        setIsSaving(false);
        alert(`Model "${modelName}" saved successfully!`);
        navigation.navigate('ImagePicker');
        console.log('Navigation called');
      } catch (firebaseError) {
        console.error('❌ Firebase specific error:', firebaseError);
        console.error('Firebase error code:', firebaseError.code);
        console.error('Firebase error message:', firebaseError.message);
        console.error('Firebase error stack:', firebaseError.stack);
        setIsSaving(false);
        throw firebaseError; // Re-throw to be caught by outer catch
      }

    } catch (e) {
      setIsSaving(false);
      console.error('❌ Saving error:', e);
      console.error('Error details:', {
        message: e.message,
        code: e.code,
        stack: e.stack
      });
      
      // More detailed error message
      let errorMessage = 'Failed to save model. ';
      if (e.code) {
        errorMessage += `Error code: ${e.code}. `;
      }
      if (e.message) {
        errorMessage += e.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      alert(errorMessage + ' Please check your internet connection and try again.');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Set Evaluation Marks</Text>

        <View style={styles.modelNameContainer}>
          <Text style={styles.modelNameLabel}>Model Name:</Text>
          <TextInput
            style={styles.modelNameInput}
            placeholder="Enter model name"
            placeholderTextColor="#999"
            value={modelName}
            onChangeText={setModelName}
            maxLength={50}
          />
        </View>

        {isModelAnswer && results[0]?.qa_dict && (
          Object.entries(results[0].qa_dict).map(([questionKey, answer]) => (
            <View key={questionKey} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(questionKey)}
              >
                <Text style={styles.cardTitle}>{questionKey}</Text>
                <View style={styles.headerRight}>
                  <View style={styles.marksInputContainer}>
                    <Text style={styles.marksLabel}>Max Marks:</Text>
                    <TextInput
                      style={styles.marksInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                      value={marks[questionKey] || ''}
                      onChangeText={(text) => handleMarkChange(questionKey, text)}
                    />
                  </View>
                  <Text style={styles.expandIcon}>
                    {expandedItems[questionKey] ? '▲' : '▼'}
                  </Text>
                </View>
              </TouchableOpacity>

              {expandedItems[questionKey] && (
                <View style={styles.cardContent}>
                  <Text style={{ color: '#333', lineHeight: 20 }}>
                    {cleanText(answer)}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}

      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Model'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  marksInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  marksLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  marksInput: {
    width: 50,
    height: 38,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
  },
  cardContent: {
    padding: 15,
  },
  buttonContainer: {
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    position: 'absolute',
  },
  saveButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 3,
    minWidth: 120,
    alignItems: 'center'
  },
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modelNameContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modelNameLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  modelNameInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
  }
});

export default ResultsScreen;
