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
	ThemePalette,
	AccessoryItem,
	StageLayer
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
	{ id: 'ParamBrowLY', label: 'Brow Left Y (Tinggi Alis Kiri)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowRY', label: 'Brow Right Y (Tinggi Alis Kanan)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowLForm', label: 'Brow Left Form (Bentuk Alis Kiri)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowRForm', label: 'Brow Right Form (Bentuk Alis Kanan)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowLAngle', label: 'Brow Left Angle (Sudut Alis Kiri)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
	{ id: 'ParamBrowRAngle', label: 'Brow Right Angle (Sudut Alis Kanan)', min: -1, max: 1, defaultValue: 0, group: 'eyes' },
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
	isAboutModalOpen = $state<boolean>(false);
	isTosModalOpen = $state<boolean>(false);
	isLayerManagerOpen = $state<boolean>(false);
	isDockHidden = $state<boolean>(false);
	resetTransformSignal = $state<number>(0);
	isCameraActive = $state<boolean>(false);
	showCameraPip = $state<boolean>(true);
	showLandmarksMesh = $state<boolean>(true);
	cameraViewMode = $state<'wireframe' | 'rig' | 'raw'>('wireframe');
	enableHandTracking = $state<boolean>(false);
	showFpsCounter = $state<boolean>(true);

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
	mirrorEyes = $state<boolean>(true);         // VTuber mirror eye tracking (left-to-left)
	holdPoseOnLoss = $state<boolean>(true);     // hold pose on 1-frame drop & smooth decay
	invertPitch = $state<boolean>(false);       // Invert Y (menunduk / mendongak)
	invertYaw = $state<boolean>(false);         // Invert X (kiri / kanan)
	mouthSensitivity = $state<number>(1.2);     // 0.5 to 2.5 mouth responsiveness
	mouthTrackingMode = $state<'normal' | 'high'>('normal'); // 'normal' | 'high' (Speech boost)
	enableFaceTracking = $state<boolean>(true); // MediaPipe face tracking toggle (Live2D & 3D)
	enableBodyTracking = $state<boolean>(true); // Full body sway & torso kinematics toggle (Live2D & 3D)
	bodyTrackingIntensity = $state<number>(1.0); // 0.2 to 2.0 torso sway multiplier
	isSfxEnabled = $state<boolean>(true);       // UI sound effects toggle
	sfxVolume = $state<number>(0.6);            // UI sound effects volume (0.0 to 1.0)

	// Live2D Model Expressions
	availableExpressions = $state<Array<{ id: string; name: string; label: string }>>([]);
	activeExpression = $state<string>('');

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

	// Collab Mode System (Multi-Streamer: Host + Up to 2 Guests, Max 3 Streamers with Multi-Camera Selection)
	isCollabModeActive = $state<boolean>(false);
	collabModelId = $state<string>('haru');
	collabModelUrl = $state<string>('/models/haru/Haru.model3.json');
	collabModelName = $state<string>('Haru (Collab Partner 1)');
	collabCameraDeviceId = $state<string>('');
	collabCameraLabel = $state<string>('');
	collabPosition = $state<'left' | 'right' | 'pip'>('right');
	collabScale = $state<number>(0.85);
	collabOffsetX = $state<number>(280);
	collabOffsetY = $state<number>(0);
	collabOpacity = $state<number>(1.0);
	collabVisible = $state<boolean>(true);
	collabSyncTracking = $state<boolean>(true);

	// Collab Guest 2 (Streamer 3)
	isCollab2Active = $state<boolean>(false);
	collab2ModelId = $state<string>('mihari');
	collab2ModelUrl = $state<string>('/models/mihari/Mihari_V1.model3.json');
	collab2ModelName = $state<string>('Mihari (Collab Partner 2)');
	collab2CameraDeviceId = $state<string>('');
	collab2CameraLabel = $state<string>('');
	collab2Position = $state<'left' | 'right' | 'center' | 'pip'>('left');
	collab2Scale = $state<number>(0.85);
	collab2OffsetX = $state<number>(-280);
	collab2OffsetY = $state<number>(0);
	collab2Opacity = $state<number>(1.0);
	collab2Visible = $state<boolean>(true);
	collab2SyncTracking = $state<boolean>(true);

	// Accessories Attach System (Props & Items)
	activeAccessories = $state<AccessoryItem[]>([
		{ id: 'sunglasses', name: 'Kacamata Hitam Thug Life', category: 'face', icon: 'Glasses', emoji: '🕶️', visible: false, scale: 1.0, offsetX: 0, offsetY: -130, rotation: 0, opacity: 1.0 },
		{ id: 'cat-ears', name: 'Bando Telinga Kucing', category: 'head', icon: 'Smile', emoji: '🐱', visible: false, scale: 1.1, offsetX: 0, offsetY: -240, rotation: 0, opacity: 1.0 },
		{ id: 'headset', name: 'RGB Gaming Headset', category: 'head', icon: 'Headphones', emoji: '🎧', visible: false, scale: 1.15, offsetX: 0, offsetY: -150, rotation: 0, opacity: 1.0 },
		{ id: 'top-hat', name: 'Top Hat Pesulap', category: 'head', icon: 'Crown', emoji: '🎩', visible: false, scale: 1.2, offsetX: 0, offsetY: -290, rotation: 0, opacity: 1.0 },
		{ id: 'sakura-pin', name: 'Jepit Bunga Sakura', category: 'head', icon: 'Sparkles', emoji: '🌸', visible: false, scale: 0.9, offsetX: 110, offsetY: -210, rotation: 12, opacity: 1.0 },
		{ id: 'crown', name: 'Mahkota Emas Kerajaan', category: 'head', icon: 'Crown', emoji: '👑', visible: false, scale: 1.1, offsetX: 0, offsetY: -270, rotation: 0, opacity: 1.0 },
		{ id: 'studio-mic', name: 'Mikrofon Broadcast Studio', category: 'prop', icon: 'Mic', emoji: '🎤', visible: false, scale: 1.0, offsetX: 80, offsetY: 70, rotation: -10, opacity: 1.0 },
		{ id: 'mustache', name: 'Kumis Retro Gentleman', category: 'face', icon: 'Smile', emoji: '🥸', visible: false, scale: 0.85, offsetX: 0, offsetY: -40, rotation: 0, opacity: 1.0 },
		{ id: 'halo', name: 'Halo Cahaya Emas', category: 'head', icon: 'Sparkles', emoji: '😇', visible: false, scale: 1.1, offsetX: 0, offsetY: -310, rotation: 0, opacity: 1.0 },
		{ id: 'heart-aura', name: 'Floating Heart Aura', category: 'prop', icon: 'Heart', emoji: '💖', visible: false, scale: 1.0, offsetX: 120, offsetY: -160, rotation: 15, opacity: 0.9 },
		// Little Rose (小玫瑰) Animated Emoji & Meme Props
		{ id: 'rose-popcorn', name: 'Little Rose - Makan Popcorn', category: 'prop', icon: 'Sparkles', emoji: '🍿', visible: false, scale: 0.95, offsetX: 220, offsetY: 120, rotation: 0, opacity: 1.0, imageUrl: '/props/rose/rose_popcorn.gif', attachTo: 'screen' },
		{ id: 'rose-cheer', name: 'Little Rose - Lightstick Cheer', category: 'prop', icon: 'Sparkles', emoji: '✨', visible: false, scale: 0.9, offsetX: 180, offsetY: 60, rotation: 0, opacity: 1.0, imageUrl: '/props/rose/rose_cheer.gif', attachTo: 'body' },
		{ id: 'rose-love', name: 'Little Rose - Floating Love', category: 'prop', icon: 'Heart', emoji: '💖', visible: false, scale: 0.85, offsetX: 120, offsetY: -180, rotation: 0, opacity: 1.0, imageUrl: '/props/rose/rose_love.gif', attachTo: 'head' },
		{ id: 'rose-cool', name: 'Little Rose - Keren Kacamata', category: 'prop', icon: 'Glasses', emoji: '😎', visible: false, scale: 0.95, offsetX: -200, offsetY: 100, rotation: 0, opacity: 1.0, imageUrl: '/props/rose/rose_cool.gif', attachTo: 'screen' },
		{ id: 'rose-ghost', name: 'Little Rose - Hantu Melayang', category: 'prop', icon: 'Sparkles', emoji: '👻', visible: false, scale: 0.85, offsetX: -130, offsetY: -200, rotation: 0, opacity: 0.9, imageUrl: '/props/rose/rose_ghost.gif', attachTo: 'head' },
		{ id: 'rose-bonk', name: 'Little Rose - Kena Pukul (Bonk)', category: 'prop', icon: 'Smile', emoji: '💥', visible: false, scale: 0.9, offsetX: 90, offsetY: -150, rotation: 0, opacity: 1.0, imageUrl: '/props/rose/rose_bonk.gif', attachTo: 'head' },
		{ id: 'rose-derp', name: 'Little Rose - Bengong (Derp)', category: 'prop', icon: 'Smile', emoji: '😶', visible: false, scale: 0.85, offsetX: 0, offsetY: -240, rotation: 0, opacity: 1.0, imageUrl: '/props/rose/rose_derp.gif', attachTo: 'head' },
		{ id: 'rose-lol', name: 'Little Rose - Ketawa Ngakak', category: 'prop', icon: 'Smile', emoji: '🤣', visible: false, scale: 0.95, offsetX: 0, offsetY: 150, rotation: 0, opacity: 1.0, imageUrl: '/props/rose/rose_lol.gif', attachTo: 'screen' }
	]);

	// Photoshop Layer Manager Stacking Order (Top to bottom)
	stageLayers = $state<StageLayer[]>([
		{ id: 'layer-shader', name: 'Efek & Filter Layar (Shader FX)', type: 'shader-fx', visible: true, opacity: 1.0, locked: false, badge: 'Shader FX', description: 'Vignette, Scanlines, CRT Monitor Shader' },
		{ id: 'layer-accessories', name: 'Aksesoris & Props Avatar', type: 'accessories', visible: true, opacity: 1.0, locked: false, badge: 'Props', description: 'Kacamata, Headset, Telinga Kucing, Mic' },
		{ id: 'layer-collab', name: 'Avatar Collab (Partner Guest)', type: 'model-collab', visible: true, opacity: 1.0, locked: false, badge: 'Collab', description: 'Avatar tamu / streamer partner di panggung' },
		{ id: 'layer-host', name: 'Avatar Utama (Host)', type: 'model-host', visible: true, opacity: 1.0, locked: false, badge: 'Host Avatar', description: 'Live2D / 3D model utama yang dilacak webcam' },
		{ id: 'layer-background', name: 'Latar Belakang Panggung', type: 'background', visible: true, opacity: 1.0, locked: false, badge: 'Background', description: 'Solid, Mesh Grid, Blueprint, Wallpaper' }
	]);

	// Layer Manager Floating & Windowed Geometry (Sticky vs Windowed Card)
	layerManagerViewMode = $state<'windowed' | 'sticky'>('windowed');
	layerWindowX = $state<number>(24);
	layerWindowY = $state<number>(72);
	layerWindowWidth = $state<number>(440);
	layerWindowHeight = $state<number>(580);
	isLayerMinimized = $state<boolean>(false);
	selectedLayerElementId = $state<string | null>('host'); // 'host' | 'collab' | accessory id

	// Interactive Canvas Cursor / Tool Mode ('pan' | 'select-layer' | 'hand-tracking')
	cursorToolMode = $state<'pan' | 'select-layer' | 'hand-tracking'>('pan');

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
	customThemeConfig = $state<{ bg: string; surface: string; accent: string; border: string; text: string }>({
		bg: '#18181b',
		surface: '#27272a',
		accent: '#06b6d4',
		border: '#3f3f46',
		text: '#f4f4f5'
	});
	backgroundStyle = $state<BackgroundStyle>('solid');
	backgroundColor = $state<string>('#09090b'); // Custom hex
	screenEffect = $state<ScreenEffect>('none');
	customBgUrl = $state<string | null>(null);

	// Zoom Controls System
	zoomLevel = $state<number>(1.0); // 1.0 = 100%
	zoomSignal = $state<{ type: 'in' | 'out' | 'reset' | 'set'; value?: number; timestamp: number } | null>(null);

	// Avatar Engine: Live2D vs 3D
	avatarEngine = $state<'live2d' | '3d'>('live2d');
	selected3DModelId = $state<string>('mochi-cat');
	is3DAutoSpin = $state<boolean>(false);
	customGlbUrl = $state<string | null>(null);
	stageEnvironment = $state<'grid' | 'room' | 'field' | 'void'>('grid');

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
			stageEnvironment: this.stageEnvironment,
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
			enableFaceTracking: this.enableFaceTracking,
			enableBodyTracking: this.enableBodyTracking,
			bodyTrackingIntensity: this.bodyTrackingIntensity,
			enableHandTracking: this.enableHandTracking,
			showCameraPip: this.showCameraPip,
			showLandmarksMesh: this.showLandmarksMesh,
			cameraViewMode: this.cameraViewMode,
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
			customThemeConfig: this.customThemeConfig,
			zoomLevel: this.zoomLevel,
			mouthSensitivity: this.mouthSensitivity,
			mouthTrackingMode: this.mouthTrackingMode,
			isSfxEnabled: this.isSfxEnabled,
			sfxVolume: this.sfxVolume,
			mirrorEyes: this.mirrorEyes,
			showFpsCounter: this.showFpsCounter,
			layerManagerViewMode: this.layerManagerViewMode,
			layerWindowX: this.layerWindowX,
			layerWindowY: this.layerWindowY,
			cursorToolMode: this.cursorToolMode,
			stageLayers: this.stageLayers.map((l) => ({
				id: l.id,
				visible: l.visible,
				opacity: l.opacity,
				locked: l.locked
			})),
			currentLocale: i18n.currentLocale
		});
	}

	loadFromStorage() {
		const saved = loadPreferences();
		if (!saved) return;
		if (saved.avatarEngine) this.avatarEngine = saved.avatarEngine;
		if (saved.selected3DModelId) this.selected3DModelId = saved.selected3DModelId;
		if (saved.stageEnvironment) this.stageEnvironment = saved.stageEnvironment as any;
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
		if (saved.enableFaceTracking !== undefined) this.enableFaceTracking = saved.enableFaceTracking;
		if (saved.enableBodyTracking !== undefined) this.enableBodyTracking = saved.enableBodyTracking;
		if (saved.bodyTrackingIntensity !== undefined) this.bodyTrackingIntensity = saved.bodyTrackingIntensity;
		if (saved.enableHandTracking !== undefined) this.enableHandTracking = saved.enableHandTracking;
		if (saved.showCameraPip !== undefined) this.showCameraPip = saved.showCameraPip;
		if (saved.showLandmarksMesh !== undefined) this.showLandmarksMesh = saved.showLandmarksMesh;
		if (saved.cameraViewMode) this.cameraViewMode = saved.cameraViewMode;
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
		if (saved.customThemeConfig) this.customThemeConfig = saved.customThemeConfig;
		if (saved.zoomLevel !== undefined) this.zoomLevel = saved.zoomLevel;
		if (saved.mouthSensitivity !== undefined) this.mouthSensitivity = saved.mouthSensitivity;
		if (saved.mouthTrackingMode) this.mouthTrackingMode = saved.mouthTrackingMode;
		if (saved.isSfxEnabled !== undefined) this.isSfxEnabled = saved.isSfxEnabled;
		if (saved.sfxVolume !== undefined) this.sfxVolume = saved.sfxVolume;
		if (saved.mirrorEyes !== undefined) this.mirrorEyes = saved.mirrorEyes;
		if (saved.showFpsCounter !== undefined) this.showFpsCounter = saved.showFpsCounter;
		if (saved.layerManagerViewMode) this.layerManagerViewMode = saved.layerManagerViewMode as any;
		if (saved.layerWindowX !== undefined) this.layerWindowX = saved.layerWindowX;
		if (saved.layerWindowY !== undefined) this.layerWindowY = saved.layerWindowY;
		if (saved.cursorToolMode) this.cursorToolMode = saved.cursorToolMode as any;
		if (Array.isArray(saved.stageLayers)) {
			for (const savedL of saved.stageLayers) {
				const target = this.stageLayers.find((l) => l.id === savedL.id);
				if (target) {
					if (typeof savedL.visible === 'boolean') target.visible = savedL.visible;
					if (typeof savedL.opacity === 'number') target.opacity = savedL.opacity;
					if (typeof savedL.locked === 'boolean') target.locked = savedL.locked;
				}
			}
		}
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
			this.isAboutModalOpen = false;
			this.isTosModalOpen = false;
			this.showToast(i18n.t('gui_locked_toast'));
		} else {
			this.showToast(i18n.t('gui_unlocked_toast'));
		}
	}

	toggleAboutModal(open?: boolean) {
		this.isAboutModalOpen = open !== undefined ? open : !this.isAboutModalOpen;
		if (this.isAboutModalOpen) {
			this.isTosModalOpen = false;
			this.isSettingsModalOpen = false;
		}
	}

	toggleTosModal(open?: boolean) {
		this.isTosModalOpen = open !== undefined ? open : !this.isTosModalOpen;
		if (this.isTosModalOpen) {
			this.isAboutModalOpen = false;
			this.isSettingsModalOpen = false;
		}
	}

	setMouthTrackingMode(mode: 'normal' | 'high') {
		this.mouthTrackingMode = mode;
		this.persist();
	}

	setMouthSensitivity(val: number) {
		this.mouthSensitivity = Math.max(0.5, Math.min(2.5, val));
		this.persist();
	}

	setSfxEnabled(enabled: boolean) {
		this.isSfxEnabled = enabled;
		this.persist();
	}

	setSfxVolume(vol: number) {
		this.sfxVolume = Math.max(0.0, Math.min(1.0, vol));
		this.persist();
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
		const hostLayer = this.stageLayers.find((l) => l.type === 'model-host');
		if (hostLayer?.locked) {
			this.showToast('🔒 Layer Avatar Utama sedang terkunci');
			return;
		}
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

	setStageEnvironment(env: 'grid' | 'room' | 'field' | 'void') {
		this.stageEnvironment = env;
		this.persist();
	}

	setUITheme(theme: UITheme) {
		this.uiTheme = theme;
		if (theme === 'custom') {
			this.backgroundColor = this.customThemeConfig.bg;
		} else {
			const found = UI_THEMES.find((t) => t.id === theme);
			if (found) {
				this.backgroundColor = found.bgHex;
			} else {
				this.backgroundColor = '#09090b';
			}
		}
		this.persist();
	}

	setCustomThemeColors(config: Partial<{ bg: string; surface: string; accent: string; border: string; text: string }>) {
		this.customThemeConfig = {
			...this.customThemeConfig,
			...config
		};
		if (this.uiTheme === 'custom') {
			this.backgroundColor = this.customThemeConfig.bg;
		}
		this.persist();
	}

	zoomIn() {
		this.zoomSignal = { type: 'in', timestamp: performance.now() };
	}

	zoomOut() {
		this.zoomSignal = { type: 'out', timestamp: performance.now() };
	}

	resetZoom() {
		this.zoomLevel = 1.0;
		this.zoomSignal = { type: 'reset', timestamp: performance.now() };
	}

	setZoom(level: number) {
		this.zoomLevel = Math.max(0.1, Math.min(3.0, level));
		this.zoomSignal = { type: 'set', value: this.zoomLevel, timestamp: performance.now() };
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

	cycleCameraViewMode(): 'wireframe' | 'rig' | 'raw' {
		if (this.cameraViewMode === 'wireframe') {
			this.cameraViewMode = 'rig';
			this.showToast('📹 Mode Kamera: Webcam + Rig Overlay');
		} else if (this.cameraViewMode === 'rig') {
			this.cameraViewMode = 'raw';
			this.showToast('📷 Mode Kamera: Raw Webcam Bersih');
		} else {
			this.cameraViewMode = 'wireframe';
			this.showToast('🕸️ Mode Kamera: 3D Face Wireframe (Kalidoface)');
		}
		this.persist();
		return this.cameraViewMode;
	}

	playMotion(name: string) {
		this.triggerMotionSignal = { name, timestamp: performance.now() };
	}

	setExpression(name: string) {
		this.activeExpression = name;
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('mirunova:set-expression', { detail: { name } }));
		}
	}

	toggleLayerManager(open?: boolean) {
		this.isLayerManagerOpen = open !== undefined ? open : !this.isLayerManagerOpen;
	}

	toggleCollabMode(enable?: boolean) {
		this.isCollabModeActive = enable !== undefined ? enable : !this.isCollabModeActive;
		this.showToast(this.isCollabModeActive ? '✓ Collab Guest 1 Aktif' : 'Collab Guest 1 Dinonaktifkan');
		this.syncCollabLayers();
		this.persist();
	}

	toggleCollab2Mode(enable?: boolean) {
		this.isCollab2Active = enable !== undefined ? enable : !this.isCollab2Active;
		this.showToast(this.isCollab2Active ? '✓ Collab Guest 2 Aktif (Max 3 Streamers)' : 'Collab Guest 2 Dinonaktifkan');
		this.syncCollabLayers();
		this.persist();
	}

	setCollabModel(id: string, name: string, url: string) {
		this.collabModelId = id;
		this.collabModelName = name;
		this.collabModelUrl = url;
		this.persist();
	}

	setCollab2Model(id: string, name: string, url: string) {
		this.collab2ModelId = id;
		this.collab2ModelName = name;
		this.collab2ModelUrl = url;
		this.persist();
	}

	setCollabCamera(participant: 'host' | 'guest1' | 'guest2', deviceId: string, label: string) {
		if (participant === 'host') {
			this.cameraDeviceId = deviceId;
			this.activeCameraLabel = label;
		} else if (participant === 'guest1') {
			this.collabCameraDeviceId = deviceId;
			this.collabCameraLabel = label;
		} else if (participant === 'guest2') {
			this.collab2CameraDeviceId = deviceId;
			this.collab2CameraLabel = label;
		}
		const title = participant === 'host' ? 'Host' : participant === 'guest1' ? 'Guest 1' : 'Guest 2';
		this.showToast(`Kamera ${title}: ${label || 'Default'}`);
		this.persist();
	}

	syncCollabLayers() {
		const hasCollab2 = this.stageLayers.some((l) => l.id === 'layer-collab-2' || l.type === 'model-collab-2');
		if (this.isCollab2Active && !hasCollab2) {
			const collabIdx = this.stageLayers.findIndex((l) => l.id === 'layer-collab' || l.type === 'model-collab');
			const insertIdx = collabIdx !== -1 ? collabIdx + 1 : 1;
			this.stageLayers.splice(insertIdx, 0, {
				id: 'layer-collab-2',
				name: 'Avatar Collab (Guest 2)',
				type: 'model-collab-2',
				visible: true,
				opacity: 1.0,
				locked: false,
				badge: 'Guest 2',
				description: 'Avatar tamu kedua di panggung (Max 3 Streamers)'
			});
			this.stageLayers = [...this.stageLayers];
		}
	}

	toggleAccessory(id: string) {
		const acc = this.activeAccessories.find((a) => a.id === id);
		if (acc) {
			acc.visible = !acc.visible;
			this.persist();
		}
	}

	removeAccessory(id: string) {
		const acc = this.activeAccessories.find((a) => a.id === id);
		if (acc) {
			acc.visible = false;
			this.showToast(`Copot aksesoris: ${acc.name}`);
			this.persist();
		}
	}

	updateAccessory(id: string, partial: Partial<AccessoryItem>) {
		const acc = this.activeAccessories.find((a) => a.id === id);
		if (acc) {
			Object.assign(acc, partial);
			this.activeAccessories = [...this.activeAccessories];
			this.persist();
		}
	}

	addCustomAccessory(name: string, imageUrl: string, attachTo: AccessoryItem['attachTo'] = 'head') {
		const newId = `custom-prop-${Date.now()}`;
		const newProp: AccessoryItem = {
			id: newId,
			name: name || 'Custom Prop',
			category: 'prop',
			icon: 'Sparkles',
			emoji: '🖼️',
			visible: true,
			scale: 1.0,
			offsetX: 0,
			offsetY: attachTo === 'head' ? -180 : 0,
			rotation: 0,
			opacity: 1.0,
			imageUrl,
			attachTo
		};
		this.activeAccessories = [newProp, ...this.activeAccessories];
		this.setCursorToolMode('select-layer');
		this.selectLayerElement(newId);
		this.showToast(`✓ Prop "${newProp.name}" berhasil dipasang!`);
		this.persist();
	}

	setAccessoryAttachTo(id: string, attachTo: AccessoryItem['attachTo']) {
		const acc = this.activeAccessories.find((a) => a.id === id);
		if (acc) {
			acc.attachTo = attachTo;
			this.activeAccessories = [...this.activeAccessories];
			this.persist();
		}
	}

	deleteLayer(layerId: string) {
		const layer = this.stageLayers.find((l) => l.id === layerId);
		if (!layer) return;

		if (layer.type === 'accessories') {
			this.activeAccessories.forEach((a) => (a.visible = false));
			this.showToast('Semua aksesoris & props telah dicopot');
		} else if (layer.type === 'model-collab') {
			this.isCollabModeActive = false;
			this.showToast('Collab Guest 1 dicopot dari panggung');
		} else if (layer.type === 'model-collab-2') {
			this.isCollab2Active = false;
			this.stageLayers = this.stageLayers.filter((l) => l.id !== 'layer-collab-2');
			this.showToast('Collab Guest 2 dicopot dari panggung');
		} else if (layer.type === 'shader-fx') {
			this.screenEffect = 'none';
			this.showToast('Filter Layar (Shader) dinonaktifkan');
		} else if (layer.type === 'background') {
			this.backgroundStyle = 'transparent';
			this.showToast('Background diubah ke Transparan (Alpha)');
		} else if (layer.type === 'model-host') {
			this.toggleLayer(layerId);
		}
		this.stageLayers = [...this.stageLayers];
		this.persist();
	}

	toggleLayer(layerId: string) {
		const layer = this.stageLayers.find((l) => l.id === layerId);
		if (layer) {
			layer.visible = !layer.visible;
			if (layer.type === 'model-collab') this.collabVisible = layer.visible;
			if (layer.type === 'model-collab-2') this.collab2Visible = layer.visible;
			this.stageLayers = [...this.stageLayers];
			this.showToast(`${layer.visible ? '👁️ Menampilkan' : '🙈 Menyembunyikan'} layer: ${layer.name}`);
			this.persist();
		}
	}

	setLayerOpacity(layerId: string, opacity: number) {
		const layer = this.stageLayers.find((l) => l.id === layerId);
		if (layer) {
			layer.opacity = Math.max(0, Math.min(1, opacity));
			if (layer.type === 'model-collab') this.collabOpacity = layer.opacity;
			if (layer.type === 'model-collab-2') this.collab2Opacity = layer.opacity;
			this.stageLayers = [...this.stageLayers];
			this.persist();
		}
	}

	setLayerLock(layerId: string, locked?: boolean) {
		const layer = this.stageLayers.find((l) => l.id === layerId);
		if (layer) {
			layer.locked = locked !== undefined ? locked : !layer.locked;
			this.stageLayers = [...this.stageLayers];
			this.showToast(`${layer.locked ? '🔒 Mengunci' : '🔓 Membuka kunci'} layer: ${layer.name}`);
			this.persist();
		}
	}

	moveLayer(layerId: string, direction: 'up' | 'down') {
		const index = this.stageLayers.findIndex((l) => l.id === layerId);
		if (index === -1) return;
		const targetIdx = direction === 'up' ? index - 1 : index + 1;
		if (targetIdx < 0 || targetIdx >= this.stageLayers.length) return;
		const item = this.stageLayers.splice(index, 1)[0];
		this.stageLayers.splice(targetIdx, 0, item);
		this.stageLayers = [...this.stageLayers];
		this.persist();
	}

	reorderLayers(fromIndex: number, toIndex: number) {
		if (fromIndex < 0 || fromIndex >= this.stageLayers.length) return;
		if (toIndex < 0 || toIndex >= this.stageLayers.length) return;
		const item = this.stageLayers.splice(fromIndex, 1)[0];
		this.stageLayers.splice(toIndex, 0, item);
		this.stageLayers = [...this.stageLayers];
		this.persist();
	}

	setCursorToolMode(mode: 'pan' | 'select-layer' | 'hand-tracking') {
		this.cursorToolMode = mode;
		this.enableHandTracking = mode === 'hand-tracking';
		const modeLabels: Record<string, string> = {
			'pan': 'Mode Pan: Geser & Zoom Avatar di Panggung',
			'select-layer': 'Mode Layer Move: Klik & Drag Elemen/Props Bebas di Panggung',
			'hand-tracking': 'Mode Hand Tracking: Deteksi Gerakan Tangan MediaPipe'
		};
		this.showToast(modeLabels[mode] || mode);
		this.persist();
	}

	selectLayerElement(id: string | null) {
		this.selectedLayerElementId = id;
	}

	toggleLayerManagerViewMode() {
		this.layerManagerViewMode = this.layerManagerViewMode === 'windowed' ? 'sticky' : 'windowed';
		this.persist();
	}
}

export const rigging = new RiggingStore();
