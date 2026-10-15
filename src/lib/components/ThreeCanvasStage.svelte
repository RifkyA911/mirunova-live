<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { threeStage } from '#lib/core/threeStage';

	let containerEl = $state<HTMLDivElement>();
	let animFrameId: number | null = null;

	onMount(() => {
		if (!containerEl) return;
		threeStage.init(containerEl);

		// Pre-allocated parameter buffer to prevent GC pauses (Anti-slop rule)
		const activeParamsBuffer: Record<string, number> = {};

		let frameCount = 0;
		let lastSampleTime = performance.now();

		// Realtime render loop driving 3D model with vision tracking values
		const loop = () => {
			frameCount++;
			const now = performance.now();
			const elapsed = now - lastSampleTime;
			if (elapsed >= 500) {
				const calculated = Math.round((frameCount * 1000) / elapsed);
				rigging.fps = Math.max(1, Math.min(240, calculated));
				rigging.latencyMs = Number((1000 / rigging.fps).toFixed(1));
				frameCount = 0;
				lastSampleTime = now;
			}

			for (let i = 0; i < rigging.parameters.length; i++) {
				const id = rigging.parameters[i].id;
				activeParamsBuffer[id] = rigging.getActiveValue(id);
			}
			threeStage.updateParameters(activeParamsBuffer);
			animFrameId = requestAnimationFrame(loop);
		};
		loop();
	});

	let lastLoaded3DModelId = '';
	$effect(() => {
		const modelId = rigging.selected3DModelId;
		if (modelId && modelId !== lastLoaded3DModelId) {
			lastLoaded3DModelId = modelId;
			loadActive3DModel();
		}
	});

	// Sync framingMode with 3D camera
	$effect(() => {
		const mode = rigging.framingMode;
		if (mode) {
			threeStage.setFraming(mode);
		}
	});

	// Sync activeExpression with 3D blendshapes
	$effect(() => {
		const exp = rigging.activeExpression;
		threeStage.setExpression(exp);
	});

	// Sync stageEnvironment with 3D scene (grid, room, field, void)
	$effect(() => {
		const env = rigging.stageEnvironment;
		threeStage.setStageEnvironment(env);
	});

	let lastScreenshotSignal = 0;
	$effect(() => {
		const signal = rigging.screenshotSignal;
		if (signal > 0 && signal !== lastScreenshotSignal) {
			lastScreenshotSignal = signal;
			takeScreenshot();
		}
	});

	function takeScreenshot() {
		try {
			const dataUrl = threeStage.captureScreenshot();
			if (dataUrl) {
				const link = document.createElement('a');
				const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
				link.download = `mirunova-3d-${rigging.selected3DModelId}-${dateStr}.png`;
				link.href = dataUrl;
				link.click();
				rigging.showToast(`Screenshot 3D tersimpan: ${link.download}`);
			} else {
				rigging.showToast('Gagal mengambil screenshot 3D');
			}
		} catch (e) {
			console.error('Screenshot error:', e);
			rigging.showToast('Gagal mengambil screenshot 3D');
		}
	}

	async function loadActive3DModel() {
		rigging.isLoadingModel = true;
		const id = rigging.selected3DModelId;

		try {
			if (id === 'neuro-sama') {
				await threeStage.loadNeuroSama();
				rigging.availableExpressions = [
					{ id: 'stars', name: 'stars', label: '⭐ Mata Bintang (Starry Eyes)' },
					{ id: 'vrc.ee', name: 'vrc.ee', label: '😊 Senyum (Smile)' },
					{ id: 'blush', name: 'blush', label: '😳 Pipi Merona (Blush)' },
					{ id: 'vrc.blink', name: 'vrc.blink', label: '😉 Kedipan (Wink)' },
					{ id: 'vrc.oh', name: 'vrc.oh', label: '😮 Terkejut (Surprised O)' },
					{ id: 'vrc.aa', name: 'vrc.aa', label: '🗣️ Mulut Terbuka (Mouth Open)' }
				];
				rigging.showToast("✓ Model 3D Neuro-sama (Vedal's Version) dimuat!");
			} else if (id === 'manhattan-cafe') {
				await threeStage.loadManhattanCafe();
				rigging.availableExpressions = [
					{ id: 'stars', name: 'stars', label: '✨ Tatapan Misterius (Mysterious)' },
					{ id: 'vrc.ee', name: 'vrc.ee', label: '😊 Senyum Lembut (Gentle Smile)' },
					{ id: 'blush', name: 'blush', label: '😳 Malu Merona (Blush)' },
					{ id: 'vrc.blink', name: 'vrc.blink', label: '😉 Kedipan Manis (Wink)' },
					{ id: 'vrc.oh', name: 'vrc.oh', label: '😮 Terkesiap (Soft Gasp)' },
					{ id: 'vrc.aa', name: 'vrc.aa', label: '🗣️ Bicara Kalem (Speaking)' }
				];
				rigging.showToast('✓ Model 3D Manhattan Cafe (Uma Musume) dimuat!');
			} else if (id === 'mochi-cat') {
				threeStage.loadProceduralCat('mochi');
			} else if (id === 'kuro-cat') {
				threeStage.loadProceduralCat('kuro');
			} else if (id === 'tora-cat') {
				threeStage.loadProceduralCat('tora');
			} else if (rigging.customGlbUrl) {
				await threeStage.loadGLTF(rigging.customGlbUrl);
			} else {
				threeStage.loadProceduralCat('mochi');
			}
		} catch (err) {
			console.error('Failed to load 3D model:', err);
			rigging.showToast('Gagal memuat model 3D');
		} finally {
			rigging.isLoadingModel = false;
		}
	}

	let lastZoomSignalTime = 0;
	$effect(() => {
		const sig = rigging.zoomSignal;
		if (sig && sig.timestamp !== lastZoomSignalTime) {
			lastZoomSignalTime = sig.timestamp;
			if (sig.type === 'in') threeStage.zoomBy(1.15);
			else if (sig.type === 'out') threeStage.zoomBy(0.87);
			else if (sig.type === 'reset') threeStage.resetZoom();
		}
	});

	const hostLayer = $derived(rigging.stageLayers.find((l) => l.type === 'model-host'));
	const isHostLayerVisible = $derived(hostLayer ? hostLayer.visible : true);
	const hostLayerOpacity = $derived(hostLayer ? hostLayer.opacity : 1.0);
	const isHostLayerLocked = $derived(hostLayer ? hostLayer.locked : false);

	$effect(() => {
		threeStage.toggleAutoSpin(rigging.is3DAutoSpin);
	});

	let isDragging = $state(false);
	let dragButton = 0;
	let prevPointerX = 0;
	let prevPointerY = 0;

	function handlePointerDown(e: PointerEvent) {
		if (rigging.isGuiLocked || isHostLayerLocked) return;
		if (e.button !== 0 && e.button !== 2) return;
		isDragging = true;
		dragButton = e.button;
		prevPointerX = e.clientX;
		prevPointerY = e.clientY;
		(e.currentTarget as HTMLElement)?.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const deltaX = e.clientX - prevPointerX;
		const deltaY = e.clientY - prevPointerY;
		prevPointerX = e.clientX;
		prevPointerY = e.clientY;

		if (rigging.is3DAutoSpin) {
			rigging.is3DAutoSpin = false;
		}

		if (rigging.cursorToolMode === 'pan' || dragButton === 2 || e.shiftKey) {
			// Pan / Translate 3D model position
			threeStage.moveModel(deltaX * 0.0035, -deltaY * 0.0035);
		} else {
			// Rotate body & tilt pitch
			const sensitivity = 0.005;
			threeStage.rotateOrbit(deltaX * sensitivity, -deltaY * sensitivity, true);
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (isDragging) {
			isDragging = false;
			try {
				(e.currentTarget as HTMLElement)?.releasePointerCapture(e.pointerId);
			} catch (_) {}
		}
	}

	function handleWheel(e: WheelEvent) {
		if (rigging.isGuiLocked || isHostLayerLocked) return;
		e.preventDefault();
		const factor = e.deltaY < 0 ? 1.08 : 0.92;
		threeStage.zoomBy(factor);
	}

	onDestroy(() => {
		if (animFrameId !== null) {
			cancelAnimationFrame(animFrameId);
			animFrameId = null;
		}
		threeStage.destroy();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	role="application"
	aria-label="3D Model Stage"
	tabindex="0"
	bind:this={containerEl}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onwheel={handleWheel}
	oncontextmenu={(e) => e.preventDefault()}
	style="opacity: {hostLayerOpacity}; display: {isHostLayerVisible && hostLayerOpacity > 0 ? 'block' : 'none'}; pointer-events: {isHostLayerLocked ? 'none' : 'auto'};"
	class="absolute inset-0 w-full h-full overflow-hidden select-none {isDragging ? 'cursor-grabbing' : 'cursor-grab'} z-0"
></div>

<!-- Floating On-Screen 3D Transform & Navigation HUD (Visible in 3D Mode) -->
{#if !rigging.isGuiLocked && isHostLayerVisible && !isHostLayerLocked}
	<div class="fixed top-20 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none select-none">
		<div class="pointer-events-auto backdrop-blur-2xl bg-zinc-950/80 border border-zinc-700/80 rounded-2xl p-2.5 shadow-2xl space-y-2 text-zinc-200">
			<!-- Header -->
			<div class="flex items-center justify-between gap-3 pb-1.5 border-b border-zinc-800 text-[11px] font-bold">
				<span class="text-cyan-400 font-mono tracking-wide">POSISI 3D</span>
				<span class="text-[9px] text-zinc-500 font-mono">Drag / Pan</span>
			</div>

			<!-- D-Pad Translation Buttons -->
			<div class="grid grid-cols-3 gap-1 w-28">
				<div></div>
				<button
					type="button"
					onclick={() => {
						threeStage.moveModel(0, 0.15);
						rigging.showToast('↑ Geser Atas (+Y)');
					}}
					class="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title="Geser Karakter Atas"
					aria-label="Geser Karakter Atas"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
				</button>
				<div></div>

				<button
					type="button"
					onclick={() => {
						threeStage.moveModel(-0.15, 0);
						rigging.showToast('← Geser Kiri (-X)');
					}}
					class="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title="Geser Karakter Kiri"
					aria-label="Geser Karakter Kiri"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
				</button>

				<button
					type="button"
					onclick={() => {
						threeStage.resetModelPosition();
						rigging.showToast('🎯 Reset Posisi Tengah');
					}}
					class="p-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title="Reset Posisi Tengah (0, 0)"
					aria-label="Reset Posisi Tengah"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
				</button>

				<button
					type="button"
					onclick={() => {
						threeStage.moveModel(0.15, 0);
						rigging.showToast('→ Geser Kanan (+X)');
					}}
					class="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title="Geser Karakter Kanan"
					aria-label="Geser Karakter Kanan"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
				</button>

				<div></div>
				<button
					type="button"
					onclick={() => {
						threeStage.moveModel(0, -0.15);
						rigging.showToast('↓ Geser Bawah (-Y)');
					}}
					class="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title="Geser Karakter Bawah"
					aria-label="Geser Karakter Bawah"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
				</button>
				<div></div>
			</div>

			<!-- Body Rotation Quick Actions -->
			<div class="pt-1.5 border-t border-zinc-800 flex items-center justify-between gap-1">
				<button
					type="button"
					onclick={() => {
						threeStage.rotateModelBodyDegrees(-45);
						rigging.showToast('Putar Karakter -45°');
					}}
					class="flex-1 py-1 px-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
					title="Putar Kiri -45°"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
					<span>-45°</span>
				</button>
				<button
					type="button"
					onclick={() => {
						threeStage.resetOrbit();
						rigging.showToast('🎯 Hadap Depan (0°)');
					}}
					class="py-1 px-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono font-medium text-cyan-400 cursor-pointer transition-colors"
					title="Reset Hadap Depan"
				>
					0°
				</button>
				<button
					type="button"
					onclick={() => {
						threeStage.rotateModelBodyDegrees(45);
						rigging.showToast('Putar Karakter +45°');
					}}
					class="flex-1 py-1 px-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
					title="Putar Kanan +45°"
				>
					<span>+45°</span>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
				</button>
			</div>
		</div>
	</div>
{/if}
