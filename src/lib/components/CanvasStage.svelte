<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { rigging, DEFAULT_PARAMETERS } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import type { Live2DParameterDef } from '#lib/types/tracking';
	import { Sparkles, Check, X, Move } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { playSfx } from '#lib/core/sfx';

	let containerEl: HTMLDivElement;
	let app: any = null;
	let currentModel: any = null;
	let currentModelUrl = '';
	let collabModel: any = null;
	let currentCollabUrl = '';
	let isCollabLoading = false;
	let collabModel2: any = null;
	let currentCollab2Url = '';
	let isCollab2Loading = false;
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };
	let modelPosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	let modelScale = $state<number>(0.25);

	let liveFps = $state<number>(60);
	let liveFrameMs = $state<number>(16.6);
	let fpsFrameCounter = 0;
	let lastFpsSampleTime = performance.now();

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
				preserveDrawingBuffer: true,
				powerPreference: 'high-performance'
			});

			containerEl.appendChild(app.view as HTMLCanvasElement);
			app.stage.sortableChildren = true;

			// Real-Time Hardware FPS & Frame Time Tracker
			app.ticker.add(() => {
				fpsFrameCounter++;
				const now = performance.now();
				const elapsed = now - lastFpsSampleTime;
				if (elapsed >= 500) {
					const calculated = Math.round((fpsFrameCounter * 1000) / elapsed);
					liveFps = Math.max(1, Math.min(240, calculated));
					liveFrameMs = Number((1000 / liveFps).toFixed(1));
					rigging.fps = liveFps;
					fpsFrameCounter = 0;
					lastFpsSampleTime = now;
				}
			});

			currentModelUrl = rigging.modelUrl;
			await loadModel(rigging.modelUrl, Live2DModel);

			if (rigging.isCollabModeActive && rigging.collabModelUrl) {
				await loadCollabModel(rigging.collabModelUrl, Live2DModel);
			}
			if (rigging.isCollab2Active && rigging.collab2ModelUrl) {
				await loadCollab2Model(rigging.collab2ModelUrl, Live2DModel);
			}
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

	const EXPRESSION_PRESETS: Record<string, Record<string, number>> = {
		smile: {
			ParamEyeLSmile: 1.0,
			ParamEyeRSmile: 1.0,
			PARAM_EYE_L_SMILE: 1.0,
			PARAM_EYE_R_SMILE: 1.0,
			ParamMouthForm: 1.0,
			PARAM_MOUTH_FORM: 1.0,
			ParamCheek: 0.8,
			PARAM_CHEEK: 0.8,
			ParamEyeLOpen: 0.85,
			ParamEyeROpen: 0.85,
			PARAM_EYE_L_OPEN: 0.85,
			PARAM_EYE_R_OPEN: 0.85
		},
		wink: {
			ParamEyeLOpen: 0.0,
			PARAM_EYE_L_OPEN: 0.0,
			ParamEyeLSmile: 1.0,
			PARAM_EYE_L_SMILE: 1.0,
			ParamEyeROpen: 1.0,
			PARAM_EYE_R_OPEN: 1.0,
			ParamMouthForm: 0.8,
			PARAM_MOUTH_FORM: 0.8
		},
		surprise: {
			ParamEyeLOpen: 1.35,
			PARAM_EYE_L_OPEN: 1.35,
			ParamEyeROpen: 1.35,
			PARAM_EYE_R_OPEN: 1.35,
			ParamBrowLY: 0.9,
			ParamBrowRY: 0.9,
			PARAM_BROW_L_Y: 0.9,
			PARAM_BROW_R_Y: 0.9,
			Param: 0.9,
			Param4: 0.9,
			ParamMouthOpenY: 0.9,
			PARAM_MOUTH_OPEN_Y: 0.9,
			ParamMouthForm: 0.0,
			PARAM_MOUTH_FORM: 0.0
		},
		surprised: {
			ParamEyeLOpen: 1.35,
			PARAM_EYE_L_OPEN: 1.35,
			ParamEyeROpen: 1.35,
			PARAM_EYE_R_OPEN: 1.35,
			ParamBrowLY: 0.9,
			ParamBrowRY: 0.9,
			PARAM_BROW_L_Y: 0.9,
			PARAM_BROW_R_Y: 0.9,
			Param: 0.9,
			Param4: 0.9,
			ParamMouthOpenY: 0.9,
			PARAM_MOUTH_OPEN_Y: 0.9,
			ParamMouthForm: 0.0,
			PARAM_MOUTH_FORM: 0.0
		},
		pout: {
			ParamCheek: 1.0,
			PARAM_CHEEK: 1.0,
			ParamMouthForm: -0.65,
			PARAM_MOUTH_FORM: -0.65,
			ParamBrowLY: -0.25,
			ParamBrowRY: -0.25,
			PARAM_BROW_L_Y: -0.25,
			PARAM_BROW_R_Y: -0.25,
			Param: -0.25,
			Param4: -0.25
		},
		sad: {
			ParamBrowLY: -0.85,
			ParamBrowRY: -0.85,
			PARAM_BROW_L_Y: -0.85,
			PARAM_BROW_R_Y: -0.85,
			Param: -0.85,
			Param4: -0.85,
			ParamBrowLAngle: 0.7,
			ParamBrowRAngle: 0.7,
			PARAM_BROW_L_ANGLE: 0.7,
			PARAM_BROW_R_ANGLE: 0.7,
			ParamMouthForm: -1.0,
			PARAM_MOUTH_FORM: -1.0,
			ParamEyeLSmile: 0.0,
			ParamEyeRSmile: 0.0,
			ParamEyeLOpen: 0.65,
			ParamEyeROpen: 0.65,
			Param144: 1.0 // Vivian tear/cry
		},
		cry: {
			ParamBrowLY: -0.85,
			ParamBrowRY: -0.85,
			PARAM_BROW_L_Y: -0.85,
			PARAM_BROW_R_Y: -0.85,
			Param: -0.85,
			Param4: -0.85,
			ParamBrowLAngle: 0.7,
			ParamBrowRAngle: 0.7,
			PARAM_BROW_L_ANGLE: 0.7,
			PARAM_BROW_R_ANGLE: 0.7,
			ParamMouthForm: -1.0,
			PARAM_MOUTH_FORM: -1.0,
			ParamEyeLSmile: 0.0,
			ParamEyeRSmile: 0.0,
			ParamEyeLOpen: 0.65,
			ParamEyeROpen: 0.65,
			Param144: 1.0 // Vivian tear/cry
		},
		blush: {
			ParamCheek: 1.0,
			PARAM_CHEEK: 1.0,
			ParamEyeLSmile: 0.8,
			ParamEyeRSmile: 0.8,
			PARAM_EYE_L_SMILE: 0.8,
			PARAM_EYE_R_SMILE: 0.8,
			ParamMouthForm: 0.6,
			PARAM_MOUTH_FORM: 0.6,
			Param149: 1.0 // Vivian blush
		},
		angry: {
			ParamBrowLAngle: -0.85,
			ParamBrowRAngle: -0.85,
			PARAM_BROW_L_ANGLE: -0.85,
			PARAM_BROW_R_ANGLE: -0.85,
			Param2: -0.85,
			Param5: -0.85,
			ParamBrowLY: -0.5,
			ParamBrowRY: -0.5,
			PARAM_BROW_L_Y: -0.5,
			PARAM_BROW_R_Y: -0.5,
			Param: -0.5,
			Param4: -0.5,
			ParamBrowLForm: -1.0,
			ParamBrowRForm: -1.0,
			PARAM_BROW_L_FORM: -1.0,
			PARAM_BROW_R_FORM: -1.0,
			ParamMouthForm: -0.7,
			PARAM_MOUTH_FORM: -0.7,
			ParamEyeLOpen: 0.75,
			ParamEyeROpen: 0.75,
			PARAM_EYE_L_OPEN: 0.75,
			PARAM_EYE_R_OPEN: 0.75
		}
	};

	// Reactively trigger expressions
	let lastAppliedExpression = '';
	$effect(() => {
		const exp = rigging.activeExpression;
		if (currentModel && exp !== lastAppliedExpression) {
			lastAppliedExpression = exp;
			applyExpression(exp);
		}
	});

	function applyExpression(expName: string) {
		if (!currentModel) return;
		try {
			const expMgr = currentModel.internalModel?.motionManager?.expressionManager;
			if (!expName || expName === 'normal' || expName === 'reset') {
				if (expMgr && typeof expMgr.resetExpression === 'function') {
					expMgr.resetExpression();
				}
				if (expMgr && typeof expMgr.stopAllExpressions === 'function') {
					expMgr.stopAllExpressions();
				}
				if (typeof currentModel.expression === 'function') {
					currentModel.expression('').catch(() => {});
				}
			} else {
				// 1. Try matching by index in definitions first (handles Cubism 3/4 & 2 safely)
				let matchedNative = false;
				if (expMgr?.definitions && Array.isArray(expMgr.definitions)) {
					const idx = expMgr.definitions.findIndex(
						(d: any) =>
							d.Name === expName ||
							d.name === expName ||
							d.File === expName ||
							d.file === expName ||
							(typeof d.Name === 'string' && d.Name.toLowerCase() === expName.toLowerCase()) ||
							(typeof d.name === 'string' && d.name.toLowerCase() === expName.toLowerCase()) ||
							(typeof d.File === 'string' && d.File.toLowerCase().includes(expName.toLowerCase())) ||
							(typeof d.file === 'string' && d.file.toLowerCase().includes(expName.toLowerCase()))
					);
					if (idx >= 0 && typeof currentModel.expression === 'function') {
						currentModel.expression(idx).catch(() => {});
						matchedNative = true;
					}
				}
				// 2. If not found by index, try invoking Pixi-Live2D expression directly by name
				if (!matchedNative && typeof currentModel.expression === 'function') {
					currentModel.expression(expName).catch(() => {});
				}
			}
		} catch (err) {
			console.warn('Failed to apply expression:', expName, err);
		}
	}

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
			rigging.zoomLevel = 1.0;
		}
	});

	// Reactively handle zoom in/out/reset signals
	let lastZoomSignalTime = 0;
	$effect(() => {
		const sig = rigging.zoomSignal;
		if (sig && sig.timestamp !== lastZoomSignalTime && currentModel && app) {
			lastZoomSignalTime = sig.timestamp;
			if (sig.type === 'in') {
				applyZoom(1.15);
			} else if (sig.type === 'out') {
				applyZoom(0.87);
			} else if (sig.type === 'reset') {
				applyFramingPreset();
				rigging.zoomLevel = 1.0;
			} else if (sig.type === 'set' && sig.value) {
				const target = baseModelScale * sig.value;
				applyZoom(target / (modelScale || 1));
			}
		}
	});

	let avatarTickerFn: any = null;
	const avatarParamsBuffer: Record<string, number> = {};

	async function loadModel(url: string, Live2DModelClass?: any) {
		if (!app) return;
		try {
			rigging.isLoadingModel = true;
			playSfx('loadingStart');
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

			// Hook parameters into beforeModelUpdate and afterModelUpdate for 100% reliable tracking
			if (model.internalModel) {
				const applyModelTracking = () => {
					const core = model.internalModel?.coreModel;
					if (!core) return;
					const now = performance.now();

					// If camera tracking is active, disable internal auto-blink generator so it does not cancel user winks
					if (model.internalModel.motionManager && (model.internalModel.motionManager as any).eyeBlink) {
						(model.internalModel.motionManager as any).eyeBlink.enabled = !rigging.isCameraActive;
					}
					if ((model.internalModel as any).eyeBlink) {
						(model.internalModel as any).eyeBlink.enabled = !rigging.isCameraActive;
					}

					const activeExp = rigging.activeExpression;
					const expPreset = activeExp ? EXPRESSION_PRESETS[activeExp] : null;

					const TRACKING_ID_SET = new Set([
						'ParamAngleX', 'ParamAngleY', 'ParamAngleZ',
						'PARAM_ANGLE_X', 'PARAM_ANGLE_Y', 'PARAM_ANGLE_Z',
						'ParamEyeLOpen', 'ParamEyeROpen', 'PARAM_EYE_L_OPEN', 'PARAM_EYE_R_OPEN',
						'ParamEyeLSmile', 'ParamEyeRSmile', 'PARAM_EYE_L_SMILE', 'PARAM_EYE_R_SMILE',
						'ParamEyeBallX', 'ParamEyeBallY', 'PARAM_EYE_BALL_X', 'PARAM_EYE_BALL_Y',
						'ParamBrowLY', 'ParamBrowRY', 'PARAM_BROW_L_Y', 'PARAM_BROW_R_Y',
						'ParamBrowLX', 'ParamBrowRX', 'PARAM_BROW_L_X', 'PARAM_BROW_R_X',
						'ParamBrowLAngle', 'ParamBrowRAngle', 'PARAM_BROW_L_ANGLE', 'PARAM_BROW_R_ANGLE',
						'ParamBrowLForm', 'ParamBrowRForm', 'PARAM_BROW_L_FORM', 'PARAM_BROW_R_FORM',
						'Param', 'Param4', 'Param2', 'Param5',
						'ParamMouthOpenY', 'ParamMouthForm', 'ParamMouthX', 'PARAM_MOUTH_OPEN_Y', 'PARAM_MOUTH_FORM',
						'ParamCheek', 'PARAM_CHEEK',
						'ParamBodyAngleX', 'ParamBodyAngleY', 'ParamBodyAngleZ', 'ParamBreath',
						'PARAM_BODY_ANGLE_X', 'PARAM_BODY_ANGLE_Y', 'PARAM_BODY_ANGLE_Z', 'PARAM_BREATH',
						'ParamArmLA', 'ParamArmRA', 'ParamArmLB', 'ParamArmRB', 'ParamHandAngleL', 'ParamHandAngleR'
					]);

					const setParam = (id: string, val: number) => {
						try {
							if (typeof core.setParameterValueById === 'function') {
								core.setParameterValueById(id, val);
							}
						} catch {}
						try {
							if (typeof core.setParamFloat === 'function') {
								core.setParamFloat(id, val);
							}
						} catch {}
					};

					for (const param of rigging.parameters) {
						// In live mode, only set tracked parameters or active expression overrides to preserve model built-in animations/expressions
						if (rigging.riggingMode === 'live' && !TRACKING_ID_SET.has(param.id) && (!expPreset || !(param.id in expPreset))) {
							continue;
						}

						let val = rigging.getActiveValue(param.id);

						// If active expression overrides this parameter, apply the expression preset value
						if (expPreset && param.id in expPreset) {
							val = expPreset[param.id];
						}

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

						setParam(param.id, val);
					}

					// High-Responsiveness Eyebrows & Linked Model Parameters (Vivian, Mihari, Hiyori, etc.)
					const browLY = expPreset?.ParamBrowLY ?? rigging.getActiveValue('ParamBrowLY');
					const browRY = expPreset?.ParamBrowRY ?? rigging.getActiveValue('ParamBrowRY');
					const browLAngle = expPreset?.ParamBrowLAngle ?? rigging.getActiveValue('ParamBrowLAngle');
					const browRAngle = expPreset?.ParamBrowRAngle ?? rigging.getActiveValue('ParamBrowRAngle');
					const browLForm = expPreset?.ParamBrowLForm ?? rigging.getActiveValue('ParamBrowLForm');
					const browRForm = expPreset?.ParamBrowRForm ?? rigging.getActiveValue('ParamBrowRForm');

					setParam('ParamBrowLY', browLY);
					setParam('ParamBrowRY', browRY);
					setParam('PARAM_BROW_L_Y', browLY);
					setParam('PARAM_BROW_R_Y', browRY);
					setParam('Param', browLY);
					setParam('Param4', browRY);

					setParam('ParamBrowLAngle', browLAngle);
					setParam('ParamBrowRAngle', browRAngle);
					setParam('PARAM_BROW_L_ANGLE', browLAngle);
					setParam('PARAM_BROW_R_ANGLE', browRAngle);
					setParam('Param2', browLAngle);
					setParam('Param5', browRAngle);

					setParam('ParamBrowLForm', browLForm);
					setParam('ParamBrowRForm', browRForm);
					setParam('PARAM_BROW_L_FORM', browLForm);
					setParam('PARAM_BROW_R_FORM', browRForm);

					// Apply custom expression preset overrides directly (e.g. Param144 for cry, Param149 for blush, ParamEyeLSmile for smile)
					if (expPreset) {
						for (const k in expPreset) {
							setParam(k, expPreset[k]);
						}
					}

					// Apply Part Opacity / Visibility overrides only if custom overrides exist
					const hiddenParts = rigging.hiddenPartIds;
					if (hiddenParts && Object.keys(hiddenParts).length > 0) {
						for (const partId in hiddenParts) {
							const isHidden = hiddenParts[partId];
							try {
								if (typeof (core as any).setPartOpacityById === 'function') {
									(core as any).setPartOpacityById(partId, isHidden ? 0 : 1);
								}
							} catch {
								// Ignored if part does not exist
							}
						}
					}
				};

				// Hook into beforeModelUpdate so face tracking parameters are applied right before coreModel.update() renders
				model.internalModel.on('beforeModelUpdate', applyModelTracking);
			}

			inspectModelParameters(model);
			applyFramingPreset();
			playSfx('loadingSuccess');
		} catch (err: any) {
			console.error('Failed to load Live2D model:', err);
			alert(`Gagal memuat model Live2D: ${err?.message || err}. Silakan pilih model lain.`);
		} finally {
			rigging.isLoadingModel = false;
		}
	}

	async function loadCollabModel(url: string, Live2DModelClass?: any) {
		if (!app) return;
		try {
			isCollabLoading = true;
			if (collabModel) {
				if (collabModel.destroy) collabModel.destroy();
				if (collabModel.container) app.stage.removeChild(collabModel.container);
				else app.stage.removeChild(collabModel);
				collabModel = null;
			}
			if (!url || !rigging.isCollabModeActive) return;

			const Live2D = Live2DModelClass || (await import('pixi-live2d-display/cubism4')).Live2DModel;
			const model = await Live2D.from(url, {
				autoInteract: false
			});

			collabModel = model;
			model.anchor.set(0.5, 0.5);
			currentCollabUrl = url;

			app.stage.addChild(model);
			updateCollabTransform();
			updateLayerZIndices();

			if (model.internalModel) {
				model.internalModel.on('beforeModelUpdate', () => {
					const core = model.internalModel?.coreModel;
					if (!core) return;
					const now = performance.now();

					if (rigging.collabSyncTracking) {
						for (const param of rigging.parameters) {
							try {
								const val = rigging.getActiveValue(param.id);
								core.setParameterValueById(param.id, val);
							} catch {}
						}
					} else {
						// Gentle idle breathing and natural head sway for partner avatar
						const breath = (Math.sin(now * 0.003) + 1) / 2;
						const sway = Math.sin(now * 0.0018) * 3.5;
						try {
							core.setParameterValueById('ParamBreath', breath);
							core.setParameterValueById('ParamAngleX', sway);
							core.setParameterValueById('ParamAngleZ', sway * 0.5);
						} catch {}
					}
				});
			}
		} catch (err) {
			console.warn('Failed to load collab partner model:', err);
		} finally {
			isCollabLoading = false;
		}
	}

	function updateCollabTransform() {
		if (!collabModel || !app) return;
		const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
		const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);

		const baseScale = Math.min(rendererWidth / (collabModel.width || 800), rendererHeight / (collabModel.height || 1000)) * 0.65;
		const effectiveScale = baseScale * (rigging.collabScale || 1.0);
		collabModel.scale.set(effectiveScale);

		let posX = rendererWidth * 0.72;
		let posY = rendererHeight / 2 + 50;

		if (rigging.collabPosition === 'left') {
			posX = rendererWidth * 0.28;
		} else if (rigging.collabPosition === 'pip') {
			posX = rendererWidth * 0.82;
			posY = rendererHeight * 0.28;
			collabModel.scale.set(effectiveScale * 0.55);
		}

		collabModel.position.set(posX + (rigging.collabOffsetX || 0), posY + (rigging.collabOffsetY || 0));

		const collabLayer = rigging.stageLayers.find((l) => l.type === 'model-collab');
		const isLayerVisible = collabLayer ? collabLayer.visible : true;
		const layerOpacity = collabLayer ? collabLayer.opacity : 1.0;
		collabModel.alpha = (rigging.collabVisible && isLayerVisible) ? ((rigging.collabOpacity ?? 1.0) * layerOpacity) : 0;
	}

	async function loadCollab2Model(url: string, Live2DModelClass?: any) {
		if (!app) return;
		try {
			isCollab2Loading = true;
			if (collabModel2) {
				if (collabModel2.destroy) collabModel2.destroy();
				if (collabModel2.container) app.stage.removeChild(collabModel2.container);
				else app.stage.removeChild(collabModel2);
				collabModel2 = null;
			}
			if (!url || !rigging.isCollab2Active) return;

			const Live2D = Live2DModelClass || (await import('pixi-live2d-display/cubism4')).Live2DModel;
			const model = await Live2D.from(url, {
				autoInteract: false
			});

			collabModel2 = model;
			model.anchor.set(0.5, 0.5);
			currentCollab2Url = url;

			app.stage.addChild(model);
			updateCollab2Transform();
			updateLayerZIndices();

			if (model.internalModel) {
				model.internalModel.on('beforeModelUpdate', () => {
					const core = model.internalModel?.coreModel;
					if (!core) return;
					const now = performance.now();

					if (rigging.collab2SyncTracking) {
						for (const param of rigging.parameters) {
							try {
								const val = rigging.getActiveValue(param.id);
								core.setParameterValueById(param.id, val);
							} catch {}
						}
					} else {
						// Gentle idle breathing and natural head sway for guest 2 avatar
						const breath = (Math.sin(now * 0.0035 + 1.2) + 1) / 2;
						const sway = Math.sin(now * 0.002 + 1.0) * 3.5;
						try {
							core.setParameterValueById('ParamBreath', breath);
							core.setParameterValueById('ParamAngleX', sway);
							core.setParameterValueById('ParamAngleZ', sway * 0.5);
						} catch {}
					}
				});
			}
		} catch (err) {
			console.warn('Failed to load collab 2 partner model:', err);
		} finally {
			isCollab2Loading = false;
		}
	}

	function updateCollab2Transform() {
		if (!collabModel2 || !app) return;
		const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
		const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);

		const baseScale = Math.min(rendererWidth / (collabModel2.width || 800), rendererHeight / (collabModel2.height || 1000)) * 0.65;
		const effectiveScale = baseScale * (rigging.collab2Scale || 1.0);
		collabModel2.scale.set(effectiveScale);

		let posX = rendererWidth * 0.28;
		let posY = rendererHeight / 2 + 50;

		if (rigging.collab2Position === 'right') {
			posX = rendererWidth * 0.72;
		} else if (rigging.collab2Position === 'center') {
			posX = rendererWidth * 0.5;
		} else if (rigging.collab2Position === 'pip') {
			posX = rendererWidth * 0.18;
			posY = rendererHeight * 0.28;
			collabModel2.scale.set(effectiveScale * 0.55);
		}

		collabModel2.position.set(posX + (rigging.collab2OffsetX || 0), posY + (rigging.collab2OffsetY || 0));

		const collab2Layer = rigging.stageLayers.find((l) => l.type === 'model-collab-2' || l.id === 'layer-collab-2');
		const isLayerVisible = collab2Layer ? collab2Layer.visible : true;
		const layerOpacity = collab2Layer ? collab2Layer.opacity : 1.0;
		collabModel2.alpha = (rigging.collab2Visible && isLayerVisible) ? ((rigging.collab2Opacity ?? 1.0) * layerOpacity) : 0;
	}

	function updateLayerZIndices() {
		if (!app) return;
		const layers = rigging.stageLayers;
		const total = layers.length;
		layers.forEach((layer, idx) => {
			const pixiZ = total - idx;
			if (layer.type === 'model-host' && currentModel) {
				currentModel.zIndex = pixiZ;
			} else if (layer.type === 'model-collab' && collabModel) {
				collabModel.zIndex = pixiZ;
			} else if ((layer.type === 'model-collab-2' || layer.id === 'layer-collab-2') && collabModel2) {
				collabModel2.zIndex = pixiZ;
			}
		});
	}

	// Reactively manage Collab Model 1 loading, visibility & transform
	$effect(() => {
		const active = rigging.isCollabModeActive;
		const url = rigging.collabModelUrl;
		const pos = rigging.collabPosition;
		const scale = rigging.collabScale;
		const offX = rigging.collabOffsetX;
		const offY = rigging.collabOffsetY;
		const opacity = rigging.collabOpacity;
		const vis = rigging.collabVisible;
		const layers = rigging.stageLayers;

		if (app) {
			if (active && url && (currentCollabUrl !== url || !collabModel)) {
				loadCollabModel(url);
			} else if (!active && collabModel) {
				collabModel.visible = false;
			} else if (active && collabModel) {
				const collabLayer = rigging.stageLayers.find((l) => l.type === 'model-collab');
				const isLayerVisible = collabLayer ? collabLayer.visible : true;
				const layerOpacity = collabLayer ? collabLayer.opacity : 1.0;
				collabModel.visible = Boolean(rigging.collabVisible && isLayerVisible && layerOpacity > 0);
				collabModel.alpha = collabModel.visible ? ((rigging.collabOpacity ?? 1.0) * layerOpacity) : 0;
				updateCollabTransform();
			}
			updateLayerZIndices();
		}
	});

	// Reactively manage Collab Model 2 loading, visibility & transform
	$effect(() => {
		const active = rigging.isCollab2Active;
		const url = rigging.collab2ModelUrl;
		const pos = rigging.collab2Position;
		const scale = rigging.collab2Scale;
		const offX = rigging.collab2OffsetX;
		const offY = rigging.collab2OffsetY;
		const opacity = rigging.collab2Opacity;
		const vis = rigging.collab2Visible;
		const layers = rigging.stageLayers;

		if (app) {
			if (active && url && (currentCollab2Url !== url || !collabModel2)) {
				loadCollab2Model(url);
			} else if (!active && collabModel2) {
				collabModel2.visible = false;
			} else if (active && collabModel2) {
				const collab2Layer = rigging.stageLayers.find((l) => l.type === 'model-collab-2' || l.id === 'layer-collab-2');
				const isLayerVisible = collab2Layer ? collab2Layer.visible : true;
				const layerOpacity = collab2Layer ? collab2Layer.opacity : 1.0;
				collabModel2.visible = Boolean(rigging.collab2Visible && isLayerVisible && layerOpacity > 0);
				collabModel2.alpha = collabModel2.visible ? ((rigging.collab2Opacity ?? 1.0) * layerOpacity) : 0;
				updateCollab2Transform();
			}
			updateLayerZIndices();
		}
	});

	// Reactively manage Host Model opacity & layer visibility
	$effect(() => {
		const layers = rigging.stageLayers;
		if (currentModel) {
			const hostLayer = layers.find((l) => l.type === 'model-host');
			const isLayerVisible = hostLayer ? hostLayer.visible : true;
			const layerOpacity = hostLayer ? hostLayer.opacity : 1.0;
			const shouldShow = Boolean(isLayerVisible && layerOpacity > 0);
			currentModel.visible = shouldShow;
			currentModel.renderable = shouldShow;
			currentModel.alpha = isLayerVisible ? layerOpacity : 0;
		}
	});

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

			// Discover expressions provided by the Live2D model
			try {
				const expMgr = model.internalModel?.motionManager?.expressionManager;
				const expDefs = expMgr?.definitions;
				const expressionsList: Array<{ id: string; name: string; label: string }> = [];

				if (Array.isArray(expDefs) && expDefs.length > 0) {
					expDefs.forEach((def: any, idx: number) => {
						const name = def.Name || def.name || def.File || def.file || `exp_${idx}`;
						const cleanLabel = (def.Name || def.name || name).replace(/\.(exp3?|json)$/i, '').replace(/^.*\//, '');
						expressionsList.push({ id: name, name, label: `✨ ${cleanLabel}` });
					});
				} else if (model.internalModel?.settings?.expressions && model.internalModel.settings.expressions.length > 0) {
					const rawExps = model.internalModel.settings.expressions;
					rawExps.forEach((exp: any, idx: number) => {
						const name = exp.Name || exp.name || exp.File || exp.file || `exp_${idx}`;
						const cleanLabel = (exp.Name || exp.name || name).replace(/\.(exp3?|json)$/i, '').replace(/^.*\//, '');
						expressionsList.push({ id: name, name, label: `✨ ${cleanLabel}` });
					});
				}

				const universalPresets = [
					{ id: 'smile', name: 'smile', label: '😊 Senyum (Smile)' },
					{ id: 'wink', name: 'wink', label: '😉 Kedip (Wink)' },
					{ id: 'surprised', name: 'surprised', label: '😲 Kaget (Shock)' },
					{ id: 'pout', name: 'pout', label: '😤 Ngambek (Pout)' },
					{ id: 'cry', name: 'cry', label: '😢 Menangis (Cry)' },
					{ id: 'blush', name: 'blush', label: '😳 Merona (Blush)' },
					{ id: 'angry', name: 'angry', label: '😡 Marah (Angry)' }
				];

				for (const up of universalPresets) {
					if (!expressionsList.some((e) => e.name === up.name)) {
						expressionsList.push(up);
					}
				}

				rigging.availableExpressions = expressionsList;
			} catch (expErr) {
				console.warn('Expressions inspection skipped:', expErr);
				rigging.availableExpressions = [
					{ id: 'smile', name: 'smile', label: '😊 Senyum (Smile)' },
					{ id: 'wink', name: 'wink', label: '😉 Kedip (Wink)' },
					{ id: 'surprised', name: 'surprised', label: '😲 Kaget (Shock)' },
					{ id: 'pout', name: 'pout', label: '😤 Ngambek (Pout)' },
					{ id: 'cry', name: 'cry', label: '😢 Menangis (Cry)' },
					{ id: 'blush', name: 'blush', label: '😳 Merona (Blush)' },
				];
			}
		} catch (e) {
			console.warn('Parameter inspection skipped:', e);
		}
	}

	let baseModelScale = 0.5;

	function applyFramingPreset() {
		if (!currentModel || !app) return;
		const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
		const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);
		const baseScale = Math.min(rendererWidth / currentModel.width, rendererHeight / currentModel.height);
		baseModelScale = baseScale;

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
		rigging.zoomLevel = Number((modelScale / (baseModelScale || 1)).toFixed(2));
	}

	function applyZoom(factor: number, anchorX?: number, anchorY?: number) {
		if (!currentModel || !app) return;
		const oldScale = modelScale;
		const newScale = Math.max(0.05, Math.min(3.5, oldScale * factor));
		if (newScale === oldScale) return;

		const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
		const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);

		// Anchor zoom to center of stage viewport (guarantees center-anchored zooming!)
		const originX = anchorX !== undefined ? anchorX : (rendererWidth / 2);
		const originY = anchorY !== undefined ? anchorY : (rendererHeight / 2);

		const ratio = newScale / oldScale;
		modelPosition = {
			x: originX + (modelPosition.x - originX) * ratio,
			y: originY + (modelPosition.y - originY) * ratio
		};

		modelScale = newScale;
		currentModel.scale.set(modelScale);
		currentModel.position.set(modelPosition.x, modelPosition.y);
		rigging.zoomLevel = Number((modelScale / (baseModelScale || 1)).toFixed(2));
	}

	$effect(() => {
		const mode = rigging.framingMode;
		if (mode && currentModel) {
			applyFramingPreset();
		}
	});

	let lastPointerX = 0;
	let lastPointerY = 0;

	let initialDragSnapshot: {
		targetId: string | null;
		hostPos?: { x: number; y: number };
		collabOffset?: { x: number; y: number };
		collab2Offset?: { x: number; y: number };
		accOffset?: { x: number; y: number };
	} = { targetId: null };

	function recordDragSnapshot() {
		const targetId = rigging.selectedLayerElementId;
		if (targetId === 'collab') {
			initialDragSnapshot = {
				targetId,
				collabOffset: { x: rigging.collabOffsetX || 0, y: rigging.collabOffsetY || 0 }
			};
		} else if (targetId === 'collab-2' || targetId === 'model-collab-2') {
			initialDragSnapshot = {
				targetId,
				collab2Offset: { x: rigging.collab2OffsetX || 0, y: rigging.collab2OffsetY || 0 }
			};
		} else if (targetId === 'host' || !targetId) {
			initialDragSnapshot = {
				targetId: 'host',
				hostPos: { x: modelPosition.x, y: modelPosition.y }
			};
		} else {
			const acc = rigging.activeAccessories.find((a) => a.id === targetId);
			if (acc) {
				initialDragSnapshot = {
					targetId,
					accOffset: { x: acc.offsetX, y: acc.offsetY }
				};
			}
		}
	}

	function handleApplyLayerTransform() {
		playSfx('click');
		rigging.persist();
		recordDragSnapshot();
		rigging.showToast('✓ Posisi elemen berhasil diterapkan!');
	}

	function handleCancelLayerTransform() {
		playSfx('toggle');
		if (initialDragSnapshot.targetId === 'collab' && initialDragSnapshot.collabOffset) {
			rigging.collabOffsetX = initialDragSnapshot.collabOffset.x;
			rigging.collabOffsetY = initialDragSnapshot.collabOffset.y;
			updateCollabTransform();
		} else if ((initialDragSnapshot.targetId === 'collab-2' || initialDragSnapshot.targetId === 'model-collab-2') && initialDragSnapshot.collab2Offset) {
			rigging.collab2OffsetX = initialDragSnapshot.collab2Offset.x;
			rigging.collab2OffsetY = initialDragSnapshot.collab2Offset.y;
			updateCollab2Transform();
		} else if (initialDragSnapshot.targetId === 'host' && initialDragSnapshot.hostPos && currentModel) {
			modelPosition = { ...initialDragSnapshot.hostPos };
			currentModel.position.set(modelPosition.x, modelPosition.y);
		} else if (initialDragSnapshot.accOffset) {
			const acc = rigging.activeAccessories.find((a) => a.id === initialDragSnapshot.targetId);
			if (acc && initialDragSnapshot.accOffset) {
				acc.offsetX = initialDragSnapshot.accOffset.x;
				acc.offsetY = initialDragSnapshot.accOffset.y;
				rigging.activeAccessories = [...rigging.activeAccessories];
			}
		}
		rigging.persist();
		rigging.showToast('Posisi elemen dibatalkan ke posisi awal');
	}

	function getSelectedElementName(): string {
		const targetId = rigging.selectedLayerElementId;
		if (targetId === 'collab') return rigging.collabModelName || 'Partner 1';
		if (targetId === 'collab-2' || targetId === 'model-collab-2') return rigging.collab2ModelName || 'Partner 2';
		if (targetId === 'host' || !targetId) return rigging.modelName || 'Avatar Utama';
		const acc = rigging.activeAccessories.find((a) => a.id === targetId);
		return acc ? acc.name : 'Elemen Panggung';
	}

	function handleMouseDown(e: MouseEvent) {
		if (rigging.isGuiLocked) return;
		if (e.button !== 0 && e.button !== 1) return;

		const hostLayer = rigging.stageLayers.find((l) => l.type === 'model-host');
		const collabLayer = rigging.stageLayers.find((l) => l.type === 'model-collab');
		const collab2Layer = rigging.stageLayers.find((l) => l.type === 'model-collab-2' || l.id === 'layer-collab-2');
		const accLayer = rigging.stageLayers.find((l) => l.type === 'accessories');

		if (rigging.cursorToolMode === 'select-layer') {
			let targetId = rigging.selectedLayerElementId;

			// Smart element selection based on click position
			if ((rigging.isCollabModeActive || rigging.isCollab2Active) && (!targetId || targetId === 'host' || targetId === 'collab' || targetId === 'collab-2')) {
				const isRightSide = e.clientX > (window.innerWidth * 0.6);
				const isLeftSide = e.clientX < (window.innerWidth * 0.4);
				if (rigging.isCollabModeActive && isRightSide) {
					targetId = 'collab';
				} else if (rigging.isCollab2Active && isLeftSide) {
					targetId = 'collab-2';
				} else {
					targetId = 'host';
				}
				rigging.selectLayerElement(targetId);
			}

			recordDragSnapshot();

			if (targetId === 'collab') {
				if (collabLayer?.locked) {
					rigging.showToast('🔒 Layer Avatar Collab Partner 1 terkunci');
					return;
				}
				if (!collabLayer?.visible) return;
			}
			if (targetId === 'collab-2' || targetId === 'model-collab-2') {
				if (collab2Layer?.locked) {
					rigging.showToast('🔒 Layer Avatar Collab Partner 2 terkunci');
					return;
				}
				if (!collab2Layer?.visible) return;
			}
			if (targetId === 'host' || !targetId) {
				if (hostLayer?.locked) {
					rigging.showToast('🔒 Layer Avatar Utama terkunci');
					return;
				}
				if (!hostLayer?.visible) return;
			}
			const targetAcc = rigging.activeAccessories.find((a) => a.id === targetId);
			if (targetAcc) {
				if (accLayer?.locked) {
					rigging.showToast('🔒 Layer Props / Aksesoris terkunci');
					return;
				}
				if (!accLayer?.visible) return;
			}
		} else {
			// Mode 'pan': panning host model
			if (hostLayer?.locked) {
				rigging.showToast('🔒 Layer Avatar Utama terkunci');
				return;
			}
			if (!hostLayer?.visible) return;
		}

		isDragging = true;
		lastPointerX = e.clientX;
		lastPointerY = e.clientY;
		dragStart = { x: e.clientX - modelPosition.x, y: e.clientY - modelPosition.y };
	}

	function handleMouseMove(e: MouseEvent) {
		if (rigging.isGuiLocked) return;
		if (!isDragging) return;

		const dx = e.clientX - lastPointerX;
		const dy = e.clientY - lastPointerY;
		lastPointerX = e.clientX;
		lastPointerY = e.clientY;

		const hostLayer = rigging.stageLayers.find((l) => l.type === 'model-host');
		const collabLayer = rigging.stageLayers.find((l) => l.type === 'model-collab');
		const collab2Layer = rigging.stageLayers.find((l) => l.type === 'model-collab-2' || l.id === 'layer-collab-2');
		const accLayer = rigging.stageLayers.find((l) => l.type === 'accessories');

		if (rigging.cursorToolMode === 'select-layer') {
			const targetId = rigging.selectedLayerElementId;
			if (targetId === 'collab' && collabModel) {
				if (collabLayer?.locked || !collabLayer?.visible) return;
				rigging.collabOffsetX = (rigging.collabOffsetX || 0) + dx;
				rigging.collabOffsetY = (rigging.collabOffsetY || 0) + dy;
				updateCollabTransform();
			} else if ((targetId === 'collab-2' || targetId === 'model-collab-2') && collabModel2) {
				if (collab2Layer?.locked || !collab2Layer?.visible) return;
				rigging.collab2OffsetX = (rigging.collab2OffsetX || 0) + dx;
				rigging.collab2OffsetY = (rigging.collab2OffsetY || 0) + dy;
				updateCollab2Transform();
			} else {
				const acc = rigging.activeAccessories.find((a) => a.id === targetId);
				if (acc) {
					if (accLayer?.locked || !accLayer?.visible) return;
					const scaleRatio = (modelScale / 0.25) || 1;
					acc.offsetX += Math.round(dx / scaleRatio);
					acc.offsetY += Math.round(dy / scaleRatio);
				} else if (currentModel) {
					if (hostLayer?.locked || !hostLayer?.visible) return;
					// Default to moving host model
					modelPosition = {
						x: modelPosition.x + dx,
						y: modelPosition.y + dy
					};
					currentModel.position.set(modelPosition.x, modelPosition.y);
				}
			}
		} else {
			// Mode 'pan': move host model
			if (!currentModel || hostLayer?.locked || !hostLayer?.visible) return;
			modelPosition = {
				x: e.clientX - dragStart.x,
				y: e.clientY - dragStart.y
			};
			currentModel.position.set(modelPosition.x, modelPosition.y);
		}
	}

	function handleMouseUp() {
		if (isDragging) {
			isDragging = false;
			if (rigging.cursorToolMode === 'select-layer') {
				rigging.persist();
			}
		}
	}

	function handleWheel(e: WheelEvent) {
		if (rigging.isGuiLocked) return;
		const hostLayer = rigging.stageLayers.find((l) => l.type === 'model-host');
		if (hostLayer?.locked || !hostLayer?.visible) return;
		if (!currentModel || !app) return;
		e.preventDefault();
		const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
		const rendererWidth = app.renderer.width / (window.devicePixelRatio || 1);
		const rendererHeight = app.renderer.height / (window.devicePixelRatio || 1);
		// Center-anchored zoom
		applyZoom(zoomFactor, rendererWidth / 2, rendererHeight / 2);
	}

	function handleDoubleClick() {
		if (rigging.isGuiLocked) {
			rigging.toggleGuiLock(false);
			return;
		}
		const hostLayer = rigging.stageLayers.find((l) => l.type === 'model-host');
		if (hostLayer?.locked) {
			rigging.showToast('🔒 Layer Avatar Utama terkunci');
			return;
		}
		if (!hostLayer?.visible) return;
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
		if (collabModel?.destroy) {
			collabModel.destroy();
			collabModel = null;
		}
		if (collabModel2?.destroy) {
			collabModel2.destroy();
			collabModel2 = null;
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
	class="absolute inset-0 w-full h-full overflow-hidden select-none z-0 {
		rigging.cursorToolMode === 'select-layer'
			? 'cursor-move'
			: rigging.cursorToolMode === 'hand-tracking'
				? 'cursor-crosshair'
				: 'cursor-grab active:cursor-grabbing'
	}"
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	onwheel={handleWheel}
	ondblclick={handleDoubleClick}
>
	<!-- VTuber Accessories & Props Layer (Anchored to avatar tracking coordinates) -->
	{#if (rigging.stageLayers.find((l) => l.type === 'accessories')?.visible ?? true)}
		{@const accLayer = rigging.stageLayers.find((l) => l.type === 'accessories')}
		{@const accLayerOpacity = accLayer ? accLayer.opacity : 1.0}
		<div
			class="absolute inset-0 select-none overflow-hidden z-20 {rigging.cursorToolMode === 'select-layer' ? 'pointer-events-auto' : 'pointer-events-none'}"
			style="opacity: {accLayerOpacity};"
		>
			{#each rigging.activeAccessories.filter((a) => a.visible) as acc (acc.id)}
				{@const attach = acc.attachTo || 'head'}
				{@const headAngleZ = rigging.getActiveValue('ParamAngleZ')}
				{@const headAngleX = rigging.getActiveValue('ParamAngleX')}
				{@const headAngleY = rigging.getActiveValue('ParamAngleY')}
				{@const bodyAngleZ = rigging.getActiveValue('ParamBodyAngleZ')}
				{@const bodyAngleX = rigging.getActiveValue('ParamBodyAngleX')}
				{@const scaleRatio = modelScale / 0.25}
				{@const headShiftX = (headAngleX * 1.5) * scaleRatio}
				{@const headShiftY = -(headAngleY * 1.5) * scaleRatio}
				{@const bodyShiftX = (bodyAngleX * 1.2) * scaleRatio}
				{@const posX = attach === 'screen'
					? (modelPosition.x + acc.offsetX)
					: attach === 'body'
						? (modelPosition.x + (acc.offsetX * scaleRatio) + bodyShiftX)
						: (modelPosition.x + (acc.offsetX * scaleRatio) + headShiftX)}
				{@const posY = attach === 'screen'
					? (modelPosition.y + acc.offsetY)
					: attach === 'body'
						? (modelPosition.y + (acc.offsetY * scaleRatio))
						: (modelPosition.y + (acc.offsetY * scaleRatio) + headShiftY)}
				{@const rot = attach === 'screen'
					? (acc.rotation || 0)
					: attach === 'body'
						? ((acc.rotation || 0) + (bodyAngleZ * 0.7))
						: ((acc.rotation || 0) + (headAngleZ * 0.9))}
				{@const finalScale = attach === 'screen'
					? (acc.scale || 1.0)
					: ((acc.scale || 1.0) * scaleRatio)}
				{@const isSelected = rigging.cursorToolMode === 'select-layer' && rigging.selectedLayerElementId === acc.id}

				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					onmousedown={(e) => {
						if (rigging.cursorToolMode === 'select-layer') {
							e.stopPropagation();
							e.preventDefault();
							if (accLayer?.locked) {
								rigging.showToast('🔒 Layer Props / Aksesoris terkunci');
								return;
							}
							playSfx('click');
							rigging.selectLayerElement(acc.id);
							recordDragSnapshot();
							isDragging = true;
							lastPointerX = e.clientX;
							lastPointerY = e.clientY;
						}
					}}
					onclick={(e) => {
						if (rigging.cursorToolMode === 'select-layer') {
							e.stopPropagation();
							playSfx('click');
							rigging.selectLayerElement(acc.id);
							recordDragSnapshot();
						}
					}}
					class="absolute select-none transition-transform duration-75 origin-center will-change-transform {
						rigging.cursorToolMode === 'select-layer' ? 'pointer-events-auto cursor-move' : 'pointer-events-none'
					}"
					style="left: 0; top: 0; transform: translate3d({posX}px, {posY}px, 0) rotate({rot}deg) scale({finalScale}); opacity: {acc.opacity || 1.0};"
				>
					<div class="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] {
						isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/50 rounded-2xl' : ''
					}">
						{#if isSelected}
							<div class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-bold font-mono text-[9px] whitespace-nowrap shadow-md pointer-events-none z-30">
								🎯 {acc.name} (Drag untuk geser)
							</div>
						{/if}
						{#if acc.imageUrl}
							<img
								src={acc.imageUrl}
								alt={acc.name}
								class="max-w-52 max-h-52 object-contain pointer-events-none select-none drop-shadow-md"
							/>
						{:else if acc.id === 'sunglasses'}
							<!-- Cool Dark Sunglasses / Shades -->
							<svg viewBox="0 0 160 50" class="w-36 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="5" y="10" width="65" height="35" rx="8" fill="#18181b" stroke="#38bdf8" stroke-width="3" />
								<rect x="90" y="10" width="65" height="35" rx="8" fill="#18181b" stroke="#38bdf8" stroke-width="3" />
								<path d="M70 18 C75 14, 85 14, 90 18" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
								<path d="M10 16 L60 16" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6" />
								<path d="M95 16 L145 16" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6" />
								<path d="M5 16 L-10 12" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
								<path d="M155 16 L170 12" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
							</svg>
						{:else if acc.id === 'cat-ears'}
							<!-- Cute Nekomimi Headband -->
							<svg viewBox="0 0 180 80" class="w-44 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M25 75 L15 15 L70 50 Z" fill="#18181b" stroke="#ec4899" stroke-width="3" stroke-linejoin="round" />
								<path d="M30 65 L24 28 L60 50 Z" fill="#f472b6" />
								<path d="M155 75 L165 15 L110 50 Z" fill="#18181b" stroke="#ec4899" stroke-width="3" stroke-linejoin="round" />
								<path d="M150 65 L156 28 L120 50 Z" fill="#f472b6" />
								<path d="M25 75 C60 55, 120 55, 155 75" stroke="#ec4899" stroke-width="5" stroke-linecap="round" />
								<circle cx="90" cy="58" r="6" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
							</svg>
						{:else if acc.id === 'headset'}
							<!-- RGB Neon Gaming Headset -->
							<svg viewBox="0 0 200 120" class="w-48 h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M25 90 C25 20, 175 20, 175 90" stroke="#09090b" stroke-width="10" stroke-linecap="round" />
								<path d="M35 85 C35 30, 165 30, 165 85" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" opacity="0.9" />
								<rect x="10" y="70" width="28" height="46" rx="12" fill="#18181b" stroke="#06b6d4" stroke-width="3" />
								<circle cx="24" cy="93" r="7" fill="#06b6d4" opacity="0.6" />
								<rect x="162" y="70" width="28" height="46" rx="12" fill="#18181b" stroke="#06b6d4" stroke-width="3" />
								<circle cx="176" cy="93" r="7" fill="#06b6d4" opacity="0.6" />
								<path d="M20 105 C20 125, 45 130, 65 125" stroke="#27272a" stroke-width="4" stroke-linecap="round" />
								<circle cx="68" cy="124" r="5" fill="#f43f5e" />
							</svg>
						{:else if acc.id === 'top-hat'}
							<!-- Magician Silk Top Hat -->
							<svg viewBox="0 0 140 100" class="w-36 h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
								<ellipse cx="70" cy="85" rx="60" ry="12" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
								<path d="M35 82 L42 20 L98 20 L105 82 Z" fill="#09090b" stroke="#27272a" stroke-width="2" />
								<ellipse cx="70" cy="20" rx="28" ry="8" fill="#18181b" stroke="#3f3f46" stroke-width="1.5" />
								<path d="M37 72 L40 60 L100 60 L103 72 Z" fill="#e11d48" />
								<circle cx="70" cy="66" r="4" fill="#fbbf24" />
							</svg>
						{:else if acc.id === 'sakura-pin'}
							<!-- Sakura Cherry Blossom Flower Pin -->
							<svg viewBox="0 0 80 80" class="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<g transform="translate(40,40)">
									{#each [0, 72, 144, 216, 288] as deg}
										<path
											d="M0 0 C-10 -20, -12 -35, 0 -38 C12 -35, 10 -20, 0 0"
											fill="#fbcfe8"
											stroke="#f472b6"
											stroke-width="1.5"
											transform="rotate({deg})"
										/>
									{/each}
									<circle cx="0" cy="0" r="6" fill="#fbbf24" />
									<circle cx="0" cy="0" r="3" fill="#f59e0b" />
								</g>
							</svg>
						{:else if acc.id === 'crown'}
							<!-- Golden Royalty Crown -->
							<svg viewBox="0 0 140 90" class="w-36 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M15 75 L20 25 L45 55 L70 12 L95 55 L120 25 L125 75 Z" fill="#fbbf24" stroke="#d97706" stroke-width="3" stroke-linejoin="round" />
								<ellipse cx="70" cy="75" rx="55" ry="8" fill="#f59e0b" stroke="#b45309" stroke-width="2" />
								<circle cx="70" cy="12" r="5" fill="#ef4444" stroke="#991b1b" stroke-width="1" />
								<circle cx="20" cy="25" r="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1" />
								<circle cx="120" cy="25" r="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1" />
								<circle cx="70" cy="60" r="5" fill="#10b981" />
							</svg>
						{:else if acc.id === 'studio-mic'}
							<!-- Broadcast Condenser Microphone with Boom Arm -->
							<svg viewBox="0 0 100 120" class="w-24 h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="35" y="15" width="30" height="55" rx="15" fill="#27272a" stroke="#52525b" stroke-width="2" />
								<rect x="39" y="19" width="22" height="24" rx="8" fill="#18181b" />
								<line x1="39" y1="26" x2="61" y2="26" stroke="#71717a" stroke-width="1" />
								<line x1="39" y1="32" x2="61" y2="32" stroke="#71717a" stroke-width="1" />
								<line x1="39" y1="38" x2="61" y2="38" stroke="#71717a" stroke-width="1" />
								<path d="M25 45 C25 80, 75 80, 75 45" stroke="#3f3f46" stroke-width="3" fill="none" stroke-linecap="round" />
								<line x1="50" y1="78" x2="50" y2="105" stroke="#3f3f46" stroke-width="4" stroke-linecap="round" />
								<circle cx="50" cy="108" r="8" fill="#18181b" stroke="#52525b" stroke-width="2" />
							</svg>
						{:else if acc.id === 'mustache'}
							<!-- Classic Gentleman Handlebar Mustache -->
							<svg viewBox="0 0 120 40" class="w-32 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path
									d="M60 20 C50 10, 25 5, 8 20 C2 24, 0 32, 10 30 C22 28, 45 32, 60 22 C75 32, 98 28, 110 30 C120 32, 118 24, 112 20 C95 5, 70 10, 60 20 Z"
									fill="#18181b"
									stroke="#27272a"
									stroke-width="1.5"
								/>
							</svg>
						{:else if acc.id === 'halo'}
							<!-- Angel Golden Halo Ring -->
							<svg viewBox="0 0 160 50" class="w-40 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
								<ellipse cx="80" cy="25" rx="65" ry="16" stroke="#facc15" stroke-width="7" fill="none" opacity="0.9" class="animate-pulse" />
								<ellipse cx="80" cy="25" rx="65" ry="16" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.95" />
							</svg>
						{:else if acc.id === 'heart-aura'}
							<!-- Floating Hearts Sparkles -->
							<div class="relative w-28 h-28 flex items-center justify-center animate-bounce">
								<span class="text-3xl filter drop-shadow-[0_0_10px_#f43f5e]">💖</span>
								<span class="absolute top-0 right-2 text-lg text-pink-400 animate-ping">✨</span>
								<span class="absolute bottom-2 left-1 text-base text-rose-300 animate-pulse">💕</span>
							</div>
						{:else}
							<span class="text-4xl filter drop-shadow-md">{acc.emoji}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Real-Time HUD FPS Counter (Configurable Toggle) -->
	{#if rigging.showFpsCounter}
		<div
			class="absolute top-4 left-4 z-30 pointer-events-none select-none flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 shadow-lg text-xs font-mono transition-all animate-in fade-in"
		>
			<span
				class="w-2 h-2 rounded-full {liveFps >= 50 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : liveFps >= 30 ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-rose-400 shadow-[0_0_8px_#f87171]'}"
			></span>
			<span class="font-bold {liveFps >= 50 ? 'text-emerald-300' : liveFps >= 30 ? 'text-amber-300' : 'text-rose-300'}">
				{liveFps} FPS
			</span>
			<span class="text-zinc-500 text-[10px]">({liveFrameMs}ms)</span>
		</div>
	{/if}

	<!-- Cursor Tool Mode Active Interactive HUD Pill (Select & Move Layer with Apply & Cancel) -->
	{#if rigging.cursorToolMode === 'select-layer'}
		<div
			transition:fly={{ y: -16, duration: 180 }}
			class="absolute top-4 left-1/2 -translate-x-1/2 z-30 select-none flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-xl border border-amber-500/50"
		>
			<div class="flex items-center gap-1.5 pr-2 border-r border-zinc-800">
				<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
				<span class="text-xs font-bold text-amber-300">
					🎯 Geser: <span class="text-white font-semibold">{getSelectedElementName()}</span>
				</span>
			</div>

			<!-- Apply Button -->
			<button
				type="button"
				onclick={handleApplyLayerTransform}
				title="Simpan posisi elemen saat ini"
				class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
			>
				<Check class="w-3.5 h-3.5" />
				<span>Terapkan</span>
			</button>

			<!-- Cancel Button -->
			<button
				type="button"
				onclick={handleCancelLayerTransform}
				title="Batalkan perubahan posisi ke awal"
				class="px-2.5 py-1 bg-zinc-800 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 hover:border-rose-500/40 border border-zinc-700 font-semibold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1"
			>
				<X class="w-3.5 h-3.5" />
				<span>Batal</span>
			</button>

			<!-- Finish / Pan Switch -->
			<button
				type="button"
				onclick={() => {
					playSfx('click');
					rigging.setCursorToolMode('pan');
				}}
				class="px-2 py-1 text-zinc-400 hover:text-zinc-200 text-[11px] rounded-lg transition-colors cursor-pointer"
				title="Kembali ke Mode Panning Panggung"
			>
				Selesai
			</button>
		</div>
	{/if}

	<!-- Fluid Animated Avatar Loading Screen -->
	{#if rigging.isLoadingModel}
		<div class="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-md z-40 pointer-events-none select-none animate-in fade-in duration-200">
			<div class="relative flex flex-col items-center p-8 rounded-3xl bg-zinc-950/90 border border-pink-500/30 shadow-2xl shadow-pink-500/20 max-w-xs text-center space-y-4 overflow-hidden">
				<!-- Fluid Iridescent Glowing Orb with Floating Sparkles -->
				<div class="relative w-24 h-24 flex items-center justify-center">
					<!-- Pulsing outer glow aura -->
					<div class="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500/40 via-purple-500/30 to-cyan-400/40 blur-xl animate-pulse"></div>
					<!-- Fluid morphing bouncy blob -->
					<div class="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-400 shadow-lg shadow-pink-500/40 flex items-center justify-center animate-bounce">
						<Sparkles class="w-7 h-7 text-white animate-spin [animation-duration:4s]" />
					</div>
					<!-- Orbiting decorative floating particle stars -->
					<div class="absolute -top-1 right-2 text-pink-300 text-xs animate-ping [animation-duration:2s]">✦</div>
					<div class="absolute bottom-1 -left-1 text-cyan-300 text-xs animate-ping [animation-duration:2.5s]">★</div>
				</div>

				<div class="space-y-1 z-10">
					<h3 class="font-bold text-sm text-zinc-100 flex items-center justify-center gap-1.5">
						<span>{i18n.t('loading_model')}</span>
						<span class="inline-flex gap-0.5">
							<span class="w-1 h-1 rounded-full bg-pink-400 animate-bounce [animation-delay:0ms]"></span>
							<span class="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]"></span>
							<span class="w-1 h-1 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]"></span>
						</span>
					</h3>
					<p class="text-xs text-pink-300/90 font-mono font-medium truncate max-w-[220px]">
						{rigging.modelName || 'Live2D Avatar'}
					</p>
				</div>

				<!-- Fluid Equalizer / Progress Waves -->
				<div class="flex items-center gap-1 pt-1">
					{#each [40, 70, 95, 60, 85, 50, 75] as height, idx}
						<div
							class="w-1 rounded-full bg-gradient-to-t from-pink-500 to-cyan-400 animate-pulse"
							style="height: {height / 4}px; animation-delay: {idx * 80}ms; animation-duration: 800ms;"
						></div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
