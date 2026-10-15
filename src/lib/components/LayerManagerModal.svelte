<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { i18n } from '#lib/i18n/index.svelte';
	import { MODEL_CATALOG, MODEL_3D_CATALOG } from '#lib/data/models';
	import type { AccessoryItem } from '#lib/types/tracking';
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
		RefreshCw,
		Upload,
		Image,
		ChevronDown,
		ChevronUp,
		Sliders
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let isDraggingWindow = $state<boolean>(false);
	let windowDragOffset = { x: 0, y: 0 };
	let isResizingWindow = $state<boolean>(false);
	let resizeStart = { x: 0, y: 0, w: 0, h: 0 };
	let draggedLayerIdx = $state<number | null>(null);
	let dragOverIdx = $state<number | null>(null);
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);

	// Collapsible quick drawer states
	let isAddPropDrawerOpen = $state<boolean>(false);
	let isCollabDrawerOpen = $state<boolean>(false);

	// Custom Prop Upload states
	let customPropName = $state<string>('');
	let customPropImageUrl = $state<string>('');
	let customPropAttachTo = $state<'head' | 'body' | 'screen'>('head');
	let customPropFileInput = $state<HTMLInputElement>();

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
		rigging.avatarEngine === '3d'
			? MODEL_3D_CATALOG.find((m) => m.id === rigging.selected3DModelId)
			: MODEL_CATALOG.find((m) => m.id === rigging.selectedModelId || m.url === rigging.modelUrl)
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
			rigging.layerWindowWidth = Math.max(380, Math.min(maxW - 40, resizeStart.w + dw));
			rigging.layerWindowHeight = Math.max(280, Math.min(maxH - 40, resizeStart.h + dh));
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

	function handleCustomPropFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			if (ev.target?.result) {
				customPropImageUrl = ev.target.result as string;
				if (!customPropName.trim()) {
					customPropName = file.name.replace(/\.[^/.]+$/, '');
				}
				playSfx('toggle');
			}
		};
		reader.readAsDataURL(file);
	}

	function handleAddCustomPropSubmit() {
		if (!customPropImageUrl) {
			rigging.showToast('Pilih gambar prop terlebih dahulu');
			return;
		}
		const name = customPropName.trim() || 'Custom Prop';
		playSfx('success');
		rigging.addCustomAccessory(name, customPropImageUrl, customPropAttachTo);
		customPropImageUrl = '';
		customPropName = '';
		isAddPropDrawerOpen = false;
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
				: 'fixed top-0 right-0 h-screen w-[540px] max-w-[95vw] rounded-l-3xl rounded-r-none border-r-0 border-y-0'
		} {
			isLightTheme
				? 'bg-white/98 text-zinc-900 border-zinc-200/90 shadow-xl'
				: 'bg-zinc-950/98 text-zinc-100 border-zinc-800/90 shadow-2xl shadow-cyan-950/20'
		}"
		style={rigging.layerManagerViewMode === 'windowed'
			? `left: ${rigging.layerWindowX}px; top: ${rigging.layerWindowY}px; width: min(${rigging.layerWindowWidth}px, calc(100vw - 1rem)); height: ${rigging.isLayerMinimized ? 'auto' : `${rigging.layerWindowHeight}px`}; min-width: min(340px, calc(100vw - 1rem)); min-height: 280px; max-width: calc(100vw - 1rem); max-height: 95vh;`
			: `width: min(540px, 95vw); height: 100vh;`}
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
							{rigging.stageLayers.length} Layer
						</span>
						{#if activeAccCount > 0}
							<span class="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
								{activeAccCount} Props
							</span>
						{/if}
					</div>
					<p class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} truncate">
						{rigging.layerManagerViewMode === 'windowed' ? 'Drag header untuk geser • Sudut kanan bawah untuk resize' : 'Mode Sticky (Full Height Sisi Kanan)'}
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
			<!-- Quick Actions Toolbar: Add Props & Collab Studio (Unified, No Redundant Tabs) -->
			<div class="px-3.5 py-2 border-b flex items-center gap-2 shrink-0 {
				isLightTheme ? 'bg-zinc-100/70 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
			}">
				<!-- Button: Upload / Add Prop Drawer Toggle -->
				<button
					type="button"
					onclick={() => {
						playSfx('click');
						isAddPropDrawerOpen = !isAddPropDrawerOpen;
						if (isAddPropDrawerOpen) isCollabDrawerOpen = false;
					}}
					class="flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border {
						isAddPropDrawerOpen
							? 'bg-amber-400 text-zinc-950 border-amber-300 ring-2 ring-amber-400/40'
							: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400'
					}"
				>
					<Sparkles class="w-3.5 h-3.5" />
					<span>+ Upload / Pasang Prop</span>
					{#if isAddPropDrawerOpen}
						<ChevronUp class="w-3 h-3" />
					{:else}
						<ChevronDown class="w-3 h-3 opacity-60" />
					{/if}
				</button>

				<!-- Button: Collab Studio Drawer Toggle -->
				<button
					type="button"
					onclick={() => {
						playSfx('click');
						isCollabDrawerOpen = !isCollabDrawerOpen;
						if (isCollabDrawerOpen) isAddPropDrawerOpen = false;
					}}
					class="flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border {
						isCollabDrawerOpen
							? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-500/40'
							: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500'
					}"
				>
					<Users class="w-3.5 h-3.5" />
					<span>Collab Studio (3 Ppl)</span>
					{#if rigging.isCollabModeActive || rigging.isCollab2Active}
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
					{/if}
					{#if isCollabDrawerOpen}
						<ChevronUp class="w-3 h-3" />
					{:else}
						<ChevronDown class="w-3 h-3 opacity-60" />
					{/if}
				</button>
			</div>

			<!-- Collapsible Drawer 1: Upload / Add Prop -->
			{#if isAddPropDrawerOpen}
				<div class="p-3.5 border-b bg-amber-950/15 border-amber-500/30 space-y-3 shrink-0 animate-in fade-in duration-150">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
							<Upload class="w-3.5 h-3.5" />
							Upload Custom Prop / Aksesoris Gambar
						</span>
						<span class="text-[10px] text-zinc-400">PNG, WebP, SVG, GIF, JPEG</span>
					</div>

					<!-- Custom Prop Upload Row -->
					<div class="p-3 rounded-2xl border space-y-2.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900/80 border-zinc-800'}">
						<div class="flex items-center gap-3">
							<!-- Image Preview or Upload Trigger Box -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => customPropFileInput?.click()}
								class="w-14 h-14 rounded-xl border-2 border-dashed border-amber-500/40 hover:border-amber-400 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden shrink-0 {
									isLightTheme ? 'bg-zinc-50' : 'bg-zinc-950'
								}"
								title="Pilih gambar dari komputer"
							>
								{#if customPropImageUrl}
									<img src={customPropImageUrl} alt="Preview" class="w-full h-full object-contain p-1" />
								{:else}
									<Image class="w-5 h-5 text-amber-400/80 mb-0.5" />
									<span class="text-[8px] font-bold text-amber-300">PILIH</span>
								{/if}
							</div>
							<input
								bind:this={customPropFileInput}
								type="file"
								accept="image/*"
								onchange={handleCustomPropFileUpload}
								class="hidden"
							/>

							<!-- Name and Attachment Options -->
							<div class="flex-1 space-y-1.5 min-w-0">
								<input
									type="text"
									bind:value={customPropName}
									placeholder="Nama aksesoris / prop..."
									class="w-full px-2.5 py-1 rounded-xl text-xs border {
										isLightTheme
											? 'bg-white border-zinc-300 text-zinc-900'
											: 'bg-zinc-950 border-zinc-700 text-zinc-200 focus:border-amber-400'
									}"
								/>

								<!-- Body Attachment Selector -->
								<div class="flex items-center gap-1 text-[10px]">
									<span class="text-zinc-400 mr-1 shrink-0">Tempel di:</span>
									<button
										type="button"
										onclick={() => (customPropAttachTo = 'head')}
										class="px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer {
											customPropAttachTo === 'head'
												? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
												: 'bg-zinc-800 text-zinc-300 border-zinc-700'
										}"
									>
										Kepala (Head)
									</button>
									<button
										type="button"
										onclick={() => (customPropAttachTo = 'body')}
										class="px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer {
											customPropAttachTo === 'body'
												? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
												: 'bg-zinc-800 text-zinc-300 border-zinc-700'
										}"
									>
										Badan (Body)
									</button>
									<button
										type="button"
										onclick={() => (customPropAttachTo = 'screen')}
										class="px-2 py-0.5 rounded-lg border font-semibold transition-all cursor-pointer {
											customPropAttachTo === 'screen'
												? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
												: 'bg-zinc-800 text-zinc-300 border-zinc-700'
										}"
									>
										Layar (HUD)
									</button>
								</div>
							</div>
						</div>

						<div class="flex items-center justify-end gap-2 pt-1">
							<button
								type="button"
								onclick={handleAddCustomPropSubmit}
								class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
							>
								<Check class="w-3.5 h-3.5" />
								<span>Pasang ke Panggung</span>
							</button>
						</div>
					</div>

					<!-- Quick Preset Props Selection -->
					<div class="space-y-1.5 pt-1">
						<span class="text-[11px] font-bold text-zinc-400 block">
							Atau Pilih Preset Cepat:
						</span>
						<div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
							{#each rigging.activeAccessories.slice(0, 10) as item}
								<button
									type="button"
									onclick={() => {
										playSfx('toggle');
										rigging.toggleAccessory(item.id);
									}}
									class="p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 {
										item.visible
											? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50 font-bold'
											: isLightTheme
												? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
												: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
									}"
									title={item.name}
								>
									<span class="text-base">{item.emoji}</span>
									<span class="text-[9px] truncate max-w-full block">{item.name.split(' ')[0]}</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Collapsible Drawer 2: Collab Studio Multi-Camera Setup -->
			{#if isCollabDrawerOpen}
				<div class="p-3.5 border-b bg-purple-950/15 border-purple-500/30 space-y-3 shrink-0 animate-in fade-in duration-150">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-purple-300 flex items-center gap-1.5">
							<Users class="w-3.5 h-3.5" />
							Studio Collab Multi-Camera (Maks 3 Orang)
						</span>
						<button
							type="button"
							onclick={refreshCameraList}
							class="text-[10px] text-purple-300 hover:text-purple-200 flex items-center gap-1 cursor-pointer"
						>
							<RefreshCw class="w-3 h-3" />
							<span>Pindai Kamera</span>
						</button>
					</div>

					<!-- Streamer 2 (Collab Guest 1) Setup -->
					<div class="p-3 rounded-2xl border space-y-2 {
						rigging.isCollabModeActive
							? 'bg-purple-950/30 border-purple-500/40'
							: isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
					}">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="w-2 h-2 rounded-full {rigging.isCollabModeActive ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-zinc-600'}"></span>
								<span class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">Guest 1: {rigging.collabModelName}</span>
							</div>
							<button
								type="button"
								onclick={() => rigging.toggleCollabMode()}
								class="px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer {
									rigging.isCollabModeActive
										? 'bg-purple-600 text-white'
										: 'bg-zinc-800 text-zinc-300'
								}"
							>
								{rigging.isCollabModeActive ? '✓ Aktif' : '+ Aktifkan'}
							</button>
						</div>

						{#if rigging.isCollabModeActive}
							<div class="space-y-1.5 pt-1 text-[10px]">
								<select
									value={rigging.collabCameraDeviceId}
									onchange={(e) => {
										const sel = e.target as HTMLSelectElement;
										const opt = sel.options[sel.selectedIndex];
										rigging.setCollabCamera('guest1', sel.value, opt?.text || '');
									}}
									class="w-full px-2 py-1 rounded-xl border {
										isLightTheme ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-950 border-zinc-700 text-zinc-200'
									}"
								>
									<option value="">Pilih Kamera Mandiri Guest 1...</option>
									{#each availableCameras as cam}
										<option value={cam.deviceId}>{cam.label || `Webcam (${cam.deviceId.slice(0, 8)})`}</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>

					<!-- Streamer 3 (Collab Guest 2) Setup -->
					<div class="p-3 rounded-2xl border space-y-2 {
						rigging.isCollab2Active
							? 'bg-indigo-950/30 border-indigo-500/40'
							: isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
					}">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="w-2 h-2 rounded-full {rigging.isCollab2Active ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-zinc-600'}"></span>
								<span class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">Guest 2: {rigging.collab2ModelName}</span>
							</div>
							<button
								type="button"
								onclick={() => rigging.toggleCollab2Mode()}
								class="px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer {
									rigging.isCollab2Active
										? 'bg-indigo-600 text-white'
										: 'bg-zinc-800 text-zinc-300'
								}"
							>
								{rigging.isCollab2Active ? '✓ Aktif' : '+ Aktifkan'}
							</button>
						</div>

						{#if rigging.isCollab2Active}
							<div class="space-y-1.5 pt-1 text-[10px]">
								<select
									value={rigging.collab2CameraDeviceId}
									onchange={(e) => {
										const sel = e.target as HTMLSelectElement;
										const opt = sel.options[sel.selectedIndex];
										rigging.setCollabCamera('guest2', sel.value, opt?.text || '');
									}}
									class="w-full px-2 py-1 rounded-xl border {
										isLightTheme ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-950 border-zinc-700 text-zinc-200'
									}"
								>
									<option value="">Pilih Kamera Mandiri Guest 2...</option>
									{#each availableCameras as cam}
										<option value={cam.deviceId}>{cam.label || `Webcam (${cam.deviceId.slice(0, 8)})`}</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- UNIFIED LAYER STACK (Core View: Photoshop Style) -->
			<div class="p-3.5 overflow-y-auto space-y-2 custom-scrollbar flex-1 min-h-0">
				<div class="flex items-center justify-between text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
					<span>Urutan Layer Panggung:</span>
					<span class="font-mono text-[10px]">Atas = Paling Depan (Z-Index Tertinggi)</span>
				</div>

				<div class="space-y-2">
					{#each rigging.stageLayers as layer, idx (layer.id)}
						{@const thumb = getLayerThumbnail(layer.type)}
						{@const ThumbIcon = thumb.icon}
						{@const isSelected = rigging.selectedLayerElementId === layer.id ||
							(rigging.selectedLayerElementId === 'host' && layer.type === 'model-host') ||
							(rigging.selectedLayerElementId === 'collab' && layer.type === 'model-collab') ||
							(rigging.selectedLayerElementId === 'collab-2' && layer.type === 'model-collab-2')}
						<!-- Row is drop target only, not whole-draggable -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							role="listitem"
							ondragover={(e) => onLayerDragOver(idx, e)}
							ondrop={(e) => onLayerDrop(idx, e)}
							class="p-2.5 rounded-2xl border transition-all duration-150 flex flex-col gap-2 {
								dragOverIdx === idx ? 'border-cyan-400 ring-2 ring-cyan-500/40' : ''
							} {
								isSelected
									? 'border-cyan-500/70 bg-cyan-500/10 ring-1 ring-cyan-500/40 shadow-sm'
									: layer.visible
										? isLightTheme
											? 'bg-white border-zinc-200 shadow-xs hover:border-zinc-300'
											: 'bg-zinc-900/70 border-zinc-800 shadow-xs hover:border-zinc-700'
										: 'opacity-50 bg-zinc-950/40 border-dashed border-zinc-800'
							}"
						>
							<!-- Main Row: Left Info + Right Controls Flush Right -->
							<div class="w-full flex items-center justify-between gap-2.5">
								<!-- Left: Drag Grip Handle & Thumbnail & Title -->
								<div class="flex items-center gap-2 truncate min-w-0 flex-1">
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
											else if (layer.type === 'model-collab-2') rigging.selectLayerElement('collab-2');
											else rigging.selectLayerElement(layer.id);
										}}
										class="truncate cursor-pointer flex-1 min-w-0"
									>
										<div class="flex items-center gap-1.5 truncate">
											<span class="text-xs font-bold truncate {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
												{#if layer.type === 'model-host'}
													Host: {rigging.modelName}
												{:else if layer.type === 'model-collab'}
													Collab 1: {rigging.isCollabModeActive ? rigging.collabModelName : '(Nonaktif)'}
												{:else if layer.type === 'model-collab-2'}
													Collab 2: {rigging.isCollab2Active ? rigging.collab2ModelName : '(Nonaktif)'}
												{:else if layer.type === 'accessories'}
													Aksesoris & Props ({activeAccCount})
												{:else if layer.type === 'shader-fx'}
													Filter Layar ({rigging.screenEffect.toUpperCase()})
												{:else if layer.type === 'background'}
													Latar Belakang ({rigging.backgroundStyle.toUpperCase()})
												{:else}
													{layer.name}
												{/if}
											</span>
											<span class="text-[8px] px-1 py-0.2 rounded font-mono font-semibold bg-zinc-800 text-zinc-300 shrink-0">
												{layer.badge}
											</span>
										</div>
										<div class="text-[9.5px] mt-0.5 space-y-0.5 font-mono {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
											{#if layer.type === 'model-host'}
												<div class="flex items-center gap-1.5 flex-wrap">
													{#if hostModelItem && 'version' in hostModelItem}
														<span class="text-cyan-500 font-semibold">{hostModelItem.version || 'Cubism 4'}</span>
														{#if hostModelItem.author}
															<span class="opacity-80">• {hostModelItem.author}</span>
														{/if}
													{:else}
														<span class="text-cyan-500 font-semibold">{rigging.avatarEngine === '3d' ? 'Three.js 3D' : 'Cubism 4'}</span>
													{/if}
													<span class="opacity-80">• Zoom {rigging.zoomLevel.toFixed(2)}x</span>
												</div>
												<div class="flex items-center gap-1.5 opacity-80 flex-wrap">
													<span>{rigging.isCameraActive ? `Tracking Kamera (${rigging.fps || 60} FPS)` : 'Manual Rig'}</span>
													<span>• Opacity: {Math.round(layer.opacity * 100)}%</span>
												</div>
											{:else if layer.type === 'model-collab'}
												<div class="flex items-center gap-1.5 flex-wrap">
													<span class="text-purple-400 font-semibold">{rigging.isCollabModeActive ? rigging.collabModelName : 'Guest 1 (Nonaktif)'}</span>
													{#if rigging.isCollabModeActive}
														<span class="opacity-80">• Pos: {rigging.collabPosition.toUpperCase()}</span>
														<span class="opacity-80">• Cam: {rigging.collabCameraLabel || 'Webcam Utama'}</span>
													{/if}
												</div>
												<div class="flex items-center gap-1.5 opacity-80 flex-wrap">
													<span>{rigging.isCollabModeActive ? (rigging.collabSyncTracking ? 'Sync Tracking: On' : 'Idle Motion') : 'Buka Collab Studio untuk pasang'}</span>
													<span>• Opacity: {Math.round(layer.opacity * 100)}%</span>
												</div>
											{:else if layer.type === 'model-collab-2'}
												<div class="flex items-center gap-1.5 flex-wrap">
													<span class="text-indigo-400 font-semibold">{rigging.isCollab2Active ? rigging.collab2ModelName : 'Guest 2 (Nonaktif)'}</span>
													{#if rigging.isCollab2Active}
														<span class="opacity-80">• Pos: {rigging.collab2Position.toUpperCase()}</span>
														<span class="opacity-80">• Cam: {rigging.collab2CameraLabel || 'Webcam Utama'}</span>
													{/if}
												</div>
												<div class="flex items-center gap-1.5 opacity-80 flex-wrap">
													<span>{rigging.isCollab2Active ? (rigging.collab2SyncTracking ? 'Sync Tracking: On' : 'Idle Motion') : 'Buka Collab Studio untuk pasang'}</span>
													<span>• Opacity: {Math.round(layer.opacity * 100)}%</span>
												</div>
											{:else if layer.type === 'accessories'}
												<div class="flex items-center gap-1.5 flex-wrap">
													<span class="text-amber-500 font-semibold">{activeAccCount} Prop Terpasang</span>
													<span class="opacity-80">• Total {rigging.activeAccessories.length} Koleksi</span>
												</div>
												<div class="opacity-80 truncate">
													{activeAccCount > 0 ? rigging.activeAccessories.filter(a => a.visible).map(a => a.name).join(', ') : 'Klik + Upload / Pasang Prop'}
												</div>
											{:else if layer.type === 'shader-fx'}
												<div class="flex items-center gap-1.5 flex-wrap">
													<span class="text-emerald-400 font-semibold">Shader: {rigging.screenEffect.toUpperCase()}</span>
													<span class="opacity-80">• Opacity: {Math.round(layer.opacity * 100)}%</span>
												</div>
											{:else if layer.type === 'background'}
												<div class="flex items-center gap-1.5 flex-wrap">
													<span class="text-sky-400 font-semibold">BG: {rigging.backgroundStyle.toUpperCase()}</span>
													{#if rigging.backgroundStyle === 'solid'}
														<span class="opacity-80">• {rigging.backgroundColor}</span>
													{:else if rigging.backgroundStyle === 'chroma'}
														<span class="opacity-80">• #00FF00 Green Screen</span>
													{/if}
													<span class="opacity-80">• Opacity: {Math.round(layer.opacity * 100)}%</span>
												</div>
											{:else}
												<div>Transparansi: {Math.round(layer.opacity * 100)}%</div>
											{/if}
										</div>
									</div>
								</div>

								<!-- Right: Controls strictly pinned flush right -->
								<div class="flex items-center gap-1.5 ml-auto shrink-0">
									<!-- Opacity Slider with explicit event isolation -->
									<div class="flex items-center gap-1" title="Transparansi layer: {Math.round(layer.opacity * 100)}%">
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
											class="w-14 sm:w-16 h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
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

									<!-- Delete Layer Button (if applicable) -->
									{#if layer.type === 'accessories' || layer.type === 'model-collab' || layer.type === 'model-collab-2' || layer.type === 'shader-fx'}
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
									{/if}
								</div>
							</div>

							<!-- Nested Active Props List directly inside the unified Accessories Layer -->
							{#if layer.type === 'accessories' && rigging.activeAccessories.filter((a) => a.visible).length > 0}
								<div class="pl-6 pt-2 border-t border-zinc-800/60 space-y-1.5">
									{#each rigging.activeAccessories.filter((a) => a.visible) as acc (acc.id)}
										{@const isAccSelected = rigging.cursorToolMode === 'select-layer' && rigging.selectedLayerElementId === acc.id}
										<div
											class="p-2 rounded-xl border transition-all flex items-center justify-between gap-2 {
												isAccSelected
													? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50 shadow-xs'
													: isLightTheme
														? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
														: 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
											}"
										>
											<!-- Left: Thumbnail & Name -->
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												onclick={() => {
													playSfx('click');
													rigging.setCursorToolMode('select-layer');
													rigging.selectLayerElement(acc.id);
												}}
												class="flex items-center gap-2 truncate flex-1 min-w-0 cursor-pointer"
											>
												<div class="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-sm shadow-inner shrink-0 overflow-hidden">
													{#if acc.imageUrl}
														<img src={acc.imageUrl} alt={acc.name} class="w-full h-full object-contain" />
													{:else}
														{acc.emoji}
													{/if}
												</div>
												<div class="truncate min-w-0 flex-1">
													<div class="flex items-center gap-1.5 truncate">
														<span class="text-[11px] font-bold truncate {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
															{acc.name}
														</span>
														<!-- Attachment Selector Dropdown -->
														<select
															value={acc.attachTo || 'head'}
															onchange={(e) => {
																e.stopPropagation();
																const sel = e.target as HTMLSelectElement;
																rigging.setAccessoryAttachTo(acc.id, sel.value as any);
															}}
															onclick={(e) => e.stopPropagation()}
															class="text-[9px] px-1 py-0.2 rounded font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 cursor-pointer"
														>
															<option value="head">Di Kepala</option>
															<option value="body">Di Badan</option>
															<option value="screen">Di Layar</option>
														</select>
													</div>
													<div class="text-[9px] text-zinc-400 font-mono">
														Skala: {acc.scale}x • Opacity: {Math.round((acc.opacity || 1) * 100)}%
													</div>
												</div>
											</div>

											<!-- Right: Opacity Slider, Eye, Delete Button strictly pinned flush right -->
											<div class="flex items-center gap-1.5 ml-auto shrink-0">
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
													class="w-12 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
													title="Transparansi aksesoris"
												/>

												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
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
													onclick={(e) => {
														e.stopPropagation();
														playSfx('click');
														rigging.removeAccessory(acc.id);
													}}
													title="Copot Aksesoris Ini"
													class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors cursor-pointer"
												>
													<Trash2 class="w-3 h-3" />
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
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
