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
		const landmarks = createMockLandmarks({
			1: { x: 0.8, y: 0.5, z: 0 }
		});
		const res = solveFaceLandmarks(landmarks, new Map(), { yaw: 0, pitch: 0, roll: 0 });

		expect(res.yaw).toBeGreaterThan(0);
		expect(res.yaw).toBeLessThanOrEqual(30);
	});

	it('correctly calculates eye blink and jawOpen blendshapes with smoothstep', () => {
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

	it('supports 6-DoF transformation matrix extraction', () => {
		const landmarks = createMockLandmarks();
		// 4x4 Identity matrix with 15-degree yaw
		const angleRad = (15 * Math.PI) / 180;
		const matrix = new Float32Array([
			Math.cos(angleRad), 0, -Math.sin(angleRad), 0,
			0, 1, 0, 0,
			Math.sin(angleRad), 0, Math.cos(angleRad), 0,
			0, 0, 0, 1
		]);

		const res = solveFaceLandmarks(landmarks, new Map(), { yaw: 0, pitch: 0, roll: 0 }, matrix);
		expect(Math.abs(res.yaw)).toBeGreaterThan(10);
		expect(Math.abs(res.yaw)).toBeLessThanOrEqual(30);
	});

	it('supports synchronized eye blinking mode', () => {
		const landmarks = createMockLandmarks();
		const blendshapes = new Map<string, number>([
			['eyeBlinkLeft', 0.85],
			['eyeBlinkRight', 0.1]
		]);

		const resLinked = solveFaceLandmarks(
			landmarks,
			blendshapes,
			{ yaw: 0, pitch: 0, roll: 0 },
			null,
			{ eyeBlinkLinked: true }
		);

		// Both eyes should be closed together in linked mode
		expect(resLinked.eyeBlinkL).toBeLessThan(0.2);
		expect(resLinked.eyeBlinkR).toBeLessThan(0.2);
	});

	it('computes mouthForm and mouthX for smiling, frowning, and jaw skew', () => {
		const landmarks = createMockLandmarks();
		const smileBlendshapes = new Map<string, number>([
			['mouthSmileLeft', 0.8],
			['mouthSmileRight', 0.8],
			['jawRight', 0.6],
			['cheekPuff', 0.5]
		]);

		const resSmile = solveFaceLandmarks(landmarks, smileBlendshapes, { yaw: 0, pitch: 0, roll: 0 });
		expect(resSmile.mouthForm).toBeGreaterThan(0.5); // smiling
		expect(resSmile.mouthX).toBeGreaterThan(0.4);    // jaw right shift
		expect(resSmile.cheekPuff).toBeGreaterThan(0.6); // cheek puffed

		const frownBlendshapes = new Map<string, number>([
			['mouthFrownLeft', 0.7],
			['mouthFrownRight', 0.7],
			['jawLeft', 0.6]
		]);

		const resFrown = solveFaceLandmarks(landmarks, frownBlendshapes, { yaw: 0, pitch: 0, roll: 0 });
		expect(resFrown.mouthForm).toBeLessThan(-0.3); // frowning
		expect(resFrown.mouthX).toBeLessThan(-0.4);    // jaw left shift
	});

	it('maps hand tracking elevation to arm angles and high-five gesture', () => {
		const landmarks = createMockLandmarks();
		const res = solveFaceLandmarks(
			landmarks,
			new Map(),
			{ yaw: 0, pitch: 0, roll: 0 },
			null,
			undefined,
			{ armLA: 28.0, armRA: 5.0, isHighFiveL: true, gestureL: 'high_five' }
		);

		expect(res.armLA).toBe(28.0);
		expect(res.armRA).toBe(5.0);
		expect(res.isHighFiveL).toBe(true);
		expect(res.handLGesture).toBe('high_five');
	});

	it('maintains rock-solid open eyes (1.0) under subtle eyelid fluctuations', () => {
		const landmarks = createMockLandmarks();
		// Subtle eyelid score 0.20 (common in webcam video) should NOT cause half-closed eyes
		const blendshapes = new Map<string, number>([
			['eyeBlinkLeft', 0.20],
			['eyeBlinkRight', 0.22]
		]);

		const res = solveFaceLandmarks(landmarks, blendshapes, { yaw: 0, pitch: 0, roll: 0 });
		expect(res.eyeBlinkL).toBe(1.0);
		expect(res.eyeBlinkR).toBe(1.0);
	});

	it('detects sad mouth :( via geometric corner droop even with weak blendshapes', () => {
		// Landmarks with mouth corners (61, 291) lower than center upper lip (13)
		const landmarks = createMockLandmarks({
			13: { x: 0.5, y: 0.50, z: 0 },   // center upper lip
			61: { x: 0.44, y: 0.53, z: 0 },  // left corner drooped (y larger = lower)
			291: { x: 0.56, y: 0.53, z: 0 }  // right corner drooped
		});

		const res = solveFaceLandmarks(landmarks, new Map(), { yaw: 0, pitch: 0, roll: 0 });
		expect(res.mouthForm).toBeLessThan(-0.3); // reliably detects :(
	});

	it('applies continuous deadzone without step pop discontinuity', () => {
		const landmarks = createMockLandmarks({
			1: { x: 0.505, y: 0.5, z: 0 } // rawYaw is 1.125 degrees
		});

		// Inside deadzone (deadzone = 1.5 > 1.125)
		const inside = solveFaceLandmarks(landmarks, new Map(), { yaw: 0, pitch: 0, roll: 0 }, null, { deadzone: 1.5 });
		expect(inside.yaw).toBe(0);

		// Continuous subtraction outside deadzone (deadzone = 1.0 -> 1.125 - 1.0 = 0.125)
		const outside = solveFaceLandmarks(landmarks, new Map(), { yaw: 0, pitch: 0, roll: 0 }, null, { deadzone: 1.0 });
		expect(outside.yaw).toBeCloseTo(0.125, 2);
	});
});
