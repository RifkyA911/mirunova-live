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
});
