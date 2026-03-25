export const SUBJECTS = [
  '数学', '英語', '現代文', '古典', '物理', '化学', '生物',
  '化学基礎', '生物基礎', '日本史', '世界史', '地理', '政治経済', '情報'
];

export const TASKS = [
  '課題', 'テスト勉強', '小テスト勉強',
  '授業の復習', '予習', '過去問演習'
];

export const TARGET_HOURS = 3776;

export const SUBJECT_GROUPS = {
  common: ['現代文', '古典', '数学', '英語', '地理', '情報'],
  bunken: ['化学基礎', '生物基礎', '政治経済'],
  bunkenHistory: ['日本史', '世界史'],
  riken: ['化学'],
  rikenScience: ['物理', '生物']
};

// Subjects available for assignment creation (includes 英論)
export const ASSIGNMENT_SUBJECTS = [
  ...SUBJECT_GROUPS.common,
  ...SUBJECT_GROUPS.bunken,
  ...SUBJECT_GROUPS.bunkenHistory,
  ...SUBJECT_GROUPS.riken,
  ...SUBJECT_GROUPS.rikenScience,
  '英論'  // English Essay - assignment-only subject
];

// Subject display order for assignment dropdowns
export const SUBJECT_ORDER = [
  '現代文', '古典', '数学', '英語', '英論',
  '日本史', '世界史',
  '化学基礎', '生物基礎', '政治経済',
  '化学', '物理', '生物',
  '地理', '情報'
];

export const getDefaultSubjects = (type, historyChoice = '日本史', scienceChoice = '物理') => {
  const subjects = [
    ...SUBJECT_GROUPS.common
  ];

  if (type === 'bunken') {
    subjects.push(...SUBJECT_GROUPS.bunken);
    subjects.push(historyChoice);
  } else {
    subjects.push(...SUBJECT_GROUPS.riken);
    subjects.push(scienceChoice);
  }

  return subjects;
};

export const getSubjectColor = (subject) => {
  if (!subject) return '#9ca3af'; // Gray fallback
  if (subject.includes('英語') || subject.includes('英論')) return '#6366f1'; // Indigo
  if (subject.includes('数学')) return '#ec4899'; // Pink
  if (subject.includes('国語') || subject.includes('現代文') || subject.includes('古典')) return '#f59e0b'; // Amber
  if (subject.includes('物理')) return '#8b5cf6'; // Purple
  if (subject.includes('化学')) return '#10b981'; // Emerald
  if (subject.includes('生物')) return '#14b8a6'; // Teal
  if (subject.includes('日本史')) return '#f97316'; // Orange
  if (subject.includes('世界史')) return '#ef4444'; // Red
  if (subject.includes('地理') || subject.includes('社会')) return '#3b82f6'; // Blue
  if (subject.includes('政経') || subject.includes('政治経済')) return '#0ea5e9'; // Sky
  if (subject.includes('情報')) return '#84cc16'; // Lime
  return '#9ca3af'; // Gray fallback
};
