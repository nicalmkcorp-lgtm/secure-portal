
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'ios-in': 'ios-in 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-out': 'ios-out 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-in-up': 'ios-slide-in-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-in-down': 'ios-slide-in-down 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-out-up': 'ios-slide-out-up 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-out-down': 'ios-slide-out-down 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-in-right': 'ios-slide-in-right 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-in-left': 'ios-slide-in-left 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-out-right': 'ios-slide-out-right 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-out-left': 'ios-slide-out-left 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-fade-in': 'ios-fade-in 0.3s ease-out forwards',
        'ios-fade-out': 'ios-fade-out 0.2s ease-in forwards',
        'shake': 'shake 0.3s ease-in-out',
        // Aliases for compatibility
        'ios-slide-up': 'ios-slide-in-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'ios-slide-down': 'ios-slide-out-down 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
      },
      keyframes: {
        'ios-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'ios-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        'ios-slide-in-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'ios-slide-in-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'ios-slide-out-up': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        'ios-slide-out-down': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'ios-slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'ios-slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'ios-slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'ios-slide-out-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'ios-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ios-fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
