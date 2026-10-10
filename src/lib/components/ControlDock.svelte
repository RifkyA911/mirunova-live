<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { voice } from '#lib/core/audio';
	import { i18n, type Locale } from '#lib/i18n/index.svelte';
	import {
		Camera,
		CameraOff,
		Crosshair,
		Sliders,
		Palette,
		Layers,
		Languages,
		Radio,
		Tv,
		Hand,
		Settings,
		Aperture,
		Keyboard,
		Lock,
		ChevronDown,
		ChevronUp,
		Mic,
		MicOff,
		Video,
		RefreshCw,
		SlidersHorizontal,
		Info
	} from 'lucide-svelte';

	let isLangMenuOpen = $state<boolean>(false);
	let isDeviceMenuOpen = $state<boolean>(false);
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);
	let availableMics = $state<Array<{ deviceId: string; label: string }>>([]);

	const languages: Array<{ code: Locale; label: string; flag: string }> = [
		{ code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
		{ code: 'en', label: 'English', flag: '🇬🇧' },
		{ code: 'ja', label: '日本語', flag: '🇯🇵' }
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
	}

	onMount(() => {
		refreshDevices(false);
		const onDeviceChange = () => refreshDevices(false);
		if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
			navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
		}
		return () => {
			if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
				navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
			}
		};
	});

	async function toggleCamera() {
		if (rigging.isCameraActive) {
			tracker.stopCamera();
		} else {
			try {
				await tracker.startCamera();
				refreshDevices(false);
			} catch (e: any) {
				alert(e?.message || 'Error activating camera');
			}
		}
	}

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
				refreshDevices(false);
				rigging.showToast('✓ ' + i18n.t('mic_active'));
			} else {
				rigging.isMicActive = false;
				rigging.showToast('Gagal mengakses mikrofon');
			}
		} else {
			voice.stop();
			rigging.micVolumeLevel = 0;
			rigging.showToast(i18n.t('mic_muted'));
		}
		rigging.persist();
	}

	function handleCalibrate() {
		tracker.calibrate();
	}
</script>

{#if rigging.isDockHidden}
	<!-- Collapsed Floating Pill to Restore Menu Dock -->
	<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
		<button
			onclick={() => rigging.toggleDock(false)}
			class="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-full text-zinc-300 hover:text-cyan-300 text-xs shadow-2xl backdrop-blur-md transition-all active:scale-95 group"
		>
			<ChevronUp class="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
			<span class="font-medium text-[11px] tracking-wide">Tampilkan Menu <span class="font-mono text-[10px] text-zinc-500">[H]</span></span>
		</button>
	</div>
{:else}
	<div class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 select-none animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[98vw]">
		<nav
			aria-label="Main Dock Controls"
			class="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 bg-zinc-950/92 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-2xl relative overflow-visible max-w-full"
		>
		<!-- 1. Camera Toggle (Icon Only + Hover Tooltip) -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={toggleCamera}
				class="p-2.5 rounded-xl transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 {
					rigging.isCameraActive
						? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-md shadow-rose-500/10'
						: 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/25'
				}"
				aria-label={rigging.isCameraActive ? i18n.t('stop_tracking') : i18n.t('start_tracking')}
			>
				{#if rigging.isCameraActive}
					<CameraOff class="w-5 h-5" />
				{:else}
					<Camera class="w-5 h-5" />
				{/if}
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{rigging.isCameraActive ? i18n.t('stop_tracking') : i18n.t('start_tracking')}
			</div>
		</div>

		<!-- 2. Microphone Toggle -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={toggleMicrophone}
				class="p-2.5 rounded-xl transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 {
					rigging.isMicActive
						? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-md shadow-emerald-500/10'
						: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
				}"
				aria-label={rigging.isMicActive ? i18n.t('mic_active') : i18n.t('mic_muted')}
			>
				{#if rigging.isMicActive}
					<Mic class="w-5 h-5 text-emerald-400" />
				{:else}
					<MicOff class="w-5 h-5" />
				{/if}
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{rigging.isMicActive ? i18n.t('mic_active') : i18n.t('mic_muted')} [V]
			</div>
		</div>

		<!-- 3. Quick Device Selector Popover -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					isDeviceMenuOpen = !isDeviceMenuOpen;
					isLangMenuOpen = false;
					if (isDeviceMenuOpen) refreshDevices(false);
				}}
				class="p-2.5 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 {
					isDeviceMenuOpen
						? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-md'
						: 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('devices_menu_title')}
			>
				<SlidersHorizontal class="w-5 h-5 {isDeviceMenuOpen ? 'text-indigo-300' : 'text-zinc-400'}" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('devices_menu_title')}
			</div>

			<!-- Quick Device Selector Popover Card -->
			{#if isDeviceMenuOpen}
				<!-- Click outside backdrop closer -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-[65]"
					onclick={() => (isDeviceMenuOpen = false)}
				></div>

				<div
					class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-84 bg-zinc-950/98 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl shadow-2xl p-4 z-[70] space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-default text-left"
				>
					<div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
						<span class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
							<Video class="w-3.5 h-3.5 text-cyan-400" />
							{i18n.t('devices_menu_title')}
						</span>
						<button
							onclick={() => refreshDevices(true)}
							class="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
							title={i18n.t('refresh_devices')}
						>
							<RefreshCw class="w-3 h-3" />
							<span>{i18n.t('refresh_devices')}</span>
						</button>
					</div>

					<!-- Camera Section -->
					<div class="space-y-1.5 text-xs">
						<label for="dock-cam-select" class="block text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
							<Camera class="w-3 h-3 text-cyan-400" />
							{i18n.t('camera_device')}
						</label>
						<select
							id="dock-cam-select"
							bind:value={rigging.cameraDeviceId}
							onchange={async (e) => {
								const target = e.target as HTMLSelectElement;
								await tracker.switchCamera(target.value);
							}}
							class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
						>
							<option value="">Default Webcam / Integrated</option>
							{#each availableCameras as cam}
								<option value={cam.deviceId}>{cam.label}</option>
							{/each}
						</select>

						{#if rigging.activeCameraLabel}
							<div class="px-2 py-1 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-[10px] text-emerald-300 flex items-center gap-1.5 font-mono">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
								<span class="truncate"><strong>Hardware:</strong> {rigging.activeCameraLabel}</span>
							</div>
						{/if}

						<div class="p-2 bg-cyan-950/30 border border-cyan-800/30 rounded-xl text-[10px] text-cyan-300/90 flex items-start gap-1.5 leading-relaxed">
							<Info class="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
							<span><strong>Iriun / DroidCam / Phone:</strong> {i18n.t('phone_webcam_tip')}</span>
						</div>
					</div>

					<!-- Microphone Section -->
					<div class="space-y-1.5 text-xs">
						<div class="flex items-center justify-between">
							<label for="dock-mic-select" class="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
								<Mic class="w-3 h-3 text-emerald-400" />
								{i18n.t('mic_input_label')}
							</label>
							<span class="text-[10px] font-mono {rigging.isMicActive ? 'text-emerald-400' : 'text-zinc-500'}">
								{rigging.isMicActive ? Math.round(rigging.micVolumeLevel * 100) + '%' : 'Off'}
							</span>
						</div>
						<select
							id="dock-mic-select"
							bind:value={rigging.audioDeviceId}
							onchange={async (e) => {
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
							}}
							class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
						>
							<option value="">Default Microphone</option>
							{#each availableMics as mic}
								<option value={mic.deviceId}>{mic.label}</option>
							{/each}
						</select>
						{#if rigging.isMicActive}
							<div class="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
								<div
									class="h-full bg-emerald-500 transition-all duration-75"
									style="width: {Math.max(2, Math.min(100, rigging.micVolumeLevel * 100))}%"
								></div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 2. Calibrate Center Pose -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={handleCalibrate}
				disabled={!rigging.isCameraActive}
				class="p-2.5 rounded-xl transition-all text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('calibrate')}
			>
				<Crosshair class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('calibrate')} [C]
			</div>
		</div>

		<!-- 3. Hand Tracking Toggle -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => (rigging.enableHandTracking = !rigging.enableHandTracking)}
				class="p-2.5 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 {
					rigging.enableHandTracking
						? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm'
						: 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('hands_toggle')}
			>
				<Hand class="w-5 h-5" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('hands_toggle')} ({rigging.enableHandTracking ? 'Active' : 'Off'})
			</div>
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 4. Rigging Preview & Inspector Drawer Toggle Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => (rigging.isDrawerOpen = !rigging.isDrawerOpen)}
				class="relative p-2.5 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 {
					rigging.isDrawerOpen
						? 'bg-violet-500 text-white shadow-md shadow-violet-500/25'
						: 'text-zinc-400 hover:text-violet-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('rigging_preview')}
			>
				<Sliders class="w-5 h-5 {rigging.isDrawerOpen ? 'text-white' : 'text-violet-400'}" />
				{#if rigging.riggingMode === 'manual'}
					<span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
				{/if}
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('rigging_preview')} [R]
			</div>
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 5. OBS Screen Mode Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => rigging.toggleObsMode(true)}
				class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
				aria-label={i18n.t('obs_mode')}
			>
				<Radio class="w-5 h-5 animate-pulse" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('obs_mode')} [O]
			</div>
		</div>

		<!-- 6. OBS Stream Setup (URL & Guide) -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					rigging.isObsModalOpen = true;
					rigging.isThemeModalOpen = false;
					rigging.isModelModalOpen = false;
					rigging.isDrawerOpen = false;
					isLangMenuOpen = false;
					isDeviceMenuOpen = false;
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('obs_setup')}
			>
				<Tv class="w-5 h-5 text-emerald-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('obs_setup')}
			</div>
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 7. Themes & Background Manager Modal Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					rigging.isThemeModalOpen = !rigging.isThemeModalOpen;
					rigging.isModelModalOpen = false;
					rigging.isObsModalOpen = false;
					isLangMenuOpen = false;
					isDeviceMenuOpen = false;
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('themes_bg')}
			>
				<Palette class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('themes_bg')} [T]
			</div>
		</div>

		<!-- 8. Model Catalog & Motions Modal Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					rigging.isModelModalOpen = !rigging.isModelModalOpen;
					rigging.isThemeModalOpen = false;
					rigging.isObsModalOpen = false;
					isLangMenuOpen = false;
					isDeviceMenuOpen = false;
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-pink-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('models')}
			>
				<Layers class="w-5 h-5 text-pink-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('models')} [M]
			</div>
		</div>

		<!-- 9. Screenshot & Download Avatar -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => rigging.triggerScreenshot()}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label="Screenshot Avatar"
			>
				<Aperture class="w-5 h-5 text-amber-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('screenshot_btn')} [S]
			</div>
		</div>

		<!-- 10. Settings Modal Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					rigging.isSettingsModalOpen = !rigging.isSettingsModalOpen;
					rigging.isThemeModalOpen = false;
					rigging.isModelModalOpen = false;
					rigging.isObsModalOpen = false;
					rigging.isDrawerOpen = false;
					isLangMenuOpen = false;
					isDeviceMenuOpen = false;
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('settings_title')}
			>
				<Settings class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('settings_title')} [F2]
			</div>
		</div>

		<!-- 11. Clear GUI / Lock Screen Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => rigging.toggleGuiLock()}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('clear_gui_btn')}
			>
				<Lock class="w-5 h-5 text-amber-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('clear_gui_btn')} [L]
			</div>
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 12. Language Switcher Dropdown (Floating Above Dock) -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					isLangMenuOpen = !isLangMenuOpen;
					isDeviceMenuOpen = false;
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95 {
					isLangMenuOpen ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : ''
				}"
				aria-label="Language"
			>
				<Languages class="w-5 h-5" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				Language: {i18n.currentLocale.toUpperCase()}
			</div>

			<!-- Language Dropdown Menu (Floating Above Dock with Backdrop Closer) -->
			{#if isLangMenuOpen}
				<!-- Click outside backdrop closer -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-[65]"
					onclick={() => (isLangMenuOpen = false)}
				></div>

				<div
					class="absolute bottom-full mb-3 right-0 w-48 bg-zinc-950/98 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl shadow-2xl p-1.5 z-[70] space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-default text-left"
				>
					<div class="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 border-b border-zinc-800/60 mb-1">
						{i18n.t('language')}
					</div>
					{#each languages as lang}
						<button
							onclick={() => {
								i18n.setLocale(lang.code);
								isLangMenuOpen = false;
								rigging.persist();
							}}
							class="w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer {
								i18n.currentLocale === lang.code
									? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
									: 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
							}"
						>
							<span class="flex items-center gap-2">
								<span class="text-sm">{lang.flag}</span>
								<span>{lang.label}</span>
							</span>
							{#if i18n.currentLocale === lang.code}
								<span class="w-2 h-2 rounded-full bg-cyan-400"></span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 13. Keyboard Shortcuts Guide Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					rigging.toggleShortcutModal();
					isLangMenuOpen = false;
					isDeviceMenuOpen = false;
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('shortcuts_title')}
			>
				<Keyboard class="w-5 h-5 text-zinc-300" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('shortcuts_title')} [F1 / ?]
			</div>
		</div>

		<!-- 14. Sembunyikan Panel Dock Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => rigging.toggleDock(true)}
				class="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label="Toggle Dock"
			>
				<ChevronDown class="w-5 h-5" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				Dock [H]
			</div>
		</div>
	</nav>
</div>
{/if}
