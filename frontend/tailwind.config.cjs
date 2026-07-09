module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        healthcare: {
          50: '#f2fbff',
          100: '#e6f7ff',
          200: '#bfeeff',
          300: '#99e6ff',
          400: '#4dd4ff',
          500: '#00c2ff',
          600: '#00a3cc',
          700: '#007a99',
          800: '#005266',
          900: '#002933'
        }
      }
    }
  },
  plugins: []
}
