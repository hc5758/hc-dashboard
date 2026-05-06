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
          '50': '#f0f3fa',
          '100': '#d6dff0',
          '200': '#adbfe0',
          '400': '#5a7ab8',
          '600': '#1a2d5a',
          '800': '#0f1e3d',
          '900': '#080f1e',
        },
        teal: {
          DEFAULT: '#2ab89a',
          '50': '#f0fdf9',
          '100': '#ccf7ed',
          '200': '#99edd9',
          '400': '#3de8c0',
          '600': '#2ab89a',
          '800': '#1a8a76',
          '900': '#0f5a4e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
