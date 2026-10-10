import type { ThemePalette } from '#lib/types/tracking';

export const UI_THEMES: ThemePalette[] = [
	{
		id: 'cyber-dark',
		name: 'Cyber Dark',
		desc: 'Futuristic high-tech obsidian with glowing neon cyan',
		badge: 'Default',
		bgHex: '#09090b',
		palette: {
			bg: '#09090b',
			surface: '#18181b',
			accent: '#06b6d4',
			border: '#27272a',
			text: '#f4f4f5',
			ring: '#06b6d4'
		}
	},
	{
		id: 'light',
		name: 'Light Crisp',
		desc: 'Clean, radiant daylight interface with slate & electric sky accents',
		badge: 'Clean Day',
		bgHex: '#f8fafc',
		palette: {
			bg: '#f8fafc',
			surface: '#ffffff',
			accent: '#0284c7',
			border: '#cbd5e1',
			text: '#0f172a',
			ring: '#0284c7'
		}
	},
	{
		id: 'light-cyan-sea',
		name: 'Light Cyan Sea',
		desc: 'Radiant tropical cyan ocean daylight, pure sea breeze aqua & crisp white surfaces',
		badge: 'Cyan Sea',
		bgHex: '#f0fdfa',
		palette: {
			bg: '#f0fdfa',
			surface: '#ffffff',
			accent: '#0891b2',
			border: '#99f6e4',
			text: '#0f172a',
			ring: '#06b6d4'
		}
	},
	{
		id: 'cyan',
		name: 'Neo Cyan',
		desc: 'Electrified deep cyan ocean with vibrant bright aqua glow',
		badge: 'Neo Tron',
		bgHex: '#03171a',
		palette: {
			bg: '#03171a',
			surface: '#052429',
			accent: '#22d3ee',
			border: '#0891b2',
			text: '#ecfeff',
			ring: '#06b6d4'
		}
	},
	{
		id: 'pink',
		name: 'Sakura Pink',
		desc: 'Kawaii pastel cherry blossom & neon magenta aesthetic',
		badge: 'Kawaii',
		bgHex: '#1a0613',
		palette: {
			bg: '#1a0613',
			surface: '#2c0a21',
			accent: '#ec4899',
			border: '#be185d',
			text: '#fdf2f8',
			ring: '#ec4899'
		}
	},
	{
		id: 'matcha',
		name: 'Matcha Green',
		desc: 'Calm organic Japanese green tea & botanical forest tones',
		badge: 'Zen Nature',
		bgHex: '#07150c',
		palette: {
			bg: '#07150c',
			surface: '#0e2415',
			accent: '#22c55e',
			border: '#15803d',
			text: '#f0fdf4',
			ring: '#22c55e'
		}
	},
	{
		id: 'midnight',
		name: 'Midnight Blue',
		desc: 'Deep oceanic navy tone for calm streaming environment',
		badge: 'Navy Calm',
		bgHex: '#030718',
		palette: {
			bg: '#030718',
			surface: '#0a1128',
			accent: '#6366f1',
			border: '#1e293b',
			text: '#e2e8f0',
			ring: '#6366f1'
		}
	},
	{
		id: 'synthwave',
		name: 'Synthwave',
		desc: 'Vibrant 80s sunset violet and neon magenta energy',
		badge: 'Retro 80s',
		bgHex: '#18042b',
		palette: {
			bg: '#18042b',
			surface: '#2b0b47',
			accent: '#d946ef',
			border: '#4a044e',
			text: '#fae8ff',
			ring: '#d946ef'
		}
	},
	{
		id: 'monochrome',
		name: 'Monochrome',
		desc: 'Clean OLED pitch black and distraction-free neutral silver',
		badge: 'OLED Pure',
		bgHex: '#000000',
		palette: {
			bg: '#000000',
			surface: '#121212',
			accent: '#f4f4f5',
			border: '#262626',
			text: '#ffffff',
			ring: '#a1a1aa'
		}
	},
	{
		id: 'sakura-sweet',
		name: 'Sakura Sweet (Evanescia Dark)',
		desc: 'HoYoverse Evanescia dark celestial aesthetic: coral pink #FA7FC2, pale sakura #F5B7CE & deep navy',
		badge: 'Evanescia',
		bgHex: '#0c1021',
		palette: {
			bg: '#0c1021',
			surface: '#171e36',
			accent: '#FA7FC2',
			border: '#F5B7CE',
			text: '#fff1f6',
			ring: '#FA7FC2'
		}
	},
	{
		id: 'sakura-light',
		name: 'Sakura Light Pink (Evanescia)',
		desc: 'Radiant cherry blossom daylight: coral pink #FA7FC2, pale sakura #F5B7CE & pure white daylight surfaces',
		badge: 'Sakura Light',
		bgHex: '#fff5f8',
		palette: {
			bg: '#fff5f8',
			surface: '#ffffff',
			accent: '#FA7FC2',
			border: '#F5B7CE',
			text: '#4a044e',
			ring: '#FA7FC2'
		}
	},
	{
		id: 'matcha-light',
		name: 'Matcha Light Green',
		desc: 'Soothing organic green tea daylight: fresh botanical green #16a34a, mint borders #bbf7d0 & clean daylight surfaces',
		badge: 'Matcha Light',
		bgHex: '#f0fdf4',
		palette: {
			bg: '#f0fdf4',
			surface: '#ffffff',
			accent: '#16a34a',
			border: '#bbf7d0',
			text: '#14532d',
			ring: '#22c55e'
		}
	},
	{
		id: 'custom',
		name: 'Custom Theme Studio',
		desc: 'Tema kustom interaktif dengan palet warna background, surface, border, dan aksen bebas dipilih',
		badge: 'Customizer',
		bgHex: '#18181b',
		palette: {
			bg: '#18181b',
			surface: '#27272a',
			accent: '#06b6d4',
			border: '#3f3f46',
			text: '#f4f4f5',
			ring: '#06b6d4'
		}
	}
];
