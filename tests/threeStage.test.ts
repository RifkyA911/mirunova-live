import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import { ThreeStage } from '#lib/core/threeStage';

describe('ThreeStage 3D Cat Procedural Rigging', () => {
	it('should successfully construct Mochi, Kuro, and Tora cat variants', () => {
		const stage = new ThreeStage();

		expect(() => stage.loadProceduralCat('mochi')).not.toThrow();
		expect(() => stage.loadProceduralCat('kuro')).not.toThrow();
		expect(() => stage.loadProceduralCat('tora')).not.toThrow();
	});

	it('should accept tracking parameters and apply rotations without NaN or exceptions', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('mochi');

		const testParams = {
			ParamAngleX: 20,
			ParamAngleY: -15,
			ParamAngleZ: 5,
			ParamEyeLOpen: 0.1,
			ParamEyeROpen: 0.9,
			ParamEyeBallX: -0.5,
			ParamEyeBallY: 0.3,
			ParamMouthOpenY: 0.8,
			ParamArmLA: 15,
			ParamArmRA: -5
		};

		expect(() => stage.updateParameters(testParams)).not.toThrow();
	});

	it('should handle zero, extreme, and missing parameter inputs gracefully', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('kuro');

		expect(() => stage.updateParameters({})).not.toThrow();
		expect(() =>
			stage.updateParameters({
				ParamAngleX: 999,
				ParamAngleY: -999,
				ParamEyeLOpen: -5,
				ParamMouthOpenY: 10
			})
		).not.toThrow();
	});

	it('should support framing modes: full body, half body, and face close-up', () => {
		const stage = new ThreeStage();
		stage.setFraming('full');
		expect(stage.currentFraming).toBe('full');

		stage.setFraming('half');
		expect(stage.currentFraming).toBe('half');

		stage.setFraming('closeup');
		expect(stage.currentFraming).toBe('closeup');
	});

	it('should support facial expression and full-body pose switching', () => {
		const stage = new ThreeStage();

		expect(() => stage.setExpression('stars')).not.toThrow();
		expect(stage.activeExpression).toBe('stars');

		expect(() => stage.setExpression('blush')).not.toThrow();
		expect(stage.activeExpression).toBe('blush');

		expect(() => stage.setExpression('')).not.toThrow();
		expect(stage.activeExpression).toBe('');

		expect(() => stage.setFullBodyPose('wave')).not.toThrow();
		expect(stage.activeFullBodyPose).toBe('wave');

		expect(() => stage.setFullBodyPose('peace')).not.toThrow();
		expect(stage.activeFullBodyPose).toBe('peace');

		expect(() => stage.setFullBodyPose('heart')).not.toThrow();
		expect(stage.activeFullBodyPose).toBe('heart');

		expect(() => stage.setFullBodyPose('idle')).not.toThrow();
		expect(stage.activeFullBodyPose).toBe('idle');
	});

	it('should support zoomBy and resetZoom controls', () => {
		const stage = new ThreeStage();
		expect(() => stage.zoomBy(1.2)).not.toThrow();
		expect(() => stage.zoomBy(0.8)).not.toThrow();
		expect(() => stage.resetZoom()).not.toThrow();
	});

	it('should maintain single active model group in scene upon multiple loads', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('mochi');
		stage.loadProceduralCat('kuro');
		stage.loadProceduralCat('tora');

		expect(stage['currentModelGroup']).not.toBeNull();
		// Scene contains stageEnvironmentGroup and the active model group
		expect(stage['scene'].children.includes(stage['currentModelGroup']!)).toBe(true);
		expect(stage['scene'].children.includes(stage['stageEnvironmentGroup']!)).toBe(true);
		// Exactly 1 model group exists (no orphaned models from previous loads)
		expect(stage['scene'].children.filter((c) => c !== stage['stageEnvironmentGroup']).length).toBe(1);
	});

	it('should support interactive orbit rotation, auto-spin turntable, and angle reset', () => {
		const stage = new ThreeStage();

		// Initial orbit values
		expect(stage.orbitTheta).toBe(0);
		expect(stage.isAutoSpin).toBe(false);

		// Rotate azimuth & polar
		stage.rotateOrbit(0.5, -0.2);
		expect(stage.orbitTheta).toBeCloseTo(0.5, 4);

		// Rotate by degrees
		stage.rotateOrbitDegrees(45);
		expect(stage.orbitTheta).toBeCloseTo(0.5 + Math.PI / 4, 3);

		// Negative rotate by degrees
		stage.rotateOrbitDegrees(-90);
		// Wrap around 2*PI
		expect(stage.orbitTheta).toBeGreaterThanOrEqual(0);
		expect(stage.orbitTheta).toBeLessThan(Math.PI * 2);

		// Auto spin toggle
		expect(stage.toggleAutoSpin()).toBe(true);
		expect(stage.isAutoSpin).toBe(true);
		expect(stage.toggleAutoSpin(false)).toBe(false);
		expect(stage.isAutoSpin).toBe(false);

		// Reset orbit
		stage.rotateOrbit(1.2, 0.3);
		stage.toggleAutoSpin(true);
		stage.resetOrbit();
		expect(stage.orbitTheta).toBe(0);
		expect(stage.orbitPhi).toBeCloseTo(1.55, 2);
		expect(stage.isAutoSpin).toBe(false);
	});

	it('should provide broadcast-accurate 2-tone anime cel-shading gradient for YouTube/Twitch stream look', () => {
		const stage = new ThreeStage();
		const gradient = stage.getOrCreateToonGradient();

		expect(gradient).toBeDefined();
		expect(gradient.image.width).toBe(2);
		expect(gradient.image.height).toBe(1);
		// Stepped 2-tone ramp: ~59% vibrant anime shadow (150) and 100% lit highlight (255)
		const data = gradient.image.data;
		expect(data[0]).toBe(150);
		expect(data[1]).toBe(255);
		// NearestFilter for crisp anime cel edges without blurry gouraud gradient
		expect(gradient.minFilter).toBe(1003); // THREE.NearestFilter
		expect(gradient.magFilter).toBe(1003); // THREE.NearestFilter
	});

	it('should rotate character model body directly while keeping stage environment and camera front-aligned', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('mochi');

		const modelGroup = stage['currentModelGroup'];
		expect(modelGroup).not.toBeNull();

		// Initial rotation
		expect(stage.modelRotationY).toBe(0);
		expect(modelGroup!.rotation.y).toBe(0);
		expect(stage['cameraTargetPos'].x).toBe(0);

		// Rotate model body 45 degrees
		stage.rotateModelBodyDegrees(45);
		expect(stage.modelRotationY).toBeCloseTo(Math.PI / 4, 3);
		expect(modelGroup!.rotation.y).toBeCloseTo(Math.PI / 4, 3);
		// Camera X stays at 0 (front-aligned to stage, stage environment does not spin)
		expect(stage['cameraTargetPos'].x).toBe(0);

		// Rotate model body further via delta radians
		stage.rotateModelBody(0.5);
		expect(stage.modelRotationY).toBeCloseTo(Math.PI / 4 + 0.5, 3);
		expect(modelGroup!.rotation.y).toBeCloseTo(Math.PI / 4 + 0.5, 3);

		// Reset model body to front
		stage.resetModelBody();
		expect(stage.modelRotationY).toBe(0);
		expect(modelGroup!.rotation.y).toBe(0);
		expect(stage.isAutoSpin).toBe(false);
	});

	it('should support translating and repositioning 3D model with moveModel and resetModelPosition', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('mochi');

		const modelGroup = stage['currentModelGroup'];
		expect(modelGroup).not.toBeNull();

		// Initial offsets
		expect(stage.modelOffsetX).toBe(0);
		expect(stage.modelOffsetY).toBe(0);
		expect(modelGroup!.position.x).toBe(0);

		// Move model right and up
		stage.moveModel(0.5, 0.3);
		expect(stage.modelOffsetX).toBeCloseTo(0.5, 3);
		expect(stage.modelOffsetY).toBeCloseTo(0.3, 3);
		expect(modelGroup!.position.x).toBeCloseTo(0.5, 3);
		expect(modelGroup!.position.y).toBeCloseTo(0.3, 3);

		// Set explicit position
		stage.setModelPosition(-1.2, 0.8);
		expect(stage.modelOffsetX).toBeCloseTo(-1.2, 3);
		expect(stage.modelOffsetY).toBeCloseTo(0.8, 3);
		expect(modelGroup!.position.x).toBeCloseTo(-1.2, 3);
		expect(modelGroup!.position.y).toBeCloseTo(0.8, 3);

		// Reset position
		stage.resetModelPosition();
		expect(stage.modelOffsetX).toBe(0);
		expect(stage.modelOffsetY).toBe(0);
		expect(modelGroup!.position.x).toBe(0);
		expect(modelGroup!.position.y).toBe(0);
	});

	it('should construct cozy girl room environment with soft cream yellow walls, zinc cream floor, and furniture', () => {
		const stage = new ThreeStage();
		stage.setStageEnvironment('room');

		expect(stage.currentStageEnv).toBe('room');
		const envGroup = stage['stageEnvironmentGroup'];
		expect(envGroup.children.length).toBeGreaterThan(5);

		// Check floor plane
		const floor = envGroup.children.find((c) => (c as any).isMesh && c.rotation.x === -Math.PI / 2);
		expect(floor).toBeDefined();

		// Check back wall
		const backWall = envGroup.children.find((c) => (c as any).isMesh && c.position.z === -8);
		expect(backWall).toBeDefined();
	});

	it('should lock skirt bones firmly to authored rest pose to prevent skirt flipping or lifting', () => {
		const stage = new ThreeStage();
		stage.modelType = 'fbx';

		// Create mock skirt bones matching Neuro-sama FBX structure
		const skirtControl = new THREE.Bone();
		skirtControl.name = 'skirt_control';
		skirtControl.rotation.x = -Math.PI; // -180 deg rest pose in FBX
		skirtControl.rotation.y = 0;
		skirtControl.rotation.z = 0;

		const skirtChild = new THREE.Bone();
		skirtChild.name = 'Skirt_front_2R';
		skirtChild.rotation.x = -0.1004;
		skirtChild.rotation.y = 0.1745;
		skirtChild.rotation.z = 0.0001;

		stage['skirtBones'] = [skirtControl, skirtChild];
		stage['initialRotations'].set(skirtControl, skirtControl.rotation.clone());
		stage['initialRotations'].set(skirtChild, skirtChild.rotation.clone());

		// Call updateParameters across 50 frames
		for (let i = 0; i < 50; i++) {
			stage.updateParameters({
				ParamAngleX: Math.sin(i * 0.1) * 15,
				ParamAngleY: Math.cos(i * 0.1) * 10,
				ParamEyeLOpen: 1.0,
				ParamEyeROpen: 1.0,
				ParamMouthOpenY: 0.5
			});
		}

		// Skirt control must NOT flip towards 0 or lift up; it must strictly match -Math.PI
		expect(skirtControl.rotation.x).toBeCloseTo(-Math.PI, 4);
		expect(skirtControl.rotation.y).toBeCloseTo(0, 4);
		expect(skirtControl.rotation.z).toBeCloseTo(0, 4);

		// Child skirt bone must strictly maintain authored drape
		expect(skirtChild.rotation.x).toBeCloseTo(-0.1004, 4);
		expect(skirtChild.rotation.y).toBeCloseTo(0.1745, 4);
	});
});
