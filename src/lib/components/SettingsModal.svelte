<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { voice } from '#lib/core/audio';
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
		HelpCircle
	} from 'lucide-svelte';

	let activeTab = $state<'perf' | 'tracking' | 'voice' | 'appearance' | 'storage' | 'about'>('perf');
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);
	let availableMics = $state<Array<{ deviceId: string; label: string }>>([]);
	let storageUsageBytes = $state<number>(0);

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

	async function refreshDevices() {
		try {
			availableCameras = await tracker.getAvailableVideoDevices();
		} catch {
			availableCameras = [];
		}
		try {
			availableMics = await voice.getAudioInputDevices();
		} catch {
			availableMics = [];
		}
		if (typeof window !== 'undefined' && window.localStorage) {
			storageUsageBytes = new Blob([JSON.stringify(window.localStorage)]).size;
		}
	}

	onMount(() => {
		refreshDevices();

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && rigging.isSettingsModalOpen) {
				rigging.isSettingsModalOpen = false;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
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

	function handleMicDeviceChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		rigging.audioDeviceId = target.value;
		rigging.persist();
		if (rigging.isMicActive) {
			voice.start(rigging.audioDeviceId, (vol) => {
				rigging.micVolumeLevel = vol;
			}).then(() => {
				voice.setGain(rigging.micGain);
				voice.setMonitor(rigging.isMicMonitorActive);
				voice.setFilter(rigging.voiceFilter);
			});
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
							<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
								<Cpu class="w-4 h-4 text-emerald-400" />
								<span>{i18n.t('gpu_info_title')}</span>
							</h3>

							<p class="text-xs text-zinc-400 leading-relaxed">
								{i18n.t('gpu_info_desc')}
							</p>

							<!-- Factual Windows Guide for Dedicated GPU -->
							<div class="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2">
								<span class="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
									<Info class="w-3.5 h-3.5" />
									{i18n.t('gpu_nvidia_guide_title')}
								</span>
								<p class="text-[11px] text-zinc-400 leading-relaxed">
									{i18n.t('gpu_nvidia_guide_desc')}
								</p>
								<div class="p-2.5 rounded bg-zinc-900/80 border border-zinc-800/60 font-mono text-[10px] text-zinc-300">
									Windows Settings &gt; System &gt; Display &gt; Graphics &gt; High Performance (NVIDIA GPU)
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
									<label for="cam-select" class="block text-zinc-400 font-medium mb-1">{i18n.t('camera_device')}</label>
									<select
										id="cam-select"
										bind:value={rigging.cameraDeviceId}
										onchange={() => rigging.persist()}
										class="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
									>
										<option value="">Default Webcam</option>
										{#each availableCameras as cam}
											<option value={cam.deviceId}>{cam.label}</option>
										{/each}
									</select>
								</div>

								<!-- Resolution Picker -->
								<div>
									<label for="res-select" class="block text-zinc-400 font-medium mb-1">{i18n.t('camera_resolution')}</label>
									<select
										id="res-select"
										bind:value={rigging.cameraResolution}
										onchange={() => rigging.persist()}
										class="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
									>
										<option value="480p">480p (640x480 — Ultra Ringan)</option>
										<option value="720p">720p (1280x720 — Seimbang Standar)</option>
										<option value="1080p">1080p (1920x1080 — Detail Tinggi)</option>
									</select>
								</div>

								<!-- Invert Pitch Y & Invert Yaw X Switches -->
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
								<label for="mic-select" class="block text-xs text-zinc-400 font-medium">{i18n.t('mic_input_label')}</label>
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
						</div>

						<!-- Local Voice Filters & AI Voice Changer Guide -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
								<Sparkles class="w-4 h-4 text-pink-400" />
								<span>{i18n.t('voice_filter_label')}</span>
							</h3>

							<div class="grid grid-cols-2 gap-2 text-xs">
								<button
									onclick={() => handleVoiceFilterChange('none')}
									class="p-2.5 rounded-xl border text-left transition-colors {
										rigging.voiceFilter === 'none'
											? 'bg-pink-500/20 text-pink-300 border-pink-500/50 font-semibold'
											: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
									}"
								>
									{i18n.t('filter_none')}
								</button>
								<button
									onclick={() => handleVoiceFilterChange('pitch-high')}
									class="p-2.5 rounded-xl border text-left transition-colors {
										rigging.voiceFilter === 'pitch-high'
											? 'bg-pink-500/20 text-pink-300 border-pink-500/50 font-semibold'
											: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
									}"
								>
									{i18n.t('filter_high')}
								</button>
								<button
									onclick={() => handleVoiceFilterChange('pitch-low')}
									class="p-2.5 rounded-xl border text-left transition-colors {
										rigging.voiceFilter === 'pitch-low'
											? 'bg-pink-500/20 text-pink-300 border-pink-500/50 font-semibold'
											: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
									}"
								>
									{i18n.t('filter_low')}
								</button>
								<button
									onclick={() => handleVoiceFilterChange('radio')}
									class="p-2.5 rounded-xl border text-left transition-colors {
										rigging.voiceFilter === 'radio'
											? 'bg-pink-500/20 text-pink-300 border-pink-500/50 font-semibold'
											: 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
									}"
								>
									{i18n.t('filter_radio')}
								</button>
							</div>

							<!-- W-Okada AI RVC Architecture Card -->
							<div class="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2">
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
						<!-- Theme Customizer Cards -->
						<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-4">
							<h3 class="text-sm font-bold text-zinc-200 flex items-center gap-2">
								<Palette class="w-4 h-4 text-pink-400" />
								<span>{i18n.t('theme_selector_title')}</span>
							</h3>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
								{#each themes as t}
									<button
										onclick={() => {
											rigging.uiTheme = t.id;
											rigging.persist();
										}}
										class="p-3 rounded-xl border text-left transition-all relative {
											rigging.uiTheme === t.id
												? 'bg-zinc-900 border-cyan-500/60 shadow-lg'
												: 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
										}"
									>
										<div class="flex items-center gap-2 mb-1">
											<div class="w-3 h-3 rounded-full {t.color}"></div>
											<span class="font-bold text-xs text-zinc-200">{t.label}</span>
											{#if rigging.uiTheme === t.id}
												<Check class="w-3.5 h-3.5 text-cyan-400 ml-auto" />
											{/if}
										</div>
										<p class="text-[10px] text-zinc-400 leading-tight">{t.desc}</p>
									</button>
								{/each}
							</div>

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

				<!-- TAB 6: ABOUT & TERMS OF SERVICE -->
				{:else if activeTab === 'about'}
					<div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-6 max-w-3xl mx-auto animate-in fade-in duration-150">
						<div class="flex items-center gap-3 pb-4 border-b border-zinc-800">
							<div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg">
								MN
							</div>
							<div>
								<h3 class="text-base font-bold text-zinc-100 flex items-center gap-2">
									{i18n.t('about_title')}
									<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono">
										{i18n.t('about_foss_badge')}
									</span>
								</h3>
								<p class="text-xs text-zinc-400">
									Open Source Virtual Studio • MIT / Apache 2.0 License
								</p>
							</div>
						</div>

						<p class="text-xs text-zinc-300 leading-relaxed">
							{i18n.t('about_desc')}
						</p>

						<!-- Privacy Policy & Zero Data Collection -->
						<div class="p-4 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 space-y-2">
							<h4 class="text-xs font-bold text-emerald-400 flex items-center gap-2">
								<ShieldCheck class="w-4 h-4" />
								<span>{i18n.t('about_privacy_title')}</span>
							</h4>
							<p class="text-[11px] text-zinc-400 leading-relaxed">
								{i18n.t('about_privacy_desc')}
							</p>
						</div>

						<!-- Licensing & Legal -->
						<div class="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
							<h4 class="text-xs font-bold text-zinc-300 flex items-center gap-2">
								<Info class="w-4 h-4 text-cyan-400" />
								<span>{i18n.t('about_license_title')}</span>
							</h4>
							<p class="text-[11px] text-zinc-400 leading-relaxed">
								{i18n.t('about_license_desc')}
							</p>
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
