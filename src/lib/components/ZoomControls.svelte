<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import {
		ZoomIn,
		ZoomOut,
		RotateCcw,
		Maximize2,
		Minimize2,
		User,
		Smile
	} from 'lucide-svelte';

	let isExpanded = $state<boolean>(false);
	let isHovered = $state<boolean>(false);

	const displayZoomPercent = $derived<number>(
		Math.round((rigging.zoomLevel || 1.0) * 100)
	);
</script>

{#if !rigging.isObsMode && !rigging.isGuiLocked}
	<!-- Right-Edge Floating Studio Zoom Widget with Hover-Toggle -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<aside
		aria-label="Stage Zoom Controls"
		onmouseenter={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
		class="fixed right-3.5 top-1/2 -translate-y-1/2 z-40 select-none transition-all duration-300 ease-out group"
	>
		<div
			class="relative flex flex-col items-center bg-zinc-950/88 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden {
				isHovered || isExpanded
					? 'p-1.5 gap-1.5 shadow-cyan-500/10 border-cyan-500/40'
					: 'p-1.5 gap-0.5 opacity-75 hover:opacity-100 hover:border-zinc-700'
			}"
		>
			<!-- 1. Zoom In (+) -->
			<button
				type="button"
				onclick={() => rigging.zoomIn()}
				title="Zoom In [+ / =]"
				class="p-2 rounded-xl text-zinc-300 hover:text-cyan-300 hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
				aria-label="Zoom In"
			>
				<ZoomIn class="w-4 h-4 text-cyan-400" />
			</button>

			<!-- 2. Zoom Level Percentage (Clickable to Reset) -->
			<button
				type="button"
				onclick={() => rigging.resetZoom()}
				title="{i18n.t('reset_confirm')} [0]"
				class="px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer {
					isHovered || isExpanded
						? 'bg-zinc-900/90 text-cyan-300 border border-zinc-800/80 hover:bg-cyan-500/20 hover:border-cyan-500/40'
						: 'text-zinc-400 hover:text-zinc-200'
				}"
				aria-label="Reset Zoom"
			>
				{displayZoomPercent}%
			</button>

			<!-- 3. Zoom Out (-) -->
			<button
				type="button"
				onclick={() => rigging.zoomOut()}
				title="Zoom Out [-]"
				class="p-2 rounded-xl text-zinc-300 hover:text-cyan-300 hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
				aria-label="Zoom Out"
			>
				<ZoomOut class="w-4 h-4 text-cyan-400" />
			</button>

			<!-- Extended controls revealed on hover / expand -->
			{#if isHovered || isExpanded}
				<div class="w-5 h-px bg-zinc-800/80 my-0.5 animate-in fade-in duration-150"></div>

				<!-- Quick Reset Center Button -->
				<button
					type="button"
					onclick={() => rigging.resetZoom()}
					title="Reset Center & Scale [0]"
					class="p-2 rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-amber-500/15 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
					aria-label="Reset Position and Zoom"
				>
					<RotateCcw class="w-3.5 h-3.5 text-amber-400" />
				</button>

				<!-- Quick Framing Mode Toggle Buttons -->
				<div class="flex flex-col gap-1 pt-0.5 border-t border-zinc-800/60 animate-in fade-in duration-200">
					<button
						type="button"
						onclick={() => rigging.setFramingMode('closeup')}
						title="Close-Up Framing"
						class="p-1.5 rounded-lg text-xs transition-colors cursor-pointer {
							rigging.framingMode === 'closeup'
								? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
								: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
						}"
					>
						<Smile class="w-3.5 h-3.5" />
					</button>

					<button
						type="button"
						onclick={() => rigging.setFramingMode('half')}
						title="Half Body (Default)"
						class="p-1.5 rounded-lg text-xs transition-colors cursor-pointer {
							rigging.framingMode === 'half'
								? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
								: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
						}"
					>
						<User class="w-3.5 h-3.5" />
					</button>

					<button
						type="button"
						onclick={() => rigging.setFramingMode('full')}
						title="Full Body Framing"
						class="p-1.5 rounded-lg text-xs transition-colors cursor-pointer {
							rigging.framingMode === 'full'
								? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
								: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
						}"
					>
						<Maximize2 class="w-3.5 h-3.5" />
					</button>
				</div>
			{/if}
		</div>
	</aside>
{/if}
