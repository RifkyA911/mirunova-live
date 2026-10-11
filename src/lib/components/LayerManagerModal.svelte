<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { MODEL_CATALOG, MODEL_3D_CATALOG } from '#lib/data/models';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		Layers,
		X,
		Eye,
		EyeOff,
		Lock,
		Unlock,
		ArrowUp,
		ArrowDown,
		SlidersHorizontal,
		Sparkles,
		Smile,
		Users,
		Plus,
		Check,
		Glasses,
		Headphones,
		Crown,
		Mic,
		Heart,
		Palette,
		Tv,
		GripVertical,
		Pin,
		PinOff,
		Minus,
		Maximize2,
		Move
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let activeSubTab = $state<'layers' | 'accessories' | 'collab'>('layers');
	let isDraggingWindow = $state<boolean>(false);
	let windowDragOffset = { x: 0, y: 0 };
	let isResizingWindow = $state<boolean>(false);
	let resizeStart = { x: 0, y: 0, w: 0, h: 0 };
	let draggedLayerIdx = $state<number | null>(null);
	let dragOverIdx = $state<number | null>(null);

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	const activeAccCount = $derived(
		rigging.activeAccessories.filter((a) => a.visible).length
	);

	function getLayerThumbnail(type: string): { bgClass: string; icon: any; label: string } {
		if (type === 'background') {
			if (rigging.backgroundStyle === 'solid') {
				return { bgClass: 'border-zinc-700', icon: Palette, label: rigging.backgroundColor };
			}
			if (rigging.backgroundStyle === 'chroma') {
				return { bgClass: 'bg-[#00FF00]', icon: Palette, label: 'Chroma' };
			}
			if (rigging.backgroundStyle === 'transparent') {
				return { bgClass: 'bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[size:8px_8px]', icon: Palette, label: 'Alpha' };
			}
			if (rigging.backgroundStyle === 'mesh') {
				return { bgClass: 'bg-zinc-950 bg-[linear-gradient(to_right,#06b6d433_1px,transparent_1px),linear-gradient(to_bottom,#06b6d433_1px,transparent_1px)] bg-[size:8px_8px]', icon: Palette, label: 'Mesh' };
			}
			return { bgClass: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950', icon: Palette, label: 'Cosmic' };
		}
		if (type === 'model-host') {
			return { bgClass: 'bg-pink-500/20 border-pink-500/40 text-pink-300', icon: Smile, label: rigging.modelName.slice(0, 10) };
		}
		if (type === 'model-collab') {
			return { bgClass: 'bg-purple-500/20 border-purple-500/40 text-purple-300', icon: Users, label: rigging.collabModelName.slice(0, 10) };
		}
		if (type === 'accessories') {
			return { bgClass: 'bg-amber-500/20 border-amber-500/40 text-amber-300', icon: Sparkles, label: `${activeAccCount} Aktif` };
		}
		return { bgClass: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300', icon: Tv, label: rigging.screenEffect };
	}

	function handleHeaderPointerDown(e: PointerEvent) {
		if (rigging.layerManagerViewMode !== 'windowed') return;
		const target = e.target as HTMLElement;
		if (target.closest('button, input, select, a, [role="button"]')) return;

		isDraggingWindow = true;
		windowDragOffset = {
			x: e.clientX - rigging.layerWindowX,
			y: e.clientY - rigging.layerWindowY
		};
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {}
	}

	function handleHeaderPointerMove(e: PointerEvent) {
		if (!isDraggingWindow) return;
		const maxW = typeof window !== 'undefined' ? window.innerWidth : 1920;
		const maxH = typeof window !== 'undefined' ? window.innerHeight : 1080;
		const newX = Math.max(8, Math.min(maxW - 200, e.clientX - windowDragOffset.x));
		const newY = Math.max(8, Math.min(maxH - 60, e.clientY - windowDragOffset.y));
		rigging.layerWindowX = newX;
		rigging.layerWindowY = newY;
	}

	function handleHeaderPointerUp(e: PointerEvent) {
		if (isDraggingWindow) {
			isDraggingWindow = false;
			try {
				(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
			} catch {}
			rigging.persist();
		}
	}

	function handleResizePointerDown(e: PointerEvent) {
		if (rigging.layerManagerViewMode !== 'windowed' || rigging.isLayerMinimized) return;
		e.stopPropagation();
		isResizingWindow = true;
		resizeStart = {
			x: e.clientX,
			y: e.clientY,
			w: rigging.layerWindowWidth,
			h: rigging.layerWindowHeight
		};
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {}
	}

	function handleResizePointerMove(e: PointerEvent) {
		if (!isResizingWindow) return;
		const maxW = typeof window !== 'undefined' ? window.innerWidth : 1920;
		const maxH = typeof window !== 'undefined' ? window.innerHeight : 1080;
		const dw = e.clientX - resizeStart.x;
		const dh = e.clientY - resizeStart.y;
		rigging.layerWindowWidth = Math.max(320, Math.min(maxW - 40, resizeStart.w + dw));
		rigging.layerWindowHeight = Math.max(260, Math.min(maxH - 40, resizeStart.h + dh));
	}

	function handleResizePointerUp(e: PointerEvent) {
		if (isResizingWindow) {
			isResizingWindow = false;
			try {
				(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
			} catch {}
			rigging.persist();
		}
	}

	function onLayerDragStart(idx: number, e: DragEvent) {
		draggedLayerIdx = idx;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(idx));
		}
	}

	function onLayerDragOver(idx: number, e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverIdx = idx;
	}

	function onLayerDrop(dropIdx: number, e: DragEvent) {
		e.preventDefault();
		if (draggedLayerIdx !== null && draggedLayerIdx !== dropIdx) {
			playSfx('click');
			rigging.reorderLayers(draggedLayerIdx, dropIdx);
		}
		draggedLayerIdx = null;
		dragOverIdx = null;
	}

	function onLayerDragEnd() {
		draggedLayerIdx = null;
		dragOverIdx = null;
	}
</script>

{#if rigging.isLayerManagerOpen}
	<!-- Windowed Floating Window or Sticky Full-Height Panel (NO backdrop overlay so stage is visible) -->
	<aside
		aria-label="Layer Manager Studio"
		transition:fly={{ y: 20, duration: 200, easing: cubicOut }}
		class="z-40 shadow-2xl flex flex-col overflow-hidden border backdrop-blur-2xl transition-all duration-150 select-none {
			rigging.layerManagerViewMode === 'windowed'
				? 'fixed rounded-3xl'
				: 'fixed top-0 right-0 h-screen w-96 max-w-[95vw] rounded-l-3xl rounded-r-none border-r-0 border-y-0'
		} {
			isLightTheme
				? 'bg-white/95 text-zinc-900 border-zinc-200/90 shadow-xl'
				: 'bg-zinc-950/95 text-zinc-100 border-zinc-800/90 shadow-2xl shadow-cyan-950/20'
		}"
		style={rigging.layerManagerViewMode === 'windowed'
			? `left: ${rigging.layerWindowX}px; top: ${rigging.layerWindowY}px; width: ${rigging.layerWindowWidth}px; height: ${rigging.isLayerMinimized ? 'auto' : `${rigging.layerWindowHeight}px`}; min-width: 320px; min-height: 240px; max-width: 95vw; max-height: 95vh;`
			: `width: ${rigging.layerWindowWidth}px; height: 100vh;`}
	>
		<!-- Window Header (Drag Handle in Windowed mode) -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onpointerdown={handleHeaderPointerDown}
			onpointermove={handleHeaderPointerMove}
			onpointerup={handleHeaderPointerUp}
			onpointercancel={handleHeaderPointerUp}
			class="px-4 py-3 border-b flex items-center justify-between select-none shrink-0 {
				rigging.layerManagerViewMode === 'windowed' ? 'cursor-grab active:cursor-grabbing' : ''
			} {
				isLightTheme ? 'bg-zinc-50/90 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800/80'
			}"
		>
			<div class="flex items-center gap-2.5 truncate">
				<div class="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
					<Layers class="w-4 h-4" />
				</div>
				<div class="truncate">
					<div class="flex items-center gap-1.5">
						<h2 class="text-xs font-bold truncate {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							Layer Manager
						</h2>
						<span class="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
							{rigging.stageLayers.length}
						</span>
						{#if rigging.selectedLayerElementId}
							<span class="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 truncate max-w-[90px]">
								{rigging.selectedLayerElementId}
							</span>
						{/if}
					</div>
					<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} truncate">
						{rigging.layerManagerViewMode === 'windowed' ? 'Drag header untuk geser • Tarik sudut untuk resize' : 'Mode Sticky (Full Height Sisi Kanan)'}
					</p>
				</div>
			</div>

			<!-- Header Window Controls -->
			<div class="flex items-center gap-1 shrink-0">
				<!-- Toggle Sticky / Windowed View Mode -->
				<button
					type="button"
					onclick={() => rigging.toggleLayerManagerViewMode()}
					title={rigging.layerManagerViewMode === 'sticky' ? 'Ganti ke Window Bebas (Windowed Resizable)' : 'Tempelkan ke Sisi Kanan (Sticky Full Height)'}
					class="p-1.5 rounded-xl transition-colors cursor-pointer {
						rigging.layerManagerViewMode === 'sticky'
							? 'text-cyan-400 bg-cyan-500/15 border border-cyan-500/30'
							: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
					}"
					aria-label="Toggle View Mode"
				>
					{#if rigging.layerManagerViewMode === 'sticky'}
						<Pin class="w-3.5 h-3.5 text-cyan-400" />
					{:else}
						<Move class="w-3.5 h-3.5" />
					{/if}
				</button>

				<!-- Minimize / Expand Window -->
				<button
					type="button"
					onclick={() => (rigging.isLayerMinimized = !rigging.isLayerMinimized)}
					title={rigging.isLayerMinimized ? 'Buka Penuh' : 'Kecilkan Window'}
					class="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
					aria-label="Minimize Window"
				>
					{#if rigging.isLayerMinimized}
						<Maximize2 class="w-3.5 h-3.5" />
					{:else}
						<Minus class="w-3.5 h-3.5" />
					{/if}
				</button>

				<!-- Close Window -->
				<button
					type="button"
					onclick={() => (rigging.isLayerManagerOpen = false)}
					title="Tutup Panel Layer"
					class="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60 transition-colors cursor-pointer"
					aria-label="Tutup"
				>
					<X class="w-3.5 h-3.5" />
				</button>
			</div>
		</div>

		{#if !rigging.isLayerMinimized}
			<!-- Navigation Tabs Bar -->
			<div class="px-4 pt-1.5 border-b flex items-center gap-1 shrink-0 {
				isLightTheme ? 'bg-zinc-100/60 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
			}">
				<button
					type="button"
					onclick={() => {
						playSfx('click');
						activeSubTab = 'layers';
					}}
					class="py-2 px-2.5 border-b-2 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer {
						activeSubTab === 'layers'
							? 'border-cyan-500 text-cyan-500 font-bold'
							: isLightTheme ? 'border-transparent text-zinc-500 hover:text-zinc-800' : 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Layers class="w-3.5 h-3.5" />
					<span>Layers</span>
				</button>

				<button
					type="button"
					onclick={() => {
						playSfx('click');
						activeSubTab = 'accessories';
					}}
					class="py-2 px-2.5 border-b-2 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer {
						activeSubTab === 'accessories'
							? 'border-amber-500 text-amber-500 font-bold'
							: isLightTheme ? 'border-transparent text-zinc-500 hover:text-zinc-800' : 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Sparkles class="w-3.5 h-3.5" />
					<span>Props ({activeAccCount})</span>
				</button>

				<button
					type="button"
					onclick={() => {
						playSfx('click');
						activeSubTab = 'collab';
					}}
					class="py-2 px-2.5 border-b-2 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer {
						activeSubTab === 'collab'
							? 'border-purple-500 text-purple-500 font-bold'
							: isLightTheme ? 'border-transparent text-zinc-500 hover:text-zinc-800' : 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Users class="w-3.5 h-3.5" />
					<span>Collab</span>
					{#if rigging.isCollabModeActive}
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
					{/if}
				</button>
			</div>

			<!-- Tab Body Content -->
			<div class="p-3.5 overflow-y-auto space-y-3.5 custom-scrollbar flex-1 min-h-0">
				<!-- TAB 1: LAYERS WITH CLEAN DRAG-HANDLE DND (NO SLIDER CONFLICT) -->
				{#if activeSubTab === 'layers'}
					<div class="space-y-2">
						<div class="flex items-center justify-between text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
							<span>Tarik ikon grip untuk atur urutan Z-Index:</span>
							<span class="font-mono text-[10px]">Atas = Paling Depan</span>
						</div>

						<div class="space-y-1.5">
							{#each rigging.stageLayers as layer, idx (layer.id)}
								{@const thumb = getLayerThumbnail(layer.type)}
								{@const ThumbIcon = thumb.icon}
								{@const isSelected = rigging.selectedLayerElementId === layer.id ||
									(rigging.selectedLayerElementId === 'host' && layer.type === 'model-host') ||
									(rigging.selectedLayerElementId === 'collab' && layer.type === 'model-collab')}
								<!-- Row is drop target only, not whole-draggable -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									role="listitem"
									ondragover={(e) => onLayerDragOver(idx, e)}
									ondrop={(e) => onLayerDrop(idx, e)}
									class="p-2.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-2.5 {
										dragOverIdx === idx ? 'border-cyan-400 ring-2 ring-cyan-500/40' : ''
									} {
										isSelected
											? 'border-cyan-500/70 bg-cyan-500/10 ring-1 ring-cyan-500/40 shadow-sm'
											: layer.visible
												? isLightTheme
													? 'bg-white border-zinc-200 shadow-xs hover:border-zinc-300'
													: 'bg-zinc-900/60 border-zinc-800 shadow-xs hover:border-zinc-700'
												: 'opacity-50 bg-zinc-950/40 border-dashed border-zinc-800'
									}"
								>
									<!-- Left: Drag Grip Handle (ONLY draggable item) & Thumbnail & Meta -->
									<div class="flex items-center gap-2 truncate flex-1">
										<!-- Dedicated Drag Grip Handle -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											role="button"
											tabindex="0"
											draggable={!layer.locked}
											ondragstart={(e) => onLayerDragStart(idx, e)}
											ondragend={onLayerDragEnd}
											title={layer.locked ? 'Layer terkunci' : 'Tarik ikon ini untuk atur urutan'}
											class="p-1 text-zinc-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing shrink-0 select-none {
												layer.locked ? 'opacity-30 cursor-not-allowed' : ''
											}"
										>
											<GripVertical class="w-3.5 h-3.5" />
										</div>

										<!-- Live Thumbnail -->
										<div
											class="w-8 h-8 rounded-lg border overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner {thumb.bgClass}"
											style={layer.type === 'background' && rigging.backgroundStyle === 'solid' ? `background-color: ${rigging.backgroundColor};` : ''}
										>
											<ThumbIcon class="w-3.5 h-3.5 opacity-70" />
										</div>

										<!-- Clickable text to select layer -->
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											onclick={() => {
												playSfx('click');
												if (layer.type === 'model-host') rigging.selectLayerElement('host');
												else if (layer.type === 'model-collab') rigging.selectLayerElement('collab');
												else rigging.selectLayerElement(layer.id);
											}}
											class="truncate cursor-pointer flex-1"
										>
											<div class="flex items-center gap-1.5 truncate">
												<span class="text-xs font-bold truncate {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
													{layer.name}
												</span>
												<span class="text-[8px] px-1 py-0.2 rounded font-mono font-semibold bg-zinc-800 text-zinc-300 shrink-0">
													{layer.badge}
												</span>
											</div>
											<div class="text-[9px] text-zinc-400 font-mono">
												Opacity: {Math.round(layer.opacity * 100)}%
											</div>
										</div>
									</div>

									<!-- Right: Controls (Slider, Visibility, Lock, Reorder Up/Down) -->
									<div class="flex items-center gap-1.5 shrink-0">
										<!-- Opacity Slider with explicit event isolation -->
										<input
											type="range"
											draggable={false}
											onpointerdown={(e) => e.stopPropagation()}
											onmousedown={(e) => e.stopPropagation()}
											min="0"
											max="1"
											step="0.05"
											value={layer.opacity}
											disabled={layer.locked}
											oninput={(e) => rigging.setLayerOpacity(layer.id, parseFloat((e.target as HTMLInputElement).value))}
											class="w-14 h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
											title="Geser transparansi"
										/>

										<!-- Visibility Eye Toggle -->
										<button
											type="button"
											onclick={() => {
												playSfx('toggle');
												rigging.toggleLayer(layer.id);
											}}
											title={layer.visible ? 'Sembunyikan' : 'Tampilkan'}
											class="p-1.5 rounded-lg border transition-colors cursor-pointer {
												layer.visible
													? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
													: 'bg-zinc-800/80 border-zinc-700 text-zinc-500'
											}"
										>
											{#if layer.visible}
												<Eye class="w-3 h-3" />
											{:else}
												<EyeOff class="w-3 h-3" />
											{/if}
										</button>

										<!-- Lock Toggle -->
										<button
											type="button"
											onclick={() => {
												playSfx('click');
												rigging.setLayerLock(layer.id);
											}}
											title={layer.locked ? 'Buka Kunci' : 'Kunci Layer'}
											class="p-1.5 rounded-lg border transition-colors cursor-pointer {
												layer.locked
													? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
													: 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
											}"
										>
											{#if layer.locked}
												<Lock class="w-3 h-3" />
											{:else}
												<Unlock class="w-3 h-3" />
											{/if}
										</button>

										<!-- Reorder Z-Index Buttons -->
										<div class="flex items-center gap-0.5">
											<button
												type="button"
												disabled={idx === 0}
												onclick={() => {
													playSfx('click');
													rigging.moveLayer(layer.id, 'up');
												}}
												title="Naikkan Layer"
												class="p-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-30 cursor-pointer"
											>
												<ArrowUp class="w-2.5 h-2.5" />
											</button>
											<button
												type="button"
												disabled={idx === rigging.stageLayers.length - 1}
												onclick={() => {
													playSfx('click');
													rigging.moveLayer(layer.id, 'down');
												}}
												title="Turunkan Layer"
												class="p-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-30 cursor-pointer"
											>
												<ArrowDown class="w-2.5 h-2.5" />
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

				<!-- TAB 2: ACCESSORIES & PROPS -->
				{:else if activeSubTab === 'accessories'}
					<div class="space-y-3">
						<div class="flex items-center justify-between text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
							<span>Aksesoris mengikuti gerakan kepala Live2D</span>
							<span class="font-mono text-[10px] text-amber-400 font-bold">{activeAccCount} Terpasang</span>
						</div>

						<div class="space-y-2">
							{#each rigging.activeAccessories as item}
								{@const isSelected = rigging.selectedLayerElementId === item.id}
								<div
									class="p-3 rounded-2xl border transition-all {
										isSelected
											? 'border-amber-400 ring-2 ring-amber-500/40 bg-amber-500/10'
											: item.visible
												? 'border-amber-500/40 bg-amber-500/5 shadow-xs'
												: isLightTheme
													? 'bg-white border-zinc-200'
													: 'bg-zinc-900/60 border-zinc-800/80'
									}"
								>
									<div class="flex items-center justify-between">
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											onclick={() => {
												playSfx('click');
												rigging.selectLayerElement(item.id);
											}}
											class="flex items-center gap-2 cursor-pointer flex-1"
										>
											<div class="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-base shadow-xs">
												{item.emoji}
											</div>
											<div>
												<span class="text-xs font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
													{item.name}
												</span>
												<span class="text-[8px] uppercase font-mono px-1 rounded bg-zinc-800 text-zinc-400">
													{item.category}
												</span>
											</div>
										</div>

										<button
											type="button"
											onclick={() => {
												playSfx('toggle');
												rigging.toggleAccessory(item.id);
											}}
											class="px-2 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer {
												item.visible
													? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-xs'
													: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
											}"
										>
											{item.visible ? '✓ Pasang' : '+ Pasang'}
										</button>
									</div>

									{#if item.visible}
										<!-- Fine Position & Scale Adjustments (Isolated from DnD) -->
										<div class="space-y-1.5 pt-2 mt-2 border-t border-zinc-800/60 text-[10px]">
											<div class="flex items-center justify-between">
												<span class="text-zinc-400">Ukuran Scale:</span>
												<span class="font-mono text-amber-400 font-bold">{item.scale.toFixed(2)}x</span>
											</div>
											<input
												type="range"
												draggable={false}
												onpointerdown={(e) => e.stopPropagation()}
												onmousedown={(e) => e.stopPropagation()}
												min="0.5"
												max="2.0"
												step="0.05"
												bind:value={item.scale}
												oninput={() => rigging.persist()}
												class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
											/>

											<div class="grid grid-cols-2 gap-2 pt-0.5">
												<div>
													<div class="flex justify-between text-[9px] text-zinc-400">
														<span>X:</span>
														<span class="font-mono text-zinc-300">{item.offsetX}px</span>
													</div>
													<input
														type="range"
														draggable={false}
														onpointerdown={(e) => e.stopPropagation()}
														onmousedown={(e) => e.stopPropagation()}
														min="-200"
														max="200"
														step="5"
														bind:value={item.offsetX}
														oninput={() => rigging.persist()}
														class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
													/>
												</div>
												<div>
													<div class="flex justify-between text-[9px] text-zinc-400">
														<span>Y:</span>
														<span class="font-mono text-zinc-300">{item.offsetY}px</span>
													</div>
													<input
														type="range"
														draggable={false}
														onpointerdown={(e) => e.stopPropagation()}
														onmousedown={(e) => e.stopPropagation()}
														min="-350"
														max="150"
														step="5"
														bind:value={item.offsetY}
														oninput={() => rigging.persist()}
														class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
													/>
												</div>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

				<!-- TAB 3: COLLAB STREAMER MODE -->
				{:else if activeSubTab === 'collab'}
					<div class="space-y-3">
						<!-- Toggle Switch Card -->
						<div class="p-3 rounded-2xl border flex items-center justify-between {
							rigging.isCollabModeActive
								? 'bg-purple-500/15 border-purple-500/50 shadow-xs ring-1 ring-purple-500/30'
								: isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
						}">
							<div class="flex items-center gap-2.5">
								<div class="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
									<Users class="w-4 h-4" />
								</div>
								<div>
									<h3 class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										Mode Collab Streamer
									</h3>
									<p class="text-[10px] text-zinc-400">
										Dual avatar Live2D di satu stage
									</p>
								</div>
							</div>

							<button
								type="button"
								onclick={() => rigging.toggleCollabMode()}
								class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer {
									rigging.isCollabModeActive
										? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
										: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
								}"
							>
								{rigging.isCollabModeActive ? '✓ Aktif' : 'Aktifkan'}
							</button>
						</div>

						{#if rigging.isCollabModeActive}
							<!-- Partner Selector -->
							<div class="p-3 rounded-2xl border space-y-2 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900/50 border-zinc-800'}">
								<span class="text-xs font-bold block {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
									Pilih Model Collab:
								</span>

								<div class="grid grid-cols-2 gap-1.5">
									{#each MODEL_CATALOG.slice(0, 6) as model}
										<button
											type="button"
											onclick={() => rigging.setCollabModel(model.id, model.name, model.url)}
											class="p-2 rounded-xl border text-left transition-all cursor-pointer {
												rigging.collabModelId === model.id
													? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold ring-1 ring-purple-500/50'
													: 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
											}"
										>
											<div class="truncate text-xs">{model.name}</div>
											<div class="text-[9px] opacity-75">{model.version}</div>
										</button>
									{/each}
								</div>
							</div>

							<!-- Positioning Controls -->
							<div class="p-3 rounded-2xl border space-y-2.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900/50 border-zinc-800'}">
								<span class="text-xs font-bold block {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
									Posisi & Skala Partner
								</span>

								<div class="grid grid-cols-3 gap-1 text-xs">
									<button
										type="button"
										onclick={() => (rigging.collabPosition = 'left')}
										class="p-1.5 rounded-xl border text-center transition-all {
											rigging.collabPosition === 'left' ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
										}"
									>
										Kiri
									</button>
									<button
										type="button"
										onclick={() => (rigging.collabPosition = 'right')}
										class="p-1.5 rounded-xl border text-center transition-all {
											rigging.collabPosition === 'right' ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
										}"
									>
										Kanan
									</button>
									<button
										type="button"
										onclick={() => (rigging.collabPosition = 'pip')}
										class="p-1.5 rounded-xl border text-center transition-all {
											rigging.collabPosition === 'pip' ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
										}"
									>
										PiP
									</button>
								</div>

								<div class="space-y-1">
									<div class="flex justify-between text-xs">
										<span class="text-zinc-400">Skala:</span>
										<span class="font-mono text-purple-400 font-bold">{Math.round(rigging.collabScale * 100)}%</span>
									</div>
									<input
										type="range"
										draggable={false}
										onpointerdown={(e) => e.stopPropagation()}
										onmousedown={(e) => e.stopPropagation()}
										min="0.4"
										max="1.5"
										step="0.05"
										bind:value={rigging.collabScale}
										oninput={() => rigging.persist()}
										class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500"
									/>
								</div>

								<div class="flex items-center justify-between pt-1">
									<span class="text-[11px] text-zinc-400">Sinkronkan Wajah:</span>
									<button
										type="button"
										onclick={() => {
											rigging.collabSyncTracking = !rigging.collabSyncTracking;
											rigging.persist();
										}}
										class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {
											rigging.collabSyncTracking ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
										}"
									>
										{rigging.collabSyncTracking ? 'Aktif (Sync)' : 'Mati (Idle)'}
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Window Resize Grip Handle (Corner in Windowed Mode) -->
		{#if rigging.layerManagerViewMode === 'windowed' && !rigging.isLayerMinimized}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				onpointerdown={handleResizePointerDown}
				onpointermove={handleResizePointerMove}
				onpointerup={handleResizePointerUp}
				onpointercancel={handleResizePointerUp}
				class="absolute bottom-1 right-1 w-5 h-5 cursor-nwse-resize text-zinc-500 hover:text-cyan-400 flex items-center justify-center z-50 select-none p-0.5"
				title="Tarik untuk ubah ukuran (Resize Window)"
			>
				<svg viewBox="0 0 16 16" class="w-3.5 h-3.5 fill-current opacity-70">
					<path d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14ZM14 6H12V4H14V6ZM6 14H4V12H6V14ZM10 10H8V8H10V10Z" />
				</svg>
			</div>
		{/if}
	</aside>
{/if}
