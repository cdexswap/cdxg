import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'gradient-x': 'gradient-x 15s linear infinite',
        'float': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out -4s infinite',
        'pulse-fast': 'pulse-fast 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slower': 'pulse-slower 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce-slow 3s infinite',
        'shimmer': 'shimmer 3s infinite',
        'shake-light': 'shake-light 1s ease-in-out infinite',
        'shake-medium': 'shake-medium 1s ease-in-out infinite',
        'shake-strong': 'shake-strong 1s ease-in-out infinite',
        'pulse-border': 'pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) translateX(10px) rotate(2deg)' },
          '67%': { transform: 'translateY(-10px) translateX(-10px) rotate(-2deg)' },
        },
        'pulse-fast': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.1', transform: 'scale(1.05)' },
        },
        'pulse-slower': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'bounce-slow': {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%) rotate(30deg)' },
          '100%': { transform: 'translateX(100%) rotate(30deg)' },
        },
        'shake-light': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(1px)' },
          '75%': { transform: 'translateX(-1px)' },
        },
        'shake-medium': {
          '0%, 100%': { transform: 'translateX(0) scale(1.02)' },
          '25%': { transform: 'translateX(2px) scale(1.02)' },
          '75%': { transform: 'translateX(-2px) scale(1.02)' },
        },
        'shake-strong': {
          '0%, 100%': { transform: 'translateX(0) scale(1.05)' },
          '25%': { transform: 'translateX(3px) scale(1.05)' },
          '75%': { transform: 'translateX(-3px) scale(1.05)' },
        },
        'pulse-border': {
          '0%, 100%': { 'border-color': 'rgba(239, 68, 68, 0.3)' }, // red-500/30
          '50%': { 'border-color': 'rgba(239, 68, 68, 0.6)' }, // red-500/60
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
