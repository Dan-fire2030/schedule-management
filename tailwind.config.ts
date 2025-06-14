import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // アラジン風カラーパレット - 淡いオレンジを基調
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // 紫系 - アラビアンナイトの夜空
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // ターコイズ - ジャスミンの衣装
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // 砂漠の砂色
        sand: {
          50: '#fefce8',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // 神秘的なブルー
        mystic: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // パステルカラー
        pastel: {
          pink: "#FFE5EC",
          purple: "#E8DFFF",
          blue: "#DBE9FF",
          green: "#D8F5E3",
          yellow: "#FFF3CD",
          orange: "#FFE5D0",
          peach: "#FFDDD0",
          lavender: "#E6E0FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        display: ["var(--font-poppins)"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mystic': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-sunset': 'linear-gradient(to right, #fed7aa, #fbbf24, #fb923c)',
        'gradient-night': 'linear-gradient(to bottom, #581c87, #0c4a6e)',
        'pattern-arabian': "url('/patterns/arabian.svg')",
      },
      boxShadow: {
        'glow': '0 0 15px rgba(249, 115, 22, 0.2)',
        'glow-lg': '0 0 20px rgba(249, 115, 22, 0.3)',
        'inner-glow': 'inset 0 0 10px rgba(249, 115, 22, 0.1)',
        'mystic': '0 4px 15px rgba(168, 85, 247, 0.15)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;