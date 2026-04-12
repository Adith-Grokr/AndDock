import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { T } from '../constants';

const VARIANTS = {
  primary: {
    bg: T.green,
    text: '#000000',
    border: 'transparent',
  },
  dark: {
    bg: T.surfaceMid,
    text: T.textBase,
    border: T.border,
  },
  outline: {
    bg: 'transparent',
    text: T.textBase,
    border: T.borderMuted,
  },
  danger: {
    bg: 'transparent',
    text: T.negative,
    border: T.negative + '44',
  },
  ghost: {
    bg: 'transparent',
    text: T.textMuted,
    border: 'transparent',
  },
  surface: {
    bg: T.surface,
    text: T.textBase,
    border: T.separator,
  },
};

export default function Btn({
  children,
  onPress,
  disabled,
  variant = 'dark',
  style,
  textStyle,
  loading,
  small,
}) {
  const v = VARIANTS[variant] || VARIANTS.dark;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        small && styles.small,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: disabled ? 0.35 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={[styles.label, small && styles.smallLabel, { color: v.text }, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 500,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  small: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  smallLabel: {
    fontSize: 12,
    letterSpacing: 1.2,
  },
});
