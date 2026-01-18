// src/ui/styles.ts
import { StyleSheet, Platform } from 'react-native';
import { theme, Theme } from './theme';

/**
 * Global layout primitives.
 * Goal: make “spacious by default” the path of least resistance.
 */
export function makeStyles(t: Theme = theme) {
  const hairline = StyleSheet.hairlineWidth;

  return StyleSheet.create({
    // ---- Screens / containers ----
    screen: {
      flex: 1,
      backgroundColor: t.color.bg,
    },
    screenPadded: {
      flex: 1,
      backgroundColor: t.color.bg,
      paddingHorizontal: t.layout.screenPaddingX,
      paddingTop: t.layout.screenPaddingY,
      paddingBottom: t.layout.screenPaddingY,
    },

    // Keeps content readable on large screens/tablets
    content: {
      width: '100%',
      maxWidth: t.layout.maxContentWidth,
      alignSelf: 'center',
    },

    // ---- Section rhythm ----
    section: {
      marginBottom: t.layout.sectionGap,
    },
    sectionTight: {
      marginBottom: t.layout.blockGap,
    },

    // ---- Cards ----
    card: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.md,
      padding: t.layout.cardPadding,
      borderWidth: hairline,
      borderColor: t.color.border,
      ...t.shadow.soft,
    },
    cardFlat: {
      backgroundColor: t.color.surface,
      borderRadius: t.radius.md,
      padding: t.layout.cardPadding,
      borderWidth: hairline,
      borderColor: t.color.border,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.space.s4,
    },

    // ---- Text ----
    h1: {
      color: t.color.text,
      fontSize: t.type.size.xxl,
      lineHeight: t.type.line.xxl,
      fontWeight: t.type.weight.semibold,
      // If you later bundle Inter/IBM Plex, update theme.type.family
      fontFamily: t.type.family.semibold,
      marginBottom: t.space.s2,
    },
    h2: {
      color: t.color.text,
      fontSize: t.type.size.xl,
      lineHeight: t.type.line.xl,
      fontWeight: t.type.weight.semibold,
      fontFamily: t.type.family.semibold,
      marginBottom: t.space.s2,
    },
    title: {
      color: t.color.text,
      fontSize: t.type.size.lg,
      lineHeight: t.type.line.lg,
      fontWeight: t.type.weight.semibold,
      fontFamily: t.type.family.semibold,
    },
    body: {
      color: t.color.text,
      fontSize: t.type.size.md,
      lineHeight: t.type.line.md,
      fontWeight: t.type.weight.regular,
      fontFamily: t.type.family.regular,
    },
    body2: {
      color: t.color.text2,
      fontSize: t.type.size.md,
      lineHeight: t.type.line.md,
      fontWeight: t.type.weight.regular,
      fontFamily: t.type.family.regular,
    },
    hint: {
      color: t.color.text3,
      fontSize: t.type.size.sm,
      lineHeight: t.type.line.sm,
      fontWeight: t.type.weight.regular,
      fontFamily: t.type.family.regular,
    },

    // ---- Dividers ----
    divider: {
      height: hairline,
      backgroundColor: t.color.border,
      marginVertical: t.space.s4,
    },

    // ---- Buttons (quiet) ----
    // Primary button is still restrained — use sparingly.
    buttonPrimary: {
      minHeight: t.hit.minHeight,
      borderRadius: t.radius.md,
      paddingHorizontal: t.space.s5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.color.surface2,
      borderWidth: hairline,
      borderColor: t.color.border,
    },
    buttonPrimaryText: {
      color: t.color.text,
      fontSize: t.type.size.md,
      lineHeight: t.type.line.md,
      fontWeight: t.type.weight.medium,
      fontFamily: t.type.family.medium,
    },

    // Secondary: text button
    buttonText: {
      minHeight: t.hit.minHeight,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.space.s2,
    },
    buttonTextLabel: {
      color: t.color.accent,
      fontSize: t.type.size.md,
      lineHeight: t.type.line.md,
      fontWeight: t.type.weight.medium,
      fontFamily: t.type.family.medium,
    },

    // Link-like (for subtle actions)
    link: {
      color: t.color.accent,
      fontSize: t.type.size.md,
      lineHeight: t.type.line.md,
      fontWeight: t.type.weight.medium,
      fontFamily: t.type.family.medium,
    },

    // ---- Pills / tags ----
    pill: {
      alignSelf: 'flex-start',
      backgroundColor: t.color.surface2,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.space.s4,
      paddingVertical: t.space.s2,
      borderWidth: hairline,
      borderColor: t.color.border,
    },
    pillText: {
      color: t.color.text2,
      fontSize: t.type.size.sm,
      lineHeight: t.type.line.sm,
      fontWeight: t.type.weight.medium,
      fontFamily: t.type.family.medium,
    },

    // ---- Spacers ----
    spacer4: { height: t.space.s4 },
    spacer6: { height: t.space.s6 },
    spacer7: { height: t.space.s7 },
    spacer8: { height: t.space.s8 },
  });
}

export const styles = makeStyles();

