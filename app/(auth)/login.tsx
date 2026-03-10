import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';

type Tab = 'email' | 'phone';

export default function LoginScreen() {
  const { signIn, signInWithPhone, verifyOtp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<Tab>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleEmailLogin() {
    if (!email || !password) { alert('Please fill in all fields'); return; }
    setLoading(true);
    try { await signIn(email, password); }
    catch (e: any) { alert('Login Failed: ' + e.message); }
    finally { setLoading(false); }
  }

  async function handleSendOtp() {
    if (!phone) { alert('Please enter your phone number'); return; }
    setLoading(true);
    try { await signInWithPhone(phone); setOtpSent(true); }
    catch (e: any) { alert('Error: ' + e.message); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp() {
    if (!otp) { alert('Please enter the OTP'); return; }
    setLoading(true);
    try { await verifyOtp(phone, otp); }
    catch (e: any) { alert('Verification Failed: ' + e.message); }
    finally { setLoading(false); }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try { await signInWithGoogle(); }
    catch (e: any) { alert('Google Login Failed: ' + e.message); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>MicroMatch</Text>
        <Text style={styles.subtitle}>Find your perfect micro-job match</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'email' && styles.tabActive]}
            onPress={() => setTab('email')}
          >
            <Text style={[styles.tabText, tab === 'email' && styles.tabTextActive]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'phone' && styles.tabActive]}
            onPress={() => setTab('phone')}
          >
            <Text style={[styles.tabText, tab === 'phone' && styles.tabTextActive]}>Phone</Text>
          </TouchableOpacity>
        </View>

        {tab === 'email' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'phone' && (
          <>
            {!otpSent ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Phone number (e.g. +1234567890)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.otpHint}>Enter the code sent to {phone}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Sign In'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); }} style={styles.linkButton}>
                  <Text style={styles.linkText}>Change phone number</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', color: '#1a1a2e', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 32 },
  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f9f9f9' },
  tabActive: { backgroundColor: '#4361ee' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#666' },
  tabTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#4361ee',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  otpHint: { fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 12, color: '#999', fontSize: 14 },
  googleButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  googleButtonText: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  linkButton: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#4361ee', fontSize: 14 },
});
