/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores del tema dark odómetro
        'odometer-bg': '#0C0C0D',
        'panel-bg': '#111',
        'text-primary': '#EDEDED',
        'digit-bg': '#151517',
        'digit-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'digit-flip': 'digitFlip 0.3s ease-in-out',
        'countdown': 'countdown 1s ease-in-out',
      },
      keyframes: {
        digitFlip: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0)' },
        },
        countdown: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
