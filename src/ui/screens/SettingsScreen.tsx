import { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Spacer } from '../components';
import { useAuth } from '../../data/auth';
import { exportDataToJSON } from '../../domain/export';
import { deleteAccountData } from '../../domain/account';
import { getFragmentsEnabled, setFragmentsEnabled } from '../hooks';

export default function SettingsScreen({ navigation }: any) {
  const { session, signOut, loading } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fragmentsEnabled, setFragmentsEnabledState] = useState(true);

  // Load fragments setting on mount
  useEffect(() => {
    getFragmentsEnabled().then(setFragmentsEnabledState);
  }, []);

  const handleToggleFragments = async (value: boolean) => {
    setFragmentsEnabledState(value);
    await setFragmentsEnabled(value);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportDataToJSON();
      if (!result.success) {
        Alert.alert('Export failed', result.error || 'Unknown error');
      }
    } catch (err) {
      Alert.alert('Export failed', String(err));
    } finally {
      setExporting(false);
    }
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete all data?',
      'This will permanently remove all your entries, sessions, and local data. This cannot be undone.\n\nYour account will remain but all data will be gone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all data',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    // Second confirmation for safety
    Alert.alert(
      'Are you sure?',
      'All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const result = await deleteAccountData();
            setDeleting(false);
            
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to delete data');
            }
            // If successful, user will be signed out and redirected automatically
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Fixed header with Back button only */}
      <View style={[
        styles.content, 
        { 
          paddingHorizontal: theme.layout.screenPaddingX,
          paddingVertical: theme.space.s3,
          backgroundColor: theme.color.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.color.border,
        }
      ]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.layout.screenPaddingX }}>
        <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.h2}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Data</Text>
            <Spacer size="s4" />
            <Button 
              label={exporting ? 'Exporting...' : 'Export data (JSON)'} 
              onPress={handleExport}
              disabled={exporting}
            />
            <Spacer size="s3" />
            <Pressable onPress={() => navigation.navigate('SyncStatus')} hitSlop={theme.hit.slop}>
              <Text style={styles.link}>Sync status</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <Card>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Found notes</Text>
                <Spacer size="s2" />
                <Text style={styles.hint}>
                  Occasionally surfaces short reflections after practice.
                </Text>
              </View>
              <Switch
                value={fragmentsEnabled}
                onValueChange={handleToggleFragments}
                trackColor={{ 
                  false: theme.color.border, 
                  true: theme.color.accent 
                }}
                thumbColor={theme.color.surface}
              />
            </View>
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
                <Spacer size="s3" />
                <Pressable onPress={handleDeleteAccount} disabled={deleting} hitSlop={theme.hit.slop}>
                  <Text style={[styles.link, { color: theme.color.warn }]}>
                    {deleting ? 'Deleting...' : 'Delete all data'}
                  </Text>
                </Pressable>
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
            <Spacer size="s4" />
            <Pressable onPress={() => navigation.navigate('Philosophy')} hitSlop={theme.hit.slop}>
              <Text style={styles.link}>Philosophy</Text>
            </Pressable>
          </Card>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
  );
}
