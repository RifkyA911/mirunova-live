export type SmoothingProfile = 'angle' | 'blink' | 'mouth' | 'generic';

export class ParameterSmoother {
	private currentValues: Map<string, number> = new Map();
	private baseAlpha: number;
	private jitterReduction: number = 0.5;

	constructor(baseAlpha: number = 0.35, jitterReduction: number = 0.5) {
		this.baseAlpha = Math.max(0.05, Math.min(0.95, baseAlpha));
		this.jitterReduction = Math.max(0.0, Math.min(1.0, jitterReduction));
	}

	setAlpha(newAlpha: number) {
		this.baseAlpha = Math.max(0.05, Math.min(0.95, newAlpha));
	}

	getAlpha(): number {
		return this.baseAlpha;
	}

	setSmoothingConfig(smoothingAmount: number, jitterReduction: number = 0.5) {
		// Map user-friendly 0..1 slider: higher value = more smoothing / lower alpha
		const clampedSmooth = Math.max(0.0, Math.min(1.0, smoothingAmount));
		this.baseAlpha = (1.0 - clampedSmooth * 0.75) * 0.45 + 0.05;
		this.jitterReduction = Math.max(0.0, Math.min(1.0, jitterReduction));
	}

	getValue(id: string): number | undefined {
		return this.currentValues.get(id);
	}

	/**
	 * Smooths a parameter value using an adaptive velocity-aware filter with jitter deadband suppression.
	 * Fast movements are followed immediately with zero lag; subtle camera sensor noise is heavily damped.
	 */
	smooth(id: string, targetValue: number, profile: SmoothingProfile = 'generic'): number {
		const prev = this.currentValues.get(id);
		if (prev === undefined) {
			this.currentValues.set(id, targetValue);
			return targetValue;
		}

		const diff = Math.abs(targetValue - prev);

		// Profile-specific velocity sensitivity scaling and jitter noise floor
		let speedScale = 0.4;
		let jitterFloor = 0.03;

		if (profile === 'angle') {
			speedScale = 4.0;
			jitterFloor = 0.35; // typical webcam face landmark noise is ~0.15 - 0.35 degrees
		} else if (profile === 'blink') {
			speedScale = 0.25;
			jitterFloor = 0.02;
		} else if (profile === 'mouth') {
			speedScale = 0.35;
			jitterFloor = 0.025;
		}

		const effectiveJitterThreshold = jitterFloor * (0.8 + this.jitterReduction * 1.2);

		let alpha: number;
		if (diff < effectiveJitterThreshold) {
			// Quadratic noise attenuation when idle / inside jitter deadband
			const noiseRatio = diff / effectiveJitterThreshold;
			const dampFactor = Math.pow(noiseRatio, 2);
			alpha = this.baseAlpha * Math.max(0.05, dampFactor);
		} else {
			// Deliberate movement: ramp up alpha smoothly towards 0.90 to eliminate latency
			const normalizedSpeed = Math.min(1.0, (diff - effectiveJitterThreshold) / speedScale);
			alpha = this.baseAlpha + (0.92 - this.baseAlpha) * Math.pow(normalizedSpeed, 1.2);
		}

		// Blinking asymmetry: closing eyes should be instantaneous (ultra-responsive snap)
		if (profile === 'blink' && targetValue < prev) {
			alpha = Math.max(alpha, 0.85);
		}

		// Calculate smoothed output
		const smoothed = prev + (targetValue - prev) * alpha;
		this.currentValues.set(id, smoothed);
		return smoothed;
	}

	/**
	 * Smoothly decays a parameter toward a neutral state (used when face detection is momentarily lost)
	 */
	decayTowards(id: string, neutralValue: number, decayAlpha: number = 0.08): number {
		const prev = this.currentValues.get(id);
		if (prev === undefined) {
			this.currentValues.set(id, neutralValue);
			return neutralValue;
		}
		const next = prev + (neutralValue - prev) * decayAlpha;
		this.currentValues.set(id, next);
		return next;
	}

	reset() {
		this.currentValues.clear();
	}
}

export const globalSmoother = new ParameterSmoother(0.35, 0.5);
