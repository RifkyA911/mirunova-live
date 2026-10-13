// Polyfill Svelte 5 rune for non-Svelte test runner before imports
(globalThis as any).$state = (v: any) => v;

import { describe, it, expect, beforeAll } from 'bun:test';
import { voice, VOICE_MODELS } from '#lib/core/audio';

describe('VoiceEngine & Voice Changer DSP Presets', () => {
	let rigging: any;

	beforeAll(async () => {
		(globalThis as any).$state = (v: any) => v;
		const mod = await import('../src/lib/stores/riggingStore.svelte');
		rigging = mod.rigging;
	});
	it('should provide comprehensive voice models across anime, studio, and effects categories', () => {
		expect(VOICE_MODELS.length).toBeGreaterThanOrEqual(8);

		const animeModels = VOICE_MODELS.filter((m) => m.category === 'anime');
		expect(animeModels.length).toBeGreaterThanOrEqual(2);

		const studioModels = VOICE_MODELS.filter((m) => m.category === 'studio');
		expect(studioModels.length).toBeGreaterThanOrEqual(2);

		const effectsModels = VOICE_MODELS.filter((m) => m.category === 'effects');
		expect(effectsModels.length).toBeGreaterThanOrEqual(3);

		for (const model of VOICE_MODELS) {
			expect(model.id).toBeTruthy();
			expect(model.name).toBeTruthy();
			expect(model.desc).toBeTruthy();
			expect(model.badge).toBeTruthy();
			expect(model.pitchInfo).toBeTruthy();
			expect(model.pitchRatio).toBeGreaterThan(0);
		}
	});

	it('should return accurate pitch transposition ratios for pitch shifting', () => {
		expect(voice.getPitchRatio('none')).toBe(1.0);
		expect(voice.getPitchRatio('anime-girl')).toBeCloseTo(1.335, 2);
		expect(voice.getPitchRatio('chipmunk')).toBeCloseTo(1.682, 2);
		expect(voice.getPitchRatio('ikemen')).toBeCloseTo(0.749, 2);
		expect(voice.getPitchRatio('robot')).toBeCloseTo(0.891, 2);
		expect(voice.getPitchRatio('radio-retro')).toBe(1.0);
		expect(voice.getPitchRatio('echo-hall')).toBe(1.0);
		expect(voice.getPitchRatio('podcast-pro')).toBe(1.0);
	});

	it('should verify Little Rose animated sticker accessories are registered in riggingStore', () => {
		const roseProps = rigging.activeAccessories.filter((a: any) => a.id.startsWith('rose-'));
		expect(roseProps.length).toBeGreaterThanOrEqual(8);

		for (const prop of roseProps) {
			expect(prop.imageUrl).toBeDefined();
			expect(prop.imageUrl).toMatch(/^\/props\/rose\/rose_.*\.gif$/);
			expect(prop.name).toContain('Little Rose');
			expect(prop.visible).toBe(false); // default off
		}
	});

	it('should handle sample playback gracefully when no sample has been recorded', async () => {
		expect(voice.hasRecordedSample()).toBe(false);
		const rawRes = await voice.playRawSample();
		expect(rawRes).toBe(false);
		const convRes = await voice.playConvertedSample();
		expect(convRes).toBe(false);
		const ttsRes = await voice.synthesizeVoiceText('Halo');
		expect(ttsRes).toBe(false);
	});
});
