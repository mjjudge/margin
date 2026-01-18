// src/ui/components/Card.tsx
import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { styles } from '../styles';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  flat?: boolean;
}

export function Card({ children, style, flat = false }: CardProps) {
  return (
    <View style={[flat ? styles.cardFlat : styles.card, style]}>
      {children}
    </View>
  );
}
