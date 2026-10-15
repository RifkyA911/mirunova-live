<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import {
		Crosshair,
		Camera,
		Mic,
		MicOff,
		Sparkles,
		Download,
		Box,
		Users,
		Monitor,
		Pin,
		PinOff,
		X,
		ZoomIn,
		ZoomOut,
		RotateCcw,
		Maximize2,
		User,
		Smile,
		Layers
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';
	import { tracker } from '#lib/core/tracker';
	import { threeStage, type StageEnvironment3D } from '#lib/core/threeStage';
	import { voice, type VoiceFilterType } from '#lib/core/audio';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let isOpen = $state<boolean>(false);
	let isPinned = $state<boolean>(false);

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	const isVisible = $derived(isOpen || isPinned);

	const displayZoomPercent = $derived<number>(
		Math.round((rigging.zoomLevel || 1.0) * 100)
	);

	function toggleOpen() {
		playSfx('click');
		isOpen = !isOpen;
	}

	function togglePin() {
		playSfx('click');
		isPinned = !isPinned;
	}

	function closeMenu() {
		if (!isPinned) {
			isOpen = false;
		}
	}

	function handleCalibrate() {
		playSfx('calibrate');
		tracker.calibrate();
		rigging.showToast('🎯 Tracking dikalibrasi ke posisi tegak');
	}

	function cycleCameraMode() {
		playSfx('click');
		const modes: Array<'wireframe' | 'rig' | 'raw'> = ['rig', 'wireframe', 'raw'];
		const currentIdx = modes.indexOf(rigging.cameraViewMode);
		const nextMode = modes[(currentIdx + 1) % modes.length];
		rigging.cameraViewMode = nextMode;
		rigging.persist();
		rigging.showToast(`📹 Mode Kamera: ${nextMode === 'rig' ? 'Webcam + Titik Rig' : nextMode === 'wireframe' ? '3D Mesh' : 'Raw Cam'}`);
	}

	function cycleStageEnv() {
		playSfx('click');
		const envs: StageEnvironment3D[] = ['grid', 'room', 'field', 'sunset', 'studio', 'dojo', 'void'];
		const currentIdx = envs.indexOf(rigging.stageEnvironment);
		const nextEnv = envs[(currentIdx + 1) % envs.length];
		rigging.setStageEnvironment(nextEnv);
		threeStage.setStageEnvironment(nextEnv);
		rigging.showToast(`🪐 Panggung 3D: ${nextEnv.toUpperCase()}`);
	}

	function cycleVoiceFilter() {
		playSfx('click');
		const filters: Array<VoiceFilterType> = ['none', 'anime-girl', 'ikemen', 'robot', 'podcast-pro'];
		const currentIdx = filters.indexOf(rigging.voiceFilter);
		const nextFilter = filters[(currentIdx + 1) % filters.length];
		rigging.setVoiceFilter(nextFilter);
		voice.setFilter(nextFilter);
		rigging.showToast(`✨ Model Suara: ${nextFilter}`);
	}

	async function toggleMic() {
		playSfx('click');
		rigging.isMicActive = !rigging.isMicActive;
		if (rigging.isMicActive) {
			const ok = await voice.start(rigging.audioDeviceId, (vol) => {
				rigging.micVolumeLevel = vol;
			});
			if (ok) {
				voice.setGain(rigging.micGain);
				voice.setFilter(rigging.voiceFilter);
				rigging.showToast('🎙️ Mikrofon aktif');
			} else {
				rigging.isMicActive = false;
				rigging.showToast('Gagal mengakses mikrofon');
			}
		} else {
			voice.stop();
			rigging.micVolumeLevel = 0;
			rigging.showToast('Mikrofon dimatikan');
		}
		rigging.persist();
	}

	function captureStageScreenshot() {
		try {
			playSfx('success');
			const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
			if (canvas) {
				const dataUrl = canvas.toDataURL('image/png');
				const a = document.createElement('a');
				a.href = dataUrl;
				a.download = `mirunova-stage-${Date.now()}.png`;
				a.click();
				rigging.showToast('📸 Screenshot panggung berhasil diunduh!');
			} else {
				rigging.showToast('Gagal menemukan kanvas panggung');
			}
		} catch (e) {
			console.warn('Screenshot error:', e);
			rigging.showToast('Gagal mengambil tangkapan layar');
		}
	}
</script>

{#if !rigging.isObsMode && !rigging.isGuiLocked}
	<!-- Floating Apple iPhone AssistiveTouch Button (Pinned to screen right edge, 40% shown when idle, emerges on hover) -->
	<aside
		aria-label="AssistiveTouch Pusat Kontrol"
		class="fixed right-0 top-1/2 -translate-y-1/2 z-40 select-none flex items-center"
	>
		<!-- Apple AssistiveTouch Floating Button -->
		<button
			type="button"
			onclick={toggleOpen}
			aria-label="AssistiveTouch"
			title="AssistiveTouch (Pusat Kontrol Cepat)"
			class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden aspect-square flex items-center justify-center backdrop-blur-2xl border border-white/25 shadow-2xl transition-all duration-300 ease-out cursor-pointer active:scale-95 shrink-0 bg-black/65 {
				isVisible
					? 'translate-x-0 opacity-100 ring-4 ring-cyan-500/50 shadow-cyan-500/40 scale-105'
					: 'translate-x-[55%] opacity-40 hover:translate-x-0 hover:opacity-100 hover:scale-105 hover:shadow-cyan-500/30'
			}"
		>
			<!-- Apple AssistiveTouch Concentric Outer Ring -->
			<div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center transition-all duration-300 {
				isVisible ? 'scale-110 bg-cyan-400/20 border-cyan-400/60' : ''
			}">
				<!-- Apple AssistiveTouch Concentric Inner Solid Core -->
				<div class="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 {
					isVisible ? 'bg-cyan-300 shadow-[0_0_10px_#22d3ee]' : 'bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.85)]'
				}"></div>
			</div>
		</button>

		<!-- iOS AssistiveTouch Popover Menu -->
		{#if isVisible}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			{#if !isPinned}
				<div
					transition:fade={{ duration: 150 }}
					onclick={closeMenu}
					class="fixed inset-0 z-[-1]"
					aria-hidden="true"
				></div>
			{/if}

			<div
				transition:fly={{ x: 24, duration: 220, easing: cubicOut }}
				class="fixed sm:absolute right-3 sm:right-16 top-1/2 -translate-y-1/2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm max-h-[85dvh] overflow-y-auto p-3.5 sm:p-4 rounded-3xl backdrop-blur-3xl border shadow-2xl transition-colors duration-150 {
					isLightTheme
						? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xl'
						: 'bg-zinc-950/92 border-white/15 text-zinc-100 shadow-2xl'
				}"
			>
				<!-- Apple Assistive Header -->
				<div class="flex items-center justify-between border-b pb-2.5 mb-3 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
					<div class="flex items-center gap-2">
						<div class="w-5 h-5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
							<div class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>
						</div>
						<div>
							<div class="font-bold text-xs tracking-wide uppercase {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
								ASSISTIVE TOUCH
							</div>
							<div class="text-[9px] text-zinc-400 font-mono">Pusat Kontrol Cepat Streamer</div>
						</div>
					</div>

					<div class="flex items-center gap-1">
						<button
							type="button"
							onclick={togglePin}
							title={isPinned ? i18n.t('assist_unpin_tooltip') : i18n.t('assist_pin_tooltip')}
							class="p-1.5 rounded-xl transition-colors cursor-pointer {
								isLightTheme ? 'text-zinc-500 hover:text-cyan-600 hover:bg-zinc-100' : 'text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800'
							}"
						>
							{#if isPinned}
								<PinOff class="w-3.5 h-3.5 text-cyan-400" />
							{:else}
								<Pin class="w-3.5 h-3.5" />
							{/if}
						</button>
						<button
							type="button"
							onclick={() => {
								isOpen = false;
								isPinned = false;
							}}
							title="Tutup"
							class="p-1.5 rounded-xl transition-colors cursor-pointer {
								isLightTheme ? 'text-zinc-500 hover:text-rose-600 hover:bg-zinc-100' : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800'
							}"
						>
							<X class="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				<!-- 8-Tile Apple AssistiveTouch Action Grid (4 columns x 2 rows) -->
				<div class="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3">
					<!-- Tile 1: Kalibrasi Tracking -->
					<button
						type="button"
						onclick={handleCalibrate}
						class="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 {
							isLightTheme
								? 'bg-zinc-50 hover:bg-cyan-50 border-zinc-200 hover:border-cyan-400'
								: 'bg-zinc-900/80 hover:bg-cyan-500/20 border-zinc-800 hover:border-cyan-500/50'
						}"
					>
						<div class="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:scale-110 transition-transform mb-1">
							<Crosshair class="w-4 h-4" />
						</div>
						<span class="text-[10px] font-bold leading-tight">Kalibrasi</span>
						<span class="text-[8px] text-zinc-400 font-mono">Tengah</span>
					</button>

					<!-- Tile 2: Mode Kamera View -->
					<button
						type="button"
						onclick={cycleCameraMode}
						class="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 {
							isLightTheme
								? 'bg-zinc-50 hover:bg-emerald-50 border-zinc-200 hover:border-emerald-400'
								: 'bg-zinc-900/80 hover:bg-emerald-500/20 border-zinc-800 hover:border-emerald-500/50'
						}"
					>
						<div class="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform mb-1">
							<Camera class="w-4 h-4" />
						</div>
						<span class="text-[10px] font-bold leading-tight">Kamera</span>
						<span class="text-[8px] text-emerald-400 font-mono capitalize truncate max-w-full">
							{rigging.cameraViewMode === 'rig' ? 'Titik Rig' : rigging.cameraViewMode === 'wireframe' ? '3D Mesh' : 'Raw'}
						</span>
					</button>

					<!-- Tile 3: Mic Audio Toggle -->
					<button
						type="button"
						onclick={toggleMic}
						class="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 {
							rigging.isMicActive
								? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
								: isLightTheme ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200' : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800'
						}"
					>
						<div class="p-2 rounded-xl {rigging.isMicActive ? 'bg-emerald-500/25 text-emerald-300' : 'bg-zinc-800 text-zinc-400'} group-hover:scale-110 transition-transform mb-1">
							{#if rigging.isMicActive}
								<Mic class="w-4 h-4 text-emerald-400" />
							{:else}
								<MicOff class="w-4 h-4" />
							{/if}
						</div>
						<span class="text-[10px] font-bold leading-tight">Mikrofon</span>
						<span class="text-[8px] font-mono {rigging.isMicActive ? 'text-emerald-400' : 'text-zinc-500'}">
							{rigging.isMicActive ? 'Aktif' : 'Muted'}
						</span>
					</button>

					<!-- Tile 4: Voice FX Presets -->
					<button
						type="button"
						onclick={cycleVoiceFilter}
						class="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 {
							rigging.voiceFilter !== 'none'
								? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
								: isLightTheme ? 'bg-zinc-50 hover:bg-pink-50 border-zinc-200' : 'bg-zinc-900/80 hover:bg-pink-500/20 border-zinc-800'
						}"
					>
						<div class="p-2 rounded-xl {rigging.voiceFilter !== 'none' ? 'bg-pink-500/25 text-pink-300' : 'bg-zinc-800 text-zinc-400'} group-hover:scale-110 transition-transform mb-1">
							<Sparkles class="w-4 h-4" />
						</div>
						<span class="text-[10px] font-bold leading-tight">Voice FX</span>
						<span class="text-[8px] font-mono truncate max-w-full {rigging.voiceFilter !== 'none' ? 'text-pink-300' : 'text-zinc-500'}">
							{rigging.voiceFilter === 'none' ? 'Normal' : rigging.voiceFilter}
						</span>
					</button>

					<!-- Tile 5: Screenshot Stage -->
					<button
						type="button"
						onclick={captureStageScreenshot}
						class="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 {
							isLightTheme
								? 'bg-zinc-50 hover:bg-amber-50 border-zinc-200 hover:border-amber-400'
								: 'bg-zinc-900/80 hover:bg-amber-500/20 border-zinc-800 hover:border-amber-500/50'
						}"
					>
						<div class="p-2 rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform mb-1">
							<Download class="w-4 h-4" />
						</div>
						<span class="text-[10px] font-bold leading-tight">Snapshot</span>
						<span class="text-[8px] text-zinc-400 font-mono">Simpan PNG</span>
					</button>

					<!-- Tile 6: Panggung 3D Virtual Environment -->
					<button
						type="button"
						onclick={cycleStageEnv}
						class="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 {
							isLightTheme
								? 'bg-zinc-50 hover:bg-indigo-50 border-zinc-200 hover:border-indigo-400'
								: 'bg-zinc-900/80 hover:bg-indigo-500/20 border-zinc-800 hover:border-indigo-500/50'
						}"
					>
						<div class="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition-transform mb-1">
							<Box class="w-4 h-4" />
						</div>
						<span class="text-[10px] font-bold leading-tight">Stage 3D</span>
						<span class="text-[8px] text-indigo-400 font-mono uppercase truncate max-w-full">
							{rigging.stageEnvironment}
						</span>
					</button>

					<!-- Tile 7: Layer Manager & Props -->
					<button
						type="button"
						onclick={() => {
							playSfx('click');
							rigging.toggleLayerManager();
							if (!isPinned) isOpen = false;
						}}
						class="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 {
							isLightTheme
								? 'bg-zinc-50 hover:bg-cyan-50 border-zinc-200 hover:border-cyan-400'
								: 'bg-zinc-900/80 hover:bg-cyan-500/20 border-zinc-800 hover:border-cyan-500/50'
						}"
					>
						<div class="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:scale-110 transition-transform mb-1">
							<Layers class="w-4 h-4" />
						</div>
						<span class="text-[10px] font-bold leading-tight">Layers</span>
						<span class="text-[8px] text-zinc-400 font-mono">Props [P]</span>
					</button>

					<!-- Tile 8: Model Catalog -->
					<button
						type="button"
						onclick={() => {
							playSfx('click');
							rigging.isModelModalOpen = true;
							if (!isPinned) isOpen = false;
						}}
						class="flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 {
							isLightTheme
								? 'bg-zinc-50 hover:bg-purple-50 border-zinc-200 hover:border-purple-400'
								: 'bg-zinc-900/80 hover:bg-purple-500/20 border-zinc-800 hover:border-purple-500/50'
						}"
					>
						<div class="p-2 rounded-xl bg-purple-500/15 text-purple-400 group-hover:scale-110 transition-transform mb-1">
							<Users class="w-4 h-4" />
						</div>
						<span class="text-[10px] font-bold leading-tight">Avatar</span>
						<span class="text-[8px] text-purple-400 font-mono truncate max-w-full">
							{rigging.avatarEngine === '3d' ? '3D' : 'Live2D'}
						</span>
					</button>
				</div>

				<!-- Continuous Zoom & Framing Presets -->
				<div class="space-y-2 p-2.5 rounded-2xl border mb-3 {
					isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800/80'
				}">
					<div class="flex items-center justify-between text-[11px] font-medium">
						<span class="flex items-center gap-1.5 text-zinc-400">
							<ZoomIn class="w-3.5 h-3.5 text-cyan-400" />
							<span>Zoom Skala Panggung</span>
						</span>
						<span class="font-mono text-xs font-bold text-cyan-400">{displayZoomPercent}%</span>
					</div>

					<input
						type="range"
						min="0.3"
						max="2.5"
						step="0.05"
						value={rigging.zoomLevel || 1.0}
						oninput={(e) => rigging.setZoom(parseFloat((e.target as HTMLInputElement).value))}
						class="w-full h-1.5 bg-zinc-700/60 rounded-lg appearance-none cursor-pointer accent-cyan-400"
					/>

					<div class="flex items-center justify-between gap-1 pt-1 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'}">
						<button
							type="button"
							onclick={() => rigging.zoomOut()}
							class="flex-1 py-1 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer {
								isLightTheme ? 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200'
							}"
						>
							<ZoomOut class="w-3 h-3" />
						</button>
						<button
							type="button"
							onclick={() => rigging.resetZoom()}
							class="px-3 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer {
								isLightTheme ? 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200'
							}"
						>
							100%
						</button>
						<button
							type="button"
							onclick={() => rigging.zoomIn()}
							class="flex-1 py-1 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer {
								isLightTheme ? 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200'
							}"
						>
							<ZoomIn class="w-3 h-3 text-cyan-400" />
						</button>
					</div>

					<!-- Framing Quick Buttons -->
					<div class="grid grid-cols-3 gap-1 pt-1">
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.setFramingMode('full');
							}}
							class="py-1 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer {
								rigging.framingMode === 'full'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-300 font-bold'
									: isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
							}"
						>
							<Maximize2 class="w-3 h-3" />
							<span>Full</span>
						</button>
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.setFramingMode('half');
							}}
							class="py-1 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer {
								rigging.framingMode === 'half'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-300 font-bold'
									: isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
							}"
						>
							<User class="w-3 h-3" />
							<span>Half</span>
						</button>
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								rigging.setFramingMode('closeup');
							}}
							class="py-1 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer {
								rigging.framingMode === 'closeup'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-300 font-bold'
									: isLightTheme ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
							}"
						>
							<Smile class="w-3 h-3" />
							<span>Close</span>
						</button>
					</div>
				</div>

				<!-- Live Telemetry Bar -->
				<div class="flex items-center justify-between px-2 py-1.5 rounded-xl border text-[10px] font-mono {
					isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400'
				}">
					<div class="flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full {
							rigging.isFaceDetected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400 animate-pulse'
						}"></span>
						<span>{rigging.isFaceDetected ? 'Wajah Terdeteksi' : 'Mencari Wajah'}</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-cyan-400">{rigging.fps || 60} FPS</span>
						<span>{rigging.latencyMs || 10}ms</span>
					</div>
				</div>
			</div>
		{/if}
	</aside>
{/if}
