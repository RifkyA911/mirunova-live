import { FilesetResolver, FaceLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { solveFaceLandmarks } from './solver';
import { globalSmoother } from './smoother';
import { rigging } from '#lib/stores/riggingStore.svelte';

export class FaceTracker {
	private landmarker: FaceLandmarker | null = null;
	private handLandmarker: HandLandmarker | null = null;
	private trackingVideo: HTMLVideoElement | null = null;
	private previewVideo: HTMLVideoElement | null = null;
	private canvasOverlay: HTMLCanvasElement | null = null;
	public stream: MediaStream | null = null;
	private animationFrameId: number | null = null;
	private lastRawYaw: number = 0;
	private lastRawPitch: number = 0;
	private lastRawRoll: number = 0;
	private lastVideoTime = -1;
	private isRunning = false;

	// Performance Tracking & Reusable State Buffers (Zero Allocation Mandate)
	private frameCount = 0;
	private frameLoopIndex = 0;
	private lastFpsCalcTime = performance.now();
	private lastLatencyCalcTime = performance.now();
	private consecutiveLostFrames = 0;
	private cachedHandsList: Array<Array<{ x: number; y: number; z: number }>> = [];
	private blendshapesMap = new Map<string, number>();
	private handDataBuffer = {
		leftDetected: false,
		rightDetected: false,
		armLA: 0,
		armRA: 0,
		gestureL: 'none' as 'high_five' | 'wave' | 'open' | 'fist' | 'peace' | 'none',
		gestureR: 'none' as 'high_five' | 'wave' | 'open' | 'fist' | 'peace' | 'none',
		isHighFiveL: false,
		isHighFiveR: false
	};

	async initialize(): Promise<void> {
		if (this.landmarker && this.handLandmarker) return;

		// Load MediaPipe WebAssembly vision bundle from public CDN (100% free Apache-2.0)
		const vision = await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
		);

		// 1. Initialize FaceLandmarker
		if (!this.landmarker) {
			try {
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
				console.log('[FaceTracker] FaceLandmarker initialized with GPU');
			} catch (gpuErr) {
				console.warn('[FaceTracker] Face GPU failed, falling back to CPU:', gpuErr);
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
				console.log('[FaceTracker] FaceLandmarker initialized with CPU');
			}
		}

		// 2. Initialize HandLandmarker for Hand/Arm Gestures
		if (!this.handLandmarker) {
			try {
				this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
					baseOptions: {
						modelAssetPath:
							'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
						delegate: 'GPU'
					},
					runningMode: 'VIDEO',
					numHands: 2
				});
				console.log('[HandTracker] HandLandmarker initialized with GPU');
			} catch (gpuHandErr) {
				console.warn('[HandTracker] Hand GPU failed, falling back to CPU:', gpuHandErr);
				try {
					this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
						baseOptions: {
							modelAssetPath:
								'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
							delegate: 'CPU'
						},
						runningMode: 'VIDEO',
						numHands: 2
					});
					console.log('[HandTracker] HandLandmarker initialized with CPU');
				} catch (cpuHandErr) {
					console.warn('[HandTracker] HandLandmarker could not be initialized:', cpuHandErr);
				}
			}
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
			video.width = 640;
			video.height = 480;
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

		// Ensure existing camera tracks are stopped and released before opening a new stream
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
			await new Promise((r) => setTimeout(r, 250));
		}

		// Always fetch current devices (non-intrusively without opening temporary stream if labels exist)
		let availableDevices = await this.getAvailableVideoDevices(false);
		if (availableDevices.length === 0 || !availableDevices.some((d) => Boolean(d.label))) {
			availableDevices = await this.getAvailableVideoDevices(true);
		}

		// Determine target device and label
		let targetDeviceId = rigging.cameraDeviceId;
		let targetLabel = rigging.activeCameraLabel;

		// Identify physical hardware webcam (Laptop Integrated Camera, SunplusIT, Realtek, etc.)
		const physicalDevice =
			availableDevices.find((d) => /integrated|internal|built-in|chicony|realtek|sunplus/i.test(d.label)) ||
			availableDevices.find((d) => !/iriun|poco|virtual|nizima|obs|droidcam/i.test(d.label));

		// Check if user specifically requested an Integrated webcam or hasn't selected any
		const isIntegratedRequested =
			!targetDeviceId ||
			(targetLabel && /integrated|internal|built-in/i.test(targetLabel)) ||
			(availableDevices.some((d) => d.deviceId === targetDeviceId && /integrated|internal|built-in/i.test(d.label)));

		if (isIntegratedRequested || !targetDeviceId) {
			if (physicalDevice) {
				targetDeviceId = physicalDevice.deviceId;
				targetLabel = physicalDevice.label;
				rigging.cameraDeviceId = targetDeviceId;
				rigging.activeCameraLabel = targetLabel;
			}
		} else if (targetDeviceId && availableDevices.length > 0) {
			const exists = availableDevices.some((d) => d.deviceId === targetDeviceId);
			if (!exists) {
				// DeviceId hash changed in this browser session; match by label
				const byLabel = targetLabel ? availableDevices.find((d) => d.label === targetLabel) : null;
				if (byLabel) {
					targetDeviceId = byLabel.deviceId;
					rigging.cameraDeviceId = targetDeviceId;
				}
			}
		}

		// Safe resolution constraints: SunplusIT / Realtek laptop integrated cameras support max 1280x720 @ 30fps
		const targetWidth = rigging.cameraResolution === '480p' ? 640 : 1280;
		const targetHeight = rigging.cameraResolution === '480p' ? 480 : 720;

		let lastError: any = null;
		let readableError: any = null;

		const tryAcquire = async (constraints: MediaStreamConstraints, label: string): Promise<boolean> => {
			try {
				this.stream = await navigator.mediaDevices.getUserMedia(constraints);
				console.log(`[FaceTracker] ${label} succeeded`);
				return true;
			} catch (err: any) {
				console.warn(`[FaceTracker] ${label} failed:`, err);
				if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
					readableError = err;
				}
				lastError = err;
				// Crucial on Windows: allow 200ms for DirectShow COM objects to release before next attempt
				await new Promise((r) => setTimeout(r, 200));
				return false;
			}
		};

		// Tier 1: Loose target deviceId with gentle resolution constraints
		if (targetDeviceId) {
			await tryAcquire({
				video: {
					deviceId: targetDeviceId,
					width: { ideal: targetWidth },
					height: { ideal: targetHeight },
					frameRate: { ideal: 30 }
				},
				audio: false
			}, 'Tier 1 loose target with resolution');
		}

		// Tier 2: Loose target deviceId with NO constraints (hardware native default format)
		if (!this.stream && targetDeviceId) {
			await tryAcquire({
				video: { deviceId: targetDeviceId },
				audio: false
			}, 'Tier 2 loose target default format');
		}

		// Tier 3: Exact target deviceId with NO constraints
		if (!this.stream && targetDeviceId) {
			await tryAcquire({
				video: { deviceId: { exact: targetDeviceId } },
				audio: false
			}, 'Tier 3 exact target default format');
		}

		// Tier 4: If target device failed and physical camera exists, try physical camera directly
		if (!this.stream && physicalDevice && physicalDevice.deviceId !== targetDeviceId) {
			const ok = await tryAcquire({
				video: { deviceId: physicalDevice.deviceId },
				audio: false
			}, 'Tier 4 fallback to physical hardware camera');
			if (ok) {
				targetDeviceId = physicalDevice.deviceId;
				targetLabel = physicalDevice.label;
			}
		}

		// Tier 5: Available devices sweep
		if (!this.stream && availableDevices.length > 0) {
			for (const dev of availableDevices) {
				if (!dev.deviceId || dev.deviceId === targetDeviceId) continue;
				const ok = await tryAcquire({
					video: { deviceId: dev.deviceId },
					audio: false
				}, `Tier 5 sweep device: ${dev.label}`);
				if (ok) {
					targetDeviceId = dev.deviceId;
					targetLabel = dev.label;
					break;
				}
			}
		}

		// Tier 6: Universal fallback
		if (!this.stream) {
			await tryAcquire({ video: true, audio: false }, 'Tier 6 universal video:true fallback');
		}

		if (!this.stream) {
			const err = readableError || lastError;
			if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
				throw new Error('Izin kamera ditolak. Buka izin situs (klik ikon gembok di URL bar browser) lalu izinkan akses Kamera.');
			} else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
				throw new Error('Kamera sedang sibuk atau dikunci hardware (NotReadableError). Pada laptop Lenovo Legion, periksa tombol Fn+F8 atau slider fisik E-Shutter di sisi kanan laptop, dan pastikan tidak ada aplikasi lain (OBS/Zoom/Discord) yang sedang memakai kamera.');
			} else if (availableDevices.length === 0 && (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError')) {
				throw new Error('Perangkat kamera (webcam) tidak ditemukan. Pastikan kamera laptop/USB terhubung dan akses kamera diaktifkan di Windows Settings > Privacy & security > Camera.');
			} else if (err?.name === 'OverconstrainedError') {
				throw new Error('Format resolusi kamera yang diminta tidak didukung oleh perangkat webcam.');
			}
			throw new Error(`Gagal membuka kamera: ${err?.message || err?.name || 'Driver webcam tidak merespons'}. Pastikan tombol fisik E-Shutter laptop aktif dan muat ulang halaman.`);
		}

		// Read and record the actual active hardware track and deviceId
		const activeStream = this.stream as MediaStream | null;
		const activeTrack = activeStream ? activeStream.getVideoTracks()[0] : null;
		if (activeTrack) {
			const settings = activeTrack.getSettings();
			// Verify if user requested integrated camera, but Windows gave Iriun / Poco:
			if (isIntegratedRequested && /iriun|poco|virtual/i.test(activeTrack.label)) {
				const realHardware = availableDevices.find((d) => /integrated|internal|built-in/i.test(d.label));
				if (realHardware && realHardware.deviceId !== settings.deviceId) {
					try {
						activeTrack.stop();
						await new Promise((r) => setTimeout(r, 200));
						const forcedStream = await navigator.mediaDevices.getUserMedia({
							video: { deviceId: realHardware.deviceId },
							audio: false
						});
						this.stream = forcedStream;
						const forcedTrack = forcedStream.getVideoTracks()[0];
						rigging.cameraDeviceId = realHardware.deviceId;
						rigging.activeCameraLabel = forcedTrack?.label || realHardware.label;
					} catch (forceErr) {
						console.warn('[FaceTracker] Forcing hardware failed, using active stream:', forceErr);
						rigging.cameraDeviceId = settings.deviceId || '';
						rigging.activeCameraLabel = activeTrack.label || 'Webcam';
					}
				} else {
					rigging.cameraDeviceId = settings.deviceId || '';
					rigging.activeCameraLabel = activeTrack.label || 'Webcam';
				}
			} else {
				rigging.cameraDeviceId = settings.deviceId || rigging.cameraDeviceId;
				rigging.activeCameraLabel = activeTrack.label || 'Webcam';
			}
			rigging.persist();
			console.log('[FaceTracker] Active camera stream initialized:', rigging.activeCameraLabel);
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
		rigging.isHandLDetected = false;
		rigging.isHandRDetected = false;

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

	calibrate(): boolean {
		if (!this.isRunning || !rigging.isFaceDetected) {
			rigging.showToast('Kamera belum aktif atau wajah belum terdeteksi.');
			return false;
		}
		rigging.calibrateCenter(this.lastRawYaw, this.lastRawPitch, this.lastRawRoll);
		rigging.showToast('✓ Kalibrasi Berhasil! Posisi netral kepala Anda telah disimpan.');
		return true;
	}

	async switchCamera(deviceId?: string, resolution?: '1080p' | '720p' | '480p'): Promise<boolean> {
		if (deviceId !== undefined) {
			rigging.cameraDeviceId = deviceId;
			const devs = await this.getAvailableVideoDevices(false);
			const found = devs.find((d) => d.deviceId === deviceId);
			if (found) {
				rigging.activeCameraLabel = found.label;
			}
		}
		if (resolution !== undefined) rigging.cameraResolution = resolution;
		rigging.persist();

		if (!this.isRunning) return true;

		const prevVid = this.previewVideo;
		const prevCanvas = this.canvasOverlay;

		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
			await new Promise((r) => setTimeout(r, 250));
		}

		try {
			await this.startCamera(prevVid, prevCanvas);
			const label = rigging.activeCameraLabel || 'Webcam';
			rigging.showToast(`✓ Kamera aktif: ${label}`);
			return true;
		} catch (err: any) {
			console.error('Failed to switch camera:', err);
			rigging.showToast(`Gagal mengganti kamera: ${err.message || err.name}`);
			return false;
		}
	}

	async getAvailableVideoDevices(requestPermissionIfEmpty: boolean = true): Promise<Array<{ deviceId: string; label: string }>> {
		if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return [];
		try {
			let devices = await navigator.mediaDevices.enumerateDevices();
			let videoDevices = devices.filter((d) => d.kind === 'videoinput');

			if (requestPermissionIfEmpty && videoDevices.length > 0 && !videoDevices.some((d) => Boolean(d.label))) {
				let tempStream: MediaStream | null = null;
				try {
					tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
				} catch {
					// Fallback: probe specific enumerated devices if default virtual camera failed
					for (const dev of videoDevices) {
						if (!dev.deviceId) continue;
						try {
							tempStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: dev.deviceId }, audio: false });
							break;
						} catch {}
					}
				}
				if (tempStream) {
					tempStream.getTracks().forEach((t) => t.stop());
					// Allow 150ms for Windows DirectShow driver to fully close the camera handle
					await new Promise((r) => setTimeout(r, 150));
					devices = await navigator.mediaDevices.enumerateDevices();
					videoDevices = devices.filter((d) => d.kind === 'videoinput');
				}
			}

			return videoDevices.map((d, idx) => ({
				deviceId: d.deviceId,
				label: d.label || `Camera ${idx + 1} (${d.deviceId.slice(0, 6)}...)`
			}));
		} catch {
			return [];
		}
	}

	getVideoResolution(): { width: number; height: number; frameRate: number } | null {
		if (!this.stream) return null;
		const track = this.stream.getVideoTracks()[0];
		if (!track) return null;
		const settings = track.getSettings();
		return {
			width: settings.width || 0,
			height: settings.height || 0,
			frameRate: Math.round(settings.frameRate || 30)
		};
	}

	private processLoop = () => {
		if (!this.isRunning || !this.trackingVideo || !this.landmarker) return;

		const startTime = performance.now();
		const vid = this.trackingVideo;

		if (vid.currentTime !== this.lastVideoTime && vid.readyState >= 2 && vid.videoWidth > 0) {
			this.lastVideoTime = vid.currentTime;

			try {
				// 1. Face Landmark Tracking
				const faceResults = this.landmarker.detectForVideo(vid, startTime);

				// 2. Hand Landmark Tracking with Gesture & High-Five Recognition (Throttled to every 2nd frame for 50% GPU/CPU savings)
				this.frameLoopIndex++;
				const shouldRunHandInference = this.frameLoopIndex % 2 === 0;

				let handsList: Array<Array<{ x: number; y: number; z: number }>> = this.cachedHandsList;
				const handData = this.handDataBuffer;

				if (this.handLandmarker && rigging.enableHandTracking) {
					if (shouldRunHandInference) {
						try {
							const handResults = this.handLandmarker.detectForVideo(vid, startTime);
							if (handResults.landmarks && handResults.landmarks.length > 0) {
								handsList = handResults.landmarks;
								this.cachedHandsList = handsList;
								handData.leftDetected = false;
								handData.rightDetected = false;
								handData.armLA = 0;
								handData.armRA = 0;
								handData.gestureL = 'none';
								handData.gestureR = 'none';
								handData.isHighFiveL = false;
								handData.isHighFiveR = false;

								for (let i = 0; i < handResults.landmarks.length; i++) {
									const handPts = handResults.landmarks[i];
									const wrist = handPts[0];
									const middleTip = handPts[12];
									const handY = Math.min(wrist.y, middleTip.y);

									// Natural mirror mapping:
									// In mirrored camera preview (scale-x-[-1]), wrist.x < 0.5 appears on user's right side (screen right).
									// In Live2D, screen right is the model's anatomical LEFT arm (ParamArmLA).
									// wrist.x >= 0.5 appears on screen left, which is model's RIGHT arm (ParamArmRA).
									const isScreenRight = wrist.x < 0.5;

									// Elevation calculation: 0 = top of screen, 1 = bottom
									const elevation = Math.max(0, Math.min(1, (0.75 - handY) / 0.5));
									let armAngle = elevation * 30;

									// Finger extension Euclidean distance checks
									const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
										Math.hypot(p1.x - p2.x, p1.y - p2.y);

									const isThumbOpen = dist(handPts[4], wrist) > dist(handPts[2], wrist) * 1.15;
									const isIndexOpen = dist(handPts[8], wrist) > dist(handPts[6], wrist) * 1.15;
									const isMiddleOpen = dist(handPts[12], wrist) > dist(handPts[10], wrist) * 1.15;
									const isRingOpen = dist(handPts[16], wrist) > dist(handPts[14], wrist) * 1.15;
									const isPinkyOpen = dist(handPts[20], wrist) > dist(handPts[18], wrist) * 1.15;

									const openFingers = (isIndexOpen ? 1 : 0) + (isMiddleOpen ? 1 : 0) + (isRingOpen ? 1 : 0) + (isPinkyOpen ? 1 : 0) + (isThumbOpen ? 1 : 0);
									const isOpenPalm = openFingers >= 4;
									const isPeace = isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen;
									const isFist = openFingers <= 1;

									let gesture: 'high_five' | 'wave' | 'open' | 'fist' | 'peace' | 'none' = 'none';
									let isHighFive = false;

									if (isOpenPalm && elevation > 0.35) {
										gesture = 'high_five';
										isHighFive = true;
										armAngle = Math.max(armAngle, 28);
									} else if (isOpenPalm) {
										gesture = 'open';
									} else if (isPeace) {
										gesture = 'peace';
									} else if (isFist) {
										gesture = 'fist';
									}

									if (isScreenRight) {
										handData.leftDetected = true;
										handData.armLA = armAngle;
										handData.gestureL = gesture;
										handData.isHighFiveL = isHighFive;
										rigging.isHandLDetected = true;
										rigging.handLGesture = gesture;
									} else {
										handData.rightDetected = true;
										handData.armRA = armAngle;
										handData.gestureR = gesture;
										handData.isHighFiveR = isHighFive;
										rigging.isHandRDetected = true;
										rigging.handRGesture = gesture;
									}
								}
							} else {
								this.cachedHandsList = [];
								handsList = [];
								rigging.isHandLDetected = false;
								rigging.isHandRDetected = false;
								rigging.handLGesture = 'none';
								rigging.handRGesture = 'none';
							}
						} catch {
							// Hand detection frame error ignored
						}
					}
				} else {
					this.cachedHandsList = [];
					handsList = [];
					handData.leftDetected = false;
					handData.rightDetected = false;
					handData.armLA = 0;
					handData.armRA = 0;
					handData.gestureL = 'none';
					handData.gestureR = 'none';
					rigging.isHandLDetected = false;
					rigging.isHandRDetected = false;
					rigging.handLGesture = 'none';
					rigging.handRGesture = 'none';
				}

				if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
					rigging.isFaceDetected = true;
					this.consecutiveLostFrames = 0;
					const landmarks = faceResults.faceLandmarks[0];

					// Build blendshapes lookup map (reuse Map to prevent GC pressure)
					this.blendshapesMap.clear();
					if (faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
						for (const cat of faceResults.faceBlendshapes[0].categories) {
							this.blendshapesMap.set(cat.categoryName, cat.score);
						}
					}

					// Extract facial transformation matrix if available
					const matrix = faceResults.facialTransformationMatrixes && faceResults.facialTransformationMatrixes.length > 0
						? faceResults.facialTransformationMatrixes[0]
						: null;

					// Sync smoother configuration with real user slider values
					globalSmoother.setSmoothingConfig(rigging.smoothingAmount, rigging.jitterReduction);

					// Capture raw uncalibrated pose for precise calibration snapshot
					const rawPose = solveFaceLandmarks(
						landmarks,
						this.blendshapesMap,
						{ yaw: 0, pitch: 0, roll: 0 },
						matrix,
						{ sensitivity: 1.0, deadzone: 0 }
					);
					this.lastRawYaw = rawPose.yaw;
					this.lastRawPitch = rawPose.pitch;
					this.lastRawRoll = rawPose.roll;

					// Solve parameters with high-precision matrix, mouth expressions, and hand data
					const solved = solveFaceLandmarks(
						landmarks,
						this.blendshapesMap,
						{
							yaw: rigging.calibrationYaw,
							pitch: rigging.calibrationPitch,
							roll: rigging.calibrationRoll
						},
						matrix,
						{
							sensitivity: rigging.trackingSensitivity,
							deadzone: rigging.deadzoneThreshold,
							eyeBlinkLinked: rigging.eyeBlinkLinked,
							invertPitch: rigging.invertPitch,
							invertYaw: rigging.invertYaw,
							mouthSensitivity: rigging.mouthSensitivity,
							mouthTrackingMode: rigging.mouthTrackingMode,
							enableFaceTracking: rigging.enableFaceTracking,
							enableBodyTracking: rigging.enableBodyTracking,
							bodyTrackingIntensity: rigging.bodyTrackingIntensity
						},
						handData
					);

					// Apply profile-specific adaptive smoothing & store to rigging store
					const isFaceActive = rigging.enableFaceTracking;
					const eyeTargetL = isFaceActive ? (rigging.mirrorEyes ? solved.eyeBlinkR : solved.eyeBlinkL) : 1.0;
					const eyeTargetR = isFaceActive ? (rigging.mirrorEyes ? solved.eyeBlinkL : solved.eyeBlinkR) : 1.0;
					const eyeSmileTargetL = isFaceActive ? (rigging.mirrorEyes ? (solved.eyeSmileR ?? 0) : (solved.eyeSmileL ?? 0)) : 0;
					const eyeSmileTargetR = isFaceActive ? (rigging.mirrorEyes ? (solved.eyeSmileL ?? 0) : (solved.eyeSmileR ?? 0)) : 0;
					const browTargetL = isFaceActive ? (rigging.mirrorEyes ? solved.browR : solved.browL) : 0;
					const browTargetR = isFaceActive ? (rigging.mirrorEyes ? solved.browL : solved.browR) : 0;

					rigging.setLiveValue('ParamAngleX', isFaceActive ? globalSmoother.smooth('ParamAngleX', solved.yaw, 'angle') : 0);
					rigging.setLiveValue('ParamAngleY', isFaceActive ? globalSmoother.smooth('ParamAngleY', solved.pitch, 'angle') : 0);
					rigging.setLiveValue('ParamAngleZ', isFaceActive ? globalSmoother.smooth('ParamAngleZ', solved.roll, 'angle') : 0);
					rigging.setLiveValue('ParamEyeLOpen', globalSmoother.smooth('ParamEyeLOpen', eyeTargetL, 'blink'));
					rigging.setLiveValue('ParamEyeROpen', globalSmoother.smooth('ParamEyeROpen', eyeTargetR, 'blink'));
					rigging.setLiveValue('ParamEyeLSmile', eyeSmileTargetL);
					rigging.setLiveValue('ParamEyeRSmile', eyeSmileTargetR);
					rigging.setLiveValue('ParamEyeBallX', isFaceActive ? globalSmoother.smooth('ParamEyeBallX', solved.eyeBallX, 'generic') : 0);
					rigging.setLiveValue('ParamEyeBallY', isFaceActive ? globalSmoother.smooth('ParamEyeBallY', solved.eyeBallY, 'generic') : 0);
					rigging.setLiveValue('ParamBrowLY', isFaceActive ? globalSmoother.smooth('ParamBrowLY', browTargetL, 'generic') : 0);
					rigging.setLiveValue('ParamBrowRY', isFaceActive ? globalSmoother.smooth('ParamBrowRY', browTargetR, 'generic') : 0);
					rigging.setLiveValue('ParamBrowLForm', isFaceActive ? globalSmoother.smooth('ParamBrowLForm', solved.browFormL ?? 0, 'generic') : 0);
					rigging.setLiveValue('ParamBrowRForm', isFaceActive ? globalSmoother.smooth('ParamBrowRForm', solved.browFormR ?? 0, 'generic') : 0);
					rigging.setLiveValue('ParamBrowLAngle', isFaceActive ? globalSmoother.smooth('ParamBrowLAngle', browTargetL * 0.75, 'generic') : 0);
					rigging.setLiveValue('ParamBrowRAngle', isFaceActive ? globalSmoother.smooth('ParamBrowRAngle', browTargetR * 0.75, 'generic') : 0);
					rigging.setLiveValue('ParamMouthOpenY', isFaceActive ? globalSmoother.smooth('ParamMouthOpenY', solved.mouthOpen, 'mouth') : 0);
					rigging.setLiveValue('ParamMouthForm', isFaceActive ? globalSmoother.smooth('ParamMouthForm', solved.mouthForm, 'mouth') : 0);
					rigging.setLiveValue('ParamMouthX', isFaceActive ? globalSmoother.smooth('ParamMouthX', solved.mouthX, 'mouth') : 0);
					rigging.setLiveValue('ParamCheek', isFaceActive ? globalSmoother.smooth('ParamCheek', solved.cheekPuff, 'generic') : 0);
					rigging.setLiveValue('ParamBodyAngleX', globalSmoother.smooth('ParamBodyAngleX', solved.bodyAngleX, 'angle'));
					rigging.setLiveValue('ParamBodyAngleY', globalSmoother.smooth('ParamBodyAngleY', solved.bodyAngleY, 'angle'));
					rigging.setLiveValue('ParamBodyAngleZ', globalSmoother.smooth('ParamBodyAngleZ', solved.bodyAngleZ, 'angle'));
					rigging.setLiveValue('ParamArmLA', globalSmoother.smooth('ParamArmLA', solved.armLA, 'generic'));
					rigging.setLiveValue('ParamArmRA', globalSmoother.smooth('ParamArmRA', solved.armRA, 'generic'));
					rigging.setLiveValue('ParamArmLB', solved.isHighFiveL ? 1 : 0);
					rigging.setLiveValue('ParamArmRB', solved.isHighFiveR ? 1 : 0);
					rigging.setLiveValue('ParamHandAngleL', solved.isHighFiveL ? 15 : 0);
					rigging.setLiveValue('ParamHandAngleR', solved.isHighFiveR ? 15 : 0);

					// Draw wireframe overlay only if PIP is visible and NO blocking modal is active
					const isModalOpen = rigging.isSettingsModalOpen || rigging.isModelModalOpen || rigging.isThemeModalOpen || rigging.isObsModalOpen || rigging.isShortcutModalOpen;
					if (this.canvasOverlay && rigging.showCameraPip && !isModalOpen) {
						this.drawLandmarksOverlay(landmarks, handsList);
					}
				} else {
					rigging.isFaceDetected = false;
					this.consecutiveLostFrames++;

					if (rigging.holdPoseOnLoss) {
						// Anti-snap decay: if lost for > 6 frames (~100ms), gently return to neutral pose
						if (this.consecutiveLostFrames > 6) {
							const decay = 0.06;
							rigging.setLiveValue('ParamAngleX', globalSmoother.decayTowards('ParamAngleX', 0, decay));
							rigging.setLiveValue('ParamAngleY', globalSmoother.decayTowards('ParamAngleY', 0, decay));
							rigging.setLiveValue('ParamAngleZ', globalSmoother.decayTowards('ParamAngleZ', 0, decay));
							rigging.setLiveValue('ParamEyeBallX', globalSmoother.decayTowards('ParamEyeBallX', 0, decay));
							rigging.setLiveValue('ParamEyeBallY', globalSmoother.decayTowards('ParamEyeBallY', 0, decay));
							rigging.setLiveValue('ParamEyeLOpen', globalSmoother.decayTowards('ParamEyeLOpen', 1.0, decay));
							rigging.setLiveValue('ParamEyeROpen', globalSmoother.decayTowards('ParamEyeROpen', 1.0, decay));
							rigging.setLiveValue('ParamMouthOpenY', globalSmoother.decayTowards('ParamMouthOpenY', 0, decay));
							rigging.setLiveValue('ParamMouthForm', globalSmoother.decayTowards('ParamMouthForm', 0, decay));
							rigging.setLiveValue('ParamMouthX', globalSmoother.decayTowards('ParamMouthX', 0, decay));
							rigging.setLiveValue('ParamBodyAngleX', globalSmoother.decayTowards('ParamBodyAngleX', 0, decay));
							rigging.setLiveValue('ParamBodyAngleY', globalSmoother.decayTowards('ParamBodyAngleY', 0, decay));
							rigging.setLiveValue('ParamBodyAngleZ', globalSmoother.decayTowards('ParamBodyAngleZ', 0, decay));
						}
					}

					const isModalOpen = rigging.isSettingsModalOpen || rigging.isModelModalOpen || rigging.isThemeModalOpen || rigging.isObsModalOpen || rigging.isShortcutModalOpen;
					if (this.canvasOverlay && rigging.showCameraPip && !isModalOpen) {
						if (handsList.length > 0 && rigging.showLandmarksMesh) {
							this.drawLandmarksOverlay([], handsList);
						} else {
							const ctx = this.canvasOverlay.getContext('2d');
							ctx?.clearRect(0, 0, this.canvasOverlay.width, this.canvasOverlay.height);
						}
					}
				}
			} catch (err) {
				console.warn('[FaceTracker] Detection error:', err);
			}

			// Performance calculation (FPS & Latency) - Throttled independently to eliminate UI thrashing
			this.frameCount++;
			const now = performance.now();
			const frameLatency = Math.round(now - startTime);

			if (now - this.lastLatencyCalcTime >= 250) {
				rigging.latencyMs = frameLatency;
				this.lastLatencyCalcTime = now;
			}
			if (now - this.lastFpsCalcTime >= 1000) {
				rigging.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
				this.frameCount = 0;
				this.lastFpsCalcTime = now;
			}
		}

		this.animationFrameId = requestAnimationFrame(this.processLoop);
	};

	private drawLandmarksOverlay(
		faceLandmarks: Array<{ x: number; y: number; z: number }>,
		handsList: Array<Array<{ x: number; y: number; z: number }>>
	): void {
		if (!this.canvasOverlay) return;
		const ctx = this.canvasOverlay.getContext('2d');
		if (!ctx) return;

		const width = this.canvasOverlay.width;
		const height = this.canvasOverlay.height;
		const mode = rigging.cameraViewMode;

		if (mode === 'raw') {
			ctx.clearRect(0, 0, width, height);
			return;
		}

		// Kalidoface 3D Wireframe Privacy Mode (Screenshot 2026-10-13 230534.png)
		if (mode === 'wireframe') {
			ctx.fillStyle = '#222226';
			ctx.fillRect(0, 0, width, height);
		} else {
			ctx.clearRect(0, 0, width, height);
		}

		// 1. Draw 3D Face Wireframe or Dots
		if (faceLandmarks.length > 0) {
			// Mesh wireframe lines are ONLY drawn in pure 'wireframe' 3D mode
			if (mode === 'wireframe' && FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
				const tess = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
				ctx.save();
				ctx.strokeStyle = 'rgba(235, 235, 245, 0.72)';
				ctx.lineWidth = 0.75;
				ctx.beginPath();
				for (let i = 0; i < tess.length; i++) {
					const edge = tess[i];
					const p1 = faceLandmarks[edge.start];
					const p2 = faceLandmarks[edge.end];
					if (p1 && p2) {
						ctx.moveTo(p1.x * width, p1.y * height);
						ctx.lineTo(p2.x * width, p2.y * height);
					}
				}
				ctx.stroke();
				ctx.restore();
			}

			// In 'rig' (Webcam + Rig) mode: Blue/Cyan dots stepping by 4 (Clean & not crowded, matching commit ba77867)
			ctx.save();
			const dotColor = mode === 'wireframe' ? '#38bdf8' : '#06b6d4';
			const dotGlow = mode === 'wireframe' ? '#38bdf8' : '#06b6d4';
			const dotRadius = mode === 'wireframe' ? 1.2 : 1.5;
			const step = mode === 'wireframe' ? 1 : 4; // Step by 4 in rig mode so points are clean, not overcrowded

			ctx.fillStyle = dotColor;
			ctx.shadowColor = dotGlow;
			ctx.shadowBlur = 4;
			ctx.beginPath();
			for (let i = 0; i < faceLandmarks.length; i += step) {
				const pt = faceLandmarks[i];
				if (pt) {
					ctx.moveTo(pt.x * width + dotRadius, pt.y * height);
					ctx.arc(pt.x * width, pt.y * height, dotRadius, 0, 2 * Math.PI);
				}
			}
			ctx.fill();
			ctx.restore();

			// Draw glowing yellow pupils / iris (Landmarks 468 & 473)
			const pupilIndices = [468, 473];
			ctx.save();
			ctx.shadowColor = '#ffff00';
			ctx.shadowBlur = 8;
			ctx.fillStyle = '#ffeb3b';
			for (const pIdx of pupilIndices) {
				const pt = faceLandmarks[pIdx];
				if (pt) {
					ctx.beginPath();
					ctx.arc(pt.x * width, pt.y * height, 3.8, 0, 2 * Math.PI);
					ctx.fill();
				}
			}
			ctx.restore();
		}

		// 2. Draw Hand Landmarks (Titik-titik sendi tangan)
		if (handsList.length > 0 && rigging.enableHandTracking) {
			ctx.save();
			ctx.fillStyle = '#10b981';
			ctx.shadowColor = '#10b981';
			ctx.shadowBlur = 4;
			ctx.beginPath();
			for (const hand of handsList) {
				for (const pt of hand) {
					const x = pt.x * width;
					const y = pt.y * height;
					ctx.moveTo(x + 2.4, y);
					ctx.arc(x, y, 2.4, 0, 2 * Math.PI);
				}
			}
			ctx.fill();
			ctx.restore();

			// Skeleton lines only drawn in pure 'wireframe' mode
			if (mode === 'wireframe') {
				ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
				ctx.lineWidth = 1.5;
				ctx.beginPath();

				const fingerChains = [
					[0, 1, 2, 3, 4],
					[0, 5, 6, 7, 8],
					[0, 9, 10, 11, 12],
					[0, 13, 14, 15, 16],
					[0, 17, 18, 19, 20]
				];

				for (const hand of handsList) {
					for (const chain of fingerChains) {
						for (let i = 0; i < chain.length; i++) {
							const pt = hand[chain[i]];
							if (!pt) continue;
							if (i === 0) ctx.moveTo(pt.x * width, pt.y * height);
							else ctx.lineTo(pt.x * width, pt.y * height);
						}
					}
				}
				ctx.stroke();
			}
		}
	}
}

export const tracker = new FaceTracker();
