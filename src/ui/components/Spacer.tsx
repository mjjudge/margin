// src/ui/components/Spacer.tsx
import React from 'react';
import { View } from 'react-native';
import { theme } from '../theme';

type SpaceKey = keyof typeof theme.space;

interface SpacerProps {
  size?: SpaceKey;
  height?: number;
}

export function Spacer({ size = 's4', height }: SpacerProps) {
  const h = height ?? theme.space[size];
  return <View style={{ height: h }} />;
}
