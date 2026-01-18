import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Spacer } from '../components';

export default function SettingsScreen({ navigation }: any) {
  const handleExport = () => {
    // TODO: Implement export
    console.log('Export data');
  };

  const handleSync = () => {
    // TODO: Implement sync
    console.log('Sync now');
  };

  return (
    <View style={styles.screenPadded}>
      <View style={styles.content}>
        <View style={styles.sectionTight}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Data</Text>
            <Spacer size="s4" />
            <Button label="Export data (JSON)" onPress={handleExport} />
            <Spacer size="s4" />
            <Button label="Sync now" variant="text" onPress={handleSync} />
          </Card>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Account</Text>
            <Spacer size="s4" />
            <Text style={styles.body2}>Not signed in</Text>
            <Spacer size="s4" />
            <Button label="Sign in" onPress={() => { /* TODO */ }} />
          </Card>
        </View>

        <View style={styles.section}>
          <Card flat>
            <Text style={styles.title}>About</Text>
            <Spacer size="s4" />
            <Text style={styles.body2}>Margin v1.0.0</Text>
            <Spacer size="s2" />
            <Text style={styles.hint}>
              A tool for noticing attention and observing meaning patterns.
            </Text>
          </Card>
        </View>
      </View>
    </View>
  );
}
