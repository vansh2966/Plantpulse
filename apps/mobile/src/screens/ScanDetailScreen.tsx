import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import ConfidenceGauge from '../components/ConfidenceGauge';
import api from '../services/api';

const ScanDetailScreen = ({ route, navigation }: any) => {
  const { scan } = route.params;
  
  if (!scan) {
    navigation.goBack();
    return null;
  }
  
  const displayName = scan.class_name.replace("___", " — ").replace(/_/g, " ");

  const handleDelete = () => {
    Alert.alert('Delete Scan', 'Are you sure you want to delete this scan?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/scans/${scan.id}`);
            navigation.goBack();
          } catch (error) {
            console.error('Failed to delete:', error);
            Alert.alert('Error', 'Failed to delete scan.');
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Details</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        {scan.image_url ? (
          <Image source={{ uri: scan.image_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>

      {/* Disease Name */}
      <Text style={styles.diseaseName}>{displayName}</Text>
      <Text style={styles.timestamp}>
        {new Date(scan.timestamp).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric', 
          hour: '2-digit', minute: '2-digit'
        })}
      </Text>

      {/* Confidence Gauge */}
      <ConfidenceGauge confidence={scan.confidence} />

      {/* Top-K Predictions */}
      {scan.top_k && scan.top_k.length > 0 && (
        <View style={styles.topKContainer}>
          <Text style={styles.topKTitle}>Alternative Predictions</Text>
          {scan.top_k.map((pred: any, index: number) => (
            <View key={pred.class_name} style={styles.topKRow}>
              <Text style={styles.topKLabel}>
                {index + 1}. {pred.class_name.replace("___", " — ").replace(/_/g, " ")}
              </Text>
              <Text style={[
                styles.topKValue, 
                { color: pred.confidence > 0.75 ? '#10b981' : pred.confidence > 0.5 ? '#f59e0b' : '#64748b' }
              ]}>
                {Math.round(pred.confidence * 100)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 16,
  },
  diseaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  topKContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topKTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  topKRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topKLabel: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
    marginRight: 8,
  },
  topKValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ScanDetailScreen;
