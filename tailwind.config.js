/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        'soft': '0 10px 24px -18px rgba(15,23,42,0.24), 0 8px 16px -16px rgba(37,99,235,0.18)',
        'card': '0 18px 36px -26px rgba(15,23,42,0.26), 0 10px 22px -18px rgba(37,99,235,0.16)',
        'elevated': '0 28px 72px -34px rgba(15,23,42,0.42), 0 22px 48px -34px rgba(37,99,235,0.24)',
      },
      borderRadius: {
        'xl': '0.9rem',
        '2xl': '1.25rem',
        '3xl': '1.6rem',
      },
    },
  },
  plugins: [],
}

