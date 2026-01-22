import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
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
  const { results, isModelAnswer = false } = route.params;
  const [marks, setMarks] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [modelName, setModelName] = useState(''); // State for model name input

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
    try {
      if (!modelName.trim()) {
        alert('Please enter a model name');
        return;
      }

      const finalData = [];

      if (isModelAnswer && results[0]?.qa_dict) {
        const qa_dict = results[0].qa_dict;
        Object.entries(qa_dict).forEach(([questionKey, answer]) => {
          finalData.push({
            question: questionKey,
            answer: cleanText(answer), // cleaned before saving
            mark: parseInt(marks[questionKey] || '0'),
          });
        });
      }

      console.log('Final Structured Data:', finalData);

      await addDoc(collection(db, 'models'), {
        modelName: modelName.trim(),
        data: finalData,
        createdAt: serverTimestamp(),
        totalQuestions: finalData.length
      });

      console.log(`✅ Saved to Firestore as ${modelName}`);
      navigation.navigate('ImagePicker');

    } catch (e) {
      console.error('Saving error:', e);
      alert('Failed to save model. Please try again.');
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
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Create Model</Text>
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
