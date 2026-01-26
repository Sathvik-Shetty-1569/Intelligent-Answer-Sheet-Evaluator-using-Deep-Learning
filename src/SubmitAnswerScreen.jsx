import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { db } from '../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import colabServerService from './services/colabServerService';

const SubmitAnswerScreen = ({ route, navigation }) => {
  const { modelId, students = [] } = route.params || {};
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [modelData, setModelData] = useState(null);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const selectedStudent = students.length > 0 ? students[selectedStudentIndex] : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ModelRef = doc(db, 'models', modelId);
        const ModelSnap = await getDoc(ModelRef);

        if (ModelSnap.exists()) {
          setModelData(ModelSnap.data());
        } else {
          console.warn('No document found for modelId:', modelId);
        }
      } catch (error) {
        console.error('Error fetching model data:', error);
      }
    };

    fetchData();
  }, [modelId]);
  
  const cleanAnswerText = (text) => {
    if (!text) return '';
    return text
      .replace(/\r?\n|\r/g, ' ')     // Remove new lines
      .replace(/\s+/g, ' ')          // Replace multiple spaces with single space
      .replace(/^[^\w]+/, '')        // Remove starting punctuation/non-word chars
      .trim();
  };

  const toggleExpand = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const compareAnswersWithAI = async (studentAnswer, modelAnswer, maxMark) => {
    try {
      // Use your custom Colab-hosted fine-tuned model
      return await colabServerService.compareAnswers(studentAnswer, modelAnswer, maxMark);
    } catch (error) {
      console.error('Colab server comparison error:', error);
      return {
        awardedMarks: 0,
        explanation: 'Model server unavailable, defaulted to 0 marks.'
      };
    }
  };

  // Submit answers to Firestore
  const submitAnswers = async () => {
    if (!Array.isArray(modelData?.data)) {
      Alert.alert('Error', 'Invalid model data structure');
      return;
    }
    if (!selectedStudent) {
      Alert.alert('Error', 'No student selected');
      return;
    }
    if (!modelData) {
      Alert.alert('Error', 'Model data not loaded yet');
      return;
    }
    if (!students.length) {
      Alert.alert('Error', 'No student data found');
      return;
    }
    
    setLoading(true);
    try {
      // Create an array to store evaluation results
      const evaluationResults = [];
      const qaDict = selectedStudent.qa_dict;

      // Compare each question in the student's answers with the model data
      for (const [studentQuestionKey, studentAnswer] of Object.entries(qaDict)) {
        try {
          // Find the matching question...
          let matchedQuestion = modelData.data.find((q) => q.question.trim().toLowerCase() === studentQuestionKey.trim().toLowerCase());

          if (!matchedQuestion) continue;

          // Clean answers
          const cleanedStudentAnswer = cleanAnswerText(studentAnswer);
          const cleanedModelAnswer = cleanAnswerText(matchedQuestion.answer);

          let evaluation;
          if (cleanedStudentAnswer.toLowerCase() === cleanedModelAnswer.toLowerCase()) {
            evaluation = {
              awardedMarks: parseInt(matchedQuestion.mark),
              explanation: 'Perfect match with model answer.'
            };
          } else {
            evaluation = await compareAnswersWithAI(
              cleanedStudentAnswer,
              cleanedModelAnswer,
              parseInt(matchedQuestion.mark)
            );
          }

          evaluationResults.push({
            question: matchedQuestion.question,
            studentQuestion: studentQuestionKey,
            studentAnswer: cleanedStudentAnswer,
            correctAnswer: cleanedModelAnswer,
            isCorrect: evaluation.awardedMarks === parseInt(matchedQuestion.mark),
            explanation: evaluation.explanation,
            marks: evaluation.awardedMarks,
            totalMarks: parseInt(matchedQuestion.mark)
          });
        } catch (error) {
          console.error(`Error processing question "${studentQuestionKey}":`, error);
          continue;
        }
      }

      // Calculate total score
      const totalScore = evaluationResults.reduce(
        (sum, result) => sum + result.marks, 
        0
      );
      const totalPossible = evaluationResults.reduce(
        (sum, result) => sum + (parseFloat(result.totalMarks) || 0),
        0
      );

      const finalData = {
        evaluationResults,
        totalScore,
        totalPossible,
        studentName: selectedStudent.student_name,
        rollNumber: selectedStudent.roll_number,
      };

      navigation.navigate('SaveResultsScreen', { finalData });
    } catch (error) {
      console.error('Error evaluating answers:', error);
      Alert.alert('Error', 'Failed to evaluate answers');
    } finally {
      setLoading(false);
    }
  };
  

  const qaDict = students[selectedStudentIndex]?.qa_dict || {};
  const answerCount = Object.keys(qaDict).length;

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.heading}>Review Answers</Text>
          <Text style={styles.subtitle}>
            {students.length > 0 
              ? `${students.length} student${students.length > 1 ? 's' : ''} loaded`
              : 'No students found'}
          </Text>
        </View>

        {/* Student Selector */}
        {students.length > 0 && (
          <View style={styles.studentSection}>
            <Text style={styles.sectionTitle}>Select Student</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.studentSelector}
            >
              {students.map((student, index) => (
                <TouchableOpacity
                  key={`student-${index}`}
                  style={[
                    styles.studentCard,
                    index === selectedStudentIndex && styles.activeStudentCard
                  ]}
                  onPress={() => setSelectedStudentIndex(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.studentCardContent}>
                    <View style={[
                      styles.studentAvatar,
                      index === selectedStudentIndex && styles.activeStudentAvatar
                    ]}>
                      <Text style={[
                        styles.studentAvatarText,
                        index === selectedStudentIndex && styles.activeStudentAvatarText
                      ]}>
                        {student.student_name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <Text 
                      style={[
                        styles.studentName, 
                        index === selectedStudentIndex && styles.activeStudentName
                      ]}
                      numberOfLines={1}
                    >
                      {student.student_name}
                    </Text>
                    <Text style={[
                      styles.rollNumber, 
                      index === selectedStudentIndex && styles.activeRoll
                    ]}>
                      {student.roll_number}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Answers Section */}
        {selectedStudent && (
          <View style={styles.answersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Student Answers</Text>
              <View style={styles.answerCountBadge}>
                <Text style={styles.answerCountText}>{answerCount}</Text>
              </View>
            </View>

            {answerCount > 0 ? (
              Object.entries(qaDict).map(([questionKey, answer], pairIndex) => {
                const cardKey = `${selectedStudentIndex}-${pairIndex}`;
                const isExpanded = expandedItems[cardKey];

                return (
                  <View key={cardKey} style={styles.card}>
                    <TouchableOpacity
                      style={styles.cardHeader}
                      onPress={() => toggleExpand(cardKey)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.questionNumber}>
                          <Text style={styles.questionNumberText}>{pairIndex + 1}</Text>
                        </View>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {questionKey}
                        </Text>
                      </View>
                      <Icon 
                        name={isExpanded ? "expand-less" : "expand-more"} 
                        size={24} 
                        color="#636e72" 
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.cardContent}>
                        <View style={styles.answerContainer}>
                          <View style={styles.answerLabelContainer}>
                            <Icon name="description" size={16} color="#007AFF" />
                            <Text style={styles.textLabel}>Answer</Text>
                          </View>
                          <Text style={styles.textContent}>
                            {cleanAnswerText(answer) || 'No answer provided'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Icon name="inbox" size={48} color="#b2bec3" />
                <Text style={styles.emptyStateText}>No answers found</Text>
                <Text style={styles.emptyStateSubtext}>
                  This student hasn't submitted any answers yet.
                </Text>
              </View>
            )}
          </View>
        )}

        {!selectedStudent && students.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={48} color="#b2bec3" />
            <Text style={styles.emptyStateText}>No students loaded</Text>
            <Text style={styles.emptyStateSubtext}>
              Please upload student answer PDFs first.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {selectedStudent && answerCount > 0 && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={submitAnswers}
            disabled={loading || !modelData}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="assessment" size={22} color="#fff" />
                <Text style={styles.submitButtonText}>Evaluate Answers</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#636e72',
    textAlign: 'center',
  },
  studentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  answerCountBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  answerCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  studentSelector: {
    paddingVertical: 4,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 100,
  },
  activeStudentCard: {
    backgroundColor: '#007AFF',
    shadowOpacity: 0.2,
    elevation: 5,
  },
  studentCardContent: {
    padding: 14,
    alignItems: 'center',
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStudentAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  studentAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
  },
  activeStudentAvatarText: {
    color: '#fff',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
    textAlign: 'center',
    maxWidth: 100,
  },
  activeStudentName: {
    color: '#fff',
  },
  rollNumber: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
  },
  activeRoll: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  answersSection: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    flex: 1,
    lineHeight: 20,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  answerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  answerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  textLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textContent: {
    fontSize: 14,
    color: '#2d3436',
    lineHeight: 22,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f4f6f8',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#b2bec3',
    shadowOpacity: 0,
    elevation: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SubmitAnswerScreen;