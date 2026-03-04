import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useJobs } from '../../src/hooks/useJobs';
import { useSkills } from '../../src/hooks/useSkills';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { DayPicker } from '../../src/components/DayPicker';
import { SkillPicker, SelectedSkill } from '../../src/components/SkillPicker';
import { ESTATES } from '../../src/lib/estates';
import { DayOfWeek } from '../../src/types/database';
import { Picker } from '@react-native-picker/picker';

export default function CreateJobScreen() {
  const router = useRouter();
  const { createJob } = useJobs();
  const { categories, skills, loading: skillsLoading } = useSkills();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estate, setEstate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [requiredDays, setRequiredDays] = useState<DayOfWeek[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<SelectedSkill[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title || !estate) {
      alert('Error: ' + 'Please fill in title and estate');
      return;
    }
    setSaving(true);
    try {
      await createJob({
        title,
        description,
        estate,
        hours_per_week: parseInt(hoursPerWeek) || 0,
        required_days: requiredDays,
        duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
        skills: requiredSkills,
      });
      alert( 'Job posted!');
      router.back();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (skillsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input label="Job Title" value={title} onChangeText={setTitle} placeholder="e.g. Home Cook Needed" />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        placeholder="Describe the job..."
        style={{ minHeight: 100, textAlignVertical: 'top' }}
      />

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
        label="Hours per week"
        value={hoursPerWeek}
        onChangeText={setHoursPerWeek}
        keyboardType="numeric"
        placeholder="e.g. 10"
      />
      <Input
        label="Duration (weeks, optional)"
        value={durationWeeks}
        onChangeText={setDurationWeeks}
        keyboardType="numeric"
        placeholder="e.g. 4"
      />

      <DayPicker label="Required Days" selected={requiredDays} onChange={setRequiredDays} />

      <Text style={styles.sectionTitle}>Required Skills</Text>
      <SkillPicker
        categories={categories}
        skills={skills}
        selected={requiredSkills}
        onChange={setRequiredSkills}
        minProficiencyMode
      />

      <Button title={saving ? 'Posting...' : 'Post Job'} onPress={handleCreate} disabled={saving} />
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
