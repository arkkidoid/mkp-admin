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
          DEFAULT: '#F97316',
          light:   '#FB923C',
          dark:    '#EA580C',
          bg:      '#FFF7ED',
        },
        background: '#F8FAFC',
        surface:    '#FFFFFF',
        text: {
          DEFAULT:   '#0F172A',
          secondary: '#64748B',
          light:     '#94A3B8',
          inverse:   '#FFFFFF',
        },
        border: {
          DEFAULT: '#E2E8F0',
          light:   '#F1F5F9',
        },
        success: '#10B981',
        error:   '#EF4444',
        warning: '#F59E0B',
        info:    '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft':   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'medium': '0 4px 12px rgba(0,0,0,0.08)',
        'card':   '0 1px 2px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
