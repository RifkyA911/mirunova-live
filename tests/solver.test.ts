import { describe, expect, it } from 'bun:test';
import { solveFaceLandmarks } from '../src/lib/core/solver';

describe('solveFaceLandmarks', () => {
	// Base neutral landmarks for 478 points
	function createMockLandmarks(overrides: Record<number, { x: number; y: number; z: number }> = {}) {
		const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
		points[1] = { x: 0.5, y: 0.5, z: 0 };    // nose tip
		points[10] = { x: 0.5, y: 0.2, z: 0 };   // top forehead
		points[152] = { x: 0.5, y: 0.8, z: 0 };  // chin
		points[234] = { x: 0.3, y: 0.5, z: 0 };  // left cheek
		points[454] = { x: 0.7, y: 0.5, z: 0 };  // right cheek
		points[33] = { x: 0.4, y: 0.4, z: 0 };   // left eye
		points[263] = { x: 0.6, y: 0.4, z: 0 };  // right eye

		for (const [idx, val] of Object.entries(overrides)) {
			points[Number(idx)] = val;
		}
		return points;
	}

	it('produces near-zero angles on centered neutral face', () => {
		const landmarks = createMockLandmarks();
		const blendshapes = new Map<string, number>();
		const offsets = { yaw: 0, pitch: 0, roll: 0 };

		const res = solveFaceLandmarks(landmarks, blendshapes, offsets);

		expect(Math.abs(res.yaw)).toBeLessThan(1);
		expect(Math.abs(res.pitch)).toBeLessThan(1);
		expect(Math.abs(res.roll)).toBeLessThan(1);
		expect(res.eyeBlinkL).toBe(1); // default eyes open
		expect(res.eyeBlinkR).toBe(1);
		expect(res.mouthOpen).toBe(0);
	});

	it('detects head yaw rotation and clamps within [-30, 30]', () => {
		// Nose moved strongly to the right (x = 0.8 instead of 0.5)
		const landmarks = createMockLandmarks({
			1: { x: 0.8, y: 0.5, z: 0 }
		});
		const res = solveFaceLandmarks(landmarks, new Map(), { yaw: 0, pitch: 0, roll: 0 });

		expect(res.yaw).toBeGreaterThan(0);
		expect(res.yaw).toBeLessThanOrEqual(30);
	});

	it('correctly calculates eye blink and jawOpen blendshapes', () => {
		const landmarks = createMockLandmarks();
		const blendshapes = new Map<string, number>([
			['eyeBlinkLeft', 0.9],
			['eyeBlinkRight', 0.0],
			['jawOpen', 0.8]
		]);

		const res = solveFaceLandmarks(landmarks, blendshapes, { yaw: 0, pitch: 0, roll: 0 });

		expect(res.eyeBlinkL).toBeLessThan(0.2); // closed
		expect(res.eyeBlinkR).toBe(1.0);         // open
		expect(res.mouthOpen).toBeGreaterThan(0.7); // wide open
	});
});
