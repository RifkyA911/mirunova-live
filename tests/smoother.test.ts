import { describe, expect, it } from 'bun:test';
import { ParameterSmoother } from '../src/lib/core/smoother';

describe('ParameterSmoother', () => {
	it('returns initial target value on first call', () => {
		const smoother = new ParameterSmoother(0.5);
		const val = smoother.smooth('ParamAngleX', 20);
		expect(val).toBe(20);
	});

	it('converges smoothly towards target value across frames', () => {
		const smoother = new ParameterSmoother(0.5);
		smoother.smooth('ParamAngleX', 0); // start at 0

		// Target jumps to 10
		const step1 = smoother.smooth('ParamAngleX', 10);
		expect(step1).toBe(5); // 0 + (10 - 0) * 0.5 = 5

		const step2 = smoother.smooth('ParamAngleX', 10);
		expect(step2).toBe(7.5); // 5 + (10 - 5) * 0.5 = 7.5

		const step3 = smoother.smooth('ParamAngleX', 10);
		expect(step3).toBe(8.75);
	});

	it('resets historical values on reset()', () => {
		const smoother = new ParameterSmoother(0.5);
		smoother.smooth('ParamAngleX', 30);
		smoother.reset();

		// After reset, next smooth should treat input as fresh start
		const fresh = smoother.smooth('ParamAngleX', -10);
		expect(fresh).toBe(-10);
	});
});
