import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  /** If true, only skills from one category can be selected at a time */
  singleCategory?: boolean;
}

const LEVELS: { label: string; value: 1 | 2 | 3 }[] = [
  { label: '< 1 yr', value: 1 },
  { label: '1–3 yrs', value: 2 },
  { label: '> 3 yrs', value: 3 },
];

export function SkillPicker({
  categories,
  skills,
  selected,
  onChange,
  minProficiencyMode,
  singleCategory,
}: SkillPickerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function isSelected(skillId: string) {
    return selected.some(s => s.skill_id === skillId);
  }

  function getProficiency(skillId: string) {
    return selected.find(s => s.skill_id === skillId)?.proficiency ?? 2;
  }

  // The category of the first selected skill (for singleCategory constraint)
  const activeCategoryId: string | null = (() => {
    if (!singleCategory || selected.length === 0) return null;
    const firstSkill = skills.find(sk => sk.id === selected[0].skill_id);
    return firstSkill?.category_id ?? null;
  })();

  function toggleSkill(skillId: string, categoryId: string) {
    if (isSelected(skillId)) {
      onChange(selected.filter(s => s.skill_id !== skillId));
    } else {
      if (singleCategory && activeCategoryId && activeCategoryId !== categoryId) {
        Alert.alert(
          'One category only',
          'Please deselect all current skills before switching to a different category.'
        );
        return;
      }
      onChange([...selected, { skill_id: skillId, proficiency: 2 }]);
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
        const isDisabledCategory = singleCategory && activeCategoryId !== null && activeCategoryId !== cat.id;

        return (
          <View key={cat.id} style={[styles.category, isDisabledCategory && styles.categoryDisabled]}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => setExpanded(isExpanded ? null : cat.id)}
            >
              <Text style={[styles.categoryName, isDisabledCategory && styles.categoryNameDisabled]}>
                {cat.name}
              </Text>
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
                      onPress={() => toggleSkill(skill.id, cat.id)}
                    >
                      <Text style={[styles.skillName, active && styles.skillNameActive]}>
                        {skill.name}
                      </Text>
                    </TouchableOpacity>
                    {active && (
                      <View style={styles.levelRow}>
                        <Text style={styles.levelLabel}>
                          {minProficiencyMode ? 'Min exp:' : 'Experience:'}
                        </Text>
                        <View style={styles.levelButtons}>
                          {LEVELS.map(lvl => {
                            const isActive = getProficiency(skill.id) === lvl.value;
                            return (
                              <TouchableOpacity
                                key={lvl.value}
                                style={[styles.levelBtn, isActive && styles.levelBtnActive]}
                                onPress={() => setProficiency(skill.id, lvl.value)}
                              >
                                <Text style={[styles.levelBtnText, isActive && styles.levelBtnTextActive]}>
                                  {lvl.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
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
  categoryDisabled: { opacity: 0.45 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f9f9f9',
  },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#333' },
  categoryNameDisabled: { color: '#aaa' },
  categoryCount: { fontSize: 13, color: '#666' },
  skillRow: { paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  skillToggle: { paddingVertical: 6 },
  skillActive: {},
  skillName: { fontSize: 15, color: '#666' },
  skillNameActive: { color: '#4361ee', fontWeight: '600' },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  levelLabel: { fontSize: 12, color: '#666', width: 68 },
  levelButtons: { flexDirection: 'row', gap: 6 },
  levelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  levelBtnActive: { borderColor: '#4361ee', backgroundColor: '#eef0ff' },
  levelBtnText: { fontSize: 12, fontWeight: '600', color: '#999' },
  levelBtnTextActive: { color: '#4361ee' },
});
