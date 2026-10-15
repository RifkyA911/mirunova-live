import { describe, it, expect } from 'bun:test';
import { MODEL_CATALOG, MODEL_3D_CATALOG, BOOTH_SHOWCASE_CATALOG } from '#lib/data/models';

describe('Model Catalog Validation', () => {
	it('should contain at least 5 verified Live2D models with Cubism 3/4 support', () => {
		const live2dModels = MODEL_CATALOG.filter((m) => m.modelType !== 'avatar2d');
		expect(live2dModels.length).toBeGreaterThanOrEqual(5);

		for (const model of live2dModels) {
			expect(model.id).toBeTruthy();
			expect(model.name).toBeTruthy();
			expect(model.url).toMatch(/\.model(3)?\.json$/);
			expect(['Cubism 3/4', 'Cubism 2']).toContain(model.version);
		}

		// Vivian and Mihari verification (BOOTH.pm Famous Models)
		const vivian = MODEL_CATALOG.find((m) => m.id === 'vivian');
		expect(vivian).toBeDefined();
		expect(vivian?.name).toContain('薇薇安');
		expect(vivian?.url).toBe('/models/vivian/薇薇安.model3.json');
		expect(vivian?.source).toBe('booth');
		expect(vivian?.author).toBe('shibutani');
		expect(vivian?.boothUrl).toContain('shibutani.booth.pm');
		expect(vivian?.tags).toContain('BOOTH.pm');

		const mihari = MODEL_CATALOG.find((m) => m.id === 'mihari');
		expect(mihari).toBeDefined();
		expect(mihari?.name).toContain('Mihari');
		expect(mihari?.url).toBe('/models/mihari/Mihari_V1.model3.json');
		expect(mihari?.source).toBe('booth');
		expect(mihari?.tags).toContain('BOOTH.pm');

		const jian = MODEL_CATALOG.find((m) => m.id === 'jian');
		expect(jian).toBeDefined();
		expect(jian?.name).toContain('简');
		expect(jian?.url).toBe('/models/jian/简.model3.json');
		expect(jian?.avatarUrl).toBeTruthy();
		expect(jian?.author).toBe('shibutani');
		expect(jian?.boothUrl).toContain('shibutani.booth.pm');

		const changli = MODEL_CATALOG.find((m) => m.id === 'changli');
		expect(changli).toBeDefined();
		expect(changli?.name).toContain('长离');
		expect(changli?.url).toBe('/models/changli/长离.model3.json');
		expect(changli?.avatarUrl).toBeTruthy();
		expect(changli?.author).toBe('shibutani');
		expect(changli?.boothUrl).toContain('shibutani.booth.pm');

		const chun = MODEL_CATALOG.find((m) => m.id === 'chun');
		expect(chun).toBeDefined();
		expect(chun?.name).toContain('椿');
		expect(chun?.url).toBe('/models/chun/椿.model3.json');
		expect(chun?.avatarUrl).toBeTruthy();
		expect(chun?.author).toBe('shibutani');
		expect(chun?.boothUrl).toContain('shibutani.booth.pm');

		const tingyun = MODEL_CATALOG.find((m) => m.id === 'tingyun');
		expect(tingyun).toBeDefined();
		expect(tingyun?.name).toContain('停云');
		expect(tingyun?.url).toBe('/models/tingyun/停云.model3.json');
		expect(tingyun?.avatarUrl).toBeTruthy();
		expect(tingyun?.author).toBe('shibutani');
		expect(tingyun?.boothUrl).toContain('shibutani.booth.pm');

		const ruanMei = MODEL_CATALOG.find((m) => m.id === 'ruan-mei');
		expect(ruanMei).toBeDefined();
		expect(ruanMei?.name).toContain('阮·梅');
		expect(ruanMei?.url).toBe('/models/ruan-mei/1208阮梅1-12.20 - 动画.model3.json');
		expect(ruanMei?.avatarUrl).toBeTruthy();
		expect(ruanMei?.author).toBe('shibutani');
		expect(ruanMei?.boothUrl).toContain('shibutani.booth.pm');
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

	it('should contain 3D Cat variants and humanoid Neuro-sama FBX without un-rigged quadruped fox', () => {
		expect(MODEL_3D_CATALOG.length).toBeGreaterThanOrEqual(4);

		const catIds = MODEL_3D_CATALOG.map((m) => m.id);
		expect(catIds).toContain('mochi-cat');
		expect(catIds).toContain('kuro-cat');
		expect(catIds).toContain('tora-cat');
		expect(catIds).toContain('neuro-sama');
		expect(catIds).toContain('manhattan-cafe');

		const proceduralCats = MODEL_3D_CATALOG.filter((m) => m.type === 'procedural');
		for (const cat of proceduralCats) {
			expect(cat.variant).toBeDefined();
			expect(cat.avatarUrl).toBeTruthy();
			expect(cat.tags).toBeDefined();
			expect(cat.tags?.length).toBeGreaterThan(0);
		}

		const neuro = MODEL_3D_CATALOG.find((m) => m.id === 'neuro-sama');
		expect(neuro).toBeDefined();
		expect(neuro?.type).toBe('fbx');
		expect(neuro?.url).toBe('/models/neurosama/neuro-sama.fbx');
		expect(neuro?.avatarUrl).toBeTruthy();

		const manhattan = MODEL_3D_CATALOG.find((m) => m.id === 'manhattan-cafe');
		expect(manhattan).toBeDefined();
		expect(manhattan?.name).toContain('Manhattan Cafe');
		expect(manhattan?.avatarUrl).toBe('/models/previews/manhattan-cafe.jpg');
	});

	it('should provide preview visual assets for all 2D catalog models', () => {
		for (const model of MODEL_CATALOG) {
			expect(model.avatarUrl).toBeTruthy();
			expect(typeof model.avatarUrl).toBe('string');
			expect(model.tags).toBeDefined();
			expect(model.tags?.length).toBeGreaterThan(0);
		}
	});

	it('should validate BOOTH showcase catalog items with author copyright references', () => {
		expect(BOOTH_SHOWCASE_CATALOG.length).toBe(10);

		const expectedItemIds = [
			'5408293', '5411426', '5975192', '5399636', '8034348',
			'7654174', '3988142', '7483530', '6360847', '6313490'
		];

		for (const expectedId of expectedItemIds) {
			const item = BOOTH_SHOWCASE_CATALOG.find((b) => b.itemId === expectedId);
			expect(item).toBeDefined();
			expect(item?.name).toBeTruthy();
			expect(item?.author).toBeTruthy();
			expect(item?.avatarUrl).toMatch(/^https:\/\//);
			expect(item?.boothUrl).toContain(expectedId);
			expect(item?.copyright).toBeTruthy();
			expect(item?.tags.length).toBeGreaterThan(0);
		}
	});

	it('should verify official Cubism 4 models Mark and Ren are in MODEL_CATALOG', () => {
		const mark = MODEL_CATALOG.find((m) => m.id === 'mark');
		expect(mark).toBeDefined();
		expect(mark?.name).toContain('Mark');
		expect(mark?.url).toContain('Mark/Mark.model3.json');
		expect(mark?.version).toBe('Cubism 3/4');

		const ren = MODEL_CATALOG.find((m) => m.id === 'ren');
		expect(ren).toBeDefined();
		expect(ren?.name).toContain('Ren');
		expect(ren?.url).toContain('Ren/Ren.model3.json');
		expect(ren?.version).toBe('Cubism 3/4');
	});

	it('should verify official Live2D sample models Hiyori, Haru, Shizuku, and Tororo have author credits', () => {
		const hiyori = MODEL_CATALOG.find((m) => m.id === 'hiyori');
		expect(hiyori).toBeDefined();
		expect(hiyori?.author).toContain('Kani Biimu');
		expect(hiyori?.sampleUrl).toBe('https://www.live2d.com/en/learn/sample/momose-hiyori-video/');
		expect(hiyori?.license).toBeTruthy();

		const haru = MODEL_CATALOG.find((m) => m.id === 'haru');
		expect(haru).toBeDefined();
		expect(haru?.author).toContain('Kani Biimu');
		expect(haru?.sampleUrl).toBe('https://www.live2d.com/en/learn/sample/haru/');
		expect(haru?.license).toBeTruthy();

		const shizuku = MODEL_CATALOG.find((m) => m.id === 'shizuku');
		expect(shizuku).toBeDefined();
		expect(shizuku?.version).toBe('Cubism 2');
		expect(shizuku?.url).toBe('/models/shizuku/shizuku.model.json');
		expect(shizuku?.sampleUrl).toBe('https://www.live2d.com/en/learn/sample/shizuku/');
		expect(shizuku?.author).toBe('Live2D Inc.');

		const tororo = MODEL_CATALOG.find((m) => m.id === 'tororo');
		expect(tororo).toBeDefined();
		expect(tororo?.version).toBe('Cubism 2');
		expect(tororo?.url).toBe('/models/tororo/tororo.model.json');
		expect(tororo?.sampleUrl).toBe('https://www.live2d.com/en/learn/sample/tororo-hijiki/');
		expect(tororo?.author).toBe('Live2D Inc.');

		const hijiki = MODEL_CATALOG.find((m) => m.id === 'hijiki');
		expect(hijiki).toBeDefined();
		expect(hijiki?.version).toBe('Cubism 2');
		expect(hijiki?.url).toBe('/models/hijiki/hijiki.model.json');
		expect(hijiki?.sampleUrl).toBe('https://www.live2d.com/en/learn/sample/tororo-hijiki/');
		expect(hijiki?.author).toBe('Live2D Inc.');
	});
});
