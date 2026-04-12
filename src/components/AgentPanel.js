import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, Animated, StyleSheet, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { T, STATUS } from '../constants';
import Btn from './Btn';

const { height: SCREEN_H } = Dimensions.get('window');

function TabBar({ tab, setTab, hasTask }) {
  const tabs = ['overview', 'task', 'chat'];
  return (
    <View style={styles.tabBar}>
      {tabs.map(t => (
        <TouchableOpacity key={t} onPress={() => setTab(t)} style={styles.tabBtn}>
          <Text style={[styles.tabLabel, tab === t && styles.tabActive]}>
            {t === 'task' && hasTask ? 'Task ●' : t.charAt(0).toUpperCase() + t.slice(1)}
          </Text>
          {tab === t && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AgentPanel({
  agent, chat, isTyping, inputValue, setInputValue,
  onClose, onDelete, onSendMessage, onUpdateAgent,
  onAssignTask, onCompleteTask, onFailTask, onHide,
}) {
  const [tab, setTab] = useState(agent.currentTask ? 'task' : 'overview');
  const [editName, setEditName] = useState(false);
  const [nameIn, setNameIn] = useState(agent.name);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSkills, setTaskSkills] = useState([]);
  const chatEndRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
    }).start();
  }, []);

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_H, duration: 250, useNativeDriver: true,
    }).start(onClose);
  };

  useEffect(() => {
    chatEndRef.current?.scrollToEnd({ animated: true });
  }, [chat, isTyping]);

  const st = STATUS[agent.status] || STATUS.idle;

  const doAssign = () => {
    if (!taskTitle.trim()) return;
    onAssignTask({ title: taskTitle.trim(), description: taskDesc.trim(), skills: taskSkills });
    setTaskTitle(''); setTaskDesc(''); setTaskSkills([]);
    setTab('task');
  };

  const commitName = () => {
    if (nameIn.trim()) onUpdateAgent({ name: nameIn.trim() });
    setEditName(false);
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.dot, { backgroundColor: st.color }]} />
            {editName ? (
              <TextInput
                autoFocus
                value={nameIn}
                onChangeText={setNameIn}
                onBlur={commitName}
                onSubmitEditing={commitName}
                style={styles.nameInput}
              />
            ) : (
              <TouchableOpacity onPress={() => setEditName(true)}>
                <Text style={styles.agentName}>{agent.name}</Text>
              </TouchableOpacity>
            )}
            <View style={[styles.statusBadge, { backgroundColor: st.color + '22' }]}>
              <Text style={[styles.statusLabel, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={onHide} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>⊟</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
              <Text style={[styles.iconBtnText, { color: T.negative }]}>🗑</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={close} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TabBar tab={tab} setTab={setTab} hasTask={!!agent.currentTask} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TYPE</Text>
                <Text style={styles.sectionValue}>
                  {agent.type}{agent.profession ? ` · ${agent.profession}` : ''}
                </Text>

                {agent.description ? (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 16 }]}>ABOUT</Text>
                    <Text style={styles.desc}>{agent.description}</Text>
                  </>
                ) : null}

                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>SKILLS</Text>
                <View style={styles.tags}>
                  {agent.skills.map(s => (
                    <View key={s} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{s}</Text>
                    </View>
                  ))}
                </View>

                {agent.tools?.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 16 }]}>TOOLS</Text>
                    <View style={styles.tags}>
                      {agent.tools.map(t => (
                        <View key={t} style={styles.toolTag}>
                          <Text style={styles.toolTagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* ── TASK ── */}
            {tab === 'task' && (
              <View style={styles.section}>
                {agent.currentTask ? (
                  <View style={styles.taskCard}>
                    <Text style={styles.taskTitle}>{agent.currentTask.title}</Text>
                    {agent.currentTask.description ? (
                      <Text style={styles.taskDesc}>{agent.currentTask.description}</Text>
                    ) : null}
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressValue}>{agent.currentTask.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${agent.currentTask.progress}%` }]} />
                    </View>
                    <View style={styles.taskActions}>
                      <Btn variant="primary" onPress={onCompleteTask} style={{ flex: 1 }} small>
                        Mark Done
                      </Btn>
                      <Btn variant="danger" onPress={onFailTask} style={{ flex: 1, marginLeft: 8 }} small>
                        Failed
                      </Btn>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.sectionLabel}>ASSIGN TASK</Text>
                    <TextInput
                      value={taskTitle}
                      onChangeText={setTaskTitle}
                      placeholder="Task title…"
                      placeholderTextColor={T.textMuted}
                      style={styles.textInput}
                    />
                    <TextInput
                      value={taskDesc}
                      onChangeText={setTaskDesc}
                      placeholder="Description…"
                      placeholderTextColor={T.textMuted}
                      multiline
                      numberOfLines={2}
                      style={[styles.textInput, { marginTop: 8, minHeight: 60 }]}
                    />
                    <View style={[styles.tags, { marginTop: 10 }]}>
                      {agent.skills.map(s => (
                        <TouchableOpacity
                          key={s}
                          onPress={() =>
                            setTaskSkills(p =>
                              p.includes(s) ? p.filter(x => x !== s) : [...p, s]
                            )
                          }
                          style={[
                            styles.skillToggle,
                            taskSkills.includes(s) && styles.skillToggleActive,
                          ]}
                        >
                          <Text style={[
                            styles.skillToggleText,
                            taskSkills.includes(s) && { color: T.green },
                          ]}>
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Btn
                      variant="primary"
                      onPress={doAssign}
                      disabled={!taskTitle.trim()}
                      style={{ marginTop: 14 }}
                    >
                      Assign Task →
                    </Btn>
                  </View>
                )}

                {agent.taskHistory.length > 0 && (
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionLabel}>HISTORY</Text>
                    {[...agent.taskHistory].reverse().slice(0, 5).map((t, i) => (
                      <View key={i} style={styles.historyItem}>
                        <Text style={{ color: t.status === 'done' ? T.green : T.negative }}>
                          {t.status === 'done' ? '✓' : '✗'}
                        </Text>
                        <Text style={styles.historyTitle} numberOfLines={1}>{t.title}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── CHAT ── */}
            {tab === 'chat' && (
              <View style={styles.section}>
                <ScrollView
                  ref={chatEndRef}
                  style={{ maxHeight: 340 }}
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  {chat.map((m, i) => (
                    <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAgent]}>
                      <Text style={[styles.bubbleText, m.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAgent]}>
                        {m.text}
                      </Text>
                    </View>
                  ))}
                  {isTyping && (
                    <View style={[styles.bubble, styles.bubbleAgent]}>
                      <Text style={styles.bubbleTextAgent}>•••</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

          </ScrollView>

          {/* Chat input */}
          {tab === 'chat' && (
            <View style={styles.chatInput}>
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={onSendMessage}
                placeholder="Message…"
                placeholderTextColor={T.textMuted}
                style={styles.chatTextInput}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={onSendMessage}
                disabled={!inputValue.trim()}
                style={[styles.sendBtn, !inputValue.trim() && { opacity: 0.3 }]}
              >
                <Text style={styles.sendBtnText}>↑</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
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
    maxHeight: SCREEN_H * 0.88,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 20,
  },
  handle: {
    alignSelf: 'center', width: 36, height: 4,
    backgroundColor: T.border, borderRadius: 2, marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.separator,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  agentName: { fontSize: 18, fontWeight: '700', color: T.textBase },
  nameInput: {
    fontSize: 16, fontWeight: '700', color: T.textBase,
    borderBottomWidth: 2, borderBottomColor: T.green,
    paddingVertical: 0, minWidth: 80,
  },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 9999,
  },
  statusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  headerRight: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  iconBtnText: { fontSize: 16, color: T.textMuted },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: T.separator,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabLabel: { fontSize: 13, fontWeight: '600', color: T.textMuted, letterSpacing: 0.3 },
  tabActive: { color: T.textBase },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 2, backgroundColor: T.green, borderRadius: 1,
  },
  body: { flex: 1 },
  section: { padding: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: T.textMuted,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8,
  },
  sectionValue: { fontSize: 14, fontWeight: '600', color: T.textBase, textTransform: 'capitalize' },
  desc: { fontSize: 14, color: T.textMuted, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    backgroundColor: T.green + '18',
    borderWidth: 1, borderColor: T.green + '33',
    borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 5,
  },
  skillTagText: { fontSize: 11, fontWeight: '700', color: T.green, letterSpacing: 0.3 },
  toolTag: {
    backgroundColor: T.surfaceCard,
    borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 5,
  },
  toolTagText: { fontSize: 11, color: T.textMuted },
  taskCard: {
    backgroundColor: T.surfaceMid, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: T.separator,
  },
  taskTitle: { fontSize: 18, fontWeight: '700', color: T.textBase, marginBottom: 6 },
  taskDesc: { fontSize: 13, color: T.textMuted, lineHeight: 18, marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  progressValue: { fontSize: 11, fontWeight: '700', color: T.textBase },
  progressBar: {
    height: 4, backgroundColor: T.border, borderRadius: 2, overflow: 'hidden', marginBottom: 16,
  },
  progressFill: { height: '100%', backgroundColor: T.green, borderRadius: 2 },
  taskActions: { flexDirection: 'row' },
  textInput: {
    backgroundColor: T.surfaceMid, color: T.textBase,
    borderRadius: 8, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
  },
  skillToggle: {
    borderWidth: 1, borderColor: T.border, borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  skillToggleActive: { borderColor: T.green, backgroundColor: T.green + '18' },
  skillToggleText: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.surfaceMid, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
  },
  historyTitle: { flex: 1, fontSize: 13, color: T.textMuted },
  bubble: { marginBottom: 8, maxWidth: '85%' },
  bubbleUser: { alignSelf: 'flex-end' },
  bubbleAgent: { alignSelf: 'flex-start' },
  bubbleText: { fontSize: 14, lineHeight: 20, borderRadius: 16, overflow: 'hidden', padding: 10 },
  bubbleTextUser: { backgroundColor: T.green, color: '#000', borderBottomRightRadius: 4 },
  bubbleTextAgent: {
    backgroundColor: T.surfaceCard, color: T.textMuted,
    borderBottomLeftRadius: 4,
  },
  chatInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: T.separator,
    backgroundColor: T.surface,
  },
  chatTextInput: {
    flex: 1, color: T.textBase, fontSize: 14,
    backgroundColor: T.surfaceMid, borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.green, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#000', fontSize: 18, fontWeight: '700' },
});
