<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging, UI_THEMES } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { voice, VOICE_MODELS } from '#lib/core/audio';
	import { i18n, type Locale } from '#lib/i18n/index.svelte';
	import { detectHardwareBenchmark, type HardwareReport } from '#lib/core/hardware';
	import { clearPreferences, exportConfigJson, importConfigJson } from '#lib/core/storage';
	import type { UITheme, AvatarFramingMode, VoiceFilterType } from '#lib/types/tracking';
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

	let activeTab = $state<'perf' | 'tracking' | 'voice' | 'appearance' | 'storage' | 'about'>('perf');
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);
	let availableMics = $state<Array<{ deviceId: string; label: string }>>([]);
	let storageUsageBytes = $state<number>(0);
	let appearanceThemeCategory = $state<'light' | 'dark' | 'custom'>('light');

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
			class="w-full max-w-5xl xl:max-w-6xl max-h-[88vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-200"
		>
			<!-- Modal Header -->
			<div class="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
						<Settings class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-base sm:text-lg font-bold tracking-wide flex items-center gap-2">
							{i18n.t('settings_title')}
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-mono">
								v0.9.0 FOSS
							</span>
						</h2>
						<p class="text-xs text-zinc-400">
							{i18n.t('settings_subtitle')}
						</p>
					</div>
				</div>

				<button
					onclick={() => (rigging.isSettingsModalOpen = false)}
					class="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
					aria-label="Tutup"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Expansive Navigation Tabs (Scrollable on mobile) -->
			<div class="px-6 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center gap-1 overflow-x-auto py-2">
				<button
					onclick={() => (activeTab = 'perf')}
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {
						activeTab === 'perf'
							? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
							: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Cpu class="w-4 h-4" />
					<span>{i18n.t('tab_perf')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'tracking')}
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {
						activeTab === 'tracking'
							? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
							: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<SlidersHorizontal class="w-4 h-4" />
					<span>{i18n.t('tab_tracking')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'voice')}
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {
						activeTab === 'voice'
							? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
							: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Mic class="w-4 h-4" />
					<span>{i18n.t('tab_voice')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'appearance')}
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {
						activeTab === 'appearance'
							? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
							: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Palette class="w-4 h-4" />
					<span>{i18n.t('tab_appearance')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'storage')}
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {
						activeTab === 'storage'
							? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
							: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
				>
					<Database class="w-4 h-4" />
					<span>{i18n.t('tab_storage')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'about')}
					class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {
						activeTab === 'about'
							? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
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

				<!-- TAB 4: THEME & STAGE -->
				{:else if activeTab === 'appearance'}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
						<!-- Theme Customizer Section (Categorized) -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
									<Palette class="w-4 h-4 text-pink-400" />
									<span>{i18n.t('theme_selector_title')}</span>
								</h3>

								<!-- Category Pill Selector -->
								<div class="flex items-center gap-1 p-1 bg-zinc-950/90 border border-zinc-800 rounded-xl">
									<button
										type="button"
										onclick={() => (appearanceThemeCategory = 'light')}
										class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer {
											appearanceThemeCategory === 'light'
												? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
												: 'text-zinc-400 hover:text-zinc-200'
										}"
									>
										<Sun class="w-3.5 h-3.5" />
										<span>{i18n.t('theme_category_light')}</span>
									</button>
									<button
										type="button"
										onclick={() => (appearanceThemeCategory = 'dark')}
										class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer {
											appearanceThemeCategory === 'dark'
												? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
												: 'text-zinc-400 hover:text-zinc-200'
										}"
									>
										<Moon class="w-3.5 h-3.5" />
										<span>{i18n.t('theme_category_dark')}</span>
									</button>
									<button
										type="button"
										onclick={() => (appearanceThemeCategory = 'custom')}
										class="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer {
											appearanceThemeCategory === 'custom'
												? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
												: 'text-zinc-400 hover:text-zinc-200'
										}"
									>
										<Wand2 class="w-3.5 h-3.5" />
										<span>{i18n.t('theme_category_custom')}</span>
									</button>
								</div>
							</div>

							<!-- Light Themes -->
							{#if appearanceThemeCategory === 'light'}
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150">
									{#each lightThemes as t}
										<button
											type="button"
											onclick={() => rigging.setUITheme(t.id)}
											class="p-3 rounded-xl border text-left transition-all relative cursor-pointer hover:scale-[1.01] active:scale-[0.99] {
												rigging.uiTheme === t.id
													? 'bg-zinc-900 border-cyan-400 shadow-lg ring-1 ring-cyan-400/30'
													: 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
											}"
										>
											<div class="flex items-center gap-2 mb-1">
												<div class="w-3.5 h-3.5 rounded-full border border-zinc-700" style="background-color: {t.palette.accent};"></div>
												<span class="font-bold text-xs text-zinc-200">{t.name}</span>
												<span class="text-[9px] px-1 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">{t.badge}</span>
												{#if rigging.uiTheme === t.id}
													<Check class="w-3.5 h-3.5 text-cyan-400 ml-auto" />
												{/if}
											</div>
											<p class="text-[10px] text-zinc-400 leading-tight mb-2 line-clamp-1">{t.desc}</p>
											<!-- Palette Swatches -->
											<div class="flex items-center gap-1.5 pt-1.5 border-t border-zinc-800/60">
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.bg};" title="Bg"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.surface};" title="Surface"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.accent};" title="Accent"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.border};" title="Border"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.text};" title="Text"></div>
												<span class="text-[9px] font-mono text-zinc-500 ml-auto">{t.bgHex}</span>
											</div>
										</button>
									{/each}
								</div>

							<!-- Dark Themes -->
							{:else if appearanceThemeCategory === 'dark'}
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150">
									{#each darkThemes as t}
										<button
											type="button"
											onclick={() => rigging.setUITheme(t.id)}
											class="p-3 rounded-xl border text-left transition-all relative cursor-pointer hover:scale-[1.01] active:scale-[0.99] {
												rigging.uiTheme === t.id
													? 'bg-zinc-900 border-cyan-500 shadow-lg ring-1 ring-cyan-500/30'
													: 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
											}"
										>
											<div class="flex items-center gap-2 mb-1">
												<div class="w-3.5 h-3.5 rounded-full border border-zinc-700" style="background-color: {t.palette.accent};"></div>
												<span class="font-bold text-xs text-zinc-200">{t.name}</span>
												<span class="text-[9px] px-1 py-0.2 rounded font-mono bg-zinc-800 text-zinc-400">{t.badge}</span>
												{#if rigging.uiTheme === t.id}
													<Check class="w-3.5 h-3.5 text-cyan-400 ml-auto" />
												{/if}
											</div>
											<p class="text-[10px] text-zinc-400 leading-tight mb-2 line-clamp-1">{t.desc}</p>
											<!-- Palette Swatches -->
											<div class="flex items-center gap-1.5 pt-1.5 border-t border-zinc-800/60">
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.bg};" title="Bg"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.surface};" title="Surface"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.accent};" title="Accent"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.border};" title="Border"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {t.palette.text};" title="Text"></div>
												<span class="text-[9px] font-mono text-zinc-500 ml-auto">{t.bgHex}</span>
											</div>
										</button>
									{/each}
								</div>

							<!-- Custom Theme Studio -->
							{:else if appearanceThemeCategory === 'custom'}
								<div class="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-3 animate-in fade-in duration-150">
									<!-- Presets -->
									<div>
										<span class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
											{i18n.t('custom_presets_title')}
										</span>
										<div class="grid grid-cols-3 gap-1.5">
											{#each customPresets as preset}
												<button
													type="button"
													onclick={() => applyCustomPreset(preset)}
													class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left flex items-center justify-between cursor-pointer"
												>
													<span class="font-bold text-[10px] text-zinc-200 truncate">{preset.name}</span>
													<div class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: {preset.accent};"></div>
												</button>
											{/each}
										</div>
									</div>

									<!-- Live Pickers -->
									<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
										<div class="p-2 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-1">
											<span class="text-[10px] text-zinc-400 block">{i18n.t('theme_custom_bg')}</span>
											<div class="flex items-center gap-1.5">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.bg}
													oninput={() => {
														rigging.setCustomThemeColors({ bg: rigging.customThemeConfig.bg });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
												/>
												<span class="font-mono text-[10px] text-zinc-200 uppercase">{rigging.customThemeConfig.bg}</span>
											</div>
										</div>

										<div class="p-2 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-1">
											<span class="text-[10px] text-zinc-400 block">{i18n.t('theme_custom_surface')}</span>
											<div class="flex items-center gap-1.5">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.surface}
													oninput={() => {
														rigging.setCustomThemeColors({ surface: rigging.customThemeConfig.surface });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
												/>
												<span class="font-mono text-[10px] text-zinc-200 uppercase">{rigging.customThemeConfig.surface}</span>
											</div>
										</div>

										<div class="p-2 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-1">
											<span class="text-[10px] text-zinc-400 block">{i18n.t('theme_custom_accent')}</span>
											<div class="flex items-center gap-1.5">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.accent}
													oninput={() => {
														rigging.setCustomThemeColors({ accent: rigging.customThemeConfig.accent });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
												/>
												<span class="font-mono text-[10px] text-zinc-200 uppercase">{rigging.customThemeConfig.accent}</span>
											</div>
										</div>

										<div class="p-2 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-1">
											<span class="text-[10px] text-zinc-400 block">{i18n.t('theme_custom_border')}</span>
											<div class="flex items-center gap-1.5">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.border}
													oninput={() => {
														rigging.setCustomThemeColors({ border: rigging.customThemeConfig.border });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
												/>
												<span class="font-mono text-[10px] text-zinc-200 uppercase">{rigging.customThemeConfig.border}</span>
											</div>
										</div>

										<div class="p-2 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-1">
											<span class="text-[10px] text-zinc-400 block">{i18n.t('theme_custom_text')}</span>
											<div class="flex items-center gap-1.5">
												<input
													type="color"
													bind:value={rigging.customThemeConfig.text}
													oninput={() => {
														rigging.setCustomThemeColors({ text: rigging.customThemeConfig.text });
														if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
													}}
													class="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
												/>
												<span class="font-mono text-[10px] text-zinc-200 uppercase">{rigging.customThemeConfig.text}</span>
											</div>
										</div>

										<!-- Activate Button -->
										<div class="flex items-end">
											<button
												type="button"
												onclick={() => rigging.setUITheme('custom')}
												class="w-full py-2 px-2.5 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 {
													rigging.uiTheme === 'custom'
														? 'bg-pink-500 text-white'
														: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
												}"
											>
												{#if rigging.uiTheme === 'custom'}
													<Check class="w-3.5 h-3.5 stroke-[3]" />
													<span>Aktif</span>
												{:else}
													<Wand2 class="w-3.5 h-3.5" />
													<span>Terapkan</span>
												{/if}
											</button>
										</div>
									</div>
								</div>
							{/if}

							<!-- Background Style -->
							<div class="pt-3 border-t border-zinc-800/60 space-y-2">
								<label for="bg-style-select" class="block text-xs text-zinc-400 font-medium">{i18n.t('bg_mode')}</label>
								<select
									id="bg-style-select"
									bind:value={rigging.backgroundStyle}
									onchange={() => rigging.persist()}
									class="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-pink-500"
								>
									<option value="solid">Solid Color (Custom Hex)</option>
									<option value="mesh">Mesh Kotak-kotak (Wireframe Grid)</option>
									<option value="grid">Clean Studio Grid</option>
									<option value="dots">Dot Matrix</option>
									<option value="cosmic">Cosmic Space Flow</option>
									<option value="transparent">Transparent Alpha (OBS)</option>
									<option value="chroma">Chroma Green (#00FF00)</option>
								</select>
							</div>
						</div>

						<!-- Framing & Language Settings -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
								<Layers class="w-4 h-4 text-violet-400" />
								<span>Framing & Bahasa</span>
							</h3>

							<!-- Framing Preset -->
							<div class="space-y-1.5">
								<span class="text-xs text-zinc-400 font-medium block">{i18n.t('framing_mode_label')}</span>
								<div class="grid grid-cols-3 gap-2">
									<button
										onclick={() => rigging.setFramingMode('full')}
										class="px-2 py-2 rounded-xl text-xs font-semibold border transition-colors {
											rigging.framingMode === 'full'
												? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
												: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
										}"
									>
										{i18n.t('framing_full')}
									</button>
									<button
										onclick={() => rigging.setFramingMode('half')}
										class="px-2 py-2 rounded-xl text-xs font-semibold border transition-colors {
											rigging.framingMode === 'half'
												? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
												: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
										}"
									>
										{i18n.t('framing_half')}
									</button>
									<button
										onclick={() => rigging.setFramingMode('closeup')}
										class="px-2 py-2 rounded-xl text-xs font-semibold border transition-colors {
											rigging.framingMode === 'closeup'
												? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
												: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
										}"
									>
										{i18n.t('framing_closeup')}
									</button>
								</div>
							</div>

							<!-- Square Frame Toggle -->
							<div class="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/70 space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-xs font-semibold text-zinc-200">{i18n.t('square_frame_toggle')}</span>
									<button
										onclick={() => rigging.toggleSquareFrame()}
										aria-label={i18n.t('square_frame_toggle')}
										class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {
											rigging.isSquareFrameActive ? 'bg-pink-500' : 'bg-zinc-700'
										}"
									>
										<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
											rigging.isSquareFrameActive ? 'translate-x-4.5' : 'translate-x-1'
										}"></span>
									</button>
								</div>
								{#if rigging.isSquareFrameActive}
									<div class="flex items-center justify-between pt-1 border-t border-zinc-800/60">
										<span class="text-[11px] text-zinc-400">{i18n.t('square_frame_fade_label')}</span>
										<button
											onclick={() => {
												rigging.squareFrameFade = !rigging.squareFrameFade;
												rigging.persist();
											}}
											class="px-2 py-0.5 rounded text-[10px] font-medium border {
												rigging.squareFrameFade
													? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
													: 'bg-zinc-800 text-zinc-400 border-zinc-700'
											}"
										>
											{rigging.squareFrameFade ? 'Fade On' : 'Off'}
										</button>
									</div>
								{/if}
							</div>

							<!-- Studio Sound Effects (Procedural SFX) Section -->
							<div class="p-3.5 bg-zinc-950/80 rounded-2xl border border-cyan-500/30 space-y-3">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Bell class="w-4 h-4 text-cyan-400" />
										<span class="text-xs font-semibold text-zinc-200">{i18n.t('sfx_toggle_title')}</span>
									</div>
									<button
										onclick={() => {
											rigging.isSfxEnabled = !rigging.isSfxEnabled;
											rigging.persist();
											if (rigging.isSfxEnabled) playSfx('toggle');
										}}
										aria-label={i18n.t('sfx_toggle_title')}
										class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {
											rigging.isSfxEnabled ? 'bg-cyan-500' : 'bg-zinc-700'
										}"
									>
										<span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {
											rigging.isSfxEnabled ? 'translate-x-4.5' : 'translate-x-1'
										}"></span>
									</button>
								</div>

								<p class="text-[10px] text-zinc-400 leading-relaxed">
									{i18n.t('sfx_desc')}
								</p>

								{#if rigging.isSfxEnabled}
									<div class="space-y-2 pt-1 border-t border-zinc-800/60">
										<div class="flex items-center justify-between text-xs">
											<span class="text-zinc-400">{i18n.t('sfx_volume')}</span>
											<span class="font-mono text-cyan-400 font-bold">{Math.round(rigging.sfxVolume * 100)}%</span>
										</div>
										<input
											type="range"
											min="0.0"
											max="1.0"
											step="0.05"
											bind:value={rigging.sfxVolume}
											oninput={() => rigging.persist()}
											class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
										/>
										<div class="flex justify-end pt-0.5">
											<button
												type="button"
												onclick={() => playSfx('click')}
												class="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-zinc-700/80 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
											>
												🔊 {i18n.t('sfx_test_btn')}
											</button>
										</div>
									</div>
								{/if}
							</div>

							<!-- Language Selection -->
							<div class="space-y-1.5 pt-2 border-t border-zinc-800/60">
								<span class="text-xs text-zinc-400 font-medium block flex items-center gap-1.5">
									<Languages class="w-3.5 h-3.5 text-cyan-400" />
									{i18n.t('language')}
								</span>
								<div class="grid grid-cols-3 gap-2">
									{#each languages as lang}
										<button
											onclick={() => {
												i18n.setLocale(lang.code);
												rigging.persist();
											}}
											class="py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all {
												i18n.currentLocale === lang.code
													? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
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
