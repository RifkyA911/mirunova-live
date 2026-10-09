import { describe, it, expect } from 'bun:test';
import { MODEL_CATALOG, MODEL_3D_CATALOG } from '#lib/data/models';

describe('Model Catalog Validation', () => {
	it('should contain at least 5 verified Live2D models with Cubism 3/4 support', () => {
		const live2dModels = MODEL_CATALOG.filter((m) => m.modelType !== 'avatar2d');
		expect(live2dModels.length).toBeGreaterThanOrEqual(5);

		for (const model of live2dModels) {
			expect(model.id).toBeTruthy();
			expect(model.name).toBeTruthy();
			expect(model.url).toMatch(/\.model3\.json$/);
			expect(model.version).toBe('Cubism 3/4');
		}

		// Vivian model verification
		const vivian = MODEL_CATALOG.find((m) => m.id === 'vivian');
		expect(vivian).toBeDefined();
		expect(vivian?.name).toContain('薇薇安');
		expect(vivian?.url).toBe('/models/vivian/薇薇安.model3.json');
	});

	it('should not contain blocked or dead CDN repositories', () => {
		const cdnModels = MODEL_CATALOG.filter((m) => m.url.startsWith('https://'));
		for (const model of cdnModels) {
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
			expect(cat.avatarUrl).toBeTruthy();
			expect(cat.tags).toBeDefined();
			expect(cat.tags?.length).toBeGreaterThan(0);
		}
	});

	it('should provide preview visual assets for all 2D catalog models', () => {
		for (const model of MODEL_CATALOG) {
			expect(model.avatarUrl).toBeTruthy();
			expect(typeof model.avatarUrl).toBe('string');
			expect(model.tags).toBeDefined();
			expect(model.tags?.length).toBeGreaterThan(0);
		}
	});
});
