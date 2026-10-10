import type {
	Live2DParameterDef,
	BackgroundStyle,
	ScreenEffect,
	UITheme,
	PoseLoopMode,
	RiggingMode,
	RiggingViewMode,
	AvatarFramingMode,
	VoiceFilterType,
	ThemePalette
} from '#lib/types/tracking';
import { MODEL_CATALOG } from '#lib/data/models';
import { UI_THEMES } from '#lib/data/themes';
import { i18n, type Locale } from '#lib/i18n/index.svelte';

export { UI_THEMES };

export const DEFAULT_PARAMETERS: Live2DParameterDef[] = [
	// Head Rotation
	{ id: 'ParamAngleX', label: 'Head Yaw (Kiri/Kanan)', min: -30, max: 30, defaultValue: 0, group: 'head' },
	{ id: 'ParamAngleY', label: 'Head Pitch (Atas/Bawah)', min: -30, max: 30, defaultValue: 0, group: 'head' },
	{ id: 'ParamAngleZ', label: 'Head Roll (Miring)', min: -30, max: 30, defaultValue: 0, group: 'head' },
	// Eyes & Eyebrows
	{ id: 'ParamEyeLOpen', label: 'Eye Left Open', min: 0, max: 1, defaultValue: 1, group: 'eyes' },
	{ id: 'ParamEyeROpen', label: 'Eye Right Open', min: 0, max: 1, defaultValue: 1, group: 'eyes' },
	{ id: 'ParamEyeLSmile', label: 'Eye Left Smile (^.^)', min: 0, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamEyeRSmile', label: 'Eye Right Smile (^.^)', min: 0, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamEyeBallX', label: 'Eye Ball X (Pandangan X)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamEyeBallY', label: 'Eye Ball Y (Pandangan Y)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowLY', label: 'Brow Left Y (Alis Kiri)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowRY', label: 'Brow Right Y (Alis Kanan)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	// Mouth & Cheeks
	{ id: 'ParamMouthOpenY', label: 'Mouth Open (Bicara)', min: 0, max: 1, defaultValue: 0, group: 'mouth' },
	{ id: 'ParamMouthForm', label: 'Mouth Form (Senyum/Bibir)', min: -1, max: 1, defaultValue: 0, group: 'mouth' },
	{ id: 'ParamMouthX', label: 'Mouth X (Geser Mulut)', min: -1, max: 1, defaultValue: 0, group: 'mouth' },
	{ id: 'ParamCheek', label: 'Cheek Puff / Blush (Pipi)', min: 0, max: 1, defaultValue: 0, group: 'mouth' },
	// Body & Breathing
	{ id: 'ParamBodyAngleX', label: 'Body Angle X (Putar Badan)', min: -10, max: 10, defaultValue: 0, group: 'body' },
	{ id: 'ParamBodyAngleY', label: 'Body Angle Y (Bungkuk Badan)', min: -10, max: 10, defaultValue: 0, group: 'body' },
	{ id: 'ParamBodyAngleZ', label: 'Body Angle Z (Miring Badan)', min: -10, max: 10, defaultValue: 0, group: 'body' },
	{ id: 'ParamBreath', label: 'Breathing (Nafas)', min: 0, max: 1, defaultValue: 0, group: 'body' },
	// Arms & Hands
	{ id: 'ParamArmLA', label: 'Arm Left Angle (Tangan Kiri)', min: -30, max: 30, defaultValue: 0, group: 'hands' },
	{ id: 'ParamArmRA', label: 'Arm Right Angle (Tangan Kanan)', min: -30, max: 30, defaultValue: 0, group: 'hands' },
	{ id: 'ParamArmLB', label: 'Arm Left High-Five Pose', min: 0, max: 1, defaultValue: 0, group: 'hands' },
	{ id: 'ParamArmRB', label: 'Arm Right High-Five Pose', min: 0, max: 1, defaultValue: 0, group: 'hands' },
	{ id: 'ParamHandAngleL', label: 'Hand Left Angle (Lambaian Kiri)', min: -30, max: 30, defaultValue: 0, group: 'hands' },
	{ id: 'ParamHandAngleR', label: 'Hand Right Angle (Lambaian Kanan)', min: -30, max: 30, defaultValue: 0, group: 'hands' }
];

import { savePreferences, loadPreferences } from '#lib/core/storage';

export class RiggingStore {
	// Mode & UI State
	riggingMode = $state<RiggingMode>('live');
	isDrawerOpen = $state<boolean>(false);
	isThemeModalOpen = $state<boolean>(false);
	isModelModalOpen = $state<boolean>(false);
	isObsModalOpen = $state<boolean>(false);
	isSettingsModalOpen = $state<boolean>(false);
	isShortcutModalOpen = $state<boolean>(false);
	isDockHidden = $state<boolean>(false);
	resetTransformSignal = $state<number>(0);
	isCameraActive = $state<boolean>(false);
	showCameraPip = $state<boolean>(true);
	showLandmarksMesh = $state<boolean>(true);
	enableHandTracking = $state<boolean>(true);

	// OBS Screen Mode System
	isObsMode = $state<boolean>(false);
	obsBgType = $state<'transparent' | 'chroma'>('transparent');
	previousBgStyle = $state<BackgroundStyle>('solid');

	// Toast & Screenshot Notifications
	toastMessage = $state<string | null>(null);
	screenshotSignal = $state<number>(0);
	isCalibrating = $state<boolean>(false);
	private toastTimer: any = null;

	// Screen Locking & Layout Modes
	isGuiLocked = $state<boolean>(false);
	isRiggingPinned = $state<boolean>(true);
	riggingViewMode = $state<RiggingViewMode>('stay');

	// Tracking Quality & Anti-Flicker Stability Tuners
	trackingSensitivity = $state<number>(1.0); // 0.5 to 2.5
	smoothingAmount = $state<number>(0.45);     // 0.0 snappy to 1.0 ultra smooth
	jitterReduction = $state<number>(0.5);     // 0.0 to 1.0 jitter suppression filter
	deadzoneThreshold = $state<number>(0.3);    // 0 to 1.5 degrees continuous deadband
	eyeBlinkLinked = $state<boolean>(false);    // sync both eyes
	holdPoseOnLoss = $state<boolean>(true);     // hold pose on 1-frame drop & smooth decay
	invertPitch = $state<boolean>(false);       // Invert Y (menunduk / mendongak)
	invertYaw = $state<boolean>(false);         // Invert X (kiri / kanan)

	// Camera Hardware Preferences
	cameraDeviceId = $state<string>('');
	cameraResolution = $state<'1080p' | '720p' | '480p'>('720p');
	activeCameraLabel = $state<string>('');

	// Avatar Framing & Parts Visibility System
	framingMode = $state<AvatarFramingMode>('half'); // 'full' | 'half' | 'closeup'
	isSquareFrameActive = $state<boolean>(false);     // Streamer square avatar box
	squareFrameFade = $state<boolean>(true);         // Fade out overflow edges
	squareFrameSize = $state<number>(620);           // Box size in px
	hiddenPartIds = $state<Record<string, boolean>>({}); // Model part visibility overrides
	availableParts = $state<Array<{ id: string; name: string; opacity: number }>>([]); // Discovered live parts

	// Floating / Windowed Rigging Panel Geometry (Draggable & Resizable)
	riggingWindowX = $state<number>(0);
	riggingWindowY = $state<number>(72);
	riggingWindowWidth = $state<number>(440);
	riggingWindowHeight = $state<number>(580);

	// Real Web Audio API Microphone & DSP State
	isMicActive = $state<boolean>(false);
	isMicMonitorActive = $state<boolean>(false);
	audioDeviceId = $state<string>('');
	micGain = $state<number>(1.0);
	voiceFilter = $state<VoiceFilterType>('none');
	micVolumeLevel = $state<number>(0); // 0.0 to 1.0 real VU meter level

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
	selectedModelId = $state<string>('vivian');
	modelName = $state<string>('薇薇安 (Vivian)');
	modelUrl = $state<string>('/models/vivian/薇薇安.model3.json');
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
	handLGesture = $state<string>('none');
	handRGesture = $state<string>('none');

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
		if (typeof window !== 'undefined') {
			this.loadFromStorage();
		}
	}

	showToast(msg: string) {
		this.toastMessage = msg;
		if (this.toastTimer) clearTimeout(this.toastTimer);
		this.toastTimer = setTimeout(() => {
			this.toastMessage = null;
		}, 3000);
	}

	triggerScreenshot() {
		this.screenshotSignal = performance.now();
	}

	persist() {
		savePreferences({
			modelUrl: this.modelUrl,
			modelName: this.modelName,
			selectedModelId: this.selectedModelId,
			avatarEngine: this.avatarEngine,
			selected3DModelId: this.selected3DModelId,
			customGlbUrl: this.customGlbUrl,
			uiTheme: this.uiTheme,
			backgroundStyle: this.backgroundStyle,
			backgroundColor: this.backgroundColor,
			screenEffect: this.screenEffect,
			customBgUrl: this.customBgUrl,
			trackingSensitivity: this.trackingSensitivity,
			smoothingAmount: this.smoothingAmount,
			jitterReduction: this.jitterReduction,
			deadzoneThreshold: this.deadzoneThreshold,
			eyeBlinkLinked: this.eyeBlinkLinked,
			holdPoseOnLoss: this.holdPoseOnLoss,
			enableHandTracking: this.enableHandTracking,
			showCameraPip: this.showCameraPip,
			showLandmarksMesh: this.showLandmarksMesh,
			poseLoopMode: this.poseLoopMode,
			poseLoopSpeed: this.poseLoopSpeed,
			calibrationYaw: this.calibrationYaw,
			calibrationPitch: this.calibrationPitch,
			calibrationRoll: this.calibrationRoll,
			isRiggingPinned: this.isRiggingPinned,
			riggingViewMode: this.riggingViewMode,
			cameraDeviceId: this.cameraDeviceId,
			cameraResolution: this.cameraResolution,
			invertPitch: this.invertPitch,
			invertYaw: this.invertYaw,
			framingMode: this.framingMode,
			isSquareFrameActive: this.isSquareFrameActive,
			squareFrameFade: this.squareFrameFade,
			squareFrameSize: this.squareFrameSize,
			hiddenPartIds: this.hiddenPartIds,
			riggingWindowX: this.riggingWindowX,
			riggingWindowY: this.riggingWindowY,
			riggingWindowWidth: this.riggingWindowWidth,
			riggingWindowHeight: this.riggingWindowHeight,
			isMicActive: this.isMicActive,
			isMicMonitorActive: this.isMicMonitorActive,
			audioDeviceId: this.audioDeviceId,
			micGain: this.micGain,
			voiceFilter: this.voiceFilter,
			currentLocale: i18n.currentLocale
		});
	}

	loadFromStorage() {
		const saved = loadPreferences();
		if (!saved) return;
		if (saved.avatarEngine) this.avatarEngine = saved.avatarEngine;
		if (saved.selected3DModelId) this.selected3DModelId = saved.selected3DModelId;
		if (saved.customGlbUrl !== undefined) this.customGlbUrl = saved.customGlbUrl;

		// Safe model verification to prevent 404 from obsolete models like momose_aria
		if (saved.selectedModelId) {
			const found = MODEL_CATALOG.find((m) => m.id === saved.selectedModelId);
			if (found) {
				this.selectedModelId = found.id;
				this.modelName = found.name;
				this.modelUrl = found.url;
			} else {
				this.selectedModelId = MODEL_CATALOG[0]?.id || 'mihari';
				this.modelName = MODEL_CATALOG[0]?.name || 'Mihari (绪山美波里)';
				this.modelUrl = MODEL_CATALOG[0]?.url || '/models/mihari/Mihari_V1.model3.json';
			}
		}

		if (saved.uiTheme) this.uiTheme = saved.uiTheme as any;
		if (saved.backgroundStyle) this.backgroundStyle = saved.backgroundStyle as any;
		if (saved.backgroundColor) this.backgroundColor = saved.backgroundColor;
		if (saved.screenEffect) this.screenEffect = saved.screenEffect as any;
		if (saved.customBgUrl !== undefined) this.customBgUrl = saved.customBgUrl;
		if (saved.trackingSensitivity !== undefined) this.trackingSensitivity = saved.trackingSensitivity;
		if (saved.smoothingAmount !== undefined) this.smoothingAmount = saved.smoothingAmount;
		if (saved.jitterReduction !== undefined) this.jitterReduction = saved.jitterReduction;
		if (saved.deadzoneThreshold !== undefined) this.deadzoneThreshold = saved.deadzoneThreshold;
		if (saved.eyeBlinkLinked !== undefined) this.eyeBlinkLinked = saved.eyeBlinkLinked;
		if (saved.holdPoseOnLoss !== undefined) this.holdPoseOnLoss = saved.holdPoseOnLoss;
		if (saved.invertPitch !== undefined) this.invertPitch = saved.invertPitch;
		if (saved.invertYaw !== undefined) this.invertYaw = saved.invertYaw;
		if (saved.enableHandTracking !== undefined) this.enableHandTracking = saved.enableHandTracking;
		if (saved.showCameraPip !== undefined) this.showCameraPip = saved.showCameraPip;
		if (saved.showLandmarksMesh !== undefined) this.showLandmarksMesh = saved.showLandmarksMesh;
		if (saved.poseLoopMode) this.poseLoopMode = saved.poseLoopMode as any;
		if (saved.poseLoopSpeed !== undefined) this.poseLoopSpeed = saved.poseLoopSpeed;
		if (saved.calibrationYaw !== undefined) this.calibrationYaw = saved.calibrationYaw;
		if (saved.calibrationPitch !== undefined) this.calibrationPitch = saved.calibrationPitch;
		if (saved.calibrationRoll !== undefined) this.calibrationRoll = saved.calibrationRoll;
		if (saved.isRiggingPinned !== undefined) this.isRiggingPinned = saved.isRiggingPinned;
		if (saved.riggingViewMode) this.riggingViewMode = saved.riggingViewMode;
		if (saved.cameraDeviceId !== undefined) this.cameraDeviceId = saved.cameraDeviceId;
		if (saved.cameraResolution) this.cameraResolution = saved.cameraResolution as any;
		if (saved.framingMode) this.framingMode = saved.framingMode as any;
		if (saved.isSquareFrameActive !== undefined) this.isSquareFrameActive = saved.isSquareFrameActive;
		if (saved.squareFrameFade !== undefined) this.squareFrameFade = saved.squareFrameFade;
		if (saved.squareFrameSize !== undefined) this.squareFrameSize = saved.squareFrameSize;
		if (saved.hiddenPartIds) this.hiddenPartIds = saved.hiddenPartIds;
		if (saved.riggingWindowX !== undefined) this.riggingWindowX = saved.riggingWindowX;
		if (saved.riggingWindowY !== undefined) this.riggingWindowY = saved.riggingWindowY;
		if (saved.riggingWindowWidth !== undefined) this.riggingWindowWidth = saved.riggingWindowWidth;
		if (saved.riggingWindowHeight !== undefined) this.riggingWindowHeight = saved.riggingWindowHeight;
		if (saved.isMicActive !== undefined) this.isMicActive = saved.isMicActive;
		if (saved.isMicMonitorActive !== undefined) this.isMicMonitorActive = saved.isMicMonitorActive;
		if (saved.audioDeviceId !== undefined) this.audioDeviceId = saved.audioDeviceId;
		if (saved.micGain !== undefined) this.micGain = saved.micGain;
		if (saved.voiceFilter) this.voiceFilter = saved.voiceFilter as any;
		if (saved.currentLocale) i18n.setLocale(saved.currentLocale as any);
	}

	toggleGuiLock(locked?: boolean) {
		this.isGuiLocked = locked !== undefined ? locked : !this.isGuiLocked;
		if (this.isGuiLocked) {
			this.isDrawerOpen = false;
			this.isThemeModalOpen = false;
			this.isModelModalOpen = false;
			this.isObsModalOpen = false;
			this.isSettingsModalOpen = false;
			this.isShortcutModalOpen = false;
			this.showToast(i18n.t('gui_locked_toast'));
		} else {
			this.showToast(i18n.t('gui_unlocked_toast'));
		}
	}

	toggleObsMode(enable?: boolean) {
		const next = enable !== undefined ? enable : !this.isObsMode;
		if (next && !this.isObsMode) {
			this.previousBgStyle = this.backgroundStyle;
			this.backgroundStyle = this.obsBgType;
			this.isDrawerOpen = false;
			this.isThemeModalOpen = false;
			this.isModelModalOpen = false;
			this.isObsModalOpen = false;
			this.isSettingsModalOpen = false;
			this.isShortcutModalOpen = false;
		} else if (!next && this.isObsMode) {
			this.backgroundStyle = this.previousBgStyle;
		}
		this.isObsMode = next;
	}

	toggleDock(hide?: boolean) {
		this.isDockHidden = hide !== undefined ? hide : !this.isDockHidden;
		this.showToast(this.isDockHidden ? 'Menu Dock disembunyikan (Tekan H untuk menampilkan)' : 'Menu Dock ditampilkan');
	}

	toggleShortcutModal(open?: boolean) {
		this.isShortcutModalOpen = open !== undefined ? open : !this.isShortcutModalOpen;
	}

	resetAvatarTransform() {
		this.resetTransformSignal = performance.now();
		this.showToast('Posisi & skala avatar di-reset ke tengah');
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
		this.persist();
	}

	resetCalibration() {
		this.calibrationYaw = 0;
		this.calibrationPitch = 0;
		this.calibrationRoll = 0;
		this.persist();
	}

	setModel(id: string, name: string, url: string) {
		this.selectedModelId = id;
		this.modelName = name;
		this.modelUrl = url;
		this.persist();
	}

	setUITheme(theme: UITheme) {
		this.uiTheme = theme;
		const found = UI_THEMES.find((t) => t.id === theme);
		if (found) {
			this.backgroundColor = found.bgHex;
		} else {
			this.backgroundColor = '#09090b';
		}
		this.persist();
	}

	setFramingMode(mode: AvatarFramingMode) {
		this.framingMode = mode;
		this.persist();
	}

	toggleSquareFrame(enable?: boolean) {
		this.isSquareFrameActive = enable !== undefined ? enable : !this.isSquareFrameActive;
		this.persist();
	}

	togglePartVisibility(partId: string) {
		this.hiddenPartIds = {
			...this.hiddenPartIds,
			[partId]: !this.hiddenPartIds[partId]
		};
		this.persist();
	}

	setPartOpacity(partId: string, opacity: number) {
		this.hiddenPartIds = {
			...this.hiddenPartIds,
			[partId]: opacity <= 0
		};
		this.persist();
	}

	setVoiceFilter(filter: VoiceFilterType) {
		this.voiceFilter = filter;
		this.persist();
	}

	playMotion(name: string) {
		this.triggerMotionSignal = { name, timestamp: performance.now() };
	}
}

export const rigging = new RiggingStore();
