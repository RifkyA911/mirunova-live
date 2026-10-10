export interface Live2DParameterDef {
	id: string;
	label: string;
	min: number;
	max: number;
	defaultValue: number;
	group: 'head' | 'eyes' | 'mouth' | 'body' | 'hands' | 'custom';
}

export interface TrackingResults {
	yaw: number;           // Head Yaw (-30 to 30)
	pitch: number;         // Head Pitch (-30 to 30)
	roll: number;          // Head Roll (-30 to 30)
	eyeBlinkL: number;     // 0 to 1
	eyeBlinkR: number;     // 0 to 1
	eyeBallX: number;      // -1 to 1
	eyeBallY: number;      // -1 to 1
	browL: number;         // -1 to 1
	browR: number;         // -1 to 1
	mouthOpen: number;     // 0 to 1
	mouthForm: number;     // -1 to 1 (frown to smile)
	mouthX: number;        // -1 to 1 (mouth/jaw horizontal skew)
	cheekPuff: number;     // 0 to 1
	bodyAngleX: number;    // -10 to 10
	bodyAngleY: number;    // -10 to 10
	bodyAngleZ: number;    // -10 to 10
	armLA: number;         // Hand/Arm Left gesture/pos (0 to 30)
	armRA: number;         // Hand/Arm Right gesture/pos (0 to 30)
	handLDetected: boolean;
	handRDetected: boolean;
	handLGesture?: 'high_five' | 'wave' | 'open' | 'fist' | 'peace' | 'none';
	handRGesture?: 'high_five' | 'wave' | 'open' | 'fist' | 'peace' | 'none';
	eyeSmileL?: number;    // 0 to 1
	eyeSmileR?: number;    // 0 to 1
	isHighFiveL?: boolean;
	isHighFiveR?: boolean;
}

export interface TrackingConfig {
	sensitivity: number;       // 0.5 to 2.0 (default 1.0)
	smoothing: number;         // 0.1 to 0.7 (default 0.35)
	deadzone: number;          // 0 to 1.5 degrees (default 0.3)
	eyeBlinkLinked: boolean;   // sync both eyes
	invertPitch?: boolean;     // invert up/down head pitch (ndiluk / mendongak)
	invertYaw?: boolean;       // invert left/right head yaw
}

export type BackgroundStyle =
	| 'transparent'
	| 'solid'
	| 'mesh'
	| 'dots'
	| 'grid'
	| 'cosmic'
	| 'gradient'
	| 'custom-image'
	| 'chroma';
export type ScreenEffect = 'none' | 'vignette' | 'scanlines' | 'crt' | 'blur';
export type PoseLoopMode = 'none' | 'idle-breath' | 'gentle-sway' | 'head-nod';
export type UITheme =
	| 'cyber-dark'
	| 'midnight'
	| 'synthwave'
	| 'monochrome'
	| 'light'
	| 'cyan'
	| 'pink'
	| 'matcha';

export interface ThemePalette {
	id: UITheme;
	name: string;
	desc: string;
	badge: string;
	bgHex: string;
	palette: {
		bg: string;
		surface: string;
		accent: string;
		border: string;
		text: string;
		ring: string;
	};
}

export type RiggingMode = 'live' | 'manual';
export type RiggingViewMode = 'stay' | 'windowed' | 'drawer';
export type AvatarFramingMode = 'full' | 'half' | 'closeup';
export type VoiceFilterType = 'none' | 'pitch-high' | 'pitch-low' | 'radio' | 'warmth';

export interface Live2DModelItem {
	id: string;
	name: string;
	url: string;
	description: string;
	version: 'Cubism 3/4' | 'Cubism 2';
	avatarUrl?: string;
	source?: 'booth' | 'official' | 'community';
	boothUrl?: string;
	author?: string;
}
