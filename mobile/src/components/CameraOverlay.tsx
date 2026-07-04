import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const CameraOverlay: React.FC = () => {
  const scanAreaSize = width * 0.7;

  return (
    <View style={styles.overlay}>
      {/* Top opacity */}
      <View style={[styles.dimmer, { height: (height - scanAreaSize) / 2 }]} />
      
      <View style={styles.middleRow}>
        {/* Left opacity */}
        <View style={[styles.dimmer, { width: (width - scanAreaSize) / 2 }]} />
        
        {/* Clear center area */}
        <View style={[styles.scanArea, { width: scanAreaSize, height: scanAreaSize }]}>
          {/* Corner markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>Center leaf in frame</Text>
          </View>
        </View>
        
        {/* Right opacity */}
        <View style={[styles.dimmer, { width: (width - scanAreaSize) / 2 }]} />
      </View>
      
      {/* Bottom opacity */}
      <View style={[styles.dimmer, { height: (height - scanAreaSize) / 2 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  dimmer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
  },
  scanArea: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#10b981', // emerald-500
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default CameraOverlay;
