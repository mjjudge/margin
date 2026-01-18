import { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Pill, Spacer } from '../components';
import { meaningRepo } from '../../data/repos/meaningRepo';
import type { MeaningEntry } from '../../domain/models';

const CATEGORY_LABELS: Record<string, string> = {
  meaningful: 'Meaningful',
  joyful: 'Joyful',
  painful_significant: 'Painful but significant',
  empty_numb: 'Empty / numbed',
};

export default function EntriesScreen({ route, navigation }: any) {
  // Optional filter by tags (from cluster tap on Map)
  const filterTags: string[] | undefined = route?.params?.filterTags;

  const [entries, setEntries] = useState<MeaningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      let data = await meaningRepo.getAll();
      
      // Apply tag filter if provided
      if (filterTags && filterTags.length > 0) {
        data = data.filter(entry => {
          const entryTagsLower = entry.tags.map(t => t.toLowerCase().trim());
          return filterTags.every(tag => entryTagsLower.includes(tag.toLowerCase()));
        });
      }
      
      setEntries(data);
    } catch (err) {
      console.error('[EntriesScreen] Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  }, [filterTags]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleEdit = (entry: MeaningEntry) => {
    navigation.navigate('LogMoment', {
      entryId: entry.id,
      category: entry.category,
      text: entry.text,
      tags: entry.tags,
    });
  };

  const handleDelete = (entry: MeaningEntry) => {
    Alert.alert(
      'Delete entry?',
      'This will remove the entry from your log.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await meaningRepo.delete(entry.id);
              setEntries(prev => prev.filter(e => e.id !== entry.id));
            } catch (err) {
              console.error('[EntriesScreen] Delete failed:', err);
              Alert.alert('Error', 'Failed to delete entry.');
            }
          },
        },
      ]
    );
  };

  const renderEntry = ({ item }: { item: MeaningEntry }) => (
    <Card style={{ marginBottom: theme.space.s4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Pill label={CATEGORY_LABELS[item.category] ?? item.category} />
        <Text style={styles.hint}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      {item.text && (
        <>
          <Spacer size="s3" />
          <Text style={styles.body}>{item.text}</Text>
        </>
      )}
      {item.tags.length > 0 && (
        <>
          <Spacer size="s3" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.s2 }}>
            {item.tags.map(tag => (
              <Text key={tag} style={styles.hint}>#{tag}</Text>
            ))}
          </View>
        </>
      )}
      <Spacer size="s4" />
      <View style={{ flexDirection: 'row', gap: theme.space.s3 }}>
        <Pressable onPress={() => handleEdit(item)} hitSlop={theme.hit.slop}>
          <Text style={styles.link}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => handleDelete(item)} hitSlop={theme.hit.slop}>
          <Text style={[styles.link, { color: theme.color.text3 }]}>Delete</Text>
        </Pressable>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.screenPadded, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.color.accent} />
        <Spacer size="s4" />
        <Text style={styles.body2}>Loading entries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenPadded}>
      <View style={styles.content}>
        <View style={styles.sectionTight}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>{filterTags ? 'Filtered Entries' : 'Entries'}</Text>
          <Text style={styles.body2}>
            {filterTags 
              ? `Showing entries with: ${filterTags.map(t => `#${t}`).join(', ')}`
              : "Everything you've logged."}
          </Text>
          {filterTags && (
            <>
              <Spacer size="s3" />
              <Button 
                label="Clear filter" 
                variant="text" 
                onPress={() => navigation.setParams({ filterTags: undefined })} 
              />
            </>
          )}
        </View>

        {entries.length === 0 ? (
          <View style={styles.section}>
            <Card>
              <Text style={styles.body2}>{filterTags ? 'No entries match this filter.' : 'No entries yet.'}</Text>
              <Spacer size="s4" />
              <Button label="Log a moment" onPress={() => navigation.navigate('LogMoment')} />
            </Card>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={item => item.id}
            renderItem={renderEntry}
            contentContainerStyle={{ paddingBottom: theme.space.s8 }}
          />
        )}
      </View>
    </View>
  );
}
