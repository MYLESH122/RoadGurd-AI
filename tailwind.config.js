/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A192F',
          800: '#0F2744',
          700: '#1E3A5F',
          600: '#2D4E7B'
        },
        brand: {
          blue: '#1E40AF',
          lightBlue: '#3B82F6',
          sky: '#60A5FA',
          slate: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0'
        },
        safety: {
          normal: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          critical: '#DC2626'
        }
      }
    },
  },
  plugins: [],
}

