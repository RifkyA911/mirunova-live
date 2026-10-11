import { describe, it, expect, beforeAll } from 'bun:test';

// Polyfill Svelte 5 rune for non-Svelte test runner before imports
(globalThis as any).$state = (v: any) => v;

describe('Internationalization (i18n) & Locales', () => {
	let translations: any;
	let i18n: any;

	beforeAll(async () => {
		(globalThis as any).$state = (v: any) => v;
		const mod = await import('../src/lib/i18n/index.svelte');
		translations = mod.translations;
		i18n = mod.i18n;
	});

	it('should contain full key parity across English, Indonesian, and Japanese dictionaries', () => {
		const enKeys = Object.keys(translations.en).sort();
		const idKeys = Object.keys(translations.id).sort();
		const jaKeys = Object.keys(translations.ja).sort();

		expect(enKeys.length).toBeGreaterThan(120);

		const missingInId = enKeys.filter((k) => !(k in translations.id));
		const missingInJa = enKeys.filter((k) => !(k in translations.ja));

		expect(missingInId).toEqual([]);
		expect(missingInJa).toEqual([]);
	});

	it('should successfully resolve translated strings for active locale', () => {
		i18n.setLocale('en');
		expect(i18n.t('shortcut_title_space')).toBe('Webcam Face Tracking');
		expect(i18n.t('assist_button_title')).toBe('Assist Button');

		i18n.setLocale('id');
		expect(i18n.t('shortcut_title_space')).toBe('Pelacakan Wajah Webcam');
		expect(i18n.t('assist_button_title')).toBe('Tombol Asisten');

		i18n.setLocale('ja');
		expect(i18n.t('shortcut_title_space')).toBe('ウェブカメラ顔追跡');
		expect(i18n.t('assist_button_title')).toBe('アシストボタン');
	});

	it('should verify all shortcut title and badge keys contain valid strings', () => {
		const keysToCheck = [
			'shortcut_title_space',
			'shortcut_title_v',
			'shortcut_title_c',
			'shortcut_title_e',
			'shortcut_title_p',
			'shortcut_title_b',
			'shortcut_title_zoom_in',
			'shortcut_title_zoom_out',
			'shortcut_title_zoom_reset',
			'shortcut_title_h',
			'shortcut_title_m',
			'shortcut_title_t',
			'shortcut_title_r',
			'shortcut_title_f2',
			'shortcut_title_f1',
			'shortcut_title_esc',
			'shortcut_title_l',
			'shortcut_title_o',
			'shortcut_title_s',
			'shortcut_title_numbers',
			'badge_vision',
			'badge_audio',
			'badge_expressions',
			'badge_webcam',
			'badge_eyes',
			'badge_zoom',
			'badge_reset',
			'badge_dock',
			'badge_catalog',
			'badge_theme',
			'badge_rigging',
			'badge_config',
			'badge_help',
			'badge_general',
			'badge_stage',
			'badge_obs',
			'badge_capture',
			'badge_themes'
		];

		for (const key of keysToCheck) {
			expect(translations.en[key]).toBeTruthy();
			expect(translations.id[key]).toBeTruthy();
			expect(translations.ja[key]).toBeTruthy();
		}
	});
});
