import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Spacer } from '../components';
import type { MeaningCategory } from '../../domain/models';

const CATEGORIES: { key: MeaningCategory; label: string }[] = [
  { key: 'meaningful', label: 'Meaningful' },
  { key: 'joyful', label: 'Joyful' },
  { key: 'painful_significant', label: 'Painful but significant' },
  { key: 'empty_numb', label: 'Empty / numbed' },
];

export default function LogMomentScreen({ navigation }: any) {
  const [category, setCategory] = useState<MeaningCategory | null>(null);
  const [text, setText] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const canSave = category !== null;

  const handleSave = () => {
    if (!canSave) return;
    // TODO: Save to repo
    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
    console.log('Saving entry:', { category, text, tags });
    navigation.navigate('Home');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: theme.layout.screenPaddingX }}>
      <View style={styles.content}>
        <View style={styles.sectionTight}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Log a moment</Text>
          <Text style={styles.body2}>What showed up today? Category required, everything else optional.</Text>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Category</Text>
            <Spacer size="s4" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.s2 }}>
              {CATEGORIES.map(c => (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[
                    styles.pill,
                    category === c.key && { backgroundColor: theme.color.accent, borderColor: theme.color.accent },
                  ]}
                >
                  <Text style={[styles.pillText, category === c.key && { color: theme.color.surface }]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Note (optional)</Text>
            <Spacer size="s4" />
            <TextInput
              style={[styles.body, { 
                borderWidth: 1, 
                borderColor: theme.color.border, 
                borderRadius: theme.radius.sm,
                padding: theme.space.s3,
                minHeight: 80,
                textAlignVertical: 'top',
              }]}
              placeholder="A few words..."
              placeholderTextColor={theme.color.text3}
              value={text}
              onChangeText={setText}
              maxLength={280}
              multiline
            />
            <Spacer size="s2" />
            <Text style={styles.hint}>{280 - text.length} characters left</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Tags (optional)</Text>
            <Spacer size="s4" />
            <TextInput
              style={[styles.body, { 
                borderWidth: 1, 
                borderColor: theme.color.border, 
                borderRadius: theme.radius.sm,
                padding: theme.space.s3,
              }]}
              placeholder="work, morning, quiet..."
              placeholderTextColor={theme.color.text3}
              value={tagsInput}
              onChangeText={setTagsInput}
            />
            <Spacer size="s2" />
            <Text style={styles.hint}>Separate with commas</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Button label="Save" onPress={handleSave} disabled={!canSave} />
          <Spacer size="s4" />
          <Button label="Cancel" variant="text" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </ScrollView>
  );
}
