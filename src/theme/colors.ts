export const colors = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF0F4',
  primary: '#2F6FED',
  primarySoft: '#E8EFFF',
  text: '#171A21',
  textSecondary: '#5D6573',
  textMuted: '#8B93A1',
  border: '#E2E6EC',
  borderStrong: '#C9D0DA',
  danger: '#E5484D',
  dangerSoft: '#FCEBEC',
  warning: '#F59E0B',
  warningSoft: '#FEF3E2',
  success: '#12A150',
  successSoft: '#E7F8EE',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.4)',
} as const;

export const priorityColors: Record<1 | 2 | 3 | 4, string> = {
  1: '#E5484D',
  2: '#F59E0B',
  3: '#2F6FED',
  4: '#98A2B3',
};
