<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { voice } from '#lib/core/audio';
	import { i18n, type Locale } from '#lib/i18n/index.svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		Camera,
		CameraOff,
		Crosshair,
		Sliders,
		Palette,
		Layers,
		Radio,
		Tv,
		Hand,
		Move,
		MousePointer,
		Settings,
		Aperture,
		Lock,
		ChevronDown,
		ChevronUp,
		Mic,
		MicOff,
		Video,
		RefreshCw,
		SlidersHorizontal,
		Info,
		Smile,
		Sparkles,
		Box,
		X
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';
	import { threeStage, type FramingMode3D } from '#lib/core/threeStage';
	import type { AvatarFramingMode } from '#lib/types/tracking';

	let isDeviceMenuOpen = $state<boolean>(false);
	let isExpressionMenuOpen = $state<boolean>(false);
	let isCursorToolMenuOpen = $state<boolean>(false);
	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);
	let availableMics = $state<Array<{ deviceId: string; label: string }>>([]);

	const DEFAULT_EXPRESSIONS = [
		{ id: '', label: 'Netral', emoji: '😐' },
		{ id: 'stars', label: 'Star Eyes', emoji: '⭐' },
		{ id: 'smile', label: 'Senyum', emoji: '😊' },
		{ id: 'blush', label: 'Blush', emoji: '😳' },
		{ id: 'wink', label: 'Kedip', emoji: '😉' },
		{ id: 'surprised', label: 'Kaget', emoji: '😮' },
		{ id: 'cry', label: 'Menangis', emoji: '😭' },
		{ id: 'pout', label: 'Marah', emoji: '😡' },
		{ id: 'love', label: 'Love', emoji: '💖' }
	];

	function handleSelectExpression(expId: string, label: string) {
		playSfx('expression');
		rigging.setExpression(expId);
		if (rigging.avatarEngine === '3d') {
			threeStage.setExpression(expId);
		}
		rigging.showToast(expId ? `Ekspresi: ${label}` : 'Ekspresi Netral');
	}

	function handleSelectFraming(mode: AvatarFramingMode) {
		playSfx('click');
		rigging.framingMode = mode;
		if (rigging.avatarEngine === '3d') {
			threeStage.setFraming(mode as FramingMode3D);
		}
		rigging.showToast(`Kamera: ${mode === 'full' ? '🧍 Full Body' : mode === 'half' ? '🥋 Half Body' : '👤 Close-Up Face'}`);
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
		refreshDevices(true);
		const onDeviceChange = () => refreshDevices(true);
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
			playSfx('cameraOff');
			tracker.stopCamera();
		} else {
			try {
				playSfx('cameraOn');
				await tracker.startCamera();
				refreshDevices(false);
			} catch (e: any) {
				alert(e?.message || 'Error activating camera');
			}
		}
	}

	async function toggleMicrophone() {
		playSfx('toggle');
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
		playSfx('calibrate');
		tracker.calibrate();
	}
</script>

{#if rigging.isDockHidden}
	<!-- Collapsed Floating Pill to Restore Menu Dock -->
	<div
		transition:fly={{ y: 24, duration: 220, easing: cubicOut }}
		class="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center select-none"
	>
		<button
			onclick={() => rigging.toggleDock(false)}
			class="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-full text-zinc-300 hover:text-cyan-300 text-xs shadow-2xl backdrop-blur-md transition-all active:scale-95 group"
		>
			<ChevronUp class="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
			<span class="font-medium text-[11px] tracking-wide">Tampilkan Menu <span class="font-mono text-[10px] text-zinc-500">[H]</span></span>
		</button>
	</div>
{:else}
	<div
		transition:fly={{ y: 60, duration: 260, easing: cubicOut }}
		class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 select-none max-w-[98vw]"
	>
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
				class="pointer-events-none absolute -top-10 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shadow-2xl transition-all duration-150 scale-95 z-[70] border {
					isLightTheme ? 'bg-white/95 border-zinc-300 text-zinc-800' : 'bg-zinc-900/95 border-zinc-700/80 text-zinc-200'
				} {isDeviceMenuOpen ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100'}"
			>
				{i18n.t('devices_menu_title')}
			</div>

			<!-- Quick Device Selector Popover Card -->
			{#if isDeviceMenuOpen}
				<!-- Click outside backdrop closer -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-[80]"
					onclick={() => (isDeviceMenuOpen = false)}
				></div>

				<div
					class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-84 max-w-[calc(100vw-1.5rem)] backdrop-blur-2xl border rounded-2xl shadow-2xl p-4 z-[85] space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-default text-left {
						isLightTheme ? 'bg-white/98 border-zinc-200 text-zinc-900 shadow-xl' : 'bg-zinc-950/98 border-zinc-700/80 text-zinc-100 shadow-2xl'
					}"
				>
					<div class="flex items-center justify-between pb-2 border-b {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
						<span class="text-xs font-bold flex items-center gap-1.5 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							<Video class="w-3.5 h-3.5 text-cyan-500" />
							{i18n.t('devices_menu_title')}
						</span>
						<button
							onclick={() => refreshDevices(true)}
							class="flex items-center gap-1 text-[10px] transition-colors cursor-pointer {
								isLightTheme ? 'text-zinc-500 hover:text-cyan-600' : 'text-zinc-400 hover:text-cyan-300'
							}"
							title={i18n.t('refresh_devices')}
						>
							<RefreshCw class="w-3 h-3" />
							<span>{i18n.t('refresh_devices')}</span>
						</button>
					</div>

					<!-- Camera Section -->
					<div class="space-y-1.5 text-xs">
						<label for="dock-cam-select" class="block text-[11px] font-medium flex items-center gap-1.5 {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
							<Camera class="w-3 h-3 text-cyan-500" />
							{i18n.t('camera_device')}
						</label>
						<select
							id="dock-cam-select"
							bind:value={rigging.cameraDeviceId}
							onchange={async (e) => {
								const target = e.target as HTMLSelectElement;
								await tracker.switchCamera(target.value);
							}}
							class="w-full border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer {
								isLightTheme ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-200'
							}"
						>
							<option value="">📸 Auto Deteksi Kamera Hardware Laptop</option>
							{#each availableCameras as cam}
								<option value={cam.deviceId}>
									{formatCameraBadge(cam.label)}
								</option>
							{/each}
						</select>

						{#if rigging.activeCameraLabel}
							<div class="px-2 py-1 border rounded-lg text-[10px] flex items-center gap-1.5 font-mono {
								isLightTheme ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
							}">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
								<span class="truncate"><strong>Hardware:</strong> {rigging.activeCameraLabel}</span>
							</div>
						{/if}

						<div class="p-2 border rounded-xl text-[10px] flex items-start gap-1.5 leading-relaxed {
							isLightTheme ? 'bg-cyan-50 border-cyan-200 text-zinc-700' : 'bg-cyan-950/30 border-cyan-800/30 text-cyan-300/90'
						}">
							<Info class="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
							<span><strong>Iriun / DroidCam / Phone:</strong> {i18n.t('phone_webcam_tip')}</span>
						</div>
					</div>

					<!-- Microphone Section -->
					<div class="space-y-1.5 text-xs">
						<div class="flex items-center justify-between">
							<label for="dock-mic-select" class="text-[11px] font-medium flex items-center gap-1.5 {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
								<Mic class="w-3 h-3 text-emerald-500" />
								{i18n.t('mic_input_label')}
							</label>
							<span class="text-[10px] font-mono {rigging.isMicActive ? 'text-emerald-500 font-bold' : isLightTheme ? 'text-zinc-400' : 'text-zinc-500'}">
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
							class="w-full border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer {
								isLightTheme ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-200'
							}"
						>
							<option value="">Default Microphone</option>
							{#each availableMics as mic}
								<option value={mic.deviceId}>{mic.label}</option>
							{/each}
						</select>
						{#if rigging.isMicActive}
							<div class="w-full h-1.5 rounded-full overflow-hidden border {isLightTheme ? 'bg-zinc-200 border-zinc-300' : 'bg-zinc-900 border-zinc-800'}">
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

		<!-- 3. Cursor Tool Mode Selector (Pan / Move Layer & Props / Hand Tracking) -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					playSfx('click');
					isCursorToolMenuOpen = !isCursorToolMenuOpen;
					isDeviceMenuOpen = false;
					isExpressionMenuOpen = false;
				}}
				class="relative p-2.5 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 {
					rigging.cursorToolMode === 'select-layer'
						? 'text-amber-400 bg-amber-500/20 border border-amber-500/40 shadow-sm shadow-amber-500/20'
						: rigging.cursorToolMode === 'hand-tracking'
							? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
							: isCursorToolMenuOpen
								? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
								: 'text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('cursor_mode_title')}
			>
				{#if rigging.cursorToolMode === 'select-layer'}
					<MousePointer class="w-5 h-5 text-amber-400" />
				{:else if rigging.cursorToolMode === 'hand-tracking'}
					<Hand class="w-5 h-5 text-emerald-400" />
				{:else}
					<Move class="w-5 h-5 text-cyan-400" />
				{/if}

				{#if rigging.cursorToolMode !== 'pan'}
					<span class="absolute top-1 right-1 w-2 h-2 rounded-full {rigging.cursorToolMode === 'select-layer' ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse"></span>
				{/if}
			</button>

			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('cursor_mode_title')}: {
					rigging.cursorToolMode === 'select-layer'
						? i18n.t('cursor_mode_select_layer')
						: rigging.cursorToolMode === 'hand-tracking'
							? i18n.t('cursor_mode_hand_tracking')
							: i18n.t('cursor_mode_pan')
				}
			</div>

			<!-- Floating Cursor Tool Mode Selector Popover -->
			{#if isCursorToolMenuOpen}
				<!-- Click-outside backdrop closer -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					transition:fade={{ duration: 120 }}
					class="fixed inset-0 z-[80]"
					onclick={() => (isCursorToolMenuOpen = false)}
				></div>

				<div
					transition:fly={{ y: 12, duration: 180, easing: cubicOut }}
					class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 max-w-[calc(100vw-1.5rem)] backdrop-blur-2xl border rounded-2xl shadow-2xl p-2.5 z-[85] space-y-1.5 cursor-default text-left {
						isLightTheme ? 'bg-white/98 border-zinc-200 text-zinc-900 shadow-xl' : 'bg-zinc-950/98 border-zinc-700/80 text-zinc-100 shadow-2xl'
					}"
				>
					<div class="flex items-center justify-between pb-1.5 border-b px-1 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
						<span class="text-xs font-bold flex items-center gap-1.5 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							<MousePointer class="w-3.5 h-3.5 text-cyan-500" />
							{i18n.t('cursor_mode_title')}
						</span>
						<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
							Tools
						</span>
					</div>

					<!-- Option 1: Pan Stage & Avatar -->
					<button
						type="button"
						onclick={() => {
							playSfx('click');
							rigging.setCursorToolMode('pan');
							rigging.enableHandTracking = false;
							isCursorToolMenuOpen = false;
						}}
						class="w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer {
							rigging.cursorToolMode === 'pan'
								? isLightTheme
									? 'bg-cyan-50 border border-cyan-400 text-cyan-900 font-bold'
									: 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
								: isLightTheme
									? 'hover:bg-zinc-100 text-zinc-700'
									: 'hover:bg-zinc-900 text-zinc-300'
						}"
					>
						<div class="flex items-center gap-2">
							<div class="p-1.5 rounded-lg {rigging.cursorToolMode === 'pan' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-400'}">
								<Move class="w-3.5 h-3.5" />
							</div>
							<div>
								<div class="font-bold text-xs">{i18n.t('cursor_mode_pan')}</div>
								<div class="text-[10px] text-zinc-400">Geser kanvas panggung & zoom</div>
							</div>
						</div>
						{#if rigging.cursorToolMode === 'pan'}
							<span class="w-2 h-2 rounded-full bg-cyan-400"></span>
						{/if}
					</button>

					<!-- Option 2: Select & Move Layer / Props -->
					<button
						type="button"
						onclick={() => {
							playSfx('click');
							rigging.setCursorToolMode('select-layer');
							rigging.enableHandTracking = false;
							isCursorToolMenuOpen = false;
						}}
						class="w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer {
							rigging.cursorToolMode === 'select-layer'
								? isLightTheme
									? 'bg-amber-50 border border-amber-400 text-amber-900 font-bold'
									: 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
								: isLightTheme
									? 'hover:bg-zinc-100 text-zinc-700'
									: 'hover:bg-zinc-900 text-zinc-300'
						}"
					>
						<div class="flex items-center gap-2">
							<div class="p-1.5 rounded-lg {rigging.cursorToolMode === 'select-layer' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}">
								<MousePointer class="w-3.5 h-3.5" />
							</div>
							<div>
								<div class="font-bold text-xs">{i18n.t('cursor_mode_select_layer')}</div>
								<div class="text-[10px] text-zinc-400">Pilih & drag elemen, collab, aksesoris</div>
							</div>
						</div>
						{#if rigging.cursorToolMode === 'select-layer'}
							<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
						{/if}
					</button>

					<!-- Option 3: MediaPipe Hand Tracking -->
					<button
						type="button"
						onclick={() => {
							playSfx('click');
							rigging.setCursorToolMode('hand-tracking');
							rigging.enableHandTracking = true;
							isCursorToolMenuOpen = false;
						}}
						class="w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer {
							rigging.cursorToolMode === 'hand-tracking'
								? isLightTheme
									? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-bold'
									: 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
								: isLightTheme
									? 'hover:bg-zinc-100 text-zinc-700'
									: 'hover:bg-zinc-900 text-zinc-300'
						}"
					>
						<div class="flex items-center gap-2">
							<div class="p-1.5 rounded-lg {rigging.cursorToolMode === 'hand-tracking' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}">
								<Hand class="w-3.5 h-3.5" />
							</div>
							<div>
								<div class="font-bold text-xs">{i18n.t('cursor_mode_hand_tracking')}</div>
								<div class="text-[10px] text-zinc-400">Pelacakan pose tangan MediaPipe AI</div>
							</div>
						</div>
						{#if rigging.cursorToolMode === 'hand-tracking'}
							<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
						{/if}
					</button>
				</div>
			{/if}
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
					isDeviceMenuOpen = false;
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-pink-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('models')}
			>
				<Box class="w-5 h-5 text-pink-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('models')} [M]
			</div>
		</div>

		<!-- 8b. Live2D Model Expression Variations Selector -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					playSfx('click');
					isExpressionMenuOpen = !isExpressionMenuOpen;
					isDeviceMenuOpen = false;
				}}
				class="relative p-2.5 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 {
					isExpressionMenuOpen || rigging.activeExpression
						? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
						: 'text-zinc-400 hover:text-pink-300 hover:bg-zinc-800/60'
				}"
				aria-label="Ekspresi Wajah Model"
			>
				<Smile class="w-5 h-5 text-pink-400" />
				{#if rigging.activeExpression}
					<span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
				{/if}
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shadow-2xl transition-all duration-150 scale-95 z-[70] border {
					isLightTheme ? 'bg-white/95 border-zinc-300 text-zinc-800' : 'bg-zinc-900/95 border-zinc-700/80 text-zinc-200'
				} {isExpressionMenuOpen ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100'}"
			>
				{i18n.t('expressions_title')} ({rigging.availableExpressions.length}) [E]
			</div>

			<!-- Unified Floating Expression & Stage Controls Popover -->
			{#if isExpressionMenuOpen}
				<!-- Click-outside backdrop closer -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-[80]"
					onclick={() => (isExpressionMenuOpen = false)}
				></div>

				<div
					class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 max-w-[calc(100vw-1.5rem)] backdrop-blur-2xl border rounded-2xl shadow-2xl p-3 z-[85] space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-default text-left {
						isLightTheme ? 'bg-white/98 border-zinc-200 text-zinc-900 shadow-xl' : 'bg-zinc-950/98 border-zinc-700/80 text-zinc-100 shadow-2xl'
					}"
				>
					<!-- Header -->
					<div class="flex items-center justify-between border-b pb-2 px-1 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
						<div class="flex items-center gap-1.5">
							<Sparkles class="w-4 h-4 text-pink-500 animate-pulse" />
							<span class="font-bold text-xs tracking-wide {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
								Ekspresi Wajah & Panggung
							</span>
						</div>
						{#if rigging.activeExpression}
							<button
								type="button"
								onclick={() => handleSelectExpression('', 'Netral')}
								class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-mono cursor-pointer hover:bg-pink-500/30 transition-colors"
								title="Reset ke Netral"
							>
								<span>{rigging.activeExpression}</span>
								<X class="w-3 h-3" />
							</button>
						{:else}
							<span class="text-[9px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-500 font-mono">
								Netral
							</span>
						{/if}
					</div>

					<!-- Section 1: Kamera Framing Presets -->
					<div class="space-y-1">
						<span class="text-[10px] font-bold text-zinc-400 block px-1">FRAMING KAMERA</span>
						<div class="grid grid-cols-3 gap-1 text-[11px]">
							<button
								type="button"
								onclick={() => handleSelectFraming('full')}
								class="p-1.5 rounded-xl border font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer {
									rigging.framingMode === 'full'
										? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm'
										: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
								}"
							>
								<span>🧍</span>
								<span>Full Body</span>
							</button>
							<button
								type="button"
								onclick={() => handleSelectFraming('half')}
								class="p-1.5 rounded-xl border font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer {
									rigging.framingMode === 'half'
										? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm'
										: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
								}"
							>
								<span>🥋</span>
								<span>Half Body</span>
							</button>
							<button
								type="button"
								onclick={() => handleSelectFraming('closeup')}
								class="p-1.5 rounded-xl border font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer {
									rigging.framingMode === 'closeup'
										? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm'
										: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
								}"
							>
								<span>👤</span>
								<span>Close-Up</span>
							</button>
						</div>
					</div>

					<!-- Section 2: Universal Facial Expressions Grid -->
					<div class="space-y-1">
						<span class="text-[10px] font-bold text-pink-400 block px-1">EKSPRESI WAJAH</span>
						<div class="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-0.5">
							{#each DEFAULT_EXPRESSIONS as exp}
								<button
									type="button"
									onclick={() => handleSelectExpression(exp.id, exp.label)}
									class="p-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate {
										rigging.activeExpression === exp.id
											? 'bg-pink-500/25 border-pink-500/60 text-pink-300 font-bold shadow-sm ring-1 ring-pink-500/40'
											: isLightTheme
												? 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
												: 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
									}"
								>
									<span>{exp.emoji}</span>
									<span class="truncate text-[11px]">{exp.label}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Section 3: 3D Turntable & Orbit Controls (Only shown for 3D engine) -->
					{#if rigging.avatarEngine === '3d'}
						<div class="space-y-1 pt-1 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
							<span class="text-[10px] font-bold text-amber-400 block px-1">ROTASI 3D STAGE</span>
							<div class="flex items-center gap-1.5">
								<button
									type="button"
									onclick={() => {
										playSfx('toggle');
										rigging.is3DAutoSpin = !rigging.is3DAutoSpin;
										rigging.showToast(rigging.is3DAutoSpin ? '🔄 3D Auto-Spin 360° Aktif' : 'Auto-Spin Dihentikan');
									}}
									class="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
										rigging.is3DAutoSpin
											? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/50'
											: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
									}"
									title="Putar Otomatis 360° Turntable"
								>
									<span class="{rigging.is3DAutoSpin ? 'animate-spin' : ''}">🔄</span>
									<span class="text-[11px]">{rigging.is3DAutoSpin ? 'Stop Spin' : '360° Spin'}</span>
								</button>

								<button
									type="button"
									onclick={() => {
										playSfx('click');
										threeStage.rotateOrbitDegrees(-45);
										rigging.showToast('↺ Putar Sudut 3D -45°');
									}}
									class="p-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer {
										isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
									}"
									title="Putar Kiri 45°"
								>
									↺ -45°
								</button>

								<button
									type="button"
									onclick={() => {
										playSfx('click');
										threeStage.rotateOrbitDegrees(45);
										rigging.showToast('↻ Putar Sudut 3D +45°');
									}}
									class="p-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer {
										isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
									}"
									title="Putar Kanan 45°"
								>
									↻ +45°
								</button>

								<button
									type="button"
									onclick={() => {
										playSfx('click');
										threeStage.resetOrbit();
										rigging.is3DAutoSpin = false;
										rigging.showToast('🎯 Sudut 3D Direset ke Depan');
									}}
									class="p-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer {
										isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
									}"
									title="Reset Poros 3D ke Depan"
								>
									🎯 Reset
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- 8c. Photoshop Layers, Props & Collab Manager Modal Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					rigging.toggleLayerManager();
					rigging.isThemeModalOpen = false;
					rigging.isModelModalOpen = false;
					rigging.isObsModalOpen = false;
					rigging.isSettingsModalOpen = false;
					isDeviceMenuOpen = false;
					isExpressionMenuOpen = false;
				}}
				class="p-2.5 rounded-xl transition-colors cursor-pointer hover:scale-105 active:scale-95 {
					rigging.isLayerManagerOpen
						? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
						: 'text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('layer_manager_title')}
			>
				<Layers class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('layer_manager_title')} [P]
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

		<!-- 12. Sembunyikan Panel Dock Button -->
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
