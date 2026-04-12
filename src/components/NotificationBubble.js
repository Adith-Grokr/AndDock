import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { T } from '../constants';
import Btn from './Btn';

export default function NotificationBubble({ notification, onAllow, onDeny }) {
  const typeColor = {
    permission: T.warning,
    question: T.info,
    info: T.green,
  }[notification.type] || T.textMuted;

  const typeLabel = {
    permission: '🔐 Permission',
    question: '❓ Question',
    info: '💬 Info',
  }[notification.type] || 'Notice';

  return (
    <View style={styles.bubble}>
      <View style={styles.pulse} />
      <Text style={[styles.typeLabel, { color: typeColor }]}>{typeLabel}</Text>
      <Text style={styles.msg}>{notification.msg}</Text>
      <View style={styles.actions}>
        {notification.type === 'info' ? (
          <Btn variant="dark" onPress={onAllow} style={{ flex: 1 }} small>Got it</Btn>
        ) : (
          <>
            <Btn variant="outline" onPress={onDeny} style={{ flex: 1 }} small>Deny</Btn>
            <Btn variant="primary" onPress={onAllow} style={{ flex: 1, marginLeft: 8 }} small>Allow</Btn>
          </>
        )}
      </View>
      {/* Triangle pointer */}
      <View style={styles.pointer} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: 220,
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16,
    elevation: 10,
    borderWidth: 1, borderColor: T.separator,
  },
  pulse: {
    position: 'absolute', top: -4, right: -4,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: T.warning,
  },
  typeLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  msg: {
    fontSize: 12, color: T.textMuted, lineHeight: 17, marginBottom: 12,
  },
  actions: { flexDirection: 'row' },
  pointer: {
    position: 'absolute', bottom: -8, left: '50%', marginLeft: -8,
    width: 16, height: 16, backgroundColor: T.surface,
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: T.separator,
  },
});
