import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ConfidenceGaugeProps {
  confidence: number;
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  
  let color = '#10b981'; // emerald-500
  let label = 'High Confidence';
  
  if (confidence < 0.75) {
    color = '#f43f5e'; // rose-500
    label = 'Low Confidence';
  } else if (confidence < 0.90) {
    color = '#f59e0b'; // amber-500
    label = 'Moderate Confidence';
  }

  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const center = radius + strokeWidth;

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(percentage, {
      duration: 1500,
      easing: Easing.out(Easing.exp),
    });
  }, [percentage, animatedValue]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (animatedValue.value / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.gaugeContainer}>
        <Svg width={center * 2} height={center * 2}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            <Circle
              stroke="rgba(255, 255, 255, 0.1)"
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedCircle
              stroke={color}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              fill="none"
            />
          </G>
        </Svg>
        <View style={styles.textContainer}>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
      </View>
      <View style={[styles.labelBadge, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <Text style={[styles.labelText, { color }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  labelBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConfidenceGauge;
