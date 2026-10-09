/**
 * Persistent Configuration Storage for MiruNova Live
 * Saves user settings (model, background, sensitivity, themes, etc.)
 * into browser localStorage so reload preserves all preferences seamlessly.
 */

export interface SavedUserConfig {
	version: number;
	modelUrl?: string;
	modelName?: string;
	selectedModelId?: string;
	avatarEngine?: 'live2d' | '3d';
	selected3DModelId?: string;
	customGlbUrl?: string | null;
	uiTheme?: string;
	backgroundStyle?: string;
	backgroundColor?: string;
	screenEffect?: string;
	customBgUrl?: string | null;
	trackingSensitivity?: number;
	smoothingAmount?: number;
	eyeBlinkLinked?: boolean;
	deadzoneThreshold?: number;
	enableHandTracking?: boolean;
	showCameraPip?: boolean;
	showLandmarksMesh?: boolean;
	poseLoopMode?: string;
	poseLoopSpeed?: number;
	calibrationYaw?: number;
	calibrationPitch?: number;
	calibrationRoll?: number;
	currentLocale?: string;
}

const STORAGE_KEY = 'mirunova_live_preferences_v1';

export function savePreferences(config: Partial<SavedUserConfig>): boolean {
	if (typeof window === 'undefined' || !window.localStorage) return false;
	try {
		const payload: SavedUserConfig = {
			version: 1,
			...config
		};
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		return true;
	} catch (e) {
		console.warn('Failed to save preferences to localStorage:', e);
		return false;
	}
}

export function loadPreferences(): Partial<SavedUserConfig> | null {
	if (typeof window === 'undefined' || !window.localStorage) return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch (e) {
		console.warn('Failed to parse saved preferences from localStorage:', e);
		return null;
	}
}

export function clearPreferences(): boolean {
	if (typeof window === 'undefined' || !window.localStorage) return false;
	try {
		window.localStorage.removeItem(STORAGE_KEY);
		return true;
	} catch {
		return false;
	}
}

export function exportConfigJson(config: Partial<SavedUserConfig>): string {
	return JSON.stringify({ mirunova: 'config', version: 1, exportedAt: new Date().toISOString(), ...config }, null, 2);
}

export function importConfigJson(jsonStr: string): Partial<SavedUserConfig> | null {
	try {
		const parsed = JSON.parse(jsonStr);
		if (typeof parsed !== 'object' || !parsed) return null;
		return parsed;
	} catch {
		return null;
	}
}
