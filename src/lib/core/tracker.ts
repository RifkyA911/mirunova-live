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

		// Always fetch current devices with real hardware labels
		const availableDevices = await this.getAvailableVideoDevices(true);

		// Determine target device and label
		let targetDeviceId = rigging.cameraDeviceId;
		let targetLabel = rigging.activeCameraLabel;

		// If user explicitly chose or previously had a camera, try resolving its current deviceId
		if (targetDeviceId && availableDevices.length > 0) {
			const exists = availableDevices.some((d) => d.deviceId === targetDeviceId);
			if (!exists) {
				// DeviceId hash changed in this session; match by label!
				const byLabel = targetLabel
					? availableDevices.find((d) => d.label === targetLabel)
					: null;
				if (byLabel) {
					targetDeviceId = byLabel.deviceId;
					rigging.cameraDeviceId = targetDeviceId;
				}
			}
		}

		// Check if user specifically requested an Integrated / Hardware webcam or has no preference
		const isIntegratedRequested =
			(targetLabel && /integrated|internal|built-in/i.test(targetLabel)) ||
			(!targetDeviceId && availableDevices.some((d) => /integrated|internal|built-in/i.test(d.label))) ||
			(availableDevices.some((d) => d.deviceId === targetDeviceId && /integrated|internal|built-in/i.test(d.label)));

		if (isIntegratedRequested || !targetDeviceId) {
			const integratedDev =
				availableDevices.find((d) => /integrated|internal|built-in/i.test(d.label)) ||
				availableDevices.find((d) => !/iriun|poco|virtual|obs|droidcam/i.test(d.label));
			if (integratedDev) {
				targetDeviceId = integratedDev.deviceId;
				targetLabel = integratedDev.label;
				rigging.cameraDeviceId = targetDeviceId;
				rigging.activeCameraLabel = targetLabel;
			}
		}

		const targetWidth = rigging.cameraResolution === '1080p' ? 1920 : rigging.cameraResolution === '480p' ? 640 : 1280;
		const targetHeight = rigging.cameraResolution === '1080p' ? 1080 : rigging.cameraResolution === '480p' ? 480 : 720;
		// Keep frameRate ideal at 30fps with max 60fps so Realtek / laptop internal USB webcams never fail with OverconstrainedError on Windows discrete GPU mode!
		const frameRateConstraint = { ideal: 30, max: 60 };

		let lastError: any = null;

		// 1. Try Target Device (with flexible fallback levels)
		if (targetDeviceId) {
			// Tier 1a: Target device with ideal resolution
			try {
				this.stream = await navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: { exact: targetDeviceId },
						width: { ideal: targetWidth },
						height: { ideal: targetHeight },
						frameRate: frameRateConstraint
					},
					audio: false
				});
				console.log('[FaceTracker] Tier 1a exact camera succeeded:', targetDeviceId);
			} catch (errExact1: any) {
				lastError = errExact1;
				console.warn('[FaceTracker] Tier 1a exact failed, trying Tier 1b exact without resolution:', errExact1);
				// Tier 1b: Exact deviceId without resolution
				try {
					this.stream = await navigator.mediaDevices.getUserMedia({
						video: { deviceId: { exact: targetDeviceId } },
						audio: false
					});
					console.log('[FaceTracker] Tier 1b exact camera without resolution succeeded');
				} catch (errExact2: any) {
					lastError = errExact2;
					console.warn('[FaceTracker] Tier 1b exact failed, trying Tier 1c loose deviceId:', errExact2);
					// Tier 1c: Loose deviceId constraint (some DirectShow drivers refuse { exact })
					try {
						this.stream = await navigator.mediaDevices.getUserMedia({
							video: { deviceId: targetDeviceId },
							audio: false
						});
						console.log('[FaceTracker] Tier 1c loose deviceId succeeded');
					} catch (errLoose: any) {
						lastError = errLoose;
					}
				}
			}
		}

		// 2. If target device failed or not specified, and integrated was requested: try finding any non-virtual hardware camera
		if (!this.stream && isIntegratedRequested && availableDevices.length > 0) {
			const physicalDevices = availableDevices.filter((d) => !/iriun|poco|virtual|obs|droidcam/i.test(d.label));
			for (const dev of physicalDevices) {
				if (!dev.deviceId) continue;
				try {
					this.stream = await navigator.mediaDevices.getUserMedia({
						video: { deviceId: dev.deviceId },
						audio: false
					});
					if (this.stream) {
						console.log('[FaceTracker] Physical hardware camera selected:', dev.label);
						rigging.cameraDeviceId = dev.deviceId;
						rigging.activeCameraLabel = dev.label;
						break;
					}
				} catch {}
			}
		}

		// 3. Fallback: Sweep all available devices
		if (!this.stream && availableDevices.length > 0) {
			for (const dev of availableDevices) {
				if (!dev.deviceId) continue;
				try {
					this.stream = await navigator.mediaDevices.getUserMedia({
						video: { deviceId: dev.deviceId },
						audio: false
					});
					if (this.stream) {
						console.log('[FaceTracker] Available device fallback succeeded:', dev.label);
						rigging.cameraDeviceId = dev.deviceId;
						rigging.activeCameraLabel = dev.label;
						break;
					}
				} catch {}
			}
		}

		// 4. Ultimate fallback: navigator.mediaDevices.getUserMedia({ video: true })
		if (!this.stream) {
			try {
				this.stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: false
				});
				console.log('[FaceTracker] General video:true fallback succeeded');
			} catch (errGen: any) {
				lastError = errGen;
			}
		}

		if (!this.stream) {
			rigging.cameraDeviceId = '';
			rigging.persist();
			if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
				throw new Error('Izin kamera ditolak. Buka izin situs (klik ikon gembok di URL bar browser) lalu izinkan akses Kamera.');
			} else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
				throw new Error('Perangkat kamera (webcam) tidak ditemukan. Pastikan kamera laptop/USB terhubung dan akses kamera diaktifkan di Windows Settings > Privacy & security > Camera.');
			} else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
				throw new Error('Kamera sedang digunakan oleh aplikasi lain (seperti OBS Studio, Zoom, Discord, atau tab lain). Tutup aplikasi tersebut dan coba lagi.');
			} else if (lastError?.name === 'OverconstrainedError') {
				throw new Error('Kamera yang dipilih tidak dapat memenuhi format yang diminta browser.');
			}
			throw new Error(`Gagal membuka kamera: ${lastError?.message || lastError?.name || 'Tidak ada sinyal video'}`);
		}

		// Read and record the actual active hardware track and deviceId
		const activeTrack = this.stream.getVideoTracks()[0];
		if (activeTrack) {
			const settings = activeTrack.getSettings();
			// Verify if user requested integrated camera, but Windows gave Iriun / Poco:
			if (isIntegratedRequested && /iriun|poco|virtual/i.test(activeTrack.label)) {
				const realHardware = availableDevices.find((d) => /integrated|internal|built-in/i.test(d.label));
				if (realHardware && realHardware.deviceId !== settings.deviceId) {
					try {
						activeTrack.stop();
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
							mouthTrackingMode: rigging.mouthTrackingMode
						},
						handData
					);

					// Apply profile-specific adaptive smoothing & store to rigging store
					const eyeTargetL = rigging.mirrorEyes ? solved.eyeBlinkR : solved.eyeBlinkL;
					const eyeTargetR = rigging.mirrorEyes ? solved.eyeBlinkL : solved.eyeBlinkR;
					const eyeSmileTargetL = rigging.mirrorEyes ? (solved.eyeSmileR ?? 0) : (solved.eyeSmileL ?? 0);
					const eyeSmileTargetR = rigging.mirrorEyes ? (solved.eyeSmileL ?? 0) : (solved.eyeSmileR ?? 0);
					const browTargetL = rigging.mirrorEyes ? solved.browR : solved.browL;
					const browTargetR = rigging.mirrorEyes ? solved.browL : solved.browR;

					rigging.setLiveValue('ParamAngleX', globalSmoother.smooth('ParamAngleX', solved.yaw, 'angle'));
					rigging.setLiveValue('ParamAngleY', globalSmoother.smooth('ParamAngleY', solved.pitch, 'angle'));
					rigging.setLiveValue('ParamAngleZ', globalSmoother.smooth('ParamAngleZ', solved.roll, 'angle'));
					rigging.setLiveValue('ParamEyeLOpen', globalSmoother.smooth('ParamEyeLOpen', eyeTargetL, 'blink'));
					rigging.setLiveValue('ParamEyeROpen', globalSmoother.smooth('ParamEyeROpen', eyeTargetR, 'blink'));
					rigging.setLiveValue('ParamEyeLSmile', eyeSmileTargetL);
					rigging.setLiveValue('ParamEyeRSmile', eyeSmileTargetR);
					rigging.setLiveValue('ParamEyeBallX', globalSmoother.smooth('ParamEyeBallX', solved.eyeBallX, 'generic'));
					rigging.setLiveValue('ParamEyeBallY', globalSmoother.smooth('ParamEyeBallY', solved.eyeBallY, 'generic'));
					rigging.setLiveValue('ParamBrowLY', globalSmoother.smooth('ParamBrowLY', browTargetL, 'generic'));
					rigging.setLiveValue('ParamBrowRY', globalSmoother.smooth('ParamBrowRY', browTargetR, 'generic'));
					rigging.setLiveValue('ParamMouthOpenY', globalSmoother.smooth('ParamMouthOpenY', solved.mouthOpen, 'mouth'));
					rigging.setLiveValue('ParamMouthForm', globalSmoother.smooth('ParamMouthForm', solved.mouthForm, 'mouth'));
					rigging.setLiveValue('ParamMouthX', globalSmoother.smooth('ParamMouthX', solved.mouthX, 'mouth'));
					rigging.setLiveValue('ParamCheek', globalSmoother.smooth('ParamCheek', solved.cheekPuff, 'generic'));
					rigging.setLiveValue('ParamBodyAngleX', globalSmoother.smooth('ParamBodyAngleX', solved.bodyAngleX, 'angle'));
					rigging.setLiveValue('ParamBodyAngleY', globalSmoother.smooth('ParamBodyAngleY', solved.bodyAngleY, 'angle'));
					rigging.setLiveValue('ParamBodyAngleZ', globalSmoother.smooth('ParamBodyAngleZ', solved.bodyAngleZ, 'angle'));
					rigging.setLiveValue('ParamArmLA', globalSmoother.smooth('ParamArmLA', solved.armLA, 'generic'));
					rigging.setLiveValue('ParamArmRA', globalSmoother.smooth('ParamArmRA', solved.armRA, 'generic'));
					rigging.setLiveValue('ParamArmLB', solved.isHighFiveL ? 1 : 0);
					rigging.setLiveValue('ParamArmRB', solved.isHighFiveR ? 1 : 0);
					rigging.setLiveValue('ParamHandAngleL', solved.isHighFiveL ? 15 : 0);
					rigging.setLiveValue('ParamHandAngleR', solved.isHighFiveR ? 15 : 0);

					// Draw wireframe overlay only if PIP is visible, mesh is enabled, and NO blocking modal is active
					const isModalOpen = rigging.isSettingsModalOpen || rigging.isModelModalOpen || rigging.isThemeModalOpen || rigging.isObsModalOpen || rigging.isShortcutModalOpen;
					if (this.canvasOverlay && rigging.showCameraPip && rigging.showLandmarksMesh && !isModalOpen) {
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

		ctx.clearRect(0, 0, width, height);

		// 1. Draw Face Landmarks (Cyan) - Single Batched Draw Call
		if (faceLandmarks.length > 0) {
			ctx.fillStyle = '#06b6d4';
			ctx.beginPath();
			for (let i = 0; i < faceLandmarks.length; i += 4) {
				const pt = faceLandmarks[i];
				const x = pt.x * width;
				const y = pt.y * height;
				ctx.moveTo(x + 1.2, y);
				ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
			}
			ctx.fill();
		}

		// 2. Draw Hand Landmarks & Skeleton Bones (Emerald Green) - Batched Calls
		if (handsList.length > 0) {
			ctx.fillStyle = '#10b981';
			ctx.beginPath();
			for (const hand of handsList) {
				for (const pt of hand) {
					const x = pt.x * width;
					const y = pt.y * height;
					ctx.moveTo(x + 2.2, y);
					ctx.arc(x, y, 2.2, 0, 2 * Math.PI);
				}
			}
			ctx.fill();

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

export const tracker = new FaceTracker();
