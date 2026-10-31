import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			boxShadow: { paper: 'var(--shadow-paper)' },
			fontFamily: {
				sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			colors: {
				brand: 'hsl(var(--brand))',
				'highlight-lime': 'hsl(var(--highlight-lime))',
				'highlight-blue': 'hsl(var(--highlight-blue))',
				'highlight-yellow': 'hsl(var(--highlight-yellow))',
				'highlight-orange': 'hsl(var(--highlight-orange))',
				'highlight-purple': 'hsl(var(--highlight-purple))',
				'highlight-pink': 'hsl(var(--highlight-pink))',
				'highlight-green': 'hsl(var(--highlight-green))',
				'highlight-red': 'hsl(var(--highlight-red))',
				'grid-margin': 'hsl(var(--grid-margin))',
				laser: 'hsl(var(--laser))',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'reveal-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
				'highlight-sweep': { '0%': { width: '0' }, '40%,85%': { width: '82%' }, '100%': { width: '0' } },
				'draw-stroke': { '0%': { strokeDashoffset: '1' }, '50%,85%': { strokeDashoffset: '0' }, '100%': { strokeDashoffset: '1' } },
				'tile-swap-right': { '0%,20%': { transform: 'none' }, '40%,80%': { transform: 'translateX(76px)' }, '100%': { transform: 'none' } },
				'tile-swap-left': { '0%,20%': { transform: 'none' }, '40%,80%': { transform: 'translateX(-76px)' }, '100%': { transform: 'none' } },
				'tile-fade': { '0%,50%': { opacity: '1' }, '65%,90%': { opacity: '0.25' }, '100%': { opacity: '1' } },
				'dot-in': { '0%,10%': { opacity: '0' }, '20%,90%': { opacity: '1' }, '100%': { opacity: '0' } },
				'laser-move': { '0%': { transform: 'translate(30px,30px)' }, '25%': { transform: 'translate(170px,50px)' }, '50%': { transform: 'translate(120px,100px)' }, '75%': { transform: 'translate(40px,80px)' }, '100%': { transform: 'translate(30px,30px)' } }
			},
			animation: {
				'reveal-up': 'reveal-up 0.6s ease-out both',
				'highlight-sweep': 'highlight-sweep 4s ease-in-out infinite',
				'draw-stroke': 'draw-stroke 4s ease-in-out infinite',
				'tile-swap-right': 'tile-swap-right 5s ease-in-out infinite',
				'tile-swap-left': 'tile-swap-left 5s ease-in-out infinite',
				'tile-fade': 'tile-fade 5s ease-in-out infinite',
				'dot-in': 'dot-in 4s ease-out infinite',
				'laser-move': 'laser-move 6s ease-in-out infinite',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
