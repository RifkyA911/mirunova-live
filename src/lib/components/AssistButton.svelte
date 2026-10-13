<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import {
		ZoomIn,
		ZoomOut,
		RotateCcw,
		Maximize2,
		User,
		Smile,
		SlidersHorizontal,
		Crosshair,
		Pin,
		PinOff,
		X,
		Sparkles,
		Aperture,
		Layers
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';
	import { tracker } from '#lib/core/tracker';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let isOpen = $state<boolean>(false);
	let isPinned = $state<boolean>(false);

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	const isVisible = $derived(isOpen || isPinned);

	const displayZoomPercent = $derived<number>(
		Math.round((rigging.zoomLevel || 1.0) * 100)
	);

	function toggleOpen() {
		playSfx('click');
		isOpen = !isOpen;
	}

	function togglePin() {
		playSfx('click');
		isPinned = !isPinned;
	}

	function handleCalibrate() {
		playSfx('calibrate');
		tracker.calibrate();
	}

	function closeMenu() {
		if (!isPinned) {
			isOpen = false;
		}
	}
</script>

{#if !rigging.isObsMode && !rigging.isGuiLocked}
	<!-- Floating Assistive Controls Circle Button (Perfect Circle FAB, positioned right-5) -->
	<aside
		aria-label={i18n.t('assist_button_title')}
		class="fixed right-5 sm:right-6 top-1/2 -translate-y-1/2 z-40 select-none flex items-center"
	>
		<!-- 1. Floating Circular Assist Icon (Strictly Perfect Circle with concentric rings) -->
		<button
			type="button"
			onclick={toggleOpen}
			aria-label={i18n.t('assist_button_title')}
			title="{i18n.t('assist_button_title')} (Assistive Quick Controls)"
			class="relative w-12 h-12 rounded-full overflow-hidden aspect-square flex items-center justify-center backdrop-blur-2xl border-2 shadow-2xl transition-all duration-300 cursor-pointer group active:scale-95 shrink-0 {
				isVisible
					? 'ring-2 ring-cyan-400/90 scale-105 opacity-100 shadow-cyan-500/50'
					: 'opacity-90 hover:opacity-100 hover:scale-105 hover:shadow-cyan-500/30'
			} {
				isLightTheme
					? 'bg-zinc-900/95 border-zinc-700 text-white shadow-xl'
					: 'bg-zinc-950/95 border-zinc-700/80 text-zinc-100 shadow-black/80'
			}"
		>
			<!-- Concentric Circular Rings -->
			<div class="absolute inset-1.5 rounded-full border border-dashed transition-all duration-300 {
				isVisible
					? 'border-cyan-400/70 rotate-45'
					: 'border-zinc-500/60 group-hover:border-cyan-400/70'
			}"></div>

			<!-- Core Icon Dot -->
			<div class="relative flex items-center justify-center">
				{#if isVisible}
					<Aperture class="w-5 h-5 text-cyan-400 animate-spin-slow" />
				{:else}
					<div class="relative flex items-center justify-center">
						<SlidersHorizontal class="w-4 h-4 text-zinc-200 group-hover:text-cyan-300 transition-colors" />
						<span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80"></span>
					</div>
				{/if}
			</div>
		</button>

		<!-- 2. Floating Assistive Menu Popover (Anchored to the left of the button with smooth in/out animations) -->
		{#if isVisible}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			{#if !isPinned}
				<div
					transition:fade={{ duration: 150 }}
					onclick={closeMenu}
					class="fixed inset-0 z-[-1]"
					aria-hidden="true"
				></div>
			{/if}

			<div
				transition:fly={{ x: 24, duration: 220, easing: cubicOut }}
				class="absolute right-16 top-1/2 -translate-y-1/2 w-64 p-3.5 rounded-2xl backdrop-blur-2xl border shadow-2xl transition-colors duration-150 {
					isLightTheme
						? 'bg-white/98 border-zinc-200 text-zinc-900 shadow-xl'
						: 'bg-zinc-950/95 border-zinc-800/90 text-zinc-200 shadow-2xl'
				}"
			>
				<!-- Header with Title, Pin & Close -->
				<div class="flex items-center justify-between border-b pb-2 mb-2.5 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
					<div class="flex items-center gap-1.5">
						<SlidersHorizontal class="w-3.5 h-3.5 text-cyan-500" />
						<span class="font-bold text-[11px] tracking-wide uppercase {isLightTheme ? 'text-zinc-800' : 'text-zinc-100'}">
							{i18n.t('assist_button_title')}
						</span>
					</div>
					<div class="flex items-center gap-1">
						<button
							type="button"
							onclick={togglePin}
							title={isPinned ? i18n.t('assist_unpin_tooltip') : i18n.t('assist_pin_tooltip')}
							class="p-1 rounded-lg transition-colors cursor-pointer {
								isLightTheme ? 'text-zinc-500 hover:text-cyan-600' : 'text-zinc-400 hover:text-cyan-300'
							}"
						>
							{#if isPinned}
								<PinOff class="w-3.5 h-3.5 text-cyan-500" />
							{:else}
								<Pin class="w-3.5 h-3.5" />
							{/if}
						</button>
						<button
							type="button"
							onclick={() => {
								isOpen = false;
								isPinned = false;
							}}
							title="Close"
							class="p-1 rounded-lg transition-colors cursor-pointer {
								isLightTheme ? 'text-zinc-500 hover:text-rose-600' : 'text-zinc-400 hover:text-rose-400'
							}"
						>
							<X class="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				<!-- Continuous Interactive Zoom Slider + Value -->
				<div class="space-y-2 mb-3 p-2.5 rounded-xl border {isLightTheme ? 'bg-zinc-50/80 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800/80'}">
					<div class="flex items-center justify-between text-[11px] font-medium {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
						<span class="flex items-center gap-1">
							<ZoomIn class="w-3 h-3 text-cyan-500" />
							<span>{i18n.t('assist_zoom_stage')}</span>
						</span>
						<span class="font-mono text-xs font-bold {isLightTheme ? 'text-cyan-600' : 'text-cyan-400'}">{displayZoomPercent}%</span>
					</div>

					<!-- Continuous Slider Input -->
					<div class="space-y-1">
						<input
							type="range"
							min="0.3"
							max="2.5"
							step="0.05"
							value={rigging.zoomLevel || 1.0}
							oninput={(e) => rigging.setZoom(parseFloat((e.target as HTMLInputElement).value))}
							class="w-full h-1.5 bg-zinc-700/60 rounded-lg appearance-none cursor-pointer accent-cyan-400"
							aria-label="Zoom Level Slider"
						/>
						<div class="flex justify-between text-[9px] font-mono text-zinc-500 px-0.5">
							<span>30%</span>
							<span>100%</span>
							<span>250%</span>
						</div>
					</div>

					<!-- Quick Zoom Buttons Row -->
					<div class="flex items-center gap-1 pt-1 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.zoomOut();
							}}
							title="Zoom Out [-]"
							class="flex-1 py-1 flex items-center justify-center rounded-lg text-xs transition-all cursor-pointer {
								isLightTheme ? 'text-zinc-700 hover:text-cyan-600 hover:bg-zinc-200/70' : 'text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800'
							}"
							aria-label="Zoom Out"
						>
							<ZoomOut class="w-3.5 h-3.5" />
						</button>

						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.resetZoom();
							}}
							title="Reset Zoom 100% [0]"
							class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer {
								isLightTheme ? 'bg-zinc-200 text-zinc-800 hover:bg-cyan-100 hover:text-cyan-800' : 'bg-zinc-800 text-zinc-200 hover:bg-cyan-500/20 hover:text-cyan-300'
							}"
							aria-label="Reset Zoom to 100%"
						>
							100%
						</button>

						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.zoomIn();
							}}
							title="Zoom In [+]"
							class="flex-1 py-1 flex items-center justify-center rounded-lg text-xs transition-all cursor-pointer {
								isLightTheme ? 'text-zinc-700 hover:text-cyan-600 hover:bg-zinc-200/70' : 'text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800'
							}"
							aria-label="Zoom In"
						>
							<ZoomIn class="w-3.5 h-3.5 text-cyan-500" />
						</button>
					</div>
				</div>

				<!-- Framing Mode Presets -->
				<div class="space-y-1 mb-2.5">
					<div class="text-[10px] font-medium {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">{i18n.t('assist_framing_preset')}</div>
					<div class="grid grid-cols-3 gap-1">
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.setFramingMode('closeup');
							}}
							title="Close-Up Face Framing"
							class="py-1 px-1.5 rounded-lg text-[10px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer {
								rigging.framingMode === 'closeup'
									? isLightTheme
										? 'bg-cyan-100 text-cyan-800 border border-cyan-400 font-bold shadow-sm'
										: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
									: isLightTheme
										? 'bg-zinc-100/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80 border border-transparent'
										: 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
							}"
						>
							<Smile class="w-3.5 h-3.5" />
							<span>{i18n.t('assist_face')}</span>
						</button>

						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.setFramingMode('half');
							}}
							title="Half Body Framing (Default)"
							class="py-1 px-1.5 rounded-lg text-[10px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer {
								rigging.framingMode === 'half'
									? isLightTheme
										? 'bg-cyan-100 text-cyan-800 border border-cyan-400 font-bold shadow-sm'
										: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
									: isLightTheme
										? 'bg-zinc-100/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80 border border-transparent'
										: 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
							}"
						>
							<User class="w-3.5 h-3.5" />
							<span>{i18n.t('assist_half')}</span>
						</button>

						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.setFramingMode('full');
							}}
							title="Full Body Framing"
							class="py-1 px-1.5 rounded-lg text-[10px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer {
								rigging.framingMode === 'full'
									? isLightTheme
										? 'bg-cyan-100 text-cyan-800 border border-cyan-400 font-bold shadow-sm'
										: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
									: isLightTheme
										? 'bg-zinc-100/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80 border border-transparent'
										: 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
							}"
						>
							<Maximize2 class="w-3.5 h-3.5" />
							<span>{i18n.t('assist_full')}</span>
						</button>
					</div>
				</div>

				<!-- Quick Stage Center & Calibrate -->
				<div class="grid grid-cols-2 gap-1.5 pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/70'}">
					<button
						type="button"
						onclick={() => {
							playSfx('click');
							rigging.resetZoom();
						}}
						title="Reset Posisi & Zoom [0]"
						class="py-1.5 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer {
							isLightTheme
								? 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800'
								: 'bg-zinc-900/80 hover:bg-amber-500/15 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300'
						}"
					>
						<RotateCcw class="w-3 h-3 text-amber-500" />
						<span>{i18n.t('assist_reset_btn')}</span>
					</button>

					<button
						type="button"
						onclick={handleCalibrate}
						disabled={!rigging.isCameraActive}
						title="Kalibrasi Pose Tengah [C]"
						class="py-1.5 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-30 {
							isLightTheme
								? 'bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 disabled:hover:bg-cyan-50'
								: 'bg-zinc-900/80 hover:bg-cyan-500/15 border border-zinc-800 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-300 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-300'
						}"
					>
						<Crosshair class="w-3 h-3 text-cyan-500" />
						<span>{i18n.t('assist_center_btn')}</span>
					</button>
				</div>

				<!-- Layers, Props & Collab Quick Launcher -->
				<div class="pt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/70'}">
					<button
						type="button"
						onclick={() => {
							playSfx('click');
							rigging.toggleLayerManager();
							if (!isPinned) isOpen = false;
						}}
						class="w-full py-1.5 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-between transition-all cursor-pointer {
							isLightTheme
								? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
								: 'bg-zinc-900/80 hover:bg-cyan-500/15 border border-zinc-800 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-300'
						}"
					>
						<span class="flex items-center gap-1.5">
							<Layers class="w-3.5 h-3.5 text-cyan-400" />
							<span>{i18n.t('layer_manager_title')}</span>
						</span>
						<span class="text-[9px] font-mono text-zinc-500">[P]</span>
					</button>
				</div>

				<!-- Quick Expression Chips (If Model Has Expressions) -->
				{#if rigging.availableExpressions && rigging.availableExpressions.length > 0}
					<div class="space-y-1 pt-2 mt-2 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/70'}">
						<div class="flex items-center justify-between text-[10px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
							<span class="flex items-center gap-1">
								<Sparkles class="w-3 h-3 text-pink-500" />
								<span>{i18n.t('assist_quick_exp')}</span>
							</span>
							{#if rigging.activeExpression}
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setExpression('');
									}}
									class="text-[9px] hover:underline {isLightTheme ? 'text-cyan-600 font-bold' : 'text-cyan-400'}"
								>
									Reset
								</button>
							{/if}
						</div>
						<div class="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar pr-0.5">
							{#each rigging.availableExpressions.slice(0, 6) as exp}
								<button
									type="button"
									onclick={() => {
										playSfx('expression');
										rigging.setExpression(exp.name);
									}}
									class="px-2 py-0.5 rounded-lg text-[10px] transition-all cursor-pointer {
										rigging.activeExpression === exp.name
											? isLightTheme
												? 'bg-pink-100 text-pink-800 border border-pink-400 font-bold shadow-sm'
												: 'bg-pink-500/25 text-pink-300 border border-pink-500/40 font-bold'
											: isLightTheme
												? 'bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 border border-zinc-200'
												: 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/60'
									}"
								>
									{exp.label}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</aside>
{/if}
