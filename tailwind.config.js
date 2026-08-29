/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        veyra: {
          bg: '#FCFAF7',
          'bg-secondary': '#F7F4EE',
          card: '#FFFFFF',
          blue: '#2563EB',
          'blue-hover': '#1D4ED8',
          navy: '#163A63',
          'navy-light': '#1E4C80',
          'blue-soft': '#EFF6FF',
          'blue-border': '#BFDBFE',
          text: '#172033',
          'text-sub': '#667085',
          'text-muted': '#98A2B3',
          border: '#E7E2DA',
          success: '#16A34A',
          'success-bg': '#ECFDF3',
          warning: '#D97706',
          'warning-bg': '#FFFAEB',
          danger: '#DC2626',
          'danger-bg': '#FEF3F2',
          info: '#0284C7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'veyra': '16px',
        'veyra-lg': '20px',
        'veyra-sm': '10px',
      },
      boxShadow: {
        'veyra': '0 2px 8px -2px rgba(23, 32, 51, 0.04), 0 6px 16px -4px rgba(23, 32, 51, 0.06)',
        'veyra-hover': '0 8px 24px -4px rgba(37, 99, 235, 0.12), 0 2px 6px -1px rgba(23, 32, 51, 0.04)',
        'veyra-modal': '0 20px 48px -12px rgba(22, 58, 99, 0.18)',
      },
    },
  },
  plugins: [],
};
