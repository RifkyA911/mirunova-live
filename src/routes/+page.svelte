<script lang="ts">
	import CanvasStage from '#lib/components/CanvasStage.svelte';
	import ThreeCanvasStage from '#lib/components/ThreeCanvasStage.svelte';
	import CameraPip from '#lib/components/CameraPip.svelte';
	import ControlDock from '#lib/components/ControlDock.svelte';
	import RiggingPreviewPanel from '#lib/components/RiggingPreviewPanel.svelte';
	import ThemeModal from '#lib/components/ThemeModal.svelte';
	import ModelCatalogModal from '#lib/components/ModelCatalogModal.svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';

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

<main
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

	<!-- Screen Effect Overlays -->
	{#if rigging.screenEffect === 'vignette'}
		<div class="absolute inset-0 pointer-events-none shadow-[inset_0_0_140px_rgba(0,0,0,0.85)] z-10"></div>
	{:else if rigging.screenEffect === 'scanlines'}
		<div class="absolute inset-0 pointer-events-none scanlines-overlay z-10"></div>
	{:else if rigging.screenEffect === 'crt'}
		<div class="absolute inset-0 pointer-events-none crt-glow-overlay z-10 shadow-[inset_0_0_100px_rgba(6,182,212,0.15)]"></div>
	{:else if rigging.screenEffect === 'blur'}
		<div class="absolute inset-0 pointer-events-none backdrop-blur-[2px] z-10"></div>
	{/if}

	<!-- 1. WebGL Live2D Stage or 3D Three.js Stage -->
	{#if rigging.avatarEngine === '3d'}
		<ThreeCanvasStage />
	{:else}
		<CanvasStage />
	{/if}

	<!-- 2. Header Brand Watermark (Subtle & Non-intrusive) -->
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

	<!-- 3. Picture-in-Picture Webcam & Landmark Wireframe Overlay -->
	<CameraPip />

	<!-- 4. Floating Streamer Control Dock -->
	<ControlDock />

	<!-- 5. Slide-out Rigging Preview & Inspector Panel -->
	<RiggingPreviewPanel />

	<!-- 6. Themes & Background Customizer Modal -->
	<ThemeModal />

	<!-- 7. Model Catalog & Motion Loop Modal -->
	<ModelCatalogModal />
</main>
