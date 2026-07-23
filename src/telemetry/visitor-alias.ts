const ADJECTIVES = [
  'brave',
  'calm',
  'clever',
  'eager',
  'gentle',
  'happy',
  'jolly',
  'keen',
  'lucky',
  'mellow',
  'noble',
  'proud',
  'quiet',
  'swift',
  'witty',
  'zesty',
];

const ANIMALS = [
  'otter',
  'falcon',
  'lynx',
  'heron',
  'panda',
  'gecko',
  'raven',
  'tapir',
  'bison',
  'koala',
  'moose',
  'shrew',
  'viper',
  'wombat',
  'yak',
  'zebra',
];

const EMOJIS = [
  '🦊',
  '🐼',
  '🦉',
  '🐢',
  '🦅',
  '🐳',
  '🦌',
  '🐙',
  '🦔',
  '🐝',
  '🦋',
  '🐧',
  '🦩',
  '🐿️',
  '🦎',
  '🐨',
];

function indexFromHash(hash: string, offset: number, size: number): number {
  const chunk = hash.slice(offset, offset + 4);
  return parseInt(chunk, 16) % size;
}

export function aliasFromHash(hash: string): string {
  const adjective = ADJECTIVES[indexFromHash(hash, 0, ADJECTIVES.length)];
  const animal = ANIMALS[indexFromHash(hash, 4, ANIMALS.length)];
  return `${adjective}-${animal}`;
}

export function emojiFromHash(hash: string): string {
  return EMOJIS[indexFromHash(hash, 8, EMOJIS.length)];
}
