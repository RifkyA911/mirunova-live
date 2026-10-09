import { describe, test, expect, beforeEach } from 'bun:test';
import {
	savePreferences,
	loadPreferences,
	clearPreferences,
	exportConfigJson,
	importConfigJson,
	type SavedUserConfig
} from '../src/lib/core/storage';

// Mock localStorage for Bun test runtime
const mockStore: Record<string, string> = {};
(globalThis as any).window = {
	localStorage: {
		getItem: (key: string) => mockStore[key] || null,
		setItem: (key: string, val: string) => {
			mockStore[key] = val;
		},
		removeItem: (key: string) => {
			delete mockStore[key];
		},
		clear: () => {
			for (const k of Object.keys(mockStore)) delete mockStore[k];
		}
	}
};

describe('Persistent Configuration Storage', () => {
	beforeEach(() => {
		(globalThis as any).window.localStorage.clear();
	});

	test('should save and load user preferences from localStorage', () => {
		const config: Partial<SavedUserConfig> = {
			modelName: 'Haru Greeter',
			uiTheme: 'cyber-dark',
			backgroundStyle: 'mesh',
			backgroundColor: '#09090b',
			trackingSensitivity: 1.4,
			smoothingAmount: 0.45,
			eyeBlinkLinked: true,
			deadzoneThreshold: 0.5,
			enableHandTracking: true
		};

		const saved = savePreferences(config);
		expect(saved).toBe(true);

		const loaded = loadPreferences();
		expect(loaded).not.toBeNull();
		expect(loaded?.modelName).toBe('Haru Greeter');
		expect(loaded?.uiTheme).toBe('cyber-dark');
		expect(loaded?.backgroundStyle).toBe('mesh');
		expect(loaded?.trackingSensitivity).toBe(1.4);
		expect(loaded?.eyeBlinkLinked).toBe(true);
	});

	test('should clear preferences on reset', () => {
		savePreferences({ modelName: 'Mochi Cat' });
		expect(loadPreferences()?.modelName).toBe('Mochi Cat');

		clearPreferences();
		expect(loadPreferences()).toBeNull();
	});

	test('should export valid JSON backup format', () => {
		const json = exportConfigJson({
			modelName: 'Momose Aria',
			backgroundStyle: 'cosmic',
			uiTheme: 'synthwave'
		});

		expect(json).toContain('"mirunova": "config"');
		expect(json).toContain('"modelName": "Momose Aria"');
		expect(json).toContain('"uiTheme": "synthwave"');

		const parsed = JSON.parse(json);
		expect(parsed.version).toBe(1);
	});

	test('should validate and import valid JSON config', () => {
		const jsonValid = JSON.stringify({
			mirunova: 'config',
			version: 1,
			modelName: 'Hiyori Cute',
			trackingSensitivity: 1.2
		});

		const imported = importConfigJson(jsonValid);
		expect(imported).not.toBeNull();
		expect(imported?.modelName).toBe('Hiyori Cute');
		expect(imported?.trackingSensitivity).toBe(1.2);

		// Malformed JSON should return null safely
		expect(importConfigJson('invalid json string')).toBeNull();
	});
});
