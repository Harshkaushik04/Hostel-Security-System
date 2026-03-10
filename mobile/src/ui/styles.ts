import { StyleSheet } from 'react-native'

export const colors = {
  bg: '#0b1220',
  card: '#0f172a',
  border: 'rgba(148,163,184,0.25)',
  text: '#e5e7eb',
  muted: '#9ca3af',
  danger: '#f87171',
  primary: '#38bdf8',
  primaryText: '#001018',
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.3)',
  },
  buttonTextPrimary: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: colors.text,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
  },
  code: {
    color: colors.text,
    fontFamily: 'monospace',
  },
})

