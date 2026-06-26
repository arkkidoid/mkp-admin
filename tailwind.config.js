/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F47A3A',
          light: '#F28C52',
          dark: '#D96525',
          bg: '#FFF3ED',
        },
        accent: {
          green: '#4CAF50',
          purple: '#9C27B0',
          blue: '#2196F3',
          yellow: '#FFC107',
        },
        background: '#FDFBF7', // Light cream/off-white
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#2C3E50',
          secondary: '#7F8C8D',
          light: '#BDC3C7',
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E0E0E0',
          light: '#F0F0F0',
        },
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(217, 101, 37, 0.05)',
        'medium': '0 6px 16px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'l': '1.25rem',
        'xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
