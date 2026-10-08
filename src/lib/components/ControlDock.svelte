<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { i18n, type Locale } from '#lib/i18n/index.svelte';
	import {
		Camera,
		CameraOff,
		Crosshair,
		Sliders,
		Palette,
		Layers,
		Languages,
		Sparkles
	} from 'lucide-svelte';

	let isLangMenuOpen = $state<boolean>(false);

	const languages: Array<{ code: Locale; label: string }> = [
		{ code: 'en', label: 'English' },
		{ code: 'id', label: 'Bahasa Indonesia' },
		{ code: 'ja', label: '日本語' }
	];

	async function toggleCamera() {
		if (rigging.isCameraActive) {
			tracker.stopCamera();
		} else {
			const video = document.querySelector('video') as HTMLVideoElement;
			const canvas = document.querySelector('canvas') as HTMLCanvasElement;
			if (video) {
				try {
					await tracker.startCamera(video, canvas);
				} catch (e: any) {
					alert(e?.message || 'Error activating camera');
				}
			}
		}
	}

	function handleCalibrate() {
		rigging.calibrateCenter(
			rigging.liveValues['ParamAngleX'] || 0,
			rigging.liveValues['ParamAngleY'] || 0,
			rigging.liveValues['ParamAngleZ'] || 0
		);
	}
</script>

<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 select-none">
	<nav
		aria-label="Main Dock Controls"
		class="flex items-center gap-1.5 p-2 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl"
	>
		<!-- Camera Toggle -->
		<button
			onclick={toggleCamera}
			class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all {
				rigging.isCameraActive
					? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
					: 'bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
			}"
			title={rigging.isCameraActive ? i18n.t('stop_tracking') : i18n.t('start_tracking')}
		>
			{#if rigging.isCameraActive}
				<CameraOff class="w-4 h-4" />
				<span>{i18n.t('stop_tracking')}</span>
			{:else}
				<Camera class="w-4 h-4" />
				<span>{i18n.t('start_tracking')}</span>
			{/if}
		</button>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- Calibrate Center -->
		<button
			onclick={handleCalibrate}
			disabled={!rigging.isCameraActive}
			class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 disabled:opacity-40 disabled:hover:bg-transparent"
			title="Calibrate neutral head pose"
		>
			<Crosshair class="w-4 h-4 text-cyan-400" />
			<span>{i18n.t('calibrate')}</span>
		</button>

		<!-- Rigging Preview & Inspector Drawer Toggle Button -->
		<button
			onclick={() => (rigging.isDrawerOpen = !rigging.isDrawerOpen)}
			class="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all {
				rigging.isDrawerOpen
					? 'bg-violet-500 text-white shadow-md shadow-violet-500/25'
					: 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
			}"
			title="Open Rigging Preview Panel"
		>
			<Sliders class="w-4 h-4 {rigging.isDrawerOpen ? 'text-white' : 'text-violet-400'}" />
			<span>{i18n.t('rigging_preview')}</span>
			{#if rigging.riggingMode === 'manual'}
				<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" title="Manual Mode Active"></span>
			{/if}
		</button>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- Themes & Background Manager Modal Button -->
		<button
			onclick={() => {
				rigging.isThemeModalOpen = !rigging.isThemeModalOpen;
				rigging.isModelModalOpen = false;
				isLangMenuOpen = false;
			}}
			class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
			title={i18n.t('themes_bg')}
		>
			<Palette class="w-4 h-4 text-cyan-400" />
			<span class="hidden sm:inline">{i18n.t('themes_bg')}</span>
		</button>

		<!-- Model Catalog & Motions Modal Button -->
		<button
			onclick={() => {
				rigging.isModelModalOpen = !rigging.isModelModalOpen;
				rigging.isThemeModalOpen = false;
				isLangMenuOpen = false;
			}}
			class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
			title={i18n.t('models')}
		>
			<Layers class="w-4 h-4 text-pink-400" />
			<span class="hidden sm:inline">{i18n.t('models')}</span>
		</button>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- Language Switcher Dropdown -->
		<div class="relative">
			<button
				onclick={() => {
					isLangMenuOpen = !isLangMenuOpen;
					rigging.isThemeModalOpen = false;
					rigging.isModelModalOpen = false;
				}}
				class="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
				title="Change Language / Bahasa / 言語"
			>
				<Languages class="w-4 h-4" />
			</button>

			{#if isLangMenuOpen}
				<div
					class="absolute bottom-12 right-0 w-36 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 text-xs text-zinc-200 z-50 animate-in fade-in zoom-in-95 duration-150"
				>
					<span class="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500">Language</span>
					{#each languages as lang}
						<button
							onclick={() => {
								i18n.setLocale(lang.code);
								isLangMenuOpen = false;
							}}
							class="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left {
								i18n.current === lang.code ? 'text-cyan-400 font-semibold' : 'text-zinc-300'
							}"
						>
							<span>{lang.label}</span>
							<span class="text-[10px] uppercase text-zinc-500 font-mono">{lang.code}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</nav>
</div>
