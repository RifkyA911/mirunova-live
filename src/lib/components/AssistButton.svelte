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
		ChevronRight,
		ChevronLeft,
		Sparkles
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';
	import { tracker } from '#lib/core/tracker';

	let isHovered = $state<boolean>(false);
	let isPinned = $state<boolean>(false);

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	const isVisible = $derived(isHovered || isPinned);

	const displayZoomPercent = $derived<number>(
		Math.round((rigging.zoomLevel || 1.0) * 100)
	);

	function handleMouseEnter() {
		if (!isHovered) {
			playSfx('hover');
			isHovered = true;
		}
	}

	function handleMouseLeave() {
		isHovered = false;
	}

	function togglePin() {
		playSfx('click');
		isPinned = !isPinned;
	}

	function handleCalibrate() {
		playSfx('calibrate');
		tracker.calibrate();
	}
</script>

{#if !rigging.isObsMode && !rigging.isGuiLocked}
	<!-- Left-Edge Assist Button (Hiding at left edge, ~10% peeking, slides out on hover) -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<aside
		aria-label={i18n.t('assist_button_title')}
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		class="fixed left-0 top-1/2 -translate-y-1/2 z-40 select-none transition-all duration-300 ease-out flex items-center {
			isVisible ? 'translate-x-0' : '-translate-x-[calc(100%-28px)]'
		}"
	>
		<!-- Main Assist Dock Card -->
		<div
			class="flex items-stretch backdrop-blur-2xl border rounded-r-2xl shadow-2xl transition-all duration-200 overflow-hidden {
				isLightTheme
					? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xl'
					: 'bg-zinc-950/92 border-zinc-800/80 text-zinc-200 shadow-2xl'
			} {
				isVisible ? 'border-cyan-500/50 shadow-cyan-500/15' : isLightTheme ? 'hover:border-zinc-300' : 'hover:border-zinc-700'
			}"
		>
			<!-- Expanded Control Body -->
			<div class="p-3 w-52 flex flex-col gap-2.5 text-xs">
				<!-- Header -->
				<div class="flex items-center justify-between border-b pb-2 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/70'}">
					<div class="flex items-center gap-1.5">
						<SlidersHorizontal class="w-4 h-4 text-cyan-500" />
						<span class="font-bold text-[11px] tracking-wide uppercase {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							{i18n.t('assist_button_title')}
						</span>
					</div>
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
				</div>

				<!-- 1. Zoom Controls Row -->
				<div class="space-y-1">
					<div class="flex items-center justify-between text-[10px] font-medium {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
						<span>{i18n.t('assist_zoom_stage')}</span>
						<span class="font-mono {isLightTheme ? 'text-cyan-600 font-bold' : 'text-cyan-300'}">{displayZoomPercent}%</span>
					</div>
					<div class="flex items-center gap-1 p-1 rounded-xl border {isLightTheme ? 'bg-zinc-100/80 border-zinc-200' : 'bg-zinc-900/80 border-zinc-800/80'}">
						<!-- Zoom Out -->
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.zoomOut();
							}}
							title="Zoom Out [-]"
							class="flex-1 py-1.5 flex items-center justify-center rounded-lg transition-all cursor-pointer {
								isLightTheme ? 'text-zinc-700 hover:text-cyan-600 hover:bg-white' : 'text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800'
							}"
							aria-label="Zoom Out"
						>
							<ZoomOut class="w-3.5 h-3.5" />
						</button>

						<!-- Reset Zoom 100% -->
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.resetZoom();
							}}
							title="Reset Zoom 100% [0]"
							class="px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer {
								isLightTheme ? 'text-zinc-700 hover:text-cyan-600 hover:bg-white' : 'text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800'
							}"
							aria-label="Reset Zoom to 100%"
						>
							100%
						</button>

						<!-- Zoom In -->
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.zoomIn();
							}}
							title="Zoom In [+]"
							class="flex-1 py-1.5 flex items-center justify-center rounded-lg transition-all cursor-pointer {
								isLightTheme ? 'text-zinc-700 hover:text-cyan-600 hover:bg-white' : 'text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800'
							}"
							aria-label="Zoom In"
						>
							<ZoomIn class="w-3.5 h-3.5 text-cyan-500" />
						</button>
					</div>
				</div>

				<!-- 2. Framing Mode Presets -->
				<div class="space-y-1">
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

				<!-- 3. Quick Stage Center & Calibrate -->
				<div class="grid grid-cols-2 gap-1 pt-1 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
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

				<!-- 4. Quick Expression Chips (If Model Has Expressions) -->
				{#if rigging.availableExpressions && rigging.availableExpressions.length > 0}
					<div class="space-y-1 pt-1 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
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
						<div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-0.5">
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

			<!-- 10% Peeking Tab Handle on Left Edge -->
			<div
				class="w-7 border-l flex flex-col items-center justify-center gap-2 py-3 cursor-pointer group/tab transition-colors {
					isLightTheme
						? 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200'
						: 'bg-zinc-900/95 hover:bg-zinc-800/90 border-zinc-800/80'
				}"
				title="Assist Button (Hover untuk membuka)"
			>
				<div class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50"></div>
				<span class="text-[9px] font-mono font-bold tracking-widest [writing-mode:vertical-lr] rotate-180 {
					isLightTheme ? 'text-zinc-500 group-hover/tab:text-cyan-600' : 'text-zinc-400 group-hover/tab:text-cyan-300'
				}">
					ASSIST
				</span>
				<ChevronRight class="w-3.5 h-3.5 transition-transform {
					isLightTheme ? 'text-zinc-400 group-hover/tab:text-cyan-600' : 'text-zinc-500 group-hover/tab:text-cyan-400'
				} {isVisible ? 'rotate-180' : ''}" />
			</div>
		</div>
	</aside>
{/if}
