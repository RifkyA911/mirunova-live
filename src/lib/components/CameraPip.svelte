<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { i18n } from '#lib/i18n/index.svelte';
	import { Camera, CameraOff, Eye, EyeOff, Minimize2, Maximize2 } from 'lucide-svelte';

	let videoElement = $state<HTMLVideoElement>();
	let canvasElement = $state<HTMLCanvasElement>();
	let isMinimized = $state<boolean>(false);

	$effect(() => {
		// When camera active state changes, sync preview element with tracker
		if (rigging.isCameraActive && videoElement) {
			tracker.setPreviewElements(videoElement, canvasElement);
		}
	});

	async function toggleCamera() {
		if (rigging.isCameraActive) {
			tracker.stopCamera();
		} else {
			try {
				await tracker.startCamera(videoElement, canvasElement);
			} catch (err) {
				alert((err as Error).message);
			}
		}
	}
</script>

{#if rigging.showCameraPip}
	<div
		class="fixed top-4 left-4 z-30 flex flex-col bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl transition-all duration-200 select-none {
			isMinimized ? 'w-48' : 'w-64'
		}"
	>
		<!-- PIP Header -->
		<div class="px-3 py-2 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between text-xs">
			<div class="flex items-center gap-2">
				<!-- Status dot -->
				<span
					class="w-2 h-2 rounded-full {
						!rigging.isCameraActive
							? 'bg-zinc-600'
							: rigging.isFaceDetected
							? 'bg-emerald-500 animate-pulse'
							: 'bg-amber-500 animate-ping'
					}"
					title={rigging.isFaceDetected ? i18n.t('face_detected') : i18n.t('searching_face')}
				></span>
				<span class="font-medium text-zinc-300 text-[11px]">
					{rigging.isCameraActive
						? rigging.isFaceDetected
							? i18n.t('tracking_active')
							: i18n.t('searching_face')
						: i18n.t('camera_off')}
				</span>
			</div>

			<div class="flex items-center gap-1">
				<!-- Mesh Wireframe toggle -->
				{#if rigging.isCameraActive && !isMinimized}
					<button
						onclick={() => (rigging.showLandmarksMesh = !rigging.showLandmarksMesh)}
						class="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
						title={i18n.t('mesh_toggle')}
					>
						{#if rigging.showLandmarksMesh}
							<Eye class="w-3.5 h-3.5 text-cyan-400" />
						{:else}
							<EyeOff class="w-3.5 h-3.5 text-zinc-500" />
						{/if}
					</button>
				{/if}

				<!-- Minimize toggle -->
				<button
					onclick={() => (isMinimized = !isMinimized)}
					class="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
					title={isMinimized ? i18n.t('maximize') : i18n.t('minimize')}
				>
					{#if isMinimized}
						<Maximize2 class="w-3.5 h-3.5" />
					{:else}
						<Minimize2 class="w-3.5 h-3.5" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Camera Stream & Landmarks Viewport -->
		{#if !isMinimized}
			<div class="relative w-full aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden">
				<video
					bind:this={videoElement}
					autoplay
					playsinline
					muted
					class="w-full h-full object-cover -scale-x-100"
				></video>

				<canvas
					bind:this={canvasElement}
					width="640"
					height="480"
					class="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none {rigging.isCameraActive ? 'block' : 'hidden'}"
				></canvas>

				{#if !rigging.isCameraActive}
					<div class="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-2 text-zinc-500 p-4 text-center z-10">
						<CameraOff class="w-6 h-6 stroke-1" />
						<p class="text-[11px] leading-tight">{i18n.t('cam_instructions')}</p>
						<button
							onclick={toggleCamera}
							class="mt-1 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs rounded-md shadow-sm transition-colors"
						>
							{i18n.t('enable_cam')}
						</button>
					</div>
				{/if}
			</div>

			<!-- Metrics Footer -->
			{#if rigging.isCameraActive}
				<div class="px-3 py-1.5 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
					<span>{i18n.t('fps')}: <strong class="text-cyan-400">{rigging.fps}</strong></span>
					<span>{i18n.t('latency')}: <strong class="text-zinc-300">{rigging.latencyMs}ms</strong></span>
				</div>
			{/if}
		{/if}
	</div>
{/if}
