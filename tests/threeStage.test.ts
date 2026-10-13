import { describe, it, expect } from 'bun:test';
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
		// Without init(), scene has no lights, so exactly 1 child (the active model group)
		expect(stage['scene'].children.length).toBe(1);
		expect(stage['scene'].children[0]).toBe(stage['currentModelGroup']);
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
});
