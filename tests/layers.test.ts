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

	it('should support drag-and-drop layer reordering', () => {
		const originalOrder = rigging.stageLayers.map((l) => l.id);
		// Move layer from index 0 to index 3
		rigging.reorderLayers(0, 3);
		expect(rigging.stageLayers[3].id).toBe(originalOrder[0]);
		expect(rigging.stageLayers[0].id).toBe(originalOrder[1]);

		// Reorder back
		rigging.reorderLayers(3, 0);
		expect(rigging.stageLayers[0].id).toBe(originalOrder[0]);
	});

	it('should support switching cursor tool mode and selecting canvas elements', () => {
		expect(rigging.cursorToolMode).toBe('pan');

		rigging.setCursorToolMode('select-layer');
		expect(rigging.cursorToolMode).toBe('select-layer');

		rigging.selectLayerElement('cat-ears');
		expect(rigging.selectedLayerElementId).toBe('cat-ears');

		rigging.selectLayerElement('collab');
		expect(rigging.selectedLayerElementId).toBe('collab');

		rigging.setCursorToolMode('hand-tracking');
		expect(rigging.cursorToolMode).toBe('hand-tracking');

		rigging.setCursorToolMode('pan');
		expect(rigging.cursorToolMode).toBe('pan');
	});

	it('should support toggling Layer Manager between windowed and sticky view modes', () => {
		expect(rigging.layerManagerViewMode).toBe('windowed');

		rigging.toggleLayerManagerViewMode();
		expect(rigging.layerManagerViewMode).toBe('sticky');

		rigging.toggleLayerManagerViewMode();
		expect(rigging.layerManagerViewMode).toBe('windowed');
	});

	it('should support locking layers and guard avatar transform reset', () => {
		const hostLayer = rigging.stageLayers.find((l) => l.type === 'model-host');
		expect(hostLayer).toBeDefined();
		expect(hostLayer!.locked).toBe(false);

		rigging.setLayerLock(hostLayer!.id, true);
		expect(hostLayer!.locked).toBe(true);

		const beforeSig = rigging.resetTransformSignal;
		rigging.resetAvatarTransform();
		// Signal should not change because host layer is locked
		expect(rigging.resetTransformSignal).toBe(beforeSig);

		rigging.setLayerLock(hostLayer!.id, false);
		expect(hostLayer!.locked).toBe(false);

		rigging.resetAvatarTransform();
		expect(rigging.resetTransformSignal).toBeGreaterThan(0);
	});

	it('should support Collab Guest 2 (Max 3 Streamers) and multi-camera routing', () => {
		expect(rigging.isCollab2Active).toBe(false);

		rigging.toggleCollab2Mode(true);
		expect(rigging.isCollab2Active).toBe(true);
		expect(rigging.stageLayers.some((l) => l.type === 'model-collab-2')).toBe(true);

		rigging.setCollab2Model('rice', 'Rice Neko', '/models/rice/Rice.model3.json');
		expect(rigging.collab2ModelId).toBe('rice');
		expect(rigging.collab2ModelName).toBe('Rice Neko');

		rigging.setCollabCamera('host', 'cam-host-01', 'Integrated Laptop Camera');
		rigging.setCollabCamera('guest1', 'cam-guest1-02', 'USB 1080p Webcam');
		rigging.setCollabCamera('guest2', 'cam-guest2-03', 'DroidCam / OBS Virtual Cam');

		expect(rigging.cameraDeviceId).toBe('cam-host-01');
		expect(rigging.activeCameraLabel).toBe('Integrated Laptop Camera');
		expect(rigging.collabCameraDeviceId).toBe('cam-guest1-02');
		expect(rigging.collabCameraLabel).toBe('USB 1080p Webcam');
		expect(rigging.collab2CameraDeviceId).toBe('cam-guest2-03');
		expect(rigging.collab2CameraLabel).toBe('DroidCam / OBS Virtual Cam');
	});

	it('should support deleting layers and removing individual accessories', () => {
		// Accessories removal
		const sunglasses = rigging.activeAccessories.find((a) => a.id === 'sunglasses')!;
		sunglasses.visible = true;
		expect(sunglasses.visible).toBe(true);

		rigging.removeAccessory('sunglasses');
		expect(sunglasses.visible).toBe(false);

		// Delete Collab 2
		rigging.toggleCollab2Mode(true);
		expect(rigging.isCollab2Active).toBe(true);
		rigging.deleteLayer('layer-collab-2');
		expect(rigging.isCollab2Active).toBe(false);

		// Delete Shader layer resets screenEffect
		rigging.screenEffect = 'crt';
		rigging.deleteLayer('layer-shader');
		expect(rigging.screenEffect).toBe('none');

		// Delete Background layer resets to transparent
		rigging.backgroundStyle = 'mesh';
		rigging.deleteLayer('layer-background');
		expect(rigging.backgroundStyle).toBe('transparent');
	});

	it('should support cursorToolMode switching including camera-angle orbit', () => {
		expect(rigging.cursorToolMode).toBe('pan');

		rigging.setCursorToolMode('camera-angle');
		expect(rigging.cursorToolMode).toBe('camera-angle');

		rigging.setCursorToolMode('select-layer');
		expect(rigging.cursorToolMode).toBe('select-layer');

		rigging.setCursorToolMode('hand-tracking');
		expect(rigging.cursorToolMode).toBe('hand-tracking');

		rigging.setCursorToolMode('pan');
		expect(rigging.cursorToolMode).toBe('pan');
	});
});

