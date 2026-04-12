import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { T } from '../constants';

export default function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const ref = useRef(null);

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity onPress={() => onChange(tags.filter(t => t !== tag))}>
              <Text style={styles.tagRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TextInput
          ref={ref}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={add}
          onBlur={add}
          placeholder={tags.length === 0 ? placeholder : ''}
          placeholderTextColor={T.textMuted}
          returnKeyType="done"
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.surfaceMid,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    padding: 8,
    minHeight: 44,
  },
  inner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.green + '22',
    borderWidth: 1,
    borderColor: T.green + '55',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.green,
    letterSpacing: 0.3,
  },
  tagRemove: {
    fontSize: 14,
    color: T.negative,
    lineHeight: 16,
  },
  input: {
    color: T.textBase,
    fontSize: 13,
    minWidth: 80,
    flex: 1,
    paddingVertical: 2,
  },
});
