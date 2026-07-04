import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const ProfileScreen = () => {
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.email?.[0].toUpperCase() || 'U'}
          </Text>
        </View>
        
        <Text style={styles.emailText}>{user?.email}</Text>
        <Text style={styles.uidText}>ID: {user?.uid}</Text>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // slate-950
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // emerald-500/20
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981', // emerald-400
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  uidText: {
    fontSize: 12,
    color: '#64748b', // slate-500
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)', // rose-500/10
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    width: '100%',
    alignItems: 'center',
  },
  signOutText: {
    color: '#fb7185', // rose-400
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
