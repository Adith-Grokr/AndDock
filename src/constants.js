// ── Spotify-Inspired Design Tokens ──────────────────────────────────────────
export const T = {
  // Backgrounds
  bg:          '#121212',
  surface:     '#181818',
  surfaceMid:  '#1f1f1f',
  surfaceCard: '#252525',

  // Text
  textBase:    '#ffffff',
  textMuted:   '#b3b3b3',
  textDim:     '#cbcbcb',

  // Accent
  green:       '#1ed760',
  greenBorder: '#1db954',

  // Semantic
  negative:    '#f3727f',
  warning:     '#ffa42b',
  info:        '#539df5',

  // Borders
  border:      '#4d4d4d',
  borderMuted: '#7c7c7c',
  separator:   '#282828',

  // Shadows
  shadowHeavy: '0 8px 24px rgba(0,0,0,0.5)',
  shadowMed:   '0 8px 8px rgba(0,0,0,0.3)',
};

// ── Data ────────────────────────────────────────────────────────────────────
export const NAMES = [
  'Nova','Atlas','Echo','Flux','Iris','Lux','Orion','Pixel',
  'Rex','Sage','Titan','Volt','Wren','Zara','Apex','Blaze','Crest','Dawn',
];

export const DEFAULT_SKILLS = {
  architect: ['System Design','Planning','Code Review','Documentation','API Design','Analysis'],
  pilot:     ['Deployment','Monitoring','Testing','CI/CD','Infrastructure','Coordination'],
  cyclist:   ['Performance','Data Pipeline','Optimization','Routing','Load Testing','Benchmarking'],
};

export const STATUS = {
  idle:     { color: '#b3b3b3', label: 'Idle' },
  working:  { color: '#1ed760', label: 'Working' },
  thinking: { color: '#539df5', label: 'Thinking' },
  done:     { color: '#1ed760', label: 'Done' },
  failed:   { color: '#f3727f', label: 'Failed' },
  paused:   { color: '#4d4d4d', label: 'Paused' },
};

export const PERSONA = {
  architect: { desc: 'an architect carrying blueprints', tone: 'Meticulous, professional.' },
  pilot:     { desc: 'a drone pilot',                    tone: 'Energetic, tech-obsessed.' },
  cyclist:   { desc: 'a cyclist',                        tone: 'Outdoorsy, enthusiastic.' },
};

export const NOTIF_MESSAGES = {
  permission: [
    { msg: 'Need access to file system to continue',   type: 'permission' },
    { msg: 'Requesting write access to /src directory', type: 'permission' },
    { msg: 'Can I install a new dependency?',           type: 'permission' },
  ],
  info: [
    { msg: 'Found 3 potential issues in codebase',     type: 'info' },
    { msg: 'Build completed successfully',              type: 'info' },
    { msg: 'Tests passing: 47/48',                     type: 'info' },
  ],
  question: [
    { msg: 'Should I use TypeScript or JavaScript?',   type: 'question' },
    { msg: 'This will affect production. Proceed?',    type: 'question' },
    { msg: 'Merge conflict detected. Auto-resolve?',   type: 'question' },
  ],
};

const usedNames = new Set();
export const pickName = () => {
  const pool = NAMES.filter(n => !usedNames.has(n));
  const name = (pool.length > 0 ? pool : NAMES)[
    Math.floor(Math.random() * (pool.length || NAMES.length))
  ];
  usedNames.add(name);
  return name;
};

export const generateLocal = ({ profession, description, skills }) => {
  const text = ((profession || '') + ' ' + (description || '')).toLowerCase();
  let ct = 'cyclist';
  if (/architect|design|plan|product|analys|research/.test(text)) ct = 'architect';
  else if (/devops|deploy|infra|ops|monitor|sre|cloud/.test(text)) ct = 'pilot';
  const role = profession || 'Developer';
  return {
    characterType: ct,
    persona: `A skilled ${role} agent.`,
    tone: 'Professional and eager to help.',
    greeting: `Hi! I'm your ${role} agent. Assign me a task!`,
    suggestedSkills:
      skills.length > 0
        ? skills
        : ['Problem Solving','Communication','Analysis','Planning','Execution','Review'],
  };
};

export const makeAgent = (type, overrides = {}) => {
  const dir = Math.random() > 0.5 ? 1 : -1;
  const name = overrides.name || pickName();
  if (overrides.name) usedNames.add(overrides.name);
  return {
    id: Math.random().toString(36).slice(2),
    name,
    type,
    skills: [...(DEFAULT_SKILLS[type] || DEFAULT_SKILLS.architect)],
    x: Math.random() * 60 + 20,
    direction: dir,
    originalDirection: dir,
    state: 'spawning',
    cooldown: 0,
    resumeTime: Date.now() + 800,
    status: 'idle',
    currentTask: null,
    taskHistory: [],
    logs: [],
    tools: [],
    mcps: [],
    projectDir: '',
    profession: '',
    description: '',
    persona: '',
    tone: '',
    hidden: false,
    notification: null,
    ...overrides,
  };
};
