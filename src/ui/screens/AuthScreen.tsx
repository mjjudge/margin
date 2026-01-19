import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles';
import { theme } from '../theme';
import { Card, Button, Spacer } from '../components';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../data/supabaseClient';

// Required for OAuth on native
WebBrowser.maybeCompleteAuthSession();

// Logo - kept subtle
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Logo = require('../assets/margin_logo.png');

type AuthMode = 'initial' | 'email-sent';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('initial');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email + Password sign in/up
  const handleEmailPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert('Password required', 'Please enter a password (at least 6 characters).');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) {
          Alert.alert('Sign up failed', error.message);
        } else if (data.session) {
          // User is signed in immediately (email confirmation disabled)
          // Auth listener will handle navigation
        } else if (data.user && !data.session) {
          // Email confirmation required
          Alert.alert(
            'Check your email',
            'We sent a confirmation link to your email. Please confirm to continue.',
            [{ text: 'OK', onPress: () => setAuthMode('email-sent') }]
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            Alert.alert('Sign in failed', 'Email or password is incorrect.');
          } else {
            Alert.alert('Sign in failed', error.message);
          }
        }
        // Success will be handled by auth state listener
      }
    } catch (err) {
      console.error('[AuthScreen] Auth error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OAuth sign in
  const handleOAuthSignIn = async (provider: 'apple' | 'google') => {
    setLoading(true);
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
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'margin://auth/callback'
        );

        if (result.type === 'success' && result.url) {
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
    } finally {
      setLoading(false);
    }
  };

  // Email sent confirmation screen
  if (authMode === 'email-sent') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={[styles.screenPadded, { flex: 1, justifyContent: 'center' }]}>
          <View style={styles.content}>
            <View style={[styles.section, { alignItems: 'center' }]}>
              <Image 
                source={Logo} 
                style={{ width: 48, height: 48, opacity: 0.6, marginBottom: theme.space.s4 }} 
                resizeMode="contain"
              />
              <Text style={styles.h2}>Check your email</Text>
              <Spacer size="s4" />
              <Text style={[styles.body, { textAlign: 'center' }]}>
                We sent a confirmation link to {email}.
              </Text>
              <Spacer size="s2" />
              <Text style={[styles.body2, { textAlign: 'center' }]}>
                Click the link in the email, then return here and sign in.
              </Text>
            </View>

            <View style={styles.section}>
              <Card>
                <Button 
                  label="Sign in" 
                  onPress={() => {
                    setIsSignUp(false);
                    setAuthMode('initial');
                  }}
                />
                <Spacer size="s3" />
                <Button 
                  label="Try different email" 
                  variant="text" 
                  onPress={() => {
                    setEmail('');
                    setPassword('');
                    setAuthMode('initial');
                  }}
                />
              </Card>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main sign in screen
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ 
            padding: theme.layout.screenPaddingX,
            paddingTop: theme.space.s6,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header with logo */}
            <View style={[styles.section, { alignItems: 'center' }]}>
              <Image 
                source={Logo} 
                style={{ 
                  width: 56, 
                  height: 56, 
                  opacity: 0.7,
                  marginBottom: theme.space.s4,
                }} 
                resizeMode="contain"
              />
              <Text style={styles.h2}>
                {isSignUp ? 'Create account' : 'Sign in to Margin'}
              </Text>
              <Spacer size="s3" />
              <Text style={styles.body2}>
                {isSignUp 
                  ? 'Create an account to sync across devices.' 
                  : 'Sign in to sync your data across devices.'}
              </Text>
            </View>

            {/* Email + Password form */}
            <View style={styles.section}>
              <Card>
                <Text style={styles.title}>Email</Text>
                <Spacer size="s3" />
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
                
                <Text style={styles.title}>Password</Text>
                <Spacer size="s3" />
                <TextInput
                  style={[styles.body, { 
                    borderWidth: 1, 
                    borderColor: theme.color.border, 
                    borderRadius: theme.radius.sm,
                    padding: theme.space.s3,
                  }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.color.text3}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={isSignUp ? 'new-password' : 'password'}
                />
                
                <Spacer size="s5" />
                
                <Button 
                  label={loading 
                    ? (isSignUp ? 'Creating...' : 'Signing in...') 
                    : (isSignUp ? 'Create account' : 'Sign in')} 
                  onPress={handleEmailPassword}
                  disabled={loading}
                />
                
                <Spacer size="s4" />
                
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={[styles.hint, { textAlign: 'center' }]}>
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Create one"}
                  </Text>
                </TouchableOpacity>
              </Card>
            </View>

            {/* Divider */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.s3 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
                <Text style={styles.hint}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
              </View>
            </View>

            {/* Social sign-in */}
            <View style={styles.section}>
              <Card>
                <Text style={styles.title}>Other sign-in options</Text>
                <Spacer size="s4" />
                
                {Platform.OS === 'ios' && (
                  <>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.color.text,
                        paddingVertical: theme.space.s3,
                        paddingHorizontal: theme.space.s4,
                        borderRadius: theme.radius.sm,
                        gap: theme.space.s3,
                      }}
                      onPress={() => handleOAuthSignIn('apple')}
                      disabled={loading}
                    >
                      {/* Apple logo - SF Symbol style */}
                      <Text style={{ fontSize: 18, color: theme.color.bg }}>
                        
                      </Text>
                      <Text style={{ 
                        color: theme.color.bg, 
                        fontSize: theme.type.size.md,
                        fontWeight: '500',
                      }}>
                        Continue with Apple
                      </Text>
                    </TouchableOpacity>
                    <Spacer size="s3" />
                  </>
                )}
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.color.bg,
                    borderWidth: 1,
                    borderColor: theme.color.border,
                    paddingVertical: theme.space.s3,
                    paddingHorizontal: theme.space.s4,
                    borderRadius: theme.radius.sm,
                    gap: theme.space.s3,
                  }}
                  onPress={() => handleOAuthSignIn('google')}
                  disabled={loading}
                >
                  {/* Google "G" logo - simple colored text */}
                  <Text style={{ fontSize: 18, fontWeight: '700' }}>
                    <Text style={{ color: '#4285F4' }}>G</Text>
                  </Text>
                  <Text style={{ 
                    color: theme.color.text, 
                    fontSize: theme.type.size.md,
                    fontWeight: '500',
                  }}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <Spacer size="s4" />
                <Text style={[styles.hint, { textAlign: 'center' }]}>
                  Social sign-in requires a production build.
                </Text>
              </Card>
            </View>

            {/* Footer */}
            <View style={styles.sectionTight}>
              <Text style={[styles.hint, { textAlign: 'center' }]}>
                By signing in, you agree to sync your practice sessions and meaning entries with our servers.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
