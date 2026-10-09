import { describe, expect, it } from 'bun:test';
import { ParameterSmoother } from '../src/lib/core/smoother';

describe('ParameterSmoother', () => {
	it('returns initial target value on first call', () => {
		const smoother = new ParameterSmoother(0.5);
		const val = smoother.smooth('ParamAngleX', 20);
		expect(val).toBe(20);
	});

	it('converges monotonically towards target value across frames', () => {
		const smoother = new ParameterSmoother(0.25);
		smoother.smooth('ParamAngleX', 0); // start at 0

		// Target moves to 2.0 (gradual movement)
		const step1 = smoother.smooth('ParamAngleX', 2.0, 'angle');
		expect(step1).toBeGreaterThan(0);
		expect(step1).toBeLessThan(2.0);

		const step2 = smoother.smooth('ParamAngleX', 2.0, 'angle');
		expect(step2).toBeGreaterThan(step1);
		expect(step2).toBeLessThan(2.0);

		const step3 = smoother.smooth('ParamAngleX', 2.0, 'angle');
		expect(step3).toBeGreaterThan(step2);
		expect(step3).toBeLessThanOrEqual(2.0);
	});

	it('resets historical values on reset()', () => {
		const smoother = new ParameterSmoother(0.5);
		smoother.smooth('ParamAngleX', 30);
		smoother.reset();

		// After reset, next smooth should treat input as fresh start
		const fresh = smoother.smooth('ParamAngleX', -10);
		expect(fresh).toBe(-10);
	});

	it('provides rapid response on eye closing in blink profile', () => {
		const smoother = new ParameterSmoother(0.2);
		smoother.smooth('ParamEyeLOpen', 1.0, 'blink'); // open

		// Sudden blink close
		const closedStep = smoother.smooth('ParamEyeLOpen', 0.0, 'blink');
		// Must close quickly (at least 70% in first step)
		expect(closedStep).toBeLessThan(0.35);
	});

	it('heavily attenuates micro-jitter noise below jitter threshold', () => {
		const smoother = new ParameterSmoother(0.35, 0.8);
		smoother.smooth('ParamAngleX', 0); // start at 0

		// Subtle sensor noise of 0.15 degrees (below 0.35 degree threshold)
		const jitterStep = smoother.smooth('ParamAngleX', 0.15, 'angle');
		// Should move by only a tiny fraction (heavily suppressed)
		expect(jitterStep).toBeLessThan(0.04);
	});

	it('supports smooth decay towards neutral pose on face tracking loss', () => {
		const smoother = new ParameterSmoother(0.35);
		smoother.smooth('ParamAngleX', 25.0);

		const d1 = smoother.decayTowards('ParamAngleX', 0, 0.1);
		expect(d1).toBeLessThan(25.0);
		expect(d1).toBeGreaterThan(20.0);

		const d2 = smoother.decayTowards('ParamAngleX', 0, 0.1);
		expect(d2).toBeLessThan(d1);
	});

	it('maps higher smoothing amount to lower alpha for stable output', () => {
		const smootherResponsive = new ParameterSmoother();
		smootherResponsive.setSmoothingConfig(0.0, 0.2); // snappy

		const smootherUltra = new ParameterSmoother();
		smootherUltra.setSmoothingConfig(1.0, 0.9); // ultra smooth

		expect(smootherUltra.getAlpha()).toBeLessThan(smootherResponsive.getAlpha());
	});
});
