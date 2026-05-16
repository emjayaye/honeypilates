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
        // Honey Pilates brand tokens lifted from honeypilates.com:
        //   --color_1 #1F1F1F  primary text / charcoal
        //   --color_2 #777C75  secondary text / warm gray
        //   --color_3 #FFFFFF  white
        //   --color_4 #F1E8DD  page bg / cream
        //   --color_5 #EBC3A1  peach accent / primary CTA
        ink:    '#1F1F1F',
        // sage: #777C75 from the live site fails WCAG AA (3.06:1 on cream).
        // We keep it as a decorative tint for non-text use only. For body
        // copy + meta labels, use `text-ink-2` (#535350) which clears
        // 5.0:1 on cream and 4.5:1 on peach — comfortably AA.
        sage:   '#777C75',
        'ink-2': '#535350',
        cream:  '#F1E8DD',
        peach:  '#EBC3A1',
        white:  '#FFFFFF',

        // Tints derived from the peach accent for hover / pressed / disabled.
        'peach-50':  '#FAEEE3',
        'peach-200': '#F3D7BC',
        'peach-400': '#E8B68C',
        'peach-700': '#A87858',
      },
      fontFamily: {
        display:     ['Fahkwang_400Regular', 'serif'],
        displayMd:   ['Fahkwang_500Medium', 'serif'],
        displayBold: ['Fahkwang_600SemiBold', 'serif'],
        body:        ['DMSans_400Regular', 'system-ui', 'sans-serif'],
        bodyMd:      ['DMSans_500Medium', 'system-ui', 'sans-serif'],
        bodyBold:    ['DMSans_600SemiBold', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
