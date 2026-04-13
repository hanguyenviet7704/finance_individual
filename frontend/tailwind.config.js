/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // BIDV Navy Blue — màu chủ đạo
        primary: {
          50:  '#E6EBF4',
          100: '#BEC9E4',
          200: '#92A6D2',
          300: '#6683C0',
          400: '#4568B4',
          500: '#244EA8',
          600: '#1A449E',
          700: '#0E3891',
          800: '#062D84',
          900: '#003087',   // BIDV navy
          950: '#001E5C',
        },
        // BIDV Red — màu CTA / accent
        bidv: {
          red:      '#D4001A',
          'red-hover': '#B3001A',
          navy:     '#003087',
          'navy-light': '#1A4EB5',
          gold:     '#F5A623',
          light:    '#F0F4FA',
        },
        finance: {
          green:  '#00875A',
          red:    '#D4001A',
          yellow: '#F5A623',
          blue:   '#1A4EB5',
        }
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 4px 0 rgba(0,48,135,0.08)',
        'card-hover':'0 4px 12px 0 rgba(0,48,135,0.14)',
        bidv:       '0 2px 8px 0 rgba(0,48,135,0.18)',
      },
      backgroundImage: {
        'bidv-gradient':  'linear-gradient(135deg, #003087 0%, #1A4EB5 100%)',
        'bidv-gradient2': 'linear-gradient(180deg, #003087 0%, #0D2B7E 100%)',
        'bidv-card':      'linear-gradient(135deg, #1A4EB5 0%, #003087 60%, #001E5C 100%)',
      },
    },
  },
  plugins: [],
}
