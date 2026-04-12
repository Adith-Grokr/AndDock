import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
} from 'react-native';
import { T, STATUS } from '../constants';
import MiniChar from './MiniChar';
import Btn from './Btn';

export default function ModelCard({ agent, onClose, onRespawn, onRemove }) {
  const st = STATUS[agent.status] || STATUS.idle;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.card}>
        {/* Character preview */}
        <View style={styles.preview}>
          <MiniChar type={agent.type} size={120} />
          <View style={styles.statusPill}>
            <View style={[styles.dot, { backgroundColor: st.color }]} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{agent.name}</Text>
          <Text style={styles.type}>
            {agent.type}{agent.profession ? ` · ${agent.profession}` : ''}
          </Text>

          {agent.description ? (
            <Text style={styles.desc}>{agent.description}</Text>
          ) : null}

          <Text style={styles.sectionLabel}>SKILLS</Text>
          <View style={styles.tags}>
            {agent.skills.slice(0, 6).map(s => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>

          {agent.currentTask ? (
            <View style={styles.activeTask}>
              <Text style={styles.activeTaskLabel}>ACTIVE TASK</Text>
              <Text style={styles.activeTaskTitle}>{agent.currentTask.title}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Btn variant="danger" onPress={onRemove} style={{ flex: 1 }}>Remove</Btn>
          <Btn variant="primary" onPress={onRespawn} style={{ flex: 2, marginLeft: 10 }}>
            ↓ Respawn to Dock
          </Btn>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  card: {
    position: 'absolute',
    alignSelf: 'center',
    top: '15%',
    width: '85%',
    backgroundColor: T.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, elevation: 20,
    borderWidth: 1, borderColor: T.separator,
  },
  preview: {
    height: 160, backgroundColor: T.bg,
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 0,
  },
  statusPill: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.surface, borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: T.separator,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  info: { padding: 20 },
  name: { fontSize: 22, fontWeight: '700', color: T.textBase },
  type: { fontSize: 12, color: T.textMuted, marginTop: 2, textTransform: 'capitalize' },
  desc: { fontSize: 13, color: T.textMuted, lineHeight: 18, marginTop: 10 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: T.textMuted,
    letterSpacing: 1.4, textTransform: 'uppercase',
    marginTop: 14, marginBottom: 8,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: T.green + '18', borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: T.green + '33',
  },
  tagText: { fontSize: 11, fontWeight: '700', color: T.green },
  activeTask: {
    marginTop: 14, backgroundColor: T.green + '10',
    borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: T.green + '33',
  },
  activeTaskLabel: {
    fontSize: 9, fontWeight: '700', color: T.green,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4,
  },
  activeTaskTitle: { fontSize: 14, fontWeight: '700', color: T.green },
  actions: {
    flexDirection: 'row', padding: 16,
    borderTopWidth: 1, borderTopColor: T.separator,
  },
});
