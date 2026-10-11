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
		aria-label="Assist Button"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		class="fixed left-0 top-1/2 -translate-y-1/2 z-40 select-none transition-all duration-300 ease-out flex items-center {
			isVisible ? 'translate-x-0' : '-translate-x-[calc(100%-28px)]'
		}"
	>
		<!-- Main Assist Dock Card -->
		<div
			class="flex items-stretch bg-zinc-950/92 backdrop-blur-2xl border border-zinc-800/80 rounded-r-2xl shadow-2xl transition-all duration-200 overflow-hidden {
				isVisible ? 'border-cyan-500/50 shadow-cyan-500/15' : 'hover:border-zinc-700'
			}"
		>
			<!-- Expanded Control Body -->
			<div class="p-3 w-52 flex flex-col gap-2.5 text-xs text-zinc-200">
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-zinc-800/70 pb-2">
					<div class="flex items-center gap-1.5">
						<SlidersHorizontal class="w-4 h-4 text-cyan-400" />
						<span class="font-bold text-[11px] tracking-wide text-zinc-100 uppercase">Assist Button</span>
					</div>
					<button
						type="button"
						onclick={togglePin}
						title={isPinned ? 'Lepas Pin (Auto-Hide)' : 'Sematkan / Pin Panel'}
						class="p-1 rounded-lg text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
					>
						{#if isPinned}
							<PinOff class="w-3.5 h-3.5 text-cyan-400" />
						{:else}
							<Pin class="w-3.5 h-3.5" />
						{/if}
					</button>
				</div>

				<!-- 1. Zoom Controls Row -->
				<div class="space-y-1">
					<div class="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
						<span>Zoom Stage</span>
						<span class="font-mono text-cyan-300">{displayZoomPercent}%</span>
					</div>
					<div class="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80">
						<!-- Zoom Out -->
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.zoomOut();
							}}
							title="Zoom Out [-]"
							class="flex-1 py-1.5 flex items-center justify-center rounded-lg text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800 transition-all cursor-pointer"
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
							class="px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800 transition-all cursor-pointer"
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
							class="flex-1 py-1.5 flex items-center justify-center rounded-lg text-zinc-300 hover:text-cyan-300 hover:bg-zinc-800 transition-all cursor-pointer"
							aria-label="Zoom In"
						>
							<ZoomIn class="w-3.5 h-3.5 text-cyan-400" />
						</button>
					</div>
				</div>

				<!-- 2. Framing Mode Presets -->
				<div class="space-y-1">
					<div class="text-[10px] text-zinc-400 font-medium">Framing Preset</div>
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
									? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
									: 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
							}"
						>
							<Smile class="w-3.5 h-3.5" />
							<span>Face</span>
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
									? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
									: 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
							}"
						>
							<User class="w-3.5 h-3.5" />
							<span>Half</span>
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
									? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
									: 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
							}"
						>
							<Maximize2 class="w-3.5 h-3.5" />
							<span>Full</span>
						</button>
					</div>
				</div>

				<!-- 3. Quick Stage Center & Calibrate -->
				<div class="grid grid-cols-2 gap-1 pt-1 border-t border-zinc-800/60">
					<button
						type="button"
						onclick={() => {
							playSfx('click');
							rigging.resetZoom();
						}}
						title="Reset Posisi & Zoom [0]"
						class="py-1.5 px-2 rounded-xl bg-zinc-900/80 hover:bg-amber-500/15 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
					>
						<RotateCcw class="w-3 h-3 text-amber-400" />
						<span>Reset [0]</span>
					</button>

					<button
						type="button"
						onclick={handleCalibrate}
						disabled={!rigging.isCameraActive}
						title="Kalibrasi Pose Tengah [C]"
						class="py-1.5 px-2 rounded-xl bg-zinc-900/80 hover:bg-cyan-500/15 border border-zinc-800 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-300"
					>
						<Crosshair class="w-3 h-3 text-cyan-400" />
						<span>Center [C]</span>
					</button>
				</div>

				<!-- 4. Quick Expression Chips (If Model Has Expressions) -->
				{#if rigging.availableExpressions && rigging.availableExpressions.length > 0}
					<div class="space-y-1 pt-1 border-t border-zinc-800/60">
						<div class="flex items-center justify-between text-[10px] text-zinc-400">
							<span class="flex items-center gap-1">
								<Sparkles class="w-3 h-3 text-pink-400" />
								<span>Ekspresi Cepat</span>
							</span>
							{#if rigging.activeExpression}
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.setExpression('');
									}}
									class="text-[9px] text-cyan-400 hover:underline"
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
											? 'bg-pink-500/25 text-pink-300 border border-pink-500/40 font-bold'
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
				class="w-7 bg-zinc-900/95 hover:bg-zinc-800/90 border-l border-zinc-800/80 flex flex-col items-center justify-center gap-2 py-3 cursor-pointer group/tab transition-colors"
				title="Assist Button (Hover untuk membuka)"
			>
				<div class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50"></div>
				<span class="text-[9px] font-mono font-bold tracking-widest text-zinc-400 group-hover/tab:text-cyan-300 [writing-mode:vertical-lr] rotate-180">
					ASSIST
				</span>
				<ChevronRight class="w-3.5 h-3.5 text-zinc-500 group-hover/tab:text-cyan-400 transition-transform {isVisible ? 'rotate-180' : ''}" />
			</div>
		</div>
	</aside>
{/if}
