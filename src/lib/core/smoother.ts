export type SmoothingProfile = 'angle' | 'blink' | 'mouth' | 'generic';

export class ParameterSmoother {
	private currentValues: Map<string, number> = new Map();
	private baseAlpha: number;

	constructor(baseAlpha: number = 0.35) {
		this.baseAlpha = baseAlpha;
	}

	setAlpha(newAlpha: number) {
		this.baseAlpha = Math.max(0.05, Math.min(0.95, newAlpha));
	}

	getAlpha(): number {
		return this.baseAlpha;
	}

	/**
	 * Smooths a parameter value using an adaptive velocity-aware filter.
	 * Fast movements are followed immediately with zero lag; subtle movements are heavily damped to eliminate noise.
	 */
	smooth(id: string, targetValue: number, profile: SmoothingProfile = 'generic'): number {
		const prev = this.currentValues.get(id);
		if (prev === undefined) {
			this.currentValues.set(id, targetValue);
			return targetValue;
		}

		const diff = Math.abs(targetValue - prev);

		// Profile-specific velocity sensitivity scaling
		let speedScale = 0.4;
		if (profile === 'angle') speedScale = 5.0;      // 5 degrees rapid turn threshold
		else if (profile === 'blink') speedScale = 0.25; // 0.25 blink state threshold
		else if (profile === 'mouth') speedScale = 0.35; // 0.35 mouth opening threshold

		// Non-linear adaptive alpha ramp
		const normalizedSpeed = Math.min(1.0, diff / speedScale);
		let alpha = this.baseAlpha + (1.0 - this.baseAlpha) * Math.pow(normalizedSpeed, 1.4);

		// Blinking asymmetry: closing eyes should be ultra-responsive
		if (profile === 'blink' && targetValue < prev) {
			alpha = Math.max(alpha, 0.75);
		}

		// Calculate smoothed output
		const smoothed = prev + (targetValue - prev) * alpha;
		this.currentValues.set(id, smoothed);
		return smoothed;
	}

	reset() {
		this.currentValues.clear();
	}
}

export const globalSmoother = new ParameterSmoother(0.35);
