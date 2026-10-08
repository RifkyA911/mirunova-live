export class ParameterSmoother {
	private currentValues: Map<string, number> = new Map();
	private alpha: number;

	constructor(alpha: number = 0.35) {
		this.alpha = alpha;
	}

	setAlpha(newAlpha: number) {
		this.alpha = Math.max(0.01, Math.min(1.0, newAlpha));
	}

	smooth(id: string, targetValue: number): number {
		const prev = this.currentValues.get(id);
		if (prev === undefined) {
			this.currentValues.set(id, targetValue);
			return targetValue;
		}

		// Linear Interpolation: prev + (target - prev) * alpha
		const smoothed = prev + (targetValue - prev) * this.alpha;
		this.currentValues.set(id, smoothed);
		return smoothed;
	}

	reset() {
		this.currentValues.clear();
	}
}

export const globalSmoother = new ParameterSmoother(0.4);
