import type {
	Live2DParameterDef,
	BackgroundStyle,
	ScreenEffect,
	UITheme,
	PoseLoopMode,
	RiggingMode
} from '#lib/types/tracking';
import { MODEL_CATALOG } from '#lib/data/models';

export const DEFAULT_PARAMETERS: Live2DParameterDef[] = [
	// Head Rotation
	{ id: 'ParamAngleX', label: 'Head Yaw (Kiri/Kanan)', min: -30, max: 30, defaultValue: 0, group: 'head' },
	{ id: 'ParamAngleY', label: 'Head Pitch (Atas/Bawah)', min: -30, max: 30, defaultValue: 0, group: 'head' },
	{ id: 'ParamAngleZ', label: 'Head Roll (Miring)', min: -30, max: 30, defaultValue: 0, group: 'head' },
	// Eyes & Eyebrows
	{ id: 'ParamEyeLOpen', label: 'Eye Left Open', min: 0, max: 1, defaultValue: 1, group: 'eyes' },
	{ id: 'ParamEyeROpen', label: 'Eye Right Open', min: 0, max: 1, defaultValue: 1, group: 'eyes' },
	{ id: 'ParamEyeBallX', label: 'Eye Ball X (Pandangan X)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamEyeBallY', label: 'Eye Ball Y (Pandangan Y)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowLY', label: 'Brow Left Y (Alis Kiri)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowRY', label: 'Brow Right Y (Alis Kanan)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	// Mouth & Cheeks
	{ id: 'ParamMouthOpenY', label: 'Mouth Open (Bicara)', min: 0, max: 1, defaultValue: 0, group: 'mouth' },
	{ id: 'ParamMouthForm', label: 'Mouth Form (Senyum/Bibir)', min: -1, max: 1, defaultValue: 0, group: 'mouth' },
	{ id: 'ParamCheek', label: 'Cheek Puff / Blush (Pipi)', min: 0, max: 1, defaultValue: 0, group: 'mouth' },
	// Body & Breathing
	{ id: 'ParamBodyAngleX', label: 'Body Angle X (Putar Badan)', min: -10, max: 10, defaultValue: 0, group: 'body' },
	{ id: 'ParamBodyAngleY', label: 'Body Angle Y (Bungkuk Badan)', min: -10, max: 10, defaultValue: 0, group: 'body' },
	{ id: 'ParamBodyAngleZ', label: 'Body Angle Z (Miring Badan)', min: -10, max: 10, defaultValue: 0, group: 'body' },
	{ id: 'ParamBreath', label: 'Breathing (Nafas)', min: 0, max: 1, defaultValue: 0, group: 'body' },
	// Arms & Hands
	{ id: 'ParamArmLA', label: 'Arm Left Angle (Tangan Kiri)', min: -30, max: 30, defaultValue: 0, group: 'hands' },
	{ id: 'ParamArmRA', label: 'Arm Right Angle (Tangan Kanan)', min: -30, max: 30, defaultValue: 0, group: 'hands' }
];

export class RiggingStore {
	// Mode & UI State
	riggingMode = $state<RiggingMode>('live');
	isDrawerOpen = $state<boolean>(false);
	isThemeModalOpen = $state<boolean>(false);
	isModelModalOpen = $state<boolean>(false);
	isCameraActive = $state<boolean>(false);
	showCameraPip = $state<boolean>(true);
	showLandmarksMesh = $state<boolean>(true);
	enableHandTracking = $state<boolean>(true);

	// Theme & Background System
	uiTheme = $state<UITheme>('cyber-dark');
	backgroundStyle = $state<BackgroundStyle>('solid');
	backgroundColor = $state<string>('#09090b'); // Custom hex
	screenEffect = $state<ScreenEffect>('none');
	customBgUrl = $state<string | null>(null);

	// Avatar Engine: Live2D vs 3D
	avatarEngine = $state<'live2d' | '3d'>('live2d');
	selected3DModelId = $state<string>('mochi-cat');
	customGlbUrl = $state<string | null>(null);

	// Active Model Details
	selectedModelId = $state<string>('haru');
	modelName = $state<string>('Haru Greeter');
	modelUrl = $state<string>(MODEL_CATALOG[0].url);
	isLoadingModel = $state<boolean>(false);
	availableMotions = $state<string[]>([]);
	triggerMotionSignal = $state<{ name: string; timestamp: number } | null>(null);

	// Pose Looping System
	poseLoopMode = $state<PoseLoopMode>('idle-breath');
	poseLoopSpeed = $state<number>(1.0);

	// Tracking Status & Metrics
	fps = $state<number>(0);
	latencyMs = $state<number>(0);
	isFaceDetected = $state<boolean>(false);
	isHandLDetected = $state<boolean>(false);
	isHandRDetected = $state<boolean>(false);

	// Calibration offsets
	calibrationYaw = $state<number>(0);
	calibrationPitch = $state<number>(0);
	calibrationRoll = $state<number>(0);

	// Parameter values
	liveValues = $state<Record<string, number>>({});
	manualValues = $state<Record<string, number>>({});
	parameters = $state<Live2DParameterDef[]>(DEFAULT_PARAMETERS);

	constructor() {
		for (const p of DEFAULT_PARAMETERS) {
			this.liveValues[p.id] = p.defaultValue;
			this.manualValues[p.id] = p.defaultValue;
		}
	}

	setManualValue(id: string, value: number) {
		this.manualValues[id] = value;
	}

	setLiveValue(id: string, value: number) {
		this.liveValues[id] = value;
	}

	getActiveValue(id: string): number {
		if (this.riggingMode === 'manual') {
			return this.manualValues[id] ?? 0;
		}
		return this.liveValues[id] ?? 0;
	}

	resetManualOverrides() {
		for (const p of this.parameters) {
			this.manualValues[p.id] = p.defaultValue;
		}
	}

	calibrateCenter(yaw: number, pitch: number, roll: number) {
		this.calibrationYaw = yaw;
		this.calibrationPitch = pitch;
		this.calibrationRoll = roll;
	}

	resetCalibration() {
		this.calibrationYaw = 0;
		this.calibrationPitch = 0;
		this.calibrationRoll = 0;
	}

	setModel(id: string, name: string, url: string) {
		this.selectedModelId = id;
		this.modelName = name;
		this.modelUrl = url;
	}

	playMotion(name: string) {
		this.triggerMotionSignal = { name, timestamp: performance.now() };
	}
}

export const rigging = new RiggingStore();
