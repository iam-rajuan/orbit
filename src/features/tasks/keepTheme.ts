export interface KeepColor {
  id: string;
  name: string;
  lightBg: string;
  lightBorder: string;
  darkBg: string;
  darkBorder: string;
  dotColor: string;
}

export const KEEP_COLORS: KeepColor[] = [
  { id: 'default', name: 'Default', lightBg: '#FFFFFF', lightBorder: '#E2E8F0', darkBg: '#1C1C22', darkBorder: '#2E2E38', dotColor: '#94A3B8' },
  { id: 'coral', name: 'Coral', lightBg: '#FFF1F2', lightBorder: '#FECDD3', darkBg: '#341B20', darkBorder: '#5C222C', dotColor: '#F43F5E' },
  { id: 'peach', name: 'Peach', lightBg: '#FFFBEB', lightBorder: '#FDE68A', darkBg: '#332316', darkBorder: '#5E3E1C', dotColor: '#F59E0B' },
  { id: 'sand', name: 'Sand', lightBg: '#FEFCE8', lightBorder: '#FEF08A', darkBg: '#302C15', darkBorder: '#58511D', dotColor: '#EAB308' },
  { id: 'mint', name: 'Mint', lightBg: '#F0FDF4', lightBorder: '#BBF7D0', darkBg: '#172E22', darkBorder: '#23573C', dotColor: '#10B981' },
  { id: 'sage', name: 'Sage', lightBg: '#F0FDFA', lightBorder: '#99F6E4', darkBg: '#132C2B', darkBorder: '#1F5653', dotColor: '#14B8A6' },
  { id: 'fog', name: 'Fog', lightBg: '#F0F9FF', lightBorder: '#BAE6FD', darkBg: '#152936', darkBorder: '#1E4B65', dotColor: '#0EA5E9' },
  { id: 'storm', name: 'Storm', lightBg: '#EEF2FF', lightBorder: '#C7D2FE', darkBg: '#182136', darkBorder: '#26375E', dotColor: '#6366F1' },
  { id: 'dusk', name: 'Dusk', lightBg: '#FAF5FF', lightBorder: '#E9D5FF', darkBg: '#261836', darkBorder: '#48256B', dotColor: '#A855F7' },
  { id: 'blossom', name: 'Blossom', lightBg: '#FDF2F8', lightBorder: '#FBCFE8', darkBg: '#32182B', darkBorder: '#5C234C', dotColor: '#EC4899' },
  { id: 'clay', name: 'Clay', lightBg: '#FDF8F3', lightBorder: '#F3E5D8', darkBg: '#291F18', darkBorder: '#4C3624', dotColor: '#D97706' },
  { id: 'chalk', name: 'Chalk', lightBg: '#F8FAFC', lightBorder: '#E2E8F0', darkBg: '#21232A', darkBorder: '#363A45', dotColor: '#94A3B8' },
];

export function getKeepCardStyle(
  colorKey: string | undefined,
  isDark: boolean,
  defaultSurface: string,
  defaultBorder: string
) {
  const match = KEEP_COLORS.find((c) => c.id === colorKey);
  if (!match || match.id === 'default') {
    return {
      backgroundColor: defaultSurface,
      borderColor: defaultBorder,
      cardColorId: 'default',
      textColor: isDark ? '#F1F5F9' : '#0F172A',
      subTextColor: isDark ? '#94A3B8' : '#64748B',
      chipBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      chipBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    };
  }
  return {
    backgroundColor: isDark ? match.darkBg : match.lightBg,
    borderColor: isDark ? match.darkBorder : match.lightBorder,
    cardColorId: match.id,
    textColor: isDark ? '#F8FAFC' : '#0F172A',
    subTextColor: isDark ? '#CBD5E1' : '#475569',
    chipBg: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)',
    chipBorder: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
  };
}
