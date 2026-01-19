import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles';
import { theme } from '../theme';
import { Button, Spacer, FoundFragmentCard } from '../components';
import { useFragment } from '../hooks';
import type { MeaningCategory } from '../../domain/models';

const QUICK_CATEGORIES: { key: MeaningCategory; label: string }[] = [
  { key: 'meaningful', label: 'Meaningful' },
  { key: 'joyful', label: 'Joyful' },
  { key: 'painful_significant', label: 'Painful but significant' },
  { key: 'empty_numb', label: 'Empty / numbed' },
];

export default function PostPracticeScreen({ route, navigation }: any) {
  const sessionId: string | undefined = route?.params?.sessionId;
  const { fragment, dismiss, checkForFragment } = useFragment();

  // Check for fragment when screen mounts (after practice completion)
  useEffect(() => {
    checkForFragment();
  }, [checkForFragment]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={[styles.screenPadded, { paddingTop: 0 }]}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.h2}>Done</Text>
          <Text style={styles.body2}>You can log a moment from today, or leave it here.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.title}>Log a moment</Text>
            <Spacer size="s3" />
            <Text style={styles.body2}>What showed up?</Text>
            <Spacer size="s4" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.s2 }}>
              {QUICK_CATEGORIES.map(c => (
                <Pressable
                  key={c.key}
                  onPress={() => navigation.navigate('LogMoment', { sessionId, category: c.key })}
                  style={styles.pill}
                >
                  <Text style={styles.pillText}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <Spacer size="s5" />
            <Button 
              label="Skip" 
              variant="text" 
              onPress={() => navigation.navigate('Home')} 
            />
            <Spacer size="s2" />
            <Button 
              label="View map" 
              variant="text" 
              onPress={() => navigation.navigate('Map')} 
            />
          </View>
        </View>

          <View style={styles.sectionTight}>
            <Text style={styles.hint}>Logging is optional. Short notes are enough.</Text>
          </View>
        </View>
      </View>

      {/* Found Fragment overlay */}
      {fragment && (
        <FoundFragmentCard text={fragment.text} onDismiss={dismiss} />
      )}
    </SafeAreaView>
  );
}
