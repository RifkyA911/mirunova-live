<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { threeStage, type CatVariant, type FramingMode3D, type FullBodyPose3D } from '#lib/core/threeStage';
	import { playSfx } from '#lib/core/sfx';
	import { Camera, Sparkles, User, ChevronUp, ChevronDown } from 'lucide-svelte';

	let containerEl = $state<HTMLDivElement>();
	let animFrameId: number | null = null;
	let isHudCollapsed = $state<boolean>(false);
	let hudTab = $state<'framing' | 'expression' | 'pose'>('framing');

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

	function handleWheel(e: WheelEvent) {
		if (rigging.isGuiLocked || isHostLayerLocked) return;
		e.preventDefault();
		const factor = e.deltaY < 0 ? 1.08 : 0.92;
		threeStage.zoomBy(factor);
	}

	function handleSelectFraming(mode: FramingMode3D) {
		playSfx('click');
		rigging.framingMode = mode;
		threeStage.setFraming(mode);
		rigging.showToast(`Kamera 3D: ${mode === 'full' ? '🧍 Full Body' : mode === 'half' ? '🥋 Half Body' : '👤 Face Close-up'}`);
	}

	function handleSelectExpression(expId: string, label: string) {
		playSfx('expression');
		rigging.activeExpression = expId;
		threeStage.setExpression(expId);
		rigging.showToast(expId ? `Ekspresi: ${label}` : 'Ekspresi Netral');
	}

	function handleSelectPose(pose: FullBodyPose3D, label: string) {
		playSfx('click');
		threeStage.setFullBodyPose(pose);
		rigging.showToast(`Pose 3D: ${label}`);
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

<!-- 3D Studio Quick-Action HUD Toolbar (Tombol Bergambar: Full Body, Framing, Face Expressions & Poses) -->
{#if !rigging.isObsMode && !rigging.isGuiLocked && isHostLayerVisible && hostLayerOpacity > 0}
	<div
		class="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 select-none max-w-[96vw] transition-all"
	>
		{#if !isHudCollapsed}
			<div
				class="flex flex-col bg-zinc-950/92 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl shadow-2xl p-2.5 space-y-2 max-w-full text-zinc-200"
			>
				<!-- Tab Navigation -->
				<div class="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5 px-1">
					<div class="flex items-center gap-1">
						<button
							onclick={() => { playSfx('click'); hudTab = 'framing'; }}
							class="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer {hudTab === 'framing' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
						>
							<Camera class="w-3.5 h-3.5 text-cyan-400" />
							<span>Framing Kamera</span>
						</button>
						<button
							onclick={() => { playSfx('click'); hudTab = 'expression'; }}
							class="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer {hudTab === 'expression' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
						>
							<Sparkles class="w-3.5 h-3.5 text-pink-400" />
							<span>Ekspresi Wajah</span>
						</button>
						<button
							onclick={() => { playSfx('click'); hudTab = 'pose'; }}
							class="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer {hudTab === 'pose' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}"
						>
							<User class="w-3.5 h-3.5 text-purple-400" />
							<span>Full Body Pose</span>
						</button>
					</div>

					<!-- Minimize Button -->
					<button
						onclick={() => { playSfx('click'); isHudCollapsed = true; }}
						class="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
						title="Sembunyikan Menu 3D"
						aria-label="Sembunyikan Menu 3D"
					>
						<ChevronDown class="w-4 h-4" />
					</button>
				</div>

				<!-- Tab 1: Framing Kamera (Tombol Bergambar) -->
				{#if hudTab === 'framing'}
					<div class="flex items-center gap-2 overflow-x-auto py-0.5 px-0.5">
						<button
							onclick={() => handleSelectFraming('full')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.framingMode === 'full'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-500/10'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
							}"
						>
							<span class="text-base">🧍</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Full Body</span>
								<span class="text-[9px] text-zinc-400 mt-0.5">Kepala - Kaki</span>
							</div>
						</button>

						<button
							onclick={() => handleSelectFraming('half')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.framingMode === 'half'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-500/10'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
							}"
						>
							<span class="text-base">🥋</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Half Body</span>
								<span class="text-[9px] text-zinc-400 mt-0.5">Pinggang ke Atas</span>
							</div>
						</button>

						<button
							onclick={() => handleSelectFraming('closeup')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.framingMode === 'closeup'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-500/10'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
							}"
						>
							<span class="text-base">👤</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Close-Up Face</span>
								<span class="text-[9px] text-zinc-400 mt-0.5">Fokus Wajah</span>
							</div>
						</button>
					</div>

				<!-- Tab 2: Ekspresi Wajah (Tombol Bergambar) -->
				{:else if hudTab === 'expression'}
					<div class="flex items-center gap-1.5 flex-wrap max-w-lg py-0.5">
						<button
							onclick={() => handleSelectExpression('', 'Netral')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								!rigging.activeExpression
									? 'bg-pink-500/25 border-pink-500 text-pink-200'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😐</span>
							<span>Netral</span>
						</button>

						<button
							onclick={() => handleSelectExpression('stars', 'Mata Bintang (Starry Eyes)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'stars'
									? 'bg-amber-500/25 border-amber-500 text-amber-200 shadow-sm'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>⭐</span>
							<span>Star Eyes</span>
						</button>

						<button
							onclick={() => handleSelectExpression('vrc.ee', 'Senyum (Smile)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'vrc.ee'
									? 'bg-pink-500/25 border-pink-500 text-pink-200'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😊</span>
							<span>Senyum</span>
						</button>

						<button
							onclick={() => handleSelectExpression('blush', 'Pipi Merona (Blush)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'blush'
									? 'bg-rose-500/25 border-rose-500 text-rose-200'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😳</span>
							<span>Blush</span>
						</button>

						<button
							onclick={() => handleSelectExpression('vrc.blink', 'Kedipan (Wink)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'vrc.blink'
									? 'bg-purple-500/25 border-purple-500 text-purple-200'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😉</span>
							<span>Kedip</span>
						</button>

						<button
							onclick={() => handleSelectExpression('vrc.oh', 'Terkejut (Oh)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'vrc.oh'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-200'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😮</span>
							<span>Terkejut</span>
						</button>
					</div>

				<!-- Tab 3: Full Body Pose (Tombol Bergambar) -->
				{:else if hudTab === 'pose'}
					<div class="flex items-center gap-2 overflow-x-auto py-0.5 px-0.5">
						<button
							onclick={() => handleSelectPose('wave', 'Lambaian Tangan')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								threeStage.activeFullBodyPose === 'wave'
									? 'bg-purple-500/25 border-purple-500 text-purple-200 shadow-sm'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
							}"
						>
							<span class="text-base">👋</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Wave Hand</span>
								<span class="text-[9px] text-zinc-400 mt-0.5">Lambaian Tangan</span>
							</div>
						</button>

						<button
							onclick={() => handleSelectPose('peace', 'Pose Peace V')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								threeStage.activeFullBodyPose === 'peace'
									? 'bg-purple-500/25 border-purple-500 text-purple-200 shadow-sm'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
							}"
						>
							<span class="text-base">✌️</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Peace Sign</span>
								<span class="text-[9px] text-zinc-400 mt-0.5">Dua Jari Kawaii</span>
							</div>
						</button>

						<button
							onclick={() => handleSelectPose('heart', 'Pose Hati')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								threeStage.activeFullBodyPose === 'heart'
									? 'bg-rose-500/25 border-rose-500 text-rose-200 shadow-sm'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
							}"
						>
							<span class="text-base">💖</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Heart Pose</span>
								<span class="text-[9px] text-zinc-400 mt-0.5">Pose Cinta</span>
							</div>
						</button>

						<button
							onclick={() => handleSelectPose('idle', 'Gerak Santai')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								threeStage.activeFullBodyPose === 'idle'
									? 'bg-emerald-500/25 border-emerald-500 text-emerald-200 shadow-sm'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
							}"
						>
							<span class="text-base">💃</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Idle Sway</span>
								<span class="text-[9px] text-zinc-400 mt-0.5">Gerak Santai</span>
							</div>
						</button>

						<button
							onclick={() => handleSelectPose('stand', 'Pose Berdiri Tegak')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								threeStage.activeFullBodyPose === 'stand'
									? 'bg-zinc-700/50 border-zinc-500 text-white shadow-sm'
									: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
							}"
						>
							<span class="text-base">🧘</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Rest Pose</span>
								<span class="text-[9px] text-zinc-400 mt-0.5">Pose Berdiri Tegak</span>
							</div>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Collapsed Pill Button -->
			<button
				onclick={() => { playSfx('click'); isHudCollapsed = false; }}
				class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
			>
				<ChevronUp class="w-3.5 h-3.5 text-cyan-400" />
				<span class="font-medium text-[11px]">🎮 Menu 3D (Framing & Pose)</span>
			</button>
		{/if}
	</div>
{/if}
