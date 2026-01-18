import { View, Text } from 'react-native';
import { styles } from '../styles';
import { Button, Spacer } from '../components';

export default function PostPracticeScreen({ route, navigation }: any) {
  const sessionId: string | undefined = route?.params?.sessionId;

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
            <Spacer size="s6" />

            <Button 
              label="Log a moment" 
              onPress={() => navigation.navigate('LogMoment', { sessionId })} 
            />

            <Spacer size="s4" />

            <Button 
              label="Skip" 
              variant="text" 
              onPress={() => navigation.navigate('Home')} 
            />

            <Spacer size="s7" />

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
  );
}
