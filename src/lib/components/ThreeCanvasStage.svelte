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
	let prevPointerX = 0;
	let prevPointerY = 0;

	function handlePointerDown(e: PointerEvent) {
		if (rigging.isGuiLocked || isHostLayerLocked) return;
		if (e.button !== 0) return;
		isDragging = true;
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

		const sensitivity = 0.005;
		threeStage.rotateOrbit(-deltaX * sensitivity, deltaY * sensitivity, true);
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
	style="opacity: {hostLayerOpacity}; display: {isHostLayerVisible && hostLayerOpacity > 0 ? 'block' : 'none'}; pointer-events: {isHostLayerLocked ? 'none' : 'auto'};"
	class="absolute inset-0 w-full h-full overflow-hidden select-none {isDragging ? 'cursor-grabbing' : 'cursor-grab'} z-0"
></div>
