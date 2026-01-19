import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Spacer, Pill } from '../components';
import { meaningRepo } from '../../data/repos/meaningRepo';
import type { MeaningCategory } from '../../domain/models';

const CATEGORIES: { key: MeaningCategory; label: string }[] = [
  { key: 'meaningful', label: 'Meaningful' },
  { key: 'joyful', label: 'Joyful' },
  { key: 'painful_significant', label: 'Painful but significant' },
  { key: 'empty_numb', label: 'Empty / numbed' },
];

export default function LogMomentScreen({ route, navigation }: any) {
  // Support edit mode if entryId passed
  const entryId: string | undefined = route?.params?.entryId;
  const initialCategory: MeaningCategory | undefined = route?.params?.category;
  const initialText: string | undefined = route?.params?.text;
  const initialTags: string[] | undefined = route?.params?.tags;

  const [category, setCategory] = useState<MeaningCategory | null>(initialCategory ?? null);
  const [text, setText] = useState(initialText ?? '');
  const [tagsInput, setTagsInput] = useState(initialTags?.join(', ') ?? '');
  const [saving, setSaving] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load existing tags for suggestions
  useEffect(() => {
    meaningRepo.getTagCounts().then(tagCounts => {
      setExistingTags(tagCounts.slice(0, 12).map(tc => tc.tag));
    }).catch(() => {});
  }, []);

  // Get current tags from input
  const currentTags = tagsInput
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  // Filter suggestions: exclude already-entered tags
  const suggestions = existingTags.filter(tag => !currentTags.includes(tag));

  const addTag = (tag: string) => {
    if (currentTags.includes(tag)) return;
    const newTags = [...currentTags, tag];
    setTagsInput(newTags.join(', '));
  };

  const isEdit = Boolean(entryId);
  const canSave = category !== null && !saving;

  const handleSave = async () => {
    if (!canSave || !category) return;
    
    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      if (isEdit && entryId) {
        await meaningRepo.update(entryId, { category, text: text || undefined, tags });
      } else {
        await meaningRepo.create({ category, text: text || undefined, tags });
      }
      navigation.navigate('Home');
    } catch (err) {
      console.error('[LogMomentScreen] Save failed:', err);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Fixed header with Cancel and Save buttons */}
        <View style={[
          styles.content, 
          { 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingHorizontal: theme.layout.screenPaddingX,
            paddingVertical: theme.space.s3,
            backgroundColor: theme.color.bg,
            borderBottomWidth: 1,
            borderBottomColor: theme.color.border,
          }
        ]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
          <Pressable onPress={handleSave} disabled={!canSave} hitSlop={theme.hit.slop}>
            <Text style={[styles.link, !canSave && { opacity: 0.4 }]}>
              {saving ? 'Saving...' : (isEdit ? 'Update' : 'Save')}
            </Text>
          </Pressable>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: theme.layout.screenPaddingX, paddingBottom: theme.space.s10 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.h2}>{isEdit ? 'Edit entry' : 'Log a moment'}</Text>
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
              onFocus={() => {
                // Scroll to ensure the input is visible above keyboard
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                }, 100);
              }}
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
            {suggestions.length > 0 && (
              <>
                <Spacer size="s3" />
                <Text style={styles.hint}>Tap to add:</Text>
                <Spacer size="s2" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.s2 }}>
                  {suggestions.slice(0, 8).map(tag => (
                    <Pressable key={tag} onPress={() => addTag(tag)}>
                      <Pill label={`#${tag}`} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </Card>
        </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
