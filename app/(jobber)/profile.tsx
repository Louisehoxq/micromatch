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
import { useSkills } from '../../src/hooks/useSkills';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { DayPicker } from '../../src/components/DayPicker';
import { SkillPicker, SelectedSkill } from '../../src/components/SkillPicker';
import { ESTATES } from '../../src/lib/estates';
import { DayOfWeek } from '../../src/types/database';
import { Picker } from '@react-native-picker/picker';

export default function JobberProfileScreen() {
  const { signOut } = useAuth();
  const { profile, jobberProfile, jobberSkills, loading, updateProfile, updateJobberProfile, saveJobberSkills } = useProfile();
  const { categories, skills, loading: skillsLoading } = useSkills();

  const [fullName, setFullName] = useState('');
  const [estate, setEstate] = useState('');
  const [bio, setBio] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('0');
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEstate(profile.estate);
    }
    if (jobberProfile) {
      setBio(jobberProfile.bio);
      setHoursPerWeek(String(jobberProfile.hours_per_week));
      setAvailableDays(jobberProfile.available_days);
    }
    if (jobberSkills.length > 0) {
      setSelectedSkills(
        jobberSkills.map(js => ({ skill_id: js.skill_id, proficiency: js.proficiency }))
      );
    }
  }, [profile, jobberProfile, jobberSkills]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, estate });
      await updateJobberProfile({
        bio,
        hours_per_week: parseInt(hoursPerWeek) || 0,
        available_days: availableDays,
      });
      await saveJobberSkills(selectedSkills);
      alert( 'Profile updated successfully');
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

      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <Input
        label="Hours per week available"
        value={hoursPerWeek}
        onChangeText={setHoursPerWeek}
        keyboardType="numeric"
      />

      <DayPicker label="Available Days" selected={availableDays} onChange={setAvailableDays} />

      <Text style={styles.sectionTitle}>Skills & Proficiency</Text>
      <SkillPicker
        categories={categories}
        skills={skills}
        selected={selectedSkills}
        onChange={setSelectedSkills}
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
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, marginTop: 8 },
});
