import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles';
import { theme } from '../theme';
import { Spacer } from '../components';

// Logo
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Logo = require('../assets/margin_logo.png');

export default function PhilosophyScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: theme.layout.screenPaddingX }}
      >
        <View style={styles.content}>
          <View style={styles.sectionTight}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={theme.hit.slop}>
              <Text style={styles.link}>Back</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.h2}>Philosophy</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.body}>
              Margin was created from the idea that much of what matters in life does not happen at the centre of our attention, but at its edges.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.body}>
              The app is inspired by a simple question: what if awareness itself is not something we produce, but something we tune into? From this perspective, attention is less about control and more about noticing — allowing experiences, feelings and patterns to appear without immediately judging or improving them.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.body}>
              Margin does not aim to calm, optimise or instruct. It exists to make space. By offering small, optional practices and a way to observe what shows up over time, the app invites reflection without pressure. Meaning is not generated here; it is recognised, gradually, in the margins of everyday life.
            </Text>
          </View>

          <View style={[styles.section, { alignItems: 'center', marginTop: theme.space.s6 }]}>
            <Image 
              source={Logo} 
              style={{ 
                width: 48, 
                height: 48, 
                opacity: 0.2,
              }} 
              resizeMode="contain"
            />
          </View>

          <Spacer size="s8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
