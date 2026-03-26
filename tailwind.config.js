/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070b14',
        panel: '#0f1728',
        line: '#1d2940',
        glow: '#45b7ff',
        mist: '#8fbaff',
      },
      boxShadow: {
        panel: '0 24px 80px rgba(2, 8, 20, 0.55)',
        glow: '0 0 0 1px rgba(69, 183, 255, 0.28), 0 0 40px rgba(69, 183, 255, 0.18)',
      },
      backgroundImage: {
        radial:
          'radial-gradient(circle at top, rgba(69, 183, 255, 0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(17, 88, 145, 0.24), transparent 26%)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(69, 183, 255, 0.2)' },
          '50%': { boxShadow: '0 0 0 10px rgba(69, 183, 255, 0)' },
        },
      },
      animation: {
        rise: 'rise 500ms ease-out forwards',
        pulseRing: 'pulseRing 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
