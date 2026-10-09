<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import CanvasStage from '#lib/components/CanvasStage.svelte';
	import ThreeCanvasStage from '#lib/components/ThreeCanvasStage.svelte';
	import CameraPip from '#lib/components/CameraPip.svelte';
	import ControlDock from '#lib/components/ControlDock.svelte';
	import RiggingPreviewPanel from '#lib/components/RiggingPreviewPanel.svelte';
	import ThemeModal from '#lib/components/ThemeModal.svelte';
	import ModelCatalogModal from '#lib/components/ModelCatalogModal.svelte';
	import ObsModal from '#lib/components/ObsModal.svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { i18n } from '#lib/i18n/index.svelte';
	import { Radio, X, Sparkles, Check } from 'lucide-svelte';

	// OBS Mode auto-fade control
	let isMouseActive = $state<boolean>(true);
	let isPillHovered = $state<boolean>(false);
	let hidePillTimer: any = null;

	function handleMouseMove() {
		if (rigging.isObsMode) {
			isMouseActive = true;
			clearTimeout(hidePillTimer);
			hidePillTimer = setTimeout(() => {
				if (!isPillHovered) {
					isMouseActive = false;
				}
			}, 3000);
		}
	}

	onMount(() => {
		if (typeof window === 'undefined') return;

		// 1. Auto-detect OBS Browser Source query parameters: ?obs=true, ?bg=chroma
		const params = new URLSearchParams(window.location.search);
		if (params.has('obs') || params.get('mode') === 'obs') {
			const bgParam = params.get('bg');
			if (bgParam === 'chroma') {
				rigging.obsBgType = 'chroma';
			} else {
				rigging.obsBgType = 'transparent';
			}
			rigging.toggleObsMode(true);

			// Auto-start camera if permissions allowed
			tracker.startCamera().catch((e) => {
				console.log('[OBS Mode] Camera auto-start awaiting user interaction:', e);
			});
		}

		// 2. Global Streamer Hotkeys
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

			if (e.key === 'Escape' && rigging.isObsMode) {
				rigging.toggleObsMode(false);
			} else if (e.key === 'o' || e.key === 'O') {
				rigging.toggleObsMode();
			} else if (e.key === 'c' || e.key === 'C') {
				rigging.calibrateCenter(
					rigging.liveValues['ParamAngleX'] || 0,
					rigging.liveValues['ParamAngleY'] || 0,
					rigging.liveValues['ParamAngleZ'] || 0
				);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			clearTimeout(hidePillTimer);
		};
	});

	// Computed dynamic background style (supports mesh kotak2, cosmic, chroma, solid, etc.)
	let dynamicBgStyle = $derived.by(() => {
		const style = rigging.backgroundStyle;
		const color = rigging.backgroundColor || '#09090b';

		if (style === 'transparent') return 'background: transparent;';
		if (style === 'chroma') return 'background-color: #00ff00;';
		if (style === 'solid') return `background-color: ${color};`;
		if (style === 'gradient') return `background: linear-gradient(135deg, ${color} 0%, #111827 100%);`;
		if (style === 'mesh')
			return `background-color: ${color}; background-image: linear-gradient(to right, rgba(255,255,255,0.18) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1.5px, transparent 1.5px), linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;`;
		if (style === 'dots')
			return `background-color: ${color}; background-image: radial-gradient(rgba(255,255,255,0.2) 2px, transparent 2px); background-size: 32px 32px;`;
		if (style === 'grid')
			return `background-color: ${color}; background-image: linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px); background-size: 32px 32px;`;
		if (style === 'custom-image' && rigging.customBgUrl)
			return `background-image: url('${rigging.customBgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
		return `background-color: ${color};`;
	});
</script>

<svelte:head>
	<title>{i18n.t('app_title')}</title>
</svelte:head>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<main
	onmousemove={handleMouseMove}
	class="relative w-screen h-screen overflow-hidden font-sans select-none {
		rigging.uiTheme === 'midnight'
			? 'theme-midnight'
			: rigging.uiTheme === 'synthwave'
			? 'theme-synthwave'
			: rigging.uiTheme === 'monochrome'
			? 'theme-monochrome'
			: 'theme-cyber'
	}"
>
	<!-- Dynamic Background Layer (Active across Live2D & 3D stages) -->
	<div
		class="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300 {
			rigging.backgroundStyle === 'cosmic' ? 'cosmic-backdrop' : ''
		}"
		style={dynamicBgStyle}
	></div>

	<!-- Screen Effect Overlays (hidden in OBS mode to preserve clean stream output) -->
	{#if !rigging.isObsMode}
		{#if rigging.screenEffect === 'vignette'}
			<div class="absolute inset-0 pointer-events-none shadow-[inset_0_0_140px_rgba(0,0,0,0.85)] z-10"></div>
		{:else if rigging.screenEffect === 'scanlines'}
			<div class="absolute inset-0 pointer-events-none scanlines-overlay z-10"></div>
		{:else if rigging.screenEffect === 'crt'}
			<div class="absolute inset-0 pointer-events-none crt-glow-overlay z-10 shadow-[inset_0_0_100px_rgba(6,182,212,0.15)]"></div>
		{:else if rigging.screenEffect === 'blur'}
			<div class="absolute inset-0 pointer-events-none backdrop-blur-[2px] z-10"></div>
		{/if}
	{/if}

	<!-- 1. WebGL Live2D Stage or 3D Three.js Stage -->
	{#if rigging.avatarEngine === '3d'}
		<ThreeCanvasStage />
	{:else}
		<CanvasStage />
	{/if}

	<!-- 2. OBS Screen Mode: Floating Auto-Hiding Control Pill -->
	{#if rigging.isObsMode}
		<div
			role="toolbar"
			aria-label="OBS Mode Controls"
			onmouseenter={() => (isPillHovered = true)}
			onmouseleave={() => (isPillHovered = false)}
			class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-full shadow-2xl transition-opacity duration-300 {
				isMouseActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
			}"
		>
			<div class="flex items-center gap-1.5 px-1 text-xs">
				<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
				<span class="font-bold text-zinc-200 text-[11px] tracking-wide uppercase">
					{i18n.t('obs_live')}
				</span>
			</div>

			<div class="w-px h-3.5 bg-zinc-800"></div>

			<!-- Quick Background Toggle -->
			<button
				onclick={() => {
					rigging.obsBgType = 'transparent';
					rigging.backgroundStyle = 'transparent';
				}}
				class="px-2 py-0.5 rounded text-[10px] font-medium transition-colors {
					rigging.backgroundStyle === 'transparent'
						? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
						: 'text-zinc-400 hover:text-zinc-200'
				}"
			>
				Alpha
			</button>
			<button
				onclick={() => {
					rigging.obsBgType = 'chroma';
					rigging.backgroundStyle = 'chroma';
				}}
				class="px-2 py-0.5 rounded text-[10px] font-medium transition-colors {
					rigging.backgroundStyle === 'chroma'
						? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
						: 'text-zinc-400 hover:text-zinc-200'
				}"
			>
				Green
			</button>

			<div class="w-px h-3.5 bg-zinc-800"></div>

			<!-- Exit OBS Mode -->
			<button
				onclick={() => rigging.toggleObsMode(false)}
				class="flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded text-[10px] font-medium transition-colors"
			>
				<X class="w-3 h-3" />
				<span>{i18n.t('exit_obs')}</span>
			</button>
		</div>
	{/if}

	<!-- 3. Normal UI Controls (Hidden when in OBS Screen Mode) -->
	{#if !rigging.isObsMode}
		<!-- Header Brand Watermark (Subtle & Non-intrusive) -->
		<header class="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
			<div class="px-3 py-1.5 bg-zinc-950/75 backdrop-blur-md border border-zinc-800/80 rounded-xl flex items-center gap-2 shadow-lg">
				<div class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
				<span class="text-xs font-bold tracking-wider text-zinc-100">
					MIRUNOVA <span class="text-cyan-400 font-extrabold">LIVE</span>
				</span>
				<span class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
					{rigging.avatarEngine === '3d' ? rigging.selected3DModelId : rigging.modelName}
				</span>
			</div>
		</header>

		<!-- Picture-in-Picture Webcam & Landmark Wireframe Overlay -->
		<CameraPip />

		<!-- Floating Streamer Control Dock -->
		<ControlDock />

		<!-- Slide-out Rigging Preview & Inspector Panel -->
		<RiggingPreviewPanel />

		<!-- Themes & Background Customizer Modal -->
		<ThemeModal />

		<!-- Model Catalog & Motion Loop Modal -->
		<ModelCatalogModal />

		<!-- OBS Setup Modal -->
		<ObsModal />
	{/if}
</main>
