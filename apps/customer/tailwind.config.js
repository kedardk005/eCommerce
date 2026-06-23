/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FBF8F3',
        surface: '#FFFFFF',
        border: '#EAE3D5',
        ink: {
          DEFAULT: '#1C1C2E',
          muted: '#6B6B80',
        },
        primary: {
          DEFAULT: '#E8623A',
          hover: '#CF4E28',
        },
        secondary: '#3D2B1F',
        accent: {
          yellow: '#F5C842',
          green:  '#5BAD72',
          blue:   '#4A90D9',
          pink:   '#E07FAA',
          teal:   '#2BBBA0',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      minHeight: { touch: '48px' },
      minWidth:  { touch: '44px' },
    },
  },
  plugins: [],
}
