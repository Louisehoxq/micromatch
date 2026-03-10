import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';
import { UserRole } from '../../src/types/database';
import { ESTATES } from '../../src/lib/estates';

export default function SelectRoleScreen() {
  const { user, refreshRole } = useAuth();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('jobber');
  const [estate, setEstate] = useState(ESTATES[0]);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!fullName.trim()) { alert('Please enter your full name'); return; }
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim(),
        role,
        estate,
      });
      if (error) throw error;
      await refreshRole();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Just a few details to get started</Text>

        <TextInput
          style={styles.input}
          placeholder={role === 'creator' ? 'Organisation Name' : 'Full Name'}
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>I am a:</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'jobber' && styles.roleActive]}
            onPress={() => setRole('jobber')}
          >
            <Text style={[styles.roleText, role === 'jobber' && styles.roleTextActive]}>
              Job Seeker (50+)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'creator' && styles.roleActive]}
            onPress={() => setRole('creator')}
          >
            <Text style={[styles.roleText, role === 'creator' && styles.roleTextActive]}>
              Job Creator
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Estate:</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={estate} onValueChange={setEstate}>
            {ESTATES.map(e => (
              <Picker.Item key={e} label={e} value={e} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Continue'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', color: '#1a1a2e', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  roleActive: { borderColor: '#4361ee', backgroundColor: '#eef0ff' },
  roleText: { fontSize: 14, fontWeight: '600', color: '#666' },
  roleTextActive: { color: '#4361ee' },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  button: {
    backgroundColor: '#4361ee',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
