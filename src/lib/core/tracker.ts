import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { solveFaceLandmarks } from './solver';
import { globalSmoother } from './smoother';
import { rigging } from '#lib/stores/riggingStore.svelte';

export class FaceTracker {
	private landmarker: FaceLandmarker | null = null;
	private trackingVideo: HTMLVideoElement | null = null;
	private previewVideo: HTMLVideoElement | null = null;
	private canvasOverlay: HTMLCanvasElement | null = null;
	public stream: MediaStream | null = null;
	private animationFrameId: number | null = null;
	private lastVideoTime = -1;
	private isRunning = false;

	// Performance Tracking
	private frameCount = 0;
	private lastFpsCalcTime = performance.now();

	async initialize(): Promise<void> {
		if (this.landmarker) return;

		// Load MediaPipe WebAssembly vision bundle from public CDN (100% free Apache-2.0)
		const vision = await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
		);

		try {
			// Try GPU delegate first for hardware-accelerated tracking
			this.landmarker = await FaceLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath:
						'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
					delegate: 'GPU'
				},
				runningMode: 'VIDEO',
				numFaces: 1,
				outputFaceBlendshapes: true,
				outputFacialTransformationMatrixes: true
			});
			console.log('[FaceTracker] Initialized with GPU delegate');
		} catch (gpuErr) {
			console.warn('[FaceTracker] GPU delegate failed, falling back to CPU:', gpuErr);
			this.landmarker = await FaceLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath:
						'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
					delegate: 'CPU'
				},
				runningMode: 'VIDEO',
				numFaces: 1,
				outputFaceBlendshapes: true,
				outputFacialTransformationMatrixes: true
			});
			console.log('[FaceTracker] Initialized with CPU delegate');
		}
	}

	/**
	 * Ensures a persistent offscreen video element exists for reliable tracking,
	 * independent of UI state or whether PIP is minimized.
	 */
	private getOrCreateTrackingVideo(): HTMLVideoElement {
		if (this.trackingVideo && document.body.contains(this.trackingVideo)) {
			return this.trackingVideo;
		}

		let video = document.getElementById('mirunova-internal-tracker-video') as HTMLVideoElement | null;
		if (!video) {
			video = document.createElement('video');
			video.id = 'mirunova-internal-tracker-video';
			video.autoplay = true;
			video.playsInline = true;
			video.muted = true;
			// Kept in DOM with minimal size so browser renders frames reliably
			video.style.position = 'fixed';
			video.style.bottom = '0';
			video.style.right = '0';
			video.style.width = '1px';
			video.style.height = '1px';
			video.style.opacity = '0.01';
			video.style.pointerEvents = 'none';
			video.style.zIndex = '-9999';
			document.body.appendChild(video);
		}
		this.trackingVideo = video;
		return video;
	}

	async startCamera(
		previewVideoEl?: HTMLVideoElement | null,
		canvasEl?: HTMLCanvasElement | null
	): Promise<void> {
		this.previewVideo = previewVideoEl || null;

		// Only store canvasOverlay if it supports 2D context (avoid passing WebGL stage canvas)
		if (canvasEl) {
			try {
				const ctx = canvasEl.getContext('2d');
				if (ctx) {
					this.canvasOverlay = canvasEl;
				}
			} catch {
				this.canvasOverlay = null;
			}
		} else {
			this.canvasOverlay = null;
		}

		if (!this.landmarker) {
			await this.initialize();
		}

		if (!navigator?.mediaDevices?.getUserMedia) {
			const isIp =
				typeof window !== 'undefined' &&
				window.location.hostname !== 'localhost' &&
				window.location.hostname !== '127.0.0.1';
			throw new Error(
				isIp
					? `Akses webcam diblokir browser pada alamat IP (${window.location.hostname}). Browser mewajibkan HTTPS atau 'http://localhost:5173'.`
					: 'Webcam API (navigator.mediaDevices.getUserMedia) tidak tersedia atau tidak didukung di browser ini.'
			);
		}

		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 640 },
					height: { ideal: 480 },
					facingMode: 'user',
					frameRate: { ideal: 30 }
				},
				audio: false
			});
		} catch (err: any) {
			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				throw new Error('Izin kamera ditolak. Buka izin situs (klik ikon gembok di URL bar browser) lalu izinkan akses Kamera.');
			} else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
				throw new Error('Perangkat kamera (webcam) tidak terdeteksi pada sistem Anda.');
			} else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
				throw new Error('Kamera sedang digunakan oleh aplikasi lain (seperti OBS, Zoom, Discord, atau tab lain). Tutup aplikasi tersebut dan coba lagi.');
			}
			throw new Error(`Gagal membuka kamera: ${err.message || err.name}`);
		}

		const trackerVid = this.getOrCreateTrackingVideo();
		trackerVid.srcObject = this.stream;

		if (this.previewVideo) {
			this.previewVideo.srcObject = this.stream;
			this.previewVideo.play().catch(() => {});
		}

		// Await video playback ready with a timeout safeguard
		await new Promise<void>((resolve) => {
			let done = false;
			const onReady = () => {
				if (!done) {
					done = true;
					trackerVid.play().catch(() => {});
					resolve();
				}
			};

			if (trackerVid.readyState >= 2) {
				onReady();
			} else {
				trackerVid.onloadedmetadata = onReady;
				trackerVid.oncanplay = onReady;
				setTimeout(onReady, 2500); // 2.5s fallback timeout
			}
		});

		this.isRunning = true;
		rigging.isCameraActive = true;
		this.lastVideoTime = -1;
		this.processLoop();
	}

	/**
	 * Allows attaching a preview video/canvas dynamically (e.g. when PIP is opened/unminimized)
	 */
	setPreviewElements(previewVideoEl?: HTMLVideoElement | null, canvasEl?: HTMLCanvasElement | null) {
		this.previewVideo = previewVideoEl || null;
		if (previewVideoEl && this.stream) {
			previewVideoEl.srcObject = this.stream;
			previewVideoEl.play().catch(() => {});
		}
		if (canvasEl) {
			try {
				const ctx = canvasEl.getContext('2d');
				if (ctx) this.canvasOverlay = canvasEl;
			} catch {
				this.canvasOverlay = null;
			}
		} else {
			this.canvasOverlay = null;
		}
	}

	stopCamera(): void {
		this.isRunning = false;
		rigging.isCameraActive = false;
		rigging.isFaceDetected = false;

		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}

		if (this.trackingVideo) {
			this.trackingVideo.srcObject = null;
		}

		if (this.previewVideo) {
			this.previewVideo.srcObject = null;
			this.previewVideo = null;
		}

		if (this.canvasOverlay) {
			const ctx = this.canvasOverlay.getContext('2d');
			ctx?.clearRect(0, 0, this.canvasOverlay.width, this.canvasOverlay.height);
			this.canvasOverlay = null;
		}
	}

	private processLoop = () => {
		if (!this.isRunning || !this.trackingVideo || !this.landmarker) return;

		const startTime = performance.now();
		const vid = this.trackingVideo;

		if (vid.currentTime !== this.lastVideoTime && vid.readyState >= 2) {
			this.lastVideoTime = vid.currentTime;

			try {
				const results = this.landmarker.detectForVideo(vid, startTime);

				if (results.faceLandmarks && results.faceLandmarks.length > 0) {
					rigging.isFaceDetected = true;
					const landmarks = results.faceLandmarks[0];

					// Build blendshapes lookup map
					const blendshapesMap = new Map<string, number>();
					if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
						for (const cat of results.faceBlendshapes[0].categories) {
							blendshapesMap.set(cat.categoryName, cat.score);
						}
					}

					// Extract facial transformation matrix if available
					const matrix = results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0
						? results.facialTransformationMatrixes[0]
						: null;

					// Sync smoother alpha
					globalSmoother.setAlpha(rigging.smoothingAmount);

					// Solve parameters with high-precision matrix and config
					const solved = solveFaceLandmarks(
						landmarks,
						blendshapesMap,
						{
							yaw: rigging.calibrationYaw,
							pitch: rigging.calibrationPitch,
							roll: rigging.calibrationRoll
						},
						matrix,
						{
							sensitivity: rigging.trackingSensitivity,
							deadzone: rigging.deadzoneThreshold,
							eyeBlinkLinked: rigging.eyeBlinkLinked
						}
					);

					// Apply profile-specific adaptive smoothing & store to rigging store
					rigging.setLiveValue('ParamAngleX', globalSmoother.smooth('ParamAngleX', solved.yaw, 'angle'));
					rigging.setLiveValue('ParamAngleY', globalSmoother.smooth('ParamAngleY', solved.pitch, 'angle'));
					rigging.setLiveValue('ParamAngleZ', globalSmoother.smooth('ParamAngleZ', solved.roll, 'angle'));
					rigging.setLiveValue('ParamEyeLOpen', globalSmoother.smooth('ParamEyeLOpen', solved.eyeBlinkL, 'blink'));
					rigging.setLiveValue('ParamEyeROpen', globalSmoother.smooth('ParamEyeROpen', solved.eyeBlinkR, 'blink'));
					rigging.setLiveValue('ParamEyeBallX', globalSmoother.smooth('ParamEyeBallX', solved.eyeBallX, 'generic'));
					rigging.setLiveValue('ParamEyeBallY', globalSmoother.smooth('ParamEyeBallY', solved.eyeBallY, 'generic'));
					rigging.setLiveValue('ParamBrowLY', globalSmoother.smooth('ParamBrowLY', solved.browL, 'generic'));
					rigging.setLiveValue('ParamBrowRY', globalSmoother.smooth('ParamBrowRY', solved.browR, 'generic'));
					rigging.setLiveValue('ParamMouthOpenY', globalSmoother.smooth('ParamMouthOpenY', solved.mouthOpen, 'mouth'));
					rigging.setLiveValue('ParamMouthForm', globalSmoother.smooth('ParamMouthForm', solved.mouthForm, 'mouth'));
					rigging.setLiveValue('ParamCheek', globalSmoother.smooth('ParamCheek', solved.cheekPuff, 'generic'));
					rigging.setLiveValue('ParamBodyAngleX', globalSmoother.smooth('ParamBodyAngleX', solved.bodyAngleX, 'angle'));
					rigging.setLiveValue('ParamBodyAngleY', globalSmoother.smooth('ParamBodyAngleY', solved.bodyAngleY, 'angle'));
					rigging.setLiveValue('ParamBodyAngleZ', globalSmoother.smooth('ParamBodyAngleZ', solved.bodyAngleZ, 'angle'));
					rigging.setLiveValue('ParamArmLA', globalSmoother.smooth('ParamArmLA', solved.armLA, 'generic'));
					rigging.setLiveValue('ParamArmRA', globalSmoother.smooth('ParamArmRA', solved.armRA, 'generic'));

					// Draw wireframe overlay if enabled
					if (this.canvasOverlay && rigging.showLandmarksMesh) {
						this.drawLandmarksOverlay(landmarks);
					}
				} else {
					rigging.isFaceDetected = false;
					if (this.canvasOverlay) {
						const ctx = this.canvasOverlay.getContext('2d');
						ctx?.clearRect(0, 0, this.canvasOverlay.width, this.canvasOverlay.height);
					}
				}
			} catch (err) {
				console.warn('[FaceTracker] Detection error:', err);
			}

			// Performance calculation (FPS & Latency)
			this.frameCount++;
			const now = performance.now();
			rigging.latencyMs = Math.round(now - startTime);

			if (now - this.lastFpsCalcTime >= 1000) {
				rigging.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
				this.frameCount = 0;
				this.lastFpsCalcTime = now;
			}
		}

		this.animationFrameId = requestAnimationFrame(this.processLoop);
	};

	private drawLandmarksOverlay(landmarks: Array<{ x: number; y: number; z: number }>): void {
		if (!this.canvasOverlay) return;
		const ctx = this.canvasOverlay.getContext('2d');
		if (!ctx) return;

		const width = this.canvasOverlay.width;
		const height = this.canvasOverlay.height;

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = '#06b6d4'; // Cyan neon accent
		ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
		ctx.lineWidth = 1;

		// Draw key landmarks points (every 3rd landmark to optimize performance)
		for (let i = 0; i < landmarks.length; i += 3) {
			const pt = landmarks[i];
			const x = pt.x * width;
			const y = pt.y * height;
			ctx.beginPath();
			ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
			ctx.fill();
		}
	}
}

export const tracker = new FaceTracker();
