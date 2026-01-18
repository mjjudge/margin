import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PracticeScreen({ navigation }: any) {
  const practice = useMemo(() => ({
    title: 'Five Sounds, No Labels',
    instruction: 'Notice five distinct sounds. For each one, stay with the raw texture of the sound without naming its source.',
    duration_seconds: 180,
    mode: 'perception' as const,
  }), []);

  const total = practice.duration_seconds ?? 180;
  const [isRunning, setIsRunning] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(total);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [isRunning, secondsLeft]);

  return (
    <View style={styles.screenPadded}>
      <View style={styles.content}>
        <View style={[styles.sectionTight, { flexDirection:'row', justifyContent:'space-between', alignItems:'center' }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
            <Text style={styles.link}>Exit</Text>
          </Pressable>
          <View style={styles.pill}><Text style={styles.pillText}>{practice.mode}</Text></View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.title}>Practice</Text>
            <View style={styles.spacer4} />
            <Text style={styles.h2}>{practice.title}</Text>
            <View style={styles.spacer4} />
            <Text style={styles.body}>{practice.instruction}</Text>
            <View style={styles.spacer7} />

            <View style={{ alignItems:'center' }}>
              <Text style={styles.h2}>{formatMMSS(secondsLeft)}</Text>
              <View style={styles.spacer4} />
              <Text style={styles.hint}>The timer is optional. You can finish whenever you want.</Text>
            </View>

            <View style={styles.spacer6} />
            <View style={{ flexDirection:'row', gap:theme.space.s4, justifyContent:'center' }}>
              <Pressable style={[styles.buttonPrimary, { minWidth: 140 }]} onPress={() => setIsRunning(r => !r)} hitSlop={theme.hit.slop} android_ripple={{ color: theme.color.border }}>
                <Text style={styles.buttonPrimaryText}>{isRunning ? 'Pause' : 'Resume'}</Text>
              </Pressable>
              <Pressable style={[styles.buttonPrimary, { minWidth: 140 }]} onPress={() => { setIsRunning(false); setSecondsLeft(total); }} hitSlop={theme.hit.slop} android_ripple={{ color: theme.color.border }}>
                <Text style={styles.buttonPrimaryText}>Reset</Text>
              </Pressable>
            </View>

            <View style={styles.spacer8} />
            <Pressable style={styles.buttonPrimary} onPress={() => navigation.navigate('PostPractice')} hitSlop={theme.hit.slop} android_ripple={{ color: theme.color.border }}>
              <Text style={styles.buttonPrimaryText}>Finish</Text>
            </Pressable>
            <View style={styles.spacer4} />
            <Pressable style={styles.buttonText} onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
              <Text style={styles.buttonTextLabel}>Back</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionTight}>
          <Text style={styles.hint}>If attention drifts, return gently. Nothing to achieve.</Text>
        </View>
      </View>
    </View>
  );
}
