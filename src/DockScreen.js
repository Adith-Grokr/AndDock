import React, {
  useState, useEffect, useRef,
} from 'react';
import {
  View, Text, TouchableOpacity, Pressable, Dimensions,
  ScrollView, Animated, PanResponder, StyleSheet, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T, STATUS, NOTIF_MESSAGES, makeAgent } from './constants';
import ArchitectSvg from './characters/ArchitectSvg';
import PilotSvg from './characters/PilotSvg';
import CyclistSvg from './characters/CyclistSvg';
import MiniChar from './components/MiniChar';
import AgentPanel from './components/AgentPanel';
import AgentCreatorModal from './components/AgentCreatorModal';
import ContextMenu from './components/ContextMenu';
import ModelCard from './components/ModelCard';
import NotificationBubble from './components/NotificationBubble';

const { width: SW, height: SH } = Dimensions.get('window');
const CHAR_W = 72;
const STORAGE_KEY  = 'dock-rn-v2';
const API_KEY_STORE = 'dock-gemini-key';

const CHAR_MAP = { architect: ArchitectSvg, pilot: PilotSvg, cyclist: CyclistSvg };
function CharComp({ agent }) {
  const C = CHAR_MAP[agent.type] || CyclistSvg;
  return <C isWalking size={110} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Walking Agent — receives an Animated.Value for x so position never causes
// a React re-render (runs on the native animation thread via setValue).
// ─────────────────────────────────────────────────────────────────────────────
function WalkingAgent({ agent, animX, onTap, onLongPress }) {
  const st = STATUS[agent.status] || STATUS.idle;
  const isWaiting = agent.state === 'waiting';

  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (agent.status === 'working') {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
    glowAnim.setValue(0.6);
  }, [agent.status]);

  const opacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    // translateX drives the horizontal walk — no setState needed here
    <Animated.View style={[styles.agentAnchor, {
      transform: [{ translateX: animX }],
      zIndex: isWaiting ? 60 : 50,
    }]}>
      {/* Notification bubble */}
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
        <Animated.View style={{
          transform: [{ scaleX: agent.direction > 0 ? 1 : -1 }],
          opacity,
        }}>
          <CharComp agent={agent} />
        </Animated.View>

        {/* Status dot */}
        <View style={[styles.statusDot, {
          backgroundColor: isWaiting ? T.warning : st.color,
        }]} />
      </Pressable>

      <Text style={styles.agentLabel} numberOfLines={1}>{agent.name}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable FAB — snaps to nearest edge on release, opens menu on tap
// ─────────────────────────────────────────────────────────────────────────────
function DraggableFAB({ onPress }) {
  const fabAnim  = useRef(new Animated.ValueXY({ x: SW - 76, y: SH * 0.75 })).current;
  const lastPos  = useRef({ x: SW - 76, y: SH * 0.75 });
  const wasDrag  = useRef(false);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: ()       => true,
    onMoveShouldSetPanResponder:  (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,

    onPanResponderGrant: () => {
      wasDrag.current = false;
      fabAnim.setOffset(lastPos.current);
      fabAnim.setValue({ x: 0, y: 0 });
    },

    onPanResponderMove: (_, gs) => {
      if (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) wasDrag.current = true;
      fabAnim.setValue({ x: gs.dx, y: gs.dy });
    },

    onPanResponderRelease: (_, gs) => {
      fabAnim.flattenOffset();
      const rawX  = lastPos.current.x + gs.dx;
      const rawY  = lastPos.current.y + gs.dy;
      const snapX = rawX + 28 > SW / 2 ? SW - 76 : 20;   // snap left or right edge
      const snapY = Math.max(80, Math.min(SH - 100, rawY));
      lastPos.current = { x: snapX, y: snapY };

      Animated.parallel([
        Animated.spring(fabAnim.x, { toValue: snapX, useNativeDriver: false, tension: 80, friction: 8 }),
        Animated.spring(fabAnim.y, { toValue: snapY, useNativeDriver: false, tension: 80, friction: 8 }),
      ]).start();

      if (!wasDrag.current) onPress();
    },
  })).current;

  return (
    <Animated.View
      style={[styles.fab, { left: fabAnim.x, top: fabAnim.y }]}
      {...panResponder.panHandlers}
    >
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
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(agent);
      }}
      delayLongPress={500}
      style={styles.hiddenIcon}
    >
      <View style={styles.hiddenIconBox}>
        <MiniChar type={agent.type} size={42} />
        <View style={[styles.hiddenDot, { backgroundColor: st.color }]} />
      </View>
      <Text style={styles.hiddenLabel} numberOfLines={1}>{agent.name}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAB dropdown menu
// ─────────────────────────────────────────────────────────────────────────────
function FABMenu({ visible, onClose, onQuickAdd, onCreate, onShowAll, hiddenCount, isGroupTask, onToggleGroup }) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.fabBackdrop} onPress={onClose} />
      <View style={styles.fabMenu}>
        <View style={styles.fabSection}>
          <Text style={styles.fabSectionLabel}>QUICK ADD</Text>
          <View style={styles.quickRow}>
            {['architect', 'pilot', 'cyclist'].map(t => (
              <TouchableOpacity key={t} onPress={() => { onQuickAdd(t); onClose(); }} style={styles.quickBtn}>
                <MiniChar type={t} size={38} />
                <Text style={styles.quickLabel}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {[
          { icon: '✦',  label: 'Create Agent',     sub: 'Full config',            action: onCreate },
          { icon: '👁️', label: hiddenCount > 0 ? `Show All (${hiddenCount})` : 'None Hidden', action: onShowAll, disabled: hiddenCount === 0 },
          { icon: isGroupTask ? '🟢' : '⚪', label: 'Group Task', sub: isGroupTask ? 'Active' : 'Off', action: onToggleGroup },
        ].map((item, i) => (
          <TouchableOpacity key={i} disabled={item.disabled}
            onPress={() => { if (!item.disabled) { item.action(); onClose(); } }}
            style={[styles.fabItem, { opacity: item.disabled ? 0.3 : 1 }]}
          >
            <Text style={styles.fabItemIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.fabItemLabel}>{item.label}</Text>
              {item.sub ? <Text style={styles.fabItemSub}>{item.sub}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function DockScreen() {
  const insets = useSafeAreaInsets();

  const [agents,       setAgents]       = useState([]);
  const [chats,        setChats]        = useState({});
  const [activePanelId,setActivePanelId]= useState(null);
  const [inputValue,   setInputValue]   = useState('');
  const [isTyping,     setIsTyping]     = useState(false);
  const [showCreator,  setShowCreator]  = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [ctxMenu,      setCtxMenu]      = useState(null);
  const [modelCardAgent, setModelCardAgent] = useState(null);
  const [isGroupTask,  setIsGroupTask]  = useState(false);
  const [apiKey,       setApiKey]       = useState('');

  // ── Animation maps (mutated directly, no setState) ────────────────────────
  // animXMap: agentId → Animated.Value(pixel x with CHAR_W/2 offset)
  const animXMap   = useRef({});
  // posData:  agentId → { x (%), direction, paused }  — live mutable position
  const posData    = useRef({});
  // Keep a ref mirror of agents for the animation tick closure
  const agentsRef  = useRef([]);
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const initAnim = (agent) => {
    const px = (agent.x / 100) * SW - CHAR_W / 2;
    animXMap.current[agent.id] = new Animated.Value(px);
    posData.current[agent.id]  = {
      x:         agent.x,
      direction: agent.direction,
    };
  };

  const getAnimX = (id) => animXMap.current[id];

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
        // Sync animated positions back to agent.x before saving
        const snap = agents.map(a => {
          const pd = posData.current[a.id];
          return {
            ...a,
            x:    pd ? pd.x    : a.x,
            direction: pd ? pd.direction : a.direction,
            state: a.hidden ? 'walking' : a.state === 'spawning' ? 'walking' : a.state,
            notification: null,
          };
        });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ agents: snap, chats }));
      } catch {}
    }, 1500);
  }, [agents, chats]);

  // ── Fast animation tick (16 ms ≈ 60 fps) ─────────────────────────────────
  // Runs OUTSIDE React state — calls Animated.Value.setValue directly.
  // Only position and direction change here; no re-renders triggered.
  useEffect(() => {
    const FRAME = 16;
    const fastTick = setInterval(() => {
      const now = Date.now();
      for (const a of agentsRef.current) {
        if (a.hidden || a.status === 'paused' || a.state !== 'walking') continue;
        if (a.id === activePanelId) continue;

        const pd = posData.current[a.id];
        if (!pd) continue;

        const speed = a.type === 'cyclist'
          ? (a.status === 'working' ? 0.12 : 0.07)
          : (a.status === 'working' ? 0.06 : 0.035);

        pd.x += pd.direction * speed;
        if (pd.x >= 92) { pd.direction = -1; pd.x = 92; }
        if (pd.x <= 8)  { pd.direction =  1; pd.x = 8;  }

        const px = (pd.x / 100) * SW - CHAR_W / 2;
        animXMap.current[a.id]?.setValue(px);
      }
    }, FRAME);
    return () => clearInterval(fastTick);
  }, [activePanelId]);  // re-create if panel opens/closes

  // ── Slow state tick (120 ms) — direction sync, notifications, etc. ────────
  useEffect(() => {
    const slowTick = setInterval(() => {
      setAgents(prev => {
        let dirty = false;
        const next = prev.map(a => {
          if (a.hidden || a.status === 'paused') return a;

          const pd  = posData.current[a.id];
          const now = Date.now();
          let upd   = a;

          // Sync direction from posData (changed by fast tick)
          if (pd && pd.direction !== a.direction) {
            upd = { ...upd, direction: pd.direction };
            dirty = true;
          }

          // Spawning → walking
          if (a.state === 'spawning' && now > a.resumeTime) {
            upd = { ...upd, state: 'walking' };
            dirty = true;
          }

          // Random notification while working
          if (
            a.state === 'walking' &&
            a.status === 'working' &&
            !a.notification &&
            Math.random() < 0.008
          ) {
            const cats = Object.keys(NOTIF_MESSAGES);
            const cat  = cats[Math.floor(Math.random() * cats.length)];
            const msgs = NOTIF_MESSAGES[cat];
            const notif = msgs[Math.floor(Math.random() * msgs.length)];
            upd = { ...upd, state: 'waiting', notification: { ...notif, id: Math.random().toString(36).slice(2) } };
            dirty = true;
          }

          return upd;
        });

        return dirty ? next : prev;
      });
    }, 120);
    return () => clearInterval(slowTick);
  }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const updateAgent = (id, u) => setAgents(p => p.map(a => a.id === id ? { ...a, ...u } : a));

  const addAgent = type => {
    const agent = makeAgent(type);
    initAnim(agent);
    setAgents(p => [...p, agent]);
    setChats(p => ({ ...p, [agent.id]: [{ role: 'assistant', text: `Hi! I'm ${agent.name}!` }] }));
  };

  const spawnFromCreator = spec => {
    const agent = makeAgent(spec.type, {
      ...(spec.name ? { name: spec.name } : {}),
      ...(spec.skills?.length > 0 ? { skills: spec.skills } : {}),
      tools: spec.tools || [], mcps: spec.mcps || [],
      profession: spec.profession || '', description: spec.description || '',
      persona: spec.persona || '', tone: spec.tone || '',
    });
    initAnim(agent);
    setAgents(p => [...p, agent]);
    setChats(p => ({ ...p, [agent.id]: [{ role: 'assistant', text: spec.greeting || `Hi! I'm ${agent.name}!` }] }));
  };

  const removeAgent = id => {
    setAgents(p => p.filter(a => a.id !== id));
    delete animXMap.current[id];
    delete posData.current[id];
    if (activePanelId === id) setActivePanelId(null);
  };

  const hideAgent    = id => { updateAgent(id, { hidden: true }); setActivePanelId(null); };
  const restoreAgent = id => {
    updateAgent(id, { hidden: false, state: 'spawning', resumeTime: Date.now() + 800 });
    if (!posData.current[id]) {
      const a = agentsRef.current.find(a => a.id === id);
      if (a) initAnim(a);
    }
  };

  const respondNotif = (id, ok) => setAgents(p => p.map(a => {
    if (a.id !== id) return a;
    return { ...a, state: 'walking', notification: null };
  }));

  const assignTask = (id, { title, description, skills }) => setAgents(p => p.map(a =>
    a.id === id ? {
      ...a,
      currentTask: { id: Math.random().toString(36).slice(2), title, description, skills, progress: 0, status: 'in_progress', startedAt: Date.now() },
      status: 'working',
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

    if (!apiKey) {
      setTimeout(() => {
        setChats(p => ({ ...p, [aid]: [...(p[aid] || []), { role: 'assistant', text: `I need a Gemini API key to chat! Add one in ☰ → Create Agent menu.` }] }));
        setIsTyping(false);
        updateAgent(aid, { status: agent?.currentTask ? 'working' : 'idle' });
      }, 700);
      return;
    }

    try {
      const pe = { architect: 'an architect', pilot: 'a drone pilot', cyclist: 'a cyclist' };
      const history = (chats[aid] || []).slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [...history, { role: 'user', parts: [{ text: msg }] }],
            systemInstruction: { parts: [{ text: `You are ${agent?.name}, a tiny ${pe[agent?.type] || 'agent'}. ${agent?.currentTask ? `Working on: "${agent.currentTask.title}".` : ''} Reply in 1-3 sentences, stay in character.` }] },
          }),
        }
      );
      const data  = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Try again!';
      setChats(p => ({ ...p, [aid]: [...(p[aid] || []), { role: 'assistant', text: reply }] }));
    } catch (e) {
      setChats(p => ({ ...p, [aid]: [...(p[aid] || []), { role: 'assistant', text: `Connection error: ${e.message}` }] }));
    } finally {
      setIsTyping(false);
      updateAgent(aid, { status: agent?.currentTask ? 'working' : 'idle' });
    }
  };

  // ── Context menu actions ───────────────────────────────────────────────────
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
  const activeAgent = agents.find(a => a.id === activePanelId);
  const workingCnt  = agents.filter(a => a.status === 'working').length;
  const idleCnt     = agents.filter(a => a.status === 'idle').length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Walking stage (full screen) ── */}
      <View style={styles.stage}>
        {visible.map(agent => {
          const ax = getAnimX(agent.id);
          if (!ax) return null;
          return (
            <WalkingAgent
              key={agent.id}
              agent={agent}
              animX={ax}
              onTap={(ag, action) => {
                if (action === 'allow') respondNotif(ag.id, true);
                else if (action === 'deny') respondNotif(ag.id, false);
                else setActivePanelId(activePanelId === ag.id ? null : ag.id);
              }}
              onLongPress={ag => setCtxMenu({ agent: ag })}
            />
          );
        })}
      </View>

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topLeft}>
          <Text style={styles.appTitle}>🐝 Agent Dock</Text>
        </View>
        <View style={styles.topRight}>
          {workingCnt > 0 && (
            <View style={styles.workingBadge}>
              <View style={styles.workingDot} />
              <Text style={styles.workingText}>{workingCnt} working</Text>
            </View>
          )}
          {idleCnt > 0 && <Text style={styles.idleText}>{idleCnt} idle</Text>}
          <TouchableOpacity
            onPress={() => setIsGroupTask(v => !v)}
            style={[styles.groupBtn, isGroupTask && styles.groupBtnOn]}
          >
            <Text style={styles.groupBtnText}>👥</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hidden agents shelf ── */}
      {hidden.length > 0 && (
        <View style={[styles.shelf, { top: insets.top + 56 }]}>
          <Text style={styles.shelfLabel}>HIDDEN</Text>
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

      {/* ── Draggable FAB ── */}
      <DraggableFAB onPress={() => setShowMenu(v => !v)} />

      {/* ── Overlays ── */}
      <FABMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onQuickAdd={addAgent}
        onCreate={() => setShowCreator(true)}
        onShowAll={() => hidden.forEach(a => restoreAgent(a.id))}
        hiddenCount={hidden.length}
        isGroupTask={isGroupTask}
        onToggleGroup={() => setIsGroupTask(v => !v)}
      />

      {activeAgent && (
        <AgentPanel
          agent={activeAgent}
          chat={chats[activeAgent.id] || []}
          isTyping={isTyping}
          inputValue={inputValue}
          setInputValue={setInputValue}
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

      {showCreator && (
        <AgentCreatorModal onClose={() => setShowCreator(false)} onSpawn={spawnFromCreator} />
      )}

      {modelCardAgent && (
        <ModelCard
          agent={modelCardAgent}
          onClose={() => setModelCardAgent(null)}
          onRespawn={() => { restoreAgent(modelCardAgent.id); setModelCardAgent(null); }}
          onRemove={() => { removeAgent(modelCardAgent.id); setModelCardAgent(null); }}
        />
      )}

      {ctxMenu && (
        <ContextMenu
          agent={ctxMenu.agent}
          position={{}}
          onClose={() => setCtxMenu(null)}
          onRestore={() => handleCtx('restore')}
          onInfo={() => handleCtx('info')}
          onChat={() => handleCtx('chat')}
          onTask={() => handleCtx('task')}
          onPause={() => handleCtx('pause')}
          onRemove={() => handleCtx('remove')}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: T.bg },
  stage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  agentAnchor: {
    position: 'absolute', bottom: 0,
    width: CHAR_W, alignItems: 'center',
  },
  bubbleWrap: {
    position: 'absolute', bottom: '100%', marginBottom: 10,
    left: '50%', transform: [{ translateX: -110 }], zIndex: 70,
  },
  statusDot: {
    position: 'absolute', top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: T.bg,
  },
  agentLabel: {
    fontSize: 10, fontWeight: '600', color: T.textMuted,
    marginTop: 2, textAlign: 'center', maxWidth: 66,
  },

  // Top bar
  topBar: {
    position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: T.bg + 'dd',
  },
  topLeft:  { flexDirection: 'row', alignItems: 'center' },
  appTitle: { fontSize: 16, fontWeight: '700', color: T.textBase },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  workingBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  workingDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  workingText:  { fontSize: 11, fontWeight: '700', color: T.green },
  idleText:     { fontSize: 11, color: T.textMuted },
  groupBtn:     { width: 32, height: 32, borderRadius: 8, backgroundColor: T.surfaceMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  groupBtnOn:   { borderColor: T.green, backgroundColor: T.green + '18' },
  groupBtnText: { fontSize: 14 },

  // Hidden shelf
  shelf: { position: 'absolute', left: 0, right: 0, zIndex: 10, paddingBottom: 6 },
  shelfLabel: { fontSize: 9, fontWeight: '700', color: T.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', paddingHorizontal: 14, marginBottom: 6 },
  hiddenIcon:    { alignItems: 'center', width: 60 },
  hiddenIconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: T.surfaceMid, alignItems: 'center', justifyContent: 'flex-end', borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  hiddenDot:     { position: 'absolute', top: 3, right: 3, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: T.bg },
  hiddenLabel:   { fontSize: 10, fontWeight: '600', color: T.textMuted, marginTop: 3, textAlign: 'center' },

  // Draggable FAB
  fab: {
    position: 'absolute', width: 56, height: 56, borderRadius: 16,
    backgroundColor: T.surfaceCard,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 12,
    elevation: 12, borderWidth: 1, borderColor: T.border, zIndex: 100,
  },
  fabIcon: { fontSize: 26 },

  // FAB menu
  fabBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  fabMenu: {
    position: 'absolute', bottom: 80, right: 20, width: 240,
    backgroundColor: T.surface, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
    borderWidth: 1, borderColor: T.separator,
  },
  fabSection:      { padding: 14, borderBottomWidth: 1, borderBottomColor: T.separator },
  fabSectionLabel: { fontSize: 10, fontWeight: '700', color: T.textMuted, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 },
  quickRow:        { flexDirection: 'row', gap: 8 },
  quickBtn:        { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: T.surfaceMid, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  quickLabel:      { fontSize: 9, fontWeight: '600', color: T.textMuted, textTransform: 'capitalize', marginTop: 2 },
  fabItem:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: T.separator },
  fabItemIcon:     { fontSize: 16, width: 24, textAlign: 'center' },
  fabItemLabel:    { fontSize: 13, fontWeight: '600', color: T.textBase },
  fabItemSub:      { fontSize: 10, color: T.textMuted, marginTop: 1 },
});
