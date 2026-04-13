import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, Dimensions,
  ScrollView, Animated, PanResponder, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T, STATUS, NOTIF_MESSAGES, makeAgent } from './constants';
import ArchitectSvg from './characters/ArchitectSvg';
import PilotSvg    from './characters/PilotSvg';
import CyclistSvg  from './characters/CyclistSvg';
import MiniChar    from './components/MiniChar';
import AgentPanel  from './components/AgentPanel';
import AgentCreatorModal from './components/AgentCreatorModal';
import ContextMenu from './components/ContextMenu';
import ModelCard   from './components/ModelCard';
import NotificationBubble from './components/NotificationBubble';

const { width: SW, height: SH } = Dimensions.get('window');
const CHAR_W = 72;
const STORAGE_KEY   = 'dock-rn-v3';
const API_KEY_STORE = 'dock-gemini-key';

// ─────────────────────────────────────────────────────────────────────────────
// Character with vertical bob when walking
// ─────────────────────────────────────────────────────────────────────────────
const CHAR_MAP = { architect: ArchitectSvg, pilot: PilotSvg, cyclist: CyclistSvg };

function CharWithBob({ agent }) {
  const bobAnim = useRef(new Animated.Value(0)).current;
  const isWalking = agent.state === 'walking';
  const speed = agent.type === 'cyclist' ? 250 : 380;

  useEffect(() => {
    if (isWalking) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(bobAnim, { toValue: -5, duration: speed, useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0,  duration: speed, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
    Animated.timing(bobAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }, [isWalking, agent.type]);

  const C = CHAR_MAP[agent.type] || CyclistSvg;
  return (
    <Animated.View style={{ transform: [{ translateY: bobAnim }] }}>
      <C isWalking={isWalking} size={110} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Walking Agent — animX is an Animated.Value, never causes re-renders
// ─────────────────────────────────────────────────────────────────────────────
function WalkingAgent({ agent, animX, onTap, onLongPress }) {
  const st = STATUS[agent.status] || STATUS.idle;
  const isWaiting = agent.state === 'waiting';

  const glowAnim = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    if (agent.status === 'working') {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.55, duration: 800, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
    glowAnim.setValue(0.9);
  }, [agent.status]);

  return (
    <Animated.View style={[styles.agentAnchor, { transform: [{ translateX: animX }], zIndex: isWaiting ? 60 : 50 }]}>
      {isWaiting && agent.notification && (
        <View style={styles.bubbleWrap}>
          <NotificationBubble
            notification={agent.notification}
            onAllow={() => onTap(agent, 'allow')}
            onDeny={()  => onTap(agent, 'deny')}
          />
        </View>
      )}

      <Pressable
        onPress={() => !isWaiting && onTap(agent)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress(agent);
        }}
        delayLongPress={500}
      >
        <Animated.View style={{ transform: [{ scaleX: agent.direction > 0 ? 1 : -1 }], opacity: glowAnim }}>
          <CharWithBob agent={agent} />
        </Animated.View>
        <View style={[styles.statusDot, { backgroundColor: isWaiting ? T.warning : st.color }]} />
      </Pressable>

      <Text style={styles.agentLabel} numberOfLines={1}>{agent.name}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable FAB — snaps to nearest horizontal edge on release
// ─────────────────────────────────────────────────────────────────────────────
function DraggableFAB({ onPress }) {
  const pos     = useRef(new Animated.ValueXY({ x: SW - 76, y: SH * 0.72 })).current;
  const lastPos = useRef({ x: SW - 76, y: SH * 0.72 });
  const wasDrag = useRef(false);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
    onPanResponderGrant: () => {
      wasDrag.current = false;
      pos.setOffset(lastPos.current);
      pos.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (_, gs) => {
      if (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) wasDrag.current = true;
      pos.setValue({ x: gs.dx, y: gs.dy });
    },
    onPanResponderRelease: (_, gs) => {
      pos.flattenOffset();
      const nx = lastPos.current.x + gs.dx;
      const ny = Math.max(90, Math.min(SH - 90, lastPos.current.y + gs.dy));
      const sx = nx + 28 > SW / 2 ? SW - 76 : 16;
      lastPos.current = { x: sx, y: ny };
      Animated.parallel([
        Animated.spring(pos.x, { toValue: sx, useNativeDriver: false, tension: 90, friction: 9 }),
        Animated.spring(pos.y, { toValue: ny, useNativeDriver: false, tension: 90, friction: 9 }),
      ]).start();
      if (!wasDrag.current) onPress();
    },
  })).current;

  return (
    <Animated.View style={[styles.fab, { left: pos.x, top: pos.y }]} {...pan.panHandlers}>
      <Text style={styles.fabIcon}>🐝</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hidden shelf icon
// ─────────────────────────────────────────────────────────────────────────────
function HiddenIcon({ agent, onTap, onLongPress }) {
  const st = STATUS[agent.status] || STATUS.idle;
  return (
    <Pressable
      onPress={() => onTap(agent)}
      onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLongPress(agent); }}
      delayLongPress={500}
      style={styles.hiddenIcon}
    >
      <View style={styles.hiddenIconBox}>
        <MiniChar type={agent.type} size={40} />
        <View style={[styles.hiddenDot, { backgroundColor: st.color }]} />
      </View>
      <Text style={styles.hiddenLabel} numberOfLines={1}>{agent.name}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAB Menu — slides up as a bottom sheet
// ─────────────────────────────────────────────────────────────────────────────
function FABMenu({ visible, onClose, onQuickAdd, onCreate, onShowAll, hiddenCount,
                   isGroupTask, onToggleGroup, apiKey, onSaveApiKey, agentCount }) {
  const [keyIn, setKeyIn] = useState(apiKey);
  const slideY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true, tension: 70, friction: 12,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.fabBackdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fabKAV}>
        <Animated.View style={[styles.fabSheet, { transform: [{ translateY: slideY }] }]}>
          <View style={styles.sheetHandle} />

          {/* Quick add */}
          <Text style={styles.fabSectionLabel}>QUICK ADD</Text>
          <View style={styles.quickRow}>
            {['architect', 'pilot', 'cyclist'].map(t => (
              <TouchableOpacity key={t} onPress={() => { onQuickAdd(t); onClose(); }} style={styles.quickBtn}>
                <MiniChar type={t} size={40} />
                <Text style={styles.quickLabel}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.menuActions}>
            {[
              { icon: '✦',  label: 'Create Agent',      sub: 'Full config',              action: onCreate },
              { icon: '📋', label: `All Agents`,         sub: `${agentCount} total`,       action: null, disabled: true },
              { icon: '👁️', label: hiddenCount > 0 ? `Show All (${hiddenCount})` : 'None Hidden', action: onShowAll, disabled: hiddenCount === 0 },
              { icon: isGroupTask ? '🟢' : '⚫', label: 'Group Mode', sub: isGroupTask ? 'On — agents collaborate' : 'Off', action: onToggleGroup },
            ].map((item, i) => (
              <TouchableOpacity key={i} disabled={item.disabled}
                onPress={() => { if (!item.disabled && item.action) { item.action(); onClose(); } }}
                style={[styles.menuActionRow, { opacity: item.disabled ? 0.35 : 1 }]}
              >
                <Text style={styles.menuActionIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuActionLabel}>{item.label}</Text>
                  {item.sub ? <Text style={styles.menuActionSub}>{item.sub}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gemini API Key */}
          <View style={styles.apiKeySection}>
            <View style={styles.apiKeyHeader}>
              <Text style={styles.fabSectionLabel}>GEMINI API KEY</Text>
              {apiKey ? <View style={styles.apiKeyConnected}><Text style={styles.apiKeyConnectedText}>● Connected</Text></View> : null}
            </View>
            <View style={styles.apiKeyRow}>
              <TextInput
                value={keyIn}
                onChangeText={setKeyIn}
                placeholder="AIzaSy…"
                placeholderTextColor={T.textMuted}
                secureTextEntry
                style={styles.apiKeyInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => { onSaveApiKey(keyIn); onClose(); }}
                style={styles.apiKeySaveBtn}
              >
                <Text style={styles.apiKeySaveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.apiKeyHint}>
              {apiKey ? 'Key saved — agents can chat with Gemini AI' : 'Get a free key at aistudio.google.com'}
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function DockScreen() {
  const insets = useSafeAreaInsets();

  const [agents,        setAgents]        = useState([]);
  const [chats,         setChats]         = useState({});
  const [activePanelId, setActivePanelId] = useState(null);
  const [inputValue,    setInputValue]    = useState('');
  const [isTyping,      setIsTyping]      = useState(false);
  const [showCreator,   setShowCreator]   = useState(false);
  const [showMenu,      setShowMenu]      = useState(false);
  const [ctxMenu,       setCtxMenu]       = useState(null);
  const [modelCardAgent,setModelCardAgent]= useState(null);
  const [isGroupTask,   setIsGroupTask]   = useState(false);
  const [apiKey,        setApiKey]        = useState('');

  // Per-agent animated x-position (pixel), mutated directly — no setState
  const animXMap  = useRef({});
  // Mutable position data used by the fast tick
  const posData   = useRef({});
  // Refs to avoid stale closures in intervals
  const agentsRef = useRef([]);
  useEffect(() => { agentsRef.current = agents; }, [agents]);
  const activePanelRef = useRef(null);
  useEffect(() => { activePanelRef.current = activePanelId; }, [activePanelId]);

  // ── Init helpers ───────────────────────────────────────────────────────────
  const initAnim = (agent) => {
    const px = (agent.x / 100) * SW - CHAR_W / 2;
    if (!animXMap.current[agent.id]) animXMap.current[agent.id] = new Animated.Value(px);
    posData.current[agent.id] = { x: agent.x, direction: agent.direction };
  };

  // ── Load persisted state ───────────────────────────────────────────────────
  const initDone = useRef(false);
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    (async () => {
      try { const k = await AsyncStorage.getItem(API_KEY_STORE); if (k) setApiKey(k); } catch {}
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.agents?.length > 0) {
            d.agents.forEach(a => {
              a.resumeTime  = Date.now() + 800;
              a.state       = a.hidden ? 'walking' : 'spawning';
              a.notification = null;
              initAnim(a);
            });
            setAgents(d.agents);
            if (d.chats) setChats(d.chats);
            return;
          }
        }
      } catch {}
      // First launch
      const first = makeAgent('cyclist', { state: 'walking', resumeTime: 0 });
      initAnim(first);
      setAgents([first]);
      setChats({ [first.id]: [{ role: 'assistant', text: `Hi! I'm ${first.name}. Tap me to get started!` }] });
    })();
  }, []);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const saveTimer = useRef(null);
  useEffect(() => {
    if (agents.length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const snap = agents.map(a => ({
          ...a,
          x:         posData.current[a.id]?.x ?? a.x,
          direction: posData.current[a.id]?.direction ?? a.direction,
          state: a.hidden ? 'walking' : (a.state === 'spawning' ? 'walking' : a.state),
          notification: null,
        }));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ agents: snap, chats }));
      } catch {}
    }, 1500);
  }, [agents, chats]);

  // ── Fast tick — 60 fps position updates, NO setState ──────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      for (const a of agentsRef.current) {
        if (a.hidden || a.status === 'paused' || a.state !== 'walking') continue;
        if (a.id === activePanelRef.current) continue;
        const pd = posData.current[a.id];
        if (!pd) continue;
        const speed = a.type === 'cyclist'
          ? (a.status === 'working' ? 0.11 : 0.065)
          : (a.status === 'working' ? 0.055 : 0.032);
        pd.x += pd.direction * speed;
        if (pd.x >= 92) { pd.direction = -1; pd.x = 92; }
        if (pd.x <= 8)  { pd.direction =  1; pd.x = 8;  }
        animXMap.current[a.id]?.setValue((pd.x / 100) * SW - CHAR_W / 2);
      }
    }, 16);
    return () => clearInterval(id);
  }, []); // intentionally empty — uses refs only

  // ── Slow tick — direction sync, spawning, notifications ───────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setAgents(prev => {
        let dirty = false;
        const next = prev.map(a => {
          if (a.hidden || a.status === 'paused') return a;
          const pd  = posData.current[a.id];
          const now = Date.now();
          let u = a;
          if (pd && pd.direction !== a.direction) { u = { ...u, direction: pd.direction }; dirty = true; }
          if (a.state === 'spawning' && now > a.resumeTime) { u = { ...u, state: 'walking' }; dirty = true; }
          if (a.state === 'walking' && a.status === 'working' && !a.notification && Math.random() < 0.007) {
            const cats = Object.keys(NOTIF_MESSAGES);
            const cat  = cats[Math.floor(Math.random() * cats.length)];
            const msgs = NOTIF_MESSAGES[cat];
            u = { ...u, state: 'waiting', notification: { ...msgs[Math.floor(Math.random() * msgs.length)], id: Math.random().toString(36).slice(2) } };
            dirty = true;
          }
          return u;
        });
        return dirty ? next : prev;
      });
    }, 150);
    return () => clearInterval(id);
  }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const updateAgent = (id, u) => setAgents(p => p.map(a => a.id === id ? { ...a, ...u } : a));

  const addAgent = type => {
    const a = makeAgent(type);
    initAnim(a);
    setAgents(p => [...p, a]);
    setChats(p => ({ ...p, [a.id]: [{ role: 'assistant', text: `Hi! I'm ${a.name}!` }] }));
  };

  const spawnFromCreator = spec => {
    const a = makeAgent(spec.type, {
      ...(spec.name ? { name: spec.name } : {}),
      ...(spec.skills?.length > 0 ? { skills: spec.skills } : {}),
      tools: spec.tools || [], mcps: spec.mcps || [],
      profession: spec.profession || '', description: spec.description || '',
      persona: spec.persona || '', tone: spec.tone || '',
    });
    initAnim(a);
    setAgents(p => [...p, a]);
    setChats(p => ({ ...p, [a.id]: [{ role: 'assistant', text: spec.greeting || `Hi! I'm ${a.name}!` }] }));
  };

  const removeAgent = id => {
    setAgents(p => p.filter(a => a.id !== id));
    delete animXMap.current[id];
    delete posData.current[id];
    if (activePanelId === id) setActivePanelId(null);
  };

  const hideAgent    = id => { updateAgent(id, { hidden: true }); setActivePanelId(null); };
  const restoreAgent = id => {
    const a = agentsRef.current.find(a => a.id === id);
    if (a && !posData.current[id]) initAnim(a);
    updateAgent(id, { hidden: false, state: 'spawning', resumeTime: Date.now() + 600 });
  };

  const respondNotif = (id) => setAgents(p => p.map(a =>
    a.id === id ? { ...a, state: 'walking', notification: null } : a
  ));

  const assignTask = (id, { title, description, skills }) => setAgents(p => p.map(a =>
    a.id === id ? {
      ...a, status: 'working',
      currentTask: { id: Math.random().toString(36).slice(2), title, description, skills, progress: 0, status: 'in_progress', startedAt: Date.now() },
    } : a
  ));

  const completeTask = id => {
    setAgents(p => p.map(a => a.id === id && a.currentTask ? {
      ...a, status: 'done',
      taskHistory: [...a.taskHistory, { ...a.currentTask, status: 'done', completedAt: Date.now() }],
      currentTask: null,
    } : a));
    setTimeout(() => setAgents(p => p.map(a => a.id === id && a.status === 'done' ? { ...a, status: 'idle' } : a)), 3000);
  };

  const failTask = id => {
    setAgents(p => p.map(a => a.id === id && a.currentTask ? {
      ...a, status: 'failed',
      taskHistory: [...a.taskHistory, { ...a.currentTask, status: 'failed', completedAt: Date.now() }],
      currentTask: null,
    } : a));
    setTimeout(() => setAgents(p => p.map(a => a.id === id && a.status === 'failed' ? { ...a, status: 'idle' } : a)), 3000);
  };

  // ── Chat ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputValue.trim() || !activePanelId) return;
    const msg = inputValue.trim();
    const aid = activePanelId;
    const agent = agents.find(a => a.id === aid);
    setChats(p => ({ ...p, [aid]: [...(p[aid] || []), { role: 'user', text: msg }] }));
    setInputValue('');
    setIsTyping(true);
    updateAgent(aid, { status: 'thinking' });
    const restore = () => updateAgent(aid, { status: agent?.currentTask ? 'working' : 'idle' });

    if (!apiKey) {
      setTimeout(() => {
        setChats(p => ({ ...p, [aid]: [...(p[aid] || []), { role: 'assistant', text: `Add a Gemini API key via the 🐝 menu to enable AI chat!` }] }));
        setIsTyping(false); restore();
      }, 700);
      return;
    }

    try {
      const pe   = { architect: 'an architect with blueprints', pilot: 'a drone pilot', cyclist: 'a cyclist' };
      const hist = (chats[aid] || []).slice(-8).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
      const res  = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          contents: [...hist, { role: 'user', parts: [{ text: msg }] }],
          systemInstruction: { parts: [{ text: `You are ${agent?.name}, a tiny ${pe[agent?.type]||'agent'}. ${agent?.currentTask?`Working on: "${agent.currentTask.title}".`:''} Reply in 1-3 sentences, stay in character, be helpful.` }] },
        }) }
      );
      const data  = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || (res.ok ? 'Try again!' : `Error ${res.status} — check your API key.`);
      setChats(p => ({ ...p, [aid]: [...(p[aid] || []), { role: 'assistant', text: reply }] }));
    } catch (e) {
      setChats(p => ({ ...p, [aid]: [...(p[aid] || []), { role: 'assistant', text: `Connection error: ${e.message}` }] }));
    } finally {
      setIsTyping(false); restore();
    }
  };

  // ── Context menu ───────────────────────────────────────────────────────────
  const handleCtx = action => {
    const a = ctxMenu?.agent;
    setCtxMenu(null);
    if (!a) return;
    switch (action) {
      case 'info':    setModelCardAgent(a); break;
      case 'restore': restoreAgent(a.id); break;
      case 'pause':   updateAgent(a.id, { status: a.status === 'paused' ? 'idle' : 'paused' }); break;
      case 'remove':  removeAgent(a.id); break;
      case 'chat':    restoreAgent(a.id); setTimeout(() => setActivePanelId(a.id), 350); break;
      case 'task':    restoreAgent(a.id); setTimeout(() => setActivePanelId(a.id), 350); break;
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const visible     = agents.filter(a => !a.hidden);
  const hidden      = agents.filter(a =>  a.hidden);
  const workingCnt  = agents.filter(a => a.status === 'working').length;
  const idleCnt     = agents.filter(a => a.status === 'idle').length;
  const activeAgent = agents.find(a => a.id === activePanelId);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full-screen walking stage */}
      <View style={styles.stage}>
        {visible.map(agent => {
          const ax = animXMap.current[agent.id];
          if (!ax) return null;
          return (
            <WalkingAgent key={agent.id} agent={agent} animX={ax}
              onTap={(ag, action) => {
                if (action === 'allow' || action === 'deny') respondNotif(ag.id);
                else setActivePanelId(activePanelId === ag.id ? null : ag.id);
              }}
              onLongPress={ag => setCtxMenu({ agent: ag })}
            />
          );
        })}
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.appTitle}>🐝  Agent Dock</Text>
        <View style={styles.topRight}>
          {workingCnt > 0 && (
            <View style={styles.badge}><View style={styles.greenDot}/><Text style={styles.badgeText}>{workingCnt} working</Text></View>
          )}
          {idleCnt > 0 && <Text style={styles.idleText}>{idleCnt} idle</Text>}
          <TouchableOpacity onPress={() => setIsGroupTask(v => !v)}
            style={[styles.groupBtn, isGroupTask && styles.groupBtnOn]}>
            <Text>👥</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hidden agents shelf */}
      {hidden.length > 0 && (
        <View style={[styles.shelf, { top: insets.top + 52 }]}>
          <Text style={styles.shelfTitle}>HIDDEN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 14 }}>
            {hidden.map(a => (
              <HiddenIcon key={a.id} agent={a}
                onTap={ag => setModelCardAgent(ag)}
                onLongPress={ag => setCtxMenu({ agent: ag })} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Draggable FAB */}
      <DraggableFAB onPress={() => setShowMenu(v => !v)} />

      {/* ─── Overlays ─── */}
      <FABMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onQuickAdd={addAgent}
        onCreate={() => setShowCreator(true)}
        onShowAll={() => hidden.forEach(a => restoreAgent(a.id))}
        hiddenCount={hidden.length}
        isGroupTask={isGroupTask}
        onToggleGroup={() => setIsGroupTask(v => !v)}
        apiKey={apiKey}
        agentCount={agents.length}
        onSaveApiKey={async v => {
          setApiKey(v);
          try { await AsyncStorage.setItem(API_KEY_STORE, v); } catch {}
        }}
      />

      {activeAgent && (
        <AgentPanel
          agent={activeAgent} chat={chats[activeAgent.id] || []}
          isTyping={isTyping} inputValue={inputValue} setInputValue={setInputValue}
          onClose={() => setActivePanelId(null)}
          onDelete={() => removeAgent(activeAgent.id)}
          onSendMessage={handleSend}
          onUpdateAgent={u => updateAgent(activeAgent.id, u)}
          onAssignTask={t => assignTask(activeAgent.id, t)}
          onCompleteTask={() => completeTask(activeAgent.id)}
          onFailTask={() => failTask(activeAgent.id)}
          onHide={() => hideAgent(activeAgent.id)}
        />
      )}

      {showCreator && <AgentCreatorModal onClose={() => setShowCreator(false)} onSpawn={spawnFromCreator} />}

      {modelCardAgent && (
        <ModelCard agent={modelCardAgent} onClose={() => setModelCardAgent(null)}
          onRespawn={() => { restoreAgent(modelCardAgent.id); setModelCardAgent(null); }}
          onRemove={() => { removeAgent(modelCardAgent.id); setModelCardAgent(null); }}
        />
      )}

      {ctxMenu && (
        <ContextMenu agent={ctxMenu.agent} position={{}} onClose={() => setCtxMenu(null)}
          onRestore={() => handleCtx('restore')} onInfo={() => handleCtx('info')}
          onChat={() => handleCtx('chat')}       onTask={() => handleCtx('task')}
          onPause={() => handleCtx('pause')}     onRemove={() => handleCtx('remove')}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: T.bg },
  stage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  agentAnchor: { position: 'absolute', bottom: 0, width: CHAR_W, alignItems: 'center' },
  bubbleWrap:  { position: 'absolute', bottom: '100%', marginBottom: 10, left: '50%', transform: [{ translateX: -110 }], zIndex: 70 },
  statusDot:   { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: T.bg },
  agentLabel:  { fontSize: 10, fontWeight: '600', color: T.textMuted, marginTop: 2, textAlign: 'center', maxWidth: 66 },

  topBar:   { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: T.bg + 'dd' },
  appTitle: { fontSize: 16, fontWeight: '700', color: T.textBase },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  badgeText:{ fontSize: 11, fontWeight: '700', color: T.green },
  idleText: { fontSize: 11, color: T.textMuted },
  groupBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: T.surfaceMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  groupBtnOn: { borderColor: T.green, backgroundColor: T.green + '18' },

  shelf:      { position: 'absolute', left: 0, right: 0, zIndex: 10, paddingBottom: 6 },
  shelfTitle: { fontSize: 9, fontWeight: '700', color: T.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', paddingHorizontal: 14, marginBottom: 6 },
  hiddenIcon:    { alignItems: 'center', width: 60 },
  hiddenIconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: T.surfaceMid, alignItems: 'center', justifyContent: 'flex-end', borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  hiddenDot:     { position: 'absolute', top: 3, right: 3, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: T.bg },
  hiddenLabel:   { fontSize: 10, fontWeight: '600', color: T.textMuted, marginTop: 3, textAlign: 'center' },

  fab:     { position: 'absolute', width: 56, height: 56, borderRadius: 16, backgroundColor: T.surfaceCard, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 12, elevation: 12, borderWidth: 1, borderColor: T.border, zIndex: 100 },
  fabIcon: { fontSize: 26 },

  fabBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  fabKAV:      { position: 'absolute', bottom: 0, left: 0, right: 0 },
  fabSheet:    { backgroundColor: T.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, paddingBottom: 32, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: T.separator },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.border, alignSelf: 'center', marginBottom: 18 },

  fabSectionLabel: { fontSize: 10, fontWeight: '700', color: T.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 },
  quickRow:        { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickBtn:        { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: T.surfaceMid, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  quickLabel:      { fontSize: 9, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },

  menuActions:     { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: T.separator, marginBottom: 20 },
  menuActionRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: T.surfaceMid, borderBottomWidth: 1, borderBottomColor: T.separator },
  menuActionIcon:  { fontSize: 18, width: 26, textAlign: 'center' },
  menuActionLabel: { fontSize: 14, fontWeight: '600', color: T.textBase },
  menuActionSub:   { fontSize: 11, color: T.textMuted, marginTop: 1 },

  apiKeySection:       { borderRadius: 12, backgroundColor: T.surfaceMid, padding: 14, borderWidth: 1, borderColor: T.separator },
  apiKeyHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  apiKeyConnected:     { flexDirection: 'row', alignItems: 'center' },
  apiKeyConnectedText: { fontSize: 11, fontWeight: '700', color: T.green },
  apiKeyRow:           { flexDirection: 'row', gap: 8, marginBottom: 8 },
  apiKeyInput:         { flex: 1, backgroundColor: T.bg, color: T.textBase, borderRadius: 8, borderWidth: 1, borderColor: T.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  apiKeySaveBtn:       { backgroundColor: T.green, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  apiKeySaveBtnText:   { fontSize: 13, fontWeight: '700', color: '#000', letterSpacing: 0.5 },
  apiKeyHint:          { fontSize: 11, color: T.textMuted },
});
