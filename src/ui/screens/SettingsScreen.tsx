import { View, Text, Pressable, Alert } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Spacer } from '../components';
import { useAuth } from '../../data/auth';

export default function SettingsScreen({ navigation }: any) {
  const { session, signOut, loading } = useAuth();

  const handleExport = () => {
    // TODO: Implement export
    console.log('Export data');
  };

  const handleSync = () => {
    // TODO: Implement sync
    console.log('Sync now');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign out', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
            }
          }
        },
      ]
    );
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
            {session ? (
              <>
                <Text style={styles.body2}>{session.user.email}</Text>
                <Spacer size="s4" />
                <Button 
                  label={loading ? 'Signing out...' : 'Sign out'} 
                  variant="text" 
                  onPress={handleSignOut}
                  disabled={loading}
                />
              </>
            ) : (
              <Text style={styles.body2}>Not signed in</Text>
            )}
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
