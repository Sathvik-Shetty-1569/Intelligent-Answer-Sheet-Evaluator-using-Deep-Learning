import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db } from '../firebaseConfig'; // adjust path
import { collection, getDocs } from 'firebase/firestore';

const SavedModelScreen = ({navigation }) => {
  const [savedModels, setSavedModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModelsFromFirestore = async () => {
      try {
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const modelsCollection = collection(db, 'models');
        const querySnapshot = await getDocs(modelsCollection);
        const models = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()

        })).filter(model => model.data && model.data.length > 0);
        setSavedModels(models);
      } catch (e) {
        console.error('Error fetching models:', e);
        setError('Failed to load models');

      }finally {
        setLoading(false);
      }
    };

    fetchModelsFromFirestore();
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Answerpicker', { modelId: item.id })}
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.subtitle}>Saved: {item.createdAt.toLocaleString()}</Text>
      <Text style={styles.subtitle}>Total Pairs: {item.data.length}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Models</Text>
      <FlatList
        data={savedModels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No saved models found.</Text>}
      />
    </View>
  );
};
export default SavedModelScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  empty: {
    marginTop: 40,
    fontSize: 16,
    textAlign: 'center',
    color: '#999',
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});