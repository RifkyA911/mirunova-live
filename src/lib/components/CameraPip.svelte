<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { tracker } from '#lib/core/tracker';
	import { i18n } from '#lib/i18n/index.svelte';
	import {
		Camera,
		CameraOff,
		Eye,
		EyeOff,
		Minimize2,
		Maximize2,
		RefreshCw,
		Smile,
		User,
		Hand
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

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
	{#if isMinimized}
		<!-- Minimal View: Icon Kamera & Status Dot Hijau (Solid Opacity) -->
		<button
			type="button"
			onclick={() => {
				playSfx('click');
				isMinimized = false;
			}}
			class="fixed top-4 left-4 z-30 flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-2xl border shadow-2xl cursor-pointer transition-all duration-200 group active:scale-95 {
				isLightTheme
					? 'bg-white border-zinc-200 text-zinc-800 hover:shadow-cyan-500/20'
					: 'bg-zinc-950 border-zinc-800 text-zinc-100 hover:border-cyan-500/50 shadow-black/80'
			}"
			title="Buka Preview Tracking Kamera (Klik untuk Maximize)"
			aria-label="Maximize Tracking Camera"
		>
			<Camera class="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
			<span class="text-xs font-bold font-mono tracking-wide">CAM</span>
			<span
				class="w-2 h-2 rounded-full {
					!rigging.isCameraActive
						? 'bg-zinc-500'
						: rigging.isFaceDetected
							? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]'
							: 'bg-amber-400 animate-ping'
				}"
			></span>
		</button>
	{:else}
		<!-- Expanded View: Sleek Modern Streamer Telemetry & Camera Card -->
		<div
			class="fixed top-4 left-4 z-30 flex flex-col backdrop-blur-2xl border rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 select-none w-80 {
				isLightTheme
					? 'bg-white/98 border-zinc-200 text-zinc-900 shadow-xl'
					: 'bg-zinc-950/98 border-zinc-800/90 text-zinc-100 shadow-2xl'
			}"
		>
			<!-- PIP Header -->
			<div class="px-3.5 py-2.5 border-b flex items-center justify-between text-xs {
				isLightTheme ? 'bg-zinc-50/90 border-zinc-200 text-zinc-800' : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-300'
			}">
				<div class="flex items-center gap-2">
					<div class="p-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
						<Camera class="w-3.5 h-3.5" />
					</div>
					<div>
						<div class="flex items-center gap-1.5">
							<span class="font-bold text-[11px] tracking-wide {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
								TRACKING TELEMETRY
							</span>
							<span
								class="w-2 h-2 rounded-full {
									!rigging.isCameraActive
										? 'bg-zinc-600'
										: rigging.isFaceDetected
										? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_#34d399]'
										: 'bg-amber-500 animate-ping'
								}"
								title={rigging.isFaceDetected ? i18n.t('face_detected') : i18n.t('searching_face')}
							></span>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-1">
					<!-- Minimize button -->
					<button
						onclick={() => {
							playSfx('click');
							isMinimized = true;
						}}
						class="p-1 rounded-lg transition-colors cursor-pointer {
							isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
						}"
						title={i18n.t('minimize')}
						aria-label={i18n.t('minimize')}
					>
						<Minimize2 class="w-3.5 h-3.5" />
					</button>
				</div>
			</div>

			<!-- Camera View Mode Pill Selector -->
			<div class="px-2.5 py-1.5 border-b grid grid-cols-3 gap-1 {
				isLightTheme ? 'bg-zinc-100/60 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
			}">
				<button
					type="button"
					onclick={() => {
						playSfx('click');
						rigging.cameraViewMode = 'wireframe';
						rigging.persist();
					}}
					class="py-1 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer {
						rigging.cameraViewMode === 'wireframe'
							? 'bg-cyan-500/25 border border-cyan-500/60 text-cyan-300 shadow-sm'
							: isLightTheme ? 'text-zinc-600 hover:bg-zinc-200/70' : 'text-zinc-400 hover:bg-zinc-800'
					}"
				>
					<CameraOff class="w-3 h-3 text-cyan-400" />
					<span>3D Mesh</span>
				</button>

				<button
					type="button"
					onclick={() => {
						playSfx('click');
						rigging.cameraViewMode = 'rig';
						rigging.persist();
					}}
					class="py-1 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer {
						rigging.cameraViewMode === 'rig'
							? 'bg-emerald-500/25 border border-emerald-500/60 text-emerald-300 shadow-sm'
							: isLightTheme ? 'text-zinc-600 hover:bg-zinc-200/70' : 'text-zinc-400 hover:bg-zinc-800'
					}"
				>
					<Camera class="w-3 h-3 text-emerald-400" />
					<span>Webcam + Rig</span>
				</button>

				<button
					type="button"
					onclick={() => {
						playSfx('click');
						rigging.cameraViewMode = 'raw';
						rigging.persist();
					}}
					class="py-1 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer {
						rigging.cameraViewMode === 'raw'
							? 'bg-zinc-700/60 border border-zinc-600 text-zinc-100 shadow-sm'
							: isLightTheme ? 'text-zinc-600 hover:bg-zinc-200/70' : 'text-zinc-400 hover:bg-zinc-800'
					}"
				>
					<Eye class="w-3 h-3 text-zinc-400" />
					<span>Raw Cam</span>
				</button>
			</div>

			<!-- Camera Stream & Landmarks Viewport -->
			<div class="relative w-full aspect-video bg-[#18181b] flex items-center justify-center overflow-hidden">
				<video
					bind:this={videoElement}
					autoplay
					playsinline
					muted
					class="w-full h-full object-cover -scale-x-100 {rigging.cameraViewMode === 'wireframe' ? 'hidden' : 'block'}"
				></video>

				<canvas
					bind:this={canvasElement}
					width="640"
					height="480"
					class="absolute inset-0 w-full h-full -scale-x-100 {rigging.isCameraActive ? 'block' : 'hidden'}"
				></canvas>

				{#if !rigging.isCameraActive}
					<div class="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center gap-2 text-zinc-500 p-4 text-center z-10">
						<CameraOff class="w-6 h-6 stroke-1 text-zinc-400" />
						<p class="text-[11px] leading-tight">{i18n.t('cam_instructions')}</p>
						<button
							onclick={toggleCamera}
							class="mt-1 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
						>
							{i18n.t('enable_cam')}
						</button>
					</div>
				{/if}
			</div>

			<!-- Tracking Feature Quick Toggles Bar (Face, Body, Hand) -->
			<div class="px-2 py-1.5 border-t grid grid-cols-3 gap-1 text-[10px] {
				isLightTheme ? 'bg-zinc-100/80 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800/80'
			}">
				<button
					type="button"
					onclick={() => {
						playSfx('toggle');
						rigging.enableFaceTracking = !rigging.enableFaceTracking;
						rigging.persist();
						rigging.showToast(rigging.enableFaceTracking ? '✓ Deteksi Wajah Aktif' : 'Deteksi Wajah Dimatikan');
					}}
					class="flex items-center justify-center gap-1.5 py-1 px-1 rounded-lg border transition-all cursor-pointer {
						rigging.enableFaceTracking
							? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold shadow-sm'
							: isLightTheme ? 'bg-zinc-200/60 border-zinc-300 text-zinc-500' : 'bg-zinc-950/80 border-zinc-800 text-zinc-500'
					}"
					title="Toggle Deteksi Wajah MediaPipe"
				>
					<Smile class="w-3.5 h-3.5" />
					<span class="font-bold">Wajah</span>
				</button>

				<button
					type="button"
					onclick={() => {
						playSfx('toggle');
						rigging.enableBodyTracking = !rigging.enableBodyTracking;
						rigging.persist();
						rigging.showToast(rigging.enableBodyTracking ? '✓ Kinematika Tubuh Aktif' : 'Kinematika Tubuh Dimatikan');
					}}
					class="flex items-center justify-center gap-1.5 py-1 px-1 rounded-lg border transition-all cursor-pointer {
						rigging.enableBodyTracking
							? 'bg-purple-500/20 border-purple-500/50 text-purple-400 font-semibold shadow-sm'
							: isLightTheme ? 'bg-zinc-200/60 border-zinc-300 text-zinc-500' : 'bg-zinc-950/80 border-zinc-800 text-zinc-500'
					}"
					title="Toggle Deteksi Goyangan Badan"
				>
					<User class="w-3.5 h-3.5" />
					<span class="font-bold">Tubuh</span>
				</button>

				<button
					type="button"
					onclick={() => {
						playSfx('toggle');
						rigging.enableHandTracking = !rigging.enableHandTracking;
						rigging.persist();
						rigging.showToast(rigging.enableHandTracking ? '✓ Deteksi Tangan Aktif' : 'Deteksi Tangan Dimatikan');
					}}
					class="flex items-center justify-center gap-1.5 py-1 px-1 rounded-lg border transition-all cursor-pointer {
						rigging.enableHandTracking
							? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-semibold shadow-sm'
							: isLightTheme ? 'bg-zinc-200/60 border-zinc-300 text-zinc-500' : 'bg-zinc-950/80 border-zinc-800 text-zinc-500'
					}"
					title="Toggle Deteksi Tangan MediaPipe"
				>
					<Hand class="w-3.5 h-3.5" />
					<span class="font-bold">Tangan</span>
				</button>
			</div>

			<!-- Quick Camera Selector Bar -->
			<div class="px-2.5 py-1.5 border-t flex items-center gap-1.5 text-[11px] {
				isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/95 border-zinc-800/80'
			}">
				<Camera class="w-3.5 h-3.5 text-cyan-500 shrink-0" />
				<select
					bind:value={rigging.cameraDeviceId}
					onchange={async (e) => {
						const target = e.target as HTMLSelectElement;
						await tracker.switchCamera(target.value);
					}}
					class="w-full border rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-500 truncate {
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
					class="p-1 rounded-lg transition-colors shrink-0 {
						isLightTheme ? 'hover:bg-zinc-200 text-zinc-500 hover:text-cyan-600' : 'hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300'
					}"
					title={i18n.t('refresh_devices')}
				>
					<RefreshCw class="w-3.5 h-3.5" />
				</button>
			</div>

			<!-- Metrics Footer -->
			{#if rigging.isCameraActive}
				<div class="px-3 py-1.5 border-t flex items-center justify-between text-[11px] font-mono {
					isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-600' : 'bg-zinc-950 border-zinc-800/80 text-zinc-400'
				}">
					<span class="flex items-center gap-1.5">
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
						{i18n.t('fps')}: <strong class="text-cyan-600 dark:text-cyan-400 font-bold">{rigging.fps || 60}</strong>
					</span>
					<span>{i18n.t('latency')}: <strong class="{isLightTheme ? 'text-zinc-800' : 'text-zinc-300'} font-bold">{rigging.latencyMs || 12}ms</strong></span>
				</div>
			{/if}
		</div>
	{/if}
{/if}
