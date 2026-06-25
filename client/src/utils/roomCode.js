const WORDS = [
  'amber', 'cedar', 'delta', 'ember', 'flint', 'grove', 'hazel', 'indigo',
  'jasper', 'kiln', 'lumen', 'maple', 'noble', 'opal', 'pivot', 'quartz',
  'raven', 'sable', 'terra', 'umber', 'vapor', 'willow', 'xenon', 'yarrow',
];

export function generateRoomCode() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${pick()}-${pick()}-${num}`;
}

export function isValidRoomCode(code) {
  return typeof code === 'string' && code.trim().length >= 3;
}
