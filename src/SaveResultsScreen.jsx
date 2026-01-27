import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { captureRef } from 'react-native-view-shot';

const SaveResultsScreen = ({ route, navigation }) => {
  // ✅ supports:
  // 1) batchResults (list view)
  // 2) student (single student detail view)
  // 3) legacy finalData (older flow)
  const { batchResults, student, finalData } = route.params || {};

  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef();

  const isBatchView = Array.isArray(batchResults);

  // --------- Helpers ---------
  const safeNumber = (n, fallback = 0) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  };

  const gradeColor = (pct) => (pct >= 70 ? '#4CAF50' : pct >= 40 ? '#FFC107' : '#F44336');

  const makeTimestamp = () => new Date().toLocaleString();

  const toPercent = (score, total) => {
    if (!total || total <= 0) return 0;
    return (score / total) * 100;
  };

  // --------- Batch Computations ---------
  const batchStats = useMemo(() => {
    if (!isBatchView) return null;

    const totalStudents = batchResults.length;

    const scores = batchResults.map((s) => ({
      name: s.studentName || 'Student',
      roll: s.rollNumber || '',
      score: safeNumber(s.totalScore, 0),
      total: safeNumber(s.totalPossible, 0)
    }));

    const percentages = scores.map((s) => toPercent(s.score, s.total));
    const avgPct =
      percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;

    const best = scores.reduce(
      (acc, cur) => {
        const pct = toPercent(cur.score, cur.total);
        return pct > acc.pct ? { ...cur, pct } : acc;
      },
      { name: '-', roll: '', score: 0, total: 0, pct: -1 }
    );

    const worst = scores.reduce(
      (acc, cur) => {
        const pct = toPercent(cur.score, cur.total);
        return pct < acc.pct ? { ...cur, pct } : acc;
      },
      { name: '-', roll: '', score: 0, total: 0, pct: 101 }
    );

    const distribution = {
      good: percentages.filter((p) => p >= 70).length,
      avg: percentages.filter((p) => p >= 40 && p < 70).length,
      low: percentages.filter((p) => p < 40).length
    };

    // ✅ Sort leaderboard by percentage desc + keep originalIndex
    const leaderboard = scores
      .map((s, originalIndex) => ({
        ...s,
        pct: toPercent(s.score, s.total),
        originalIndex
      }))
      .sort((a, b) => b.pct - a.pct);

    return {
      totalStudents,
      avgPct,
      best,
      worst,
      distribution,
      leaderboard
    };
  }, [isBatchView, batchResults]);

  // --------- Single Student Computations ---------
  const singleData = useMemo(() => {
    if (isBatchView) return null;

    const src = student || finalData;
    if (!src) return null;

    const evaluationResults = Array.isArray(src.evaluationResults) ? src.evaluationResults : [];
    const obtainedMarks = safeNumber(src.totalScore, 0);
    const totalMarks = Math.max(1, safeNumber(src.totalPossible, 1));
    const pct = toPercent(obtainedMarks, totalMarks);

    const totalQuestions = evaluationResults.length;
    const correctAnswers = evaluationResults.filter((q) => q?.isCorrect).length;

    const questionDetails = evaluationResults.map((item, index) => {
      const marksObtained = safeNumber(item?.marks, 0);
      const qTotal = Math.max(1, safeNumber(item?.totalMarks, 1));
      const isCorrect = !!item?.isCorrect;

      const status = isCorrect ? 'Correct' : marksObtained > 0 ? 'Partial' : 'Incorrect';
      const statusColor = isCorrect ? '#4CAF50' : marksObtained > 0 ? '#FFC107' : '#F44336';
      const icon = isCorrect ? 'check-circle' : marksObtained > 0 ? 'remove-circle' : 'cancel';

      return {
        id: index + 1,
        question: item?.question || `Question ${index + 1}`,
        marksObtained,
        totalMarks: qTotal,
        status,
        statusColor,
        icon,
        explanation: item?.explanation || 'AI could not generate an explanation for this answer.'
      };
    });

    return {
      studentName: src.studentName || 'Student',
      rollNumber: src.rollNumber || '',
      evaluationResults,
      obtainedMarks,
      totalMarks,
      pct,
      performanceColor: gradeColor(pct),
      totalQuestions,
      correctAnswers,
      questionDetails,
      timestamp: makeTimestamp()
    };
  }, [isBatchView, student, finalData]);

  // --------- PDF Helpers ---------
  const generateStudentPDF = async (stud) => {
    const timestamp = makeTimestamp();

    const evaluationResults = Array.isArray(stud?.evaluationResults) ? stud.evaluationResults : [];
    const obtainedMarks = safeNumber(stud?.totalScore, 0);
    const totalMarks = Math.max(1, safeNumber(stud?.totalPossible, 1));
    const pct = toPercent(obtainedMarks, totalMarks);
    const perfColor = gradeColor(pct);

    const questionDetails = evaluationResults.map((item, index) => {
      const marksObtained = safeNumber(item?.marks, 0);
      const qTotal = Math.max(1, safeNumber(item?.totalMarks, 1));
      const isCorrect = !!item?.isCorrect;

      const status = isCorrect ? 'Correct' : marksObtained > 0 ? 'Partial' : 'Incorrect';
      const statusColor = isCorrect ? '#4CAF50' : marksObtained > 0 ? '#FFC107' : '#F44336';

      return {
        id: index + 1,
        question: item?.question || `Question ${index + 1}`,
        marksObtained,
        totalMarks: qTotal,
        status,
        statusColor,
        explanation: item?.explanation || 'AI could not generate an explanation for this answer.'
      };
    });

    const studentName = stud?.studentName || 'Student';
    const roll = stud?.rollNumber ? ` (${stud.rollNumber})` : '';

    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background-color: #fff; }
            .header { text-align: center; margin-bottom: 24px; }
            .title { font-size: 22px; font-weight: bold; }
            .meta { color: #666; margin-top: 6px; font-size: 13px; }
            .score { margin-top: 10px; font-size: 16px; color: ${perfColor}; font-weight: bold; }
            .q { margin-bottom: 14px; padding: 12px; background: #fff; border-radius: 10px; border-left: 4px solid #3498db; }
            .qTitle { font-weight: bold; margin-bottom: 6px; }
            .qMeta { font-size: 13px; margin-bottom: 6px; }
            .exp { font-size: 13px; line-height: 1.5; color: #333; white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${studentName}${roll} — Evaluation Report</div>
            <div class="meta">Evaluated on: ${timestamp}</div>
            <div class="score">Total Score: ${obtainedMarks}/${totalMarks} (${pct.toFixed(1)}%)</div>
          </div>
    `;

    for (const item of questionDetails) {
      htmlContent += `
        <div class="q">
          <div class="qTitle">Q${item.id}: ${escapeHtml(item.question)}</div>
          <div class="qMeta" style="color:${item.statusColor};">Status: ${item.status}</div>
          <div class="qMeta">Marks: ${item.marksObtained}/${item.totalMarks}</div>
          <div class="exp"><strong>AI Explanation:</strong> ${escapeHtml(item.explanation)}</div>
        </div>
      `;
    }

    htmlContent += `
        </body>
      </html>
    `;

    const fileNameSafe = `${studentName}`.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const rollSafe = `${stud?.rollNumber || ''}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `${fileNameSafe}${rollSafe ? '_' + rollSafe : ''}_Evaluation_${Date.now()}`;

    const options = {
      html: htmlContent,
      fileName,
      directory: Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : RNFS.DocumentDirectoryPath
    };

    const pdf = await RNHTMLtoPDF.convert(options);
    return pdf.filePath;
  };

  const handleShareAllPDFs = async () => {
    if (!isBatchView || !batchResults?.length) {
      Alert.alert('Nothing to share', 'No batch results found.');
      return;
    }

    setSharing(true);
    try {
      Alert.alert('Preparing PDFs', 'Generating PDFs for all students. Please wait...');

      const paths = [];
      for (const stud of batchResults) {
        const p = await generateStudentPDF(stud);
        if (p) paths.push(p);
      }

      if (paths.length === 0) {
        Alert.alert('Error', 'Could not generate PDFs.');
        return;
      }

      const urls = paths.map((p) => (p.startsWith('file://') ? p : `file://${p}`));

      await Share.open({
        title: 'Share Evaluation Reports',
        urls,
        type: 'application/pdf',
        failOnCancel: false
      });
    } catch (err) {
      console.error('Share PDFs error:', err);
      Alert.alert('Error', 'Failed to share PDFs. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleShareScreenshot = async () => {
    try {
      const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.9 });

      await Share.open({
        url: uri,
        type: 'image/jpeg',
        failOnCancel: false
      });
    } catch (error) {
      console.error('Error sharing screenshot:', error);
      Alert.alert('Error', 'Something went wrong while sharing the screenshot.');
    }
  };

  const handleFinish = () => {
    navigation?.popToTop?.();
  };

  const openStudentDetail = (stud) => {
    navigation.push('SaveResultsScreen', { student: stud });
  };

  // --------- Distribution Bars ---------
  const DistributionBars = ({ dist, total }) => {
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

    return (
      <View style={styles.distWrap}>
        <View style={styles.distRow}>
          <Text style={styles.distLabel}>Good (≥70%)</Text>
          <View style={styles.distBarBg}>
            <View style={[styles.distBarFill, { width: `${pct(dist.good)}%`, backgroundColor: '#4CAF50' }]} />
          </View>
          <Text style={styles.distCount}>{dist.good}</Text>
        </View>

        <View style={styles.distRow}>
          <Text style={styles.distLabel}>Average (40–69%)</Text>
          <View style={styles.distBarBg}>
            <View style={[styles.distBarFill, { width: `${pct(dist.avg)}%`, backgroundColor: '#FFC107' }]} />
          </View>
          <Text style={styles.distCount}>{dist.avg}</Text>
        </View>

        <View style={styles.distRow}>
          <Text style={styles.distLabel}>Low (&lt;40%)</Text>
          <View style={styles.distBarBg}>
            <View style={styles.distBarFillWrapper}>
              <View style={[styles.distBarFill, { width: `${pct(dist.low)}%`, backgroundColor: '#F44336' }]} />
            </View>
          </View>
          <Text style={styles.distCount}>{dist.low}</Text>
        </View>
      </View>
    );
  };

  // ---------- Podium (Top 3) ----------
  const Podium = ({ leaderboard, onPressStudent: onPress }) => {
    if (!leaderboard?.length) return null;

    const top3 = leaderboard.slice(0, 3);
    const slots = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd

    const medalIcon = (slotIndex) => (slotIndex === 1 ? 'emoji-events' : slotIndex === 0 ? 'military-tech' : 'workspace-premium');
    const label = (slotIndex) => (slotIndex === 1 ? '1st' : slotIndex === 0 ? '2nd' : '3rd');

    return (
      <View style={styles.podiumCard}>
        <View style={styles.podiumHeader}>
          <View style={styles.chartTitleRow}>
            <Icon name="leaderboard" size={20} color="#111827" />
            <Text style={styles.chartTitle}>Top Performers</Text>
          </View>
        </View>

        <View style={styles.podiumRow}>
          {slots.map((s, idx) => {
            if (!s) return <View key={idx} style={styles.podiumSlot} />;

            const c = gradeColor(s.pct);
            const big = idx === 1; // middle is 1st

            return (
              <TouchableOpacity
                key={`${s.roll || s.name}-${idx}`}
                style={[styles.podiumSlot, big && styles.podiumSlotBig]}
                activeOpacity={0.85}
                onPress={() => onPress(batchResults[s.originalIndex])}
              >
                <View style={[styles.podiumBadge, { borderColor: c }]}>
                  <Icon name={medalIcon(idx)} size={18} color={c} />
                  <Text style={[styles.podiumLabel, { color: c }]}>{label(idx)}</Text>
                </View>

                <Text style={styles.podiumName} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={styles.podiumRoll} numberOfLines={1}>
                  {s.roll ? `Roll: ${s.roll}` : '—'}
                </Text>

                <View style={[styles.podiumPctPill, { backgroundColor: c }]}>
                  <Text style={styles.podiumPctText}>{s.pct.toFixed(1)}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // ---------- Mini Graph (Batch) ----------
  const StudentsBarChart = ({ leaderboard, onPressStudent: onPress }) => {
    if (!leaderboard?.length) return null;

    const maxPct = Math.max(...leaderboard.map((s) => s.pct || 0), 1);

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <Icon name="show-chart" size={20} color="#111827" />
            <Text style={styles.chartTitle}>Batch Graph</Text>
          </View>
          <Text style={styles.chartSub}>Tap a bar to open student</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
          {leaderboard.map((s, i) => {
            const heightPct = Math.max(12, Math.round((s.pct / maxPct) * 100));
            const c = gradeColor(s.pct);

            return (
              <TouchableOpacity
                key={`${s.roll || s.name}-${i}`}
                activeOpacity={0.85}
                onPress={() => onPress(batchResults[s.originalIndex])}
                style={styles.chartItem}
              >
                <View style={styles.chartBarBg}>
                  <View style={[styles.chartBarFill, { height: `${heightPct}%`, backgroundColor: c }]} />
                </View>
                <Text style={[styles.chartPct, { color: c }]}>{s.pct.toFixed(0)}%</Text>
                <Text style={styles.chartName} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={styles.chartRoll} numberOfLines={1}>
                  {s.roll ? `#${s.roll}` : '—'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // --------- Render Guards ---------
  if (isBatchView && !batchStats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isBatchView && !singleData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No result data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isBatchView ? (
        <>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="groups" size={56} color="#3498db" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.titleText}>Batch Results</Text>
              <Text style={styles.timestamp}>Evaluated on: {makeTimestamp()}</Text>
            </View>
          </View>

          {/* Overview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overview</Text>

            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{batchStats.totalStudents}</Text>
                <Text style={styles.overviewLabel}>Students</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{batchStats.avgPct.toFixed(1)}%</Text>
                <Text style={styles.overviewLabel}>Average</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{batchStats.best.pct.toFixed(1)}%</Text>
                <Text style={styles.overviewLabel}>Best</Text>
              </View>
            </View>

            <View style={styles.bestWorst}>
              <View style={styles.bestWorstItem}>
                <Icon name="emoji-events" size={18} color="#4CAF50" />
                <Text style={styles.bestWorstText} numberOfLines={1}>
                  {batchStats.best.name}
                  {batchStats.best.roll ? ` (${batchStats.best.roll})` : ''} — {batchStats.best.score}/{batchStats.best.total}
                </Text>
              </View>
              <View style={styles.bestWorstItem}>
                <Icon name="warning" size={18} color="#F44336" />
                <Text style={styles.bestWorstText} numberOfLines={1}>
                  {batchStats.worst.name}
                  {batchStats.worst.roll ? ` (${batchStats.worst.roll})` : ''} — {batchStats.worst.score}/{batchStats.worst.total}
                </Text>
              </View>
            </View>
          </View>

          {/* ✅ Cool sections */}
          <Podium leaderboard={batchStats.leaderboard} />
          <StudentsBarChart leaderboard={batchStats.leaderboard} />

          {/* Distribution */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Performance Distribution</Text>
            <DistributionBars dist={batchStats.distribution} total={batchStats.totalStudents} />
          </View>

          {/* Leaderboard */}
          <Text style={styles.sectionTitle}>Students</Text>
          <View style={styles.listWrap}>
            {batchStats.leaderboard.map((s, idx) => {
              const c = gradeColor(s.pct);
              return (
                <TouchableOpacity
                  key={`${s.roll || s.name}-${idx}`}
                  style={styles.studentRow}
                  onPress={() => openStudentDetail(batchResults[s.originalIndex])}
                  activeOpacity={0.8}
                >
                  <View style={styles.studentLeft}>
                    <View style={[styles.rankBadge, { borderColor: c }]}>
                      <Text style={[styles.rankText, { color: c }]}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentRowName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Text style={styles.studentRowSub} numberOfLines={1}>
                        {s.roll ? `Roll: ${s.roll}` : '—'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.studentRight}>
                    <Text style={[styles.studentPct, { color: c }]}>{s.pct.toFixed(1)}%</Text>
                    <Text style={styles.studentMarks}>
                      {s.score}/{s.total}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton, sharing && styles.disabledBtn]}
              onPress={handleShareAllPDFs}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="share" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Share Results (PDFs)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.finishButton]} onPress={handleFinish}>
              <Icon name="done-all" size={20} color="#fff" />
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="account-circle" size={60} color="#3498db" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.studentName}>{singleData.studentName}</Text>
              <Text style={styles.timestamp}>Evaluated on: {singleData.timestamp}</Text>
              {!!singleData.rollNumber && <Text style={styles.rollInline}>Roll: {singleData.rollNumber}</Text>}
            </View>
          </View>

          {/* Performance */}
          <View style={styles.card}>
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceText}>Overall Performance</Text>
              <View style={[styles.performanceCircle, { borderColor: singleData.performanceColor }]}>
                <Text style={[styles.performancePercentage, { color: singleData.performanceColor }]}>
                  {singleData.pct.toFixed(1)}%
                </Text>
              </View>
              <Text style={styles.performanceLabel}>Score</Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Icon name="check" size={24} color="#4CAF50" />
                <Text style={styles.statValue}>{singleData.correctAnswers}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="close" size={24} color="#F44336" />
                <Text style={styles.statValue}>{singleData.totalQuestions - singleData.correctAnswers}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="star" size={24} color="#FFC107" />
                <Text style={styles.statValue}>
                  {singleData.obtainedMarks}/{singleData.totalMarks}
                </Text>
                <Text style={styles.statLabel}>Marks</Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <Text style={styles.sectionTitle}>Question Details</Text>
          <View style={styles.resultsTable}>
            {singleData.questionDetails.map((item) => (
              <View key={item.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Q.{item.id}</Text>
                  <View style={styles.questionStatus}>
                    <Icon name={item.icon} size={20} color={item.statusColor} />
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
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
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round((item.marksObtained / item.totalMarks) * 100)}%`,
                          backgroundColor: item.statusColor
                        }
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.explainBox}>
                  <Text style={styles.explainTitle}>AI Explanation</Text>
                  <Text style={styles.explainText}>{item.explanation}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Detail Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShareScreenshot}>
              <Icon name="share" size={20} color="#fff" />
              <Text style={styles.buttonText}>Share Screenshot</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.finishButton]} onPress={handleFinish}>
              <Icon name="done-all" size={20} color="#fff" />
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </ViewShot>
      )}
    </ScrollView>
  );
};

// Basic HTML escape for PDF
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f8f9fa'
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  avatarPlaceholder: {
    marginRight: 14
  },
  headerTextContainer: {
    flex: 1
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2c3e50'
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  rollInline: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 2
  },
  timestamp: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34495e',
    marginBottom: 10
  },

  // Overview
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2c3e50'
  },
  overviewLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4
  },
  bestWorst: {
    marginTop: 12
  },
  bestWorstItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  bestWorstText: {
    marginLeft: 8,
    color: '#2c3e50',
    fontSize: 13,
    flex: 1
  },

  // Distribution
  distWrap: { gap: 10 },
  distRow: { flexDirection: 'row', alignItems: 'center' },
  distLabel: { width: 118, fontSize: 12, color: '#34495e' },
  distBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 10
  },
  distBarFill: { height: '100%', borderRadius: 8 },
  distBarFillWrapper: { flex: 1, height: '100%' },
  distCount: { width: 24, textAlign: 'right', fontSize: 12, color: '#34495e' },

  // List
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34495e',
    marginVertical: 12
  },
  listWrap: { marginBottom: 8 },
  studentRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fff'
  },
  rankText: { fontWeight: '800' },
  studentRowName: { fontSize: 15, fontWeight: '700', color: '#2c3e50' },
  studentRowSub: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  studentRight: { alignItems: 'flex-end' },
  studentPct: { fontSize: 15, fontWeight: '800' },
  studentMarks: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },

  // Single student
  performanceContainer: { alignItems: 'center', marginVertical: 6 },
  performanceText: { fontSize: 16, fontWeight: '700', color: '#34495e', marginBottom: 10 },
  performanceCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  performancePercentage: { fontSize: 24, fontWeight: 'bold' },
  performanceLabel: { fontSize: 14, color: '#7f8c8d' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 10 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#2c3e50', marginVertical: 4 },
  statLabel: { fontSize: 12, color: '#7f8c8d' },

  // Question cards
  resultsTable: { marginBottom: 10 },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  questionNumber: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  questionStatus: { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 13, fontWeight: '700', marginLeft: 6 },
  questionText: { fontSize: 14, color: '#34495e', marginBottom: 10 },
  marksContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marksText: { fontSize: 13, color: '#7f8c8d' },
  progressBar: {
    flex: 1,
    height: 7,
    backgroundColor: '#ecf0f1',
    borderRadius: 7,
    marginLeft: 10,
    overflow: 'hidden'
  },
  progressFill: { height: '100%', borderRadius: 7 },
  explainBox: {
    marginTop: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF'
  },
  explainTitle: { fontSize: 12, fontWeight: '800', color: '#007AFF', marginBottom: 6 },
  explainText: { fontSize: 13, color: '#2d3436', lineHeight: 18 },

  // Buttons
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  shareButton: { backgroundColor: '#9b59b6' },
  finishButton: { backgroundColor: '#3498db' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800', marginLeft: 8 },
  disabledBtn: { opacity: 0.7 },

  // --- Cool Graph / Podium ---
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  chartHeader: { marginBottom: 10 },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  chartSub: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  chartScroll: { paddingVertical: 6, gap: 10 },
  chartItem: { width: 72, alignItems: 'center', marginRight: 10 },
  chartBarBg: {
    width: 26,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#eef2f7',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 3
  },
  chartBarFill: { width: '100%', borderRadius: 12 },
  chartPct: { marginTop: 8, fontSize: 12, fontWeight: '900' },
  chartName: { marginTop: 4, fontSize: 11, fontWeight: '700', color: '#111827', maxWidth: 70 },
  chartRoll: { marginTop: 2, fontSize: 10, color: '#6b7280', maxWidth: 70 },

  podiumCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  podiumHeader: { marginBottom: 12 },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  podiumSlot: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, alignItems: 'center' },
  podiumSlotBig: { backgroundColor: '#f1f5ff', transform: [{ scale: 1.04 }] },
  podiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff'
  },
  podiumLabel: { fontSize: 12, fontWeight: '900' },
  podiumName: { marginTop: 10, fontSize: 13, fontWeight: '800', color: '#111827', maxWidth: 110 },
  podiumRoll: { marginTop: 2, fontSize: 11, color: '#6b7280' },
  podiumPctPill: { marginTop: 10, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  podiumPctText: { color: '#fff', fontWeight: '900', fontSize: 12 }
});

export default SaveResultsScreen;
