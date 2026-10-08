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
				{rigging.modelName}
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
