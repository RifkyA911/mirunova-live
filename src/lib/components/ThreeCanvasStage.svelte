<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Activity } from 'lucide-svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { threeStage, type StageAreaWaypoint } from '#lib/core/threeStage';
	import { i18n, type I18nKey } from '#lib/i18n/index.svelte';

	let containerEl = $state<HTMLDivElement>();
	let animFrameId: number | null = null;

	const WAYPOINTS_HUD: { id: StageAreaWaypoint; key: I18nKey; emoji: string }[] = [
		{ id: 'pc', key: 'waypoint_pc', emoji: '🖥️' },
		{ id: 'bed', key: 'waypoint_bed', emoji: '🛏️' },
		{ id: 'cafe-bar', key: 'waypoint_cafe_bar', emoji: '☕' },
		{ id: 'beach-umbrella', key: 'waypoint_beach_umbrella', emoji: '🏖️' },
		{ id: 'meadow-flowers', key: 'waypoint_meadow_flowers', emoji: '🌸' },
		{ id: 'center', key: 'waypoint_center', emoji: '🎯' }
	];

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
				rigging.showToast(`${i18n.t('screenshot_saved')} ${link.download}`);
			} else {
				rigging.showToast(i18n.t('screenshot_failed'));
			}
		} catch (e) {
			console.error('Screenshot error:', e);
			rigging.showToast(i18n.t('screenshot_failed'));
		}
	}

	async function loadActive3DModel() {
		rigging.isLoadingModel = true;
		const id = rigging.selected3DModelId;

		try {
			if (id === 'neuro-sama') {
				await threeStage.loadNeuroSama();
				rigging.availableExpressions = [
					{ id: 'stars', name: 'stars', label: `⭐ ${i18n.t('exp_starry_eyes')}` },
					{ id: 'vrc.ee', name: 'vrc.ee', label: `😊 ${i18n.t('preset_smile')}` },
					{ id: 'blush', name: 'blush', label: `😳 ${i18n.t('exp_blush')}` },
					{ id: 'vrc.blink', name: 'vrc.blink', label: `😉 ${i18n.t('exp_wink')}` },
					{ id: 'vrc.oh', name: 'vrc.oh', label: `😮 ${i18n.t('exp_surprised')}` },
					{ id: 'vrc.aa', name: 'vrc.aa', label: `🗣️ ${i18n.t('exp_mouth_open')}` }
				];
				rigging.showToast(`✓ ${i18n.t('model_glb_loaded_toast')} Neuro-sama (Vedal's Version)`);
			} else if (id === 'manhattan-cafe') {
				await threeStage.loadManhattanCafe();
				rigging.availableExpressions = [
					{ id: 'stars', name: 'stars', label: `✨ ${i18n.t('exp_mysterious')}` },
					{ id: 'vrc.ee', name: 'vrc.ee', label: `😊 ${i18n.t('exp_gentle_smile')}` },
					{ id: 'blush', name: 'blush', label: `😳 ${i18n.t('exp_blush')}` },
					{ id: 'vrc.blink', name: 'vrc.blink', label: `😉 ${i18n.t('exp_wink')}` },
					{ id: 'vrc.oh', name: 'vrc.oh', label: `😮 ${i18n.t('exp_soft_gasp')}` },
					{ id: 'vrc.aa', name: 'vrc.aa', label: `🗣️ ${i18n.t('exp_speaking')}` }
				];
				rigging.showToast(`✓ ${i18n.t('model_glb_loaded_toast')} Manhattan Cafe (Uma Musume)`);
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
			rigging.showToast(i18n.t('model_process_error'));
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
				<span class="text-cyan-400 font-mono tracking-wide">{i18n.t('stage_model_pos_title')}</span>
				<span class="text-[9px] text-zinc-500 font-mono">{i18n.t('stage_pan_dpad')}</span>
			</div>

			<!-- D-Pad Translation Buttons -->
			<div class="grid grid-cols-3 gap-1 w-28">
				<div></div>
				<button
					type="button"
					onclick={() => {
						threeStage.moveModel(0, 0.15);
						rigging.showToast(`↑ ${i18n.t('stage_move_up')}`);
					}}
					class="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title={i18n.t('stage_move_up')}
					aria-label={i18n.t('stage_move_up')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
				</button>
				<div></div>

				<button
					type="button"
					onclick={() => {
						threeStage.moveModel(-0.15, 0);
						rigging.showToast(`← ${i18n.t('stage_move_left')}`);
					}}
					class="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title={i18n.t('stage_move_left')}
					aria-label={i18n.t('stage_move_left')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
				</button>

				<button
					type="button"
					onclick={() => {
						threeStage.resetModelPosition();
						rigging.showToast(`🎯 ${i18n.t('stage_center_pos')}`);
					}}
					class="p-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title={i18n.t('stage_center_pos')}
					aria-label={i18n.t('stage_center_pos')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
				</button>

				<button
					type="button"
					onclick={() => {
						threeStage.moveModel(0.15, 0);
						rigging.showToast(`→ ${i18n.t('stage_move_right')}`);
					}}
					class="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title={i18n.t('stage_move_right')}
					aria-label={i18n.t('stage_move_right')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
				</button>

				<div></div>
				<button
					type="button"
					onclick={() => {
						threeStage.moveModel(0, -0.15);
						rigging.showToast(`↓ ${i18n.t('stage_move_down')}`);
					}}
					class="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
					title={i18n.t('stage_move_down')}
					aria-label={i18n.t('stage_move_down')}
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
						rigging.showToast(`${i18n.t('stage_rotate_toast')} -45°`);
					}}
					class="flex-1 py-1 px-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
					title={i18n.t('stage_rotate_left_title')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
					<span>-45°</span>
				</button>
				<button
					type="button"
					onclick={() => {
						threeStage.resetOrbit();
						rigging.showToast(`🎯 ${i18n.t('stage_face_front')}`);
					}}
					class="py-1 px-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono font-medium text-cyan-400 cursor-pointer transition-colors"
					title={i18n.t('stage_face_front')}
				>
					0°
				</button>
				<button
					type="button"
					onclick={() => {
						threeStage.rotateModelBodyDegrees(45);
						rigging.showToast(`${i18n.t('stage_rotate_toast')} +45°`);
					}}
					class="flex-1 py-1 px-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
					title={i18n.t('stage_rotate_right_title')}
				>
					<span>+45°</span>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
				</button>
			</div>

			<!-- Teleport Waypoints Quick Buttons -->
			<div class="pt-1.5 border-t border-zinc-800 space-y-1">
				<div class="flex items-center justify-between text-[9px] font-mono text-zinc-500">
					<span>{i18n.t('waypoint_section_title')}</span>
					<span class="text-indigo-400 font-bold">{rigging.activeStageWaypoint.toUpperCase()}</span>
				</div>
				<div class="grid grid-cols-3 gap-1">
					{#each WAYPOINTS_HUD as wp}
						<button
							type="button"
							onclick={() => {
								threeStage.teleportToArea(wp.id);
								rigging.activeStageWaypoint = wp.id;
								rigging.showToast(`${wp.emoji} ${i18n.t(wp.key)}`);
							}}
							class="py-1 px-1 rounded-lg border text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 {
								rigging.activeStageWaypoint === wp.id
									? 'bg-indigo-500/25 border-indigo-400 text-indigo-300 font-bold shadow-sm'
									: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
							}"
						>
							<span>{wp.emoji}</span>
							<span class="truncate">{i18n.t(wp.key)}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Floating Holographic Neural Rig Loading Indicator -->
{#if rigging.isLoadingModel}
	<div
		transition:fade={{ duration: 150 }}
		class="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-950/90 border border-cyan-500/40 backdrop-blur-xl shadow-2xl text-cyan-200"
	>
		<Activity class="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
		<div class="text-left">
			<div class="text-xs font-bold leading-tight flex items-center gap-1.5">
				<span>{i18n.t('loading_3d_skeleton_title')}</span>
				<span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase">{i18n.t('loading_3d_wireframe_badge')}</span>
			</div>
			<div class="text-[10px] text-zinc-400 leading-tight mt-0.5">{i18n.t('loading_3d_skeleton_desc')}</div>
		</div>
	</div>
{/if}
