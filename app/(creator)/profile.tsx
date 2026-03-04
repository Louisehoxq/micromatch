import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { useProfile } from '../../src/hooks/useProfile';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { ESTATES } from '../../src/lib/estates';
import { Picker } from '@react-native-picker/picker';

export default function CreatorProfileScreen() {
  const { signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  const [fullName, setFullName] = useState('');
  const [estate, setEstate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEstate(profile.estate);
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, estate });
      alert( 'Profile updated successfully');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input label="Full Name" value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Estate</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={estate} onValueChange={setEstate}>
          <Picker.Item label="Select estate..." value="" />
          {ESTATES.map(e => (
            <Picker.Item key={e} label={e} value={e} />
          ))}
        </Picker>
      </View>

      <Button title={saving ? 'Saving...' : 'Save Profile'} onPress={handleSave} disabled={saving} />

      <Button
        title="Sign Out"
        onPress={signOut}
        variant="secondary"
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
});
