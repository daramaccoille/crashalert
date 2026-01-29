import type { Config } from "tailwindcss";
// Re-trigger build

const config: Config = {
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
                glass: "rgba(255, 255, 255, 0.05)",
                "glass-border": "rgba(255, 215, 0, 0.15)", // Gold tint
                "risk-high": "#EF4444", // Red
                "risk-mod": "#F59E0B",  // Amber
                "risk-low": "#10B981",  // Emerald
                "accent": "#FFD700",    // Gold
                "gold": "#D4AF37",      // Metallic Gold
                "gold-light": "#FCD34D",
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-glow': 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(0, 0, 0, 0) 50%)',
            },
            animation: {
                'scroll': 'scroll 20s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                scroll: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                }
            },
            fontFamily: {
                sans: ['var(--font-outfit)', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
