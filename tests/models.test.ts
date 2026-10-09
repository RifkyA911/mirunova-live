import { describe, it, expect } from 'bun:test';
import { MODEL_CATALOG, MODEL_3D_CATALOG } from '#lib/data/models';

describe('Model Catalog Validation', () => {
	it('should contain at least 5 verified Live2D models with Cubism 3/4 support', () => {
		const live2dModels = MODEL_CATALOG.filter((m) => m.modelType !== 'avatar2d');
		expect(live2dModels.length).toBeGreaterThanOrEqual(5);

		for (const model of live2dModels) {
			expect(model.id).toBeTruthy();
			expect(model.name).toBeTruthy();
			expect(model.url).toMatch(/^https:\/\/.+\.model3\.json$/);
			expect(model.version).toBe('Cubism 3/4');
		}

		// Momose Aria avatar verification
		const aria = MODEL_CATALOG.find((m) => m.id === 'momose_aria');
		expect(aria).toBeDefined();
		expect(aria?.name).toContain('Momose Aria');
		expect(aria?.modelType).toBe('avatar2d');
	});

	it('should not contain blocked or dead CDN repositories', () => {
		const live2dModels = MODEL_CATALOG.filter((m) => m.modelType !== 'avatar2d');
		for (const model of live2dModels) {
			// Ensure no blocked Eikanya links
			expect(model.url).not.toContain('Eikanya/Live2d-model');
			// Ensure official CubismWebSamples is used
			expect(model.url).toContain('Live2D/CubismWebSamples');
		}
	});

	it('should contain 3D Cat variants without un-rigged quadruped fox', () => {
		expect(MODEL_3D_CATALOG.length).toBeGreaterThanOrEqual(3);

		const catIds = MODEL_3D_CATALOG.map((m) => m.id);
		expect(catIds).toContain('mochi-cat');
		expect(catIds).toContain('kuro-cat');
		expect(catIds).toContain('tora-cat');

		for (const cat of MODEL_3D_CATALOG) {
			expect(cat.type).toBe('procedural');
			expect(cat.variant).toBeDefined();
		}
	});
});
