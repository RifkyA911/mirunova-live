import { describe, it, expect, beforeEach } from 'bun:test';
import { rigging } from '../src/lib/stores/riggingStore.svelte';

describe('Photoshop Layer Manager, Accessories & Collab System', () => {
	beforeEach(() => {
		// Reset state
		rigging.isCollabModeActive = false;
		rigging.collabPosition = 'right';
		rigging.collabScale = 0.85;
		rigging.collabSyncTracking = true;
	});

	it('should initialize 5 default stage layers in correct order', () => {
		expect(rigging.stageLayers.length).toBe(5);
		expect(rigging.stageLayers[0].type).toBe('shader-fx');
		expect(rigging.stageLayers[1].type).toBe('accessories');
		expect(rigging.stageLayers[2].type).toBe('model-collab');
		expect(rigging.stageLayers[3].type).toBe('model-host');
		expect(rigging.stageLayers[4].type).toBe('background');
	});

	it('should support toggling layer visibility and clamping opacity', () => {
		const hostLayer = rigging.stageLayers.find((l) => l.type === 'model-host');
		expect(hostLayer).toBeDefined();
		expect(hostLayer!.visible).toBe(true);

		rigging.toggleLayer(hostLayer!.id);
		expect(hostLayer!.visible).toBe(false);

		rigging.toggleLayer(hostLayer!.id);
		expect(hostLayer!.visible).toBe(true);

		rigging.setLayerOpacity(hostLayer!.id, 0.45);
		expect(hostLayer!.opacity).toBe(0.45);

		rigging.setLayerOpacity(hostLayer!.id, 1.5); // should clamp to 1.0
		expect(hostLayer!.opacity).toBe(1.0);

		rigging.setLayerOpacity(hostLayer!.id, -0.2); // should clamp to 0.0
		expect(hostLayer!.opacity).toBe(0.0);
	});

	it('should support moving layers up and down in Photoshop stack', () => {
		const initialTopId = rigging.stageLayers[0].id;
		const secondId = rigging.stageLayers[1].id;

		// Move top layer down
		rigging.moveLayer(initialTopId, 'down');
		expect(rigging.stageLayers[0].id).toBe(secondId);
		expect(rigging.stageLayers[1].id).toBe(initialTopId);

		// Move it back up
		rigging.moveLayer(initialTopId, 'up');
		expect(rigging.stageLayers[0].id).toBe(initialTopId);
		expect(rigging.stageLayers[1].id).toBe(secondId);
	});

	it('should support toggling and updating avatar accessories props', () => {
		const sunglasses = rigging.activeAccessories.find((a) => a.id === 'sunglasses');
		expect(sunglasses).toBeDefined();
		expect(sunglasses!.visible).toBe(false);

		rigging.toggleAccessory('sunglasses');
		expect(sunglasses!.visible).toBe(true);

		rigging.updateAccessory('sunglasses', { scale: 1.25, offsetX: 10, offsetY: -120 });
		expect(sunglasses!.scale).toBe(1.25);
		expect(sunglasses!.offsetX).toBe(10);
		expect(sunglasses!.offsetY).toBe(-120);

		rigging.toggleAccessory('sunglasses');
		expect(sunglasses!.visible).toBe(false);
	});

	it('should manage Collab mode streaming state and partner model', () => {
		expect(rigging.isCollabModeActive).toBe(false);

		rigging.toggleCollabMode(true);
		expect(rigging.isCollabModeActive).toBe(true);

		rigging.setCollabModel('shizuku', 'Shizuku (Official Sample)', '/models/shizuku/shizuku.model3.json');
		expect(rigging.collabModelId).toBe('shizuku');
		expect(rigging.collabModelName).toBe('Shizuku (Official Sample)');
		expect(rigging.collabModelUrl).toBe('/models/shizuku/shizuku.model3.json');

		rigging.collabPosition = 'pip';
		expect(rigging.collabPosition).toBe('pip');

		rigging.collabSyncTracking = false;
		expect(rigging.collabSyncTracking).toBe(false);
	});
});
