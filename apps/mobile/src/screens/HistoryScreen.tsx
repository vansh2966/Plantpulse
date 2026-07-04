import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import api from '../services/api';
import { ScanHistoryItem, ScanHistoryResponse } from '@plantpulse/shared/types/prediction';
import { Trash2, Leaf } from 'lucide-react-native';

const HistoryScreen = ({ navigation }: any) => {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get<ScanHistoryResponse>('/scans');
      setScans(response.data.scans);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Scan', 'Are you sure you want to delete this scan?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/scans/${id}`);
            setScans(prev => prev.filter(scan => scan.id !== id));
          } catch (error) {
            console.error('Failed to delete scan:', error);
            Alert.alert('Error', 'Failed to delete scan.');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ScanDetail', { scan: item })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage} />
      )}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.class_name.replace("___", " - ").replace(/_/g, " ")}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <Trash2 color="#ef4444" size={20} />
          </TouchableOpacity>
        </View>
        <Text style={styles.date}>{new Date(item.timestamp).toLocaleDateString()}</Text>
        
        <View style={styles.confidenceRow}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${Math.round(item.confidence * 100)}%`, backgroundColor: item.confidence > 0.75 ? '#10b981' : '#f59e0b' }
              ]} 
            />
          </View>
          <Text style={styles.confidenceText}>{Math.round(item.confidence * 100)}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Scan History</Text>
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : scans.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconContainer}>
            <Leaf color="#10b981" size={48} />
          </View>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>Upload a photo from the Home screen to get your first crop diagnosis!</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={fetchHistory}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 16,
  },
  list: {
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155',
  },
  image: {
    width: 100,
    height: 100,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: '#0f172a',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  date: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
});

export default HistoryScreen;
