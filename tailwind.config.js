/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Honey Pilates palette — warm amber + cream + deep walnut accents.
        honey: {
          50:  '#FDF8EE',
          100: '#FBEFD2',
          200: '#F5DDA0',
          300: '#EDC571',
          400: '#E4AB44',
          500: '#D6912C',  // primary brand color
          600: '#B4751F',
          700: '#8B581A',
          800: '#5E3B14',
          900: '#3A240D',
        },
        cream:  '#FAF5EA',
        walnut: '#2C1B0E',
        moss:   '#5C6E4F',
      },
      fontFamily: {
        // We'll load these via expo-font in Phase 1.
        serif: ['"PlayfairDisplay-Regular"', 'serif'],
        serifBold: ['"PlayfairDisplay-Bold"', 'serif'],
        sans: ['"Inter-Regular"', 'system-ui', 'sans-serif'],
        sansMedium: ['"Inter-Medium"', 'system-ui', 'sans-serif'],
        sansBold: ['"Inter-SemiBold"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
