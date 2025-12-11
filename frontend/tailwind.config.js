/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          DEFAULT: '#0F172A',
          light: '#334155',
          dark: '#020617',
        },
        steel: {
          DEFAULT: '#94A3B8',
          light: '#E2E8F0',
          dim: '#64748B',
        },
        accent: {
          DEFAULT: '#0EA5E9',
          hover: '#0284C7',
          glow: 'rgba(14, 165, 233, 0.5)',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        glow: '0 0 15px rgba(14, 165, 233, 0.3)',
      }
    },
  },
  plugins: [],
}

