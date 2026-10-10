<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { rigging, DEFAULT_PARAMETERS } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import type { Live2DParameterDef } from '#lib/types/tracking';

	let containerEl: HTMLDivElement;
	let app: any = null;
	let currentModel: any = null;
	let currentModelUrl = '';
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };
	let modelPosition = { x: 0, y: 0 };
	let modelScale = 0.25;

	onMount(async () => {
		if (typeof window === 'undefined') return;

		try {
			rigging.isLoadingModel = true;

			const PIXI = await import('pixi.js');
			(window as any).PIXI = PIXI;

			const { Live2DModel } = await import('pixi-live2d-display/cubism4');
			Live2DModel.registerTicker(PIXI.Ticker);

			app = new PIXI.Application({
				resizeTo: containerEl,
				backgroundAlpha: 0,
				antialias: true,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true,
				preserveDrawingBuffer: true
			});

			containerEl.appendChild(app.view as HTMLCanvasElement);

			currentModelUrl = rigging.modelUrl;
			await loadModel(rigging.modelUrl, Live2DModel);
		} catch (err) {
			console.error('Failed to initialize Live2D stage:', err);
		} finally {
			rigging.isLoadingModel = false;
		}
	});

	// Reactively reload when modelUrl changes
	$effect(() => {
		const targetUrl = rigging.modelUrl;
		if (app && targetUrl && currentModelUrl !== targetUrl) {
			currentModelUrl = targetUrl;
			loadModel(targetUrl);
		}
	});

	// Reactively trigger motions
	$effect(() => {
		const signal = rigging.triggerMotionSignal;
		if (signal && currentModel) {
			try {
				currentModel.motion(signal.name);
			} catch (e) {
				console.warn('Motion play error:', signal.name, e);
			}
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
		if (!app) return;
		try {
			app.render();
			const canvas = app.view as HTMLCanvasElement;
			const dataUrl = canvas.toDataURL('image/png');
			const link = document.createElement('a');
			const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
			const cleanName = (rigging.modelName || 'avatar').toLowerCase().replace(/\s+/g, '-');
			link.download = `mirunova-${cleanName}-${dateStr}.png`;
			link.href = dataUrl;
			link.click();
			rigging.showToast(`Screenshot tersimpan: ${link.download}`);
		} catch (e) {
			console.error('Screenshot extraction error:', e);
			rigging.showToast('Gagal mengambil screenshot');
		}
	}

	// Reactively reset avatar scale and position when triggered
	let lastResetTransformSignal = 0;
	$effect(() => {
		const signal = rigging.resetTransformSignal;
		if (signal > 0 && signal !== lastResetTransformSignal && app && currentModel) {
			lastResetTransformSignal = signal;
			const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
			const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);
			const modelW = currentModel.width || 800;
			const modelH = currentModel.height || 1000;
			modelScale = Math.min(rendererWidth / modelW, rendererHeight / modelH) * 0.75;
			currentModel.scale.set(modelScale);
			modelPosition = { x: rendererWidth / 2, y: rendererHeight / 2 + 50 };
			currentModel.position.set(modelPosition.x, modelPosition.y);
		}
	});

	let avatarTickerFn: any = null;
	const avatarParamsBuffer: Record<string, number> = {};

	async function loadModel(url: string, Live2DModelClass?: any) {
		if (!app) return;
		try {
			rigging.isLoadingModel = true;
			if (avatarTickerFn && app.ticker) {
				app.ticker.remove(avatarTickerFn);
				avatarTickerFn = null;
			}
			if (currentModel) {
				if (currentModel.destroy) currentModel.destroy();
				if (currentModel.container) app.stage.removeChild(currentModel.container);
				else app.stage.removeChild(currentModel);
				currentModel = null;
			}

			const Live2D = Live2DModelClass || (await import('pixi-live2d-display/cubism4')).Live2DModel;
			const model = await Live2D.from(url, {
				autoInteract: false
			});

			currentModel = model;

			const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
			const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);

			const scale = Math.min(rendererWidth / model.width, rendererHeight / model.height) * 0.7;
			modelScale = scale;
			model.scale.set(scale);

			model.anchor.set(0.5, 0.5);
			modelPosition = { x: rendererWidth / 2, y: rendererHeight / 2 + 50 };
			model.position.set(modelPosition.x, modelPosition.y);

			app.stage.addChild(model);

			// Hook parameters into beforeModelUpdate event for 100% reliable tracking
			if (model.internalModel) {
				model.internalModel.on('beforeModelUpdate', () => {
					const core = model.internalModel?.coreModel;
					if (!core) return;
					const now = performance.now();

					for (const param of rigging.parameters) {
						let val = rigging.getActiveValue(param.id);

						// Apply Pose Looping if active
						if (rigging.poseLoopMode !== 'none') {
							const speed = rigging.poseLoopSpeed;
							if (param.id === 'ParamBreath') {
								val = (Math.sin(now * 0.003 * speed) + 1) / 2;
							} else if (param.id === 'ParamBodyAngleZ' && rigging.poseLoopMode === 'gentle-sway') {
								val += Math.sin(now * 0.0018 * speed) * 3.5;
							} else if (param.id === 'ParamAngleY' && rigging.poseLoopMode === 'head-nod') {
								val += Math.sin(now * 0.004 * speed) * 4.5;
							}
						}

						try {
							core.setParameterValueById(param.id, val);
						} catch {
							// Parameter not present in model
						}
					}

					// Apply Part Opacity / Visibility overrides
					if (rigging.hiddenPartIds) {
						for (const [partId, isHidden] of Object.entries(rigging.hiddenPartIds)) {
							try {
								if (typeof (core as any).setPartOpacityById === 'function') {
									(core as any).setPartOpacityById(partId, isHidden ? 0 : 1);
								}
							} catch {
								// Ignored if part does not exist
							}
						}
					}
				});
			}

			inspectModelParameters(model);
			applyFramingPreset();
		} catch (err: any) {
			console.error('Failed to load Live2D model:', err);
			alert(`Gagal memuat model Live2D: ${err?.message || err}. Silakan pilih model lain.`);
		} finally {
			rigging.isLoadingModel = false;
		}
	}

	function inspectModelParameters(model: any) {
		try {
			const core = model.internalModel?.coreModel;
			if (!core || !core._parameterIds) return;

			const ids: string[] = core._parameterIds;
			const count = ids.length;
			const discovered: Live2DParameterDef[] = [];

			for (let i = 0; i < count; i++) {
				const id = ids[i];
				const min = core._parameterMinimumValues ? core._parameterMinimumValues[i] : -30;
				const max = core._parameterMaximumValues ? core._parameterMaximumValues[i] : 30;
				const defVal = core._parameterDefaultValues ? core._parameterDefaultValues[i] : 0;

				let group: Live2DParameterDef['group'] = 'custom';
				if (id.includes('Angle') || id.includes('Head')) group = 'head';
				else if (id.includes('Eye') || id.includes('Brow')) group = 'eyes';
				else if (id.includes('Mouth') || id.includes('Lip') || id.includes('Cheek')) group = 'mouth';
				else if (id.includes('Body') || id.includes('Breath')) group = 'body';
				else if (id.includes('Arm') || id.includes('Hand')) group = 'hands';

				discovered.push({ id, label: id, min, max, defaultValue: defVal, group });

				if (!(id in rigging.liveValues)) {
					rigging.setLiveValue(id, defVal);
					rigging.setManualValue(id, defVal);
				}
			}

			if (discovered.length > 0) {
				rigging.parameters = discovered;
			}

			// Discover parts for Body Parts Inspector
			try {
				const partIds: string[] = (core as any)._partIds || [];
				const parts: Array<{ id: string; name: string; opacity: number }> = [];
				for (let i = 0; i < partIds.length; i++) {
					const pid = partIds[i];
					let op = 1.0;
					try {
						if (typeof (core as any).getPartOpacityById === 'function') {
							op = (core as any).getPartOpacityById(pid);
						} else if ((core as any)._partOpacities) {
							op = (core as any)._partOpacities[i] ?? 1.0;
						}
					} catch {
						op = 1.0;
					}
					parts.push({ id: pid, name: pid, opacity: op });
				}
				rigging.availableParts = parts;
			} catch (pe) {
				console.warn('Parts inspection skipped:', pe);
			}

			// Discover motions
			try {
				const defs = model.internalModel?.motionManager?.definitions;
				if (defs) {
					rigging.availableMotions = Object.keys(defs);
				} else {
					rigging.availableMotions = ['TapBody', 'Idle', 'FlickHead'];
				}
			} catch {
				rigging.availableMotions = [];
			}
		} catch (e) {
			console.warn('Parameter inspection skipped:', e);
		}
	}

	function applyFramingPreset() {
		if (!currentModel || !app) return;
		const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
		const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);
		const baseScale = Math.min(rendererWidth / currentModel.width, rendererHeight / currentModel.height);

		if (rigging.framingMode === 'full') {
			modelScale = baseScale * 0.55;
			modelPosition = { x: rendererWidth / 2, y: rendererHeight / 2 + 130 };
		} else if (rigging.framingMode === 'closeup') {
			modelScale = baseScale * 1.35;
			modelPosition = { x: rendererWidth / 2, y: rendererHeight / 2 + 340 };
		} else {
			// 'half' (default)
			modelScale = baseScale * 0.75;
			modelPosition = { x: rendererWidth / 2, y: rendererHeight / 2 + 60 };
		}
		currentModel.scale.set(modelScale);
		currentModel.position.set(modelPosition.x, modelPosition.y);
	}

	$effect(() => {
		const mode = rigging.framingMode;
		if (mode && currentModel) {
			applyFramingPreset();
		}
	});

	function handleMouseDown(e: MouseEvent) {
		if (rigging.isGuiLocked) return;
		if (e.button !== 0 && e.button !== 1) return;
		isDragging = true;
		dragStart = { x: e.clientX - modelPosition.x, y: e.clientY - modelPosition.y };
	}

	function handleMouseMove(e: MouseEvent) {
		if (rigging.isGuiLocked) return;
		if (!isDragging || !currentModel) return;
		modelPosition = {
			x: e.clientX - dragStart.x,
			y: e.clientY - dragStart.y
		};
		currentModel.position.set(modelPosition.x, modelPosition.y);
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		if (rigging.isGuiLocked) return;
		if (!currentModel) return;
		e.preventDefault();
		const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
		modelScale = Math.max(0.05, Math.min(3.0, modelScale * zoomFactor));
		currentModel.scale.set(modelScale);
	}

	function handleDoubleClick() {
		if (rigging.isGuiLocked) {
			rigging.toggleGuiLock(false);
			return;
		}
		if (!currentModel || !app) return;
		const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
		const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);
		modelScale = Math.min(rendererWidth / currentModel.width, rendererHeight / currentModel.height) * 0.7;
		currentModel.scale.set(modelScale);
		modelPosition = { x: rendererWidth / 2, y: rendererHeight / 2 + 50 };
		currentModel.position.set(modelPosition.x, modelPosition.y);
	}

	onDestroy(() => {
		if (avatarTickerFn && app?.ticker) {
			app.ticker.remove(avatarTickerFn);
			avatarTickerFn = null;
		}
		if (currentModel?.destroy) {
			currentModel.destroy();
			currentModel = null;
		}
		if (app) {
			app.destroy(true, { children: true, texture: true, baseTexture: true });
			app = null;
		}
	});
</script>

<!-- Stage Container (Transparent canvas over shared background) -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	role="application"
	aria-label="Live2D Stage Canvas"
	tabindex="0"
	bind:this={containerEl}
	class="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing z-0"
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	onwheel={handleWheel}
	ondblclick={handleDoubleClick}
>
	<!-- Model Loading Spinner -->
	{#if rigging.isLoadingModel}
		<div class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
			<div class="flex flex-col items-center gap-3">
				<div class="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
				<span class="text-xs font-semibold text-cyan-300 tracking-widest">{i18n.t('loading_model')}</span>
			</div>
		</div>
	{/if}
</div>
