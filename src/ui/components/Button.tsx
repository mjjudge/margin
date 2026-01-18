// src/ui/components/Button.tsx
import React from 'react';
import { Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'text';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Button({ 
  label, 
  onPress, 
  variant = 'primary', 
  style,
  disabled = false 
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <Pressable
      style={[
        isPrimary ? styles.buttonPrimary : styles.buttonText,
        disabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={theme.hit.slop}
      android_ripple={isPrimary ? { color: theme.color.border } : undefined}
    >
      <Text style={isPrimary ? styles.buttonPrimaryText : styles.buttonTextLabel}>
        {label}
      </Text>
    </Pressable>
  );
}
