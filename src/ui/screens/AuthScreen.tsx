import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  Alert,
  Platform,
} from 'react-native';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Spacer } from '../components';
import { useAuth } from '../../data/auth';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../data/supabaseClient';

// Required for OAuth on native
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { signInWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    const { error } = await signInWithEmail(email.trim());
    if (error) {
      Alert.alert('Sign in failed', error.message);
    } else {
      setEmailSent(true);
    }
  };

  const handleOAuthSignIn = async (provider: 'apple' | 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'margin://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert('Sign in failed', error.message);
        return;
      }

      if (data?.url) {
        // Open the OAuth URL in a browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'margin://auth/callback'
        );

        if (result.type === 'success' && result.url) {
          // Extract tokens from the URL and set session
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
          }
        }
      }
    } catch (err) {
      console.error('[AuthScreen] OAuth error:', err);
      Alert.alert('Sign in failed', 'Something went wrong. Please try again.');
    }
  };

  if (emailSent) {
    return (
      <View style={styles.screenPadded}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.h2}>Check your email</Text>
            <Spacer size="s4" />
            <Text style={styles.body}>
              We sent a sign-in link to {email}. Click the link to continue.
            </Text>
          </View>

          <View style={styles.section}>
            <Card>
              <Text style={styles.body2}>
                The link will open this app automatically. If it doesn't work, copy and paste the link.
              </Text>
              <Spacer size="s6" />
              <Button 
                label="Try different email" 
                variant="text" 
                onPress={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
              />
            </Card>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.screen} 
      contentContainerStyle={{ padding: theme.layout.screenPaddingX }}
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.h2}>Sign in to Margin</Text>
          <Spacer size="s4" />
          <Text style={styles.body2}>
            Sign in to sync your data across devices.
          </Text>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Email</Text>
            <Spacer size="s4" />
            <TextInput
              style={[styles.body, { 
                borderWidth: 1, 
                borderColor: theme.color.border, 
                borderRadius: theme.radius.sm,
                padding: theme.space.s3,
              }]}
              placeholder="you@example.com"
              placeholderTextColor={theme.color.text3}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
            <Spacer size="s4" />
            <Button 
              label={loading ? 'Sending...' : 'Continue with email'} 
              onPress={handleEmailSignIn}
              disabled={loading}
            />
            <Spacer size="s2" />
            <Text style={styles.hint}>
              We'll send you a magic link to sign in.
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.s3 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
            <Text style={styles.hint}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
          </View>
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={styles.title}>Social sign-in</Text>
            <Spacer size="s4" />
            
            {Platform.OS === 'ios' && (
              <>
                <Button 
                  label="Continue with Apple" 
                  onPress={() => handleOAuthSignIn('apple')}
                  disabled={loading}
                />
                <Spacer size="s3" />
              </>
            )}
            
            <Button 
              label="Continue with Google" 
              onPress={() => handleOAuthSignIn('google')}
              disabled={loading}
            />
          </Card>
        </View>

        <View style={styles.sectionTight}>
          <Text style={styles.hint}>
            By signing in, you agree to sync your practice sessions and meaning entries with our servers.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
