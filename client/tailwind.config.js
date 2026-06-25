/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0E11',
        surface: '#12161B',
        surface2: '#1A1F26',
        line: '#242B33',
        signal: {
          DEFAULT: '#F2A93B',
          dim: '#8A6420',
        },
        danger: '#E2574C',
        mute: '#5B6470',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        pulseSignal: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
      },
      animation: {
        pulseSignal: 'pulseSignal 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
