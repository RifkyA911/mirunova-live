<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
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
		Move,
		Trash2,
		Camera,
		Video,
		RefreshCw
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let activeSubTab = $state<'layers' | 'accessories' | 'collab'>('layers');
	let isDraggingWindow = $state<boolean>(false);
	let windowDragOffset = { x: 0, y: 0 };
	let isResizingWindow = $state<boolean>(false);
	let resizeStart = { x: 0, y: 0, w: 0, h: 0 };
	let draggedLayerIdx = $state<number | null>(null);
	let dragOverIdx = $state<number | null>(null);
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);

	onMount(async () => {
		try {
			availableCameras = await tracker.getAvailableVideoDevices(false);
		} catch {}
	});

	async function refreshCameraList() {
		try {
			playSfx('click');
			availableCameras = await tracker.getAvailableVideoDevices(true);
			rigging.showToast(`✓ Ditemukan ${availableCameras.length} webcam / kamera perangkat`);
		} catch {}
	}

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	const activeAccCount = $derived(
		rigging.activeAccessories.filter((a) => a.visible).length
	);

	const hostModelItem = $derived(
		MODEL_CATALOG.find((m) => m.id === rigging.selectedModelId || m.url === rigging.modelUrl) ||
		MODEL_3D_CATALOG.find((m) => m.id === rigging.selectedModelId)
	);

	const collabModelItem = $derived(
		MODEL_CATALOG.find((m) => m.id === rigging.collabModelId || m.url === rigging.collabModelUrl)
	);

	const collab2ModelItem = $derived(
		MODEL_CATALOG.find((m) => m.id === rigging.collab2ModelId || m.url === rigging.collab2ModelUrl)
	);

	function getLayerThumbnail(type: string): { bgClass: string; icon?: any; label: string; avatarUrl?: string; style?: string } {
		if (type === 'background') {
			if (rigging.backgroundStyle === 'solid') {
				return { bgClass: 'border-zinc-700', style: `background-color: ${rigging.backgroundColor};`, label: rigging.backgroundColor };
			}
			if (rigging.backgroundStyle === 'chroma') {
				return { bgClass: 'bg-[#00FF00] border-emerald-500', style: 'background-color: #00FF00;', label: 'Chroma' };
			}
			if (rigging.backgroundStyle === 'transparent') {
				return { bgClass: 'bg-[repeating-conic-gradient(#3f3f46_0%_25%,#18181b_0%_50%)] bg-[size:6px_6px] border-zinc-700', label: 'Alpha' };
			}
			if (rigging.backgroundStyle === 'mesh') {
				return { bgClass: 'bg-zinc-950 bg-[linear-gradient(to_right,#06b6d444_1px,transparent_1px),linear-gradient(to_bottom,#06b6d444_1px,transparent_1px)] bg-[size:6px_6px] border-cyan-800', label: 'Mesh' };
			}
			if (rigging.backgroundStyle === 'grid') {
				return { bgClass: 'bg-zinc-900 bg-[linear-gradient(to_right,#3f3f4650_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4650_1px,transparent_1px)] bg-[size:6px_6px] border-zinc-700', label: 'Grid' };
			}
			if (rigging.backgroundStyle === 'dots') {
				return { bgClass: 'bg-zinc-950 bg-[radial-gradient(#38bdf860_1.5px,transparent_1.5px)] bg-[size:6px_6px] border-sky-800', label: 'Dots' };
			}
			return { bgClass: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950 border-purple-800', label: 'Cosmic' };
		}
		if (type === 'model-host') {
			return {
				bgClass: 'bg-pink-500/20 border-pink-500/40 text-pink-300',
				icon: Smile,
				label: rigging.modelName,
				avatarUrl: hostModelItem?.avatarUrl
			};
		}
		if (type === 'model-collab') {
			return {
				bgClass: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
				icon: Users,
				label: rigging.isCollabModeActive ? rigging.collabModelName : 'Partner 1 (Nonaktif)',
				avatarUrl: rigging.isCollabModeActive ? collabModelItem?.avatarUrl : undefined
			};
		}
		if (type === 'model-collab-2') {
			return {
				bgClass: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
				icon: Users,
				label: rigging.isCollab2Active ? rigging.collab2ModelName : 'Partner 2 (Nonaktif)',
				avatarUrl: rigging.isCollab2Active ? collab2ModelItem?.avatarUrl : undefined
			};
		}
		if (type === 'accessories') {
			return { bgClass: 'bg-amber-500/20 border-amber-500/40 text-amber-300', icon: Sparkles, label: `${activeAccCount} Aktif` };
		}
		// shader-fx
		let shaderBg = 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
		if (rigging.screenEffect === 'vignette') shaderBg = 'bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.9)_100%)] border-zinc-700 bg-zinc-900';
		else if (rigging.screenEffect === 'scanlines') shaderBg = 'bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.8)_51%)] bg-[size:100%_4px] border-zinc-700 bg-zinc-900';
		else if (rigging.screenEffect === 'crt') shaderBg = 'bg-cyan-950/80 border-cyan-500 shadow-[inset_0_0_8px_rgba(6,182,212,0.6)]';
		else if (rigging.screenEffect === 'blur') shaderBg = 'backdrop-blur-sm bg-zinc-800/80 border-zinc-600';
		return { bgClass: shaderBg, icon: Tv, label: rigging.screenEffect };
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

		const headerEl = e.currentTarget as HTMLElement;
		try {
			headerEl.setPointerCapture(e.pointerId);
		} catch {}

		const onPointerMove = (ev: PointerEvent) => {
			if (!isDraggingWindow) return;
			const maxW = typeof window !== 'undefined' ? window.innerWidth : 1920;
			const maxH = typeof window !== 'undefined' ? window.innerHeight : 1080;
			const newX = Math.max(8, Math.min(maxW - 160, ev.clientX - windowDragOffset.x));
			const newY = Math.max(8, Math.min(maxH - 50, ev.clientY - windowDragOffset.y));
			rigging.layerWindowX = newX;
			rigging.layerWindowY = newY;
		};

		const onPointerUp = (ev: PointerEvent) => {
			isDraggingWindow = false;
			try {
				headerEl.releasePointerCapture(ev.pointerId);
			} catch {}
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
			rigging.persist();
		};

		window.addEventListener('pointermove', onPointerMove, { passive: true });
		window.addEventListener('pointerup', onPointerUp, { once: true });
		window.addEventListener('pointercancel', onPointerUp, { once: true });
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

		const resizeEl = e.currentTarget as HTMLElement;
		try {
			resizeEl.setPointerCapture(e.pointerId);
		} catch {}

		const onResizeMove = (ev: PointerEvent) => {
			if (!isResizingWindow) return;
			const maxW = typeof window !== 'undefined' ? window.innerWidth : 1920;
			const maxH = typeof window !== 'undefined' ? window.innerHeight : 1080;
			const dw = ev.clientX - resizeStart.x;
			const dh = ev.clientY - resizeStart.y;
			rigging.layerWindowWidth = Math.max(340, Math.min(maxW - 40, resizeStart.w + dw));
			rigging.layerWindowHeight = Math.max(260, Math.min(maxH - 40, resizeStart.h + dh));
		};

		const onResizeUp = (ev: PointerEvent) => {
			isResizingWindow = false;
			try {
				resizeEl.releasePointerCapture(ev.pointerId);
			} catch {}
			window.removeEventListener('pointermove', onResizeMove);
			window.removeEventListener('pointerup', onResizeUp);
			window.removeEventListener('pointercancel', onResizeUp);
			rigging.persist();
		};

		window.addEventListener('pointermove', onResizeMove, { passive: true });
		window.addEventListener('pointerup', onResizeUp, { once: true });
		window.addEventListener('pointercancel', onResizeUp, { once: true });
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
		class="z-40 shadow-2xl flex flex-col overflow-hidden border backdrop-blur-2xl select-none {
			isDraggingWindow || isResizingWindow || rigging.layerManagerViewMode === 'windowed'
				? 'transition-none'
				: 'transition-all duration-150'
		} {
			rigging.layerManagerViewMode === 'windowed'
				? 'fixed rounded-3xl'
				: 'fixed top-0 right-0 h-screen w-[520px] max-w-[95vw] rounded-l-3xl rounded-r-none border-r-0 border-y-0'
		} {
			isLightTheme
				? 'bg-white/95 text-zinc-900 border-zinc-200/90 shadow-xl'
				: 'bg-zinc-950/95 text-zinc-100 border-zinc-800/90 shadow-2xl shadow-cyan-950/20'
		}"
		style={rigging.layerManagerViewMode === 'windowed'
			? `left: ${rigging.layerWindowX}px; top: ${rigging.layerWindowY}px; width: ${rigging.layerWindowWidth}px; height: ${rigging.isLayerMinimized ? 'auto' : `${rigging.layerWindowHeight}px`}; min-width: 340px; min-height: 240px; max-width: 95vw; max-height: 95vh;`
			: `width: min(520px, 95vw); height: 100vh;`}
	>
		<!-- Window Header (Drag Handle in Windowed mode) -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onpointerdown={handleHeaderPointerDown}
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
											class="w-9 h-9 rounded-xl border overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner {thumb.bgClass}"
											style={thumb.style || ''}
										>
											{#if thumb.avatarUrl}
												<img
													src={thumb.avatarUrl}
													alt={layer.name}
													class="w-full h-full object-cover object-top"
												/>
											{:else if ThumbIcon}
												<ThumbIcon class="w-4 h-4 opacity-75" />
											{/if}
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

									<!-- Right: Controls (Slider, Visibility, Lock, Reorder Up/Down, Delete) -->
									<div class="flex items-center gap-1.5 shrink-0">
										<!-- Opacity Slider with explicit event isolation -->
										<div class="flex items-center gap-1" title="Geser transparansi layer: {Math.round(layer.opacity * 100)}%">
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
												class="w-16 h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
											/>
										</div>

										<!-- Visibility Eye Toggle -->
										<button
											type="button"
											onclick={(e) => {
												e.stopPropagation();
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
											onclick={(e) => {
												e.stopPropagation();
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
												onclick={(e) => {
													e.stopPropagation();
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
												onclick={(e) => {
													e.stopPropagation();
													playSfx('click');
													rigging.moveLayer(layer.id, 'down');
												}}
												title="Turunkan Layer"
												class="p-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-30 cursor-pointer"
											>
												<ArrowDown class="w-2.5 h-2.5" />
											</button>
										</div>

										<!-- Delete Layer Button -->
										<button
											type="button"
											onclick={(e) => {
												e.stopPropagation();
												playSfx('click');
												rigging.deleteLayer(layer.id);
											}}
											title="Hapus / Copot Layer Ini"
											class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors cursor-pointer"
										>
											<Trash2 class="w-3 h-3" />
										</button>
									</div>
								</div>
							{/each}
						</div>

						<!-- Active Props / Accessories Flat Stack (if any attached) -->
						{#if rigging.activeAccessories.filter((a) => a.visible).length > 0}
							<div class="pt-3 border-t border-zinc-800/60 space-y-2">
								<div class="flex items-center justify-between text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
									<span class="font-bold flex items-center gap-1.5 text-amber-400">
										<Sparkles class="w-3.5 h-3.5" />
										Aksesoris & Props Aktif ({rigging.activeAccessories.filter((a) => a.visible).length})
									</span>
									<span class="text-[9px] text-zinc-500">Klik untuk geser di kanvas</span>
								</div>

								<div class="space-y-1.5">
									{#each rigging.activeAccessories.filter((a) => a.visible) as acc (acc.id)}
										{@const isAccSelected = rigging.cursorToolMode === 'select-layer' && rigging.selectedLayerElementId === acc.id}
										<div
											class="p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 {
												isAccSelected
													? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50 shadow-xs'
													: isLightTheme
														? 'bg-white border-zinc-200 hover:border-zinc-300'
														: 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
											}"
										>
											<!-- Left: Emoji & Name -->
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												onclick={() => {
													playSfx('click');
													rigging.setCursorToolMode('select-layer');
													rigging.selectLayerElement(acc.id);
												}}
												class="flex items-center gap-2 truncate flex-1 cursor-pointer"
											>
												<div class="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-base shadow-inner shrink-0">
													{acc.emoji}
												</div>
												<div class="truncate">
													<div class="flex items-center gap-1.5 truncate">
														<span class="text-xs font-bold truncate {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
															{acc.name}
														</span>
														<span class="text-[8px] px-1 py-0.2 rounded font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
															Props
														</span>
													</div>
													<div class="text-[9px] text-zinc-400 font-mono">
														Skala: {acc.scale}x • Opacity: {Math.round((acc.opacity || 1) * 100)}%
													</div>
												</div>
											</div>

											<!-- Right: Opacity Slider, Eye, and Delete Button -->
											<div class="flex items-center gap-1.5 shrink-0">
												<input
													type="range"
													draggable={false}
													onpointerdown={(e) => e.stopPropagation()}
													onmousedown={(e) => e.stopPropagation()}
													min="0"
													max="1"
													step="0.05"
													bind:value={acc.opacity}
													oninput={() => rigging.persist()}
													class="w-14 h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
													title="Geser transparansi aksesoris"
												/>

												<button
													type="button"
													onclick={() => {
														playSfx('toggle');
														acc.visible = !acc.visible;
														rigging.persist();
													}}
													title={acc.visible ? 'Sembunyikan' : 'Tampilkan'}
													class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
												>
													{#if acc.visible}
														<Eye class="w-3 h-3 text-amber-400" />
													{:else}
														<EyeOff class="w-3 h-3 text-zinc-500" />
													{/if}
												</button>

												<button
													type="button"
													onclick={() => {
														playSfx('click');
														rigging.removeAccessory(acc.id);
													}}
													title="Hapus / Copot Aksesoris Ini"
													class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors cursor-pointer"
												>
													<Trash2 class="w-3 h-3" />
												</button>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Quick Layer Creation & Actions Bar -->
						<div class="pt-2 flex items-center gap-2">
							<button
								type="button"
								onclick={() => {
									playSfx('click');
									activeSubTab = 'accessories';
								}}
								class="flex-1 py-2 px-3 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
							>
								<Plus class="w-3.5 h-3.5" />
								<span>+ Pasang Props / Aksesoris</span>
							</button>

							<button
								type="button"
								onclick={() => {
									playSfx('click');
									activeSubTab = 'collab';
								}}
								class="flex-1 py-2 px-3 rounded-xl border border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
							>
								<Users class="w-3.5 h-3.5" />
								<span>+ Collab Studio (3 Streamers)</span>
							</button>
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

				<!-- TAB 3: MULTI-CAMERA COLLAB STREAMER STUDIO (MAX 3 STREAMERS) -->
				{:else if activeSubTab === 'collab'}
					{@const activeStreamerCount = 1 + (rigging.isCollabModeActive ? 1 : 0) + (rigging.isCollab2Active ? 1 : 0)}
					<div class="space-y-3.5">
						<!-- Studio Overview Header Card -->
						<div class="p-3.5 rounded-2xl border bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-zinc-900 border-purple-500/30 flex items-center justify-between shadow-md">
							<div class="flex items-center gap-3">
								<div class="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-inner">
									<Users class="w-5 h-5" />
								</div>
								<div>
									<div class="flex items-center gap-2">
										<h3 class="text-xs font-bold text-zinc-100">
											Collab Studio Multi-Camera
										</h3>
										<span class="px-2 py-0.5 rounded-full font-mono font-bold text-[9px] {
											activeStreamerCount === 3
												? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
												: activeStreamerCount === 2
													? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
													: 'bg-zinc-800 text-zinc-400 border border-zinc-700'
										}">
											{activeStreamerCount}/3 Streamers Aktif
										</span>
									</div>
									<p class="text-[10px] text-zinc-400 mt-0.5">
										Maksimal 3 orang streamer dengan kamera webcam mandiri per individu
									</p>
								</div>
							</div>

							<button
								type="button"
								onclick={refreshCameraList}
								class="p-2 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
								title="Pindai ulang hardware webcam yang terhubung"
							>
								<RefreshCw class="w-3.5 h-3.5" />
							</button>
						</div>

						<!-- STREAMER 1: HOST UTAMA -->
						<div class="p-3.5 rounded-2xl border space-y-2.5 {
							isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
						}">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]"></span>
									<span class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										Streamer 1 (Host Utama)
									</span>
									<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
										HOST
									</span>
								</div>
								<span class="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">
									{rigging.modelName}
								</span>
							</div>

							<!-- Dedicated Camera Hardware Selector for Host -->
							<div class="space-y-1">
								<label for="host-camera-select" class="flex items-center justify-between text-[10px] text-zinc-400">
									<span class="flex items-center gap-1">
										<Camera class="w-3 h-3 text-pink-400" />
										Pilih Perangkat Kamera Host:
									</span>
									<span class="font-mono text-[9px] text-zinc-500">
										{availableCameras.length} webcam terdeteksi
									</span>
								</label>
								<select
									id="host-camera-select"
									value={rigging.cameraDeviceId}
									onchange={(e) => {
										const sel = e.target as HTMLSelectElement;
										tracker.switchCamera(sel.value);
									}}
									class="w-full px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors {
										isLightTheme
											? 'bg-white border-zinc-300 text-zinc-800'
											: 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-pink-500'
									}"
								>
									<option value="">Kamera Default Sistem (Otomatis)</option>
									{#each availableCameras as cam}
										<option value={cam.deviceId}>
											{cam.label || `Webcam (${cam.deviceId.slice(0, 8)}...)`}
										</option>
									{/each}
								</select>
							</div>
						</div>

						<!-- STREAMER 2: COLLAB GUEST 1 -->
						<div class="p-3.5 rounded-2xl border space-y-3 {
							rigging.isCollabModeActive
								? 'bg-purple-950/20 border-purple-500/40 ring-1 ring-purple-500/30 shadow-xs'
								: isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800'
						}">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="w-2.5 h-2.5 rounded-full {rigging.isCollabModeActive ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-zinc-600'}"></span>
									<div>
										<span class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
											Streamer 2 (Collab Guest 1)
										</span>
										<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 ml-1.5">
											GUEST 1
										</span>
									</div>
								</div>

								<button
									type="button"
									onclick={() => rigging.toggleCollabMode()}
									class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 {
										rigging.isCollabModeActive
											? 'bg-purple-600 hover:bg-purple-500 text-white'
											: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
									}"
								>
									{rigging.isCollabModeActive ? '✓ Aktif' : '+ Aktifkan'}
								</button>
							</div>

							{#if rigging.isCollabModeActive}
								<!-- Camera Selector for Guest 1 -->
								<div class="space-y-1">
									<label for="collab1-camera-select" class="flex items-center justify-between text-[10px] text-zinc-400">
										<span class="flex items-center gap-1">
											<Camera class="w-3 h-3 text-purple-400" />
											Kamera Khusus Guest 1:
										</span>
										<span class="text-[9px] text-purple-300 font-mono">
											{rigging.collabCameraLabel || 'Kamera Mandiri'}
										</span>
									</label>
									<select
										id="collab1-camera-select"
										value={rigging.collabCameraDeviceId}
										onchange={(e) => {
											const sel = e.target as HTMLSelectElement;
											const opt = sel.options[sel.selectedIndex];
											rigging.setCollabCamera('guest1', sel.value, opt?.text || '');
										}}
										class="w-full px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors {
											isLightTheme
												? 'bg-white border-zinc-300 text-zinc-800'
												: 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-purple-500'
										}"
									>
										<option value="">Gunakan Kamera Sekunder (Pilih dari daftar...)</option>
										{#each availableCameras as cam}
											<option value={cam.deviceId}>
												{cam.label || `Webcam (${cam.deviceId.slice(0, 8)}...)`}
											</option>
										{/each}
									</select>
								</div>

								<!-- Model Selector for Guest 1 -->
								<div class="space-y-1.5">
									<span class="text-[10px] text-zinc-400 block font-semibold">
										Avatar Live2D Guest 1:
									</span>
									<div class="grid grid-cols-3 gap-1.5">
										{#each MODEL_CATALOG.slice(0, 6) as model}
											<button
												type="button"
												onclick={() => rigging.setCollabModel(model.id, model.name, model.url)}
												class="p-1.5 rounded-xl border text-left transition-all cursor-pointer {
													rigging.collabModelId === model.id
														? 'border-purple-500 bg-purple-500/20 text-purple-200 font-bold ring-1 ring-purple-500/50 shadow-xs'
														: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
												}"
											>
												<div class="truncate text-[11px]">{model.name}</div>
											</button>
										{/each}
									</div>
								</div>

								<!-- Layout Position, Scale, & Sync Controls -->
								<div class="space-y-2 pt-1 border-t border-zinc-800/60">
									<div class="flex items-center justify-between text-[10px]">
										<span class="text-zinc-400">Posisi di Panggung:</span>
										<div class="flex items-center gap-1">
											{#each ['left', 'center', 'right', 'pip'] as pos}
												<button
													type="button"
													onclick={() => (rigging.collabPosition = pos as any)}
													class="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all {
														rigging.collabPosition === pos
															? 'bg-purple-600 text-white shadow-xs'
															: 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
													}"
												>
													{pos}
												</button>
											{/each}
										</div>
									</div>

									<div class="grid grid-cols-2 gap-2 text-[10px]">
										<div>
											<div class="flex justify-between text-zinc-400 mb-0.5">
												<span>Skala:</span>
												<span class="font-mono text-purple-300 font-bold">{Math.round(rigging.collabScale * 100)}%</span>
											</div>
											<input
												type="range"
												draggable={false}
												min="0.4"
												max="1.5"
												step="0.05"
												bind:value={rigging.collabScale}
												oninput={() => rigging.persist()}
												class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500"
											/>
										</div>

										<div>
											<div class="flex justify-between text-zinc-400 mb-0.5">
												<span>Geser X:</span>
												<span class="font-mono text-purple-300 font-bold">{rigging.collabOffsetX}px</span>
											</div>
											<input
												type="range"
												draggable={false}
												min="-500"
												max="500"
												step="10"
												bind:value={rigging.collabOffsetX}
												oninput={() => rigging.persist()}
												class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500"
											/>
										</div>
									</div>

									<div class="flex items-center justify-between pt-1">
										<span class="text-[10px] text-zinc-400">Mode Animasi / Tracking:</span>
										<button
											type="button"
											onclick={() => {
												rigging.collabSyncTracking = !rigging.collabSyncTracking;
												rigging.persist();
											}}
											class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {
												rigging.collabSyncTracking ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
											}"
										>
											{rigging.collabSyncTracking ? '✓ Ikuti Wajah (Sync)' : '💤 Idle & Breath Otomatis'}
										</button>
									</div>
								</div>
							{/if}
						</div>

						<!-- STREAMER 3: COLLAB GUEST 2 -->
						<div class="p-3.5 rounded-2xl border space-y-3 {
							rigging.isCollab2Active
								? 'bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/30 shadow-xs'
								: isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800'
						}">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="w-2.5 h-2.5 rounded-full {rigging.isCollab2Active ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-zinc-600'}"></span>
									<div>
										<span class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
											Streamer 3 (Collab Guest 2)
										</span>
										<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ml-1.5">
											GUEST 2
										</span>
									</div>
								</div>

								<button
									type="button"
									onclick={() => rigging.toggleCollab2Mode()}
									class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 {
										rigging.isCollab2Active
											? 'bg-indigo-600 hover:bg-indigo-500 text-white'
											: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
									}"
								>
									{rigging.isCollab2Active ? '✓ Aktif' : '+ Aktifkan'}
								</button>
							</div>

							{#if rigging.isCollab2Active}
								<!-- Camera Selector for Guest 2 -->
								<div class="space-y-1">
									<label for="collab2-camera-select" class="flex items-center justify-between text-[10px] text-zinc-400">
										<span class="flex items-center gap-1">
											<Camera class="w-3 h-3 text-indigo-400" />
											Kamera Khusus Guest 2:
										</span>
										<span class="text-[9px] text-indigo-300 font-mono">
											{rigging.collab2CameraLabel || 'Kamera Mandiri'}
										</span>
									</label>
									<select
										id="collab2-camera-select"
										value={rigging.collab2CameraDeviceId}
										onchange={(e) => {
											const sel = e.target as HTMLSelectElement;
											const opt = sel.options[sel.selectedIndex];
											rigging.setCollabCamera('guest2', sel.value, opt?.text || '');
										}}
										class="w-full px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors {
											isLightTheme
												? 'bg-white border-zinc-300 text-zinc-800'
												: 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-indigo-500'
										}"
									>
										<option value="">Gunakan Kamera Tersier (Pilih dari daftar...)</option>
										{#each availableCameras as cam}
											<option value={cam.deviceId}>
												{cam.label || `Webcam (${cam.deviceId.slice(0, 8)}...)`}
											</option>
										{/each}
									</select>
								</div>

								<!-- Model Selector for Guest 2 -->
								<div class="space-y-1.5">
									<span class="text-[10px] text-zinc-400 block font-semibold">
										Avatar Live2D Guest 2:
									</span>
									<div class="grid grid-cols-3 gap-1.5">
										{#each MODEL_CATALOG.slice(0, 6) as model}
											<button
												type="button"
												onclick={() => rigging.setCollab2Model(model.id, model.name, model.url)}
												class="p-1.5 rounded-xl border text-left transition-all cursor-pointer {
													rigging.collab2ModelId === model.id
														? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-bold ring-1 ring-indigo-500/50 shadow-xs'
														: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
												}"
											>
												<div class="truncate text-[11px]">{model.name}</div>
											</button>
										{/each}
									</div>
								</div>

								<!-- Layout Position, Scale, & Sync Controls -->
								<div class="space-y-2 pt-1 border-t border-zinc-800/60">
									<div class="flex items-center justify-between text-[10px]">
										<span class="text-zinc-400">Posisi di Panggung:</span>
										<div class="flex items-center gap-1">
											{#each ['left', 'center', 'right', 'pip'] as pos}
												<button
													type="button"
													onclick={() => (rigging.collab2Position = pos as any)}
													class="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all {
														rigging.collab2Position === pos
															? 'bg-indigo-600 text-white shadow-xs'
															: 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
													}"
												>
													{pos}
												</button>
											{/each}
										</div>
									</div>

									<div class="grid grid-cols-2 gap-2 text-[10px]">
										<div>
											<div class="flex justify-between text-zinc-400 mb-0.5">
												<span>Skala:</span>
												<span class="font-mono text-indigo-300 font-bold">{Math.round(rigging.collab2Scale * 100)}%</span>
											</div>
											<input
												type="range"
												draggable={false}
												min="0.4"
												max="1.5"
												step="0.05"
												bind:value={rigging.collab2Scale}
												oninput={() => rigging.persist()}
												class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-indigo-500"
											/>
										</div>

										<div>
											<div class="flex justify-between text-zinc-400 mb-0.5">
												<span>Geser X:</span>
												<span class="font-mono text-indigo-300 font-bold">{rigging.collab2OffsetX}px</span>
											</div>
											<input
												type="range"
												draggable={false}
												min="-500"
												max="500"
												step="10"
												bind:value={rigging.collab2OffsetX}
												oninput={() => rigging.persist()}
												class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-indigo-500"
											/>
										</div>
									</div>

									<div class="flex items-center justify-between pt-1">
										<span class="text-[10px] text-zinc-400">Mode Animasi / Tracking:</span>
										<button
											type="button"
											onclick={() => {
												rigging.collab2SyncTracking = !rigging.collab2SyncTracking;
												rigging.persist();
											}}
											class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {
												rigging.collab2SyncTracking ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
											}"
										>
											{rigging.collab2SyncTracking ? '✓ Ikuti Wajah (Sync)' : '💤 Idle & Breath Otomatis'}
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Window Resize Grip Handle (Corner in Windowed Mode) -->
		{#if rigging.layerManagerViewMode === 'windowed' && !rigging.isLayerMinimized}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				onpointerdown={handleResizePointerDown}
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
