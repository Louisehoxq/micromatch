import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { SkillCategory, Skill } from '../types/database';

export interface SelectedSkill {
  skill_id: string;
  proficiency: number;
}

interface SkillPickerProps {
  categories: SkillCategory[];
  skills: Skill[];
  selected: SelectedSkill[];
  onChange: (skills: SelectedSkill[]) => void;
  /** If true, show "Min Proficiency" label (for job posting) */
  minProficiencyMode?: boolean;
}

export function SkillPicker({
  categories,
  skills,
  selected,
  onChange,
  minProficiencyMode,
}: SkillPickerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function isSelected(skillId: string) {
    return selected.some(s => s.skill_id === skillId);
  }

  function getProficiency(skillId: string) {
    return selected.find(s => s.skill_id === skillId)?.proficiency ?? 3;
  }

  function toggleSkill(skillId: string) {
    if (isSelected(skillId)) {
      onChange(selected.filter(s => s.skill_id !== skillId));
    } else {
      onChange([...selected, { skill_id: skillId, proficiency: 3 }]);
    }
  }

  function setProficiency(skillId: string, value: number) {
    onChange(
      selected.map(s => (s.skill_id === skillId ? { ...s, proficiency: value } : s))
    );
  }

  const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);

  return (
    <View style={styles.container}>
      {sorted.map(cat => {
        const catSkills = skills.filter(s => s.category_id === cat.id);
        const isExpanded = expanded === cat.id;
        const selectedCount = catSkills.filter(s => isSelected(s.id)).length;

        return (
          <View key={cat.id} style={styles.category}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => setExpanded(isExpanded ? null : cat.id)}
            >
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryCount}>
                {selectedCount > 0 ? `${selectedCount} selected` : ''} {isExpanded ? '-' : '+'}
              </Text>
            </TouchableOpacity>

            {isExpanded &&
              catSkills.map(skill => {
                const active = isSelected(skill.id);
                return (
                  <View key={skill.id} style={styles.skillRow}>
                    <TouchableOpacity
                      style={[styles.skillToggle, active && styles.skillActive]}
                      onPress={() => toggleSkill(skill.id)}
                    >
                      <Text style={[styles.skillName, active && styles.skillNameActive]}>
                        {skill.name}
                      </Text>
                    </TouchableOpacity>
                    {active && (
                      <View style={styles.sliderRow}>
                        <Text style={styles.sliderLabel}>
                          {minProficiencyMode ? 'Min' : 'Level'}: {getProficiency(skill.id)}
                        </Text>
                        <Slider
                          style={styles.slider}
                          minimumValue={1}
                          maximumValue={5}
                          step={1}
                          value={getProficiency(skill.id)}
                          onValueChange={v => setProficiency(skill.id, v)}
                          minimumTrackTintColor="#4361ee"
                          maximumTrackTintColor="#ddd"
                        />
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  category: { marginBottom: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 12, overflow: 'hidden' },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f9f9f9',
  },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#333' },
  categoryCount: { fontSize: 13, color: '#666' },
  skillRow: { paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  skillToggle: { paddingVertical: 6 },
  skillActive: {},
  skillName: { fontSize: 15, color: '#666' },
  skillNameActive: { color: '#4361ee', fontWeight: '600' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sliderLabel: { fontSize: 13, color: '#666', width: 60 },
  slider: { flex: 1, height: 32 },
});
