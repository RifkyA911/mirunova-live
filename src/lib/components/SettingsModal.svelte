<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging, UI_THEMES } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { voice, VOICE_MODELS } from '#lib/core/audio';
	import { i18n, type Locale } from '#lib/i18n/index.svelte';
	import { detectHardwareBenchmark, type HardwareReport } from '#lib/core/hardware';
	import { clearPreferences, exportConfigJson, importConfigJson } from '#lib/core/storage';
	import { MODEL_CATALOG } from '#lib/data/models';
	import type { UITheme, AvatarFramingMode, VoiceFilterType, BackgroundStyle } from '#lib/types/tracking';
	import {
		Users,
		Smile,
		Tv,
		Settings,
		X,
		Cpu,
		Palette,
		SlidersHorizontal,
		Database,
		Check,
		Download,
		Upload,
		RotateCcw,
		Sparkles,
		Camera,
		Languages,
		Activity,
		Video,
		Mic,
		MicOff,
		Volume2,
		VolumeX,
		Info,
		ShieldCheck,
		Layers,
		Square,
		ExternalLink,
		HelpCircle,
		RefreshCw,
		Sun,
		Moon,
		Wand2,
		Play,
		Square as StopSquare,
		Volume1,
		Bell,
		Keyboard,
		Box,
		Navigation,
		ChevronLeft,
		ChevronRight,
		ChevronUp,
		ChevronDown,
		Crosshair
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';
	import { threeStage, type StageAreaWaypoint, type FullBodyPose3D } from '#lib/core/threeStage';

	let activeTab = $state<'perf' | 'tracking' | 'voice' | 'theme' | 'stage' | 'storage' | 'about'>('perf');
	let trackingParticipant = $state<'host' | 'guest1' | 'guest2'>('host');
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);
	let availableMics = $state<Array<{ deviceId: string; label: string }>>([]);
	let storageUsageBytes = $state<number>(0);
	let appearanceThemeCategory = $state<'all' | 'light' | 'dark' | 'custom'>('all');
	const allSelectableThemes = $derived(UI_THEMES.filter((t) => t.id !== 'custom'));
	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	// Interactive Mic & Voice Conversion Test states
	let isRecordingTest = $state<boolean>(false);
	let testRecordSeconds = $state<number>(0);
	let hasTestSample = $state<boolean>(false);
	let isPlayingTest = $state<boolean>(false);
	let testPlaybackMode = $state<'raw' | 'converted' | null>(null);
	let testTtsText = $state<string>('Halo halo! Tes suara anime kawaii.');

	// Dedicated Text-To-Speech (TTS) Studio state
	let ttsText = $state<string>('Halo halo! Selamat datang di live streaming MiruNova Live.');
	let ttsVoice = $state<string>('');
	let ttsPitch = $state<number>(1.2);
	let ttsRate = $state<number>(1.0);
	let isTtsSpeaking = $state<boolean>(false);
	let availableTtsVoices = $state<SpeechSynthesisVoice[]>([]);

	function loadTtsVoices() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			availableTtsVoices = window.speechSynthesis.getVoices();
			if (!ttsVoice && availableTtsVoices.length > 0) {
				const preferred = availableTtsVoices.find(
					(v) => v.lang.startsWith('id') || v.lang.startsWith('ja') || v.lang.startsWith('en')
				);
				ttsVoice = preferred ? preferred.name : availableTtsVoices[0].name;
			}
		}
	}

	function handleSpeakTts() {
		if (!ttsText.trim()) return;
		playSfx('click');
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(ttsText);
			const selected = availableTtsVoices.find((v) => v.name === ttsVoice);
			if (selected) utterance.voice = selected;
			utterance.pitch = ttsPitch;
			utterance.rate = ttsRate;
			utterance.onstart = () => { isTtsSpeaking = true; };
			utterance.onend = () => { isTtsSpeaking = false; };
			utterance.onerror = () => { isTtsSpeaking = false; };
			window.speechSynthesis.speak(utterance);
			rigging.showToast('🔊 Memutar Text-To-Speech Browser Utterance...');
		} else {
			voice.synthesizeVoiceText(ttsText, rigging.voiceFilter);
		}
	}

	function handleStopTts() {
		playSfx('click');
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
		}
		isTtsSpeaking = false;
	}

	function handleFormantSpeak(textToSpeak?: string) {
		const txt = textToSpeak || ttsText;
		playSfx('click');
		isTtsSpeaking = true;
		voice.synthesizeVoiceText(txt, rigging.voiceFilter, ttsVoice, () => {
			isTtsSpeaking = false;
		});
		rigging.showToast(`${i18n.t('settings_voice_playback')} (${i18n.t('presets')}: ${rigging.voiceFilter})`);
	}

	async function handleRecordSample() {
		if (isRecordingTest) return;
		isRecordingTest = true;
		testRecordSeconds = 4;
		hasTestSample = false;
		testPlaybackMode = null;
		playSfx('toggle');

		const ok = await voice.recordSample(rigging.audioDeviceId, 4, (remaining) => {
			testRecordSeconds = remaining;
		});

		isRecordingTest = false;
		hasTestSample = ok;
		if (ok) {
			playSfx('success');
			rigging.showToast('✓ ' + i18n.t('mic_record_done'));
		} else {
			rigging.showToast(i18n.t('settings_rec_sample_failed'));
		}
	}

	async function handlePlayRawSample() {
		if (!hasTestSample) return;
		playSfx('click');
		isPlayingTest = true;
		testPlaybackMode = 'raw';
		const played = await voice.playRawSample(() => {
			isPlayingTest = false;
			testPlaybackMode = null;
		});
		if (!played) {
			isPlayingTest = false;
			testPlaybackMode = null;
			rigging.showToast(i18n.t('settings_play_sample_failed'));
		}
	}

	async function handlePlayConvertedSample() {
		if (!hasTestSample) return;
		playSfx('click');
		isPlayingTest = true;
		testPlaybackMode = 'converted';

		if (rigging.voiceFilter === 'none') {
			rigging.setVoiceFilter('anime-girl');
			voice.setFilter('anime-girl');
			rigging.showToast(`${i18n.t('settings_voice_active')} Kawaii Anime Girl (+5 Semitones)`);
		}

		const played = await voice.playConvertedSample(() => {
			isPlayingTest = false;
			testPlaybackMode = null;
		}, rigging.voiceFilter);
		if (!played) {
			isPlayingTest = false;
			testPlaybackMode = null;
			rigging.showToast(i18n.t('settings_play_sample_failed'));
		}
	}

	function handleStopTestPlayback() {
		voice.stopPlayback();
		isPlayingTest = false;
		testPlaybackMode = null;
		playSfx('click');
	}

	async function handleTestByText() {
		if (isPlayingTest) return;
		isPlayingTest = true;
		testPlaybackMode = 'converted';
		hasTestSample = true;

		if (rigging.voiceFilter === 'none') {
			rigging.setVoiceFilter('anime-girl');
			voice.setFilter('anime-girl');
			rigging.showToast(`${i18n.t('settings_voice_active')} Kawaii Anime Girl (+5 Semitones)`);
		}

		playSfx('click');
		const played = await voice.synthesizeVoiceText(
			testTtsText,
			rigging.voiceFilter,
			ttsVoice,
			() => {
				isPlayingTest = false;
				testPlaybackMode = null;
			}
		);
		if (!played) {
			isPlayingTest = false;
			testPlaybackMode = null;
			rigging.showToast(i18n.t('settings_tts_failed'));
		} else {
			rigging.showToast(i18n.t('settings_voice_test_done'));
		}
	}

	// Group themes by category
	const lightThemes = $derived(
		UI_THEMES.filter((t) => ['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(t.id))
	);
	const darkThemes = $derived(
		UI_THEMES.filter(
			(t) =>
				!['light', 'light-cyan-sea', 'sakura-light', 'matcha-light', 'custom'].includes(t.id)
		)
	);

	const customPresets = [
		{
			name: '🌸 Sakura Bloom',
			bg: '#fff5f8',
			surface: '#ffffff',
			accent: '#FA7FC2',
			border: '#F5B7CE',
			text: '#4a044e'
		},
		{
			name: '🍵 Matcha Zen',
			bg: '#f0fdf4',
			surface: '#ffffff',
			accent: '#16a34a',
			border: '#bbf7d0',
			text: '#14532d'
		},
		{
			name: '⚡ Cyber Neon',
			bg: '#09090b',
			surface: '#13111c',
			accent: '#00f0ff',
			border: '#7000ff',
			text: '#f1f5f9'
		},
		{
			name: '🌌 Cosmic Violet',
			bg: '#0d0714',
			surface: '#190f28',
			accent: '#a855f7',
			border: '#6b21a8',
			text: '#faf5ff'
		},
		{
			name: '🍊 Sunset Amber',
			bg: '#1c0f0a',
			surface: '#291811',
			accent: '#f97316',
			border: '#ea580c',
			text: '#fff7ed'
		},
		{
			name: '💎 Arctic Ice',
			bg: '#0f172a',
			surface: '#1e293b',
			accent: '#38bdf8',
			border: '#0ea5e9',
			text: '#f0f9ff'
		}
	];

	function applyCustomPreset(preset: (typeof customPresets)[0]) {
		rigging.setCustomThemeColors({
			bg: preset.bg,
			surface: preset.surface,
			accent: preset.accent,
			border: preset.border,
			text: preset.text
		});
		rigging.setUITheme('custom');
	}

	// Reactive live hardware report directly updated by tracking FPS
	let hardware = $derived<HardwareReport>(detectHardwareBenchmark(rigging.fps || 60));

	const themes: Array<{ id: UITheme; label: string; desc: string; color: string }> = [
		{ id: 'cyber-dark', label: 'Cyber Dark', desc: 'Futuristic cyan & violet accents with deep zinc background', color: 'bg-cyan-500' },
		{ id: 'midnight', label: 'Midnight Blue', desc: 'Deep oceanic navy tone for calm streaming environment', color: 'bg-indigo-500' },
		{ id: 'synthwave', label: 'Synthwave', desc: 'Vibrant sunset pink and neon magenta energy', color: 'bg-pink-500' },
		{ id: 'monochrome', label: 'Monochrome Minimal', desc: 'Clean, distraction-free neutral slate & silver', color: 'bg-zinc-400' }
	];

	const languages = $derived<Array<{ code: Locale; label: string }>>([
		{ code: 'id', label: i18n.t('lang_id') },
		{ code: 'en', label: i18n.t('lang_en') },
		{ code: 'ja', label: i18n.t('lang_ja') }
	]);

	const backgroundStyleCards = $derived<
		Array<{
			id: BackgroundStyle;
			label: string;
			desc: string;
			previewClass: string;
		}>
	>([
		{
			id: 'solid',
			label: i18n.t('bg_solid_title'),
			desc: i18n.t('bg_solid_desc'),
			previewClass: 'border-zinc-700'
		},
		{
			id: 'mesh',
			label: i18n.t('bg_mesh_title'),
			desc: i18n.t('bg_mesh_desc'),
			previewClass:
				'bg-zinc-950 bg-[linear-gradient(to_right,#06b6d433_1px,transparent_1px),linear-gradient(to_bottom,#06b6d433_1px,transparent_1px)] bg-[size:14px_14px]'
		},
		{
			id: 'grid',
			label: i18n.t('bg_grid_title'),
			desc: i18n.t('bg_grid_desc'),
			previewClass:
				'bg-zinc-900 bg-[linear-gradient(to_right,#3f3f4640_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4640_1px,transparent_1px)] bg-[size:10px_10px]'
		},
		{
			id: 'dots',
			label: i18n.t('bg_dots_title'),
			desc: i18n.t('bg_dots_desc'),
			previewClass:
				'bg-zinc-950 bg-[radial-gradient(#38bdf840_1.5px,transparent_1.5px)] bg-[size:10px_10px]'
		},
		{
			id: 'cosmic',
			label: i18n.t('bg_cosmic_title'),
			desc: i18n.t('bg_cosmic_desc'),
			previewClass: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950'
		},
		{
			id: 'transparent',
			label: i18n.t('bg_transparent_title'),
			desc: i18n.t('bg_transparent_desc'),
			previewClass:
				'bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[size:12px_12px]'
		},
		{
			id: 'chroma',
			label: i18n.t('bg_chroma_title'),
			desc: i18n.t('bg_chroma_desc'),
			previewClass: 'bg-[#00FF00]'
		},
		{
			id: 'custom-image',
			label: i18n.t('bg_custom_title'),
			desc: i18n.t('bg_custom_desc'),
			previewClass: 'bg-gradient-to-r from-violet-900 to-indigo-900'
		}
	]);

	let stageWallpaperInput = $state<HTMLInputElement>();

	function handleStageWallpaperUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		rigging.customBgUrl = url;
		rigging.backgroundStyle = 'custom-image';
		rigging.persist();
		rigging.showToast(`✓ ${i18n.t('wallpaper_applied_toast')} ${file.name}`);
	}

	async function refreshDevices(requestPermission = false) {
		try {
			availableCameras = await tracker.getAvailableVideoDevices(requestPermission);
			if (availableCameras.length > 0) {
				const hasCurrent = availableCameras.some((c) => c.deviceId === rigging.cameraDeviceId);
				const integrated = availableCameras.find((c) => /integrated|internal|built-in/i.test(c.label));
				// Prioritize physical integrated laptop camera if current selection is missing or empty
				if (!hasCurrent || !rigging.cameraDeviceId) {
					if (integrated) {
						rigging.cameraDeviceId = integrated.deviceId;
						rigging.activeCameraLabel = integrated.label;
						rigging.persist();
					}
				}
			}
		} catch {
			availableCameras = [];
		}
		try {
			availableMics = await voice.getAudioInputDevices(requestPermission);
		} catch {
			availableMics = [];
		}
		if (typeof window !== 'undefined' && window.localStorage) {
			storageUsageBytes = new Blob([JSON.stringify(window.localStorage)]).size;
		}
		if (requestPermission) {
			rigging.showToast('✓ ' + i18n.t('refresh_devices'));
		}
	}

	function formatCameraBadge(label: string): string {
		if (/integrated|internal|built-in/i.test(label)) {
			return `📸 ${label} (Hardware Laptop Lenovo)`;
		}
		if (/iriun|poco/i.test(label)) {
			return `📱 ${label} (HP Poco F7 / Virtual)`;
		}
		if (/nizima/i.test(label)) {
			return `🎭 ${label} (nizima LIVE Virtual)`;
		}
		if (/droidcam|obs|virtual/i.test(label)) {
			return `📡 ${label} (Virtual Driver)`;
		}
		return `📷 ${label}`;
	}

	onMount(() => {
		refreshDevices(false);
		loadTtsVoices();
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.onvoiceschanged = () => loadTtsVoices();
		}

		const onDeviceChange = () => {
			refreshDevices(false);
		};
		if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
			navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && rigging.isSettingsModalOpen) {
				rigging.isSettingsModalOpen = false;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
				navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
			}
		};
	});

	async function toggleMicrophone() {
		rigging.isMicActive = !rigging.isMicActive;
		if (rigging.isMicActive) {
			const ok = await voice.start(rigging.audioDeviceId, (vol) => {
				rigging.micVolumeLevel = vol;
			});
			if (ok) {
				voice.setGain(rigging.micGain);
				voice.setMonitor(rigging.isMicMonitorActive);
				voice.setFilter(rigging.voiceFilter);
				rigging.showToast('✓ ' + i18n.t('mic_active'));
			} else {
				rigging.isMicActive = false;
				rigging.showToast(i18n.t('mic_access_failed'));
			}
		} else {
			voice.stop();
			rigging.micVolumeLevel = 0;
			rigging.showToast(i18n.t('mic_muted'));
		}
		rigging.persist();
	}

	async function handleCameraDeviceChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		rigging.cameraDeviceId = target.value;
		rigging.persist();
		if (rigging.isCameraActive) {
			await tracker.switchCamera(rigging.cameraDeviceId);
		}
	}

	async function handleResolutionChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		rigging.cameraResolution = target.value as '1080p' | '720p' | '480p';
		rigging.persist();
		if (rigging.isCameraActive) {
			await tracker.switchCamera(undefined, rigging.cameraResolution);
		}
	}

	async function handleMicDeviceChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		rigging.audioDeviceId = target.value;
		rigging.persist();
		if (rigging.isMicActive) {
			await voice.switchDevice(rigging.audioDeviceId);
			voice.setGain(rigging.micGain);
			voice.setMonitor(rigging.isMicMonitorActive);
			voice.setFilter(rigging.voiceFilter);
			rigging.showToast('✓ ' + i18n.t('mic_switched'));
		}
	}

	function handleMicGainChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseFloat(target.value);
		rigging.micGain = val;
		voice.setGain(val);
		rigging.persist();
	}

	function toggleMicMonitor() {
		rigging.isMicMonitorActive = !rigging.isMicMonitorActive;
		voice.setMonitor(rigging.isMicMonitorActive);
		rigging.persist();
	}

	function handleVoiceFilterChange(filter: VoiceFilterType) {
		rigging.setVoiceFilter(filter);
		voice.setFilter(filter);
	}

	function applyTrackingPreset(preset: 'responsive' | 'balanced' | 'smooth') {
		if (preset === 'responsive') {
			rigging.trackingSensitivity = 1.35;
			rigging.smoothingAmount = 0.20;
			rigging.deadzoneThreshold = 0.10;
			rigging.jitterReduction = 0.35;
			rigging.showToast(`✓ ${i18n.t('preset_low_end')}`);
		} else if (preset === 'balanced') {
			rigging.trackingSensitivity = 1.0;
			rigging.smoothingAmount = 0.35;
			rigging.deadzoneThreshold = 0.25;
			rigging.jitterReduction = 0.50;
			rigging.showToast(`✓ ${i18n.t('preset_balanced')}`);
		} else if (preset === 'smooth') {
			rigging.trackingSensitivity = 0.90;
			rigging.smoothingAmount = 0.60;
			rigging.deadzoneThreshold = 0.45;
			rigging.jitterReduction = 0.75;
			rigging.showToast(`✓ ${i18n.t('preset_smooth')}`);
		}
		rigging.persist();
	}

	function handleExport() {
		const json = exportConfigJson({
			modelUrl: rigging.modelUrl,
			modelName: rigging.modelName,
			selectedModelId: rigging.selectedModelId,
			avatarEngine: rigging.avatarEngine,
			selected3DModelId: rigging.selected3DModelId,
			uiTheme: rigging.uiTheme,
			backgroundStyle: rigging.backgroundStyle,
			backgroundColor: rigging.backgroundColor,
			screenEffect: rigging.screenEffect,
			trackingSensitivity: rigging.trackingSensitivity,
			smoothingAmount: rigging.smoothingAmount,
			jitterReduction: rigging.jitterReduction,
			deadzoneThreshold: rigging.deadzoneThreshold,
			eyeBlinkLinked: rigging.eyeBlinkLinked,
			holdPoseOnLoss: rigging.holdPoseOnLoss,
			invertPitch: rigging.invertPitch,
			invertYaw: rigging.invertYaw,
			framingMode: rigging.framingMode,
			isSquareFrameActive: rigging.isSquareFrameActive,
			squareFrameFade: rigging.squareFrameFade,
			hiddenPartIds: rigging.hiddenPartIds,
			enableHandTracking: rigging.enableHandTracking,
			poseLoopMode: rigging.poseLoopMode,
			isRiggingPinned: rigging.isRiggingPinned,
			riggingViewMode: rigging.riggingViewMode,
			cameraDeviceId: rigging.cameraDeviceId,
			cameraResolution: rigging.cameraResolution,
			audioDeviceId: rigging.audioDeviceId,
			micGain: rigging.micGain,
			voiceFilter: rigging.voiceFilter,
			mouthSensitivity: rigging.mouthSensitivity,
			mouthTrackingMode: rigging.mouthTrackingMode,
			isSfxEnabled: rigging.isSfxEnabled,
			sfxVolume: rigging.sfxVolume,
			currentLocale: i18n.currentLocale
		});

		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `mirunova-config-backup-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
		rigging.showToast('✓ File backup JSON berhasil diunduh');
	}

	function handleImport(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (evt) => {
			const content = evt.target?.result as string;
			const parsed = importConfigJson(content);
			if (parsed) {
				if (parsed.modelUrl) rigging.modelUrl = parsed.modelUrl;
				if (parsed.modelName) rigging.modelName = parsed.modelName;
				if (parsed.selectedModelId) rigging.selectedModelId = parsed.selectedModelId;
				if (parsed.avatarEngine) rigging.avatarEngine = parsed.avatarEngine;
				if (parsed.uiTheme) rigging.uiTheme = parsed.uiTheme as any;
				if (parsed.backgroundStyle) rigging.backgroundStyle = parsed.backgroundStyle as any;
				if (parsed.backgroundColor) rigging.backgroundColor = parsed.backgroundColor;
				if (parsed.trackingSensitivity) rigging.trackingSensitivity = parsed.trackingSensitivity;
				if (parsed.smoothingAmount) rigging.smoothingAmount = parsed.smoothingAmount;
				if (parsed.jitterReduction !== undefined) rigging.jitterReduction = parsed.jitterReduction;
				if (parsed.deadzoneThreshold !== undefined) rigging.deadzoneThreshold = parsed.deadzoneThreshold;
				if (parsed.invertPitch !== undefined) rigging.invertPitch = parsed.invertPitch;
				if (parsed.invertYaw !== undefined) rigging.invertYaw = parsed.invertYaw;
				if (parsed.mouthSensitivity !== undefined) rigging.mouthSensitivity = parsed.mouthSensitivity;
				if (parsed.mouthTrackingMode !== undefined) rigging.mouthTrackingMode = parsed.mouthTrackingMode;
				if (parsed.isSfxEnabled !== undefined) rigging.isSfxEnabled = parsed.isSfxEnabled;
				if (parsed.sfxVolume !== undefined) rigging.sfxVolume = parsed.sfxVolume;
				if (parsed.framingMode) rigging.framingMode = parsed.framingMode as any;
				if (parsed.isSquareFrameActive !== undefined) rigging.isSquareFrameActive = parsed.isSquareFrameActive;
				if (parsed.currentLocale) i18n.setLocale(parsed.currentLocale as any);

				rigging.persist();
				rigging.showToast(i18n.t('settings_import_success'));
			} else {
				alert(i18n.t('settings_import_invalid_json'));
			}
		};
		reader.readAsText(file);
	}

	function handleResetDefaults() {
		if (confirm(i18n.t('reset_confirm'))) {
			clearPreferences();
			rigging.trackingSensitivity = 1.0;
			rigging.smoothingAmount = 0.35;
			rigging.jitterReduction = 0.50;
			rigging.deadzoneThreshold = 0.25;
			rigging.eyeBlinkLinked = false;
			rigging.invertPitch = false;
			rigging.invertYaw = false;
			rigging.framingMode = 'half';
			rigging.isSquareFrameActive = false;
			rigging.squareFrameFade = true;
			rigging.hiddenPartIds = {};
			rigging.uiTheme = 'cyber-dark';
			rigging.backgroundStyle = 'solid';
			rigging.backgroundColor = '#09090b';
			rigging.screenEffect = 'none';
			rigging.isRiggingPinned = true;
			rigging.riggingViewMode = 'stay';
			rigging.persist();
			rigging.showToast(i18n.t('settings_reset_done'));
		}
	}
</script>

{#if rigging.isSettingsModalOpen}
	<!-- Modal Backdrop with blur -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={() => (rigging.isSettingsModalOpen = false)}
		class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
	>
		<!-- 2X Wider Modal Card Container (max-w-5xl / 6xl) -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			class="w-full max-w-6xl xl:max-w-7xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors border {
				isLightTheme
					? 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
					: 'bg-zinc-950 text-zinc-100 border-zinc-800 shadow-2xl'
			}"
		>
			<!-- Modal Header -->
			<div class="px-6 py-5 border-b flex items-center justify-between {
				isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/80'
			}">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-500">
						<Settings class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-base sm:text-lg font-bold tracking-wide flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							{i18n.t('settings_title')}
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold {
								isLightTheme ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-cyan-950 text-cyan-400 border border-cyan-800/80'
							}">
								v0.20.1-beta
							</span>
						</h2>
						<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
							{i18n.t('settings_subtitle')}
						</p>
					</div>
				</div>

				<button
					onclick={() => (rigging.isSettingsModalOpen = false)}
					class="p-2 rounded-xl transition-colors cursor-pointer {
						isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
					}"
					aria-label={i18n.t('close_btn')}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Expansive Navigation Tabs (Scrollable on mobile with 2px extra padding Y) -->
			<div class="px-6 border-b flex items-center gap-1.5 overflow-x-auto py-2.5 sm:py-3 {
				isLightTheme ? 'bg-zinc-100/50 border-zinc-200' : 'bg-zinc-900/30 border-zinc-800/80'
			}">
				<button
					onclick={() => (activeTab = 'perf')}
					class="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
						activeTab === 'perf'
							? isLightTheme
								? 'bg-cyan-100 text-cyan-800 border border-cyan-400 shadow-sm'
								: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
							: isLightTheme
								? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
								: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Cpu class="w-4 h-4" />
					<span>{i18n.t('tab_perf')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'tracking')}
					class="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
						activeTab === 'tracking'
							? isLightTheme
								? 'bg-indigo-100 text-indigo-800 border border-indigo-400 shadow-sm'
								: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
							: isLightTheme
								? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
								: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<SlidersHorizontal class="w-4 h-4" />
					<span>{i18n.t('tab_tracking')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'voice')}
					class="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
						activeTab === 'voice'
							? isLightTheme
								? 'bg-emerald-100 text-emerald-800 border border-emerald-400 shadow-sm'
								: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
							: isLightTheme
								? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
								: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Mic class="w-4 h-4" />
					<span>{i18n.t('tab_voice')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'theme')}
					class="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
						activeTab === 'theme'
							? isLightTheme
								? 'bg-pink-100 text-pink-800 border border-pink-400 shadow-sm'
								: 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
							: isLightTheme
								? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
								: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Palette class="w-4 h-4" />
					<span>{i18n.t('tab_theme')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'stage')}
					class="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
						activeTab === 'stage'
							? isLightTheme
								? 'bg-sky-100 text-sky-800 border border-sky-400 shadow-sm'
								: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
							: isLightTheme
								? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
								: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Layers class="w-4 h-4" />
					<span>{i18n.t('tab_stage')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'storage')}
					class="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
						activeTab === 'storage'
							? isLightTheme
								? 'bg-amber-100 text-amber-800 border border-amber-400 shadow-sm'
								: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
							: isLightTheme
								? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
								: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Database class="w-4 h-4" />
					<span>{i18n.t('tab_storage')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'about')}
					class="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
						activeTab === 'about'
							? isLightTheme
								? 'bg-violet-100 text-violet-800 border border-violet-400 shadow-sm'
								: 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
							: isLightTheme
								? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
								: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Info class="w-4 h-4" />
					<span>About</span>
				</button>
			</div>

			<!-- Modal Body (Expansive 2-Column Responsive View) -->
			<div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
				<!-- TAB 1: HARDWARE & PERF -->
				{#if activeTab === 'perf'}
					<div class="space-y-4 sm:space-y-6 w-full animate-in fade-in duration-150">
						<!-- Live Telemetry Card (Single Column Flow) -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm {
							isLightTheme
								? 'bg-zinc-50 border-zinc-200 text-zinc-900'
								: 'bg-zinc-900/60 border-zinc-800 text-zinc-100'
						}">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
									<Activity class="w-4 h-4 text-cyan-500" />
									<span>Live Hardware Telemetry &amp; Metrik Real-Time</span>
								</h3>
								<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold {
									isLightTheme
										? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
										: 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
								}">
									60 FPS Pipeline
								</span>
							</div>

							<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
								<div class="p-3.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="text-[10px] block uppercase font-sans font-bold {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Real-Time FPS</span>
									<span class="text-xl font-bold text-cyan-500">{rigging.fps || 60}</span>
								</div>
								<div class="p-3.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="text-[10px] block uppercase font-sans font-bold {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Render Latency</span>
									<span class="text-xl font-bold text-emerald-500">{rigging.latencyMs || 8} ms</span>
								</div>
								<div class="p-3.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="text-[10px] block uppercase font-sans font-bold {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">CPU Threads</span>
									<span class="text-xl font-bold {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">{hardware.cpuCores} Cores</span>
								</div>
								<div class="p-3.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="text-[10px] block uppercase font-sans font-bold {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('badge_webcam')}</span>
									<span class="text-xl font-bold {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">{rigging.cameraResolution}</span>
								</div>
								<div class="p-3.5 rounded-xl border col-span-2 sm:col-span-4 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="text-[10px] block uppercase font-sans font-bold {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('gpu_detected')}</span>
									<span class="text-xs font-semibold break-words {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">{hardware.gpuRenderer}</span>
								</div>
							</div>

							<!-- Smoothness Status Bar -->
							<div class="space-y-2 pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
								<div class="flex items-center justify-between text-xs">
									<span class="font-medium {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">{i18n.t('system_smoothness')}</span>
									<span class="font-bold px-2.5 py-0.5 rounded-full text-[11px]" style="color: {hardware.tierColor}; background: {hardware.tierColor}25;">
										{hardware.tierLabel} ({hardware.score}/100)
									</span>
								</div>
								<div class="w-full h-2.5 rounded-full overflow-hidden {isLightTheme ? 'bg-zinc-200' : 'bg-zinc-800'}">
									<div
										class="h-full rounded-full transition-all duration-300"
										style="width: {hardware.score}%; background: {hardware.tierColor};"
									></div>
								</div>
								<p class="text-xs leading-relaxed {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
									{hardware.recommendation}
								</p>

								<!-- On-Screen HUD FPS Counter Toggle Switch -->
								<div class="flex items-center justify-between p-3.5 rounded-xl border mt-3 {
									isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/80'
								}">
									<div>
										<span class="font-semibold block text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('settings_fps_counter_title')}</span>
										<span class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('settings_fps_counter_desc')}</span>
									</div>
									<button
										onclick={() => {
											rigging.showFpsCounter = !rigging.showFpsCounter;
											rigging.persist();
											playSfx('toggle');
										}}
										aria-label="Toggle HUD FPS Counter"
										class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
											rigging.showFpsCounter ? 'bg-cyan-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
										}"
									>
										<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
											rigging.showFpsCounter ? 'translate-x-4.5' : 'translate-x-1'
										}"></span>
									</button>
								</div>
							</div>
						</div>

						<!-- 3D Graphics Quality Preset Card -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm {
							isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-900/60 border-zinc-800 text-zinc-100'
						}">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
									<Box class="w-4 h-4 text-cyan-500" />
									<span>{i18n.t('preset_quality_3d')}</span>
								</h3>
								<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold {
									rigging.renderQuality3D === 'highest'
										? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
										: rigging.renderQuality3D === 'medium'
										? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
										: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
								}">
									{rigging.renderQuality3D}
								</span>
							</div>

							<p class="text-xs leading-relaxed {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
								{i18n.t('preset_quality_3d_desc')}
							</p>

							<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
								<button
									type="button"
									onclick={() => {
										rigging.renderQuality3D = 'low';
										rigging.persist();
										threeStage.setQuality('low');
										playSfx('click');
										rigging.showToast('✓ ' + i18n.t('quality_low'));
									}}
									class="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 {
										rigging.renderQuality3D === 'low'
											? isLightTheme
												? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
												: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/30'
											: isLightTheme
											? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
											: 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
									}"
								>
									<div class="flex items-center justify-between">
										<span class="font-bold text-xs">Low (Hemat Daya)</span>
										{#if rigging.renderQuality3D === 'low'}
											<Check class="w-3.5 h-3.5 text-emerald-500" />
										{/if}
									</div>
									<span class="text-[10px] opacity-80 font-mono">0.85x scale • 30 FPS • Aniso 1x</span>
								</button>

								<button
									type="button"
									onclick={() => {
										rigging.renderQuality3D = 'medium';
										rigging.persist();
										threeStage.setQuality('medium');
										playSfx('click');
										rigging.showToast('✓ ' + i18n.t('quality_medium'));
									}}
									class="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 {
										rigging.renderQuality3D === 'medium'
											? isLightTheme
												? 'bg-cyan-100 text-cyan-900 border-cyan-400 ring-2 ring-cyan-400/40 shadow-sm'
												: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 ring-2 ring-cyan-500/30'
											: isLightTheme
											? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
											: 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
									}"
								>
									<div class="flex items-center justify-between">
										<span class="font-bold text-xs">Medium (Standar)</span>
										{#if rigging.renderQuality3D === 'medium'}
											<Check class="w-3.5 h-3.5 text-cyan-500" />
										{/if}
									</div>
									<span class="text-[10px] opacity-80 font-mono">1.25x scale • 60 FPS • Aniso 4x</span>
								</button>

								<button
									type="button"
									onclick={() => {
										rigging.renderQuality3D = 'highest';
										rigging.persist();
										threeStage.setQuality('highest');
										playSfx('click');
										rigging.showToast('✓ ' + i18n.t('quality_highest'));
									}}
									class="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 {
										rigging.renderQuality3D === 'highest'
											? isLightTheme
												? 'bg-purple-100 text-purple-900 border-purple-400 ring-2 ring-purple-400/40 shadow-sm'
												: 'bg-purple-500/20 text-purple-300 border-purple-500/50 ring-2 ring-purple-500/30'
											: isLightTheme
											? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
											: 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
									}"
								>
									<div class="flex items-center justify-between">
										<span class="font-bold text-xs">Highest (Ultra HD)</span>
										{#if rigging.renderQuality3D === 'highest'}
											<Check class="w-3.5 h-3.5 text-purple-500" />
										{/if}
									</div>
									<span class="text-[10px] opacity-80 font-mono">2.0x scale • Uncapped • Aniso 16x</span>
								</button>
							</div>
						</div>

						<!-- GPU Architecture & Optimization Guide (Card 2) -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm {
							isLightTheme
								? 'bg-zinc-50 border-zinc-200 text-zinc-900'
								: 'bg-zinc-900/60 border-zinc-800 text-zinc-100'
						}">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
									<Cpu class="w-4 h-4 text-emerald-500" />
									<span>{i18n.t('gpu_info_title')}</span>
								</h3>
								<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono {
									isLightTheme
										? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
										: 'bg-emerald-950 text-emerald-300 border border-emerald-800'
								}">
									WebGL High-Perf Enabled
								</span>
							</div>

							<p class="text-xs leading-relaxed {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
								{i18n.t('gpu_info_desc')}
							</p>

							<!-- Factual Windows Guide for Dedicated GPU -->
							<div class="p-4 rounded-xl border space-y-3 {
								isLightTheme ? 'bg-white border-cyan-300/60' : 'bg-zinc-950/90 border-cyan-500/30'
							}">
								<div class="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-300">
									<Info class="w-4 h-4 text-cyan-500 shrink-0" />
									<span>{i18n.t('gpu_nvidia_guide_title')}</span>
								</div>
								<p class="text-[11px] leading-relaxed {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
									{i18n.t('gpu_nvidia_guide_desc')}
								</p>

								<div class="space-y-2 text-[11px]">
									<div class="p-3 rounded-xl border {isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/80 border-zinc-800/80'}">
										<div class="font-bold text-cyan-600 dark:text-cyan-400 mb-0.5">Langkah 1: Windows Graphics Settings</div>
										<div class="text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
											Buka <span class="font-mono {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">Start &gt; Settings &gt; System &gt; Display &gt; Graphics</span>. Pilih browser Anda (Chrome/Edge/Brave), klik <strong>Options</strong>, lalu centang <strong>High performance (NVIDIA GeForce)</strong>.
										</div>
									</div>

									<div class="p-3 rounded-xl border {isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/80 border-zinc-800/80'}">
										<div class="font-bold text-cyan-600 dark:text-cyan-400 mb-0.5">Langkah 2: NVIDIA Control Panel</div>
										<div class="text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
											Buka <span class="font-mono {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">NVIDIA Control Panel &gt; Manage 3D Settings &gt; Program Settings</span>. Tambahkan browser Anda, lalu atur <em>Preferred graphics processor</em> ke <strong>High-performance NVIDIA processor</strong>.
										</div>
									</div>

									<div class="p-3 rounded-xl border {isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/80 border-zinc-800/80'}">
										<div class="font-bold text-cyan-600 dark:text-cyan-400 mb-0.5">Langkah 3: Hardware Acceleration Browser</div>
										<div class="text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
											Pastikan di pengaturan browser: <span class="font-mono {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">Settings &gt; System &gt; "Use graphics acceleration when available"</span> aktif (ON), lalu restart browser.
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 2: TRACKING & CAMERA -->
				{:else if activeTab === 'tracking'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-150">
						<!-- Camera Hardware & Inversion Settings (Participant-Aware: Host / Guest 1 / Guest 2) -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm {
							isLightTheme
								? 'bg-zinc-50 border-zinc-200 text-zinc-900'
								: 'bg-zinc-900/50 border-zinc-800/90 text-zinc-100'
						}">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">
									<Camera class="w-4 h-4 text-indigo-500" />
									<span>{i18n.t('settings_cam_axes')}</span>
								</h3>
								<button
									onclick={() => refreshDevices(true)}
									class="flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer"
									title={i18n.t('refresh_devices')}
								>
									<RefreshCw class="w-3 h-3" />
									<span>{i18n.t('scan_camera')}</span>
								</button>
							</div>

							<!-- Participant Selector Tabs (Host, Collab Guest 1, Collab Guest 2) -->
							<div class="flex items-center gap-1.5 p-1 rounded-xl border {isLightTheme ? 'bg-white border-zinc-300' : 'bg-zinc-950 border-zinc-800'}">
								<button
									type="button"
									onclick={() => (trackingParticipant = 'host')}
									class="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 {
										trackingParticipant === 'host'
											? 'bg-pink-500 text-white shadow-xs'
											: isLightTheme ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
									}"
								>
									<Smile class="w-3.5 h-3.5" />
									<span>{i18n.t('settings_participant_host')}</span>
								</button>
								<button
									type="button"
									onclick={() => (trackingParticipant = 'guest1')}
									class="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 {
										trackingParticipant === 'guest1'
											? 'bg-purple-600 text-white shadow-xs'
											: isLightTheme ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
									}"
								>
									<Users class="w-3.5 h-3.5" />
									<span>Guest 1</span>
									{#if rigging.isCollabModeActive}
										<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
									{/if}
								</button>
								<button
									type="button"
									onclick={() => (trackingParticipant = 'guest2')}
									class="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 {
										trackingParticipant === 'guest2'
											? 'bg-indigo-600 text-white shadow-xs'
											: isLightTheme ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
									}"
								>
									<Users class="w-3.5 h-3.5" />
									<span>Guest 2</span>
									{#if rigging.isCollab2Active}
										<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
									{/if}
								</button>
							</div>

							<!-- PARTICIPANT: HOST UTAMA -->
							{#if trackingParticipant === 'host'}
								<div class="space-y-3 text-xs animate-in fade-in duration-100">
									<!-- Camera Picker for Host -->
									<div>
										<label for="cam-select-host" class="block font-medium mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">
											{i18n.t('settings_host_cam')}
										</label>
										<select
											id="cam-select-host"
											bind:value={rigging.cameraDeviceId}
											onchange={handleCameraDeviceChange}
											class="w-full p-2.5 border rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer {
												isLightTheme ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-200'
											}"
										>
											<option value="">{i18n.t('cam_auto_detect')}</option>
											{#each availableCameras as cam}
												<option value={cam.deviceId}>
													{formatCameraBadge(cam.label)}
												</option>
											{/each}
										</select>
										{#if rigging.activeCameraLabel}
											<div class="mt-2 p-2 border rounded-xl text-[11px] flex items-center gap-2 font-mono {
												isLightTheme ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
											}">
												<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
												<span class="truncate"><strong>Hardware:</strong> {rigging.activeCameraLabel}</span>
											</div>
										{/if}
									</div>

									<!-- Resolution Picker -->
									<div>
										<label for="res-select" class="block font-medium mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">
											{i18n.t('settings_cam_input_res')}
										</label>
										<select
											id="res-select"
											bind:value={rigging.cameraResolution}
											onchange={handleResolutionChange}
											class="w-full p-2.5 border rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer {
												isLightTheme ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-200'
											}"
										>
											<option value="480p">480p (640x480 — {i18n.t('res_ultra_light')})</option>
											<option value="720p">720p (1280x720 — {i18n.t('res_balanced')})</option>
											<option value="1080p">1080p (1920x1080 — {i18n.t('res_high_detail')})</option>
										</select>
									</div>

									<!-- Invert Pitch, Invert Yaw & Axis Switches -->
									<div class="pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'} space-y-2.5">
										<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
											<div>
												<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">{i18n.t('invert_pitch')}</span>
												<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('invert_pitch_desc')}</span>
											</div>
											<button
												onclick={() => {
													rigging.invertPitch = !rigging.invertPitch;
													rigging.persist();
												}}
												aria-label={i18n.t('invert_pitch')}
												class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
													rigging.invertPitch ? 'bg-indigo-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
												}"
											>
												<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
													rigging.invertPitch ? 'translate-x-4.5' : 'translate-x-1'
												}"></span>
											</button>
										</div>

										<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
											<div>
												<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">{i18n.t('invert_yaw')}</span>
												<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('invert_yaw_desc')}</span>
											</div>
											<button
												onclick={() => {
													rigging.invertYaw = !rigging.invertYaw;
													rigging.persist();
												}}
												aria-label={i18n.t('invert_yaw')}
												class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
													rigging.invertYaw ? 'bg-indigo-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
												}"
											>
												<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
													rigging.invertYaw ? 'translate-x-4.5' : 'translate-x-1'
												}"></span>
											</button>
										</div>

										<!-- Deteksi Wajah MediaPipe (Face Recognition) -->
										<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
											<div>
												<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">{i18n.t('tracking_face_title')}</span>
												<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('tracking_face_desc')}</span>
											</div>
											<button
												onclick={() => {
													rigging.enableFaceTracking = !rigging.enableFaceTracking;
													rigging.persist();
													playSfx('toggle');
												}}
												aria-label={i18n.t('pip_toggle_face')}
												class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
													rigging.enableFaceTracking ? 'bg-indigo-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
												}"
											>
												<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
													rigging.enableFaceTracking ? 'translate-x-4.5' : 'translate-x-1'
												}"></span>
											</button>
										</div>

										<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
											<div>
												<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">{i18n.t('hands_toggle')}</span>
												<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('hand_tracking_perf_tip')}</span>
											</div>
											<button
												onclick={() => {
													rigging.enableHandTracking = !rigging.enableHandTracking;
													rigging.persist();
												}}
												aria-label={i18n.t('hands_toggle')}
												class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
													rigging.enableHandTracking ? 'bg-indigo-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
												}"
											>
												<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
													rigging.enableHandTracking ? 'translate-x-4.5' : 'translate-x-1'
												}"></span>
											</button>
										</div>

										<!-- Wink Sebelah Mata (Independent Eye Wink) -->
										<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
											<div>
												<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">Wink Sebelah Mata (Kedip Mandiri)</span>
												<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Mata kiri &amp; kanan bisa berkedip independen saat Anda mengedipkan sebelah mata</span>
											</div>
											<button
												onclick={() => {
													rigging.eyeBlinkLinked = !rigging.eyeBlinkLinked;
													rigging.persist();
													playSfx('toggle');
												}}
												aria-label="Wink Sebelah Mata"
												class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
													!rigging.eyeBlinkLinked ? 'bg-indigo-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
												}"
											>
												<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
													!rigging.eyeBlinkLinked ? 'translate-x-4.5' : 'translate-x-1'
												}"></span>
											</button>
										</div>

										<!-- Cermin Mata VTuber (Mirror Eyes) -->
										<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
											<div>
												<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">Cermin Mata VTuber</span>
												<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Mata kiri fisik Anda mengedipkan mata kiri avatar pada layar</span>
											</div>
											<button
												onclick={() => {
													rigging.mirrorEyes = !rigging.mirrorEyes;
													rigging.persist();
													playSfx('toggle');
												}}
												aria-label="Cermin Mata VTuber"
												class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
													rigging.mirrorEyes ? 'bg-indigo-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
												}"
											>
												<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
													rigging.mirrorEyes ? 'translate-x-4.5' : 'translate-x-1'
												}"></span>
											</button>
										</div>
									</div>
								</div>

							<!-- PARTICIPANT: COLLAB GUEST 1 -->
							{:else if trackingParticipant === 'guest1'}
								<div class="space-y-3 text-xs animate-in fade-in duration-100">
									<div class="flex items-center justify-between p-3 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-purple-950/20 border-purple-500/30'}">
										<div>
											<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">Status Collab Guest 1</span>
											<span class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Avatar: {rigging.collabModelName}</span>
										</div>
										<button
											type="button"
											onclick={() => rigging.toggleCollabMode()}
											class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer {
												rigging.isCollabModeActive ? 'bg-purple-600 text-white shadow-xs' : 'bg-zinc-800 text-zinc-300'
											}"
										>
											{rigging.isCollabModeActive ? i18n.t('btn_activated') : i18n.t('btn_activate')}
										</button>
									</div>

									<!-- Camera Device Picker for Guest 1 -->
									<div>
										<label for="cam-select-guest1" class="block font-medium mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">
											{i18n.t('settings_guest1_cam')}
										</label>
										<select
											id="cam-select-guest1"
											value={rigging.collabCameraDeviceId}
											onchange={(e) => {
												const sel = e.target as HTMLSelectElement;
												const opt = sel.options[sel.selectedIndex];
												rigging.setCollabCamera('guest1', sel.value, opt?.text || '');
											}}
											class="w-full p-2.5 border rounded-xl focus:outline-none focus:border-purple-500 cursor-pointer {
												isLightTheme ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-200'
											}"
										>
											<option value="">{i18n.t('guest_camera_placeholder')}</option>
											{#each availableCameras as cam}
												<option value={cam.deviceId}>
													{formatCameraBadge(cam.label)}
												</option>
											{/each}
										</select>
									</div>

									<!-- Model Avatar Selection for Guest 1 -->
									<div>
										<span class="block font-medium mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">
											{i18n.t('settings_guest1_model')}
										</span>
										<div class="grid grid-cols-3 gap-1.5">
											{#each MODEL_CATALOG.slice(0, 6) as model}
												<button
													type="button"
													onclick={() => rigging.setCollabModel(model.id, model.name, model.url)}
													class="p-2 rounded-xl border text-left transition-all cursor-pointer {
														rigging.collabModelId === model.id
															? 'border-purple-500 bg-purple-500/20 text-purple-200 font-bold ring-1 ring-purple-500/50'
															: isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
													}"
												>
													<div class="truncate text-[11px]">{model.name}</div>
												</button>
											{/each}
										</div>
									</div>

									<!-- Tracking Mode Toggle -->
									<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
										<div>
											<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">Mode Sinkronisasi Tracking</span>
											<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Ikuti wajah kamera mandiri atau bernafas idle otomatis</span>
										</div>
										<button
											type="button"
											onclick={() => {
												rigging.collabSyncTracking = !rigging.collabSyncTracking;
												rigging.persist();
											}}
											class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer {
												rigging.collabSyncTracking ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'
											}"
										>
											{rigging.collabSyncTracking ? i18n.t('collab_sync_cam') : i18n.t('collab_idle_breath')}
										</button>
									</div>
								</div>

							<!-- PARTICIPANT: COLLAB GUEST 2 -->
							{:else if trackingParticipant === 'guest2'}
								<div class="space-y-3 text-xs animate-in fade-in duration-100">
									<div class="flex items-center justify-between p-3 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-indigo-950/20 border-indigo-500/30'}">
										<div>
											<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">Status Collab Guest 2</span>
											<span class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Avatar: {rigging.collab2ModelName}</span>
										</div>
										<button
											type="button"
											onclick={() => rigging.toggleCollab2Mode()}
											class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer {
												rigging.isCollab2Active ? 'bg-indigo-600 text-white shadow-xs' : 'bg-zinc-800 text-zinc-300'
											}"
										>
											{rigging.isCollab2Active ? i18n.t('btn_activated') : i18n.t('btn_activate')}
										</button>
									</div>

									<!-- Camera Device Picker for Guest 2 -->
									<div>
										<label for="cam-select-guest2" class="block font-medium mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">
											{i18n.t('settings_guest2_cam')}
										</label>
										<select
											id="cam-select-guest2"
											value={rigging.collab2CameraDeviceId}
											onchange={(e) => {
												const sel = e.target as HTMLSelectElement;
												const opt = sel.options[sel.selectedIndex];
												rigging.setCollabCamera('guest2', sel.value, opt?.text || '');
											}}
											class="w-full p-2.5 border rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer {
												isLightTheme ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-200'
											}"
										>
											<option value="">{i18n.t('guest_camera_placeholder')}</option>
											{#each availableCameras as cam}
												<option value={cam.deviceId}>
													{formatCameraBadge(cam.label)}
												</option>
											{/each}
										</select>
									</div>

									<!-- Model Avatar Selection for Guest 2 -->
									<div>
										<span class="block font-medium mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">
											{i18n.t('settings_guest2_model')}
										</span>
										<div class="grid grid-cols-3 gap-1.5">
											{#each MODEL_CATALOG.slice(0, 6) as model}
												<button
													type="button"
													onclick={() => rigging.setCollab2Model(model.id, model.name, model.url)}
													class="p-2 rounded-xl border text-left transition-all cursor-pointer {
														rigging.collab2ModelId === model.id
															? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-bold ring-1 ring-indigo-500/50'
															: isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
													}"
												>
													<div class="truncate text-[11px]">{model.name}</div>
												</button>
											{/each}
										</div>
									</div>

									<!-- Tracking Mode Toggle -->
									<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
										<div>
											<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">Mode Sinkronisasi Tracking</span>
											<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Ikuti wajah kamera mandiri atau bernafas idle otomatis</span>
										</div>
										<button
											type="button"
											onclick={() => {
												rigging.collab2SyncTracking = !rigging.collab2SyncTracking;
												rigging.persist();
											}}
											class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer {
												rigging.collab2SyncTracking ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'
											}"
										>
											{rigging.collab2SyncTracking ? i18n.t('collab_sync_cam') : i18n.t('collab_idle_breath')}
										</button>
									</div>
								</div>
							{/if}
						</div>

						<!-- Fine Sensitivity, Smoothing, Full-Body Kinematics & Framing Settings -->
						<div class="space-y-4">
							<!-- CARD 1: Tracking Quality & Presets -->
							<div class="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm {
								isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-900/50 border-zinc-800/90 text-zinc-100'
							}">
								<h3 class="text-sm font-bold flex items-center justify-between {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">
									<span class="flex items-center gap-2">
										<SlidersHorizontal class="w-4 h-4 text-cyan-500" />
										<span>{i18n.t('tracking_quality')}</span>
									</span>
									<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Live2D &amp; 3D</span>
								</h3>

								<!-- Quick Presets -->
								<div class="space-y-1.5">
									<span class="text-[11px] font-semibold uppercase tracking-wider block {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
										{i18n.t('tracking_presets_title')}
									</span>
									<div class="grid grid-cols-3 gap-1.5">
										<button
											onclick={() => applyTrackingPreset('responsive')}
											class="px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors text-center cursor-pointer {
												isLightTheme ? 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800' : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-200'
											}"
										>
											Responsif
										</button>
										<button
											onclick={() => applyTrackingPreset('balanced')}
											class="px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors text-center cursor-pointer bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-xs"
										>
											Seimbang
										</button>
										<button
											onclick={() => applyTrackingPreset('smooth')}
											class="px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors text-center cursor-pointer {
												isLightTheme ? 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800' : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-200'
											}"
										>
											Ultra Halus
										</button>
									</div>
								</div>

								<!-- Fine Sliders -->
								<div class="space-y-3 text-xs pt-1">
									<div>
										<div class="flex justify-between mb-1">
											<span class="{isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">{i18n.t('sensitivity')}</span>
											<span class="font-mono text-cyan-500 font-bold">{rigging.trackingSensitivity.toFixed(2)}x</span>
										</div>
										<input
											type="range"
											min="0.5"
											max="2.5"
											step="0.05"
											bind:value={rigging.trackingSensitivity}
											oninput={() => rigging.persist()}
											class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
										/>
									</div>

									<div>
										<div class="flex justify-between mb-1">
											<span class="{isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">{i18n.t('smoothing')}</span>
											<span class="font-mono text-cyan-500 font-bold">{Math.round(rigging.smoothingAmount * 100)}%</span>
										</div>
										<input
											type="range"
											min="0.05"
											max="0.85"
											step="0.02"
											bind:value={rigging.smoothingAmount}
											oninput={() => rigging.persist()}
											class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
										/>
									</div>

									<div>
										<div class="flex justify-between mb-1">
											<span class="{isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">{i18n.t('deadzone')}</span>
											<span class="font-mono text-cyan-500 font-bold">{rigging.deadzoneThreshold.toFixed(2)}°</span>
										</div>
										<input
											type="range"
											min="0.0"
											max="1.5"
											step="0.05"
											bind:value={rigging.deadzoneThreshold}
											oninput={() => rigging.persist()}
											class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
										/>
									</div>

									<!-- Mouth Speech Sensitivity & Speech Boost -->
									<div class="pt-3 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'} space-y-3">
										<div class="flex items-center justify-between">
											<div>
												<span class="text-[11px] font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">{i18n.t('mouth_sensitivity_title')}</span>
												<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('mouth_sensitivity_desc')}</span>
											</div>
											<button
												onclick={() => {
													rigging.mouthTrackingMode = rigging.mouthTrackingMode === 'high' ? 'normal' : 'high';
													rigging.persist();
													playSfx('toggle');
												}}
												class="px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer {
													rigging.mouthTrackingMode === 'high'
														? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
														: isLightTheme ? 'bg-zinc-200 text-zinc-700 border-zinc-300' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
												}"
											>
												{rigging.mouthTrackingMode === 'high' ? '🔥 ' + i18n.t('speech_boost_high') : i18n.t('speech_boost_normal')}
											</button>
										</div>

										<div>
											<div class="flex justify-between mb-1">
												<span class="{isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">{i18n.t('mouth_multiplier_label')}</span>
												<span class="font-mono text-rose-500 font-bold">{(rigging.mouthSensitivity || 1.0).toFixed(1)}x</span>
											</div>
											<input
												type="range"
												min="0.5"
												max="2.5"
												step="0.1"
												value={rigging.mouthSensitivity || 1.0}
												oninput={(e) => {
													const target = e.target as HTMLInputElement;
													rigging.mouthSensitivity = parseFloat(target.value);
													rigging.persist();
												}}
												class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
											/>
										</div>
									</div>
								</div>
							</div>

							<!-- CARD 2: Full-Body Kinematics & Torso Sway (Live2D & 3D) -->
							<div class="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm {
								isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-900/50 border-zinc-800/90 text-zinc-100'
							}">
								<div class="flex items-center justify-between">
									<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">
										<Activity class="w-4 h-4 text-emerald-500" />
										<span>Full-Body &amp; Torso Kinematics (Live2D &amp; 3D)</span>
									</h3>
									<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
										Universal
									</span>
								</div>

								<div class="space-y-3 text-xs">
									<!-- Toggle Body Sway -->
									<div class="flex items-center justify-between p-2.5 rounded-xl border {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800/60'}">
										<div>
											<span class="font-semibold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">Tracking &amp; Goyangan Tubuh (Body Sway)</span>
											<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Tubuh avatar otomatis berputar &amp; condong mengikuti arah gerakan kepala Anda (ParamBodyAngleX/Y/Z)</span>
										</div>
										<button
											onclick={() => {
												rigging.enableBodyTracking = !rigging.enableBodyTracking;
												rigging.persist();
												playSfx('toggle');
											}}
											aria-label="Toggle Body Tracking"
											class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
												rigging.enableBodyTracking ? 'bg-emerald-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
											}"
										>
											<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
												rigging.enableBodyTracking ? 'translate-x-4.5' : 'translate-x-1'
											}"></span>
										</button>
									</div>

									<!-- Body Sway Intensity Slider -->
									{#if rigging.enableBodyTracking}
										<div>
											<div class="flex justify-between mb-1">
												<span class="{isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">Intensitas Goyangan Tubuh (Torso Sway Multiplier):</span>
												<span class="font-mono text-emerald-500 font-bold">{rigging.bodyTrackingIntensity.toFixed(2)}x</span>
											</div>
											<input
												type="range"
												min="0.2"
												max="2.0"
												step="0.05"
												bind:value={rigging.bodyTrackingIntensity}
												oninput={() => rigging.persist()}
												class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
											/>
										</div>
									{/if}

									<!-- Pose Looping / Idle Breathing -->
									<div>
										<label for="pose-loop-select" class="block font-medium mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}">
											Ritme Nafas &amp; Pose Loop Avatar (ParamBreath):
										</label>
										<select
											id="pose-loop-select"
											bind:value={rigging.poseLoopMode}
											onchange={() => rigging.persist()}
											class="w-full p-2.5 border rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer {
												isLightTheme ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-200'
											}"
										>
											<option value="idle-breath">💨 Bernapas Alami (Idle Breath)</option>
											<option value="gentle-sway">🌊 Goyangan Tubuh Lembut (Gentle Sway)</option>
											<option value="head-nod">✨ Mengangguk Halus (Head Nod)</option>
											<option value="wave">👋 Melambaikan Tangan (Wave)</option>
											<option value="none">🛑 Diam / Tanpa Animasi Tambahan</option>
										</select>
									</div>
								</div>
							</div>

							<!-- CARD 3: Avatar Framing Presets (Live2D & 3D) -->
							<div class="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm {
								isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-zinc-900/50 border-zinc-800/90 text-zinc-100'
							}">
								<div class="flex items-center justify-between">
									<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">
										<Tv class="w-4 h-4 text-purple-500" />
										<span>{i18n.t('framing_title')}</span>
									</h3>
									<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('framing_mode_label')}</span>
								</div>

								<div class="grid grid-cols-3 gap-2">
									<button
										type="button"
										onclick={() => {
											rigging.framingMode = 'full';
											rigging.persist();
											playSfx('click');
											rigging.showToast(`Framing: ${i18n.t('framing_full')}`);
										}}
										class="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 {
											rigging.framingMode === 'full'
												? 'bg-purple-500/20 text-purple-300 border-purple-500 font-bold ring-2 ring-purple-500/40'
												: isLightTheme ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
										}"
									>
										<span class="text-lg">🧍</span>
										<span class="text-xs">Full Body</span>
										<span class="text-[9px] opacity-70">{i18n.t('framing_full_sub')}</span>
									</button>

									<button
										type="button"
										onclick={() => {
											rigging.framingMode = 'half';
											rigging.persist();
											playSfx('click');
											rigging.showToast(`Framing: ${i18n.t('framing_half')}`);
										}}
										class="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 {
											rigging.framingMode === 'half'
												? 'bg-purple-500/20 text-purple-300 border-purple-500 font-bold ring-2 ring-purple-500/40'
												: isLightTheme ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
										}"
									>
										<span class="text-lg">🥋</span>
										<span class="text-xs">Half Body</span>
										<span class="text-[9px] opacity-70">{i18n.t('framing_half_sub')}</span>
									</button>

									<button
										type="button"
										onclick={() => {
											rigging.framingMode = 'closeup';
											rigging.persist();
											playSfx('click');
											rigging.showToast(`Framing: ${i18n.t('framing_closeup')}`);
										}}
										class="p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 {
											rigging.framingMode === 'closeup'
												? 'bg-purple-500/20 text-purple-300 border-purple-500 font-bold ring-2 ring-purple-500/40'
												: isLightTheme ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
										}"
									>
										<span class="text-lg">🔍</span>
										<span class="text-xs">Close-Up</span>
										<span class="text-[9px] opacity-70">{i18n.t('framing_closeup_sub')}</span>
									</button>
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 3: VOICE & AUDIO -->
				{:else if activeTab === 'voice'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-150">
						<!-- Dedicated Prominent Card: Text-To-Speech (TTS) Studio & Voice Synthesis -->
						<div class="col-span-1 md:col-span-2 p-4 sm:p-5 rounded-2xl border space-y-4 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800/90 shadow-xl'
						}">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
								<div class="flex items-center gap-3">
									<div class="p-2.5 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
										<Volume1 class="w-5 h-5 text-cyan-400" />
									</div>
									<div>
										<h3 class="text-sm sm:text-base font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
											<span>{i18n.t('settings_tts_section_title')}</span>
											<span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
												AI Speech + DSP
											</span>
										</h3>
										<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
											{i18n.t('settings_tts_desc')}
										</p>
									</div>
								</div>

								{#if isTtsSpeaking}
									<div class="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono animate-pulse">
										<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
										<span>{i18n.t('settings_speaking')}</span>
									</div>
								{/if}
							</div>

							<!-- Text Input Box & Quick Presets -->
							<div class="space-y-2">
								<div class="flex items-center justify-between text-xs">
									<label for="tts-input" class="font-semibold {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
										{i18n.t('settings_tts_prompt_label')}
									</label>
									<span class="text-[10px] text-zinc-500 font-mono">{ttsText.length} {i18n.t('settings_chars_unit')}</span>
								</div>

								<div class="flex gap-2">
									<input
										id="tts-input"
										type="text"
										bind:value={ttsText}
										placeholder={i18n.t('settings_tts_placeholder')}
										class="flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-cyan-500 transition-all {
											isLightTheme ? 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400' : 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600'
										}"
										onkeydown={(e) => {
											if (e.key === 'Enter') handleSpeakTts();
										}}
									/>

									<button
										type="button"
										onclick={handleSpeakTts}
										class="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
									>
										<Play class="w-3.5 h-3.5" />
										<span>{i18n.t('tts_speak')}</span>
									</button>

									{#if isTtsSpeaking}
										<button
											type="button"
											onclick={handleStopTts}
											class="px-3 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
										>
											<StopSquare class="w-3.5 h-3.5" />
											<span>{i18n.t('tts_stop')}</span>
										</button>
									{/if}
								</div>

								<!-- Quick Preset Chips -->
								<div class="flex items-center gap-1.5 flex-wrap pt-1">
									<span class="text-[10px] font-medium {isLightTheme ? 'text-zinc-500' : 'text-zinc-500'}">{i18n.t('settings_quick_examples')}</span>
									<button
										type="button"
										onclick={() => { ttsText = 'Halo halo semuanya! Selamat datang di live streaming!'; handleSpeakTts(); }}
										class="text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer active:scale-95 {
											isLightTheme ? 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200' : 'bg-pink-950/40 hover:bg-pink-900/50 text-pink-300 border-pink-800/60'
										}"
									>
										🌸 Anime Kawaii Intro
									</button>
									<button
										type="button"
										onclick={() => { ttsText = 'Konnichiwa minna-san! Genki desu ka? Selamat menonton ya!'; handleSpeakTts(); }}
										class="text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer active:scale-95 {
											isLightTheme ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border-cyan-800/60'
										}"
									>
										🎙️ VTuber Greeting
									</button>
									<button
										type="button"
										onclick={() => { ttsText = 'System online. Telemetry connection established.'; handleSpeakTts(); }}
										class="text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer active:scale-95 {
											isLightTheme ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-800/60'
										}"
									>
										🤖 Cyber System AI
									</button>
									<button
										type="button"
										onclick={() => { ttsText = 'Wah terima kasih banyak atas traktirannya yaa! Love you all!'; handleSpeakTts(); }}
										class="text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer active:scale-95 {
											isLightTheme ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-800/60'
										}"
									>
										💖 Super Chat Thanks
									</button>
								</div>
							</div>

							<!-- Voice Synthesis Pitch, Speed & Model Options -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
								<!-- Voice Picker -->
								<div>
									<label for="tts-voice-select" class="block text-[11px] font-semibold mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
										{i18n.t('settings_system_voice')}
									</label>
									<select
										id="tts-voice-select"
										bind:value={ttsVoice}
										class="w-full px-2.5 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-cyan-500 cursor-pointer {
											isLightTheme ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-100'
										}"
									>
										{#if availableTtsVoices.length === 0}
											<option value="">Default Speech Voice</option>
										{:else}
											{#each availableTtsVoices as v}
												<option value={v.name}>{v.name} ({v.lang})</option>
											{/each}
										{/if}
									</select>
								</div>

								<!-- Pitch Slider -->
								<div>
									<div class="flex justify-between text-[11px] font-semibold mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
										<span>{i18n.t('settings_voice_pitch')}</span>
										<span class="font-mono text-cyan-400 font-bold">{ttsPitch.toFixed(1)}x</span>
									</div>
									<input
										type="range"
										min="0.5"
										max="2.0"
										step="0.1"
										bind:value={ttsPitch}
										class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
									/>
									<div class="flex justify-between text-[9px] text-zinc-500 font-mono mt-0.5">
										<span>{i18n.t('settings_pitch_deep')}</span>
										<span>{i18n.t('settings_pitch_normal')}</span>
										<span>{i18n.t('settings_pitch_high')}</span>
									</div>
								</div>

								<!-- Speed / Rate Slider -->
								<div>
									<div class="flex justify-between text-[11px] font-semibold mb-1 {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
										<span>{i18n.t('settings_voice_speed')}</span>
										<span class="font-mono text-pink-400 font-bold">{ttsRate.toFixed(1)}x</span>
									</div>
									<input
										type="range"
										min="0.5"
										max="2.0"
										step="0.1"
										bind:value={ttsRate}
										class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-400"
									/>
									<div class="flex justify-between text-[9px] text-zinc-500 font-mono mt-0.5">
										<span>{i18n.t('settings_speed_slow')}</span>
										<span>{i18n.t('settings_speed_normal')}</span>
										<span>{i18n.t('settings_speed_fast')}</span>
									</div>
								</div>
							</div>

							<!-- Formant DSP Voice Changer Integration Button -->
							<div class="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 {
								isLightTheme ? 'bg-cyan-50/60 border-cyan-200' : 'bg-cyan-950/20 border-cyan-800/40'
							}">
								<div>
									<span class="font-bold text-xs text-cyan-400 block">Uji Sintesis Suara via DSP Voice Changer Filter</span>
									<span class="text-[10px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
										Menyalurkan sintesis suara teks langsung melewati filter DSP Voice Changer aktif ({rigging.voiceFilter})
									</span>
								</div>

								<button
									type="button"
									onclick={() => handleFormantSpeak()}
									class="px-3.5 py-2 bg-pink-500 hover:bg-pink-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
								>
									<Sparkles class="w-3.5 h-3.5" />
									<span>Tes via DSP ({rigging.voiceFilter})</span>
								</button>
							</div>
						</div>

						<!-- Real Web Audio API Microphone Engine -->
						<div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
									<Mic class="w-4 h-4 text-emerald-400" />
									<span>Microphone Engine (Web Audio API)</span>
								</h3>
								<button
									onclick={toggleMicrophone}
									class="px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors {
										rigging.isMicActive
											? 'bg-emerald-500 text-zinc-950 font-bold'
											: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
									}"
								>
									{#if rigging.isMicActive}
										<Mic class="w-3.5 h-3.5" />
										<span>{i18n.t('badge_active')}</span>
									{:else}
										<MicOff class="w-3.5 h-3.5" />
										<span>{i18n.t('badge_inactive')}</span>
									{/if}
								</button>
							</div>

							<!-- Device Selector -->
							<div class="space-y-1">
								<div class="flex items-center justify-between">
									<label for="mic-select" class="block text-xs text-zinc-400 font-medium">{i18n.t('mic_input_label')}</label>
									<button
										onclick={() => refreshDevices(true)}
										class="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
										title={i18n.t('refresh_devices')}
									>
										<RefreshCw class="w-3 h-3" />
										<span>{i18n.t('refresh_devices')}</span>
									</button>
								</div>
								<select
									id="mic-select"
									bind:value={rigging.audioDeviceId}
									onchange={handleMicDeviceChange}
									class="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
								>
									<option value="">Default Microphone</option>
									{#each availableMics as mic}
										<option value={mic.deviceId}>{mic.label}</option>
									{/each}
								</select>
							</div>

							<!-- Real-Time VU Meter -->
							<div class="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800/80 space-y-1.5">
								<div class="flex items-center justify-between text-xs">
									<span class="text-zinc-400">{i18n.t('vu_meter_label')}</span>
									<span class="font-mono text-[11px] text-emerald-400 font-bold">
										{Math.round(rigging.micVolumeLevel * 100)}%
									</span>
								</div>
								<div class="w-full h-3 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
									<div
										class="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
										style="width: {Math.max(2, Math.min(100, rigging.micVolumeLevel * 100))}%"
									></div>
								</div>
							</div>

							<!-- Mic Gain & Monitoring Controls -->
							<div class="space-y-3 pt-1">
								<div>
									<div class="flex justify-between text-xs mb-1">
										<span class="text-zinc-400">{i18n.t('mic_gain_label')}</span>
										<span class="font-mono text-emerald-400 font-bold">{rigging.micGain.toFixed(1)}x</span>
									</div>
									<input
										type="range"
										min="0.2"
										max="2.5"
										step="0.1"
										value={rigging.micGain}
										oninput={handleMicGainChange}
										class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
									/>
								</div>

								<div class="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs space-y-1.5">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											{#if rigging.isMicMonitorActive}
												<Volume2 class="w-4 h-4 text-emerald-400" />
											{:else}
												<VolumeX class="w-4 h-4 text-zinc-500" />
											{/if}
											<span class="text-zinc-200 font-semibold">{i18n.t('mic_monitor_label')}</span>
										</div>
										<button
											onclick={toggleMicMonitor}
											class="px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 {
												rigging.isMicMonitorActive
													? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-sm'
													: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700/60'
											}"
										>
											<span>{rigging.isMicMonitorActive ? i18n.t('settings_monitor_on') : i18n.t('settings_monitor_mute')}</span>
										</button>
									</div>
									<p class="text-[10px] text-zinc-400 leading-normal">
										{i18n.t('settings_monitor_desc')}
									</p>
								</div>
							</div>

							<!-- Interactive Mic Test & DSP Conversion Test Widget -->
							<div class="p-3.5 bg-zinc-950/90 rounded-2xl border border-emerald-500/30 space-y-3">
								<div class="flex items-center justify-between">
									<h4 class="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
										<Volume1 class="w-4 h-4 text-emerald-400" />
										<span>{i18n.t('mic_test_title')}</span>
									</h4>
									{#if isRecordingTest}
										<span class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[10px] animate-pulse">
											<span class="w-2 h-2 rounded-full bg-rose-500"></span>
											{testRecordSeconds}s {i18n.t('settings_recording_short')}
										</span>
									{:else if hasTestSample}
										<span class="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px]">
											{i18n.t('settings_sample_saved')}
										</span>
									{/if}
								</div>

								<p class="text-[10px] text-zinc-400 leading-relaxed">
									{i18n.t('mic_test_desc')}
								</p>

								<!-- Action Buttons -->
								<div class="space-y-2">
									{#if !isRecordingTest}
										<button
											onclick={handleRecordSample}
											class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
										>
											<Mic class="w-3.5 h-3.5 text-emerald-400" />
											<span>{hasTestSample ? i18n.t('settings_rerecord_sample') : i18n.t('mic_record_btn')}</span>
										</button>
									{:else}
										<div class="w-full py-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold text-center animate-pulse">
											{i18n.t('settings_recording_in_progress')} ({testRecordSeconds}s)
										</div>
									{/if}

									{#if hasTestSample}
										<div class="grid grid-cols-2 gap-2 pt-1">
											<button
												onclick={handlePlayRawSample}
												disabled={isPlayingTest && testPlaybackMode === 'raw'}
												class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-xl text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
											>
												<Play class="w-3 h-3 text-cyan-400" />
												<span>{i18n.t('mic_play_raw')}</span>
											</button>

											<button
												onclick={handlePlayConvertedSample}
												disabled={isPlayingTest && testPlaybackMode === 'converted'}
												class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 rounded-xl text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
											>
												<Sparkles class="w-3 h-3 text-pink-400" />
												<span>{i18n.t('mic_play_dsp')}</span>
											</button>
										</div>

										{#if isPlayingTest}
											<div class="flex items-center justify-between pt-1">
												<span class="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
													<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
													Playing: {testPlaybackMode === 'raw' ? 'Hardware Mic Raw' : 'DSP Voice: ' + rigging.voiceFilter}
												</span>
												<button
													onclick={handleStopTestPlayback}
													class="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
												>
													<StopSquare class="w-3 h-3" />
													<span>Stop</span>
												</button>
											</div>
										{/if}
									{/if}
								</div>

								<!-- Test Voice Changer by Text (TTS Formant Synthesis) -->
								<div class="pt-2.5 border-t border-zinc-800/80 space-y-2">
									<div class="flex items-center justify-between">
										<span class="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
											<Sparkles class="w-3.5 h-3.5 text-cyan-400" />
											Uji Voice Changer Lewat Teks (Tanpa Mic)
										</span>
										<span class="text-[9px] px-1.5 py-0.2 rounded font-mono bg-cyan-500/20 text-cyan-300">Formant TTS</span>
									</div>

									<div class="flex gap-1.5">
										<input
											type="text"
											bind:value={testTtsText}
											placeholder="Ketik kalimat untuk uji suara..."
											class="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
										/>
										<button
											type="button"
											onclick={handleTestByText}
											disabled={isPlayingTest}
											class="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-sm shrink-0"
										>
											<Play class="w-3 h-3" />
											<span>Tes Teks</span>
										</button>
									</div>

									<!-- Quick preset phrases -->
									<div class="flex items-center gap-1.5 flex-wrap">
										<span class="text-[9px] text-zinc-500 font-medium">{i18n.t('settings_quick_examples')}</span>
										<button
											type="button"
											onclick={() => { testTtsText = i18n.t('tts_sample_kawaii'); handleTestByText(); }}
											class="text-[9px] px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-pink-300 border border-pink-500/30 cursor-pointer"
										>
											🌸 {i18n.t('tts_preset_kawaii')}
										</button>
										<button
											type="button"
											onclick={() => { testTtsText = i18n.t('tts_sample_ikemen'); handleTestByText(); }}
											class="text-[9px] px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 cursor-pointer"
										>
											🎙️ {i18n.t('tts_preset_ikemen')}
										</button>
										<button
											type="button"
											onclick={() => { testTtsText = i18n.t('tts_sample_robot'); handleTestByText(); }}
											class="text-[9px] px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-violet-300 border border-violet-500/30 cursor-pointer"
										>
											🤖 {i18n.t('tts_preset_robot')}
										</button>
									</div>
								</div>
							</div>
						</div>

						<!-- Web Audio DSP Voice Models (Categorized Grid) -->
						<div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
									<Sparkles class="w-4 h-4 text-pink-400" />
									<span>{i18n.t('voice_changer_title')}</span>
								</h3>
								<span class="text-[10px] text-zinc-500 font-mono">Web Audio DSP</span>
							</div>

							<!-- 1. Anime Models -->
							<div class="space-y-1.5">
								<span class="text-[10px] font-semibold text-pink-400 uppercase tracking-wider block">
									★ {i18n.t('voice_cat_anime')}
								</span>
								<div class="grid grid-cols-2 gap-2 text-xs">
									{#each VOICE_MODELS.filter((m) => m.category === 'anime') as model}
										<button
											type="button"
											onclick={() => handleVoiceFilterChange(model.id)}
											class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between {
												rigging.voiceFilter === model.id
													? 'bg-pink-500/20 text-pink-200 border-pink-500/60 shadow-md ring-1 ring-pink-500/30'
													: 'bg-zinc-950 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-900'
											}"
										>
											<div class="flex items-center justify-between w-full mb-1">
												<span class="font-bold text-xs">{model.name}</span>
												<span class="text-[9px] px-1.5 py-0.2 rounded font-mono bg-pink-500/20 text-pink-300">{model.badge}</span>
											</div>
											<p class="text-[10px] text-zinc-400 leading-tight mb-1.5">{model.desc}</p>
											<div class="flex items-center gap-1">
												<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-pink-300 border border-pink-500/30 font-semibold">{model.pitchInfo}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>

							<!-- 2. Studio & Broadcast Models -->
							<div class="space-y-1.5 pt-1">
								<span class="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
									★ {i18n.t('voice_cat_studio')}
								</span>
								<div class="grid grid-cols-2 gap-2 text-xs">
									{#each VOICE_MODELS.filter((m) => m.category === 'studio') as model}
										<button
											type="button"
											onclick={() => handleVoiceFilterChange(model.id)}
											class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between {
												rigging.voiceFilter === model.id
													? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
													: 'bg-zinc-950 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-900'
											}"
										>
											<div class="flex items-center justify-between w-full mb-1">
												<span class="font-bold text-xs">{model.name}</span>
												<span class="text-[9px] px-1.5 py-0.2 rounded font-mono bg-cyan-500/20 text-cyan-300">{model.badge}</span>
											</div>
											<p class="text-[10px] text-zinc-400 leading-tight mb-1.5">{model.desc}</p>
											<div class="flex items-center gap-1">
												<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-cyan-300 border border-cyan-500/30 font-semibold">{model.pitchInfo}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>

							<!-- 3. Creative FX & Ambience -->
							<div class="space-y-1.5 pt-1">
								<span class="text-[10px] font-semibold text-violet-400 uppercase tracking-wider block">
									★ {i18n.t('voice_cat_effects')}
								</span>
								<div class="grid grid-cols-2 gap-2 text-xs">
									{#each VOICE_MODELS.filter((m) => m.category === 'effects') as model}
										<button
											type="button"
											onclick={() => handleVoiceFilterChange(model.id)}
											class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between {
												rigging.voiceFilter === model.id
													? 'bg-violet-500/20 text-violet-200 border-violet-500/60 shadow-md ring-1 ring-violet-500/30'
													: 'bg-zinc-950 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-900'
											}"
										>
											<div class="flex items-center justify-between w-full mb-1">
												<span class="font-bold text-xs">{model.name}</span>
												<span class="text-[9px] px-1.5 py-0.2 rounded font-mono bg-violet-500/20 text-violet-300">{model.badge}</span>
											</div>
											<p class="text-[10px] text-zinc-400 leading-tight mb-1.5">{model.desc}</p>
											<div class="flex items-center gap-1">
												<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-violet-300 border border-violet-500/30 font-semibold">{model.pitchInfo}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>

							<!-- W-Okada AI RVC Architecture Card -->
							<div class="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-1.5 mt-2">
								<h4 class="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
									<ExternalLink class="w-3.5 h-3.5" />
									{i18n.t('rvc_guide_title')}
								</h4>
								<p class="text-[11px] text-zinc-400 leading-relaxed">
									{i18n.t('rvc_guide_desc')}
								</p>
								<div class="p-2 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300">
									[Mic] &rarr; [W-Okada AI RVC (CUDA)] &rarr; [VB-CABLE Virtual Input] &rarr; [OBS Studio]
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 4: THEME SELECTOR & PALETTE STUDIO -->
				{:else if activeTab === 'theme'}
					<div class="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
						<!-- Theme Header & Category Filter Bar -->
						<div class="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
						}">
							<div class="flex items-center gap-3">
								<div class="p-2.5 rounded-xl bg-pink-500/20 text-pink-500 border border-pink-500/30 shrink-0">
									<Palette class="w-5 h-5" />
								</div>
								<div>
									<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										{i18n.t('themes_palette_catalog')}
										<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-pink-500/15 text-pink-500 border border-pink-500/30">
											{UI_THEMES.length} {i18n.t('themes_available')}
										</span>
									</h3>
									<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5">
										{i18n.t('settings_theme_palette_desc')}
									</p>
								</div>
							</div>

							<!-- Category Filter Pills -->
							<div class="flex items-center gap-1 p-1 rounded-xl border shrink-0 {
								isLightTheme ? 'bg-zinc-200/60 border-zinc-300' : 'bg-zinc-950 border-zinc-800'
							}">
								<button
									type="button"
									onclick={() => (appearanceThemeCategory = 'all')}
									class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer {
										appearanceThemeCategory === 'all'
											? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm'
											: isLightTheme ? 'text-zinc-700 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
									}"
								>
									<span>Semua</span>
									<span class="text-[10px] px-1 rounded font-mono {appearanceThemeCategory === 'all' ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800/80 text-zinc-400'}">{allSelectableThemes.length}</span>
								</button>
								<button
									type="button"
									onclick={() => (appearanceThemeCategory = 'light')}
									class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer {
										appearanceThemeCategory === 'light'
											? 'bg-amber-400 text-amber-950 font-bold shadow-sm'
											: isLightTheme ? 'text-zinc-700 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
									}"
								>
									<Sun class="w-3.5 h-3.5" />
									<span>Daylight</span>
									<span class="text-[10px] px-1 rounded font-mono {appearanceThemeCategory === 'light' ? 'bg-amber-950/20 text-amber-950 font-bold' : 'bg-zinc-800/80 text-zinc-400'}">{lightThemes.length}</span>
								</button>
								<button
									type="button"
									onclick={() => (appearanceThemeCategory = 'dark')}
									class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer {
										appearanceThemeCategory === 'dark'
											? 'bg-indigo-500 text-white font-bold shadow-sm'
											: isLightTheme ? 'text-zinc-700 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
									}"
								>
									<Moon class="w-3.5 h-3.5" />
									<span>Dark</span>
									<span class="text-[10px] px-1 rounded font-mono {appearanceThemeCategory === 'dark' ? 'bg-white/20 text-white font-bold' : 'bg-zinc-800/80 text-zinc-400'}">{darkThemes.length}</span>
								</button>
								<button
									type="button"
									onclick={() => (appearanceThemeCategory = 'custom')}
									class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer {
										appearanceThemeCategory === 'custom'
											? 'bg-pink-500 text-white font-bold shadow-sm'
											: isLightTheme ? 'text-zinc-700 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
									}"
								>
									<Wand2 class="w-3.5 h-3.5" />
									<span>Custom Studio</span>
								</button>
							</div>
						</div>

						<!-- THEMES GRID (ALL / LIGHT / DARK) -->
						{#if appearanceThemeCategory !== 'custom'}
							{@const displayList = appearanceThemeCategory === 'all' ? allSelectableThemes : (appearanceThemeCategory === 'light' ? lightThemes : darkThemes)}
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-150">
								{#each displayList as theme}
									{@const isSelected = rigging.uiTheme === theme.id}
									<button
										type="button"
										onclick={() => {
											playSfx('theme');
											rigging.setUITheme(theme.id);
										}}
										class="flex flex-col p-3.5 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden {
											isSelected
												? 'ring-2 ring-cyan-400 shadow-xl border-cyan-400'
												: isLightTheme
												? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 shadow-sm'
												: 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/90 shadow-md'
										}"
									>
										<!-- Realistic Mini UI Preview Box -->
										<div
											class="w-full h-22 rounded-xl border p-2 flex flex-col justify-between mb-3 shadow-inner relative overflow-hidden transition-transform group-hover:scale-[1.01]"
											style="background-color: {theme.palette.bg}; border-color: {theme.palette.border}; color: {theme.palette.text};"
										>
											<!-- Mini Mockup Top Bar -->
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-1.5">
													<div class="w-2.5 h-2.5 rounded-full" style="background-color: {theme.palette.accent};"></div>
													<span class="text-[10px] font-bold font-mono tracking-wider opacity-90 truncate max-w-[110px]" style="color: {theme.palette.text};">
														{theme.name}
													</span>
												</div>
												<span
													class="text-[8px] px-1.5 py-0.5 rounded font-mono font-semibold"
													style="background-color: {theme.palette.surface}; color: {theme.palette.accent}; border: 1px solid {theme.palette.border};"
												>
													{theme.badge}
												</span>
											</div>

											<!-- Mini Mockup Center Surface Card -->
											<div
												class="p-1.5 rounded-lg border flex items-center justify-between shadow-xs"
												style="background-color: {theme.palette.surface}; border-color: {theme.palette.border};"
											>
												<div class="flex items-center gap-1.5">
													<div class="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-bold" style="background-color: {theme.palette.accent}; color: {theme.palette.bg};">
														★
													</div>
													<span class="text-[9px] font-semibold" style="color: {theme.palette.text};">MiruNova Rig</span>
												</div>
												<!-- Mini active toggle -->
												<div class="w-4.5 h-2.5 rounded-full flex items-center px-0.5" style="background-color: {theme.palette.accent};">
													<div class="w-1.5 h-1.5 rounded-full ml-auto" style="background-color: {theme.palette.bg};"></div>
												</div>
											</div>

											<!-- Mini Mockup Bottom Dock Strip -->
											<div class="flex items-center gap-1">
												<div class="w-4 h-2 rounded" style="background-color: {theme.palette.accent};"></div>
												<div class="w-4 h-2 rounded opacity-70" style="background-color: {theme.palette.border};"></div>
												<div class="w-4 h-2 rounded opacity-90" style="background-color: {theme.palette.surface};"></div>
											</div>
										</div>

										<!-- Theme Info Row -->
										<div class="flex items-center justify-between w-full mb-1">
											<span class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
												{theme.name}
											</span>
											{#if isSelected}
												<div class="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-400 text-zinc-950 font-bold text-[9px] shadow-sm">
													<Check class="w-3 h-3 stroke-[3]" />
													<span>AKTIF</span>
												</div>
											{/if}
										</div>

										<p class="text-[10px] leading-relaxed mb-2.5 {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
											{theme.desc}
										</p>

										<!-- Palette Swatches Bottom Bar -->
										<div class="mt-auto pt-2 border-t flex items-center gap-1.5 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
											<div class="w-3 h-3 rounded-full border border-zinc-500/40" style="background-color: {theme.palette.bg};" title="Background"></div>
											<div class="w-3 h-3 rounded-full border border-zinc-500/40" style="background-color: {theme.palette.surface};" title="Surface Card"></div>
											<div class="w-3 h-3 rounded-full border border-zinc-500/40" style="background-color: {theme.palette.accent};" title="Accent Highlight"></div>
											<div class="w-3 h-3 rounded-full border border-zinc-500/40" style="background-color: {theme.palette.border};" title="Border"></div>
											<div class="w-3 h-3 rounded-full border border-zinc-500/40" style="background-color: {theme.palette.text};" title="Text Color"></div>
											<span class="text-[9px] font-mono ml-auto {isLightTheme ? 'text-zinc-500 font-semibold' : 'text-zinc-500'}">
												{theme.bgHex}
											</span>
										</div>
									</button>
								{/each}
							</div>

						<!-- CUSTOM THEME STUDIO -->
						{:else}
							<div class="p-4 sm:p-5 rounded-2xl border space-y-4 sm:space-y-5 animate-in fade-in duration-150 {
								isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
							}">
								<!-- One-Click Presets -->
								<div>
									<div class="flex items-center justify-between mb-2">
										<span class="text-xs font-bold uppercase tracking-wider {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
											{i18n.t('themes_presets_1click')}
										</span>
										<span class="text-[10px] text-zinc-500">{i18n.t('themes_presets_sub')}</span>
									</div>
									<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
										{#each customPresets as preset}
											<button
												type="button"
												onclick={() => {
													playSfx('theme');
													applyCustomPreset(preset);
												}}
												class="p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer hover:scale-102 active:scale-98 shadow-sm {
													isLightTheme
														? 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800'
														: 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 text-zinc-200'
												}"
											>
												<span class="font-bold text-[11px] truncate mb-2">{preset.name}</span>
												<div class="flex items-center gap-1">
													<div class="w-3 h-3 rounded-full border border-zinc-400/40" style="background-color: {preset.bg};"></div>
													<div class="w-3 h-3 rounded-full border border-zinc-400/40" style="background-color: {preset.accent};"></div>
													<div class="w-3 h-3 rounded-full border border-zinc-400/40 ml-auto" style="background-color: {preset.text};"></div>
												</div>
											</button>
										{/each}
									</div>
								</div>

								<!-- Live Custom Color Pickers & Live Preview Split -->
								<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-3 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
									<!-- Pickers (2 Cols) -->
									<div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
										<!-- Background -->
										<div class="p-3 rounded-xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
											<span class="text-xs font-semibold block {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">{i18n.t('theme_custom_bg')}</span>
											<div class="flex items-center gap-2">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.bg}
													oninput={() => {
														rigging.setCustomThemeColors({ bg: rigging.customThemeConfig.bg });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
												/>
												<input
													type="text"
													bind:value={rigging.customThemeConfig.bg}
													onchange={() => {
														rigging.setCustomThemeColors({ bg: rigging.customThemeConfig.bg });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="flex-1 px-2 py-1 rounded-lg border text-xs font-mono uppercase {isLightTheme ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}"
												/>
											</div>
										</div>

										<!-- Surface -->
										<div class="p-3 rounded-xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
											<span class="text-xs font-semibold block {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">{i18n.t('theme_custom_surface')}</span>
											<div class="flex items-center gap-2">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.surface}
													oninput={() => {
														rigging.setCustomThemeColors({ surface: rigging.customThemeConfig.surface });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
												/>
												<input
													type="text"
													bind:value={rigging.customThemeConfig.surface}
													onchange={() => {
														rigging.setCustomThemeColors({ surface: rigging.customThemeConfig.surface });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="flex-1 px-2 py-1 rounded-lg border text-xs font-mono uppercase {isLightTheme ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}"
												/>
											</div>
										</div>

										<!-- Accent -->
										<div class="p-3 rounded-xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
											<span class="text-xs font-semibold block {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">{i18n.t('theme_custom_accent')}</span>
											<div class="flex items-center gap-2">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.accent}
													oninput={() => {
														rigging.setCustomThemeColors({ accent: rigging.customThemeConfig.accent });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
												/>
												<input
													type="text"
													bind:value={rigging.customThemeConfig.accent}
													onchange={() => {
														rigging.setCustomThemeColors({ accent: rigging.customThemeConfig.accent });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="flex-1 px-2 py-1 rounded-lg border text-xs font-mono uppercase {isLightTheme ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}"
												/>
											</div>
										</div>

										<!-- Border -->
										<div class="p-3 rounded-xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
											<span class="text-xs font-semibold block {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">{i18n.t('theme_custom_border')}</span>
											<div class="flex items-center gap-2">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.border}
													oninput={() => {
														rigging.setCustomThemeColors({ border: rigging.customThemeConfig.border });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
												/>
												<input
													type="text"
													bind:value={rigging.customThemeConfig.border}
													onchange={() => {
														rigging.setCustomThemeColors({ border: rigging.customThemeConfig.border });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="flex-1 px-2 py-1 rounded-lg border text-xs font-mono uppercase {isLightTheme ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}"
												/>
											</div>
										</div>

										<!-- Text -->
										<div class="p-3 rounded-xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
											<span class="text-xs font-semibold block {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">{i18n.t('theme_custom_text')}</span>
											<div class="flex items-center gap-2">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.text}
													oninput={() => {
														rigging.setCustomThemeColors({ text: rigging.customThemeConfig.text });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
												/>
												<input
													type="text"
													bind:value={rigging.customThemeConfig.text}
													onchange={() => {
														rigging.setCustomThemeColors({ text: rigging.customThemeConfig.text });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="flex-1 px-2 py-1 rounded-lg border text-xs font-mono uppercase {isLightTheme ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}"
												/>
											</div>
										</div>

										<!-- Action Button -->
										<div class="flex items-end">
											<button
												type="button"
												onclick={() => {
													playSfx('theme');
													rigging.setUITheme('custom');
												}}
												class="w-full py-2.5 px-3 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 {
													rigging.uiTheme === 'custom'
														? 'bg-pink-500 text-white'
														: isLightTheme ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
												}"
											>
												{#if rigging.uiTheme === 'custom'}
													<Check class="w-4 h-4 stroke-[3]" />
													<span>{i18n.t('themes_applied_badge')}</span>
												{:else}
													<Wand2 class="w-4 h-4" />
													<span>{i18n.t('themes_apply_btn')}</span>
												{/if}
											</button>
										</div>
									</div>

									<!-- Live Custom Preview Card (1 Col) -->
									<div
										class="p-4 rounded-2xl border flex flex-col justify-between shadow-xl"
										style="background-color: {rigging.customThemeConfig.bg}; border-color: {rigging.customThemeConfig.border}; color: {rigging.customThemeConfig.text};"
									>
										<div class="flex items-center justify-between border-b pb-2 mb-3" style="border-color: {rigging.customThemeConfig.border};">
											<div class="flex items-center gap-2">
												<div class="w-3 h-3 rounded-full" style="background-color: {rigging.customThemeConfig.accent};"></div>
												<span class="font-bold text-xs font-mono" style="color: {rigging.customThemeConfig.text};">{i18n.t('themes_preview_title')}</span>
											</div>
											<span class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold" style="background-color: {rigging.customThemeConfig.surface}; color: {rigging.customThemeConfig.accent}; border: 1px solid {rigging.customThemeConfig.border};">
												CUSTOM
											</span>
										</div>

										<!-- Mock Surface Box -->
										<div
											class="p-3 rounded-xl border space-y-2 mb-3 shadow-sm"
											style="background-color: {rigging.customThemeConfig.surface}; border-color: {rigging.customThemeConfig.border};"
										>
											<div class="flex items-center justify-between">
												<span class="text-xs font-semibold" style="color: {rigging.customThemeConfig.text};">{i18n.t('themes_palette_card')}</span>
												<div class="w-5 h-2.5 rounded-full flex items-center px-0.5" style="background-color: {rigging.customThemeConfig.accent};">
													<div class="w-1.5 h-1.5 rounded-full ml-auto" style="background-color: {rigging.customThemeConfig.bg};"></div>
												</div>
											</div>
											<p class="text-[10px] opacity-80 leading-relaxed" style="color: {rigging.customThemeConfig.text};">
												{i18n.t('themes_mock_desc')}
											</p>
										</div>

										<!-- Mock Buttons -->
										<div class="flex items-center gap-2">
											<div class="flex-1 py-1.5 rounded-lg text-center text-xs font-bold" style="background-color: {rigging.customThemeConfig.accent}; color: {rigging.customThemeConfig.bg};">
												{i18n.t('themes_mock_action')}
											</div>
											<div class="py-1.5 px-3 rounded-lg border text-center text-xs" style="background-color: {rigging.customThemeConfig.surface}; border-color: {rigging.customThemeConfig.border}; color: {rigging.customThemeConfig.text};">
												{i18n.t('cancel_btn')}
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>

				<!-- TAB 5: STAGE & EFFECTS (PANGGUNG & KANVAS) -->
				{:else if activeTab === 'stage'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-150">
						<!-- Dedicated Card: 3D Stage Environments (Lantai Grid, Studio Room, Open Field, Void) -->
						<div class="col-span-1 md:col-span-2 p-4 sm:p-5 rounded-2xl border space-y-4 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800/90 shadow-xl'
						}">
							<div class="flex items-center justify-between border-b pb-3 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
								<div class="flex items-center gap-2.5">
									<div class="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
										<Box class="w-4 h-4" />
									</div>
									<div>
										<h3 class="text-sm font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
											{i18n.t('stage_title')}
										</h3>
										<p class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
											{i18n.t('stage_environments_desc')}
										</p>
									</div>
								</div>

								<span class="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
									3D Active: {rigging.stageEnvironment.toUpperCase()}
								</span>
							</div>

							<!-- 7 Stage Environment Cards Grid -->
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
								<!-- 1. Grid / Lantai Reflektif -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('grid');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_grid_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'grid'
											? 'bg-cyan-500/15 border-cyan-500 ring-2 ring-cyan-500/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-gradient-to-b from-cyan-950/60 to-zinc-950 border border-cyan-800/40 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
										<span class="text-2xl">🌐</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_grid_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_grid_desc')}
									</p>
								</button>

								<!-- 2. Room / Studio Kamar VTuber -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('room');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_room_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'room'
											? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-gradient-to-b from-[#fef7ee] to-[#e6d7c3] border border-amber-300/40 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute top-1 left-2 w-4 h-5 rounded-sm bg-pink-300/60 border border-pink-400/50"></div>
										<div class="absolute top-2 right-3 w-3 h-3 rounded-full bg-amber-400/70 shadow-[0_0_8px_#fbbf24]"></div>
										<span class="text-2xl">🏠</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_room_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_room_desc')}
									</p>
								</button>

								<!-- Cafe / Coffee Cafe Shop -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('cafe');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_cafe_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'cafe'
											? 'bg-amber-600/15 border-amber-500 ring-2 ring-amber-500/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-gradient-to-b from-[#3e2723] via-[#4a2e18] to-[#1c1917] border border-amber-700/50 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute top-1 left-2 w-5 h-3 rounded-sm bg-amber-500/30 border border-amber-400/40"></div>
										<div class="absolute bottom-1 right-2 w-3 h-3 rounded-full bg-amber-300/40 shadow-[0_0_6px_#f59e0b]"></div>
										<span class="text-2xl relative z-10">☕</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_cafe_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_cafe_desc')}
									</p>
								</button>

								<!-- Beach / Vivid Happy Vibe Field -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('beach');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_beach_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'beach'
											? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-400/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-gradient-to-b from-sky-400 via-cyan-300 to-amber-200 border border-cyan-400/50 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute bottom-0 inset-x-0 h-4 bg-amber-200"></div>
										<div class="absolute top-1 right-2 w-4 h-4 rounded-full bg-amber-300 shadow-[0_0_10px_#fde047]"></div>
										<span class="text-2xl relative z-10">🏖️</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_beach_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_beach_desc')}
									</p>
								</button>

								<!-- 3. Field / Taman Alam Terbuka -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('field');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_field_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'field'
											? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-200 border border-emerald-400/40 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute bottom-0 inset-x-0 h-6 rounded-t-full bg-gradient-to-b from-emerald-500 to-emerald-700"></div>
										<span class="text-2xl relative z-10">🌱</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_field_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_field_desc')}
									</p>
								</button>

								<!-- 4. Sunset / Pesisir Senja -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('sunset');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_sunset_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'sunset'
											? 'bg-orange-500/15 border-orange-500 ring-2 ring-orange-500/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-gradient-to-b from-amber-500 via-rose-600 to-indigo-950 border border-rose-500/40 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-200 shadow-[0_0_12px_#fde047]"></div>
										<span class="text-2xl relative z-10">🌅</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_sunset_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_sunset_desc')}
									</p>
								</button>

								<!-- 5. Studio / Panggung Konser Idol -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('studio');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_studio_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'studio'
											? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-gradient-to-b from-purple-950 via-zinc-950 to-black border border-purple-500/40 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute top-0 left-2 w-10 h-16 bg-gradient-to-br from-cyan-400/25 to-transparent -rotate-12 pointer-events-none"></div>
										<div class="absolute top-0 right-2 w-10 h-16 bg-gradient-to-bl from-pink-500/25 to-transparent rotate-12 pointer-events-none"></div>
										<span class="text-2xl relative z-10">🎤</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_studio_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_studio_desc')}
									</p>
								</button>

								<!-- 6. Dojo / Tatami Tradisional Jepang -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('dojo');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_dojo_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'dojo'
											? 'bg-rose-400/15 border-rose-400 ring-2 ring-rose-400/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-gradient-to-b from-[#e8dcc8] to-[#ab987a] border border-amber-700/30 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute inset-y-0 left-2 w-5 border-r border-stone-400/60 bg-white/40"></div>
										<div class="absolute inset-y-0 right-2 w-5 border-l border-stone-400/60 bg-white/40"></div>
										<span class="text-2xl relative z-10">⛩️</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_dojo_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_dojo_desc')}
									</p>
								</button>

								<!-- 7. Void / Transparan Minimal -->
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setStageEnvironment('void');
										rigging.showToast(`✓ ${i18n.t('stage_3d_env_toast')} ${i18n.t('stage_void_name')}`);
									}}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 {
										rigging.stageEnvironment === 'void'
											? 'bg-zinc-600/20 border-zinc-400 ring-2 ring-zinc-400/50 shadow-md'
											: isLightTheme
												? 'bg-white hover:bg-zinc-100 border-zinc-200'
												: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800'
									}"
								>
									<div class="w-full h-16 rounded-xl bg-black border border-zinc-700/50 mb-2 flex items-center justify-center relative overflow-hidden">
										<div class="absolute top-2 left-4 w-1 h-1 rounded-full bg-white/80"></div>
										<div class="absolute top-4 right-5 w-1 h-1 rounded-full bg-cyan-300/80"></div>
										<span class="text-2xl relative z-10">🌌</span>
									</div>
									<div class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('stage_void_name')}</div>
									<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5 leading-snug">
										{i18n.t('stage_void_desc')}
									</p>
								</button>
							</div>
						</div>

						<!-- Card: 3D Stage Area Waypoints & Movement (Teleport & Pan) -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/90'
						}">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2.5">
									<div class="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
										<Navigation class="w-4 h-4" />
									</div>
									<div>
										<h3 class="text-sm font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
											{i18n.t('waypoint_section_title')}
										</h3>
										<p class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
											{i18n.t('waypoint_section_desc')}
										</p>
									</div>
								</div>
								<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
									{rigging.activeStageWaypoint}
								</span>
							</div>

							<!-- 6 Waypoints Grid -->
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
								{#each [
									{ id: 'pc' as StageAreaWaypoint, label: i18n.t('waypoint_pc'), desc: i18n.t('waypoint_pc_desc'), emoji: '🖥️' },
									{ id: 'bed' as StageAreaWaypoint, label: i18n.t('waypoint_bed'), desc: i18n.t('waypoint_bed_desc'), emoji: '🛏️' },
									{ id: 'cafe-bar' as StageAreaWaypoint, label: i18n.t('waypoint_cafe_bar'), desc: i18n.t('waypoint_cafe_bar_desc'), emoji: '☕' },
									{ id: 'beach-umbrella' as StageAreaWaypoint, label: i18n.t('waypoint_beach_umbrella'), desc: i18n.t('waypoint_beach_umbrella_desc'), emoji: '🏖️' },
									{ id: 'meadow-flowers' as StageAreaWaypoint, label: i18n.t('waypoint_meadow_flowers'), desc: i18n.t('waypoint_meadow_flowers_desc'), emoji: '🌸' },
									{ id: 'center' as StageAreaWaypoint, label: i18n.t('waypoint_center'), desc: i18n.t('waypoint_center_desc'), emoji: '🎯' }
								] as wp}
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											threeStage.teleportToArea(wp.id);
											rigging.activeStageWaypoint = wp.id;
											rigging.showToast(`${wp.emoji} ${wp.label}`);
										}}
										class="p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 flex items-center gap-2.5 {
											rigging.activeStageWaypoint === wp.id
												? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold ring-1.5 ring-indigo-500/50 shadow-sm'
												: isLightTheme
													? 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100'
													: 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
										}"
									>
										<span class="text-xl shrink-0">{wp.emoji}</span>
										<div class="min-w-0">
											<div class="text-xs font-bold truncate">{wp.label}</div>
											<div class="text-[10px] text-zinc-400 truncate mt-0.5">{wp.desc}</div>
										</div>
									</button>
								{/each}
							</div>

							<!-- Manual Stage Movement Row -->
							<div class="pt-3 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'} flex items-center justify-between gap-3">
								<div class="space-y-0.5">
									<div class="text-xs font-bold {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
										{i18n.t('stage_move_manual_title')}
									</div>
									<div class="text-[10px] text-zinc-500 font-mono">
										Offset: X: {threeStage.modelOffsetX.toFixed(2)} | Z: {threeStage.modelOffsetZ.toFixed(2)}
									</div>
								</div>

								<div class="flex items-center gap-1.5">
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											threeStage.moveModel(-0.3, 0);
											rigging.showToast(`← ${i18n.t('stage_move_left')}`);
										}}
										class="p-2 rounded-xl border cursor-pointer active:scale-95 {
											isLightTheme ? 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200'
										}"
										title={i18n.t('stage_move_left')}
									>
										<ChevronLeft class="w-4 h-4" />
									</button>
									<div class="flex flex-col gap-1">
										<button
											type="button"
											onclick={() => {
												playSfx('click');
												threeStage.moveModel(0, 0.3);
												rigging.showToast(`↑ ${i18n.t('stage_move_forward')}`);
											}}
											class="p-1 rounded-lg border cursor-pointer active:scale-95 {
												isLightTheme ? 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200'
											}"
											title={i18n.t('stage_move_forward')}
										>
											<ChevronUp class="w-3.5 h-3.5" />
										</button>
										<button
											type="button"
											onclick={() => {
												playSfx('click');
												threeStage.moveModel(0, -0.3);
												rigging.showToast(`↓ ${i18n.t('stage_move_backward')}`);
											}}
											class="p-1 rounded-lg border cursor-pointer active:scale-95 {
												isLightTheme ? 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200'
											}"
											title={i18n.t('stage_move_backward')}
										>
											<ChevronDown class="w-3.5 h-3.5" />
										</button>
									</div>
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											threeStage.moveModel(0.3, 0);
											rigging.showToast(`→ ${i18n.t('stage_move_right')}`);
										}}
										class="p-2 rounded-xl border cursor-pointer active:scale-95 {
											isLightTheme ? 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200'
										}"
										title={i18n.t('stage_move_right')}
									>
										<ChevronRight class="w-4 h-4" />
									</button>
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											threeStage.resetModelPosition();
											rigging.activeStageWaypoint = 'center';
											rigging.showToast(`🎯 ${i18n.t('stage_move_reset')}`);
										}}
										class="p-2 rounded-xl border cursor-pointer active:scale-95 text-indigo-400 {
											isLightTheme ? 'bg-white border-zinc-300 hover:bg-zinc-100' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800'
										}"
										title={i18n.t('stage_move_reset')}
									>
										<Crosshair class="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>

						<!-- Card 1: Latar Belakang & Efek Layar -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/90'
						}">
							<div class="flex items-center gap-2.5">
								<div class="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-500">
									<Layers class="w-4 h-4" />
								</div>
								<div>
									<h3 class="text-sm font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										{i18n.t('stage_backdrop_title')}
									</h3>
									<p class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
										{i18n.t('stage_backdrop_desc')}
									</p>
								</div>
							</div>

							<!-- Visual Background Style Cards Grid -->
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
										{i18n.t('bg_mode')}
									</span>
									<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
										{rigging.backgroundStyle.toUpperCase()}
									</span>
								</div>

								<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
									{#each backgroundStyleCards as card}
										{@const isSelected = rigging.backgroundStyle === card.id}
										<button
											type="button"
											onclick={() => {
												rigging.backgroundStyle = card.id;
												rigging.persist();
												playSfx('click');
												if (card.id === 'custom-image' && !rigging.customBgUrl) {
													stageWallpaperInput?.click();
												}
											}}
											class="group relative flex flex-col p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer overflow-hidden {
												isSelected
													? 'border-sky-500 bg-sky-500/15 shadow-md ring-1 ring-sky-500/50'
													: isLightTheme
														? 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
														: 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300'
											}"
										>
											<!-- Miniature Visual Preview Box -->
											<div class="w-full h-11 rounded-lg border border-zinc-700/60 overflow-hidden mb-1.5 relative flex items-center justify-center shadow-inner {card.previewClass}"
												style={card.id === 'solid' ? `background-color: ${rigging.backgroundColor};` : (card.id === 'custom-image' && rigging.customBgUrl ? `background-image: url(${rigging.customBgUrl}); background-size: cover; background-position: center;` : '')}
											>
												{#if card.id === 'solid'}
													<span class="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-black/60 text-white backdrop-blur-xs">
														{rigging.backgroundColor}
													</span>
												{:else if card.id === 'transparent'}
													<span class="text-[8px] font-bold px-1 py-0.2 rounded bg-black/60 text-zinc-300 backdrop-blur-xs">
														PNG Alpha
													</span>
												{:else if card.id === 'chroma'}
													<span class="text-[8px] font-bold px-1 py-0.2 rounded bg-black/60 text-green-300 backdrop-blur-xs">
														Chroma Key
													</span>
												{:else if card.id === 'custom-image' && !rigging.customBgUrl}
													<span class="text-[8px] font-medium px-1 py-0.2 rounded bg-black/60 text-zinc-300 backdrop-blur-xs">
														+ Foto
													</span>
												{/if}

												{#if isSelected}
													<div class="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-sky-500 text-zinc-950 flex items-center justify-center shadow">
														<Check class="w-2.5 h-2.5 stroke-[3]" />
													</div>
												{/if}
											</div>

											<!-- Label & Description -->
											<span class="text-[11px] font-bold leading-tight truncate {isSelected ? 'text-sky-300' : isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
												{card.label}
											</span>
											<span class="text-[9px] text-zinc-400 leading-tight mt-0.5 line-clamp-1">
												{card.desc}
											</span>
										</button>
									{/each}
								</div>
								<input
									type="file"
									bind:this={stageWallpaperInput}
									onchange={handleStageWallpaperUpload}
									accept="image/*"
									class="hidden"
								/>
							</div>

							<!-- Custom Wallpaper Upload Box if custom-image is selected -->
							{#if rigging.backgroundStyle === 'custom-image'}
								<div class="p-3 rounded-xl border flex items-center justify-between gap-3 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
									<div class="text-xs">
										<span class="font-semibold block {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">{i18n.t('settings_custom_bg_label')}</span>
										<span class="text-[11px] text-zinc-400">
											{rigging.customBgUrl ? i18n.t('settings_custom_bg_active') : i18n.t('settings_custom_bg_empty')}
										</span>
									</div>
									<button
										type="button"
										onclick={() => stageWallpaperInput?.click()}
										class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
									>
										<Upload class="w-3.5 h-3.5" />
										<span>{rigging.customBgUrl ? i18n.t('settings_custom_bg_change') : i18n.t('settings_custom_bg_pick')}</span>
									</button>
								</div>
							{/if}

							<!-- Solid Background Color Picker (If solid selected) -->
							{#if rigging.backgroundStyle === 'solid'}
								<div class="p-3 rounded-xl border space-y-2 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
									<span class="text-xs font-semibold block {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
										{i18n.t('settings_solid_color_label')}
									</span>
									<div class="flex items-center gap-2">
										<input
											type="color"
											bind:value={rigging.backgroundColor}
											oninput={() => rigging.persist()}
											class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.backgroundColor}
											onchange={() => rigging.persist()}
											class="flex-1 px-3 py-1.5 rounded-lg border text-xs font-mono uppercase {isLightTheme ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}"
										/>
									</div>
								</div>
							{/if}

							<!-- Screen Effects Selector -->
							<div class="space-y-1.5 pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
								<label for="screen-effect-select" class="block text-xs font-semibold {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
									{i18n.t('settings_screen_effects_label')}
								</label>
								<select
									id="screen-effect-select"
									bind:value={rigging.screenEffect}
									onchange={() => rigging.persist()}
									class="w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:border-sky-500 cursor-pointer {
										isLightTheme ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-100'
									}"
								>
									<option value="none">{i18n.t('fx_none')}</option>
									<option value="vignette">{i18n.t('fx_vignette')}</option>
									<option value="scanlines">{i18n.t('fx_scanlines')}</option>
									<option value="crt">{i18n.t('fx_crt')}</option>
									<option value="blur">{i18n.t('fx_blur')}</option>
								</select>
							</div>
						</div>

						<!-- Card 2: Framing, Sound Effects & Bahasa -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/90'
						}">
							<div class="flex items-center gap-2.5">
								<div class="p-2 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-500">
									<SlidersHorizontal class="w-4 h-4" />
								</div>
								<div>
									<h3 class="text-sm font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										{i18n.t('settings_framing_audio')}
									</h3>
									<p class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
										{i18n.t('settings_framing_audio_desc')}
									</p>
								</div>
							</div>

							<!-- Framing Preset -->
							<div class="space-y-1.5">
								<span class="text-xs font-semibold block {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
									{i18n.t('framing_mode_label')}
								</span>
								<div class="grid grid-cols-3 gap-2">
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											rigging.setFramingMode('full');
										}}
										class="px-2 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer {
											rigging.framingMode === 'full'
												? isLightTheme
													? 'bg-sky-100 text-sky-800 border-sky-400 font-bold shadow-sm'
													: 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
												: isLightTheme
												? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
												: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
										}"
									>
										{i18n.t('framing_full')}
									</button>
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											rigging.setFramingMode('half');
										}}
										class="px-2 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer {
											rigging.framingMode === 'half'
												? isLightTheme
													? 'bg-sky-100 text-sky-800 border-sky-400 font-bold shadow-sm'
													: 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
												: isLightTheme
												? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
												: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
										}"
									>
										{i18n.t('framing_half')}
									</button>
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											rigging.setFramingMode('closeup');
										}}
										class="px-2 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer {
											rigging.framingMode === 'closeup'
												? isLightTheme
													? 'bg-sky-100 text-sky-800 border-sky-400 font-bold shadow-sm'
													: 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
												: isLightTheme
												? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
												: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
										}"
									>
										{i18n.t('framing_closeup')}
									</button>
								</div>
							</div>

							<!-- Square Frame Toggle -->
							<div class="p-3 rounded-xl border space-y-2 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
										{i18n.t('square_frame_toggle')}
									</span>
									<button
										type="button"
										onclick={() => rigging.toggleSquareFrame()}
										aria-label={i18n.t('square_frame_toggle')}
										class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
											rigging.isSquareFrameActive ? 'bg-pink-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
										}"
									>
										<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
											rigging.isSquareFrameActive ? 'translate-x-4.5' : 'translate-x-1'
										}"></span>
									</button>
								</div>
								{#if rigging.isSquareFrameActive}
									<div class="flex items-center justify-between pt-1 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
										<span class="text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
											{i18n.t('square_frame_fade_label')}
										</span>
										<button
											type="button"
											onclick={() => {
												rigging.squareFrameFade = !rigging.squareFrameFade;
												rigging.persist();
											}}
											class="px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer {
												rigging.squareFrameFade
													? 'bg-pink-500/20 text-pink-500 border-pink-500/40 font-bold'
													: isLightTheme ? 'bg-zinc-100 text-zinc-600 border-zinc-300' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
											}"
										>
											{rigging.squareFrameFade ? 'Fade On' : 'Off'}
										</button>
									</div>
								{/if}
							</div>

							<!-- Studio Sound Effects (Procedural SFX) Section -->
							<div class="p-3.5 rounded-xl border space-y-3 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Bell class="w-4 h-4 text-cyan-500" />
										<span class="text-xs font-semibold {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
											{i18n.t('sfx_toggle_title')}
										</span>
									</div>
									<button
										type="button"
										onclick={() => {
											rigging.isSfxEnabled = !rigging.isSfxEnabled;
											rigging.persist();
											if (rigging.isSfxEnabled) playSfx('toggle');
										}}
										aria-label={i18n.t('sfx_toggle_title')}
										class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer {
											rigging.isSfxEnabled ? 'bg-cyan-500' : isLightTheme ? 'bg-zinc-300' : 'bg-zinc-700'
										}"
									>
										<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
											rigging.isSfxEnabled ? 'translate-x-4.5' : 'translate-x-1'
										}"></span>
									</button>
								</div>

								<p class="text-[10px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'} leading-relaxed">
									{i18n.t('sfx_desc')}
								</p>

								{#if rigging.isSfxEnabled}
									<div class="space-y-2 pt-1 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
										<div class="flex items-center justify-between text-xs">
											<span class="{isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">{i18n.t('sfx_volume')}</span>
											<span class="font-mono text-cyan-500 font-bold">{Math.round(rigging.sfxVolume * 100)}%</span>
										</div>
										<input
											type="range"
											min="0.0"
											max="1.0"
											step="0.05"
											bind:value={rigging.sfxVolume}
											oninput={() => rigging.persist()}
											class="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-500 {isLightTheme ? 'bg-zinc-200' : 'bg-zinc-800'}"
										/>
										<div class="flex justify-end pt-0.5">
											<button
												type="button"
												onclick={() => playSfx('click')}
												class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border {
													isLightTheme
														? 'bg-zinc-100 hover:bg-zinc-200 text-cyan-700 border-zinc-300'
														: 'bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border-zinc-700/80'
												}"
											>
												🔊 {i18n.t('sfx_test_btn')}
											</button>
										</div>
									</div>
								{/if}
							</div>

							<!-- Language Selection -->
							<div class="space-y-1.5 pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
								<span class="text-xs font-semibold block flex items-center gap-1.5 {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
									<Languages class="w-3.5 h-3.5 text-cyan-500" />
									{i18n.t('language')}
								</span>
								<div class="grid grid-cols-3 gap-2">
									{#each languages as lang}
										<button
											type="button"
											onclick={() => {
												i18n.setLocale(lang.code);
												rigging.persist();
											}}
											class="py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer {
												i18n.currentLocale === lang.code
													? isLightTheme
														? 'bg-cyan-100 text-cyan-800 border-cyan-400 font-bold shadow-sm'
														: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
													: isLightTheme
													? 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
													: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
											}"
										>
											{lang.label}
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 5: STORAGE & BACKUP -->
				{:else if activeTab === 'storage'}
					<div class="space-y-4 sm:space-y-6 w-full animate-in fade-in duration-150">
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 sm:space-y-6 shadow-sm {
							isLightTheme
								? 'bg-zinc-50 border-zinc-200 text-zinc-900'
								: 'bg-zinc-900/60 border-zinc-800 text-zinc-100'
						}">
							<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div>
									<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										<Database class="w-4 h-4 text-amber-500" />
										<span>{i18n.t('auto_save_title')}</span>
									</h3>
									<p class="text-xs mt-1 {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
										{i18n.t('auto_save_desc')}
									</p>
								</div>
								<span class="text-xs font-mono px-3 py-1 rounded-xl font-bold {
									isLightTheme
										? 'bg-zinc-200 text-zinc-800 border border-zinc-300'
										: 'bg-zinc-800 text-zinc-200 border border-zinc-700'
								}">
									{(storageUsageBytes / 1024).toFixed(1)} KB Disimpan
								</span>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
								<button
									onclick={handleExport}
									class="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer {
										isLightTheme
											? 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300 shadow-sm'
											: 'bg-zinc-950 hover:bg-zinc-800 text-zinc-100 border-zinc-700/80'
									}"
								>
									<Download class="w-4 h-4 text-cyan-400" />
									<span>{i18n.t('export_config')}</span>
								</button>

								<label
									class="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer {
										isLightTheme
											? 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300 shadow-sm'
											: 'bg-zinc-950 hover:bg-zinc-800 text-zinc-100 border-zinc-700/80'
									}"
								>
									<Upload class="w-4 h-4 text-emerald-400" />
									<span>{i18n.t('import_config')}</span>
									<input type="file" accept=".json" onchange={handleImport} class="hidden" />
								</label>
							</div>

							<div class="pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 {
								isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'
							}">
								<span class="text-xs {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
									Kembalikan semua preferensi studio ke konfigurasi awal
								</span>
								<button
									onclick={handleResetDefaults}
									class="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
								>
									<RotateCcw class="w-3.5 h-3.5" />
									<span>{i18n.t('reset_defaults')}</span>
								</button>
							</div>
						</div>
					</div>

				<!-- TAB 6: ABOUT STUDIO & SPECIFICATIONS -->
				{:else if activeTab === 'about'}
					<div class="space-y-4 sm:space-y-6 w-full animate-in fade-in duration-150">
						<!-- Studio Hero Banner -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-sm {
							isLightTheme
								? 'bg-gradient-to-br from-white via-sky-50/50 to-pink-50/30 border-zinc-200 text-zinc-900'
								: 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-cyan-500/30 text-zinc-100 shadow-xl'
						}">
							<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div class="flex items-center gap-3.5">
									<div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg text-lg">
										<Sparkles class="w-6 h-6 text-white animate-pulse" />
									</div>
									<div>
										<h3 class="text-base sm:text-lg font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
											<span>MiruNova <strong class="text-cyan-500 font-black">Live</strong></span>
											<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold {
												isLightTheme ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
											}">
												v0.20.1-beta (Beta)
											</span>
											<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold {
												isLightTheme ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
											}">
												FOSS
											</span>
										</h3>
										<p class="text-xs mt-0.5 {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
											Arsitek &amp; Developer Utama: <strong class="text-cyan-600 dark:text-cyan-300">Rifky (@RifkyA911)</strong>
										</p>
									</div>
								</div>
							</div>

							<p class="text-xs leading-relaxed {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
								MiruNova Live adalah studio VTuber generasi modern berbasis web yang berjalan 100% di browser tanpa instalasi driver berat. Menghadirkan pelacakan wajah &amp; ekspresi presisi tinggi 60 FPS, pengubah suara audio zero-latency, studio multi-kamera kolaborasi, serta ekosistem layer panggung yang fleksibel.
							</p>
						</div>

						<!-- Core Pillars (Privacy & Commercial Freedom) -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="p-4 sm:p-5 rounded-2xl border space-y-2.5 {
								isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
							}">
								<div class="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
									<ShieldCheck class="w-4 h-4 shrink-0" />
									<span>100% Client-Side Privacy</span>
								</div>
								<p class="text-[11px] leading-relaxed {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
									Semua pemrosesan neural network (MediaPipe Face &amp; Hands) dieksekusi secara lokal di mesin Anda menggunakan WebAssembly (WASM). Zero biometric telemetry — rekaman webcam dan audio tidak pernah diunggah ke server manapun.
								</p>
							</div>

							<div class="p-4 sm:p-5 rounded-2xl border space-y-2.5 {
								isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
							}">
								<div class="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400">
									<Tv class="w-4 h-4 shrink-0" />
									<span>Komersial &amp; Bebas Royalti</span>
								</div>
								<p class="text-[11px] leading-relaxed {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
									Bebas digunakan untuk siaran langsung (live streaming), kreasi konten video, dan monetisasi komersial di YouTube, Twitch, Kick, Bilibili, TikTok Live, maupun software broadcast OBS Studio via Chroma Key / Window Capture.
								</p>
							</div>
						</div>

						<!-- Live Streaming Keyboard Shortcuts Cheat Sheet -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-3.5 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
						}">
							<div class="flex items-center gap-2">
								<Keyboard class="w-4 h-4 text-violet-500" />
								<h4 class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
									Pintasan Keyboard Streaming Cepat
								</h4>
							</div>

							<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
								<div class="p-2.5 rounded-xl border text-center {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">Space</span>
									<span class="text-[10px] font-sans {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Kalibrasi Wajah</span>
								</div>
								<div class="p-2.5 rounded-xl border text-center {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">C</span>
									<span class="text-[10px] font-sans {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('shortcut_title_c')}</span>
								</div>
								<div class="p-2.5 rounded-xl border text-center {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">V</span>
									<span class="text-[10px] font-sans {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('shortcut_title_v')}</span>
								</div>
								<div class="p-2.5 rounded-xl border text-center {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">H</span>
									<span class="text-[10px] font-sans {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('shortcut_title_h')}</span>
								</div>
								<div class="p-2.5 rounded-xl border text-center {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">L</span>
									<span class="text-[10px] font-sans {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('shortcut_title_l')}</span>
								</div>
								<div class="p-2.5 rounded-xl border text-center {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">O</span>
									<span class="text-[10px] font-sans {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('shortcut_title_o')}</span>
								</div>
								<div class="p-2.5 rounded-xl border text-center {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">S</span>
									<span class="text-[10px] font-sans {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">{i18n.t('shortcut_title_s')}</span>
								</div>
								<div class="p-2.5 rounded-xl border text-center {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950/80 border-zinc-800'}">
									<span class="font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-200'}">F1</span>
									<span class="text-[10px] font-sans {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">Bantuan Pintasan</span>
								</div>
							</div>
						</div>

						<!-- Core Tech Engine Specs -->
						<div class="p-4 sm:p-5 rounded-2xl border space-y-2.5 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
						}">
							<span class="text-xs font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
								Spesifikasi Arsitektur Sistem
							</span>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
								<div class="p-2 rounded-lg border {isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950/70 border-zinc-800 text-zinc-300'}">
									⚡ Svelte 5 (Runes Core)
								</div>
								<div class="p-2 rounded-lg border {isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950/70 border-zinc-800 text-zinc-300'}">
									👁️ MediaPipe WASM 478-pt
								</div>
								<div class="p-2 rounded-lg border {isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950/70 border-zinc-800 text-zinc-300'}">
									🎨 Pixi.js v7 Live2D Core
								</div>
								<div class="p-2 rounded-lg border {isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950/70 border-zinc-800 text-zinc-300'}">
									🧊 Three.js 3D WebGL2
								</div>
								<div class="p-2 rounded-lg border {isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950/70 border-zinc-800 text-zinc-300'}">
									🎙️ Web Audio DSP &amp; SFX
								</div>
								<div class="p-2 rounded-lg border {isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-950/70 border-zinc-800 text-zinc-300'}">
									🚀 Bun Native Runtime
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-xs">
				<span class="text-zinc-500 text-[11px]">
					MiruNova Live • 100% Free & Open Source
				</span>
				<button
					onclick={() => (rigging.isSettingsModalOpen = false)}
					class="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
				>
					{i18n.t('done')}
				</button>
			</div>
		</div>
	</div>
{/if}
