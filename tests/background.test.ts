import { describe, it, expect } from 'bun:test';

function computeDynamicBgStyle(style: string, color: string = '#09090b', customUrl?: string): string {
	if (style === 'transparent') return 'background: transparent;';
	if (style === 'chroma') return 'background-color: #00ff00;';
	if (style === 'solid') return `background-color: ${color};`;
	if (style === 'gradient') return `background: linear-gradient(135deg, ${color} 0%, #111827 100%);`;
	if (style === 'mesh')
		return `background-color: ${color}; background-image: linear-gradient(to right, rgba(255,255,255,0.18) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1.5px, transparent 1.5px), linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;`;
	if (style === 'dots')
		return `background-color: ${color}; background-image: radial-gradient(rgba(255,255,255,0.2) 2px, transparent 2px); background-size: 32px 32px;`;
	if (style === 'grid')
		return `background-color: ${color}; background-image: linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px); background-size: 32px 32px;`;
	if (style === 'custom-image' && customUrl)
		return `background-image: url('${customUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
	return `background-color: ${color};`;
}

describe('Dynamic Background Style Computation', () => {
	it('should produce square wireframe grid for mesh style (kotak-kotak)', () => {
		const bg = computeDynamicBgStyle('mesh', '#0f172a');
		expect(bg).toContain('linear-gradient(to right');
		expect(bg).toContain('linear-gradient(to bottom');
		expect(bg).toContain('background-size: 64px 64px');
		// Must not be radial dots
		expect(bg).not.toContain('radial-gradient');
	});

	it('should produce green chroma key for OBS streaming integration', () => {
		const bg = computeDynamicBgStyle('chroma');
		expect(bg).toBe('background-color: #00ff00;');
	});

	it('should produce transparent background for overlay streaming', () => {
		const bg = computeDynamicBgStyle('transparent');
		expect(bg).toBe('background: transparent;');
	});

	it('should handle custom uploaded image URLs', () => {
		const bg = computeDynamicBgStyle('custom-image', '#000000', 'blob:http://localhost/123');
		expect(bg).toContain("url('blob:http://localhost/123')");
	});

	it('should provide complete 10 color palettes including Light, Light Cyan Sea, Cyan, Pink, Matcha, and Sakura Sweet', () => {
		const { UI_THEMES } = require('../src/lib/data/themes');
		expect(UI_THEMES.length).toBe(10);

		const themeIds = UI_THEMES.map((t: any) => t.id);
		expect(themeIds).toContain('cyber-dark');
		expect(themeIds).toContain('midnight');
		expect(themeIds).toContain('synthwave');
		expect(themeIds).toContain('monochrome');
		expect(themeIds).toContain('light');
		expect(themeIds).toContain('light-cyan-sea');
		expect(themeIds).toContain('cyan');
		expect(themeIds).toContain('pink');
		expect(themeIds).toContain('matcha');
		expect(themeIds).toContain('sakura-sweet');

		for (const theme of UI_THEMES) {
			expect(theme.name).toBeTruthy();
			expect(theme.bgHex).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(theme.palette.bg).toBeTruthy();
			expect(theme.palette.surface).toBeTruthy();
			expect(theme.palette.accent).toBeTruthy();
			expect(theme.palette.border).toBeTruthy();
			expect(theme.palette.text).toBeTruthy();
			expect(theme.palette.ring).toBeTruthy();
		}
	});
});
