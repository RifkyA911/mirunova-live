import { describe, test, expect } from 'bun:test';
import { detectHardwareBenchmark } from '../src/lib/core/hardware';

describe('Hardware Spec & Benchmark Scoring', () => {
	test('should return a valid hardware report with scores and tiers', () => {
		const report = detectHardwareBenchmark(60);

		expect(report).toBeDefined();
		expect(typeof report.score).toBe('number');
		expect(report.score).toBeGreaterThanOrEqual(10);
		expect(report.score).toBeLessThanOrEqual(100);

		const validTiers = ['Tidak Lancar', 'Cukup', 'Lancar', 'Sangat Lancar / Ultra'];
		expect(validTiers).toContain(report.tierLabel);

		expect(report.tierColor).toMatch(/^#[0-9a-fA-F]{6}$/);
		expect(typeof report.recommendation).toBe('string');
	});

	test('should adjust score based on low vs high FPS', () => {
		const lowFpsReport = detectHardwareBenchmark(15);
		const highFpsReport = detectHardwareBenchmark(60);

		expect(highFpsReport.score).toBeGreaterThanOrEqual(lowFpsReport.score);
	});
});
