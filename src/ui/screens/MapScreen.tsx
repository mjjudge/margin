import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Spacer } from '../components';

export default function MapScreen({ navigation }: any) {
  // TODO: Compute from meaning_entries via mapStats
  const mockStats = {
    totalEntries: 0,
    byCategory: {
      meaningful: 0,
      joyful: 0,
      painful_significant: 0,
      empty_numb: 0,
    },
    topTags: [] as { tag: string; count: number }[],
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
          <Text style={styles.h2}>Meaning Map</Text>
          <Text style={styles.body2}>Patterns from what you've logged. Descriptive, not prescriptive.</Text>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Categories</Text>
            <Spacer size="s4" />
            {mockStats.totalEntries === 0 ? (
              <Text style={styles.body2}>No entries yet. Log a moment to see patterns.</Text>
            ) : (
              <View style={{ gap: theme.space.s2 }}>
                <Text style={styles.body}>Meaningful: {mockStats.byCategory.meaningful}</Text>
                <Text style={styles.body}>Joyful: {mockStats.byCategory.joyful}</Text>
                <Text style={styles.body}>Painful but significant: {mockStats.byCategory.painful_significant}</Text>
                <Text style={styles.body}>Empty / numbed: {mockStats.byCategory.empty_numb}</Text>
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Tags that show up</Text>
            <Spacer size="s4" />
            {mockStats.topTags.length === 0 ? (
              <Text style={styles.body2}>Tags will appear here once you log with them.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.s2 }}>
                {mockStats.topTags.map(t => (
                  <View key={t.tag} style={styles.pill}>
                    <Text style={styles.pillText}>{t.tag} ({t.count})</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Button label="View all entries" onPress={() => navigation.navigate('Entries')} />
          <Spacer size="s4" />
          <Button label="Log a moment" variant="text" onPress={() => navigation.navigate('LogMoment')} />
        </View>

        <View style={styles.sectionTight}>
          <Text style={styles.hint}>The map shows what tends to appear. It doesn't suggest what should.</Text>
        </View>
      </View>
    </View>
  );
}
