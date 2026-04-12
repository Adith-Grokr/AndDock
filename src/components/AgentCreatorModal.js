import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, StyleSheet, Dimensions,
} from 'react-native';
import { T, generateLocal } from '../constants';
import Btn from './Btn';
import TagInput from './TagInput';
import MiniChar from './MiniChar';

const { height: SCREEN_H } = Dimensions.get('window');

export default function AgentCreatorModal({ onClose, onSpawn }) {
  const [name, setName] = useState('');
  const [prof, setProf] = useState('');
  const [desc, setDesc] = useState('');
  const [skills, setSkills] = useState([]);
  const [tools, setTools] = useState([]);
  const [mcps, setMcps] = useState([]);
  const [gen, setGen] = useState(null);
  const ct = gen?.characterType || 'cyclist';

  const doPreview = () => {
    const r = generateLocal({ profession: prof, description: desc, skills });
    setGen(r);
    if (r.suggestedSkills?.length > 0 && skills.length === 0) setSkills(r.suggestedSkills);
  };

  const doSpawn = () => {
    const r = gen || generateLocal({ profession: prof, description: desc, skills });
    onSpawn({
      name: name.trim() || null,
      type: r.characterType || 'cyclist',
      skills: skills.length > 0 ? skills : (r.suggestedSkills || []),
      tools, mcps,
      profession: prof, description: desc,
      persona: r.persona || '', tone: r.tone || '',
      greeting: r.greeting || null,
    });
    onClose();
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Create Agent</Text>
            <Text style={styles.subtitle}>Configure your new agent</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Identity */}
          <Text style={styles.sectionLabel}>IDENTITY</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                value={name} onChangeText={setName}
                placeholder="Nova…" placeholderTextColor={T.textMuted}
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.fieldLabel}>Role</Text>
              <TextInput
                value={prof} onChangeText={setProf}
                placeholder="Engineer…" placeholderTextColor={T.textMuted}
                style={styles.input}
              />
            </View>
          </View>
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Description</Text>
          <TextInput
            value={desc} onChangeText={setDesc}
            placeholder="What does this agent do?"
            placeholderTextColor={T.textMuted}
            multiline numberOfLines={2}
            style={[styles.input, { minHeight: 60 }]}
          />

          {/* Capabilities */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>CAPABILITIES</Text>
          <Text style={styles.fieldLabel}>Skills</Text>
          <TagInput tags={skills} onChange={setSkills} placeholder="React, Python, Design…" />
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Tools</Text>
          <TagInput tags={tools} onChange={setTools} placeholder="git, docker, figma…" />
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>MCPs</Text>
          <TagInput tags={mcps} onChange={setMcps} placeholder="filesystem, browser…" />

          {/* Preview */}
          <Btn variant="outline" onPress={doPreview} style={{ marginTop: 20 }}>
            ✦ Preview Character
          </Btn>

          {gen && (
            <View style={styles.previewCard}>
              <View style={styles.previewTop}>
                <MiniChar type={ct} size={64} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.previewName}>
                    {name || 'Agent'}
                    <Text style={styles.previewType}> · {ct}</Text>
                  </Text>
                  <Text style={styles.previewTone}>{gen.tone}</Text>
                  <Text style={styles.previewGreeting}>"{gen.greeting}"</Text>
                </View>
              </View>
              <View style={styles.typeRow}>
                {['architect', 'pilot', 'cyclist'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setGen({ ...gen, characterType: c })}
                    style={[styles.typeBtn, gen.characterType === c && styles.typeBtnActive]}
                  >
                    <Text style={[styles.typeBtnText, gen.characterType === c && { color: T.textBase }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Btn variant="outline" onPress={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn variant="primary" onPress={doSpawn} style={{ flex: 2, marginLeft: 10 }}>
            Spawn Agent →
          </Btn>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: T.surface,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: SCREEN_H * 0.92,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 25,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: T.separator,
  },
  title: { fontSize: 18, fontWeight: '700', color: T.textBase },
  subtitle: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  closeBtn: { fontSize: 18, color: T.textMuted, padding: 4 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: T.textMuted,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12,
  },
  fieldLabel: { fontSize: 11, color: T.textMuted, marginBottom: 5, letterSpacing: 0.5 },
  row: { flexDirection: 'row' },
  input: {
    backgroundColor: T.surfaceMid, color: T.textBase,
    borderRadius: 8, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: T.surfaceMid, borderRadius: 12, padding: 16,
    marginTop: 16, borderWidth: 1, borderColor: T.separator,
  },
  previewTop: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  previewName: { fontSize: 16, fontWeight: '700', color: T.textBase },
  previewType: { fontSize: 12, fontWeight: '400', color: T.textMuted },
  previewTone: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  previewGreeting: { fontSize: 12, color: T.green, fontStyle: 'italic', marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    alignItems: 'center', backgroundColor: T.surfaceCard,
    borderWidth: 1, borderColor: T.border,
  },
  typeBtnActive: { backgroundColor: T.bg, borderColor: T.green + '66' },
  typeBtnText: { fontSize: 11, fontWeight: '600', color: T.textMuted, textTransform: 'capitalize' },
  footer: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: T.separator,
    backgroundColor: T.surface,
  },
});
