import { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Button, Pill, Spacer } from '../components';
import { practicesRepo } from '../../data/repos/practicesRepo';
import { sessionsRepo } from '../../data/repos/sessionsRepo';
import type { Practice, PracticeSession } from '../../domain/models';

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PracticeScreen({ route, navigation }: any) {
  const practiceId: string | undefined = route?.params?.practiceId;

  const [practice, setPractice] = useState<Practice | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(180);

  const initSession = useCallback(async () => {
    if (!practiceId) {
      console.error('[PracticeScreen] No practiceId provided');
      setLoading(false);
      return;
    }

    try {
      const p = await practicesRepo.getById(practiceId);
      if (!p) {
        console.error('[PracticeScreen] Practice not found:', practiceId);
        setLoading(false);
        return;
      }
      setPractice(p);
      setSecondsLeft(p.duration_seconds ?? 180);

      // Create session on start
      const newSession = await sessionsRepo.create(practiceId);
      setSession(newSession);
      setIsRunning(true);
    } catch (err) {
      console.error('[PracticeScreen] Failed to init session:', err);
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Timer effect
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [isRunning, secondsLeft]);

  const handleFinish = async () => {
    if (session) {
      await sessionsRepo.complete(session.id);
    }
    navigation.navigate('PostPractice', { sessionId: session?.id });
  };

  const handleExit = async () => {
    if (session) {
      await sessionsRepo.abandon(session.id);
    }
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={[styles.screenPadded, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.color.accent} />
        <Spacer size="s4" />
        <Text style={styles.body2}>Starting practice...</Text>
      </View>
    );
  }

  if (!practice) {
    return (
      <View style={styles.screenPadded}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.h2}>Practice not found</Text>
            <Text style={styles.body2}>Something went wrong.</Text>
            <Spacer size="s6" />
            <Button label="Go back" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </View>
    );
  }

  const total = practice.duration_seconds ?? 180;

  return (
    <View style={styles.screenPadded}>
      <View style={styles.content}>
        <View style={[styles.sectionTight, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Button label="Exit" variant="text" onPress={handleExit} />
          <Pill label={practice.mode} />
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.title}>Practice</Text>
            <Spacer size="s4" />
            <Text style={styles.h2}>{practice.title}</Text>
            <Spacer size="s4" />
            <Text style={styles.body}>{practice.instruction}</Text>
            <Spacer size="s7" />

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.h2}>{formatMMSS(secondsLeft)}</Text>
              <Spacer size="s4" />
              <Text style={styles.hint}>The timer is optional. You can finish whenever you want.</Text>
            </View>

            <Spacer size="s6" />
            <View style={{ flexDirection: 'row', gap: theme.space.s4, justifyContent: 'center' }}>
              <Button
                label={isRunning ? 'Pause' : 'Resume'}
                onPress={() => setIsRunning(r => !r)}
                style={{ minWidth: 140 }}
              />
              <Button
                label="Reset"
                onPress={() => { setIsRunning(false); setSecondsLeft(total); }}
                style={{ minWidth: 140 }}
              />
            </View>

            <Spacer size="s8" />
            <Button label="Finish" onPress={handleFinish} />
            <Spacer size="s4" />
            <Button label="Back" variant="text" onPress={handleExit} />
          </View>
        </View>

        <View style={styles.sectionTight}>
          <Text style={styles.hint}>If attention drifts, return gently. Nothing to achieve.</Text>
        </View>
      </View>
    </View>
  );
}
