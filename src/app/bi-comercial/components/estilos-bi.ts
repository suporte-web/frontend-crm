/** Elevação discreta em dispositivos com mouse, respeitando a preferência por menos movimento. */
export const efeitoCardBiSx = {
  transition: 'transform 180ms ease, filter 180ms ease, border-color 180ms ease',
  '@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)': {
    '&:hover': {
      transform: 'translateY(-4px)',
      filter: 'drop-shadow(0 8px 12px rgba(15, 23, 42, 0.10))',
      borderColor: '#fed7aa',
    },
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
};
