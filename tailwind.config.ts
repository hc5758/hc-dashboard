import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f1e3d',
          50:  '#f0f3fa',
          100: '#e2e8f4',
          200: '#c8d3e8',
          400: '#5a7ab8',
          600: '#1a2d5a',
          700: '#152240',
          800: '#0f1e3d',
          900: '#080f1e',
        },
        teal: {
          DEFAULT: '#2ab89a',
          50:  '#f0fdf9',
          100: '#ccfbf1',
          200: '#9fe1cb',
          300: '#3de8c0',
          400: '#2ab89a',
          500: '#1a8a76',
          600: '#0f6e56',
          700: '#085041',
          800: '#04342c',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
}
export default config
