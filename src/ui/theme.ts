// src/ui/theme.ts
// Design intent: quiet, spacious, low-pressure UI.
// Rules: generous whitespace, restrained colour, readable type, no “CTA shouting”.

export const theme = {
  color: {
    // Base surfaces
    bg: '#F6F4EF',         // warm off-white / parchment
    surface: '#FBFAF7',    // slightly lifted card surface
    surface2: '#F2EFE8',   // subtle contrast for grouped areas

    // Text
    text: '#1F1F1D',       // warm near-black
    text2: '#6B6A66',      // secondary
    text3: '#8C8A84',      // tertiary / hints

    // Lines / dividers
    border: '#E3DED3',

    // Accent (sparingly)
    accent: '#5F6F7A',     // desaturated blue-grey
    accent2: '#6A7B5C',    // moss

    // Status (avoid alarm red)
    warn: '#9C5A3C',       // soft rust
  },

  // Spacing scale (claustrophobia killer):
  // Use s6/s7 for screen padding. Avoid stacking many small paddings.
  space: {
    s0: 0,
    s1: 4,
    s2: 8,
    s3: 12,
    s4: 16,
    s5: 20,
    s6: 24,  // default screen padding
    s7: 32,  // section separation
    s8: 40,
    s9: 48,
    s10: 64,
  },

  // Typography: readable, un-hyped. Prefer Inter / IBM Plex Sans.
  // Sizes are React Native points. Keep lineHeight generous.
  type: {
    family: {
      // Set these via platform font configuration; keep as logical names here.
      // iOS/Android can both map to "Inter" if bundled, else system.
      regular: 'System',
      medium: 'System',
      semibold: 'System',
    },
    size: {
      xs: 12,
      sm: 14,
      md: 16,   // default body
      lg: 18,
      xl: 22,
      xxl: 28,
    },
    line: {
      xs: 18,
      sm: 20,
      md: 24,   // body line height ~1.5
      lg: 26,
      xl: 30,
      xxl: 36,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
    },
  },

  // Radii: soft but not bubbly.
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    pill: 999,
  },

  // Touch targets: never feel fiddly.
  hit: {
    minHeight: 44,
    minWidth: 44,
    // Use with Pressable hitSlop for small text buttons.
    slop: { top: 10, bottom: 10, left: 10, right: 10 },
  },

  // Layout defaults aimed at spacious screens.
  layout: {
    // Standard screen padding
    screenPaddingX: 24,
    screenPaddingY: 24,

    // Vertical rhythm
    blockGap: 16,      // inside a section/card
    sectionGap: 32,    // between sections
    screenGap: 40,     // between major page blocks

    // Cards
    cardPadding: 20,
    cardGap: 12,

    // Max content width for tablets / large phones (optional to enforce)
    maxContentWidth: 520,
  },

  // Shadows: extremely subtle. Prefer borders over shadows.
  // iOS uses shadow*, Android uses elevation.
  shadow: {
    none: {
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    soft: {
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 1,
    },
  },
} as const;

export type Theme = typeof theme;

/**
 * Spacing guidance (for agents + humans):
 * - Screen: paddingX/Y = theme.layout.screenPaddingX/Y (24)
 * - Between sections: theme.layout.sectionGap (32)
 * - Inside cards: theme.layout.cardPadding (20) + theme.layout.blockGap (16)
 * - Avoid dense stacks of s2/s3 padding; it reads as cramped.
 * - Prefer fewer, larger gaps over many small ones.
 */
