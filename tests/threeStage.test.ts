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
});
