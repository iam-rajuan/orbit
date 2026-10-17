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
  { id: 'default', name: 'Default', lightBg: '#FFFFFF', lightBorder: '#E2E8F0', darkBg: '#18181B', darkBorder: '#27272A', dotColor: '#94A3B8' },
  { id: 'coral', name: 'Coral', lightBg: '#FCE8E6', lightBorder: '#FBC4BF', darkBg: '#3A1715', darkBorder: '#5C2B29', dotColor: '#F28B82' },
  { id: 'peach', name: 'Peach', lightBg: '#FEF3D6', lightBorder: '#FDE293', darkBg: '#3D2B0F', darkBorder: '#614A19', dotColor: '#FBBC04' },
  { id: 'sand', name: 'Sand', lightBg: '#FFFBD1', lightBorder: '#FFF176', darkBg: '#3B360E', darkBorder: '#635D19', dotColor: '#EAB308' },
  { id: 'mint', name: 'Mint', lightBg: '#E6F8D8', lightBorder: '#CEEAD6', darkBg: '#193318', darkBorder: '#345920', dotColor: '#34D399' },
  { id: 'sage', name: 'Sage', lightBg: '#DDF9F3', lightBorder: '#A7FFEB', darkBg: '#113531', darkBorder: '#16504B', dotColor: '#2DD4BF' },
  { id: 'fog', name: 'Fog', lightBg: '#E2F6FB', lightBorder: '#CBF0F8', darkBg: '#163137', darkBorder: '#2D555E', dotColor: '#38BDF8' },
  { id: 'storm', name: 'Storm', lightBg: '#DCE8FD', lightBorder: '#AECBFA', darkBg: '#13233A', darkBorder: '#1E3A5F', dotColor: '#60A5FA' },
  { id: 'dusk', name: 'Dusk', lightBg: '#F0E5FD', lightBorder: '#D7AEFB', darkBg: '#251537', darkBorder: '#42275E', dotColor: '#A855F7' },
  { id: 'blossom', name: 'Blossom', lightBg: '#FDE4F2', lightBorder: '#FDCFE8', darkBg: '#341228', darkBorder: '#5B2245', dotColor: '#F472B6' },
  { id: 'clay', name: 'Clay', lightBg: '#F5E8DC', lightBorder: '#E6C9A8', darkBg: '#2B1D11', darkBorder: '#442F19', dotColor: '#D97706' },
  { id: 'chalk', name: 'Chalk', lightBg: '#F1F3F4', lightBorder: '#E8EAED', darkBg: '#232528', darkBorder: '#3C4043', dotColor: '#9CA3AF' },
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
    };
  }
  return {
    backgroundColor: isDark ? match.darkBg : match.lightBg,
    borderColor: isDark ? match.darkBorder : match.lightBorder,
    cardColorId: match.id,
  };
}
