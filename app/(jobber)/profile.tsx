import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { useProfile } from '../../src/hooks/useProfile';
import { useSkills } from '../../src/hooks/useSkills';
import { useImageUpload } from '../../src/hooks/useImageUpload';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { DayPicker } from '../../src/components/DayPicker';
import { SkillPicker, SelectedSkill } from '../../src/components/SkillPicker';
import { Avatar } from '../../src/components/ui/Avatar';
import { EstatePicker } from '../../src/components/EstatePicker';
import { TimeSlot } from '../../src/types/database';

export default function JobberProfileScreen() {
  const { signOut, user } = useAuth();
  const { profile, jobberProfile, jobberSkills, loading, updateProfile, updateJobberProfile, saveJobberSkills } = useProfile();
  const { categories, skills, loading: skillsLoading } = useSkills();
  const { pickAndUpload } = useImageUpload();

  const [fullName, setFullName] = useState('');
  const [estate, setEstate] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoIdUrl, setPhotoIdUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEstate(profile.estate);
      setAvatarUrl(profile.avatar_url);
    }
    if (jobberProfile) {
      setBio(jobberProfile.bio);
      setPhoneNumber(jobberProfile.phone_number ?? '');
      setAvailableSlots(jobberProfile.available_slots);
      setPhotoIdUrl(jobberProfile.photo_id_url);
    }
    if (jobberSkills.length > 0) {
      setSelectedSkills(
        jobberSkills.map(js => ({ skill_id: js.skill_id, proficiency: js.proficiency }))
      );
    }
  }, [profile, jobberProfile, jobberSkills]);

  async function handleAvatarUpload() {
    if (!user) return;
    const url = await pickAndUpload('avatars', `avatars/${user.id}/avatar.jpg`);
    if (url) {
      setAvatarUrl(url);
      await updateProfile({ avatar_url: url });
    }
  }

  async function handlePhotoIdUpload() {
    if (!user) return;
    const url = await pickAndUpload('avatars', `photo-ids/${user.id}/photo_id.jpg`);
    if (url) {
      setPhotoIdUrl(url);
      await updateJobberProfile({ photo_id_url: url });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, estate });
      await updateJobberProfile({
        bio,
        phone_number: phoneNumber,
        available_slots: availableSlots,
      });
      await saveJobberSkills(selectedSkills);
      alert('Profile updated successfully');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || skillsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (viewMode) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <Avatar uri={avatarUrl} name={fullName} size={80} />
        </View>
        <Text style={styles.viewLabel}>Full Name</Text>
        <Text style={styles.viewValue}>{fullName || '—'}</Text>

        <Text style={styles.viewLabel}>Estate</Text>
        <Text style={styles.viewValue}>{estate || '—'}</Text>

        <Text style={styles.viewLabel}>Bio</Text>
        <Text style={styles.viewValue}>{bio || '—'}</Text>

        <Text style={styles.viewLabel}>Contact Number</Text>
        <Text style={styles.viewValue}>{phoneNumber || '—'}</Text>

        <Text style={styles.viewLabel}>Available Slots</Text>
        <Text style={styles.viewValue}>
          {availableSlots.length > 0 ? availableSlots.join(', ') : '—'}
        </Text>

        <Text style={styles.viewLabel}>Photo ID</Text>
        {photoIdUrl ? (
          <Image source={{ uri: photoIdUrl }} style={styles.photoIdThumb} resizeMode="cover" />
        ) : (
          <Text style={styles.viewValue}>Not uploaded</Text>
        )}

        <Button title="Edit Profile" onPress={() => setViewMode(false)} style={{ marginTop: 16 }} />
        <Button title="Sign Out" onPress={signOut} variant="secondary" style={{ marginTop: 12 }} />
      </ScrollView>
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

      <Input label="Full Name" value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Estate</Text>
      <EstatePicker value={estate} onChange={setEstate} placeholder="Select estate..." />

      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <Input
        label="Contact Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <DayPicker label="Available Time Slots" selected={availableSlots} onChange={setAvailableSlots} />

      <Text style={styles.sectionTitle}>Photo ID</Text>
      <TouchableOpacity style={styles.photoIdSlot} onPress={handlePhotoIdUpload}>
        {photoIdUrl ? (
          <Image source={{ uri: photoIdUrl }} style={styles.photoIdThumb} resizeMode="cover" />
        ) : (
          <Text style={styles.photoIdPlaceholder}>Upload Photo ID</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Skills & Experience</Text>
      <SkillPicker
        categories={categories}
        skills={skills}
        selected={selectedSkills}
        onChange={setSelectedSkills}
      />

      <Button title={saving ? 'Saving...' : 'Save Profile'} onPress={handleSave} disabled={saving} />

      <Button
        title="View Profile"
        onPress={() => setViewMode(true)}
        variant="secondary"
        style={{ marginTop: 12 }}
      />

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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, marginTop: 8 },
  photoIdSlot: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  photoIdThumb: { width: '100%', height: 120, borderRadius: 12 },
  photoIdPlaceholder: { fontSize: 15, color: '#999' },
  viewLabel: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  viewValue: { fontSize: 15, color: '#333' },
});
