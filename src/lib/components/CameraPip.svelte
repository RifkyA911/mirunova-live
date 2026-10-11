<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { i18n } from '#lib/i18n/index.svelte';
	import { Camera, CameraOff, Eye, EyeOff, Minimize2, Maximize2, RefreshCw } from 'lucide-svelte';

	let videoElement = $state<HTMLVideoElement>();
	let canvasElement = $state<HTMLCanvasElement>();
	let isMinimized = $state<boolean>(false);
	let availableCameras = $state<Array<{ deviceId: string; label: string }>>([]);

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	async function refreshCameras(requestPermission = false) {
		try {
			availableCameras = await tracker.getAvailableVideoDevices(requestPermission);
		} catch {
			availableCameras = [];
		}
	}

	onMount(() => {
		refreshCameras(false);
		const onDeviceChange = () => refreshCameras(false);
		if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
			navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
		}
		return () => {
			if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
				navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
			}
		};
	});

	$effect(() => {
		// When camera active state changes, sync preview element with tracker
		if (rigging.isCameraActive && videoElement) {
			tracker.setPreviewElements(videoElement, canvasElement);
			refreshCameras(false);
		}
	});

	async function toggleCamera() {
		if (rigging.isCameraActive) {
			tracker.stopCamera();
		} else {
			try {
				await tracker.startCamera(videoElement, canvasElement);
				refreshCameras(false);
			} catch (err) {
				alert((err as Error).message);
			}
		}
	}
</script>

{#if rigging.showCameraPip}
	<div
		class="fixed top-4 left-4 z-30 flex flex-col backdrop-blur-md border rounded-xl overflow-hidden shadow-2xl transition-all duration-200 select-none {
			isMinimized ? 'w-48' : 'w-64'
		} {
			isLightTheme
				? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xl'
				: 'bg-zinc-950/85 border-zinc-800/80 text-zinc-100 shadow-2xl'
		}"
	>
		<!-- PIP Header -->
		<div class="px-3 py-2 border-b flex items-center justify-between text-xs {
			isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-800' : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
		}">
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
				<span class="font-medium text-[11px] {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
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
						class="p-1 rounded transition-colors {
							isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
						}"
						title={i18n.t('mesh_toggle')}
					>
						{#if rigging.showLandmarksMesh}
							<Eye class="w-3.5 h-3.5 text-cyan-500" />
						{:else}
							<EyeOff class="w-3.5 h-3.5 text-zinc-400" />
						{/if}
					</button>
				{/if}

				<!-- Minimize toggle -->
				<button
					onclick={() => (isMinimized = !isMinimized)}
					class="p-1 rounded transition-colors {
						isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
					}"
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
							class="mt-1 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer"
						>
							{i18n.t('enable_cam')}
						</button>
					</div>
				{/if}
			</div>

			<!-- Quick Camera Selector Bar -->
			<div class="px-2 py-1.5 border-t flex items-center gap-1.5 text-[11px] {
				isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/95 border-zinc-800/80'
			}">
				<Camera class="w-3.5 h-3.5 text-cyan-500 shrink-0" />
				<select
					bind:value={rigging.cameraDeviceId}
					onchange={async (e) => {
						const target = e.target as HTMLSelectElement;
						await tracker.switchCamera(target.value);
					}}
					class="w-full border rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-cyan-500 truncate {
						isLightTheme ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
					}"
					aria-label={i18n.t('camera_device')}
				>
					<option value="">Default Webcam</option>
					{#each availableCameras as cam}
						<option value={cam.deviceId}>{cam.label}</option>
					{/each}
				</select>
				<button
					onclick={() => refreshCameras(true)}
					class="p-1 rounded transition-colors shrink-0 {
						isLightTheme ? 'hover:bg-zinc-200 text-zinc-500 hover:text-cyan-600' : 'hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300'
					}"
					title={i18n.t('refresh_devices')}
				>
					<RefreshCw class="w-3 h-3" />
				</button>
			</div>

			<!-- Metrics Footer -->
			{#if rigging.isCameraActive}
				<div class="px-3 py-1.5 border-t flex items-center justify-between text-[11px] font-mono {
					isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-600' : 'bg-zinc-950 border-zinc-800/80 text-zinc-400'
				}">
					<span>{i18n.t('fps')}: <strong class="text-cyan-600 dark:text-cyan-400">{rigging.fps}</strong></span>
					<span>{i18n.t('latency')}: <strong class="{isLightTheme ? 'text-zinc-800' : 'text-zinc-300'}">{rigging.latencyMs}ms</strong></span>
				</div>
			{/if}
		{/if}
	</div>
{/if}
