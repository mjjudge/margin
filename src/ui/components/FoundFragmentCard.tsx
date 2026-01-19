// src/ui/components/FoundFragmentCard.tsx
// A "found note" - like something tucked in a secondhand book.
// Warm, tactile, precious, accidentally discovered.
// Voice is never shown. No labels. Just the text and a way to dismiss.

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { theme } from '../theme';

interface FoundFragmentCardProps {
  text: string;
  onDismiss: () => void;
}

/**
 * A fragment card with parchment/scroll aesthetic.
 * 
 * Design intent:
 * - Warm, aged paper feel (not clinical white)
 * - Subtle texture through color and shadow
 * - Torn/rough edges suggested through asymmetric styling
 * - Centered text with generous breathing room
 * - Single tap anywhere dismisses (no "X" button)
 * - No metadata shown (voice, date, progress)
 */
export function FoundFragmentCard({ text, onDismiss }: FoundFragmentCardProps) {
  // Fade in on mount
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const handlePress = () => {
    // Fade out then dismiss
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View style={[localStyles.container, { opacity }]}>
      <Pressable onPress={handlePress} style={localStyles.pressable}>
        <View style={localStyles.parchment}>
          {/* Subtle top edge texture */}
          <View style={localStyles.edgeTop} />
          
          <View style={localStyles.content}>
            <Text style={localStyles.text}>{text}</Text>
          </View>
          
          {/* Subtle bottom edge texture */}
          <View style={localStyles.edgeBottom} />
          
          {/* Gentle dismiss hint */}
          <Text style={localStyles.hint}>tap to continue</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = Math.min(screenWidth - 48, 340);

const localStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // subtle veil
    zIndex: 100,
  },
  pressable: {
    width: cardWidth,
    maxWidth: '90%',
  },
  parchment: {
    backgroundColor: '#FAF6ED', // warm cream / aged paper
    borderRadius: 4, // deliberately not rounded - paper doesn't curve
    paddingVertical: theme.space.s7,
    paddingHorizontal: theme.space.s6,
    
    // Layered shadow for depth + age
    shadowColor: '#5C4A32',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    
    // Subtle border like paper edge
    borderWidth: 1,
    borderColor: '#E8DFD0',
    
    // Very slight rotation for "casually placed" feel
    transform: [{ rotate: '-0.5deg' }],
  },
  edgeTop: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#F0E8DA', // slightly darker strip at top
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  edgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: '#EDE4D4',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  content: {
    alignItems: 'center',
    paddingVertical: theme.space.s6,
  },
  text: {
    fontFamily: theme.type.family.regular,
    fontSize: theme.type.size.lg, // bumped up for readability
    lineHeight: theme.type.line.xl, // generous line height
    color: '#3D3428', // warm dark brown (ink on old paper)
    textAlign: 'center',
    fontStyle: 'normal',
    letterSpacing: 0.3,
  },
  hint: {
    fontFamily: theme.type.family.regular,
    fontSize: theme.type.size.xs,
    color: '#A89B88', // muted, doesn't demand attention
    textAlign: 'center',
    marginTop: theme.space.s4,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});

export default FoundFragmentCard;
