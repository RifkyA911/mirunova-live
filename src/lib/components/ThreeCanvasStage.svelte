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

		// Realtime render loop driving 3D model with vision tracking values
		const loop = () => {
			const activeParams: Record<string, number> = {};
			for (const p of rigging.parameters) {
				activeParams[p.id] = rigging.getActiveValue(p.id);
			}
			threeStage.updateParameters(activeParams);
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
	class="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing z-0"
></div>
