import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';
import ViewShot from "react-native-view-shot";
import { captureRef } from "react-native-view-shot";
import { useRef } from "react";



const SaveResultsScreen = ({ route }) => {
  const { finalData, croppedPairs } = route.params;
  const {
    evaluationResults = [],
    totalScore: obtainedMarks = 0,
    totalPossible: totalMarks = 1,
    studentName = 'Student'
  } = finalData;
  const viewShotRef = useRef();

  // Calculate metrics
  const totalQuestions = evaluationResults.length;
  const correctAnswers = evaluationResults.filter(q => q.isCorrect).length;
  const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(1);
  const timestamp = new Date().toLocaleString();
  const performanceColor = percentage >= 70 ? '#4CAF50' : percentage >= 40 ? '#FFC107' : '#F44336';

  // Enhanced question details with icons
  const questionDetails = evaluationResults.map((item, index) => ({
    id: index + 1,
    question: item.question || `Question ${index + 1}`,
    marksObtained: item.marks,
    totalMarks: item.totalMarks,
    status: item.isCorrect ? 'Correct' : item.marks > 0 ? 'Partial' : 'Incorrect',
    statusColor: item.isCorrect ? '#4CAF50' : item.marks > 0 ? '#FFC107' : '#F44336',
    icon: item.isCorrect ? 'check-circle' : item.marks > 0 ? 'remove-circle' : 'cancel',
    image: croppedPairs?.[index] || null,
    explanation: item.explanation || 'AI could not generate an explanation for this answer.' // fallback

  }));

  const generatePDF = async () => {
  try {
    let htmlContent = `
      <html>
        <head>
          <style>
            body {
               font-family: Arial, sans-serif;
    padding: 20px;
    background-color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .student-name {
              font-size: 24px;
              font-weight: bold;
            }
            .timestamp {
              color: #666;
              margin-bottom: 10px;
            }
            .score {
              font-size: 18px;
              color: ${performanceColor};
              margin-bottom: 30px;
            }
            .question {
    margin-bottom: 25px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 8px;
    border-left: 4px solid #3498db;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
            .question-title {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 8px;
            }
            .question-status {
              margin-bottom: 6px;
              font-size: 14px;
            }
            .question-marks {
              margin-bottom: 10px;
              font-size: 14px;
            }
            .question-explanation {
              margin-top: 10px;
              font-size: 14px;
              line-height: 1.5;
              word-wrap: break-word;
    white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="student-name">${studentName}'s Evaluation Report</div>
            <div class="timestamp">Evaluated on: ${timestamp}</div>
            <div class="score">
              Total Score: ${obtainedMarks}/${totalMarks} (${percentage}%)
            </div>
          </div>
    `;

    for (const item of questionDetails) {
      htmlContent += `
        <div class="question">
          <div class="question-title">
            Question ${item.id}: ${item.question}
          </div>
          <div class="question-status" style="color: ${item.statusColor}">
            Status: ${item.status}
          </div>
          <div class="question-marks">
            Marks: ${item.marksObtained}/${item.totalMarks}
          </div>
          ${
            item.explanation
              ? `<div class="question-explanation">
                   <strong>AI Explanation:</strong> ${item.explanation}
                 </div>`
              : ''
          }
        </div>
      `;
    }

    htmlContent += `
        </body>
      </html>
    `;

    const options = {
      html: htmlContent,
      fileName: `${studentName.replace(/\s+/g, '_')}_Evaluation_${Date.now()}`,
      directory:
        Platform.OS === 'android'
          ? RNFS.ExternalDirectoryPath
          : RNFS.DocumentDirectoryPath,
    };

    const pdf = await RNHTMLtoPDF.convert(options);
    return pdf.filePath;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

  const handleDownload = async () => {
    try {
      Alert.alert('Generating PDF', 'Please wait while we prepare your report...');
      console.log('Cropped image paths:', croppedPairs);

      const pdfPath = await generatePDF();
      
      Alert.alert(
        'PDF Ready',
        'Your evaluation report has been generated successfully.',
        [
          {
            text: 'Open PDF',
            onPress: () => {
              FileViewer.open(pdfPath)
              .then(() => console.log('PDF opened successfully'))
              .catch(error => {
                console.error('Error opening PDF:', error);
                Alert.alert('Error', 'Could not open PDF file. You can find it in your documents folder.', [{ text: 'OK' }]);
              });
            },
          },
          {
            text: 'OK',
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to generate PDF. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleShareScreenshot = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
      });
  
      await Share.open({
        url: uri,
        type: 'image/jpeg',
        failOnCancel: false
      });
    } catch (error) {
      console.error("Error sharing screenshot:", error);
      Alert.alert("Error", "Something went wrong while sharing the screenshot.");
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
       <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarPlaceholder}>
          <Icon name="account-circle" size={60} color="#3498db" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.timestamp}>Evaluated on: {timestamp}</Text>
        </View>
      </View>

      {/* Performance Overview */}
<View style={styles.card}>
      <View style={styles.performanceContainer}>
        <Text style={styles.performanceText}>Overall Performance</Text>
        <View style={[styles.performanceCircle, { borderColor: performanceColor }]}>
          <Text style={[styles.performancePercentage, { color: performanceColor }]}>
            {percentage}%
          </Text>
        </View>
        <Text style={styles.performanceLabel}>Score</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Icon name="check" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{correctAnswers}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="close" size={24} color="#F44336" />
          <Text style={styles.statValue}>{totalQuestions - correctAnswers}</Text>
          <Text style={styles.statLabel}>Incorrect</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="star" size={24} color="#FFC107" />
          <Text style={styles.statValue}>{obtainedMarks}/{totalMarks}</Text>
          <Text style={styles.statLabel}>Marks</Text>
        </View>
      </View>
      </View>

      {/* Detailed Results */}
      <Text style={styles.sectionTitle}>Question Details</Text>
      <View style={styles.resultsTable}>
        {questionDetails.map((item) => (
          <View key={item.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>Q.{item.id}</Text>
              <View style={styles.questionStatus}>
                <Icon name={item.icon} size={20} color={item.statusColor} />
                <Text style={[styles.statusText, { color: item.statusColor }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.questionText} numberOfLines={2} ellipsizeMode="tail">
              {item.question}
            </Text>
            <View style={styles.marksContainer}>
              <Text style={styles.marksText}>
                Marks: {item.marksObtained}/{item.totalMarks}
              </Text>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { 
                    width: `${(item.marksObtained / item.totalMarks) * 100}%`,
                    backgroundColor: item.statusColor
                  }
                ]} />
              </View>
            </View>
          </View>
        ))}
      </View>
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.downloadButton]}
          onPress={handleDownload}
        >
          <Icon name="cloud-download" size={20} color="#fff" />
          <Text style={styles.buttonText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShareScreenshot}
        >
          <Icon name="share" size={20} color="#fff" />
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  timestamp: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  performanceContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  performanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 10,
  },
  performanceCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  performancePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  performanceLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginVertical: 15,
    paddingLeft: 10,
  },
  resultsTable: {
    marginBottom: 20,
  },
  card:{
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 7,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,

  }, 
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  questionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  questionText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 12,
  },
  marksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marksText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginLeft: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '48%',
  },
  downloadButton: {
    backgroundColor: '#3498db',
  },
  shareButton: {
    backgroundColor: '#9b59b6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SaveResultsScreen;