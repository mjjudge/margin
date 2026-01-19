import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Button, Pill, Spacer } from '../components';
import { bootstrapDb } from '../../data/db';
import { 
  getTodaysPracticeWithSwap, 
  getSwapAlternative, 
  setSwappedPractice,
  hasSwappedToday,
  getTodayDateStr,
  clearSwapState
} from '../../domain/dailyPractice';
import { useSyncOnForeground } from '../../domain/sync';
import type { Practice } from '../../domain/models';

// Logo
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Logo = require('../assets/margin_logo.png');

export default function HomeScreen({ navigation }: any) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSwap, setCanSwap] = useState(true);
  
  // Track the date we loaded for, to detect day changes
  const loadedDateRef = useRef<string | null>(null);

  // Trigger sync on mount and foreground
  useSyncOnForeground();

  const loadPractice = useCallback(async () => {
    const today = getTodayDateStr();
    
    // If the day changed since we last loaded, clear swap state
    if (loadedDateRef.current && loadedDateRef.current !== today) {
      clearSwapState();
    }
    
    setLoading(true);
    try {
      await bootstrapDb();
      const todaysPractice = await getTodaysPracticeWithSwap();
      setPractice(todaysPractice);
      setCanSwap(!hasSwappedToday());
      loadedDateRef.current = today;
    } catch (err) {
      console.error('[HomeScreen] Failed to load practice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload practice when screen comes into focus (handles day changes)
  useFocusEffect(
    useCallback(() => {
      loadPractice();
    }, [loadPractice])
  );

  const handleSwap = async () => {
    if (!practice || !canSwap) return;
    
    const alternative = await getSwapAlternative(practice.id);
    if (alternative) {
      setSwappedPractice(alternative.id);
      setPractice(alternative);
      setCanSwap(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screenPadded, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.color.accent} />
        <Spacer size="s4" />
        <Text style={styles.body2}>Loading...</Text>
      </View>
    );
  }

  if (!practice) {
    return (
      <View style={styles.screenPadded}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.h2}>No practices available</Text>
            <Text style={styles.body2}>Something went wrong loading practices.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={[styles.screenPadded, { paddingTop: 0 }]}>
        <View style={styles.content}>
          <View style={styles.screenHeader}>
            <Text style={styles.kicker}>Today</Text>
            <Text style={styles.h2}>Margin</Text>
            <Text style={styles.body2}>A short practice. Completion is enough.</Text>
          </View>
        <View style={styles.section}>
          <View style={styles.cardHero}>
            <View style={styles.rowBetween}>
              <Text style={styles.subtleTitle}>Today's practice</Text>
              {canSwap && (
                <Pressable onPress={handleSwap} hitSlop={theme.hit.slop}>
                  <Text style={styles.link}>Swap</Text>
                </Pressable>
              )}
            </View>
            <Spacer size="s4" />
            <Text style={styles.h2}>{practice.title}</Text>
            <Text style={styles.body2}>{practice.instruction}</Text>
            <View style={styles.dividerSoft} />
            <View style={{ flexDirection: 'row', gap: theme.space.s3, flexWrap: 'wrap' }}>
              <Pill label={`${Math.round((practice.duration_seconds ?? 180) / 60)} min`} />
              <Pill label={practice.mode} />
              {practice.difficulty > 2 && <Pill label={`Difficulty ${practice.difficulty}`} />}
            </View>
            <Spacer size="s6" />
            <Button 
              label="Start" 
              onPress={() => navigation.navigate('Practice', { practiceId: practice.id })} 
            />
            <Spacer size="s4" />
            <Button label="View map" variant="text" onPress={() => navigation.navigate('Map')} />
            <Spacer size="s2" />
            <Button label="Quick log" variant="text" onPress={() => navigation.navigate('LogMoment')} />
          </View>
        </View>
        {practice.contra_notes && (
          <View style={styles.sectionTight}>
            <Text style={styles.hint}>Note: {practice.contra_notes}</Text>
          </View>
        )}
          <View style={[styles.section, { alignItems: 'center' }]}>
            <Image 
              source={Logo} 
              style={{ 
                width: 72, 
                height: 72, 
                opacity: 0.15,
              }} 
              resizeMode="contain"
            />
          </View>
          <View style={styles.sectionTight}>
            <Button label="Settings" variant="text" onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
