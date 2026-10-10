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
		Radio,
		Tv,
		Hand,
		Settings,
		Aperture,
		Keyboard,
		Lock,
		ChevronDown,
		ChevronUp
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
			try {
				await tracker.startCamera();
			} catch (e: any) {
				alert(e?.message || 'Error activating camera');
			}
		}
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
	<div class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 select-none animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[98vw]">
		<nav
			aria-label="Main Dock Controls"
			class="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 bg-zinc-950/92 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-2xl overflow-x-auto max-w-full"
		>
		<!-- 1. Camera Toggle (Icon Only + Hover Tooltip) -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={toggleCamera}
				class="p-2.5 rounded-xl transition-all duration-150 {
					rigging.isCameraActive
						? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-md shadow-rose-500/10'
						: 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/25 active:scale-95'
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
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{rigging.isCameraActive ? i18n.t('stop_tracking') : i18n.t('start_tracking')}
			</div>
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 2. Calibrate Center Pose -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={handleCalibrate}
				disabled={!rigging.isCameraActive}
				class="p-2.5 rounded-xl transition-all text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 active:scale-95"
				aria-label={i18n.t('calibrate')}
			>
				<Crosshair class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('calibrate')}
			</div>
		</div>

		<!-- 3. Hand Tracking Toggle -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => (rigging.enableHandTracking = !rigging.enableHandTracking)}
				class="p-2.5 rounded-xl transition-all {
					rigging.enableHandTracking
						? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm'
						: 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
				} active:scale-95"
				aria-label={i18n.t('hands_toggle')}
			>
				<Hand class="w-5 h-5" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('hands_toggle')} ({rigging.enableHandTracking ? 'Active' : 'Off'})
			</div>
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 4. Rigging Preview & Inspector Drawer Toggle Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => (rigging.isDrawerOpen = !rigging.isDrawerOpen)}
				class="relative p-2.5 rounded-xl transition-all {
					rigging.isDrawerOpen
						? 'bg-violet-500 text-white shadow-md shadow-violet-500/25'
						: 'text-zinc-400 hover:text-violet-300 hover:bg-zinc-800/60'
				} active:scale-95"
				aria-label={i18n.t('rigging_preview')}
			>
				<Sliders class="w-5 h-5 {rigging.isDrawerOpen ? 'text-white' : 'text-violet-400'}" />
				{#if rigging.riggingMode === 'manual'}
					<span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
				{/if}
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('rigging_preview')}
			</div>
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 5. OBS Screen Mode Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => rigging.toggleObsMode(true)}
				class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all active:scale-95 shadow-sm"
				aria-label={i18n.t('obs_mode')}
			>
				<Radio class="w-5 h-5 animate-pulse" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('obs_mode')} (Clean Transparent Stage)
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
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label={i18n.t('obs_setup')}
			>
				<Tv class="w-5 h-5 text-emerald-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('obs_setup')} & URL Generator
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
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label={i18n.t('themes_bg')}
			>
				<Palette class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('themes_bg')}
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
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-pink-300 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label={i18n.t('models')}
			>
				<Layers class="w-5 h-5 text-pink-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('models')}
			</div>
		</div>

		<!-- 9. Screenshot & Download Avatar -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => rigging.triggerScreenshot()}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label="Screenshot Avatar"
			>
				<Aperture class="w-5 h-5 text-amber-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
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
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label={i18n.t('settings_title')}
			>
				<Settings class="w-5 h-5 text-cyan-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('settings_title')} [F2]
			</div>
		</div>

		<!-- 11. Clear GUI / Lock Screen Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => rigging.toggleGuiLock()}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label={i18n.t('clear_gui_btn')}
			>
				<Lock class="w-5 h-5 text-amber-400" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				{i18n.t('clear_gui_btn')} [L]
			</div>
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 11. Language Switcher Dropdown -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => (isLangMenuOpen = !isLangMenuOpen)}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label="Language"
			>
				<Languages class="w-5 h-5" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				Language: {i18n.currentLocale.toUpperCase()}
			</div>

			<!-- Language Dropdown Menu -->
			{#if isLangMenuOpen}
				<div
					class="absolute bottom-12 right-0 w-36 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl p-1 z-40 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
				>
					{#each languages as lang}
						<button
							onclick={() => {
								i18n.setLocale(lang.code);
								isLangMenuOpen = false;
							}}
							class="w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors flex items-center justify-between {
								i18n.currentLocale === lang.code
									? 'bg-cyan-500/20 text-cyan-300 font-semibold'
									: 'text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>{lang.label}</span>
							{#if i18n.currentLocale === lang.code}
								<span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="w-px h-6 bg-zinc-800 mx-0.5"></div>

		<!-- 12. Keyboard Shortcuts Guide Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => {
					rigging.toggleShortcutModal();
					isLangMenuOpen = false;
				}}
				class="p-2.5 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label="Panduan Shortcut"
			>
				<Keyboard class="w-5 h-5 text-zinc-300" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				Panduan Shortcut [?]
			</div>
		</div>

		<!-- 13. Sembunyikan Panel Dock Button -->
		<div class="group relative flex items-center justify-center">
			<button
				onclick={() => rigging.toggleDock(true)}
				class="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors active:scale-95"
				aria-label="Sembunyikan Dock"
			>
				<ChevronDown class="w-5 h-5" />
			</button>
			<div
				class="pointer-events-none absolute -top-9 px-2.5 py-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 z-50"
			>
				Sembunyikan Panel [H]
			</div>
		</div>
	</nav>
</div>
{/if}
