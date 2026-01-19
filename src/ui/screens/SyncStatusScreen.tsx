import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Spacer } from '../components';
import { getDb } from '../../data/db';
import { getSyncState } from '../../domain/sync/syncStateRepo';
import type { SyncTable } from '../../domain/sync/syncTypes';

interface TableInfo {
  table: SyncTable;
  displayName: string;
  lastSyncAt?: string;
  localCount: number;
}

export default function SyncStatusScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<TableInfo[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      
      // Get sync state and counts for each table
      const tables: SyncTable[] = ['meaning_entries', 'practice_sessions'];
      const info: TableInfo[] = [];
      
      for (const table of tables) {
        const syncState = await getSyncState(table);
        
        // Get local row count (excluding soft-deleted)
        const countResult = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${table} WHERE deleted_at IS NULL`
        );
        
        info.push({
          table,
          displayName: table === 'meaning_entries' ? 'Entries' : 'Sessions',
          lastSyncAt: syncState.lastSyncAt,
          localCount: countResult?.count ?? 0,
        });
      }
      
      setTableInfo(info);
      setLastError(null);
    } catch (err) {
      console.error('[SyncStatusScreen] Load failed:', err);
      setLastError('Could not load sync status');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  const formatTime = (isoString?: string): string => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={[styles.screenPadded, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
          <ActivityIndicator size="large" color={theme.color.accent} />
          <Spacer size="s4" />
          <Text style={styles.body2}>Loading sync status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.layout.screenPaddingX }}>
        <View style={styles.content}>
          <View style={styles.sectionTight}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
              <Text style={styles.link}>Back</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.h2}>Sync Status</Text>
            <Text style={styles.body2}>Internal diagnostics for debugging.</Text>
          </View>

          {tableInfo.map(info => (
            <View key={info.table} style={styles.section}>
              <Card>
                <Text style={styles.title}>{info.displayName}</Text>
                <Spacer size="s4" />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.body2}>Local rows</Text>
                  <Text style={styles.body}>{info.localCount}</Text>
                </View>
                <Spacer size="s2" />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.body2}>Last sync</Text>
                  <Text style={styles.body}>{formatTime(info.lastSyncAt)}</Text>
                </View>
              </Card>
            </View>
          ))}

          {lastError && (
            <View style={styles.section}>
              <Card style={{ backgroundColor: theme.color.surface }}>
                <Text style={styles.title}>Last Error</Text>
                <Spacer size="s3" />
                <Text style={styles.body2}>{lastError}</Text>
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <Card flat>
              <Text style={styles.hint}>
                Sync happens automatically when the app opens and when you pull to refresh on the Map or Entries screens.
              </Text>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
