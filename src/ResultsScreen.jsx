import React, { useState } from 'react';
import { View, ScrollView, Image, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { db } from '../firebaseConfig'; // adjust path
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';



const ResultsScreen = ({ route,navigation }) => {
  const { results, isModelAnswer = false } = route.params;
  const [marks, setMarks] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [modelName, setModelName] = useState(''); // State for model name input
  console.log("RESULTS PROP:", results);


  
  const handleMarkChange = (questionKey, value) => {
    setMarks(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

// Add this at the top, after imports
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\n/g, ' ')           // replace newlines with space
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .replace(/^[^a-zA-Z]+/, '')    // remove starting non-letters/punctuation
    .trim();                        // remove leading/trailing spaces
};


  const toggleExpand = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async() => {
    try {
      if (!modelName.trim()) {
        alert('Please enter a model name');
        return;
      }

    const finalData = [];
    
    if (isModelAnswer && results[0]?.qa_dict) {
      // New format: Model answer PDF with cutouts
      const qa_dict = results[0].qa_dict;
      Object.entries(qa_dict).forEach(([questionKey, answer]) => {
        finalData.push({
          question: questionKey,
          answer: cleanText(answer), // <-- cleaned same as display
          mark: parseInt(marks[questionKey] || '0'),
        });
        
      });
    } else {
      // Old format: Image-based with cropped_pairs
      results.forEach((result, resultIndex) => {
        const qaPairs = result.qa_dict ? Object.entries(result.qa_dict) : [];
        result.cropped_pairs.forEach((_, pairIndex) => {
          const key = `${resultIndex}-${pairIndex}`;
          const [question, answer] = qaPairs[pairIndex] || ['N/A', 'N/A'];

          finalData.push({
            question,
            answer,
            mark: parseInt(marks[key] || '0'),
          });
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

  {isModelAnswer && results[0]?.qa_dict ? (
    // New format: display qa_dict text
    Object.entries(results[0].qa_dict).map(([questionKey, answer], index) => (
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
  ) : (
    // Old format: Image-based with cropped_pairs
    results.map((result, resultIndex) => (
      <View key={resultIndex} style={styles.resultBlock}>
        {result.cropped_pairs.map((base64Image, pairIndex) => (
          <View key={pairIndex} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => toggleExpand(`${resultIndex}-${pairIndex}`)}
            >
              <Text style={styles.cardTitle}>
                Question {resultIndex + 1}-{pairIndex + 1}
              </Text>
              <Text style={styles.expandIcon}>
                {expandedItems[`${resultIndex}-${pairIndex}`] ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedItems[`${resultIndex}-${pairIndex}`] && (
              <View style={styles.cardContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Marks:</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#999"
                    value={marks[`${resultIndex}-${pairIndex}`] || ''}
                    onChangeText={(text) =>
                      handleMarkChange(`${resultIndex}-${pairIndex}`, text)
                    }
                  />
                </View>

                <Image
                  source={{ uri: base64Image }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        ))}
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
  resultBlock: {
    marginBottom: 15,
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
  
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 15,
    color: '#555',
    width: 80,
    marginRight: 10,
  },
  dropdownContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dropdown: {
    height: 45,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 10,
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
  buttonContainer: {
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    position: 'absolute',
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