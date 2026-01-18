import { View, Text, Pressable, FlatList } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Pill, Spacer } from '../components';
import type { MeaningEntry } from '../../domain/models';

const CATEGORY_LABELS: Record<string, string> = {
  meaningful: 'Meaningful',
  joyful: 'Joyful',
  painful_significant: 'Painful but significant',
  empty_numb: 'Empty / numbed',
};

export default function EntriesScreen({ navigation }: any) {
  // TODO: Load from meaningRepo
  const entries: MeaningEntry[] = [];

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
    </Card>
  );

  return (
    <View style={styles.screenPadded}>
      <View style={styles.content}>
        <View style={styles.sectionTight}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Entries</Text>
          <Text style={styles.body2}>Everything you've logged.</Text>
        </View>

        {entries.length === 0 ? (
          <View style={styles.section}>
            <Card>
              <Text style={styles.body2}>No entries yet.</Text>
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
