module.exports = {
  darkMode: 'class', // Enables class-based dark mode
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
   extend: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    }
   },
  },
  plugins: [],
};
