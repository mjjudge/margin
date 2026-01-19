import { useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Pill, Spacer } from '../components';
import { meaningRepo } from '../../data/repos/meaningRepo';
import { computeMapStats, computeClusters, filterEntriesByTimeWindow, type MapStats, type Cluster, type TimeWindow } from '../../domain/map';
import { runFullSync } from '../../domain/sync';

const CATEGORY_LABELS: Record<string, string> = {
  meaningful: 'Meaningful',
  joyful: 'Joyful',
  painful_significant: 'Painful but significant',
  empty_numb: 'Empty / numbed',
};

const TIME_WINDOWS: { key: TimeWindow; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
];

export default function MapScreen({ navigation }: any) {
  const [stats, setStats] = useState<MapStats | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const [allEntries, setAllEntries] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const entries = await meaningRepo.getAll();
      setAllEntries(entries);
      const filtered = filterEntriesByTimeWindow(entries, timeWindow);
      const mapStats = computeMapStats(filtered);
      const tagClusters = computeClusters(filtered);
      setStats(mapStats);
      setClusters(tagClusters);
    } catch (err) {
      console.error('[MapScreen] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);

  // Recompute when time window changes
  const handleTimeWindowChange = useCallback((window: TimeWindow) => {
    setTimeWindow(window);
    const filtered = filterEntriesByTimeWindow(allEntries, window);
    const mapStats = computeMapStats(filtered);
    const tagClusters = computeClusters(filtered);
    setStats(mapStats);
    setClusters(tagClusters);
  }, [allEntries]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runFullSync();
      await loadData();
    } catch (err) {
      console.error('[MapScreen] Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleClusterPress = (cluster: Cluster) => {
    navigation.navigate('Entries', { filterTags: cluster.tags });
  };

  if (loading) {
    return (
      <View style={[styles.screenPadded, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.color.accent} />
        <Spacer size="s4" />
        <Text style={styles.body2}>Loading map...</Text>
      </View>
    );
  }

  const totalEntries = stats?.totalEntries ?? 0;

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

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: theme.layout.screenPaddingX }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.color.text3}
          />
        }
      >
        <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.h2}>Meaning Map</Text>
          <Text style={styles.body2}>Patterns from what you've logged. Descriptive, not prescriptive.</Text>
          <Spacer size="s4" />
          <View style={{ flexDirection: 'row', gap: theme.space.s2 }}>
            {TIME_WINDOWS.map(tw => (
              <Pressable
                key={tw.key}
                onPress={() => handleTimeWindowChange(tw.key)}
                style={[
                  styles.pill,
                  timeWindow === tw.key && { backgroundColor: theme.color.accent, borderColor: theme.color.accent },
                ]}
              >
                <Text style={[styles.pillText, timeWindow === tw.key && { color: theme.color.surface }]}>
                  {tw.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Categories</Text>
            <Spacer size="s4" />
            {totalEntries === 0 ? (
              <Text style={styles.body2}>No entries yet. Log a moment to see patterns.</Text>
            ) : (
              <View style={{ gap: theme.space.s2 }}>
                {Object.entries(stats!.byCategory).map(([cat, count]) => (
                  <Text key={cat} style={styles.body}>
                    {CATEGORY_LABELS[cat] ?? cat}: {count}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Tags that show up</Text>
            <Spacer size="s4" />
            {(stats?.topTags.length ?? 0) === 0 ? (
              <Text style={styles.body2}>Tags will appear here once you log with them.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.s2 }}>
                {stats!.topTags.map(t => (
                  <Pill key={t.tag} label={`${t.tag} (${t.count})`} />
                ))}
              </View>
            )}
          </Card>
        </View>

        {clusters.length > 0 && (
          <View style={styles.section}>
            <Card>
              <Text style={styles.title}>Tags that tend to appear together</Text>
              <Spacer size="s4" />
              <View style={{ gap: theme.space.s3 }}>
                {clusters.map(cluster => (
                  <Pressable
                    key={cluster.id}
                    onPress={() => handleClusterPress(cluster)}
                    style={{
                      padding: theme.space.s3,
                      backgroundColor: theme.color.surface,
                      borderRadius: theme.radius.sm,
                      borderWidth: 1,
                      borderColor: theme.color.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.s2 }}>
                      {cluster.tags.map(tag => (
                        <Text key={tag} style={styles.body}>#{tag}</Text>
                      ))}
                    </View>
                    <Spacer size="s2" />
                    <Text style={styles.hint}>
                      {cluster.entryCount} {cluster.entryCount === 1 ? 'entry' : 'entries'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </View>
        )}

        {(stats?.tagNetMeaning.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Card>
              <Text style={styles.title}>Tag associations</Text>
              <Spacer size="s2" />
              <Text style={styles.hint}>How tags tend to associate with meaning categories</Text>
              <Spacer size="s4" />
              <View style={{ gap: theme.space.s2 }}>
                {stats!.tagNetMeaning.slice(0, 5).map(t => (
                  <View key={t.tag} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.body}>#{t.tag}</Text>
                    <Text style={[styles.body, { color: t.netMeaning >= 0 ? theme.color.accent : theme.color.text3 }]}>
                      {t.netMeaning >= 0 ? '+' : ''}{t.netMeaning}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Button label="View all entries" onPress={() => navigation.navigate('Entries')} />
          <Spacer size="s4" />
          <Button label="Log a moment" variant="text" onPress={() => navigation.navigate('LogMoment')} />
        </View>

          <View style={styles.sectionTight}>
            <Text style={styles.hint}>The map shows what tends to appear. It doesn't suggest what should.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
