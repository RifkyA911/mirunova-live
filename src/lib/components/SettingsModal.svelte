<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging, UI_THEMES } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { voice, VOICE_MODELS } from '#lib/core/audio';
	import { i18n, type Locale } from '#lib/i18n/index.svelte';
	import { detectHardwareBenchmark, type HardwareReport } from '#lib/core/hardware';
	import { clearPreferences, exportConfigJson, importConfigJson } from '#lib/core/storage';
	import type { UITheme, AvatarFramingMode, VoiceFilterType, BackgroundStyle } from '#lib/types/tracking';
	import {
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
		Bell
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let activeTab = $state<'perf' | 'tracking' | 'voice' | 'theme' | 'stage' | 'storage' | 'about'>('perf');
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
			rigging.showToast('Gagal merekam sampel mikrofon');
		}
	}

	function handlePlayRawSample() {
		if (!hasTestSample) return;
		playSfx('click');
		isPlayingTest = true;
		testPlaybackMode = 'raw';
		voice.playRawSample(() => {
			isPlayingTest = false;
			testPlaybackMode = null;
		});
	}

	function handlePlayConvertedSample() {
		if (!hasTestSample) return;
		playSfx('click');
		isPlayingTest = true;
		testPlaybackMode = 'converted';
		voice.playConvertedSample(() => {
			isPlayingTest = false;
			testPlaybackMode = null;
		});
	}

	function handleStopTestPlayback() {
		voice.stopPlayback();
		isPlayingTest = false;
		testPlaybackMode = null;
		playSfx('click');
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

	const languages: Array<{ code: Locale; label: string }> = [
		{ code: 'id', label: 'Bahasa Indonesia' },
		{ code: 'en', label: 'English' },
		{ code: 'ja', label: '日本語' }
	];

	const backgroundStyleCards: Array<{
		id: BackgroundStyle;
		label: string;
		desc: string;
		previewClass: string;
	}> = [
		{
			id: 'solid',
			label: 'Solid Color',
			desc: 'Warna studio polos (hex kustom)',
			previewClass: 'border-zinc-700'
		},
		{
			id: 'mesh',
			label: 'Mesh Kotak-kotak',
			desc: 'Wireframe perspektif 3D cyan sci-fi',
			previewClass: 'bg-zinc-950 bg-[linear-gradient(to_right,#06b6d433_1px,transparent_1px),linear-gradient(to_bottom,#06b6d433_1px,transparent_1px)] bg-[size:14px_14px]'
		},
		{
			id: 'grid',
			label: 'Studio Blueprint',
			desc: 'Garis grid arsitektur studio bersih',
			previewClass: 'bg-zinc-900 bg-[linear-gradient(to_right,#3f3f4640_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4640_1px,transparent_1px)] bg-[size:10px_10px]'
		},
		{
			id: 'dots',
			label: 'Dot Matrix',
			desc: 'Pola titik matriks modern futuristik',
			previewClass: 'bg-zinc-950 bg-[radial-gradient(#38bdf840_1.5px,transparent_1.5px)] bg-[size:10px_10px]'
		},
		{
			id: 'cosmic',
			label: 'Cosmic Nebula',
			desc: 'Gradasi kosmik violet, ungu & pink',
			previewClass: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950'
		},
		{
			id: 'transparent',
			label: 'Alpha Transparent',
			desc: 'Papan catur transparan untuk OBS Overlay',
			previewClass: 'bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[size:12px_12px]'
		},
		{
			id: 'chroma',
			label: 'Chroma Key Green',
			desc: 'Hijau murni #00FF00 untuk Color Key OBS',
			previewClass: 'bg-[#00FF00]'
		},
		{
			id: 'custom-image',
			label: 'Custom Wallpaper',
			desc: 'Gunakan wallpaper gambar dari komputer',
			previewClass: 'bg-gradient-to-r from-violet-900 to-indigo-900'
		}
	];

	let stageWallpaperInput = $state<HTMLInputElement>();

	function handleStageWallpaperUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		rigging.customBgUrl = url;
		rigging.backgroundStyle = 'custom-image';
		rigging.persist();
		rigging.showToast(`✓ Wallpaper dipasang: ${file.name}`);
	}

	async function refreshDevices(requestPermission = false) {
		try {
			availableCameras = await tracker.getAvailableVideoDevices(requestPermission);
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

	onMount(() => {
		refreshDevices(false);

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
				rigging.showToast('✓ Mikrofon aktif');
			} else {
				rigging.isMicActive = false;
				rigging.showToast('Gagal mengakses mikrofon');
			}
		} else {
			voice.stop();
			rigging.micVolumeLevel = 0;
			rigging.showToast('Mikrofon dimatikan');
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
			rigging.showToast('✓ Preset Responsif (Low-End Cam)');
		} else if (preset === 'balanced') {
			rigging.trackingSensitivity = 1.0;
			rigging.smoothingAmount = 0.35;
			rigging.deadzoneThreshold = 0.25;
			rigging.jitterReduction = 0.50;
			rigging.showToast('✓ Preset Seimbang (Default)');
		} else if (preset === 'smooth') {
			rigging.trackingSensitivity = 0.90;
			rigging.smoothingAmount = 0.60;
			rigging.deadzoneThreshold = 0.45;
			rigging.jitterReduction = 0.75;
			rigging.showToast('✓ Preset Ultra Halus (Cinematic)');
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
				rigging.showToast('✓ Pengaturan berhasil diimpor!');
			} else {
				alert('Gagal mengimpor file: Format JSON tidak valid atau korup.');
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
			rigging.showToast('✓ Pengaturan telah di-reset ke nilai bawaan');
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
			onclick={(e) => e.stopPropagation()}
			class="w-full max-w-5xl xl:max-w-6xl max-h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors border {
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
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono {
								isLightTheme ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-cyan-950 text-cyan-400 border border-cyan-800/80'
							}">
								v0.9.0 FOSS
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
					aria-label="Tutup"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Expansive Navigation Tabs (Scrollable on mobile) -->
			<div class="px-6 border-b flex items-center gap-1 overflow-x-auto py-2 {
				isLightTheme ? 'bg-zinc-100/50 border-zinc-200' : 'bg-zinc-900/30 border-zinc-800/80'
			}">
				<button
					onclick={() => (activeTab = 'perf')}
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
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
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
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
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
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
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
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
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
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
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
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
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {
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
					<span>{i18n.t('tab_about')}</span>
				</button>
			</div>

			<!-- Modal Body (Expansive 2-Column Responsive View) -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<!-- TAB 1: HARDWARE & PERF -->
				{#if activeTab === 'perf'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
						<!-- Live Telemetry Card -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
								<Activity class="w-4 h-4 text-cyan-400" />
								<span>Live Hardware Telemetry</span>
							</h3>

							<div class="grid grid-cols-2 gap-3 font-mono text-xs">
								<div class="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/70">
									<span class="text-[10px] text-zinc-500 block uppercase">Real-Time FPS</span>
									<span class="text-lg font-bold text-cyan-400">{rigging.fps || 60}</span>
								</div>
								<div class="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/70">
									<span class="text-[10px] text-zinc-500 block uppercase">Render Latency</span>
									<span class="text-lg font-bold text-emerald-400">{rigging.latencyMs || 8} ms</span>
								</div>
								<div class="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/70 col-span-2">
									<span class="text-[10px] text-zinc-500 block uppercase">{i18n.t('gpu_detected')}</span>
									<span class="text-xs font-semibold text-zinc-200 break-words">{hardware.gpuRenderer}</span>
								</div>
								<div class="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/70">
									<span class="text-[10px] text-zinc-500 block uppercase">{i18n.t('cpu_threads')}</span>
									<span class="text-sm font-semibold text-zinc-300">{hardware.cpuCores} Cores</span>
								</div>
								<div class="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/70">
									<span class="text-[10px] text-zinc-500 block uppercase">{i18n.t('camera_stream_res')}</span>
									<span class="text-sm font-semibold text-zinc-300">{rigging.cameraResolution}</span>
								</div>
							</div>

							<!-- Smoothness Status Bar -->
							<div class="space-y-2 pt-2">
								<div class="flex items-center justify-between text-xs">
									<span class="text-zinc-400 font-medium">{i18n.t('system_smoothness')}</span>
									<span class="font-bold px-2 py-0.5 rounded-full text-[11px]" style="color: {hardware.tierColor}; background: {hardware.tierColor}20;">
										{hardware.tierLabel} ({hardware.score}/100)
									</span>
								</div>
								<div class="w-full h-2.5 bg-zinc-800/80 rounded-full overflow-hidden">
									<div
										class="h-full rounded-full transition-all duration-300"
										style="width: {hardware.score}%; background: {hardware.tierColor};"
									></div>
								</div>
								<p class="text-[11px] text-zinc-400 leading-relaxed">
									{hardware.recommendation}
								</p>

								<!-- On-Screen HUD FPS Counter Toggle Switch -->
								<div class="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 mt-2">
									<div>
										<span class="font-semibold text-zinc-200 block text-xs">Indikator FPS Layar (HUD Telemetry)</span>
										<span class="text-[10px] text-zinc-500">Tampilkan counter frame rate dan latensi realtime di sudut kanvas panggung</span>
									</div>
									<button
										onclick={() => {
											rigging.showFpsCounter = !rigging.showFpsCounter;
											rigging.persist();
											playSfx('toggle');
										}}
										aria-label="Toggle HUD FPS Counter"
										class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {
											rigging.showFpsCounter ? 'bg-cyan-500' : 'bg-zinc-700'
										}"
									>
										<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
											rigging.showFpsCounter ? 'translate-x-4.5' : 'translate-x-1'
										}"></span>
									</button>
								</div>
							</div>
						</div>

						<!-- GPU Architecture & Optimization Guide -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
									<Cpu class="w-4 h-4 text-emerald-400" />
									<span>{i18n.t('gpu_info_title')}</span>
								</h3>
								<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
									WebGL High-Perf Enabled
								</span>
							</div>

							<p class="text-xs text-zinc-400 leading-relaxed">
								{i18n.t('gpu_info_desc')}
							</p>

							<!-- Factual Windows Guide for Dedicated GPU -->
							<div class="p-4 rounded-xl bg-zinc-950/90 border border-cyan-500/30 space-y-3">
								<div class="flex items-center gap-2 text-xs font-bold text-cyan-300">
									<Info class="w-4 h-4 text-cyan-400 shrink-0" />
									<span>{i18n.t('gpu_nvidia_guide_title')}</span>
								</div>
								<p class="text-[11px] text-zinc-400 leading-relaxed">
									{i18n.t('gpu_nvidia_guide_desc')}
								</p>

								<div class="space-y-2 text-[11px] text-zinc-300">
									<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
										<div class="font-bold text-cyan-400 mb-0.5">Langkah 1: Windows Graphics Settings</div>
										<div class="text-[10px] text-zinc-400">
											Buka <span class="text-zinc-200 font-mono">Start &gt; Settings &gt; System &gt; Display &gt; Graphics</span>. Pilih browser Anda (Chrome/Edge/Brave), klik <strong>Options</strong>, lalu centang <strong>High performance (NVIDIA GeForce)</strong>.
										</div>
									</div>

									<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
										<div class="font-bold text-cyan-400 mb-0.5">Langkah 2: NVIDIA Control Panel</div>
										<div class="text-[10px] text-zinc-400">
											Buka <span class="text-zinc-200 font-mono">NVIDIA Control Panel &gt; Manage 3D Settings &gt; Program Settings</span>. Tambahkan browser Anda, lalu atur <em>Preferred graphics processor</em> ke <strong>High-performance NVIDIA processor</strong>.
										</div>
									</div>

									<div class="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
										<div class="font-bold text-cyan-400 mb-0.5">Langkah 3: Hardware Acceleration Browser</div>
										<div class="text-[10px] text-zinc-400">
											Pastikan di pengaturan browser: <span class="text-zinc-200 font-mono">Settings &gt; System &gt; "Use graphics acceleration when available"</span> aktif (ON), lalu restart browser.
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 2: TRACKING & CAMERA -->
				{:else if activeTab === 'tracking'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
						<!-- Camera Hardware & Inversion Settings -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
								<Camera class="w-4 h-4 text-indigo-400" />
								<span>Kamera & Orientasi Sumbu</span>
							</h3>

							<div class="space-y-3 text-xs">
								<!-- Camera Picker -->
								<div>
									<div class="flex items-center justify-between mb-1">
										<label for="cam-select" class="block text-zinc-400 font-medium">{i18n.t('camera_device')}</label>
										<button
											onclick={() => refreshDevices(true)}
											class="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
											title={i18n.t('refresh_devices')}
										>
											<RefreshCw class="w-3 h-3" />
											<span>{i18n.t('refresh_devices')}</span>
										</button>
									</div>
									<select
										id="cam-select"
										bind:value={rigging.cameraDeviceId}
										onchange={handleCameraDeviceChange}
										class="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
									>
										<option value="">Default Webcam</option>
										{#each availableCameras as cam}
											<option value={cam.deviceId}>{cam.label}</option>
										{/each}
									</select>
									{#if rigging.activeCameraLabel}
										<div class="mt-2 p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2 font-mono">
											<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
											<span class="truncate"><strong>{i18n.t('active_camera_hardware')}</strong> {rigging.activeCameraLabel}</span>
										</div>
									{/if}
									<div class="mt-2 p-2.5 bg-cyan-950/30 border border-cyan-800/30 rounded-xl text-[11px] text-cyan-300/90 flex items-start gap-2 leading-relaxed">
										<Info class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
										<span><strong>Iriun / DroidCam / Windows Phone Link:</strong> {i18n.t('phone_webcam_tip')}</span>
									</div>
								</div>

								<!-- Resolution Picker -->
								<div>
									<label for="res-select" class="block text-zinc-400 font-medium mb-1">{i18n.t('camera_resolution')}</label>
									<select
										id="res-select"
										bind:value={rigging.cameraResolution}
										onchange={handleResolutionChange}
										class="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
									>
										<option value="480p">480p (640x480 — Ultra Ringan)</option>
										<option value="720p">720p (1280x720 — Seimbang Standar)</option>
										<option value="1080p">1080p (1920x1080 — Detail Tinggi)</option>
									</select>
								</div>

								<!-- Invert Pitch Y, Invert Yaw X & Hand Tracking Switches -->
								<div class="pt-2 border-t border-zinc-800/60 space-y-3">
									<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
										<div>
											<span class="font-semibold text-zinc-200 block">{i18n.t('invert_pitch')}</span>
											<span class="text-[10px] text-zinc-500">{i18n.t('invert_pitch_desc')}</span>
										</div>
										<button
											onclick={() => {
												rigging.invertPitch = !rigging.invertPitch;
												rigging.persist();
											}}
											aria-label={i18n.t('invert_pitch')}
											class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {
												rigging.invertPitch ? 'bg-indigo-500' : 'bg-zinc-700'
											}"
										>
											<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
												rigging.invertPitch ? 'translate-x-4.5' : 'translate-x-1'
											}"></span>
										</button>
									</div>

									<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
										<div>
											<span class="font-semibold text-zinc-200 block">{i18n.t('invert_yaw')}</span>
											<span class="text-[10px] text-zinc-500">{i18n.t('invert_yaw_desc')}</span>
										</div>
										<button
											onclick={() => {
												rigging.invertYaw = !rigging.invertYaw;
												rigging.persist();
											}}
											aria-label={i18n.t('invert_yaw')}
											class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {
												rigging.invertYaw ? 'bg-indigo-500' : 'bg-zinc-700'
											}"
										>
											<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
												rigging.invertYaw ? 'translate-x-4.5' : 'translate-x-1'
											}"></span>
										</button>
									</div>

									<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
										<div>
											<span class="font-semibold text-zinc-200 block">{i18n.t('hands_toggle')}</span>
											<span class="text-[10px] text-zinc-500">{i18n.t('hand_tracking_perf_tip')}</span>
										</div>
										<button
											onclick={() => {
												rigging.enableHandTracking = !rigging.enableHandTracking;
												rigging.persist();
											}}
											aria-label={i18n.t('hands_toggle')}
											class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {
												rigging.enableHandTracking ? 'bg-indigo-500' : 'bg-zinc-700'
											}"
										>
											<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
												rigging.enableHandTracking ? 'translate-x-4.5' : 'translate-x-1'
											}"></span>
										</button>
									</div>

									<!-- Wink Sebelah Mata (Independent Eye Wink) -->
									<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
										<div>
											<span class="font-semibold text-zinc-200 block">Wink Sebelah Mata (Kedip Mandiri)</span>
											<span class="text-[10px] text-zinc-500">Mata kiri & kanan bisa berkedip independen saat Anda mengedipkan sebelah mata</span>
										</div>
										<button
											onclick={() => {
												rigging.eyeBlinkLinked = !rigging.eyeBlinkLinked;
												rigging.persist();
												playSfx('toggle');
											}}
											aria-label="Wink Sebelah Mata"
											class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {
												!rigging.eyeBlinkLinked ? 'bg-indigo-500' : 'bg-zinc-700'
											}"
										>
											<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
												!rigging.eyeBlinkLinked ? 'translate-x-4.5' : 'translate-x-1'
											}"></span>
										</button>
									</div>

									<!-- Cermin Mata VTuber (Mirror Eyes) -->
									<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
										<div>
											<span class="font-semibold text-zinc-200 block">Cermin Mata VTuber</span>
											<span class="text-[10px] text-zinc-500">Mata kiri fisik Anda mengedipkan mata kiri avatar pada layar (orientasi cermin)</span>
										</div>
										<button
											onclick={() => {
												rigging.mirrorEyes = !rigging.mirrorEyes;
												rigging.persist();
												playSfx('toggle');
											}}
											aria-label="Cermin Mata VTuber"
											class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {
												rigging.mirrorEyes ? 'bg-indigo-500' : 'bg-zinc-700'
											}"
										>
											<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
												rigging.mirrorEyes ? 'translate-x-4.5' : 'translate-x-1'
											}"></span>
										</button>
									</div>
								</div>
							</div>
						</div>

						<!-- Fine Sensitivity, Smoothing & Quick Presets -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<h3 class="text-sm font-bold text-zinc-200 flex items-center justify-between">
								<span class="flex items-center gap-2">
									<SlidersHorizontal class="w-4 h-4 text-cyan-400" />
									<span>{i18n.t('tracking_quality')}</span>
								</span>
								<span class="text-[10px] text-zinc-500">Auto-saved</span>
							</h3>

							<!-- Quick Presets -->
							<div class="space-y-1.5">
								<span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
									{i18n.t('tracking_presets_title')}
								</span>
								<div class="grid grid-cols-3 gap-1.5">
									<button
										onclick={() => applyTrackingPreset('responsive')}
										class="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-center"
									>
										Responsif
									</button>
									<button
										onclick={() => applyTrackingPreset('balanced')}
										class="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors text-center"
									>
										Seimbang
									</button>
									<button
										onclick={() => applyTrackingPreset('smooth')}
										class="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-center"
									>
										Ultra Halus
									</button>
								</div>
							</div>

							<!-- Fine Sliders -->
							<div class="space-y-3 text-xs pt-1">
								<div>
									<div class="flex justify-between mb-1">
										<span class="text-zinc-400">{i18n.t('sensitivity')}</span>
										<span class="font-mono text-cyan-400 font-bold">{rigging.trackingSensitivity.toFixed(2)}x</span>
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
										<span class="text-zinc-400">{i18n.t('smoothing')}</span>
										<span class="font-mono text-cyan-400 font-bold">{Math.round(rigging.smoothingAmount * 100)}%</span>
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
										<span class="text-zinc-400">{i18n.t('deadzone')}</span>
										<span class="font-mono text-cyan-400 font-bold">{rigging.deadzoneThreshold.toFixed(2)}°</span>
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
								<div class="pt-3 border-t border-zinc-800/60 space-y-3">
									<div class="flex items-center justify-between">
										<div>
											<span class="text-[11px] font-semibold text-zinc-300 block">{i18n.t('mouth_sensitivity_title')}</span>
											<span class="text-[10px] text-zinc-500">{i18n.t('mouth_sensitivity_desc')}</span>
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
													: 'bg-zinc-800 text-zinc-400 border-zinc-700'
											}"
										>
											{rigging.mouthTrackingMode === 'high' ? '🔥 ' + i18n.t('speech_boost_high') : i18n.t('speech_boost_normal')}
										</button>
									</div>

									<div>
										<div class="flex justify-between mb-1">
											<span class="text-zinc-400">{i18n.t('mouth_multiplier_label')}</span>
											<span class="font-mono text-rose-400 font-bold">{(rigging.mouthSensitivity || 1.0).toFixed(1)}x</span>
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
					</div>

				<!-- TAB 3: VOICE & AUDIO -->
				{:else if activeTab === 'voice'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
						<!-- Real Web Audio API Microphone Engine -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
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
										<span>Aktif</span>
									{:else}
										<MicOff class="w-3.5 h-3.5" />
										<span>Nonaktif</span>
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

								<div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 text-xs">
									<span class="text-zinc-300 font-medium">{i18n.t('mic_monitor_label')}</span>
									<button
										onclick={toggleMicMonitor}
										class="p-1.5 rounded-lg transition-colors {
											rigging.isMicMonitorActive
												? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
												: 'bg-zinc-800 text-zinc-400'
										}"
									>
										{#if rigging.isMicMonitorActive}
											<Volume2 class="w-4 h-4" />
										{:else}
											<VolumeX class="w-4 h-4" />
										{/if}
									</button>
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
											{testRecordSeconds}s Rekam...
										</span>
									{:else if hasTestSample}
										<span class="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px]">
											Sample 4s Tersimpan
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
											<span>{hasTestSample ? 'Rekam Ulang Sampel 4 Detik' : i18n.t('mic_record_btn')}</span>
										</button>
									{:else}
										<div class="w-full py-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold text-center animate-pulse">
											Sedang Merekam Suara... Bicara sekarang! ({testRecordSeconds}s)
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
							</div>
						</div>

						<!-- Web Audio DSP Voice Models (Categorized Grid) -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
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
											<p class="text-[10px] text-zinc-400 leading-tight line-clamp-2">{model.desc}</p>
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
											<p class="text-[10px] text-zinc-400 leading-tight line-clamp-2">{model.desc}</p>
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
											<p class="text-[10px] text-zinc-400 leading-tight line-clamp-2">{model.desc}</p>
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
					<div class="space-y-5 animate-in fade-in duration-150">
						<!-- Theme Header & Category Filter Bar -->
						<div class="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
						}">
							<div class="flex items-center gap-3">
								<div class="p-2.5 rounded-xl bg-pink-500/20 text-pink-500 border border-pink-500/30 shrink-0">
									<Palette class="w-5 h-5" />
								</div>
								<div>
									<h3 class="text-sm font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										Katalog Palet Warna Antarmuka
										<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-pink-500/15 text-pink-500 border border-pink-500/30">
											{UI_THEMES.length} Tema Tersedia
										</span>
									</h3>
									<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5">
										Pilih skema warna studio untuk tombol, menu, dock, dan dialog dengan kontras tinggi & palet harmonis
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
							<div class="p-5 rounded-2xl border space-y-5 animate-in fade-in duration-150 {
								isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
							}">
								<!-- One-Click Presets -->
								<div>
									<div class="flex items-center justify-between mb-2">
										<span class="text-xs font-bold uppercase tracking-wider {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
											Preset Warna Cepat
										</span>
										<span class="text-[10px] text-zinc-500">Klik salah satu untuk memuat palet harmonis</span>
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
													<span>Tema Kustom Aktif</span>
												{:else}
													<Wand2 class="w-4 h-4" />
													<span>Terapkan Kustom</span>
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
												<span class="font-bold text-xs font-mono" style="color: {rigging.customThemeConfig.text};">Live Theme Preview</span>
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
												<span class="text-xs font-semibold" style="color: {rigging.customThemeConfig.text};">Surface Panel Card</span>
												<div class="w-5 h-2.5 rounded-full flex items-center px-0.5" style="background-color: {rigging.customThemeConfig.accent};">
													<div class="w-1.5 h-1.5 rounded-full ml-auto" style="background-color: {rigging.customThemeConfig.bg};"></div>
												</div>
											</div>
											<p class="text-[10px] opacity-80 leading-relaxed" style="color: {rigging.customThemeConfig.text};">
												Ini adalah pratinjau tampilan dialog dan kartu dengan warna yang Anda atur.
											</p>
										</div>

										<!-- Mock Buttons -->
										<div class="flex items-center gap-2">
											<div class="flex-1 py-1.5 rounded-lg text-center text-xs font-bold" style="background-color: {rigging.customThemeConfig.accent}; color: {rigging.customThemeConfig.bg};">
												Tombol Aksi
											</div>
											<div class="py-1.5 px-3 rounded-lg border text-center text-xs" style="background-color: {rigging.customThemeConfig.surface}; border-color: {rigging.customThemeConfig.border}; color: {rigging.customThemeConfig.text};">
												Batal
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>

				<!-- TAB 5: STAGE & EFFECTS (PANGGUNG & KANVAS) -->
				{:else if activeTab === 'stage'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
						<!-- Card 1: Latar Belakang & Efek Layar -->
						<div class="p-5 rounded-2xl border space-y-4 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/90'
						}">
							<div class="flex items-center gap-2.5">
								<div class="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-500">
									<Layers class="w-4 h-4" />
								</div>
								<div>
									<h3 class="text-sm font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										Latar Belakang Panggung
									</h3>
									<p class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
										Mode tampilan kanvas untuk streaming OBS, preview, atau green screen
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
										<span class="font-semibold block {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">Wallpaper Komputer</span>
										<span class="text-[11px] text-zinc-400">
											{rigging.customBgUrl ? '✓ File gambar aktif terpasang' : 'Pilih gambar lokal untuk dijadikan latar kanvas'}
										</span>
									</div>
									<button
										type="button"
										onclick={() => stageWallpaperInput?.click()}
										class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
									>
										<Upload class="w-3.5 h-3.5" />
										<span>{rigging.customBgUrl ? 'Ganti Gambar' : 'Pilih Gambar'}</span>
									</button>
								</div>
							{/if}

							<!-- Solid Background Color Picker (If solid selected) -->
							{#if rigging.backgroundStyle === 'solid'}
								<div class="p-3 rounded-xl border space-y-2 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
									<span class="text-xs font-semibold block {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
										Warna Background Solid (Hex)
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
									Efek Layar Visual (Shader / Post-Processing)
								</label>
								<select
									id="screen-effect-select"
									bind:value={rigging.screenEffect}
									onchange={() => rigging.persist()}
									class="w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:border-sky-500 cursor-pointer {
										isLightTheme ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-100'
									}"
								>
									<option value="none">Tanpa Efek (Normal)</option>
									<option value="vignette">Vignette (Bayangan Tepi Layar)</option>
									<option value="scanlines">Scanlines (Garis TV Retro)</option>
									<option value="crt">CRT Monitor Glow</option>
									<option value="blur">Subtle Background Blur</option>
								</select>
							</div>
						</div>

						<!-- Card 2: Framing, Sound Effects & Bahasa -->
						<div class="p-5 rounded-2xl border space-y-4 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/90'
						}">
							<div class="flex items-center gap-2.5">
								<div class="p-2 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-500">
									<SlidersHorizontal class="w-4 h-4" />
								</div>
								<div>
									<h3 class="text-sm font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										Framing & Pengaturan Suara
									</h3>
									<p class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
										Preset framing kamera avatar, rasio 1:1, dan sound effect studio
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
					<div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-6 max-w-2xl mx-auto animate-in fade-in duration-150">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
									<Database class="w-4 h-4 text-amber-400" />
									<span>{i18n.t('auto_save_title')}</span>
								</h3>
								<p class="text-xs text-zinc-400 mt-1">
									{i18n.t('auto_save_desc')}
								</p>
							</div>
							<span class="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
								{(storageUsageBytes / 1024).toFixed(1)} KB
							</span>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
							<button
								onclick={handleExport}
								class="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-200 transition-colors"
							>
								<Download class="w-4 h-4 text-cyan-400" />
								<span>{i18n.t('export_config')}</span>
							</button>

							<label
								class="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
							>
								<Upload class="w-4 h-4 text-emerald-400" />
								<span>{i18n.t('import_config')}</span>
								<input type="file" accept=".json" onchange={handleImport} class="hidden" />
							</label>
						</div>

						<div class="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
							<span class="text-xs text-zinc-400">Kembalikan semua preferensi ke awal</span>
							<button
								onclick={handleResetDefaults}
								class="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
							>
								<RotateCcw class="w-3.5 h-3.5" />
								<span>{i18n.t('reset_defaults')}</span>
							</button>
						</div>
					</div>

				<!-- TAB 6: ABOUT & TERMS OF SERVICE LAUNCHPAD -->
				{:else if activeTab === 'about'}
					<div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-6 max-w-3xl mx-auto animate-in fade-in duration-150">
						<!-- Lead Creator & Studio Launch Card -->
						<div class="p-5 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-cyan-500/40 shadow-xl space-y-4">
							<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div class="flex items-center gap-3.5">
									<div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg text-lg">
										<Sparkles class="w-6 h-6 text-white animate-pulse" />
									</div>
									<div>
										<h3 class="text-base font-bold text-zinc-100 flex items-center gap-2">
											{i18n.t('about_title')}
											<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-medium">
												v2.4.0 Studio
											</span>
										</h3>
										<p class="text-xs text-zinc-400 mt-0.5">
											Arsitek & Developer Utama: <strong class="text-cyan-300">Rifky (@RifkyA911)</strong>
										</p>
									</div>
								</div>

								<button
									onclick={() => {
										playSfx('modal');
										rigging.isSettingsModalOpen = false;
										rigging.toggleAboutModal(true);
									}}
									class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl text-xs transition-all hover:scale-105 active:scale-95 shadow-md shadow-cyan-500/20 cursor-pointer"
								>
									Buka Studio About &amp; Kredit Penuh &rarr;
								</button>
							</div>

							<p class="text-xs text-zinc-300 leading-relaxed">
								{i18n.t('about_desc')}
							</p>
						</div>

						<!-- Privacy Charter & Commercial VTuber Rights Launch Card -->
						<div class="p-5 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 shadow-lg space-y-4">
							<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div class="flex items-center gap-3">
									<div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
										<ShieldCheck class="w-5 h-5" />
									</div>
									<div>
										<h4 class="text-sm font-bold text-emerald-300">
											{i18n.t('tos_modal_title')}
										</h4>
										<p class="text-[11px] text-zinc-400 mt-0.5">
											100% Client-Side Privacy Charter • Komersial Bebas Royalti Streaming VTuber
										</p>
									</div>
								</div>

								<button
									onclick={() => {
										playSfx('modal');
										rigging.isSettingsModalOpen = false;
										rigging.toggleTosModal(true);
									}}
									class="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
								>
									Buka Privacy Charter &amp; ToS &rarr;
								</button>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px] text-zinc-400">
								<div class="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2">
									<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
									<span>Zero Biometric Telemetry (Local WASM)</span>
								</div>
								<div class="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2">
									<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
									<span>Hak Streaming YouTube / Twitch 100% Bebas</span>
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
