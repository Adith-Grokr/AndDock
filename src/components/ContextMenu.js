import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { T, STATUS } from '../constants';

export default function ContextMenu({
  agent, position, onClose,
  onRestore, onInfo, onChat, onTask, onPause, onRemove,
}) {
  const st = STATUS[agent.status] || STATUS.idle;
  const isPaused = agent.status === 'paused';

  const items = [
    { icon: 'ℹ️', label: 'Agent Info',      action: onInfo },
    { icon: '🚀', label: 'Restore to Dock',  action: onRestore },
    { icon: isPaused ? '▶️' : '⏸️', label: isPaused ? 'Resume' : 'Pause', action: onPause },
    { icon: '💬', label: 'Chat',             action: onChat },
    { icon: '📋', label: 'Assign Task',      action: onTask },
    { icon: '✕',  label: 'Remove',           action: onRemove, danger: true },
  ];

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.menu}>
        {/* Header */}
        <View style={styles.menuHeader}>
          <View style={[styles.dot, { backgroundColor: st.color }]} />
          <Text style={styles.menuName}>{agent.name}</Text>
          <Text style={styles.menuType}>{agent.type}</Text>
        </View>
        {/* Items */}
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { onClose(); item.action && item.action(); }}
            style={[styles.menuItem, i > 0 && styles.menuItemBorder]}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuLabel, item.danger && { color: T.negative }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menu: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    width: 220,
    backgroundColor: T.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
    borderWidth: 1, borderColor: T.separator,
  },
  menuHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.separator,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  menuName: { fontSize: 15, fontWeight: '700', color: T.textBase, flex: 1 },
  menuType: { fontSize: 11, color: T.textMuted, textTransform: 'capitalize' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: T.separator },
  menuIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600', color: T.textBase },
});
