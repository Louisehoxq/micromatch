import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { useProfile } from '../../src/hooks/useProfile';
import { useImageUpload } from '../../src/hooks/useImageUpload';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Avatar } from '../../src/components/ui/Avatar';
import { EstatePicker } from '../../src/components/EstatePicker';

export default function CreatorProfileScreen() {
  const { signOut, user } = useAuth();
  const { profile, creatorProfile, loading, updateProfile, updateCreatorProfile } = useProfile();
  const { pickAndUpload } = useImageUpload();

  const [fullName, setFullName] = useState('');
  const [estate, setEstate] = useState('');
  const [bio, setBio] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEstate(profile.estate);
    }
    if (creatorProfile) {
      setBio(creatorProfile.bio);
      setContactNumber(creatorProfile.contact_number);
      setAvatarUrl(creatorProfile.avatar_url);
    }
  }, [profile, creatorProfile]);

  async function handleAvatarUpload() {
    if (!user) return;
    const url = await pickAndUpload('avatars', `avatars/${user.id}/avatar.jpg`);
    if (url) {
      setAvatarUrl(url);
      await updateCreatorProfile({ avatar_url: url });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, estate });
      await updateCreatorProfile({ bio, contact_number: contactNumber });
      alert('Profile updated successfully');
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
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleAvatarUpload}>
          <Avatar uri={avatarUrl} name={fullName} size={80} />
          <Text style={styles.avatarHint}>Tap to change</Text>
        </TouchableOpacity>
      </View>

      <Input label="Organisation Name" value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Estate</Text>
      <EstatePicker value={estate} onChange={setEstate} placeholder="Select estate..." />

      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        placeholder="Tell jobbers about your organisation..."
      />

      <Input
        label="Contact Number"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
        placeholder="e.g. 9123 4567"
      />

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
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarHint: { fontSize: 12, color: '#4361ee', marginTop: 6, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
});
