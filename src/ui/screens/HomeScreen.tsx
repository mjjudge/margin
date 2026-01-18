import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';

export default function HomeScreen({ navigation }: any) {
  const todaysPractice = { title:'Five Sounds, No Labels', instruction:'Notice five distinct sounds. For each one, stay with the raw texture of the sound without naming its source.', duration_seconds:180, mode:'perception' };
  return (
    <View style={styles.screenPadded}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.h2}>Today</Text>
          <Text style={styles.body2}>A short practice. Completion is enough.</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.title}>Today’s practice</Text>
            <View style={styles.spacer4} />
            <Text style={styles.h2}>{todaysPractice.title}</Text>
            <Text style={styles.body2}>{todaysPractice.instruction}</Text>
            <View style={styles.divider} />
            <View style={{ flexDirection:'row', gap:theme.space.s3, flexWrap:'wrap' }}>
              <View style={styles.pill}><Text style={styles.pillText}>{Math.round((todaysPractice.duration_seconds??180)/60)} min</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>{todaysPractice.mode}</Text></View>
            </View>
            <View style={styles.spacer6} />
            <Pressable style={styles.buttonPrimary} onPress={() => navigation.navigate('Practice')} hitSlop={theme.hit.slop} android_ripple={{ color: theme.color.border }}>
              <Text style={styles.buttonPrimaryText}>Start</Text>
            </Pressable>
            <View style={styles.spacer4} />
            <Pressable style={styles.buttonText} onPress={() => navigation.navigate('Map')} hitSlop={theme.hit.slop}>
              <Text style={styles.buttonTextLabel}>View map</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.sectionTight}>
          <Pressable style={styles.buttonText} onPress={() => navigation.navigate('Settings')} hitSlop={theme.hit.slop}>
            <Text style={styles.buttonTextLabel}>Settings</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
