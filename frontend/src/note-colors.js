/**
 * NOTE COLOR PALETTE
 * Each entry drives both the UI color swatch and the CSS modifier class
 * applied to the note card.
 */
export const NOTE_COLORS = [
  {
    id: 'default',
    label: 'Default',
    swatch: 'transparent',
    cardBg: 'transparent',
    cardBorder: 'var(--border)',
    textColor: 'var(--text-h)',
  },
  {
    id: 'coral',
    label: 'Coral',
    swatch: '#ff6b6b',
    cardBg: 'linear-gradient(135deg, #ffe4e4 0%, #ffd0d0 100%)',
    cardBorder: '#ffb3b3',
    textColor: '#7a1a1a',
  },
  {
    id: 'amber',
    label: 'Amber',
    swatch: '#ffa94d',
    cardBg: 'linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%)',
    cardBorder: '#ffd97d',
    textColor: '#6b4a00',
  },
  {
    id: 'mint',
    label: 'Mint',
    swatch: '#51cf66',
    cardBg: 'linear-gradient(135deg, #d3f9d8 0%, #b2f2bb 100%)',
    cardBorder: '#8ce99a',
    textColor: '#1a5928',
  },
  {
    id: 'sky',
    label: 'Sky',
    swatch: '#339af0',
    cardBg: 'linear-gradient(135deg, #d0ebff 0%, #a5d8ff 100%)',
    cardBorder: '#74c0fc',
    textColor: '#0c3a6b',
  },
  {
    id: 'violet',
    label: 'Violet',
    swatch: '#845ef7',
    cardBg: 'linear-gradient(135deg, #e9d8fd 0%, #d0bfff 100%)',
    cardBorder: '#b197fc',
    textColor: '#3a1a7a',
  },
  {
    id: 'pink',
    label: 'Pink',
    swatch: '#f06595',
    cardBg: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
    cardBorder: '#f48fb1',
    textColor: '#7a1040',
  },
  {
    id: 'teal',
    label: 'Teal',
    swatch: '#20c997',
    cardBg: 'linear-gradient(135deg, #c3fae8 0%, #96f2d7 100%)',
    cardBorder: '#63e6be',
    textColor: '#0c5740',
  },
]

/** Map from color id → palette entry for O(1) lookup */
export const NOTE_COLOR_MAP = Object.fromEntries(
  NOTE_COLORS.map((c) => [c.id, c])
)

/** Get palette entry safely, falling back to default */
export const getNoteColor = (id) =>
  NOTE_COLOR_MAP[id] ?? NOTE_COLOR_MAP['default']
