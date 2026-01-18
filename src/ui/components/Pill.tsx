// src/ui/components/Pill.tsx
import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { styles } from '../styles';

interface PillProps {
  label: string;
  style?: StyleProp<ViewStyle>;
}

export function Pill({ label, style }: PillProps) {
  return (
    <View style={[styles.pill, style]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}
