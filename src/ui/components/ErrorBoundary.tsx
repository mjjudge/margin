// src/ui/components/ErrorBoundary.tsx
// Catches React errors and shows a minimal, non-dramatic fallback

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging (sanitized)
    logger.error('ErrorBoundary', 'Component error caught', {
      errorName: error.name,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={[styles.screenPadded, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.body2}>Something went wrong.</Text>
          <View style={{ height: theme.space.s4 }} />
          <Pressable onPress={this.handleReset} hitSlop={theme.hit.slop}>
            <Text style={styles.link}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
