import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity, ShieldAlert, FlaskConical } from 'lucide-react-native';
import type { TreatmentAdvice } from '../../../../shared/types/prediction';

interface AdvicePanelProps {
  advice: TreatmentAdvice;
}

const AdvicePanel: React.FC<AdvicePanelProps> = ({ advice }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Treatment Guide</Text>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Organic Treatment</Text>
        </View>
        {advice.organic.map((item, index) => (
          <Text key={index} style={styles.itemText}>• {item}</Text>
        ))}
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FlaskConical size={20} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Chemical Treatment</Text>
        </View>
        {advice.chemical.map((item, index) => (
          <Text key={index} style={styles.itemText}>• {item}</Text>
        ))}
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ShieldAlert size={20} color="#f59e0b" />
          <Text style={styles.sectionTitle}>Prevention</Text>
        </View>
        {advice.prevention.map((item, index) => (
          <Text key={index} style={styles.itemText}>• {item}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
    paddingLeft: 28,
  },
});

export default AdvicePanel;
