<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { i18n, type Locale } from '#lib/i18n/index.svelte';
	import { detectHardwareBenchmark, type HardwareReport } from '#lib/core/hardware';
	import { clearPreferences, exportConfigJson, importConfigJson } from '#lib/core/storage';
	import type { UITheme, RiggingViewMode } from '#lib/types/tracking';
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
		Video
	} from 'lucide-svelte';

	let activeTab = $state<'perf' | 'tracking' | 'appearance' | 'storage'>('perf');
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);
	let storageUsageBytes = $state<number>(0);

	// Reactive live hardware report directly updated by tracking FPS
	let hardware = $derived<HardwareReport>(detectHardwareBenchmark(rigging.fps || 60));

	const themes: Array<{ id: UITheme; label: string; desc: string; color: string }> = [
		{ id: 'cyber-dark', label: 'Cyber Dark', desc: 'Futuristic cyan & violet accents with deep zinc background', color: 'bg-cyan-500' },
		{ id: 'midnight', label: 'Midnight Blue', desc: 'Deep oceanic navy tone for calm streaming environment', color: 'bg-blue-500' },
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
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

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
			eyeBlinkLinked: rigging.eyeBlinkLinked,
			deadzoneThreshold: rigging.deadzoneThreshold,
			holdPoseOnLoss: rigging.holdPoseOnLoss,
			enableHandTracking: rigging.enableHandTracking,
			poseLoopMode: rigging.poseLoopMode,
			isRiggingPinned: rigging.isRiggingPinned,
			riggingViewMode: rigging.riggingViewMode,
			cameraDeviceId: rigging.cameraDeviceId,
			cameraResolution: rigging.cameraResolution,
			currentLocale: i18n.currentLocale
		});

		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `mirunova-config-backup-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
		rigging.showToast('✓ Konfigurasi berhasil diekspor!');
	}

	function handleImportFile(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			const content = ev.target?.result as string;
			const parsed = importConfigJson(content);
			if (parsed) {
				if (parsed.uiTheme) rigging.uiTheme = parsed.uiTheme as any;
				if (parsed.trackingSensitivity) rigging.trackingSensitivity = parsed.trackingSensitivity;
				if (parsed.smoothingAmount) rigging.smoothingAmount = parsed.smoothingAmount;
				if (parsed.jitterReduction !== undefined) rigging.jitterReduction = parsed.jitterReduction;
				if (parsed.deadzoneThreshold) rigging.deadzoneThreshold = parsed.deadzoneThreshold;
				if (parsed.backgroundStyle) rigging.backgroundStyle = parsed.backgroundStyle as any;
				if (parsed.backgroundColor) rigging.backgroundColor = parsed.backgroundColor;
				if (parsed.isRiggingPinned !== undefined) rigging.isRiggingPinned = parsed.isRiggingPinned;
				if (parsed.riggingViewMode) rigging.riggingViewMode = parsed.riggingViewMode;
				if (parsed.cameraDeviceId !== undefined) rigging.cameraDeviceId = parsed.cameraDeviceId;
				if (parsed.cameraResolution) rigging.cameraResolution = parsed.cameraResolution as any;
				if (parsed.currentLocale) i18n.setLocale(parsed.currentLocale as any);
				rigging.persist();
				rigging.showToast('✓ Konfigurasi berhasil dipulihkan!');
			} else {
				alert('File konfigurasi JSON tidak valid.');
			}
		};
		reader.readAsText(file);
	}

	function handleResetDefaults() {
		if (confirm(i18n.t('reset_confirm'))) {
			clearPreferences();
			rigging.trackingSensitivity = 1.0;
			rigging.smoothingAmount = 0.45;
			rigging.jitterReduction = 0.5;
			rigging.deadzoneThreshold = 0.3;
			rigging.eyeBlinkLinked = false;
			rigging.holdPoseOnLoss = true;
			rigging.enableHandTracking = true;
			rigging.uiTheme = 'cyber-dark';
			rigging.backgroundStyle = 'solid';
			rigging.backgroundColor = '#09090b';
			rigging.screenEffect = 'none';
			rigging.isRiggingPinned = true;
			rigging.riggingViewMode = 'stay';
			rigging.cameraDeviceId = '';
			rigging.cameraResolution = '720p';
			rigging.resetCalibration();
			rigging.persist();
			rigging.showToast('Pengaturan telah di-reset ke default.');
		}
	}

	async function handleCameraChange() {
		rigging.persist();
		if (rigging.isCameraActive) {
			tracker.stopCamera();
			try {
				await tracker.startCamera();
				rigging.showToast('✓ Kamera berhasil dialihkan');
			} catch (err: any) {
				alert(err?.message || 'Gagal beralih kamera');
			}
		}
	}
</script>

{#if rigging.isSettingsModalOpen}
	<!-- Modal Backdrop (Click Outside to Close) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) rigging.isSettingsModalOpen = false;
		}}
		class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
	>
		<div
			class="w-full max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
				<div class="flex items-center gap-2.5">
					<div class="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
						<Settings class="w-4 h-4" />
					</div>
					<div>
						<h2 class="text-sm font-semibold tracking-wide flex items-center gap-2">
							{i18n.t('settings_title')}
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">PRO</span>
						</h2>
						<p class="text-xs text-zinc-400">
							{i18n.t('settings_subtitle')}
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isSettingsModalOpen = false)}
					class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Tabs Navigation -->
			<div class="px-5 pt-2.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center gap-2 overflow-x-auto">
				<button
					onclick={() => (activeTab = 'perf')}
					class="flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-medium transition-all {
						activeTab === 'perf'
							? 'border-cyan-500 text-cyan-300 font-semibold'
							: 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Cpu class="w-3.5 h-3.5" />
					<span>{i18n.t('tab_perf')}</span>
				</button>

				<button
					onclick={() => {
						activeTab = 'tracking';
						refreshDevices();
					}}
					class="flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-medium transition-all {
						activeTab === 'tracking'
							? 'border-violet-500 text-violet-300 font-semibold'
							: 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<SlidersHorizontal class="w-3.5 h-3.5" />
					<span>{i18n.t('tab_tracking')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'appearance')}
					class="flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-medium transition-all {
						activeTab === 'appearance'
							? 'border-pink-500 text-pink-300 font-semibold'
							: 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Palette class="w-3.5 h-3.5" />
					<span>{i18n.t('tab_appearance')}</span>
				</button>

				<button
					onclick={() => (activeTab = 'storage')}
					class="flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-medium transition-all {
						activeTab === 'storage'
							? 'border-amber-500 text-amber-300 font-semibold'
							: 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Database class="w-3.5 h-3.5" />
					<span>{i18n.t('tab_storage')}</span>
				</button>
			</div>

			<!-- Tab Contents -->
			<div class="p-5 overflow-y-auto space-y-5 text-xs">
				<!-- TAB 1: Hardware & Performa -->
				{#if activeTab === 'perf'}
					<div class="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="font-semibold text-zinc-200 text-xs">{i18n.t('system_smoothness')}</span>
								<span
									class="px-2 py-0.5 rounded text-[11px] font-bold"
									style="color: {hardware.tierColor}; background: {hardware.tierColor}18; border: 1px solid {hardware.tierColor}40;"
								>
									{hardware.tierLabel}
								</span>
							</div>
							<span class="text-zinc-400 font-mono text-[11px]">{hardware.score} / 100 PTS</span>
						</div>

						<!-- Progress Bar Gradient (Red -> Yellow -> Green -> Emerald) -->
						<div class="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 relative">
							<div
								class="h-full rounded-full transition-all duration-500"
								style="width: {hardware.score}%; background: linear-gradient(90deg, #ef4444 0%, #eab308 35%, #22c55e 70%, #10b981 100%);"
							></div>
						</div>

						<div class="flex justify-between text-[10px] text-zinc-500 font-medium">
							<span class="text-rose-400">{i18n.t('tier_slow')}</span>
							<span class="text-amber-400">{i18n.t('tier_fair')}</span>
							<span class="text-emerald-400">{i18n.t('tier_smooth')}</span>
							<span class="text-cyan-400 font-bold">{i18n.t('tier_ultra')}</span>
						</div>

						<!-- Real Hardware Telemetry Grid -->
						<div class="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-800 text-[11px]">
							<div class="flex flex-col p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
								<span class="text-zinc-500 text-[10px]">{i18n.t('gpu_detected')}</span>
								<span class="font-mono text-zinc-200 truncate mt-0.5">{hardware.gpuRenderer}</span>
							</div>
							<div class="flex flex-col p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
								<span class="text-zinc-500 text-[10px]">{i18n.t('cpu_threads')}</span>
								<span class="font-mono text-zinc-200 mt-0.5">{hardware.cpuCores} Threads Aktif</span>
							</div>
							<div class="flex flex-col p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
								<span class="text-zinc-500 text-[10px]">{i18n.t('fps')} Live:</span>
								<span class="font-mono text-emerald-400 mt-0.5 font-bold">{rigging.fps || 0} FPS</span>
							</div>
							<div class="flex flex-col p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
								<span class="text-zinc-500 text-[10px]">{i18n.t('latency')} Tracking:</span>
								<span class="font-mono text-cyan-400 mt-0.5 font-bold">{rigging.latencyMs || 0} ms</span>
							</div>
						</div>

						<!-- RTX Acceleration Explanation -->
						<div class="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-start gap-2.5">
							<Sparkles class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
							<div class="space-y-1">
								<span class="font-semibold text-cyan-300">{i18n.t('rtx_title')}</span>
								<p class="text-[11px] text-zinc-300 leading-relaxed">
									{i18n.t('rtx_desc')}
								</p>
							</div>
						</div>
					</div>

				<!-- TAB 2: Tracking & Kestabilan (Anti-Flicker & Camera Hardware) -->
				{:else if activeTab === 'tracking'}
					<div class="space-y-4">
						<div class="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3.5">
							<h3 class="text-[11px] font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
								<SlidersHorizontal class="w-3.5 h-3.5" />
								<span>{i18n.t('tracking_settings_title')}</span>
							</h3>

							<!-- Sensitivity -->
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span class="text-zinc-300">{i18n.t('sensitivity')}</span>
									<span class="font-mono text-cyan-400">{rigging.trackingSensitivity.toFixed(2)}x</span>
								</div>
								<input
									type="range"
									min="0.5"
									max="2.5"
									step="0.05"
									bind:value={rigging.trackingSensitivity}
									oninput={() => rigging.persist()}
									class="w-full accent-cyan-400 cursor-pointer"
								/>
							</div>

							<!-- Smoothing -->
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span class="text-zinc-300">{i18n.t('smoothing')}</span>
									<span class="font-mono text-violet-400">{(rigging.smoothingAmount * 100).toFixed(0)}%</span>
								</div>
								<input
									type="range"
									min="0.0"
									max="1.0"
									step="0.05"
									bind:value={rigging.smoothingAmount}
									oninput={() => rigging.persist()}
									class="w-full accent-violet-400 cursor-pointer"
								/>
							</div>

							<!-- Jitter Suppression (Anti-Flicker) -->
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span class="text-zinc-300">{i18n.t('jitter_filter')}</span>
									<span class="font-mono text-emerald-400">{(rigging.jitterReduction * 100).toFixed(0)}%</span>
								</div>
								<input
									type="range"
									min="0.0"
									max="1.0"
									step="0.05"
									bind:value={rigging.jitterReduction}
									oninput={() => rigging.persist()}
									class="w-full accent-emerald-400 cursor-pointer"
								/>
							</div>

							<!-- Deadzone -->
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span class="text-zinc-300">{i18n.t('deadzone')}</span>
									<span class="font-mono text-amber-400">{rigging.deadzoneThreshold.toFixed(1)}°</span>
								</div>
								<input
									type="range"
									min="0"
									max="1.5"
									step="0.1"
									bind:value={rigging.deadzoneThreshold}
									oninput={() => rigging.persist()}
									class="w-full accent-amber-400 cursor-pointer"
								/>
							</div>

							<!-- Toggles -->
							<div class="pt-2 border-t border-zinc-800 space-y-2.5">
								<div class="flex items-center justify-between">
									<span class="text-zinc-300">{i18n.t('blink_sync')}</span>
									<input
										type="checkbox"
										bind:checked={rigging.eyeBlinkLinked}
										onchange={() => rigging.persist()}
										class="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
									/>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-zinc-300">{i18n.t('hold_pose_loss')}</span>
									<input
										type="checkbox"
										bind:checked={rigging.holdPoseOnLoss}
										onchange={() => rigging.persist()}
										class="w-4 h-4 accent-violet-400 rounded cursor-pointer"
									/>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-zinc-300">{i18n.t('hands_toggle')}</span>
									<input
										type="checkbox"
										bind:checked={rigging.enableHandTracking}
										onchange={() => rigging.persist()}
										class="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
									/>
								</div>
							</div>
						</div>

						<!-- Camera Hardware Device Selection -->
						<div class="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
							<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
								<Camera class="w-3.5 h-3.5 text-cyan-400" />
								<span>{i18n.t('camera_device')}</span>
							</h3>

							<div class="grid grid-cols-2 gap-2">
								<div>
									<label for="webcam-device-select" class="block text-[11px] text-zinc-400 mb-1">Webcam:</label>
									<select
										id="webcam-device-select"
										bind:value={rigging.cameraDeviceId}
										onchange={handleCameraChange}
										class="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
									>
										<option value="">Default System Camera</option>
										{#each availableCameras as cam}
											<option value={cam.deviceId}>{cam.label}</option>
										{/each}
									</select>
								</div>

								<div>
									<label for="camera-res-select" class="block text-[11px] text-zinc-400 mb-1">{i18n.t('camera_resolution')}:</label>
									<select
										id="camera-res-select"
										bind:value={rigging.cameraResolution}
										onchange={handleCameraChange}
										class="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
									>
										<option value="1080p">1080p Full HD (60 FPS)</option>
										<option value="720p">720p HD (Optimal / 60 FPS)</option>
										<option value="480p">480p Performance (30 FPS)</option>
									</select>
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 3: Tema & Tampilan -->
				{:else if activeTab === 'appearance'}
					<div class="space-y-4">
						<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
							{i18n.t('theme_selector_title')}
						</h3>
						<div class="grid grid-cols-2 gap-2.5">
							{#each themes as t}
								<button
									onclick={() => {
										rigging.uiTheme = t.id;
										rigging.persist();
									}}
									class="p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 {
										rigging.uiTheme === t.id
											? 'bg-zinc-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30 text-white'
											: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
									}"
								>
									<div class="flex items-center justify-between w-full">
										<div class="flex items-center gap-2">
											<span class="w-3 h-3 rounded-full {t.color}"></span>
											<span class="font-semibold text-xs text-zinc-100">{t.label}</span>
										</div>
										{#if rigging.uiTheme === t.id}
											<Check class="w-3.5 h-3.5 text-cyan-400" />
										{/if}
									</div>
									<span class="text-[10px] text-zinc-500 leading-snug">{t.desc}</span>
								</button>
							{/each}
						</div>

						<!-- Rigging Inspector Layout Mode Preference -->
						<div class="pt-3 border-t border-zinc-800 space-y-2">
							<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
								Rigging Inspector Layout
							</h3>
							<div class="grid grid-cols-3 gap-2">
								<button
									onclick={() => {
										rigging.riggingViewMode = 'stay';
										rigging.isRiggingPinned = true;
										rigging.persist();
									}}
									class="p-2.5 rounded-xl border text-center transition-all {
										rigging.riggingViewMode === 'stay'
											? 'bg-violet-500/10 border-violet-500 text-violet-300 font-semibold'
											: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
									}"
								>
									{i18n.t('rigging_stay')}
								</button>
								<button
									onclick={() => {
										rigging.riggingViewMode = 'windowed';
										rigging.isRiggingPinned = true;
										rigging.persist();
									}}
									class="p-2.5 rounded-xl border text-center transition-all {
										rigging.riggingViewMode === 'windowed'
											? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 font-semibold'
											: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
									}"
								>
									{i18n.t('rigging_windowed')}
								</button>
								<button
									onclick={() => {
										rigging.riggingViewMode = 'drawer';
										rigging.isRiggingPinned = false;
										rigging.persist();
									}}
									class="p-2.5 rounded-xl border text-center transition-all {
										rigging.riggingViewMode === 'drawer'
											? 'bg-pink-500/10 border-pink-500 text-pink-300 font-semibold'
											: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
									}"
								>
									{i18n.t('rigging_drawer')}
								</button>
							</div>
						</div>

						<!-- Language Selector -->
						<div class="pt-3 border-t border-zinc-800 space-y-2">
							<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
								<Languages class="w-3.5 h-3.5 text-cyan-400" />
								<span>{i18n.t('language')}</span>
							</h3>
							<div class="grid grid-cols-3 gap-2">
								{#each languages as lang}
									<button
										onclick={() => {
											i18n.setLocale(lang.code);
											rigging.persist();
										}}
										class="p-2.5 rounded-xl border text-center transition-all {
											i18n.currentLocale === lang.code
												? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 font-semibold'
												: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
										}"
									>
										{lang.label}
									</button>
								{/each}
							</div>
						</div>
					</div>

				<!-- TAB 4: Storage & Data Management -->
				{:else if activeTab === 'storage'}
					<div class="space-y-4">
						<div class="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2 font-semibold text-zinc-200">
									<Database class="w-4 h-4 text-amber-400" />
									<span>{i18n.t('auto_save_title')}</span>
								</div>
								<span class="font-mono text-[10px] text-zinc-500">{storageUsageBytes} bytes used</span>
							</div>
							<p class="text-zinc-400 text-xs leading-relaxed">
								{i18n.t('auto_save_desc')}
							</p>
						</div>

						<div class="grid grid-cols-2 gap-2.5">
							<!-- Export -->
							<button
								onclick={handleExport}
								class="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-200 font-medium transition-all active:scale-95"
							>
								<Download class="w-4 h-4 text-cyan-400" />
								<span>{i18n.t('export_config')}</span>
							</button>

							<!-- Import -->
							<label
								class="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-200 font-medium transition-all active:scale-95 cursor-pointer"
							>
								<Upload class="w-4 h-4 text-pink-400" />
								<span>{i18n.t('import_config')}</span>
								<input type="file" accept=".json" onchange={handleImportFile} class="hidden" />
							</label>
						</div>

						<!-- Reset Button -->
						<div class="pt-2">
							<button
								onclick={handleResetDefaults}
								class="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl transition-colors font-medium active:scale-95 text-xs"
							>
								<RotateCcw class="w-3.5 h-3.5" />
								<span>{i18n.t('reset_defaults')}</span>
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="p-3.5 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-400">
				<span class="text-[11px] font-mono">MiruNova Live v0.8.0 • 100% Free & Client-Side</span>
				<button
					onclick={() => (rigging.isSettingsModalOpen = false)}
					class="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors"
				>
					{i18n.t('done')}
				</button>
			</div>
		</div>
	</div>
{/if}
