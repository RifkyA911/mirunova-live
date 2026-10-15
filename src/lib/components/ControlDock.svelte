<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { voice, VOICE_MODELS } from '#lib/core/audio';
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
		ChevronLeft,
		ChevronRight,
		Mic,
		MicOff,
		Video,
		RefreshCw,
		SlidersHorizontal,
		Info,
		Smile,
		Sparkles,
		Box,
		X,
		Compass,
		Play,
		Activity,
		User,
		Maximize2,
		RotateCcw,
		RotateCw,
		GripVertical,
		Home,
		Trees,
		Sun,
		Flame,
		Music,
		Languages,
		Check,
		Monitor,
		Coffee,
		Umbrella,
		Flower2,
		Navigation,
		Volume2
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';
	import { threeStage, type FramingMode3D, type FullBodyPose3D, type StageAreaWaypoint, type StageEnvironment3D } from '#lib/core/threeStage';
	import type { AvatarFramingMode, PoseLoopMode } from '#lib/types/tracking';
	import { UI_THEMES } from '#lib/data/themes';

	let isDeviceMenuOpen = $state<boolean>(false);
	let isExpressionMenuOpen = $state<boolean>(false);
	let isStageMenuOpen = $state<boolean>(false);
	let isCursorToolMenuOpen = $state<boolean>(false);
	let isLanguageMenuOpen = $state<boolean>(false);
	let expressionActiveTab = $state<'expressions' | 'poses' | 'motions'>('expressions');

	const POSE_LOOPS = $derived.by(() => [
		{ id: 'idle-breath' as PoseLoopMode, label: i18n.t('loop_idle'), emoji: '🫁', desc: i18n.t('poses_loop_sub') },
		{ id: 'gentle-sway' as PoseLoopMode, label: i18n.t('loop_sway'), emoji: '🌾', desc: i18n.t('poses_loop_sub') },
		{ id: 'head-nod' as PoseLoopMode, label: i18n.t('loop_nod'), emoji: '🙂', desc: i18n.t('motion_nod_sub') },
		{ id: 'wave' as PoseLoopMode, label: i18n.t('motion_wave_label'), emoji: '👋', desc: i18n.t('motion_wave_sub') },
		{ id: 'none' as PoseLoopMode, label: i18n.t('loop_none'), emoji: '🛑', desc: i18n.t('loop_none') }
	]);

	const FULL_BODY_POSES_3D = $derived.by(() => [
		{ id: 'idle' as FullBodyPose3D, label: i18n.t('exp_neutral_pose'), emoji: '🧍' },
		{ id: 'cat-paw' as FullBodyPose3D, label: i18n.t('pose_cat_paw'), emoji: '🐾' },
		{ id: 'sit' as FullBodyPose3D, label: i18n.t('pose_sit'), emoji: '🪑' },
		{ id: 'shy' as FullBodyPose3D, label: i18n.t('pose_shy'), emoji: '👉👈' },
		{ id: 'tsundere' as FullBodyPose3D, label: i18n.t('pose_tsundere'), emoji: '😤' },
		{ id: 'thinking' as FullBodyPose3D, label: i18n.t('pose_thinking'), emoji: '🤔' },
		{ id: 'idol' as FullBodyPose3D, label: i18n.t('pose_idol'), emoji: '🌟' },
		{ id: 'bow' as FullBodyPose3D, label: i18n.t('pose_bow'), emoji: '🙇' },
		{ id: 'cross-arms' as FullBodyPose3D, label: i18n.t('pose_cross_arms'), emoji: '🙅' },
		{ id: 'wave' as FullBodyPose3D, label: i18n.t('motion_wave_label'), emoji: '👋' },
		{ id: 'peace' as FullBodyPose3D, label: i18n.t('pose_peace'), emoji: '✌️' },
		{ id: 'heart' as FullBodyPose3D, label: i18n.t('pose_heart'), emoji: '🫶' },
		{ id: 'stand' as FullBodyPose3D, label: i18n.t('pose_stand'), emoji: '🚶' }
	]);

	const STAGE_WAYPOINTS = $derived.by(() => [
		{ id: 'pc' as StageAreaWaypoint, label: i18n.t('waypoint_pc'), desc: i18n.t('waypoint_pc_desc'), emoji: '🖥️', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
		{ id: 'bed' as StageAreaWaypoint, label: i18n.t('waypoint_bed'), desc: i18n.t('waypoint_bed_desc'), emoji: '🛏️', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
		{ id: 'cafe-bar' as StageAreaWaypoint, label: i18n.t('waypoint_cafe_bar'), desc: i18n.t('waypoint_cafe_bar_desc'), emoji: '☕', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
		{ id: 'beach-umbrella' as StageAreaWaypoint, label: i18n.t('waypoint_beach_umbrella'), desc: i18n.t('waypoint_beach_umbrella_desc'), emoji: '🏖️', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
		{ id: 'meadow-flowers' as StageAreaWaypoint, label: i18n.t('waypoint_meadow_flowers'), desc: i18n.t('waypoint_meadow_flowers_desc'), emoji: '🌸', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
		{ id: 'center' as StageAreaWaypoint, label: i18n.t('waypoint_center'), desc: i18n.t('waypoint_center_desc'), emoji: '🎯', color: 'border-violet-500/40 bg-violet-500/10 text-violet-400' }
	]);

	const STAGE_ENVIRONMENTS = $derived.by(() => [
		{
			id: 'grid' as StageEnvironment3D,
			name: i18n.t('stage_grid_name'),
			desc: i18n.t('stage_grid_desc'),
			badge: 'Classic Cyber',
			color: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300',
			icon: '🌐'
		},
		{
			id: 'room' as StageEnvironment3D,
			name: i18n.t('stage_room_name'),
			desc: i18n.t('stage_room_desc'),
			badge: 'Cozy Room',
			color: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
			icon: '🏠'
		},
		{
			id: 'cafe' as StageEnvironment3D,
			name: i18n.t('stage_cafe_name'),
			desc: i18n.t('stage_cafe_desc'),
			badge: 'Coffee Shop',
			color: 'border-yellow-600/50 bg-amber-950/40 text-amber-200',
			icon: '☕'
		},
		{
			id: 'beach' as StageEnvironment3D,
			name: i18n.t('stage_beach_name'),
			desc: i18n.t('stage_beach_desc'),
			badge: 'Happy Vibe',
			color: 'border-cyan-400/50 bg-cyan-950/40 text-cyan-200',
			icon: '🏖️'
		},
		{
			id: 'field' as StageEnvironment3D,
			name: i18n.t('stage_field_name'),
			desc: i18n.t('stage_field_desc'),
			badge: 'Nature',
			color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
			icon: '🌱'
		},
		{
			id: 'sunset' as StageEnvironment3D,
			name: i18n.t('stage_sunset_name'),
			desc: i18n.t('stage_sunset_desc'),
			badge: 'Golden Hour',
			color: 'border-orange-500/50 bg-orange-950/30 text-orange-300',
			icon: '🌅'
		},
		{
			id: 'studio' as StageEnvironment3D,
			name: i18n.t('stage_studio_name'),
			desc: i18n.t('stage_studio_desc'),
			badge: 'Live Idol',
			color: 'border-purple-500/50 bg-purple-950/30 text-purple-300',
			icon: '🎤'
		},
		{
			id: 'dojo' as StageEnvironment3D,
			name: i18n.t('stage_dojo_name'),
			desc: i18n.t('stage_dojo_desc'),
			badge: 'Japanese Zen',
			color: 'border-rose-400/50 bg-rose-950/30 text-rose-300',
			icon: '⛩️'
		},
		{
			id: 'void' as StageEnvironment3D,
			name: i18n.t('stage_void_name'),
			desc: i18n.t('stage_void_desc'),
			badge: 'Clean Dark',
			color: 'border-zinc-700 bg-zinc-900/60 text-zinc-300',
			icon: '🌌'
		}
	]);

	function isHexLight(hex?: string): boolean {
		if (!hex || hex.length < 7) return false;
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return luminance > 0.6;
	}

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme) ||
		(rigging.uiTheme === 'custom' && isHexLight(rigging.customThemeConfig?.bg))
	);
	const currentTheme = $derived.by(() => {
		if (rigging.uiTheme === 'custom' && rigging.customThemeConfig) {
			return rigging.customThemeConfig;
		}
		const found = UI_THEMES.find((t) => t.id === rigging.uiTheme);
		return (
			found?.palette || {
				bg: '#09090b',
				surface: '#18181b',
				accent: '#ec4899',
				border: '#27272a',
				text: '#f4f4f5',
				ring: '#ec4899'
			}
		);
	});
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);
	let availableMics = $state<Array<{ deviceId: string; label: string }>>([]);

	const DEFAULT_EXPRESSIONS = [
		{ id: '', label: 'Netral', emoji: '😐', category: 'basic', badge: 'Normal' },
		{ id: 'smile', label: 'Senyum', emoji: '😊', category: 'basic', badge: 'Happy' },
		{ id: 'laugh', label: 'Tertawa', emoji: '😄', category: 'basic', badge: 'Joy' },
		{ id: 'surprised', label: 'Kaget', emoji: '😲', category: 'basic', badge: 'Shock' },
		{ id: 'cry', label: 'Menangis', emoji: '😭', category: 'basic', badge: 'Sad' },
		{ id: 'angry', label: 'Marah', emoji: '😡', category: 'basic', badge: 'Mad' },
		{ id: 'stars', label: 'Star Eyes', emoji: '⭐', category: 'anime', badge: 'Sparkle' },
		{ id: 'blush', label: 'Blush', emoji: '😳', category: 'anime', badge: 'Shy' },
		{ id: 'wink', label: 'Kedip', emoji: '😉', category: 'anime', badge: 'Wink' },
		{ id: 'love', label: 'Love Eyes', emoji: '💖', category: 'anime', badge: 'Heart' },
		{ id: 'pout', label: 'Cemberut', emoji: '😤', category: 'anime', badge: 'Pout' },
		{ id: 'smug', label: 'Smug', emoji: '😏', category: 'anime', badge: 'Heh' },
		{ id: 'tongue', label: 'Lidah Melet', emoji: '😜', category: 'anime', badge: 'Bleh' },
		{ id: 'flat', label: 'Deadpan', emoji: '😑', category: 'anime', badge: 'Flat' },
		{ id: 'dazed', label: 'Pusing', emoji: '💫', category: 'anime', badge: 'Dizzy' },
		{ id: 'sleepy', label: 'Mengantuk', emoji: '😴', category: 'anime', badge: 'Sleep' },
	];

	function handleSelectExpression(expId: string, label: string) {
		playSfx('expression');
		rigging.setExpression(expId);
		if (rigging.avatarEngine === '3d') {
			threeStage.setExpression(expId);
		}
		rigging.showToast(expId ? `${i18n.t('expressions_title')}: ${label}` : i18n.t('exp_neutral_pose'));
		isExpressionMenuOpen = false;
	}

	function handleSelectFraming(mode: AvatarFramingMode) {
		playSfx('click');
		rigging.framingMode = mode;
		if (rigging.avatarEngine === '3d') {
			threeStage.setFraming(mode as FramingMode3D);
		}
		rigging.showToast(`${i18n.t('framing_cam_title')}: ${mode === 'full' ? `🧍 ${i18n.t('framing_full')}` : mode === 'half' ? `🥋 ${i18n.t('framing_half')}` : `👤 ${i18n.t('framing_closeup')}`}`);
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
				rigging.showToast(i18n.t('mic_access_failed'));
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

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && isExpressionMenuOpen) {
			isExpressionMenuOpen = false;
		}
	}}
/>


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
			<span class="font-medium text-[11px] tracking-wide">{i18n.t('dock_show_menu')} <span class="font-mono text-[10px] text-zinc-500">[H]</span></span>
		</button>
	</div>
{:else}
	<div
		transition:fly={{ y: 60, duration: 260, easing: cubicOut }}
		class="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center select-none max-w-[calc(100vw-1rem)] sm:max-w-max"
	>
		<nav
			aria-label="Main Dock Controls"
			class="flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2.5 bg-zinc-950/92 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-2xl relative overflow-x-auto sm:overflow-visible max-w-full scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] touch-pan-x"
		>
		<!-- 1. Camera Toggle (Icon Only + Hover Tooltip) -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={toggleCamera}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] rounded-xl transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center {
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
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70] hidden sm:block"
			>
				{rigging.isCameraActive ? i18n.t('stop_tracking') : i18n.t('start_tracking')}
			</div>
		</div>

		<!-- 2. Microphone Toggle -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={toggleMicrophone}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] rounded-xl transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center {
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
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70] hidden sm:block"
			>
				{rigging.isMicActive ? i18n.t('mic_active') : i18n.t('mic_muted')} [V]
			</div>
		</div>

		<!-- 3. Quick Device Selector Popover -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => {
					isDeviceMenuOpen = !isDeviceMenuOpen;
					if (isDeviceMenuOpen) refreshDevices(false);
				}}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center {
					isDeviceMenuOpen
						? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-md'
						: 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('devices_menu_title')}
			>
				<SlidersHorizontal class="w-5 h-5 {isDeviceMenuOpen ? 'text-indigo-300' : 'text-zinc-400'}" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shadow-2xl transition-all duration-150 scale-95 z-[70] border hidden sm:block {
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
					class="fixed sm:absolute bottom-20 sm:bottom-full mb-3 left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] sm:w-84 max-w-sm backdrop-blur-2xl border rounded-2xl shadow-2xl p-3.5 sm:p-4 z-[85] space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-default text-left max-h-[75dvh] overflow-y-auto {
						isLightTheme ? 'bg-white/98 border-zinc-200 text-zinc-900 shadow-xl' : 'bg-zinc-950/98 border-zinc-700/80 text-zinc-100 shadow-2xl'
					}"
				>
					<div class="flex items-center justify-between pb-2 border-b {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
						<span class="text-xs font-bold flex items-center gap-1.5 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							<Video class="w-3.5 h-3.5 text-cyan-500" />
							{i18n.t('devices_menu_title')}
						</span>
						<div class="flex items-center gap-2">
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
							<button
								type="button"
								onclick={() => (isDeviceMenuOpen = false)}
								class="p-1 rounded-lg hover:bg-zinc-800/60 {isLightTheme ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'} transition-colors cursor-pointer"
								title={i18n.t('close_tooltip')}
								aria-label={i18n.t('close_tooltip')}
							>
								<X class="w-3.5 h-3.5" />
							</button>
						</div>
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
							<option value="">{i18n.t('cam_auto_detect')}</option>
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

						<!-- Quick Mic Sidetone Monitor -->
						<div class="pt-1.5 flex items-center justify-between border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
							<span class="text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'} flex items-center gap-1.5">
								<Volume2 class="w-3.5 h-3.5 text-cyan-400" />
								{i18n.t('mic_monitor_quick')}
							</span>
							<button
								type="button"
								onclick={() => {
									playSfx('toggle');
									rigging.isMicMonitorActive = !rigging.isMicMonitorActive;
									voice.setMonitor(rigging.isMicMonitorActive);
									rigging.persist();
									rigging.showToast(rigging.isMicMonitorActive ? '🔊 ' + i18n.t('mic_monitor_quick') + ' On' : '🔇 ' + i18n.t('mic_monitor_quick') + ' Off');
								}}
								class="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer {
									rigging.isMicMonitorActive
										? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
										: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
								}"
							>
								{rigging.isMicMonitorActive ? 'ON' : 'OFF'}
							</button>
						</div>

						<!-- Quick Voice Filter Selector -->
						<div class="pt-1 space-y-1">
							<label for="dock-voice-filter" class="text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'} flex items-center justify-between">
								<span class="flex items-center gap-1.5">
									<Sparkles class="w-3 h-3 text-violet-400" />
									{i18n.t('voice_filter_label')}
								</span>
								<span class="text-[10px] font-mono text-violet-400 font-bold uppercase">{rigging.voiceFilter}</span>
							</label>
							<select
								id="dock-voice-filter"
								bind:value={rigging.voiceFilter}
								onchange={(e) => {
									const target = e.target as HTMLSelectElement;
									rigging.voiceFilter = target.value as any;
									voice.setFilter(rigging.voiceFilter);
									rigging.persist();
									rigging.showToast(`✨ Filter: ${rigging.voiceFilter}`);
								}}
								class="w-full border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-violet-500 cursor-pointer {
									isLightTheme ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-200'
								}"
							>
								{#each VOICE_MODELS as vm}
									<option value={vm.id}>{vm.name} ({vm.badge})</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5 shrink-0"></div>

		<!-- 2. Calibrate Center Pose -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={handleCalibrate}
				disabled={!rigging.isCameraActive}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] rounded-xl transition-all text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
				aria-label={i18n.t('calibrate')}
			>
				<Crosshair class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70] hidden sm:block"
			>
				{i18n.t('calibrate')} [C]
			</div>
		</div>

		<!-- 3. Cursor Tool Mode Selector (Pan / Move Layer & Props / Hand Tracking) -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => {
					playSfx('click');
					isCursorToolMenuOpen = !isCursorToolMenuOpen;
					isDeviceMenuOpen = false;
					isExpressionMenuOpen = false;
				}}
				class="relative p-2 sm:p-2.5 min-w-[40px] min-h-[40px] rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center {
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
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70] hidden sm:block"
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
					class="fixed sm:absolute bottom-20 sm:bottom-full mb-3 left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] sm:w-64 max-w-xs backdrop-blur-2xl border rounded-2xl shadow-2xl p-2.5 z-[85] space-y-1.5 cursor-default text-left max-h-[75dvh] overflow-y-auto {
						isLightTheme ? 'bg-white/98 border-zinc-200 text-zinc-900 shadow-xl' : 'bg-zinc-950/98 border-zinc-700/80 text-zinc-100 shadow-2xl'
					}"
				>
					<div class="flex items-center justify-between pb-1.5 border-b px-1 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
						<span class="text-xs font-bold flex items-center gap-1.5 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							<MousePointer class="w-3.5 h-3.5 text-cyan-500" />
							{i18n.t('cursor_mode_title')}
						</span>
						<div class="flex items-center gap-1.5">
							<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
								Tools
							</span>
							<button
								type="button"
								onclick={() => (isCursorToolMenuOpen = false)}
								class="p-1 rounded-lg hover:bg-zinc-800/60 {isLightTheme ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'} transition-colors cursor-pointer"
								title={i18n.t('close_tooltip')}
								aria-label={i18n.t('close_tooltip')}
							>
								<X class="w-3.5 h-3.5" />
							</button>
						</div>
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
								<div class="text-[10px] text-zinc-400">{i18n.t('cursor_mode_pan_desc')}</div>
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
								<div class="text-[10px] text-zinc-400">{i18n.t('cursor_mode_select_layer_desc')}</div>
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
								<div class="text-[10px] text-zinc-400">{i18n.t('cursor_mode_hand_tracking_desc')}</div>
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
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => {
					rigging.isThemeModalOpen = !rigging.isThemeModalOpen;
					rigging.isModelModalOpen = false;
					rigging.isObsModalOpen = false;
					isDeviceMenuOpen = false;
				}}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
				aria-label={i18n.t('themes_bg')}
			>
				<Palette class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70] hidden sm:block"
			>
				{i18n.t('themes_bg')} [T]
			</div>
		</div>

		<!-- 7b. Stage Environment Selector Popover & Button -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => {
					playSfx('click');
					isStageMenuOpen = !isStageMenuOpen;
					isExpressionMenuOpen = false;
					isDeviceMenuOpen = false;
					isCursorToolMenuOpen = false;
					rigging.isModelModalOpen = false;
					rigging.isThemeModalOpen = false;
				}}
				class="relative p-2 sm:p-2.5 min-w-[40px] min-h-[40px] rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center {
					isStageMenuOpen
						? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
						: 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('stage_title')}
			>
				<Compass class="w-5 h-5 text-indigo-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70] hidden sm:block"
			>
				{i18n.t('stage_title')} [B]
			</div>

			<!-- Floating Stage Environment Popover -->
			{#if isStageMenuOpen}
				<!-- Backdrop closer -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="fixed inset-0 z-[80]" onclick={() => (isStageMenuOpen = false)}></div>

				<div
					transition:fly={{ y: 12, duration: 180, easing: cubicOut }}
					class="fixed sm:absolute bottom-20 sm:bottom-full mb-3 left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] sm:w-[480px] max-w-[calc(100vw-1.5rem)] sm:max-w-[480px] backdrop-blur-3xl border rounded-3xl shadow-2xl p-3.5 sm:p-4 z-[85] space-y-3 cursor-default text-left max-h-[78dvh] overflow-y-auto {
						isLightTheme ? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xl' : 'bg-zinc-950/90 border-white/15 text-zinc-100 shadow-2xl'
					}"
				>
					<div class="flex items-center justify-between border-b pb-2 px-1 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
						<div class="flex items-center gap-2">
							<Compass class="w-4 h-4 text-indigo-400" />
							<span class="font-bold text-xs uppercase tracking-wide">{i18n.t('stage_title')} ({STAGE_ENVIRONMENTS.length} Stages)</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
								{rigging.stageEnvironment}
							</span>
							<button
								type="button"
								onclick={() => (isStageMenuOpen = false)}
								class="p-1 rounded-lg hover:bg-zinc-800/60 {isLightTheme ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'} transition-colors cursor-pointer"
								title={i18n.t('close_tooltip')}
								aria-label={i18n.t('close_tooltip')}
							>
								<X class="w-4 h-4" />
							</button>
						</div>
					</div>

					<!-- 7 Environments Grid with Visual Thumbnails -->
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
						{#each STAGE_ENVIRONMENTS as stageEnv}
							<button
								type="button"
								onclick={() => {
									playSfx('click');
									rigging.setStageEnvironment(stageEnv.id);
									threeStage.setStageEnvironment(stageEnv.id);
									rigging.showToast(`🪐 ${i18n.t('stage_3d_env_toast')} ${stageEnv.name}`);
								}}
								class="p-2 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 flex flex-col justify-between {
									rigging.stageEnvironment === stageEnv.id
										? `${stageEnv.color} ring-2 ring-indigo-400 font-bold shadow-md`
										: isLightTheme
											? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-800'
											: 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
								}"
							>
								<!-- Stage Visual Thumbnail Preview -->
								{#if stageEnv.id === 'grid'}
									<div class="w-full h-11 rounded-xl bg-gradient-to-b from-cyan-950/80 to-zinc-950 border border-cyan-500/30 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:8px_8px] opacity-40"></div>
										<div class="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-cyan-500/25 to-transparent border-t border-cyan-400/50"></div>
										<Compass class="w-4 h-4 text-cyan-400 relative z-10" />
									</div>
								{:else if stageEnv.id === 'room'}
									<div class="w-full h-11 rounded-xl bg-gradient-to-b from-[#fef7ee] to-[#e6d7c3] border border-amber-300/40 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute top-1 left-2 w-3 h-3.5 rounded-sm bg-pink-300/60 border border-pink-400/50"></div>
										<div class="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400/70 shadow-[0_0_6px_#fbbf24]"></div>
										<div class="absolute bottom-0 inset-x-0 h-3 bg-[#c8b7a0] border-t border-amber-800/20"></div>
										<Home class="w-4 h-4 text-amber-700 relative z-10" />
									</div>
								{:else if stageEnv.id === 'field'}
									<div class="w-full h-11 rounded-xl bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-200 border border-emerald-400/40 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute top-1 right-2 w-4 h-1.5 rounded-full bg-white/70 blur-[0.5px]"></div>
										<div class="absolute bottom-0 inset-x-0 h-3.5 rounded-t-full bg-gradient-to-b from-emerald-500 to-emerald-700 border-t border-emerald-300/50"></div>
										<Trees class="w-4 h-4 text-emerald-900 relative z-10" />
									</div>
								{:else if stageEnv.id === 'sunset'}
									<div class="w-full h-11 rounded-xl bg-gradient-to-b from-amber-500 via-rose-600 to-indigo-950 border border-rose-500/40 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-200 shadow-[0_0_8px_#fde047]"></div>
										<div class="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-t from-indigo-950 to-rose-900/60 border-t border-amber-300/40"></div>
										<Sun class="w-4 h-4 text-amber-100 relative z-10" />
									</div>
								{:else if stageEnv.id === 'studio'}
									<div class="w-full h-11 rounded-xl bg-gradient-to-b from-purple-950 via-zinc-950 to-black border border-purple-500/40 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute top-0 left-1.5 w-6 h-10 bg-gradient-to-br from-cyan-400/25 to-transparent -rotate-12 pointer-events-none"></div>
										<div class="absolute top-0 right-1.5 w-6 h-10 bg-gradient-to-bl from-pink-500/25 to-transparent rotate-12 pointer-events-none"></div>
										<div class="absolute bottom-0 inset-x-0 h-2.5 bg-purple-950/60 border-t border-purple-400/50"></div>
										<Music class="w-4 h-4 text-purple-300 relative z-10" />
									</div>
								{:else if stageEnv.id === 'dojo'}
									<div class="w-full h-11 rounded-xl bg-gradient-to-b from-[#e8dcc8] to-[#ab987a] border border-amber-700/30 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute inset-y-0 left-1 w-3 border-r border-stone-400/60 bg-white/40"></div>
										<div class="absolute inset-y-0 right-1 w-3 border-l border-stone-400/60 bg-white/40"></div>
										<div class="absolute bottom-0 inset-x-0 h-3 bg-[#c2b280] border-t border-amber-900/30"></div>
										<Flame class="w-4 h-4 text-rose-600 relative z-10" />
									</div>
								{:else if stageEnv.id === 'cafe'}
									<div class="w-full h-11 rounded-xl bg-gradient-to-b from-[#3d281c] via-[#24160d] to-black border border-amber-600/40 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute inset-x-2 bottom-0 h-3 bg-[#4a2e1b] border-t border-amber-500/30"></div>
										<Coffee class="w-4 h-4 text-amber-300 relative z-10" />
									</div>
								{:else if stageEnv.id === 'beach'}
									<div class="w-full h-11 rounded-xl bg-gradient-to-b from-sky-400 via-cyan-300 to-amber-200 border border-cyan-400/50 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute bottom-0 inset-x-0 h-3 bg-[#f6d365] border-t border-amber-300/60"></div>
										<Umbrella class="w-4 h-4 text-rose-500 relative z-10" />
									</div>
								{:else}
									<div class="w-full h-11 rounded-xl bg-black border border-zinc-700/50 mb-1.5 relative overflow-hidden flex items-center justify-center">
										<div class="absolute top-1.5 left-2 w-1 h-1 rounded-full bg-white/80"></div>
										<div class="absolute top-2 right-3 w-1 h-1 rounded-full bg-cyan-300/80"></div>
										<div class="absolute bottom-1 inset-x-2 h-1 rounded-full border border-violet-500/40 bg-violet-950/20"></div>
										<Sparkles class="w-4 h-4 text-violet-400 relative z-10" />
									</div>
								{/if}

								<div class="flex items-center justify-between mb-0.5">
									<span class="text-sm">{stageEnv.icon}</span>
									<span class="text-[8px] font-mono px-1 py-0.2 rounded bg-black/40 text-zinc-300">{stageEnv.badge}</span>
								</div>
								<div class="font-bold text-[11px] leading-tight">{stageEnv.name}</div>
								<div class="text-[8px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">{stageEnv.desc}</div>
							</button>
						{/each}
					</div>

					<!-- Stage Area Teleport Waypoints (PC, Bed, Cafe, Beach, Meadow, Center) -->
					<div class="pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'} space-y-2">
						<div class="flex items-center justify-between px-1 text-[11px] font-bold text-indigo-400">
							<span class="flex items-center gap-1.5">
								<Navigation class="w-3.5 h-3.5 text-indigo-400" />
								{i18n.t('waypoint_section_title')}
							</span>
							<span class="text-[9px] text-zinc-500">{i18n.t('waypoint_section_desc')}</span>
						</div>

						<div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
							{#each STAGE_WAYPOINTS as wp}
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										threeStage.teleportToArea(wp.id);
										rigging.activeStageWaypoint = wp.id;
										rigging.showToast(`${wp.emoji} ${wp.label}`);
									}}
									class="p-2 rounded-xl border text-left transition-all cursor-pointer active:scale-95 flex items-center gap-2 {
										rigging.activeStageWaypoint === wp.id
											? `${wp.color} ring-1.5 ring-indigo-400 font-bold shadow-sm`
											: isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
									}"
								>
									<span class="text-base shrink-0">{wp.emoji}</span>
									<div class="min-w-0">
										<div class="text-[11px] font-bold truncate leading-tight">{wp.label}</div>
										<div class="text-[8px] text-zinc-400 truncate leading-tight">{wp.desc}</div>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Manual Stage Movement & Area Geser Controls -->
					<div class="pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'} flex items-center justify-between gap-3">
						<div class="space-y-0.5">
							<div class="text-[11px] font-bold {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
								{i18n.t('stage_move_manual_title')}
							</div>
							<div class="text-[9px] text-zinc-500 font-mono">
								X: {threeStage.modelOffsetX.toFixed(2)} | Z: {threeStage.modelOffsetZ.toFixed(2)}
							</div>
						</div>

						<!-- Mini Joypad Buttons -->
						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={() => {
									playSfx('click');
									threeStage.moveModel(-0.3, 0);
									rigging.showToast(`← ${i18n.t('stage_move_left')}`);
								}}
								class="p-1.5 rounded-lg border text-xs cursor-pointer active:scale-95 {
									isLightTheme ? 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200'
								}"
								title={i18n.t('stage_move_left')}
							>
								<ChevronLeft class="w-3.5 h-3.5" />
							</button>

							<div class="flex flex-col gap-1">
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										threeStage.moveModel(0, 0.3);
										rigging.showToast(`↑ ${i18n.t('stage_move_forward')}`);
									}}
									class="p-1.5 rounded-lg border text-xs cursor-pointer active:scale-95 {
										isLightTheme ? 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200'
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
									class="p-1.5 rounded-lg border text-xs cursor-pointer active:scale-95 {
										isLightTheme ? 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200'
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
								class="p-1.5 rounded-lg border text-xs cursor-pointer active:scale-95 {
									isLightTheme ? 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-200'
								}"
								title={i18n.t('stage_move_right')}
							>
								<ChevronRight class="w-3.5 h-3.5" />
							</button>

							<button
								type="button"
								onclick={() => {
									playSfx('click');
									threeStage.resetModelPosition();
									rigging.activeStageWaypoint = 'center';
									rigging.showToast(`🎯 ${i18n.t('stage_move_reset')}`);
								}}
								class="p-1.5 rounded-lg border text-xs cursor-pointer active:scale-95 text-indigo-400 {
									isLightTheme ? 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800'
								}"
								title={i18n.t('stage_move_reset')}
							>
								<Crosshair class="w-3.5 h-3.5" />
							</button>
						</div>
					</div>

					<!-- Quick 3D Turntable Spin Toggle inside Stage Menu -->
					<div class="pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'} flex items-center justify-between text-xs">
						<span class="text-[11px] text-zinc-400 font-medium">Turntable 360° Spin:</span>
						<button
							type="button"
							onclick={() => {
								playSfx('toggle');
								rigging.is3DAutoSpin = !rigging.is3DAutoSpin;
								rigging.showToast(rigging.is3DAutoSpin ? i18n.t('stage_auto_spin') : i18n.t('stage_stop_spin'));
							}}
							class="px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer {
								rigging.is3DAutoSpin
									? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
							}"
						>
							{#if rigging.is3DAutoSpin}
								<RefreshCw class="w-3.5 h-3.5 animate-spin text-amber-400" />
								<span>{i18n.t('stage_stop_spin')}</span>
							{:else}
								<Play class="w-3.5 h-3.5 text-zinc-400" />
								<span>{i18n.t('stage_auto_spin')}</span>
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- 8. Model Catalog & Motions Modal Button -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => {
					rigging.isModelModalOpen = !rigging.isModelModalOpen;
					rigging.isThemeModalOpen = false;
					rigging.isObsModalOpen = false;
					isDeviceMenuOpen = false;
				}}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-pink-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('models')}
			>
				<Box class="w-5 h-5 text-pink-400" />
			</button>
			<div
				class="hidden sm:block pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('models')} [M]
			</div>
		</div>

		<!-- 8b. Live2D Model Expression Variations Selector -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => {
					playSfx('click');
					isExpressionMenuOpen = !isExpressionMenuOpen;
					isDeviceMenuOpen = false;
				}}
				class="relative p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 {
					isExpressionMenuOpen || rigging.activeExpression
						? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
						: 'text-zinc-400 hover:text-pink-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('expressions_title')}
			>
				<Smile class="w-5 h-5 text-pink-400" />
				{#if rigging.activeExpression}
					<span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
				{/if}
			</button>
			<div
				class="hidden sm:block pointer-events-none absolute -top-10 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shadow-2xl transition-all duration-150 scale-95 z-[70] border {
					isLightTheme ? 'bg-white/95 border-zinc-300 text-zinc-800' : 'bg-zinc-900/95 border-zinc-700/80 text-zinc-200'
				} {isExpressionMenuOpen ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100'}"
			>
				{i18n.t('expressions_title')} ({rigging.availableExpressions.length}) [E]
			</div>

			<!-- Unified Floating Expression & Stage Controls Popover -->
			{#if isExpressionMenuOpen}
				<!-- Click-outside backdrop closer: Covers entire screen at z-[80] -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-[80] bg-black/25 backdrop-blur-[0.5px]"
					onclick={() => (isExpressionMenuOpen = false)}
				></div>

				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					id="expression-popover-menu"
					class="fixed sm:absolute bottom-20 sm:bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-[calc(100vw-1rem)] sm:w-[820px] max-w-[calc(100vw-1rem)] sm:max-w-[820px] min-w-0 sm:min-w-[340px] max-h-[78dvh] overflow-y-auto backdrop-blur-3xl border rounded-3xl p-3.5 sm:p-4 z-[85] animate-in fade-in slide-in-from-bottom-2 duration-150 cursor-default text-left select-none sm:resize"
					onclick={(e) => e.stopPropagation()}
					style="background: {isLightTheme ? currentTheme.surface + 'f5' : currentTheme.surface + 'ea'}; border-color: {currentTheme.accent}55; color: {currentTheme.text}; box-shadow: 0 20px 60px rgba(0,0,0,0.65), 0 0 35px {currentTheme.accent}25; min-height: 290px;"
				>
					<!-- Header Bar with Tabs, Status, and Close -->
					<div class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b pb-2.5 px-1 mb-3 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
						<!-- Tab Switcher Pills -->
						<div class="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10 overflow-x-auto scrollbar-none max-w-full">
							<button
								type="button"
								onclick={() => (expressionActiveTab = 'expressions')}
								class="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap {
								expressionActiveTab === 'expressions'
										? 'bg-pink-500/25 border border-pink-500/60 text-pink-300 font-bold shadow-sm'
										: 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
								}"
							>
								<Smile class="w-3.5 h-3.5 text-pink-400" />
								<span>{i18n.t('tab_expressions')}</span>
								<span class="text-[9px] font-mono px-1 rounded bg-black/30 text-zinc-400">{DEFAULT_EXPRESSIONS.length}</span>
							</button>

							<button
								type="button"
								onclick={() => (expressionActiveTab = 'poses')}
								class="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap {
									expressionActiveTab === 'poses'
										? 'bg-violet-500/25 border border-violet-500/60 text-violet-300 font-bold shadow-sm'
										: 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
								}"
							>
								<Activity class="w-3.5 h-3.5 text-violet-400" />
								<span>{i18n.t('tab_poses')}</span>
							</button>

							<button
								type="button"
								onclick={() => (expressionActiveTab = 'motions')}
								class="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap {
									expressionActiveTab === 'motions'
										? 'bg-cyan-500/25 border border-cyan-500/60 text-cyan-300 font-bold shadow-sm'
										: 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
								}"
							>
								<Play class="w-3.5 h-3.5 text-cyan-400" />
								<span>{i18n.t('tab_motions')}</span>
								{#if rigging.availableMotions.length > 0}
									<span class="text-[9px] font-mono px-1 rounded bg-black/30 text-cyan-300">{rigging.availableMotions.length}</span>
								{/if}
							</button>
						</div>

						<!-- Right Status & Controls -->
						<div class="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold {
								rigging.activeExpression
									? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
									: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
							}">
								{rigging.activeExpression ? `${i18n.t('exp_active_label')} ${rigging.activeExpression}` : i18n.t('exp_neutral_pose')}
							</span>

							{#if rigging.activeExpression}
								<button
									type="button"
									onclick={() => handleSelectExpression('', 'Netral')}
									class="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-mono font-bold cursor-pointer hover:bg-pink-500/30 transition-colors"
									title={i18n.t('exp_reset_btn')}
								>
									<span>{i18n.t('exp_reset_btn')}</span>
									<X class="w-3 h-3" />
								</button>
							{/if}

							<button
								type="button"
								onclick={() => (isExpressionMenuOpen = false)}
								class="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
								title={i18n.t('close_tooltip')}
							>
								<X class="w-4 h-4" />
							</button>
						</div>
					</div>

					<!-- 2-Column Wide Horizontal Layout -->
					<div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
						<!-- Main Tab Content (8 cols) -->
						<div class="md:col-span-8 space-y-2">
							{#if expressionActiveTab === 'expressions'}
								<!-- TAB 1: FACIAL EXPRESSIONS (Unified Single Scroll Area: No Nested Scrollbar!) -->
								<div class="space-y-3.5 pr-1">
									<!-- Section 1: Ekspresi Utama -->
									<div class="space-y-1.5">
										<div class="flex items-center justify-between px-1 text-[10px] font-bold text-pink-400">
											<span>{i18n.t('exp_primary_title')} ({DEFAULT_EXPRESSIONS.length})</span>
											<span class="text-[9px] text-zinc-500 font-mono">{i18n.t('exp_hotkey_hint')}</span>
										</div>

										<!-- 4-column compact expression chip grid (no separate scrollbar!) -->
										<div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
											{#each DEFAULT_EXPRESSIONS as exp}
												<button
													type="button"
													onclick={() => handleSelectExpression(exp.id, exp.label)}
													class="p-1.5 sm:p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer group active:scale-95 {
														rigging.activeExpression === exp.id
															? 'bg-pink-500/25 border-pink-500/70 text-pink-300 font-bold shadow-sm ring-1 ring-pink-500/50'
															: isLightTheme
																? 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300'
																: 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
													}"
												>
													<span class="flex items-center gap-1.5 truncate">
														<span class="text-base shrink-0">{exp.emoji}</span>
														<span class="truncate font-semibold text-[11px]">{exp.label}</span>
													</span>
													<span class="text-[9px] px-1 py-0.2 rounded font-mono shrink-0 {
														rigging.activeExpression === exp.id ? 'bg-pink-500/30 text-pink-200' : 'bg-zinc-800 text-zinc-400'
													}">{exp.badge}</span>
												</button>
											{/each}
										</div>
									</div>

									<!-- Section 2: Model-Specific Blendshapes (Unified into same scroll container) -->
									{#if rigging.availableExpressions && rigging.availableExpressions.length > 0}
										<div class="pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'} space-y-1.5">
											<div class="flex items-center justify-between px-1 text-[10px] font-bold text-cyan-400">
												<span>{i18n.t('exp_model_specific')} ({rigging.availableExpressions.length})</span>
												<span class="text-[9px] text-zinc-500">{i18n.t('exp_live2d_morph')}</span>
											</div>
											<div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
												{#each rigging.availableExpressions as mExp}
													<button
														type="button"
														onclick={() => handleSelectExpression(mExp.name, mExp.label)}
														class="p-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate active:scale-95 {
															rigging.activeExpression === mExp.name
																? 'bg-cyan-500/25 border-cyan-500/70 text-cyan-300 font-bold shadow-sm ring-1 ring-cyan-500/50'
																: isLightTheme
																	? 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
																	: 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
														}"
														title={mExp.label}
													>
														<span class="shrink-0">✨</span>
														<span class="truncate font-medium">{mExp.label}</span>
													</button>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else if expressionActiveTab === 'poses'}
								<!-- TAB 2: POSES & POSE LOOPING -->
								<div class="space-y-3">
									<div class="flex items-center justify-between px-1 text-[10px] font-bold text-violet-400">
										<span>{i18n.t('poses_loop_title')} ({POSE_LOOPS.length})</span>
										<span class="text-[9px] text-zinc-500">{i18n.t('poses_loop_sub')}</span>
									</div>

									<!-- Pose Loops Grid -->
									<div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
										{#each POSE_LOOPS as loop}
											<button
												type="button"
												onclick={() => {
													playSfx('click');
													rigging.poseLoopMode = loop.id;
													rigging.showToast(`Loop Pose: ${loop.label}`);
													isExpressionMenuOpen = false;
												}}
												class="p-2 rounded-xl border text-left transition-all cursor-pointer active:scale-95 {
													rigging.poseLoopMode === loop.id
														? 'bg-violet-500/25 border-violet-500 text-violet-300 font-bold ring-1 ring-violet-500/50'
														: isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
												}"
											>
												<div class="flex items-center gap-1.5">
													<span class="text-base">{loop.emoji}</span>
													<span class="font-semibold text-xs">{loop.label}</span>
												</div>
												<div class="text-[9px] text-zinc-400 mt-0.5 truncate">{loop.desc}</div>
											</button>
										{/each}
									</div>

									<!-- Pose Loop Speed Slider -->
									{#if rigging.poseLoopMode !== 'none'}
										<div class="flex items-center gap-3 p-2 rounded-xl bg-black/30 border border-white/10">
											<span class="text-[11px] font-medium text-zinc-400 shrink-0">{i18n.t('poses_loop_speed')}</span>
											<input
												type="range"
												min="0.2"
												max="2.5"
												step="0.1"
												bind:value={rigging.poseLoopSpeed}
												class="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
											/>
											<span class="text-[11px] text-violet-300 font-mono font-bold w-10 text-right">{rigging.poseLoopSpeed.toFixed(1)}x</span>
										</div>
									{/if}

									<!-- 3D Full Body Poses Section (if 3D mode) -->
									{#if rigging.avatarEngine === '3d'}
										<div class="pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
											<div class="flex items-center justify-between px-1 mb-1.5 text-[10px] font-bold text-amber-400">
												<span>{i18n.t('poses_3d_body_title')}</span>
												<span class="text-[9px] text-zinc-500">{i18n.t('poses_3d_body_sub')}</span>
											</div>
											<div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-56 overflow-y-auto p-0.5">
												{#each FULL_BODY_POSES_3D as fbPose}
													<button
														type="button"
														onclick={() => {
															playSfx('click');
															threeStage.setFullBodyPose(fbPose.id);
															rigging.activeFullBodyPose = fbPose.id;
															rigging.showToast(`Pose 3D: ${fbPose.label}`);
															isExpressionMenuOpen = false;
														}}
														class="p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 {
															threeStage.activeFullBodyPose === fbPose.id
																? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/50'
																: isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
														}"
													>
														<div class="text-base mb-0.5">{fbPose.emoji}</div>
														<div class="text-[10px] font-semibold truncate">{fbPose.label}</div>
													</button>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else if expressionActiveTab === 'motions'}
								<!-- TAB 3: TRIGGER MOTIONS -->
								<div class="space-y-2.5">
									<div class="flex items-center justify-between px-1 text-[10px] font-bold text-cyan-400">
										<span>{i18n.t('motions_trigger_header')}</span>
										<span class="text-[9px] text-zinc-500">{i18n.t('motions_model_sub')}</span>
									</div>

									{#if rigging.availableMotions && rigging.availableMotions.length > 0}
										<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
											{#each rigging.availableMotions as motion}
												<button
													type="button"
													onclick={() => {
														playSfx('click');
														rigging.playMotion(motion);
														rigging.showToast(`Play: ${motion}`);
														isExpressionMenuOpen = false;
													}}
													class="p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 {
														isLightTheme ? 'bg-zinc-50 border-zinc-200 hover:bg-cyan-50 text-zinc-800' : 'bg-zinc-900/80 border-zinc-800 hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300'
													}"
												>
													<Play class="w-3.5 h-3.5 text-cyan-400 shrink-0" />
													<span class="font-mono text-xs font-semibold truncate">{motion}</span>
												</button>
											{/each}
										</div>
									{:else}
										<!-- Procedural Fallback Gestures -->
										<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
											<button
												type="button"
												onclick={() => {
													playSfx('click');
													rigging.playMotion('wave');
													rigging.showToast(`👋 ${i18n.t('motion_wave_label')}`);
													isExpressionMenuOpen = false;
												}}
												class="p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 bg-zinc-900/80 border-zinc-800 hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300"
											>
												<span class="text-lg">👋</span>
												<div>
													<div class="font-semibold text-xs">{i18n.t('motion_wave_label')}</div>
													<div class="text-[9px] text-zinc-500">{i18n.t('motion_wave_sub')}</div>
												</div>
											</button>

											<button
												type="button"
												onclick={() => {
													playSfx('click');
													rigging.playMotion('bow');
													rigging.showToast(`🙇 ${i18n.t('motion_bow_label')}`);
													isExpressionMenuOpen = false;
												}}
												class="p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 bg-zinc-900/80 border-zinc-800 hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300"
											>
												<span class="text-lg">🙇</span>
												<div>
													<div class="font-semibold text-xs">{i18n.t('motion_bow_label')}</div>
													<div class="text-[9px] text-zinc-500">{i18n.t('motion_bow_sub')}</div>
												</div>
											</button>

											<button
												type="button"
												onclick={() => {
													playSfx('click');
													rigging.playMotion('cheer');
													rigging.showToast(`🎉 ${i18n.t('motion_cheer_label')}`);
													isExpressionMenuOpen = false;
												}}
												class="p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 bg-zinc-900/80 border-zinc-800 hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300"
											>
												<span class="text-lg">🎉</span>
												<div>
													<div class="font-semibold text-xs">{i18n.t('motion_cheer_label')}</div>
													<div class="text-[9px] text-zinc-500">{i18n.t('motion_cheer_sub')}</div>
												</div>
											</button>

											<button
												type="button"
												onclick={() => {
													playSfx('click');
													rigging.playMotion('nod');
													rigging.showToast(`🙂 ${i18n.t('motion_nod_label')}`);
													isExpressionMenuOpen = false;
												}}
												class="p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 bg-zinc-900/80 border-zinc-800 hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300"
											>
												<span class="text-lg">🙂</span>
												<div>
													<div class="font-semibold text-xs">{i18n.t('motion_nod_label')}</div>
													<div class="text-[9px] text-zinc-500">{i18n.t('motion_nod_sub')}</div>
												</div>
											</button>

											<button
												type="button"
												onclick={() => {
													playSfx('click');
													rigging.playMotion('shake');
													rigging.showToast(`🙅 ${i18n.t('motion_shake_label')}`);
													isExpressionMenuOpen = false;
												}}
												class="p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 bg-zinc-900/80 border-zinc-800 hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300"
											>
												<span class="text-lg">🙅</span>
												<div>
													<div class="font-semibold text-xs">{i18n.t('motion_shake_label')}</div>
													<div class="text-[9px] text-zinc-500">{i18n.t('motion_shake_sub')}</div>
												</div>
											</button>

											<button
												type="button"
												onclick={() => {
													playSfx('click');
													rigging.playMotion('blink_fast');
													rigging.showToast(`✨ ${i18n.t('motion_blink_label')}`);
													isExpressionMenuOpen = false;
												}}
												class="p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer active:scale-95 bg-zinc-900/80 border-zinc-800 hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300"
											>
												<span class="text-lg">✨</span>
												<div>
													<div class="font-semibold text-xs">{i18n.t('motion_blink_label')}</div>
													<div class="text-[9px] text-zinc-500">{i18n.t('motion_blink_sub')}</div>
												</div>
											</button>
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Right Side: Framing & 3D Stage Controls (4 cols) -->
						<div class="md:col-span-4 space-y-2.5 md:border-l md:pl-3 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
							<!-- Framing -->
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-[10px] font-bold text-zinc-400">
									<span>{i18n.t('framing_cam_title')}</span>
									<span class="text-[9px] text-zinc-500 font-mono">{i18n.t('framing_reset_hotkey')}</span>
								</div>
								<div class="grid grid-cols-3 gap-1 text-xs">
									<button
										type="button"
										onclick={() => handleSelectFraming('full')}
										class="p-1.5 rounded-xl border font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 {
											rigging.framingMode === 'full'
												? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30 font-bold'
												: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
										}"
									>
										<span class="text-sm">🧍</span>
										<span class="text-[10px]">Full</span>
									</button>
									<button
										type="button"
										onclick={() => handleSelectFraming('half')}
										class="p-1.5 rounded-xl border font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 {
											rigging.framingMode === 'half'
												? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30 font-bold'
												: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
										}"
									>
										<span class="text-sm">🥋</span>
										<span class="text-[10px]">Half</span>
									</button>
									<button
										type="button"
										onclick={() => handleSelectFraming('closeup')}
										class="p-1.5 rounded-xl border font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 {
											rigging.framingMode === 'closeup'
												? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30 font-bold'
												: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
										}"
									>
										<span class="text-sm">👤</span>
										<span class="text-[10px]">Close-Up</span>
									</button>
								</div>
							</div>

							<!-- 3D Stage / Orbit Controls -->
							{#if rigging.avatarEngine === '3d'}
								<div class="space-y-1.5 pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
									<div class="flex items-center justify-between text-[10px] font-bold text-amber-400">
										<span>{i18n.t('stage_3d_rot_title')}</span>
										<span class="text-[9px] text-zinc-500">Turntable 360°</span>
									</div>
									<div class="grid grid-cols-2 gap-1.5">
										<button
											type="button"
											onclick={() => {
												playSfx('toggle');
												rigging.is3DAutoSpin = !rigging.is3DAutoSpin;
												rigging.showToast(rigging.is3DAutoSpin ? i18n.t('stage_auto_spin') : i18n.t('stage_stop_spin'));
											}}
											class="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border active:scale-95 {
												rigging.is3DAutoSpin
													? 'bg-amber-500/25 border-amber-500 text-amber-300 ring-1 ring-amber-500/50 font-bold'
													: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
											}"
										>
											<RefreshCw class="w-3.5 h-3.5 {rigging.is3DAutoSpin ? 'animate-spin text-amber-300' : 'text-zinc-400'}" />
											<span class="text-[11px]">{rigging.is3DAutoSpin ? i18n.t('stage_stop_spin') : i18n.t('stage_auto_spin')}</span>
										</button>

										<button
											type="button"
											onclick={() => {
												playSfx('click');
												threeStage.rotateModelBodyDegrees(-45);
												rigging.showToast('Rotate -45°');
											}}
											class="p-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 {
												isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
											}"
										>
											<RotateCcw class="w-3.5 h-3.5 text-zinc-400" />
											<span>-45°</span>
										</button>

										<button
											type="button"
											onclick={() => {
												playSfx('click');
												threeStage.rotateModelBodyDegrees(45);
												rigging.showToast('Rotate +45°');
											}}
											class="p-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 {
												isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
											}"
										>
											<RotateCw class="w-3.5 h-3.5 text-zinc-400" />
											<span>+45°</span>
										</button>

										<button
											type="button"
											onclick={() => {
												playSfx('click');
												threeStage.resetOrbit();
												rigging.is3DAutoSpin = false;
												rigging.showToast(i18n.t('stage_face_front'));
											}}
											class="col-span-2 p-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 {
												isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
											}"
										>
											<Crosshair class="w-3.5 h-3.5 text-cyan-400" />
											<span>{i18n.t('stage_face_front')}</span>
										</button>
									</div>

									<!-- Posisi Model 3D (Pan / Move D-Pad) -->
									<div class="pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
										<div class="flex items-center justify-between text-[10px] font-bold text-cyan-400 mb-1.5">
											<span>{i18n.t('stage_model_pos_title')}</span>
											<span class="text-[9px] text-zinc-500 font-mono">{i18n.t('stage_pan_dpad')}</span>
										</div>
										<div class="grid grid-cols-3 gap-1">
											<div></div>
											<button
												type="button"
												onclick={() => {
													playSfx('click');
													threeStage.moveModel(0, 0.15);
													rigging.showToast(i18n.t('stage_move_up'));
												}}
												class="p-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer active:scale-95 {
													isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
												}"
												title={i18n.t('stage_move_up')}
											>
												<ChevronUp class="w-4 h-4" />
											</button>
											<div></div>

											<button
												type="button"
												onclick={() => {
													playSfx('click');
													threeStage.moveModel(-0.15, 0);
													rigging.showToast(i18n.t('stage_move_left'));
												}}
												class="p-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer active:scale-95 {
													isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
												}"
												title={i18n.t('stage_move_left')}
											>
												<ChevronLeft class="w-4 h-4" />
											</button>

											<button
												type="button"
												onclick={() => {
													playSfx('click');
													threeStage.resetModelPosition();
													rigging.showToast(i18n.t('stage_center_pos'));
												}}
												class="p-1.5 rounded-xl text-xs font-bold border flex items-center justify-center transition-all cursor-pointer active:scale-95 text-cyan-400 {
													isLightTheme ? 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
												}"
												title={i18n.t('stage_center_pos')}
											>
												<Crosshair class="w-4 h-4 text-cyan-400" />
											</button>

											<button
												type="button"
												onclick={() => {
													playSfx('click');
													threeStage.moveModel(0.15, 0);
													rigging.showToast(i18n.t('stage_move_right'));
												}}
												class="p-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer active:scale-95 {
													isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
												}"
												title={i18n.t('stage_move_right')}
											>
												<ChevronRight class="w-4 h-4" />
											</button>

											<div></div>
											<button
												type="button"
												onclick={() => {
													playSfx('click');
													threeStage.moveModel(0, -0.15);
													rigging.showToast(i18n.t('stage_move_down'));
												}}
												class="p-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer active:scale-95 {
													isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
												}"
												title={i18n.t('stage_move_down')}
											>
												<ChevronDown class="w-4 h-4" />
											</button>
											<div></div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Visual resize grip corner at bottom-right -->
					<div class="absolute bottom-1 right-1 pointer-events-none text-zinc-500/70 select-none flex items-center justify-center">
						<GripVertical class="w-3 h-3 rotate-45" />
					</div>
				</div>
			{/if}
		</div>

		<!-- 8c. Photoshop Layers, Props & Collab Manager Modal Button -->
		<div class="group relative flex items-center justify-center shrink-0">
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
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors cursor-pointer hover:scale-105 active:scale-95 {
					rigging.isLayerManagerOpen
						? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
						: 'text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('layer_manager_title')}
			>
				<Layers class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="hidden sm:block pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('layer_manager_title')} [P]
			</div>
		</div>

		<!-- 9. Screenshot & Download Avatar -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => rigging.triggerScreenshot()}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label="Screenshot Avatar"
			>
				<Aperture class="w-5 h-5 text-amber-400" />
			</button>
			<div
				class="hidden sm:block pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('screenshot_btn')} [S]
			</div>
		</div>

		<!-- 10. Settings Modal Button -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => {
					rigging.isSettingsModalOpen = !rigging.isSettingsModalOpen;
					rigging.isThemeModalOpen = false;
					rigging.isModelModalOpen = false;
					rigging.isObsModalOpen = false;
					rigging.isDrawerOpen = false;
					isDeviceMenuOpen = false;
					isLanguageMenuOpen = false;
				}}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('settings_title')}
			>
				<Settings class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="hidden sm:block pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('settings_title')} [F2]
			</div>
		</div>

		<!-- 10b. Quick Language Selector (ID / EN / JA) -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => {
					playSfx('click');
					isLanguageMenuOpen = !isLanguageMenuOpen;
					isDeviceMenuOpen = false;
					isExpressionMenuOpen = false;
				}}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors cursor-pointer hover:scale-105 active:scale-95 {
					isLanguageMenuOpen
						? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
						: 'text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800/60'
				}"
				aria-label={i18n.t('switch_language')}
			>
				<Languages class="w-5 h-5 text-emerald-400" />
			</button>
			<div
				class="hidden sm:block pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('switch_language')} ({i18n.locale.toUpperCase()})
			</div>

			<!-- Language Popover Dropdown -->
			{#if isLanguageMenuOpen}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-[80] bg-black/20 backdrop-blur-[0.5px]"
					onclick={() => (isLanguageMenuOpen = false)}
				></div>

				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed sm:absolute bottom-20 sm:bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-48 backdrop-blur-2xl border rounded-2xl p-2 z-[85] animate-in fade-in slide-in-from-bottom-2 duration-150 shadow-2xl space-y-1"
					onclick={(e) => e.stopPropagation()}
					style="background: {isLightTheme ? currentTheme.surface + 'f5' : currentTheme.surface + 'ea'}; border-color: {currentTheme.accent}55; color: {currentTheme.text};"
				>
					<div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 flex items-center justify-between">
						<span>{i18n.t('switch_language')}</span>
						<div class="flex items-center gap-1.5">
							<span class="font-mono text-[9px] text-zinc-400">{i18n.locale.toUpperCase()}</span>
							<button
								type="button"
								onclick={() => (isLanguageMenuOpen = false)}
								class="p-0.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
								title={i18n.t('close_tooltip')}
								aria-label={i18n.t('close_tooltip')}
							>
								<X class="w-3.5 h-3.5" />
							</button>
						</div>
					</div>

					<button
						type="button"
						onclick={() => {
							playSfx('click');
							i18n.setLocale('id');
							isLanguageMenuOpen = false;
						}}
						class="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer active:scale-95 {
							i18n.locale === 'id'
								? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
								: 'text-zinc-300 hover:bg-white/10 hover:text-white'
						}"
					>
						<span class="flex items-center gap-2">
							<span class="text-sm">🇮🇩</span>
							<span>{i18n.t('lang_id')}</span>
						</span>
						{#if i18n.locale === 'id'}
							<Check class="w-3.5 h-3.5 text-emerald-400" />
						{/if}
					</button>

					<button
						type="button"
						onclick={() => {
							playSfx('click');
							i18n.setLocale('en');
							isLanguageMenuOpen = false;
						}}
						class="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer active:scale-95 {
							i18n.locale === 'en'
								? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
								: 'text-zinc-300 hover:bg-white/10 hover:text-white'
						}"
					>
						<span class="flex items-center gap-2">
							<span class="text-sm">🇬🇧</span>
							<span>English</span>
						</span>
						{#if i18n.locale === 'en'}
							<Check class="w-3.5 h-3.5 text-emerald-400" />
						{/if}
					</button>

					<button
						type="button"
						onclick={() => {
							playSfx('click');
							i18n.setLocale('ja');
							isLanguageMenuOpen = false;
						}}
						class="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer active:scale-95 {
							i18n.locale === 'ja'
								? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
								: 'text-zinc-300 hover:bg-white/10 hover:text-white'
						}"
					>
						<span class="flex items-center gap-2">
							<span class="text-sm">🇯🇵</span>
							<span>日本語</span>
						</span>
						{#if i18n.locale === 'ja'}
							<Check class="w-3.5 h-3.5 text-emerald-400" />
						{/if}
					</button>
				</div>
			{/if}
		</div>

		<!-- 11. Clear GUI / Lock Screen Button -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => rigging.toggleGuiLock()}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label={i18n.t('clear_gui_btn')}
			>
				<Lock class="w-5 h-5 text-amber-400" />
			</button>
			<div
				class="hidden sm:block pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				{i18n.t('clear_gui_btn')} [L]
			</div>
		</div>

		<!-- 12. Sembunyikan Panel Dock Button -->
		<div class="group relative flex items-center justify-center shrink-0">
			<button
				onclick={() => rigging.toggleDock(true)}
				class="p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer hover:scale-105 active:scale-95"
				aria-label="Toggle Dock"
			>
				<ChevronDown class="w-5 h-5" />
			</button>
			<div
				class="hidden sm:block pointer-events-none absolute -top-10 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-[70]"
			>
				Dock [H]
			</div>
		</div>
	</nav>
</div>
{/if}
