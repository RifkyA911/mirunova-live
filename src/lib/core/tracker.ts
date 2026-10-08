import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { solveFaceLandmarks } from './solver';
import { globalSmoother } from './smoother';
import { rigging } from '#lib/stores/riggingStore.svelte';

export class FaceTracker {
	private landmarker: FaceLandmarker | null = null;
	private videoElement: HTMLVideoElement | null = null;
	private canvasOverlay: HTMLCanvasElement | null = null;
	private stream: MediaStream | null = null;
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
	}

	async startCamera(
		videoEl: HTMLVideoElement,
		canvasEl?: HTMLCanvasElement
	): Promise<void> {
		this.videoElement = videoEl;
		this.canvasOverlay = canvasEl || null;

		if (!this.landmarker) {
			await this.initialize();
		}

		if (!navigator?.mediaDevices?.getUserMedia) {
			const isIp = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
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

		this.videoElement.srcObject = this.stream;
		await new Promise<void>((resolve) => {
			if (!this.videoElement) return resolve();
			this.videoElement.onloadedmetadata = () => {
				this.videoElement?.play();
				resolve();
			};
		});

		this.isRunning = true;
		rigging.isCameraActive = true;
		this.processLoop();
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

		if (this.videoElement) {
			this.videoElement.srcObject = null;
		}

		if (this.canvasOverlay) {
			const ctx = this.canvasOverlay.getContext('2d');
			ctx?.clearRect(0, 0, this.canvasOverlay.width, this.canvasOverlay.height);
		}
	}

	private processLoop = () => {
		if (!this.isRunning || !this.videoElement || !this.landmarker) return;

		const startTime = performance.now();

		if (this.videoElement.currentTime !== this.lastVideoTime) {
			this.lastVideoTime = this.videoElement.currentTime;

			const results = this.landmarker.detectForVideo(this.videoElement, startTime);

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

				// Solve parameters
				const solved = solveFaceLandmarks(landmarks, blendshapesMap, {
					yaw: rigging.calibrationYaw,
					pitch: rigging.calibrationPitch,
					roll: rigging.calibrationRoll
				});

				// Apply smoothing & store to rigging store
				rigging.setLiveValue('ParamAngleX', globalSmoother.smooth('ParamAngleX', solved.yaw));
				rigging.setLiveValue('ParamAngleY', globalSmoother.smooth('ParamAngleY', solved.pitch));
				rigging.setLiveValue('ParamAngleZ', globalSmoother.smooth('ParamAngleZ', solved.roll));
				rigging.setLiveValue('ParamEyeLOpen', globalSmoother.smooth('ParamEyeLOpen', solved.eyeBlinkL));
				rigging.setLiveValue('ParamEyeROpen', globalSmoother.smooth('ParamEyeROpen', solved.eyeBlinkR));
				rigging.setLiveValue('ParamEyeBallX', globalSmoother.smooth('ParamEyeBallX', solved.eyeBallX));
				rigging.setLiveValue('ParamEyeBallY', globalSmoother.smooth('ParamEyeBallY', solved.eyeBallY));
				rigging.setLiveValue('ParamBrowLY', globalSmoother.smooth('ParamBrowLY', solved.browL));
				rigging.setLiveValue('ParamBrowRY', globalSmoother.smooth('ParamBrowRY', solved.browR));
				rigging.setLiveValue('ParamMouthOpenY', globalSmoother.smooth('ParamMouthOpenY', solved.mouthOpen));
				rigging.setLiveValue('ParamMouthForm', globalSmoother.smooth('ParamMouthForm', solved.mouthForm));
				rigging.setLiveValue('ParamCheek', globalSmoother.smooth('ParamCheek', solved.cheekPuff));
				rigging.setLiveValue('ParamBodyAngleX', globalSmoother.smooth('ParamBodyAngleX', solved.bodyAngleX));
				rigging.setLiveValue('ParamBodyAngleY', globalSmoother.smooth('ParamBodyAngleY', solved.bodyAngleY));
				rigging.setLiveValue('ParamBodyAngleZ', globalSmoother.smooth('ParamBodyAngleZ', solved.bodyAngleZ));
				rigging.setLiveValue('ParamArmLA', globalSmoother.smooth('ParamArmLA', solved.armLA));
				rigging.setLiveValue('ParamArmRA', globalSmoother.smooth('ParamArmRA', solved.armRA));

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
