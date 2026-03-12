import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useJobs } from '../../src/hooks/useJobs';
import { useSkills } from '../../src/hooks/useSkills';
import { useImageUpload } from '../../src/hooks/useImageUpload';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { DayPicker } from '../../src/components/DayPicker';
import { SkillPicker, SelectedSkill } from '../../src/components/SkillPicker';
import { ESTATES } from '../../src/lib/estates';
import { suggestPay } from '../../src/lib/remunerationGuide';
import { TimeSlot } from '../../src/types/database';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../src/providers/AuthProvider';

const MAX_PHOTOS = 3;

export default function CreateJobScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createJob } = useJobs();
  const { categories, skills, loading: skillsLoading } = useSkills();
  const { pickAndUpload } = useImageUpload();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estate, setEstate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [requiredSlots, setRequiredSlots] = useState<TimeSlot[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<SelectedSkill[]>([]);
  const [remunerationMin, setRemunerationMin] = useState('');
  const [remunerationMax, setRemunerationMax] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Detect active category from selected skills
  const activeCategoryId: string | null = (() => {
    if (requiredSkills.length === 0) return null;
    const firstSkill = skills.find(sk => sk.id === requiredSkills[0].skill_id);
    return firstSkill?.category_id ?? null;
  })();

  const activeCategory = activeCategoryId
    ? categories.find(c => c.id === activeCategoryId)
    : null;

  const maxProficiency = requiredSkills.length > 0
    ? Math.max(...requiredSkills.map(s => s.proficiency)) as 1 | 2 | 3
    : 1;
  const hasEvening = requiredSlots.some(s => s.endsWith('_evening'));
  const hasWeekend = requiredSlots.some(s => s.startsWith('Sat_') || s.startsWith('Sun_'));
  const suggestedPay = suggestPay(activeCategory?.name, maxProficiency, hasEvening, hasWeekend);

  async function handleAddPhoto(index: number) {
    if (!user) return;
    const path = `jobs/${user.id}/${Date.now()}_${index}.jpg`;
    const url = await pickAndUpload('job-photos', path);
    if (url) {
      const updated = [...photos];
      updated[index] = url;
      setPhotos(updated);
    }
  }

  function handleRemovePhoto(index: number) {
    const updated = [...photos];
    updated.splice(index, 1);
    setPhotos(updated);
  }

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
        requiredSlots,
        duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
        skills: requiredSkills,
        remuneration_per_hour_min: remunerationMin ? parseFloat(remunerationMin) : null,
        remuneration_per_hour_max: remunerationMax ? parseFloat(remunerationMax) : null,
        photos,
      });
      alert('Job posted!');
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
        label="Duration (weeks, optional)"
        value={durationWeeks}
        onChangeText={setDurationWeeks}
        keyboardType="numeric"
        placeholder="e.g. 4"
      />

      <DayPicker label="Required Time Slots" selected={requiredSlots} onChange={setRequiredSlots} />

      <Text style={styles.sectionTitle}>Job Photos (up to {MAX_PHOTOS})</Text>
      <View style={styles.photoRow}>
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
          const url = photos[i];
          return (
            <View key={i} style={styles.photoSlot}>
              {url ? (
                <>
                  <Image source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => handleRemovePhoto(i)}>
                    <Text style={styles.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.photoAdd} onPress={() => handleAddPhoto(i)}>
                  <Text style={styles.photoAddText}>+ Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Required Skills</Text>
      <SkillPicker
        categories={categories}
        skills={skills}
        selected={requiredSkills}
        onChange={setRequiredSkills}
        minProficiencyMode
        singleCategory
      />

      {suggestedPay && (
        <View style={styles.suggestionBanner}>
          <View style={styles.suggestionLeft}>
            <Text style={styles.suggestionTitle}>Suggested pay</Text>
            <Text style={styles.suggestionRange}>
              ${suggestedPay.min} – ${suggestedPay.max}/hr
            </Text>
            <Text style={styles.suggestionBreakdown}>{suggestedPay.labels.join(' · ')}</Text>
          </View>
          <TouchableOpacity
            style={styles.useThisBtn}
            onPress={() => {
              setRemunerationMin(String(suggestedPay.min));
              setRemunerationMax(String(suggestedPay.max));
            }}
          >
            <Text style={styles.useThisBtnText}>Use this</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.remunerationRow}>
        <View style={styles.remunerationField}>
          <Input
            label="Min $/hr"
            value={remunerationMin}
            onChangeText={setRemunerationMin}
            keyboardType="decimal-pad"
            placeholder="e.g. 10"
          />
        </View>
        <View style={styles.remunerationField}>
          <Input
            label="Max $/hr"
            value={remunerationMax}
            onChangeText={setRemunerationMax}
            keyboardType="decimal-pad"
            placeholder="e.g. 18"
          />
        </View>
      </View>

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
  remunerationRow: { flexDirection: 'row', gap: 12 },
  remunerationField: { flex: 1 },
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1fd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  suggestionLeft: { flex: 1 },
  suggestionTitle: { fontSize: 11, color: '#4361ee', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestionRange: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginTop: 2 },
  suggestionBreakdown: { fontSize: 11, color: '#666', marginTop: 2 },
  useThisBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  useThisBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  photoSlot: { flex: 1, aspectRatio: 1, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  photoAdd: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 90,
    backgroundColor: '#fafafa',
  },
  photoAddText: { fontSize: 13, color: '#999' },
});
