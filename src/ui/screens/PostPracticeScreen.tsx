import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';

export default function PostPracticeScreen({ navigation }: any) {
  return (
    <View style={styles.screenPadded}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.h2}>Done</Text>
          <Text style={styles.body2}>You can log a moment from today, or leave it here.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.title}>Next</Text>
            <View style={styles.spacer6} />

            <Pressable style={styles.buttonPrimary} onPress={() => navigation.navigate('LogMoment')} hitSlop={theme.hit.slop} android_ripple={{ color: theme.color.border }}>
              <Text style={styles.buttonPrimaryText}>Log a moment</Text>
            </Pressable>

            <View style={styles.spacer4} />

            <Pressable style={styles.buttonText} onPress={() => navigation.navigate('Home')} hitSlop={theme.hit.slop}>
              <Text style={styles.buttonTextLabel}>Skip</Text>
            </Pressable>

            <View style={styles.spacer7} />

            <Pressable style={styles.buttonText} onPress={() => navigation.navigate('Map')} hitSlop={theme.hit.slop}>
              <Text style={styles.buttonTextLabel}>View map</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionTight}>
          <Text style={styles.hint}>Logging is optional. Short notes are enough.</Text>
        </View>
      </View>
    </View>
  );
}
