import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const ModelDetailsScreen = ({ route }) => {
  const { modelData } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{modelData.name}</Text>
      <Text style={styles.subheader}>Saved: {modelData.createdAt.toLocaleString()}</Text>
      <FlatList
        data={modelData.data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <Text style={styles.label}>Pair {index + 1}:</Text>
            <Text>Question: {item.question}</Text>
            <Text>Answer: {item.answer}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subheader: { fontSize: 16, color: '#666', marginBottom: 16 },
  item: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default ModelDetailsScreen;
