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
  { id: 'default', name: 'Default', lightBg: '#FFFFFF', lightBorder: '#E2E8F0', darkBg: '#202124', darkBorder: '#3C4043', dotColor: '#94A3B8' },
  { id: 'coral', name: 'Coral', lightBg: '#FFF0F0', lightBorder: '#FECDD3', darkBg: '#5C2B29', darkBorder: '#7A3835', dotColor: '#F43F5E' },
  { id: 'peach', name: 'Peach', lightBg: '#FEEFC3', lightBorder: '#FDE68A', darkBg: '#614A19', darkBorder: '#7C5E20', dotColor: '#F59E0B' },
  { id: 'sand', name: 'Sand', lightBg: '#FEFCE8', lightBorder: '#FEF08A', darkBg: '#4A4618', darkBorder: '#635D19', dotColor: '#EAB308' },
  { id: 'mint', name: 'Mint', lightBg: '#E6F4EA', lightBorder: '#BBF7D0', darkBg: '#274E35', darkBorder: '#366B49', dotColor: '#10B981' },
  { id: 'sage', name: 'Sage', lightBg: '#E0F2F1', lightBorder: '#99F6E4', darkBg: '#1C3E3C', darkBorder: '#275653', dotColor: '#14B8A6' },
  { id: 'fog', name: 'Fog', lightBg: '#F1F3F4', lightBorder: '#CBD5E1', darkBg: '#303134', darkBorder: '#444746', dotColor: '#64748B' },
  { id: 'storm', name: 'Storm', lightBg: '#EEF2FF', lightBorder: '#C7D2FE', darkBg: '#2C2B54', darkBorder: '#3E3C75', dotColor: '#6366F1' },
  { id: 'dusk', name: 'Dusk', lightBg: '#F3E8FD', lightBorder: '#E9D5FF', darkBg: '#3F2257', darkBorder: '#563077', dotColor: '#A855F7' },
  { id: 'blossom', name: 'Blossom', lightBg: '#FCE8E6', lightBorder: '#FBCFE8', darkBg: '#4A1C35', darkBorder: '#66264A', dotColor: '#EC4899' },
  { id: 'clay', name: 'Clay', lightBg: '#E8F0FE', lightBorder: '#BFDBFE', darkBg: '#17365D', darkBorder: '#204A80', dotColor: '#3B82F6' },
  { id: 'chalk', name: 'Chalk', lightBg: '#E0F7FA', lightBorder: '#B2EBF2', darkBg: '#134047', darkBorder: '#1A5761', dotColor: '#06B6D4' },
];

export function getKeepCardStyle(
  colorKey: string | undefined,
  isDark: boolean,
  defaultSurface?: string,
  defaultBorder?: string
) {
  const match = KEEP_COLORS.find((c) => c.id === colorKey);
  const solidDefaultBg = isDark ? '#202124' : '#FFFFFF';
  const solidDefaultBorder = isDark ? '#3C4043' : '#E2E8F0';

  if (!match || match.id === 'default') {
    return {
      backgroundColor: defaultSurface || solidDefaultBg,
      borderColor: defaultBorder || solidDefaultBorder,
      cardColorId: 'default',
      textColor: isDark ? '#E8EAED' : '#202124',
      subTextColor: isDark ? '#9AA0A6' : '#5F6368',
      chipBg: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
      chipBorder: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
    };
  }
  return {
    backgroundColor: isDark ? match.darkBg : match.lightBg,
    borderColor: isDark ? match.darkBorder : match.lightBorder,
    cardColorId: match.id,
    textColor: isDark ? '#F1F3F4' : '#202124',
    subTextColor: isDark ? 'rgba(241,243,244,0.75)' : '#5F6368',
    chipBg: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.06)',
    chipBorder: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)',
  };
}
