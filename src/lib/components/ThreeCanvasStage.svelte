<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { threeStage, type CatVariant } from '#lib/core/threeStage';

	let containerEl = $state<HTMLDivElement>();
	let animFrameId: number | null = null;

	onMount(() => {
		if (!containerEl) return;
		threeStage.init(containerEl);
		loadActive3DModel();

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

	$effect(() => {
		const modelId = rigging.selected3DModelId;
		if (modelId) {
			loadActive3DModel();
		}
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

	function loadActive3DModel() {
		rigging.isLoadingModel = true;
		const id = rigging.selected3DModelId;

		if (id === 'mochi-cat') {
			threeStage.loadProceduralCat('mochi');
			rigging.isLoadingModel = false;
		} else if (id === 'kuro-cat') {
			threeStage.loadProceduralCat('kuro');
			rigging.isLoadingModel = false;
		} else if (id === 'tora-cat') {
			threeStage.loadProceduralCat('tora');
			rigging.isLoadingModel = false;
		} else if (rigging.customGlbUrl) {
			threeStage.loadGLTF(rigging.customGlbUrl)
				.catch((err) => console.error('Failed to load custom GLB:', err))
				.finally(() => (rigging.isLoadingModel = false));
		} else {
			threeStage.loadProceduralCat('mochi');
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
	onwheel={handleWheel}
	style="opacity: {hostLayerOpacity}; display: {isHostLayerVisible && hostLayerOpacity > 0 ? 'block' : 'none'}; pointer-events: {isHostLayerLocked ? 'none' : 'auto'};"
	class="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing z-0"
></div>
