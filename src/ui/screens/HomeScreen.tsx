import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Button, Pill, Spacer } from '../components';
import { bootstrapDb } from '../../data/db';
import { 
  getTodaysPracticeWithSwap, 
  getSwapAlternative, 
  setSwappedPractice,
  hasSwappedToday 
} from '../../domain/dailyPractice';
import type { Practice } from '../../domain/models';

export default function HomeScreen({ navigation }: any) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSwap, setCanSwap] = useState(true);

  const loadPractice = useCallback(async () => {
    setLoading(true);
    try {
      await bootstrapDb();
      const todaysPractice = await getTodaysPracticeWithSwap();
      setPractice(todaysPractice);
      setCanSwap(!hasSwappedToday());
    } catch (err) {
      console.error('[HomeScreen] Failed to load practice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPractice();
  }, [loadPractice]);

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
    <View style={styles.screenPadded}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.h2}>Today</Text>
          <Text style={styles.body2}>A short practice. Completion is enough.</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.title}>Today's practice</Text>
              {canSwap && (
                <Pressable onPress={handleSwap} hitSlop={theme.hit.slop}>
                  <Text style={styles.link}>Swap</Text>
                </Pressable>
              )}
            </View>
            <Spacer size="s4" />
            <Text style={styles.h2}>{practice.title}</Text>
            <Text style={styles.body2}>{practice.instruction}</Text>
            <View style={styles.divider} />
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
          </View>
        </View>
        {practice.contra_notes && (
          <View style={styles.sectionTight}>
            <Text style={styles.hint}>Note: {practice.contra_notes}</Text>
          </View>
        )}
        <View style={styles.sectionTight}>
          <Button label="Settings" variant="text" onPress={() => navigation.navigate('Settings')} />
        </View>
      </View>
    </View>
  );
}
