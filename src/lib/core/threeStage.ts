import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export type CatVariant = 'mochi' | 'kuro' | 'tora';
export type FramingMode3D = 'full' | 'half' | 'closeup';
export type FullBodyPose3D =
	| 'idle'
	| 'wave'
	| 'peace'
	| 'heart'
	| 'stand'
	| 'cat-paw'
	| 'sit'
	| 'shy'
	| 'tsundere'
	| 'thinking'
	| 'idol'
	| 'bow'
	| 'cross-arms';
export type StageAreaWaypoint = 'center' | 'pc' | 'bed' | 'cafe-bar' | 'beach-umbrella' | 'meadow-flowers';
export type StageEnvironment3D = 'grid' | 'room' | 'cafe' | 'beach' | 'field' | 'sunset' | 'studio' | 'dojo' | 'void';

// Procedural 3D Canvas Texture Generators for rich materials
function createWoodParquetTexture(isDarkTone: boolean = false): THREE.CanvasTexture {
	if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);
	const canvas = document.createElement('canvas');
	canvas.width = 512;
	canvas.height = 512;
	const ctx = canvas.getContext('2d');
	if (!ctx) return new THREE.CanvasTexture(canvas);

	ctx.fillStyle = isDarkTone ? '#2b1d14' : '#d4a373';
	ctx.fillRect(0, 0, 512, 512);

	const plankH = 32;
	const plankW = 128;
	const rows = 16;
	const cols = 5;

	const lightTones = ['#e6bc98', '#dfb086', '#d4a373', '#c99665', '#be8957', '#deb887'];
	const darkTones = ['#3d281c', '#332015', '#2b1b11', '#24160d', '#382518', '#2f1e13'];
	const tones = isDarkTone ? darkTones : lightTones;

	for (let r = 0; r < rows; r++) {
		const offset = (r % 2) * (plankW / 2);
		for (let c = -1; c < cols; c++) {
			const x = c * plankW + offset;
			const y = r * plankH;
			ctx.fillStyle = tones[(r * 7 + c * 3 + 11) % tones.length];
			ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);

			ctx.fillStyle = isDarkTone ? 'rgba(0, 0, 0, 0.15)' : 'rgba(100, 50, 20, 0.08)';
			for (let g = 4; g < plankH - 4; g += 6) {
				ctx.fillRect(x + 2, y + g, plankW - 4, 1);
			}

			ctx.fillStyle = isDarkTone ? 'rgba(0, 0, 0, 0.4)' : 'rgba(60, 30, 10, 0.28)';
			ctx.fillRect(x, y + plankH - 1, plankW, 1);
			ctx.fillRect(x + plankW - 1, y, 1, plankH);
		}
	}

	const tex = new THREE.CanvasTexture(canvas);
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(4, 4);
	return tex;
}

function createTatamiTexture(): THREE.CanvasTexture {
	if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext('2d');
	if (!ctx) return new THREE.CanvasTexture(canvas);

	ctx.fillStyle = '#b7c4a1';
	ctx.fillRect(0, 0, 256, 256);

	for (let y = 0; y < 256; y += 4) {
		ctx.fillStyle = y % 8 === 0 ? 'rgba(70, 85, 50, 0.18)' : 'rgba(230, 240, 210, 0.15)';
		ctx.fillRect(0, y, 256, 2);
	}
	for (let x = 0; x < 256; x += 8) {
		ctx.fillStyle = 'rgba(60, 75, 45, 0.08)';
		ctx.fillRect(x, 0, 1, 256);
	}

	const tex = new THREE.CanvasTexture(canvas);
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(6, 6);
	return tex;
}

function createGrassTexture(): THREE.CanvasTexture {
	if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	const ctx = canvas.getContext('2d');
	if (!ctx) return new THREE.CanvasTexture(canvas);

	ctx.fillStyle = '#22c55e'; // vibrant emerald anime meadow
	ctx.fillRect(0, 0, 256, 256);

	for (let i = 0; i < 500; i++) {
		const x = Math.random() * 256;
		const y = Math.random() * 256;
		const h = 5 + Math.random() * 9;
		const tone = Math.random() > 0.4 ? '#4ade80' : '#16a34a';
		ctx.strokeStyle = tone;
		ctx.lineWidth = 1.3;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + (Math.random() - 0.5) * 4, y - h);
		ctx.stroke();
	}

	const tex = new THREE.CanvasTexture(canvas);
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(8, 8);
	return tex;
}

function createChalkboardTexture(): THREE.CanvasTexture {
	if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);
	const canvas = document.createElement('canvas');
	canvas.width = 512;
	canvas.height = 256;
	const ctx = canvas.getContext('2d');
	if (!ctx) return new THREE.CanvasTexture(canvas);

	ctx.fillStyle = '#18181b';
	ctx.fillRect(0, 0, 512, 256);

	ctx.strokeStyle = '#fef08a';
	ctx.lineWidth = 3;
	ctx.strokeRect(10, 10, 492, 236);

	ctx.fillStyle = '#fef08a';
	ctx.font = 'bold 24px sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('☕ MIRUNOVA COFFEE CAFE ☕', 256, 46);

	ctx.font = '15px monospace';
	ctx.textAlign = 'left';
	ctx.fillStyle = '#fde047';
	ctx.fillText('• Matcha Latte ...... 500¥', 30, 90);
	ctx.fillText('• Caramel Macchiato . 550¥', 30, 122);
	ctx.fillText('• Strawberry Parfait . 680¥', 30, 154);
	ctx.fillText('• Sakura Roll Cake .. 620¥', 30, 186);

	ctx.fillStyle = '#fda4af';
	ctx.font = '22px sans-serif';
	ctx.fillText('✨ ₍ᐢ.ˬ.⑅ᐢ₎', 340, 100);
	ctx.fillText('💖 Welcome!', 330, 140);
	ctx.fillStyle = '#93c5fd';
	ctx.fillText('☕ Fresh Brewed', 320, 180);

	return new THREE.CanvasTexture(canvas);
}

export class ThreeStage {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer | null = null;
	private container: HTMLElement | null = null;
	private animationFrameId: number | null = null;

	// 3D Stage Environments ('grid' | 'room' | 'field' | 'sunset' | 'studio' | 'dojo' | 'void')
	public currentStageEnv: StageEnvironment3D = 'grid';
	private stageEnvironmentGroup: THREE.Group = new THREE.Group();

	// Active Model Type & Root
	public modelType: 'procedural' | 'fbx' | 'glb' = 'procedural';
	private currentModelGroup: THREE.Group | THREE.Object3D | null = null;

	// Procedural Cat Nodes
	private headNode: THREE.Object3D | null = null;
	private eyeLNode: THREE.Object3D | null = null;
	private eyeRNode: THREE.Object3D | null = null;
	private mouthNode: THREE.Object3D | null = null;
	private pawLNode: THREE.Object3D | null = null;
	private pawRNode: THREE.Object3D | null = null;
	private tailNode: THREE.Object3D | null = null;
	private earLNode: THREE.Object3D | null = null;
	private earRNode: THREE.Object3D | null = null;

	// Humanoid FBX Bones (Neuro-sama Rig)
	private neckNode: THREE.Object3D | null = null;
	private hipsNode: THREE.Object3D | null = null;
	private spineNode: THREE.Object3D | null = null;
	private torsoNode: THREE.Object3D | null = null;
	private shoulderLNode: THREE.Object3D | null = null;
	private shoulderRNode: THREE.Object3D | null = null;
	private armLNode: THREE.Object3D | null = null;
	private armRNode: THREE.Object3D | null = null;
	private forearmLNode: THREE.Object3D | null = null;
	private forearmRNode: THREE.Object3D | null = null;
	private handLNode: THREE.Object3D | null = null;
	private handRNode: THREE.Object3D | null = null;
	public handGestureL: string = 'none';
	public handGestureR: string = 'none';
	private fingerBonesL = { thumb: [] as THREE.Object3D[], index: [] as THREE.Object3D[], middle: [] as THREE.Object3D[], others: [] as THREE.Object3D[] };
	private fingerBonesR = { thumb: [] as THREE.Object3D[], index: [] as THREE.Object3D[], middle: [] as THREE.Object3D[], others: [] as THREE.Object3D[] };
	private upperLegLNode: THREE.Object3D | null = null;
	private upperLegRNode: THREE.Object3D | null = null;
	private lowerLegLNode: THREE.Object3D | null = null;
	private lowerLegRNode: THREE.Object3D | null = null;
	public poseLoopMode: string = 'idle-breath';
	public poseLoopSpeed: number = 1.0;
	private hairBones: THREE.Object3D[] = [];
	private skirtBones: THREE.Object3D[] = [];
	private initialRotations: Map<THREE.Object3D, THREE.Euler> = new Map();
	private initialPositions: Map<THREE.Object3D, THREE.Vector3> = new Map();
	public modelRotationY: number = 0;

	// Model Translation / Position Offsets
	public modelOffsetX: number = 0;
	public modelOffsetY: number = 0;
	public modelOffsetZ: number = 0;
	private modelBasePosition: THREE.Vector3 = new THREE.Vector3();

	// Morph Targets / BlendShapes for Expressions & Lip-Sync
	private morphMesh: THREE.SkinnedMesh | null = null;
	private morphDict: Record<string, number> = {};

	// Interactive States: Expression & Full Body Pose
	public activeExpression: string = '';
	public activeFullBodyPose: FullBodyPose3D = 'idle';
	public activeStageWaypoint: StageAreaWaypoint = 'center';

	// Holographic Loading Skeleton Rig (prevents progressive piece-by-piece popping)
	public loadingSkeletonGroup: THREE.Group | null = null;
	public isLoadingModel: boolean = false;

	// Framing, Orbit Camera & Smooth Turntable Spin
	public currentFraming: FramingMode3D = 'full';
	public orbitTheta: number = 0; // Azimuth angle in radians (around Y axis)
	public orbitPhi: number = 1.55; // Polar angle in radians (from top, ~1.55 is eye-level)
	public orbitRadius: number = 2.7; // Spherical distance from target
	public isAutoSpin: boolean = false;
	public autoSpinSpeed: number = 0.55; // Rad/s (~31.5 deg/s)

	private cameraTargetPos: THREE.Vector3 = new THREE.Vector3(0, 0.95, 2.7);
	private cameraLookTarget: THREE.Vector3 = new THREE.Vector3(0, 0.9, 0);
	private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 0.9, 0);

	// External GLTF animations & mixer
	private mixer: THREE.AnimationMixer | null = null;
	private gltfBones: Map<string, THREE.Bone> = new Map();
	private lastFrameTime = performance.now();
	private activeLoadToken = 0;
	private toonGradient: THREE.DataTexture | null = null;

	public getOrCreateToonGradient(): THREE.DataTexture {
		if (!this.toonGradient) {
			// Clean 2-tone vibrant anime cel-shading ramp: 150/255 (~59%) bright colorful shadow, 255/255 (100%) lit
			const colors = new Uint8Array([150, 255]);
			this.toonGradient = new THREE.DataTexture(colors, 2, 1, THREE.RedFormat);
			this.toonGradient.minFilter = THREE.NearestFilter;
			this.toonGradient.magFilter = THREE.NearestFilter;
			this.toonGradient.generateMipmaps = false;
			this.toonGradient.needsUpdate = true;
		}
		return this.toonGradient;
	}

	constructor() {
		this.scene = new THREE.Scene();
		this.scene.add(this.stageEnvironmentGroup);
		this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
		this.updateCameraTargetPos();
		this.camera.position.copy(this.cameraTargetPos);
		this.camera.lookAt(this.cameraLookTarget);
	}

	init(container: HTMLElement) {
		this.container = container;
		const width = container.clientWidth || 800;
		const height = container.clientHeight || 600;

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance',
			preserveDrawingBuffer: true
		});
		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		// Use NoToneMapping so anime cel textures retain their authored, rich, vivid, saturated colors without ACES desaturation
		this.renderer.toneMapping = THREE.NoToneMapping;
		container.appendChild(this.renderer.domElement);

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		// Studio Lights: Bright, colorful, broadcast-grade anime lighting
		// 1. Soft warm ambient fill gives character bright, luminous presence
		const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.92);
		this.scene.add(ambientLight);

		// 2. Frontal eye-level key light provides crisp, colorful definition
		const mainLight = new THREE.DirectionalLight(0xffffff, 1.05);
		mainLight.position.set(0.1, 1.45, 2.8);
		this.scene.add(mainLight);

		// 3. Gentle pastel fill light from side-left softens contours with colorful contrast
		const fillLight = new THREE.DirectionalLight(0xfdf2f8, 0.45);
		fillLight.position.set(-2.2, 1.4, 2.0);
		this.scene.add(fillLight);

		// 4. Subtle warm champagne rim backlight gives clean edge separation from background
		const rimLight = new THREE.DirectionalLight(0xffedd5, 0.4);
		rimLight.position.set(0, 2.8, -2.2);
		this.scene.add(rimLight);

		this.setStageEnvironment(this.currentStageEnv);

		window.addEventListener('resize', this.handleResize);
		this.startRenderLoop();
	}

	zoomBy(factor: number) {
		if (!this.camera) return;
		this.orbitRadius = Math.max(0.4, Math.min(6.0, this.orbitRadius / factor));
		this.updateCameraTargetPos();
	}

	resetZoom() {
		if (!this.camera) return;
		this.setFraming(this.currentFraming);
	}

	setFraming(mode: FramingMode3D) {
		this.currentFraming = mode;
		if (this.modelType === 'fbx' || this.modelType === 'glb') {
			if (mode === 'full') {
				// Full Body: shows full avatar from feet to head
				this.cameraLookTarget.set(0, 0.9, 0);
				this.orbitRadius = 2.7;
			} else if (mode === 'half') {
				// Half Body: waist up
				this.cameraLookTarget.set(0, 1.25, 0);
				this.orbitRadius = 1.55;
			} else if (mode === 'closeup') {
				// Close-up: face & expressions focus
				this.cameraLookTarget.set(0, 1.48, 0);
				this.orbitRadius = 0.85;
			}
		} else {
			// Procedural Cat / GLTF
			if (mode === 'full') {
				this.cameraLookTarget.set(0, 0.2, 0);
				this.orbitRadius = 2.8;
			} else if (mode === 'half') {
				this.cameraLookTarget.set(0, 0.3, 0);
				this.orbitRadius = 1.9;
			} else if (mode === 'closeup') {
				this.cameraLookTarget.set(0, 0.4, 0);
				this.orbitRadius = 1.2;
			}
		}
		this.updateCameraTargetPos();
	}

	public rotateOrbit(deltaTheta: number, deltaPhi: number = 0, immediate: boolean = false) {
		// Rotates the character model body directly so the stage environment/scene stays stable
		this.rotateModelBody(deltaTheta);

		// Adjust camera elevation/pitch without swinging sideways around the room
		this.adjustCameraPitch(deltaPhi);

		if (immediate && this.camera) {
			this.camera.position.copy(this.cameraTargetPos);
			this.camera.up.set(0, 1, 0);
			this.camera.lookAt(this.cameraLookTarget);
		}
	}

	public rotateModelBody(deltaRadians: number) {
		const twoPi = Math.PI * 2;
		this.modelRotationY = ((this.modelRotationY + deltaRadians) % twoPi + twoPi) % twoPi;
		this.orbitTheta = this.modelRotationY;
		if (this.currentModelGroup) {
			this.currentModelGroup.rotation.y = this.modelRotationY;
		}
	}

	public rotateModelBodyDegrees(degrees: number) {
		this.rotateModelBody(degrees * (Math.PI / 180));
	}

	public resetModelBody() {
		this.modelRotationY = 0;
		this.orbitTheta = 0;
		if (this.currentModelGroup) {
			this.currentModelGroup.rotation.y = 0;
		}
		this.isAutoSpin = false;
	}

	/**
	 * Stage Props & Furniture Collision Resolver
	 * Ensures 3D character models cannot collide or penetrate non-character stage furniture/props
	 * (e.g. PC desk, bed, walls, cafe counter).
	 * Permitted exception: Character-to-character proximity is explicitly allowed.
	 */
	public resolvePropCollision(targetX: number, targetZ: number): { x: number; z: number } {
		let x = targetX;
		let z = targetZ;
		const r = 0.42; // Character collision boundary cylinder radius

		const obstacles: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> = [];

		if (this.currentStageEnv === 'room') {
			// Room perimeter walls
			x = Math.max(-7.1, Math.min(7.1, x));
			z = Math.max(-7.1, Math.min(7.1, z));

			// PC Desk Solid Body (monitor, PC rig & desk surface)
			// Chair front is at Z: -3.5 to -3.0, so the desk surface behind it is blocked
			obstacles.push({ minX: 3.5, maxX: 6.1, minZ: -5.2, maxZ: -3.85 });

			// Cozy Bed Solid Mattress & Wooden Frame
			obstacles.push({ minX: -6.2, maxX: -2.3, minZ: -6.2, maxZ: -1.0 });

			// Nightstand & Bedside Lamp
			obstacles.push({ minX: -3.5, maxX: -2.5, minZ: -6.6, maxZ: -5.6 });

			// Corner Plant
			obstacles.push({ minX: 6.3, maxX: 7.3, minZ: -7.3, maxZ: -6.3 });
		} else if (this.currentStageEnv === 'cafe') {
			// Cafe perimeter walls
			x = Math.max(-7.1, Math.min(7.1, x));
			z = Math.max(-7.1, Math.min(7.1, z));

			// Espresso Bar Counter Body
			obstacles.push({ minX: -6.8, maxX: -2.1, minZ: -5.4, maxZ: -3.5 });

			// Cafe Monster Plant
			obstacles.push({ minX: 4.6, maxX: 5.8, minZ: -5.1, maxZ: -3.9 });
		} else if (this.currentStageEnv === 'beach') {
			// Deep ocean barrier
			z = Math.max(-3.5, Math.min(8.0, z));
			x = Math.max(-9.0, Math.min(9.0, x));

			// Beach umbrella pole base
			obstacles.push({ minX: -3.8, maxX: -3.4, minZ: -2.0, maxZ: -1.6 });
		} else if (this.currentStageEnv === 'field') {
			// Rustic meadow fence line
			z = Math.max(-5.8, Math.min(12.0, z));
			x = Math.max(-12.0, Math.min(12.0, x));
		} else if (this.currentStageEnv === 'dojo') {
			z = Math.max(-5.2, Math.min(5.5, z));
			x = Math.max(-5.5, Math.min(5.5, x));
			// Hanging paper lanterns
			obstacles.push({ minX: -4.1, maxX: -3.5, minZ: -4.8, maxZ: -4.2 });
			obstacles.push({ minX: 3.5, maxX: 4.1, minZ: -4.8, maxZ: -4.2 });
		} else {
			// General stage boundaries
			x = Math.max(-7.5, Math.min(7.5, x));
			z = Math.max(-7.5, Math.min(7.5, z));
		}

		// AABB circle penetration resolution (push out along axis of least penetration)
		for (const obs of obstacles) {
			if (x + r > obs.minX && x - r < obs.maxX && z + r > obs.minZ && z - r < obs.maxZ) {
				const overlapL = (x + r) - obs.minX;
				const overlapR = obs.maxX - (x - r);
				const overlapT = (z + r) - obs.minZ;
				const overlapB = obs.maxZ - (z - r);
				const minO = Math.min(overlapL, overlapR, overlapT, overlapB);

				if (minO === overlapL) x = obs.minX - r;
				else if (minO === overlapR) x = obs.maxX + r;
				else if (minO === overlapT) z = obs.minZ - r;
				else z = obs.maxZ + r;
			}
		}

		return { x, z };
	}

	public moveModel(deltaX: number, deltaY: number, deltaZ: number = 0) {
		const rawX = this.modelOffsetX + deltaX;
		const rawZ = this.modelOffsetZ + deltaZ;
		const resolved = this.resolvePropCollision(rawX, rawZ);

		this.modelOffsetX = resolved.x;
		this.modelOffsetY = Math.max(-2.5, Math.min(3.5, this.modelOffsetY + deltaY));
		this.modelOffsetZ = resolved.z;

		if (this.currentModelGroup) {
			this.currentModelGroup.position.set(
				this.modelBasePosition.x + this.modelOffsetX,
				this.modelBasePosition.y + this.modelOffsetY,
				this.modelBasePosition.z + this.modelOffsetZ
			);
		}
	}

	public setModelPosition(x: number, y: number, z: number = 0) {
		const resolved = this.resolvePropCollision(x, z);

		this.modelOffsetX = resolved.x;
		this.modelOffsetY = Math.max(-2.5, Math.min(3.5, y));
		this.modelOffsetZ = resolved.z;

		if (this.currentModelGroup) {
			this.currentModelGroup.position.set(
				this.modelBasePosition.x + this.modelOffsetX,
				this.modelBasePosition.y + this.modelOffsetY,
				this.modelBasePosition.z + this.modelOffsetZ
			);
		}
	}

	public teleportToArea(area: StageAreaWaypoint) {
		this.activeStageWaypoint = area;
		switch (area) {
			case 'pc':
				// Teleport right to PC streamer desk chair
				this.setModelPosition(4.8, 0, -3.5);
				this.modelRotationY = 0;
				if (this.currentModelGroup) this.currentModelGroup.rotation.y = 0;
				this.cameraLookTarget.set(4.8, 1.2, -3.5);
				this.updateCameraTargetPos();
				break;
			case 'bed':
				// Beside the cozy bed
				this.setModelPosition(-3.5, 0, -3.0);
				this.modelRotationY = 0.2;
				if (this.currentModelGroup) this.currentModelGroup.rotation.y = 0.2;
				this.cameraLookTarget.set(-3.5, 1.2, -3.0);
				this.updateCameraTargetPos();
				break;
			case 'cafe-bar':
				// Beside cafe counter
				this.setModelPosition(-2.0, 0, -3.2);
				this.modelRotationY = 0.15;
				if (this.currentModelGroup) this.currentModelGroup.rotation.y = 0.15;
				this.cameraLookTarget.set(-2.0, 1.2, -3.2);
				this.updateCameraTargetPos();
				break;
			case 'beach-umbrella':
				// Under beach umbrella
				this.setModelPosition(-2.2, 0, -1.0);
				this.modelRotationY = -0.2;
				if (this.currentModelGroup) this.currentModelGroup.rotation.y = -0.2;
				this.cameraLookTarget.set(-2.2, 1.2, -1.0);
				this.updateCameraTargetPos();
				break;
			case 'meadow-flowers':
				// Among vibrant wildflowers in open meadow
				this.setModelPosition(2.2, 0, -1.5);
				this.modelRotationY = -0.15;
				if (this.currentModelGroup) this.currentModelGroup.rotation.y = -0.15;
				this.cameraLookTarget.set(2.2, 1.2, -1.5);
				this.updateCameraTargetPos();
				break;
			case 'center':
			default:
				// Center stage
				this.setModelPosition(0, 0, 0);
				this.modelRotationY = 0;
				if (this.currentModelGroup) this.currentModelGroup.rotation.y = 0;
				this.cameraLookTarget.set(0, 1.2, 0);
				this.updateCameraTargetPos();
				break;
		}
	}

	public resetModelPosition() {
		this.activeStageWaypoint = 'center';
		this.modelOffsetX = 0;
		this.modelOffsetY = 0;
		this.modelOffsetZ = 0;
		if (this.currentModelGroup) {
			this.currentModelGroup.position.copy(this.modelBasePosition);
		}
		this.cameraLookTarget.set(0, 1.2, 0);
		this.updateCameraTargetPos();
	}

	public adjustCameraPitch(deltaPhi: number) {
		// Clamp polar angle phi strictly between ~0.6 rad and 1.85 rad
		this.orbitPhi = Math.max(0.6, Math.min(1.85, this.orbitPhi + deltaPhi));
		this.updateCameraTargetPos();
	}

	public rotateOrbitDegrees(degrees: number) {
		this.rotateOrbit(degrees * (Math.PI / 180), 0);
	}

	public toggleAutoSpin(enabled?: boolean): boolean {
		this.isAutoSpin = enabled !== undefined ? enabled : !this.isAutoSpin;
		return this.isAutoSpin;
	}

	public resetOrbit() {
		this.orbitTheta = 0;
		this.orbitPhi = 1.55;
		this.resetModelBody();
		this.resetModelPosition();
		this.setFraming(this.currentFraming);
	}

	public updateCameraTargetPos() {
		const sinPhi = Math.sin(this.orbitPhi);
		const cosPhi = Math.cos(this.orbitPhi);

		// Camera stays front-aligned to stage (X = 0), so the stage environment never spins sideways
		this.cameraTargetPos.set(
			this.cameraLookTarget.x,
			this.cameraLookTarget.y + this.orbitRadius * cosPhi,
			this.cameraLookTarget.z + this.orbitRadius * sinPhi
		);
	}

	setExpression(name: string) {
		this.activeExpression = name;
		if (this.morphMesh && this.morphMesh.morphTargetInfluences) {
			const infl = this.morphMesh.morphTargetInfluences;
			for (let i = 0; i < infl.length; i++) infl[i] = 0;

			if (!name || name === 'normal' || name === 'reset') return;

			let key = name;
			if (name === 'smile') key = 'vrc.ee';
			else if (name === 'laugh') {
				if (this.morphDict['vrc.ee'] !== undefined) infl[this.morphDict['vrc.ee']] = 1.0;
				if (this.morphDict['vrc.aa'] !== undefined) infl[this.morphDict['vrc.aa']] = 0.8;
				return;
			} else if (name === 'wink') key = 'vrc.blink';
			else if (name === 'surprised' || name === 'surprise') key = 'vrc.oh';
			else if (name === 'open' || name === 'tongue') key = 'vrc.aa';
			else if (name === 'love') {
				if (this.morphDict['stars'] !== undefined) infl[this.morphDict['stars']] = 1.0;
				if (this.morphDict['blush'] !== undefined) infl[this.morphDict['blush']] = 1.0;
				if (this.morphDict['vrc.ee'] !== undefined) infl[this.morphDict['vrc.ee']] = 0.6;
				return;
			} else if (name === 'pout') {
				if (this.morphDict['vrc.ou'] !== undefined) infl[this.morphDict['vrc.ou']] = 1.0;
				if (this.morphDict['blush'] !== undefined) infl[this.morphDict['blush']] = 0.5;
				return;
			} else if (name === 'angry') key = 'vrc.ou';
			else if (name === 'smug') {
				if (this.morphDict['vrc.ee'] !== undefined) infl[this.morphDict['vrc.ee']] = 0.75;
				if (this.morphDict['vrc.ou'] !== undefined) infl[this.morphDict['vrc.ou']] = 0.35;
				return;
			} else if (name === 'dazed') {
				if (this.morphDict['stars'] !== undefined) infl[this.morphDict['stars']] = 0.6;
				if (this.morphDict['vrc.blink'] !== undefined) infl[this.morphDict['vrc.blink']] = 0.4;
				return;
			} else if (name === 'sleepy') {
				if (this.morphDict['vrc.blink'] !== undefined) infl[this.morphDict['vrc.blink']] = 0.85;
				return;
			} else if (name === 'cry') {
				if (this.morphDict['vrc.ou'] !== undefined) infl[this.morphDict['vrc.ou']] = 0.7;
				if (this.morphDict['vrc.oh'] !== undefined) infl[this.morphDict['vrc.oh']] = 0.35;
				return;
			}

			if (key && this.morphDict[key] !== undefined) {
				infl[this.morphDict[key]] = 1.0;
			}
		}
	}

	setFullBodyPose(pose: FullBodyPose3D) {
		this.activeFullBodyPose = pose;
	}

	/**
	 * Shows a stylized holographic cyber skeleton wireframe rig on stage while 3D models and 4K textures are loading.
	 * Eliminates progressive pop-in and prevents ugly untextured/missing parts from glitching into view.
	 */
	public showLoadingSkeleton() {
		this.isLoadingModel = true;
		if (this.loadingSkeletonGroup) {
			return;
		}

		const group = new THREE.Group();
		group.name = 'loadingSkeleton';

		// Cyan holographic line material
		const lineMat = new THREE.LineBasicMaterial({
			color: 0x06b6d4,
			transparent: true,
			opacity: 0.85,
			depthTest: true
		});

		// Glowing cyan joint sphere material
		const jointMat = new THREE.MeshBasicMaterial({
			color: 0x38bdf8,
			transparent: true,
			opacity: 0.95
		});

		// Accent purple joint material
		const accentMat = new THREE.MeshBasicMaterial({
			color: 0xa855f7,
			transparent: true,
			opacity: 0.95
		});

		// 1. Bones Wireframe Skeleton Line Segments
		const boneSegments: number[] = [
			// Spine (Pelvis -> Chest -> Neck -> Head)
			0, 0.75, 0,  0, 1.15, 0,
			0, 1.15, 0,  0, 1.35, 0,
			0, 1.35, 0,  0, 1.5, 0,

			// Left Arm (Clavicle -> Shoulder -> Elbow -> Hand)
			0, 1.15, 0,  -0.25, 1.15, 0,
			-0.25, 1.15, 0,  -0.45, 0.9, 0,
			-0.45, 0.9, 0,  -0.52, 0.65, 0,

			// Right Arm (Clavicle -> Shoulder -> Elbow -> Hand)
			0, 1.15, 0,  0.25, 1.15, 0,
			0.25, 1.15, 0,  0.45, 0.9, 0,
			0.45, 0.9, 0,  0.52, 0.65, 0,

			// Left Leg (Hip -> Knee -> Foot)
			0, 0.75, 0,  -0.16, 0.72, 0,
			-0.16, 0.72, 0,  -0.18, 0.38, 0,
			-0.18, 0.38, 0,  -0.18, 0.05, 0,

			// Right Leg (Hip -> Knee -> Foot)
			0, 0.75, 0,  0.16, 0.72, 0,
			0.16, 0.72, 0,  0.18, 0.38, 0,
			0.18, 0.38, 0,  0.18, 0.05, 0
		];

		const boneGeo = new THREE.BufferGeometry();
		boneGeo.setAttribute('position', new THREE.Float32BufferAttribute(boneSegments, 3));
		const bonesMesh = new THREE.LineSegments(boneGeo, lineMat);
		group.add(bonesMesh);

		// 2. Wireframe Geometric Prisms
		// Head: icosahedron wireframe
		const headGeo = new THREE.IcosahedronGeometry(0.22, 1);
		const headMat = new THREE.MeshBasicMaterial({
			color: 0x06b6d4,
			wireframe: true,
			transparent: true,
			opacity: 0.65
		});
		const headMesh = new THREE.Mesh(headGeo, headMat);
		headMesh.position.set(0, 1.5, 0);
		group.add(headMesh);

		// Chest / Ribcage: 6-sided cylinder wireframe
		const chestGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.3, 6);
		const chestMat = new THREE.MeshBasicMaterial({
			color: 0x06b6d4,
			wireframe: true,
			transparent: true,
			opacity: 0.55
		});
		const chestMesh = new THREE.Mesh(chestGeo, chestMat);
		chestMesh.position.set(0, 1.12, 0);
		group.add(chestMesh);

		// Pelvis: 5-sided cylinder wireframe
		const pelvisGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.18, 5);
		const pelvisMat = new THREE.MeshBasicMaterial({
			color: 0x06b6d4,
			wireframe: true,
			transparent: true,
			opacity: 0.55
		});
		const pelvisMesh = new THREE.Mesh(pelvisGeo, pelvisMat);
		pelvisMesh.position.set(0, 0.75, 0);
		group.add(pelvisMesh);

		// 3. Glowing Joint Nodes
		const jointCoords = [
			[0, 1.5, 0],       // Head
			[0, 1.15, 0],      // Chest
			[0, 0.75, 0],      // Pelvis
			[-0.25, 1.15, 0],  // L Shoulder
			[-0.45, 0.9, 0],   // L Elbow
			[-0.52, 0.65, 0],  // L Hand
			[0.25, 1.15, 0],   // R Shoulder
			[0.45, 0.9, 0],    // R Elbow
			[0.52, 0.65, 0],   // R Hand
			[-0.18, 0.38, 0],  // L Knee
			[-0.18, 0.05, 0],  // L Foot
			[0.18, 0.38, 0],   // R Knee
			[0.18, 0.05, 0]    // R Foot
		];

		const jointSphereGeo = new THREE.SphereGeometry(0.032, 8, 8);
		jointCoords.forEach(([jx, jy, jz], i) => {
			const jMesh = new THREE.Mesh(jointSphereGeo, i % 3 === 0 ? accentMat : jointMat);
			jMesh.position.set(jx, jy, jz);
			group.add(jMesh);
		});

		// 4. Scanning Holographic Ring
		const scanRingGeo = new THREE.TorusGeometry(0.36, 0.012, 6, 32);
		scanRingGeo.rotateX(Math.PI / 2);
		const scanRingMat = new THREE.MeshBasicMaterial({
			color: 0x38bdf8,
			transparent: true,
			opacity: 0.85
		});
		const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
		scanRing.name = 'scanRing';
		scanRing.position.set(0, 0.8, 0);
		group.add(scanRing);

		// 5. Floor Hologram Pedestal Ring
		const baseRingGeo = new THREE.RingGeometry(0.45, 0.48, 32);
		baseRingGeo.rotateX(-Math.PI / 2);
		const baseRingMat = new THREE.MeshBasicMaterial({
			color: 0x06b6d4,
			transparent: true,
			opacity: 0.6,
			side: THREE.DoubleSide
		});
		const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
		baseRing.name = 'baseRing';
		baseRing.position.set(0, 0.02, 0);
		group.add(baseRing);

		// Position group matching model target
		group.position.set(
			this.modelBasePosition.x + this.modelOffsetX,
			this.modelBasePosition.y + this.modelOffsetY,
			this.modelBasePosition.z + this.modelOffsetZ
		);
		group.rotation.y = this.modelRotationY;

		this.loadingSkeletonGroup = group;
		this.scene.add(group);
	}

	public hideLoadingSkeleton() {
		this.isLoadingModel = false;
		if (this.loadingSkeletonGroup) {
			this.scene.remove(this.loadingSkeletonGroup);
			this.loadingSkeletonGroup.traverse((child) => {
				if ((child as any).geometry) (child as any).geometry.dispose();
				if ((child as any).material) {
					if (Array.isArray((child as any).material)) {
						(child as any).material.forEach((m: any) => m.dispose());
					} else {
						(child as any).material.dispose();
					}
				}
			});
			this.loadingSkeletonGroup = null;
		}
	}

	public setStageEnvironment(env: StageEnvironment3D) {
		this.currentStageEnv = env;
		// Clear existing stage environment meshes & materials
		while (this.stageEnvironmentGroup.children.length > 0) {
			const obj = this.stageEnvironmentGroup.children[0];
			this.stageEnvironmentGroup.remove(obj);
			if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
			if ((obj as THREE.Mesh).material) {
				const mat = (obj as THREE.Mesh).material;
				if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
				else (mat as THREE.Material).dispose();
			}
		}

		// Reset scene fog
		this.scene.fog = null;

		if (env === 'void') {
			return;
		}

		if (env === 'grid') {
			// Cyber Grid & Reflective Floor Disc
			const floorGeo = new THREE.CircleGeometry(6, 48);
			const floorMat = new THREE.MeshStandardMaterial({
				color: 0x090d16,
				roughness: 0.25,
				metalness: 0.85,
				transparent: true,
				opacity: 0.92
			});
			const floor = new THREE.Mesh(floorGeo, floorMat);
			floor.rotation.x = -Math.PI / 2;
			floor.position.y = 0;
			this.stageEnvironmentGroup.add(floor);

			// Grid Helper
			const grid = new THREE.GridHelper(12, 24, 0x06b6d4, 0x1e293b);
			grid.position.y = 0.005;
			this.stageEnvironmentGroup.add(grid);

			// Outer glowing ring
			const ringGeo = new THREE.RingGeometry(5.8, 6.0, 48);
			const ringMat = new THREE.MeshBasicMaterial({
				color: 0x06b6d4,
				side: THREE.DoubleSide,
				transparent: true,
				opacity: 0.7
			});
			const ring = new THREE.Mesh(ringGeo, ringMat);
			ring.rotation.x = -Math.PI / 2;
			ring.position.y = 0.008;
			this.stageEnvironmentGroup.add(ring);
		} else if (env === 'room') {
			// Cozy Streamer Girl Room: Cat cream kuning soft, lantai zinc cream, perabotan rumah cewek

			// 1. Lantai Zinc Cream (Warm zinc-tinted cream wood flooring)
			const floorGeo = new THREE.PlaneGeometry(16, 16);
			const floorMat = new THREE.MeshStandardMaterial({
				map: createWoodParquetTexture(false),
				color: 0xeee7db, // zinc cream
				roughness: 0.45,
				metalness: 0.08
			});
			const floor = new THREE.Mesh(floorGeo, floorMat);
			floor.rotation.x = -Math.PI / 2;
			floor.position.y = 0;
			this.stageEnvironmentGroup.add(floor);

			// Baseboard trim (White wooden baseboards along wall perimeter)
			const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
			const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 0.08), baseboardMat);
			baseboardBack.position.set(0, 0.125, -7.96);
			this.stageEnvironmentGroup.add(baseboardBack);

			const baseboardLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 16), baseboardMat);
			baseboardLeft.position.set(-7.96, 0.125, 0);
			this.stageEnvironmentGroup.add(baseboardLeft);

			const baseboardRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 16), baseboardMat);
			baseboardRight.position.set(7.96, 0.125, 0);
			this.stageEnvironmentGroup.add(baseboardRight);

			// 2. Dinding Cat Cream Kuning Soft #F9E4BC (Soft warm pastel cream yellow walls)
			const wallMat = new THREE.MeshStandardMaterial({
				color: 0xf9e4bc, // cat cream kuning soft #F9E4BC
				roughness: 0.85,
				metalness: 0.02
			});

			// Back Wall
			const backWallGeo = new THREE.PlaneGeometry(16, 10);
			const backWall = new THREE.Mesh(backWallGeo, wallMat);
			backWall.position.set(0, 5, -8);
			this.stageEnvironmentGroup.add(backWall);

			// Left Wall
			const leftWallGeo = new THREE.PlaneGeometry(16, 10);
			const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
			leftWall.position.set(-8, 5, 0);
			leftWall.rotation.y = Math.PI / 2;
			this.stageEnvironmentGroup.add(leftWall);

			// Right Wall
			const rightWallGeo = new THREE.PlaneGeometry(16, 10);
			const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
			rightWall.position.set(8, 5, 0);
			rightWall.rotation.y = -Math.PI / 2;
			this.stageEnvironmentGroup.add(rightWall);

			// 3. Karpet Bundar Cewek (Cute Soft Pastel Pink Fluffy Rug) under avatar
			const rugGeo = new THREE.CircleGeometry(2.6, 48);
			const rugMat = new THREE.MeshStandardMaterial({
				color: 0xfce7f3, // soft pastel pink
				roughness: 0.9,
				metalness: 0.02
			});
			const rug = new THREE.Mesh(rugGeo, rugMat);
			rug.rotation.x = -Math.PI / 2;
			rug.position.set(0, 0.005, 0);
			this.stageEnvironmentGroup.add(rug);

			const rugBorderGeo = new THREE.RingGeometry(2.45, 2.58, 48);
			const rugBorderMat = new THREE.MeshBasicMaterial({ color: 0xfbcfe8, side: THREE.DoubleSide });
			const rugBorder = new THREE.Mesh(rugBorderGeo, rugBorderMat);
			rugBorder.rotation.x = -Math.PI / 2;
			rugBorder.position.set(0, 0.008, 0);
			this.stageEnvironmentGroup.add(rugBorder);

			// 4. Perabotan Cewek: Tempat Tidur Aesthetic di Kiri Belakang (X: -4.8, Z: -4.5)
			const bedGroup = new THREE.Group();
			bedGroup.position.set(-4.8, 0, -4.6);

			const bedFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
			const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 3.2), bedFrameMat);
			bedFrame.position.set(0, 0.175, 0);
			bedGroup.add(bedFrame);

			const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.15), bedFrameMat);
			headboard.position.set(0, 0.7, -1.55);
			bedGroup.add(headboard);

			const mattressMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6 });
			const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.32, 2.95), mattressMat);
			mattress.position.set(0, 0.5, 0.05);
			bedGroup.add(mattress);

			const duvetMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7 });
			const duvet = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.16, 2.0), duvetMat);
			duvet.position.set(0, 0.7, 0.5);
			bedGroup.add(duvet);

			const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
			const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.55), pillowMat);
			pillow1.position.set(-0.5, 0.75, -1.05);
			pillow1.rotation.x = 0.15;
			bedGroup.add(pillow1);

			const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.55), pillowMat);
			pillow2.position.set(0.5, 0.75, -1.05);
			pillow2.rotation.x = 0.15;
			bedGroup.add(pillow2);

			const accentPillowMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.5 });
			const accentPillow = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), accentPillowMat);
			accentPillow.scale.set(1.2, 0.6, 1.0);
			accentPillow.position.set(0, 0.75, -0.6);
			bedGroup.add(accentPillow);

			// Boneka Teddy Bear Plushie imut
			const bearMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
			const bearBody = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bearMat);
			bearBody.position.set(0.65, 0.8, -0.2);
			const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), bearMat);
			bearHead.position.set(0.65, 1.05, -0.2);
			bedGroup.add(bearBody);
			bedGroup.add(bearHead);

			this.stageEnvironmentGroup.add(bedGroup);

			// 5. Nakas Samping Ranjang + Lampu Tidur Aesthetic (X: -3.0, Z: -6.1)
			const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.65, 0.8), bedFrameMat);
			nightstand.position.set(-3.0, 0.325, -6.1);
			this.stageEnvironmentGroup.add(nightstand);

			const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.35, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 }));
			lampBase.position.set(-3.0, 0.825, -6.1);
			this.stageEnvironmentGroup.add(lampBase);

			const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.3, emissive: 0xfef08a, emissiveIntensity: 0.4 }));
			lampShade.position.set(-3.0, 1.08, -6.1);
			this.stageEnvironmentGroup.add(lampShade);

			// 6. Meja Streamer / Belajar Cewek di Kanan Belakang (X: 4.8, Z: -4.5)
			const deskGroup = new THREE.Group();
			deskGroup.position.set(4.8, 0, -4.5);

			const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.2), bedFrameMat);
			deskTop.position.set(0, 0.95, 0);
			deskGroup.add(deskTop);

			const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.95, 12);
			[-1.2, 1.2].forEach((x) => {
				[-0.5, 0.5].forEach((z) => {
					const leg = new THREE.Mesh(legGeo, bedFrameMat);
					leg.position.set(x, 0.475, z);
					deskGroup.add(leg);
				});
			});

			// Monitor streaming tipis
			const monitorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.04), new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.2 }));
			monitorFrame.position.set(0, 1.48, -0.3);
			deskGroup.add(monitorFrame);

			const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.65), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
			screenMesh.position.set(0, 1.48, -0.278);
			deskGroup.add(screenMesh);

			const monitorStand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), bedFrameMat);
			monitorStand.position.set(0, 1.06, -0.3);
			deskGroup.add(monitorStand);

			const monitorFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), bedFrameMat);
			monitorFoot.position.set(0, 0.96, -0.3);
			deskGroup.add(monitorFoot);

			// Keyboard & mousepad pastel pink
			const padMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4), new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 }));
			padMesh.rotation.x = -Math.PI / 2;
			padMesh.position.set(0, 0.995, 0.15);
			deskGroup.add(padMesh);

			const kbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.025, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
			kbMesh.position.set(-0.1, 1.01, 0.15);
			deskGroup.add(kbMesh);

			// Cermin rias bundar (Vanity Mirror) berbingkai emas
			const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 16, 32), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 }));
			mirrorFrame.position.set(0.9, 1.4, -0.2);
			deskGroup.add(mirrorFrame);

			const mirrorGlass = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.05 }));
			mirrorGlass.position.set(0.9, 1.4, -0.2);
			deskGroup.add(mirrorGlass);

			// Kursi aesthetic cewek dengan bantalan pink
			const chairGroup = new THREE.Group();
			chairGroup.position.set(0, 0, 0.9);
			const seatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 }));
			seatMesh.position.set(0, 0.58, 0);
			chairGroup.add(seatMesh);

			const backrestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.06), new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 }));
			backrestMesh.position.set(0, 0.95, 0.32);
			chairGroup.add(backrestMesh);

			const chairLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.54, 12), bedFrameMat);
			chairLeg.position.set(0, 0.27, 0);
			chairGroup.add(chairLeg);

			const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 16), bedFrameMat);
			chairBase.position.set(0, 0.02, 0);
			chairGroup.add(chairBase);

			deskGroup.add(chairGroup);
			this.stageEnvironmentGroup.add(deskGroup);

			// 7. Jendela Kamar Aesthetic di Dinding Kiri (Left Wall Window with Sky & Curtains)
			const windowGroup = new THREE.Group();
			windowGroup.position.set(-7.94, 5.2, -1.0);
			windowGroup.rotation.y = Math.PI / 2;

			const winFrame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.4, 0.1), bedFrameMat);
			windowGroup.add(winFrame);

			const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.1), new THREE.MeshBasicMaterial({ color: 0xbae6fd }));
			winGlass.position.z = 0.052;
			windowGroup.add(winGlass);

			const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.8, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7 }));
			rod.rotation.z = Math.PI / 2;
			rod.position.set(0, 1.85, 0.16);
			windowGroup.add(rod);

			const curtainMat = new THREE.MeshStandardMaterial({ color: 0xfce7f3, roughness: 0.6, transparent: true, opacity: 0.88 });
			const curtainL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.6, 0.1), curtainMat);
			curtainL.position.set(-1.45, 0, 0.16);
			windowGroup.add(curtainL);

			const curtainR = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.6, 0.1), curtainMat);
			curtainR.position.set(1.45, 0, 0.16);
			windowGroup.add(curtainR);

			this.stageEnvironmentGroup.add(windowGroup);

			// 8. Rak Dinding Gantung & Buku-buku Pastel di Dinding Belakang (Z: -7.94)
			const shelfMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
			const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 0.4), shelfMat);
			shelf1.position.set(0, 4.2, -7.8);
			this.stageEnvironmentGroup.add(shelf1);

			const bookColors = [0xf472b6, 0x60a5fa, 0x34d399, 0xfbbf24, 0xa78bfa, 0xf87171];
			bookColors.forEach((color, i) => {
				const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.28), new THREE.MeshStandardMaterial({ color }));
				book.position.set(-0.8 + i * 0.14, 4.4, -7.8);
				this.stageEnvironmentGroup.add(book);
			});

			const potMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.18, 16), shelfMat);
			potMesh.position.set(0.7, 4.33, -7.8);
			const plantMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 }));
			plantMesh.scale.set(1, 0.7, 1);
			plantMesh.position.set(0.7, 4.45, -7.8);
			this.stageEnvironmentGroup.add(potMesh);
			this.stageEnvironmentGroup.add(plantMesh);

			// 9. Poster Seni Aesthetic di Dinding Belakang
			const posterFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.02), bedFrameMat);
			posterFrame.position.set(-2.4, 4.5, -7.95);
			const posterArt = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.7), new THREE.MeshBasicMaterial({ color: 0xfbcfe8 }));
			posterArt.position.set(-2.4, 4.5, -7.935);
			this.stageEnvironmentGroup.add(posterFrame);
			this.stageEnvironmentGroup.add(posterArt);

			// 10. String Fairy Lights (Lampu Tumblr Hangat) di Dinding Atas
			const stringPoints: THREE.Vector3[] = [];
			for (let i = -7; i <= 7; i += 0.5) {
				const sag = Math.sin((i + 7) * 0.8) * 0.18;
				stringPoints.push(new THREE.Vector3(i, 6.8 - sag, -7.93));
			}
			const stringGeo = new THREE.BufferGeometry().setFromPoints(stringPoints);
			const stringLine = new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: 0xfef08a, linewidth: 2 }));
			this.stageEnvironmentGroup.add(stringLine);

			const bulbGeo = new THREE.SphereGeometry(0.045, 8, 8);
			const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
			for (let i = -6.5; i <= 6.5; i += 1.0) {
				const sag = Math.sin((i + 7) * 0.8) * 0.18;
				const bulb = new THREE.Mesh(bulbGeo, bulbMat);
				bulb.position.set(i, 6.8 - sag, -7.92);
				this.stageEnvironmentGroup.add(bulb);
			}

			// 11. Tanaman Hias Sudut Ruangan (Tall Potted Indoor Plant di X: 6.8, Z: -6.8)
			const bigPot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.6, 16), shelfMat);
			bigPot.position.set(6.8, 0.3, -6.8);
			this.stageEnvironmentGroup.add(bigPot);

			const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
			for (let a = 0; a < 6; a++) {
				const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), foliageMat);
				leaf.scale.set(0.4, 1.2, 0.1);
				leaf.rotation.set(0.4 * Math.sin(a), a * 1.05, 0.4 * Math.cos(a));
				leaf.position.set(6.8 + Math.sin(a) * 0.25, 1.1 + (a % 3) * 0.2, -6.8 + Math.cos(a) * 0.25);
				this.stageEnvironmentGroup.add(leaf);
			}
		} else if (env === 'cafe') {
			// Cozy Japanese/Korean Coffee Cafe Shop
			// 1. Warm Walnut Parquet Flooring
			const floorGeo = new THREE.PlaneGeometry(16, 16);
			const floorMat = new THREE.MeshStandardMaterial({
				map: createWoodParquetTexture(true),
				color: 0x3d271d, // rich dark roasted coffee wood parquet
				roughness: 0.38,
				metalness: 0.08
			});
			const floor = new THREE.Mesh(floorGeo, floorMat);
			floor.rotation.x = -Math.PI / 2;
			floor.position.y = 0;
			this.stageEnvironmentGroup.add(floor);

			// Warm Cozy Cafe Rug under Avatar
			const rugGeo = new THREE.CircleGeometry(2.8, 36);
			const rugMat = new THREE.MeshStandardMaterial({
				color: 0xd4b996, // warm oat/cappuccino foam tone
				roughness: 0.9,
				metalness: 0.02
			});
			const rug = new THREE.Mesh(rugGeo, rugMat);
			rug.rotation.x = -Math.PI / 2;
			rug.position.set(0, 0.005, 0);
			this.stageEnvironmentGroup.add(rug);

			// Baseboard & Wood Moulding
			const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x271912, roughness: 0.5 });
			const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 0.1), baseboardMat);
			baseboardBack.position.set(0, 0.15, -7.95);
			this.stageEnvironmentGroup.add(baseboardBack);

			// 2. Cafe Walls (Warm Charcoal / Espresso Wood Slat & Brick Wall)
			const wallMat = new THREE.MeshStandardMaterial({
				color: 0x231d19, // deep espresso cafe accent wall
				roughness: 0.85,
				metalness: 0.05
			});
			const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), wallMat);
			backWall.position.set(0, 5, -8);
			this.stageEnvironmentGroup.add(backWall);

			const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), wallMat);
			leftWall.position.set(-8, 5, 0);
			leftWall.rotation.y = Math.PI / 2;
			this.stageEnvironmentGroup.add(leftWall);

			const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), wallMat);
			rightWall.position.set(8, 5, 0);
			rightWall.rotation.y = -Math.PI / 2;
			this.stageEnvironmentGroup.add(rightWall);

			// 3. Cafe Menu Board / Chalkboard on Back Wall
			const boardFrame = new THREE.Mesh(
				new THREE.BoxGeometry(3.6, 2.2, 0.08),
				new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 })
			);
			boardFrame.position.set(0, 4.2, -7.94);
			this.stageEnvironmentGroup.add(boardFrame);

			const boardChalk = new THREE.Mesh(
				new THREE.PlaneGeometry(3.3, 1.9),
				new THREE.MeshBasicMaterial({ map: createChalkboardTexture() })
			);
			boardChalk.position.set(0, 4.2, -7.89);
			this.stageEnvironmentGroup.add(boardChalk);

			// Decorative Coffee Cafe Sign on the Chalkboard
			const signMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // warm chalk yellow
			const signLine1 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.12), signMat);
			signLine1.position.set(0, 4.7, -7.88);
			this.stageEnvironmentGroup.add(signLine1);

			const signLine2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.08), new THREE.MeshBasicMaterial({ color: 0xfcd34d }));
			signLine2.position.set(0, 4.35, -7.88);
			this.stageEnvironmentGroup.add(signLine2);

			const signLine3 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.06), new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
			signLine3.position.set(0, 3.8, -7.88);
			this.stageEnvironmentGroup.add(signLine3);

			// 4. Cafe Bar Counter & Espresso Station (Left Side)
			const counterGroup = new THREE.Group();
			counterGroup.position.set(-4.5, 0, -4.5);

			// Main wooden counter body
			const counterBody = new THREE.Mesh(
				new THREE.BoxGeometry(4.5, 1.8, 1.6),
				new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.6 })
			);
			counterBody.position.set(0, 0.9, 0);
			counterGroup.add(counterBody);

			// Counter Marble / Stone Top
			const counterTop = new THREE.Mesh(
				new THREE.BoxGeometry(4.8, 0.12, 1.9),
				new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2, metalness: 0.1 })
			);
			counterTop.position.set(0, 1.86, 0);
			counterGroup.add(counterTop);

			// Espresso Machine (Retro Italian Chrome & Red/Black)
			const espressoMachine = new THREE.Mesh(
				new THREE.BoxGeometry(1.2, 0.9, 0.9),
				new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.8, roughness: 0.2 })
			);
			espressoMachine.position.set(-0.8, 2.37, 0);
			counterGroup.add(espressoMachine);

			const machineDrip = new THREE.Mesh(
				new THREE.BoxGeometry(0.8, 0.15, 0.7),
				new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.1 })
			);
			machineDrip.position.set(-0.8, 1.98, 0.1);
			counterGroup.add(machineDrip);

			// Coffee Cups with saucers on counter
			const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
			[-0.1, 0.6, 1.2].forEach((cx) => {
				const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.18, 16), cupMat);
				cup.position.set(cx, 2.01, 0.3);
				counterGroup.add(cup);

				const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16), cupMat);
				saucer.position.set(cx, 1.93, 0.3);
				counterGroup.add(saucer);
			});
			this.stageEnvironmentGroup.add(counterGroup);

			// 5. Warm Cafe Brass Pendant Lamps Hanging from Ceiling
			const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
			const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 }); // warm incandescent bulb
			[-2.2, 0, 2.2].forEach((lx) => {
				// Cord
				const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.5, 8), new THREE.MeshBasicMaterial({ color: 0x18181b }));
				cord.position.set(lx, 6.25, -2.5);
				this.stageEnvironmentGroup.add(cord);

				// Brass Shade Cone
				const shade = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 24, 1, true), brassMat);
				shade.rotation.x = Math.PI;
				shade.position.set(lx, 5.0, -2.5);
				this.stageEnvironmentGroup.add(shade);

				// Glowing Bulb
				const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), bulbMat);
				bulb.position.set(lx, 4.9, -2.5);
				this.stageEnvironmentGroup.add(bulb);
			});

			// 6. Indoor Cafe Potted Monster Plant (Right Side)
			const pot = new THREE.Mesh(
				new THREE.CylinderGeometry(0.55, 0.4, 0.9, 24),
				new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
			);
			pot.position.set(5.2, 0.45, -4.5);
			this.stageEnvironmentGroup.add(pot);

			const plantFoliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
			for (let i = 0; i < 7; i++) {
				const ang = (i / 7) * Math.PI * 2;
				const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), plantFoliageMat);
				leaf.scale.set(0.35, 1.1, 0.08);
				leaf.rotation.set(0.35 * Math.sin(ang), ang, 0.35 * Math.cos(ang));
				leaf.position.set(5.2 + Math.sin(ang) * 0.3, 1.2 + (i % 3) * 0.15, -4.5 + Math.cos(ang) * 0.3);
				this.stageEnvironmentGroup.add(leaf);
			}

			// Atmospheric Cozy Cafe Fog
			this.scene.fog = new THREE.FogExp2(0x2d1b10, 0.022);
		} else if (env === 'beach') {
			// Vivid Happy Vibe Tropical Beach Field
			// 1. Sunlit Golden Tropical Sand Field
			const sandGeo = new THREE.PlaneGeometry(36, 36);
			const sandMat = new THREE.MeshStandardMaterial({
				color: 0xfde047, // bright vivid golden sunlit sand
				roughness: 0.75,
				metalness: 0.02
			});
			const sand = new THREE.Mesh(sandGeo, sandMat);
			sand.rotation.x = -Math.PI / 2;
			sand.position.set(0, 0, 4);
			this.stageEnvironmentGroup.add(sand);

			// 2. Crystal Clear Vivid Turquoise Ocean Water (Backdrop)
			const oceanGeo = new THREE.PlaneGeometry(60, 30);
			const oceanMat = new THREE.MeshStandardMaterial({
				color: 0x06b6d4, // crystal cyan / turquoise vivid tropical ocean
				roughness: 0.15,
				metalness: 0.65,
				transparent: true,
				opacity: 0.95
			});
			const ocean = new THREE.Mesh(oceanGeo, oceanMat);
			ocean.rotation.x = -Math.PI / 2;
			ocean.position.set(0, 0.02, -14);
			this.stageEnvironmentGroup.add(ocean);

			// Ocean Wave Foam Crest (White sparkling water edge)
			const foamGeo = new THREE.PlaneGeometry(60, 0.6);
			const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
			const foam = new THREE.Mesh(foamGeo, foamMat);
			foam.rotation.x = -Math.PI / 2;
			foam.position.set(0, 0.04, -2.5);
			this.stageEnvironmentGroup.add(foam);

			// 3. Round Wooden Beach Stage Deck under Avatar
			const deckGeo = new THREE.CylinderGeometry(3.0, 3.2, 0.14, 36);
			const deckMat = new THREE.MeshStandardMaterial({
				color: 0xd97706, // warm bright teak sun deck
				roughness: 0.45,
				metalness: 0.05
			});
			const deck = new THREE.Mesh(deckGeo, deckMat);
			deck.position.set(0, 0.07, 0);
			this.stageEnvironmentGroup.add(deck);

			// 4. Vibrant Candy-Striped Beach Umbrella (Left Side)
			const umbrellaGroup = new THREE.Group();
			umbrellaGroup.position.set(-3.6, 0, -1.8);
			umbrellaGroup.rotation.z = 0.12; // tilted playfully

			// Umbrella Wooden Pole
			const pole = new THREE.Mesh(
				new THREE.CylinderGeometry(0.045, 0.045, 3.6, 12),
				new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
			);
			pole.position.set(0, 1.8, 0);
			umbrellaGroup.add(pole);

			// Canopy - Vivid Coral Pink & Turquoise alternating candy stripes
			const canopyMat1 = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 }); // vivid coral
			const canopyMat2 = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 }); // vivid sky cyan
			const segments = 12;
			for (let i = 0; i < segments; i++) {
				const thetaStart = (i / segments) * Math.PI * 2;
				const thetaLength = (1 / segments) * Math.PI * 2;
				const segGeo = new THREE.ConeGeometry(1.9, 0.85, 4, 1, false, thetaStart, thetaLength);
				const seg = new THREE.Mesh(segGeo, i % 2 === 0 ? canopyMat1 : canopyMat2);
				seg.position.set(0, 3.3, 0);
				umbrellaGroup.add(seg);
			}
			this.stageEnvironmentGroup.add(umbrellaGroup);

			// 5. Colorful Beach Surfboard propped in the sand
			const boardGeo = new THREE.BoxGeometry(0.65, 2.5, 0.1);
			const boardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.1 });
			const surfboard = new THREE.Mesh(boardGeo, boardMat);
			surfboard.position.set(-2.6, 1.1, -1.6);
			surfboard.rotation.set(-0.25, 0.35, -0.2);
			this.stageEnvironmentGroup.add(surfboard);

			// Surfboard Stripe
			const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.52, 0.11), new THREE.MeshStandardMaterial({ color: 0x06b6d4 }));
			stripe.position.set(-2.6, 1.1, -1.59);
			stripe.rotation.set(-0.25, 0.35, -0.2);
			this.stageEnvironmentGroup.add(stripe);

			// 6. Tropical Coconut Palm Tree (Right Side)
			const palmGroup = new THREE.Group();
			palmGroup.position.set(4.6, 0, -3.2);

			// Palm Trunk (segments curved slightly)
			const trunkMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
			for (let j = 0; j < 8; j++) {
				const trunkSeg = new THREE.Mesh(new THREE.CylinderGeometry(0.24 - j * 0.015, 0.28 - j * 0.015, 0.55, 12), trunkMat);
				trunkSeg.position.set(Math.sin(j * 0.18) * 0.45, 0.28 + j * 0.52, Math.cos(j * 0.18) * 0.2);
				trunkSeg.rotation.z = -0.08 * j;
				palmGroup.add(trunkSeg);
			}

			// Palm Fronds / Green Leaves
			const frondMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5, side: THREE.DoubleSide });
			for (let f = 0; f < 6; f++) {
				const frondAngle = (f / 6) * Math.PI * 2;
				const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 2.2), frondMat);
				frond.scale.set(0.5, 1.0, 1.0);
				frond.rotation.set(0.7, frondAngle, 0);
				frond.position.set(1.1 + Math.sin(frondAngle) * 0.8, 4.3, 0.4 + Math.cos(frondAngle) * 0.8);
				palmGroup.add(frond);
			}
			this.stageEnvironmentGroup.add(palmGroup);

			// 7. Radiant Golden Sun Disc in Azure Blue Sky
			const sunDisc = new THREE.Mesh(
				new THREE.CircleGeometry(3.6, 32),
				new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.95 })
			);
			sunDisc.position.set(7.0, 8.5, -20);
			this.stageEnvironmentGroup.add(sunDisc);

			// Happy Clear Atmosphere Fog
			this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.018);
		} else if (env === 'field') {
			// Vivid Happy Open Meadow / Blooming Wildflower Horizon Stage
			// 1. Rolling Lush Emerald & Lime Anime Meadow Hills
			const fieldGeo = new THREE.PlaneGeometry(60, 60, 32, 32);
			const posAttr = fieldGeo.attributes.position;
			for (let i = 0; i < posAttr.count; i++) {
				const vx = posAttr.getX(i);
				const vy = posAttr.getY(i);
				const dist = Math.sqrt(vx * vx + vy * vy);
				const heightScale = Math.min(1.0, Math.max(0, (dist - 3.2) / 6.0));
				const hillZ = Math.sin(vx * 0.18) * Math.cos(vy * 0.18) * 0.85 * heightScale;
				posAttr.setZ(i, hillZ);
			}
			fieldGeo.computeVertexNormals();

			const fieldMat = new THREE.MeshStandardMaterial({
				map: createGrassTexture(),
				color: 0x4ade80, // bright vivid sunny anime green
				roughness: 0.65,
				metalness: 0.05
			});
			const field = new THREE.Mesh(fieldGeo, fieldMat);
			field.rotation.x = -Math.PI / 2;
			field.position.y = 0;
			this.stageEnvironmentGroup.add(field);

			// 2. Sunlit Limestone Pedestal & Stepping Stones Path
			const stoneGeo = new THREE.CylinderGeometry(2.6, 2.8, 0.12, 36);
			const stoneMat = new THREE.MeshStandardMaterial({
				color: 0xf1f5f9, // bright sunlit limestone
				roughness: 0.55,
				metalness: 0.08
			});
			const stone = new THREE.Mesh(stoneGeo, stoneMat);
			stone.position.set(0, 0.06, 0);
			this.stageEnvironmentGroup.add(stone);

			// Stepping stones path
			[-1.2, -2.2, -3.2, -4.2, -5.2].forEach((pz, idx) => {
				const pGeo = new THREE.CylinderGeometry(0.35 + (idx % 2) * 0.08, 0.4, 0.05, 16);
				const pMesh = new THREE.Mesh(pGeo, stoneMat);
				pMesh.position.set(Math.sin(idx * 0.8) * 0.35, 0.03, pz + 3.0);
				this.stageEnvironmentGroup.add(pMesh);
			});

			// 3. 70+ Vivid Wildflower Blooms (Pink Cosmos, Buttercups, Lavender, Daisies)
			const flowerColors = [0xf43f5e, 0xf472b6, 0xfbbf24, 0xf59e0b, 0xa855f7, 0x38bdf8, 0xffffff];
			const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
			const petalGeos = [
				new THREE.CylinderGeometry(0.14, 0.14, 0.02, 8),
				new THREE.SphereGeometry(0.12, 8, 8)
			];

			for (let i = 0; i < 70; i++) {
				const ang = (i / 70) * Math.PI * 2 + Math.sin(i * 3.7) * 0.5;
				const dist = 3.2 + Math.abs(Math.sin(i * 2.3)) * 8.5;
				const fx = Math.cos(ang) * dist;
				const fz = Math.sin(ang) * dist;

				const flowerGroup = new THREE.Group();
				const stemH = 0.25 + (i % 4) * 0.06;
				const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, stemH, 6), stemMat);
				stem.position.y = stemH * 0.5;
				flowerGroup.add(stem);

				const flowerColor = flowerColors[i % flowerColors.length];
				const flowerMat = new THREE.MeshStandardMaterial({
					color: flowerColor,
					roughness: 0.35,
					emissive: flowerColor,
					emissiveIntensity: 0.15
				});
				const petal = new THREE.Mesh(petalGeos[i % 2], flowerMat);
				petal.position.y = stemH;
				petal.rotation.x = 0.2 * Math.sin(i);
				flowerGroup.add(petal);

				// Center yellow pistil for petals
				const pistilMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
				const pistil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), pistilMat);
				pistil.position.y = stemH + 0.02;
				flowerGroup.add(pistil);

				flowerGroup.position.set(fx, 0, fz);
				this.stageEnvironmentGroup.add(flowerGroup);
			}

			// 4. Rustic Wooden Fence along the meadow horizon
			const fenceMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
			for (let x = -14; x <= 14; x += 2.8) {
				const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.25, 8), fenceMat);
				post.position.set(x, 0.6, -6.5);
				this.stageEnvironmentGroup.add(post);

				const railTop = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.06, 0.05), fenceMat);
				railTop.position.set(x + 1.4, 0.95, -6.5);
				this.stageEnvironmentGroup.add(railTop);

				const railMid = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.06, 0.05), fenceMat);
				railMid.position.set(x + 1.4, 0.55, -6.5);
				this.stageEnvironmentGroup.add(railMid);
			}

			// 5. Stylized Fluffy 3D Anime Clouds floating in the sunny sky
			const cloudMat = new THREE.MeshStandardMaterial({
				color: 0xffffff,
				roughness: 0.95,
				emissive: 0xf0fdf4,
				emissiveIntensity: 0.15
			});
			const cloudPositions = [
				{ x: -9, y: 11, z: -16, s: 1.6 },
				{ x: 3, y: 13, z: -18, s: 2.1 },
				{ x: 11, y: 10, z: -15, s: 1.5 },
				{ x: -2, y: 9, z: -14, s: 1.2 }
			];
			cloudPositions.forEach(({ x, y, z, s }) => {
				const cloud = new THREE.Group();
				[-0.6, 0, 0.6].forEach((cx, idx) => {
					const r = idx === 1 ? 0.75 : 0.55;
					const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), cloudMat);
					puff.position.set(cx, idx === 1 ? 0.2 : 0, 0);
					cloud.add(puff);
				});
				cloud.scale.set(s, s * 0.7, s * 0.8);
				cloud.position.set(x, y, z);
				this.stageEnvironmentGroup.add(cloud);
			});

			// 6. Vivid Bright Sunny Sky Fog (soft sky-blue, morning radiance)
			this.scene.fog = new THREE.FogExp2(0xe0f2fe, 0.014);
		} else if (env === 'sunset') {
			// Sunset Beach Horizon Stage: Warm golden sands, glistening ocean horizon, sunset sky disc
			const sandGeo = new THREE.CircleGeometry(6, 48);
			const sandMat = new THREE.MeshStandardMaterial({
				color: 0xe0a96d, // warm golden sand
				roughness: 0.9,
				metalness: 0.02
			});
			const sand = new THREE.Mesh(sandGeo, sandMat);
			sand.rotation.x = -Math.PI / 2;
			sand.position.y = 0;
			this.stageEnvironmentGroup.add(sand);

			// Wooden Boardwalk / Stage Deck
			const deckGeo = new THREE.BoxGeometry(4.2, 0.1, 4.2);
			const deckMat = new THREE.MeshStandardMaterial({
				color: 0x8c5332, // beach wood
				roughness: 0.5,
				metalness: 0.05
			});
			const deck = new THREE.Mesh(deckGeo, deckMat);
			deck.position.set(0, 0.05, 0);
			this.stageEnvironmentGroup.add(deck);

			// Distant Ocean Horizon Plane
			const oceanGeo = new THREE.PlaneGeometry(60, 30);
			const oceanMat = new THREE.MeshStandardMaterial({
				color: 0x075985, // deep oceanic blue with specular glints
				roughness: 0.2,
				metalness: 0.75
			});
			const ocean = new THREE.Mesh(oceanGeo, oceanMat);
			ocean.rotation.x = -Math.PI / 2;
			ocean.position.set(0, -0.05, -16);
			this.stageEnvironmentGroup.add(ocean);

			// Giant Sunset Sun Disc in Background
			const sunGeo = new THREE.CircleGeometry(4.5, 32);
			const sunMat = new THREE.MeshBasicMaterial({
				color: 0xfbbf24,
				transparent: true,
				opacity: 0.92
			});
			const sun = new THREE.Mesh(sunGeo, sunMat);
			sun.position.set(0, 4.2, -18);
			this.stageEnvironmentGroup.add(sun);

			// Warm Golden Sunset Fog
			this.scene.fog = new THREE.FogExp2(0x451a03, 0.03);
		} else if (env === 'studio') {
			// Neon Broadcast Concert Studio: High-gloss black stage, neon ring podium, stage trusses & spotlights
			const floorGeo = new THREE.CircleGeometry(7, 48);
			const floorMat = new THREE.MeshStandardMaterial({
				color: 0x0f172a, // dark sleek concert floor
				roughness: 0.15,
				metalness: 0.9
			});
			const floor = new THREE.Mesh(floorGeo, floorMat);
			floor.rotation.x = -Math.PI / 2;
			floor.position.y = 0;
			this.stageEnvironmentGroup.add(floor);

			// Inner Magenta & Cyan Glowing Podium Rings
			const ring1 = new THREE.Mesh(
				new THREE.RingGeometry(2.4, 2.52, 48),
				new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide })
			);
			ring1.rotation.x = -Math.PI / 2;
			ring1.position.y = 0.01;
			this.stageEnvironmentGroup.add(ring1);

			const ring2 = new THREE.Mesh(
				new THREE.RingGeometry(4.5, 4.62, 48),
				new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide })
			);
			ring2.rotation.x = -Math.PI / 2;
			ring2.position.y = 0.01;
			this.stageEnvironmentGroup.add(ring2);

			// Stage Trusses in Background
			const trussMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
			[-4.5, 4.5].forEach((x) => {
				const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 12), trussMat);
				pillar.position.set(x, 3.5, -5.5);
				this.stageEnvironmentGroup.add(pillar);

				const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.06), trussMat);
				crossbar.position.set(x, 6.2, -5.5);
				this.stageEnvironmentGroup.add(crossbar);
			});

			const topTruss = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 0.12), trussMat);
			topTruss.position.set(0, 6.8, -5.5);
			this.stageEnvironmentGroup.add(topTruss);

			// Volumetric Spotlight Beam Cones
			const beamMat1 = new THREE.MeshBasicMaterial({
				color: 0x38bdf8,
				transparent: true,
				opacity: 0.14,
				side: THREE.DoubleSide
			});
			const beam1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7.5, 24, 1, true), beamMat1);
			beam1.position.set(-3.2, 3.6, -2.5);
			beam1.rotation.z = -0.32;
			beam1.rotation.x = 0.2;
			this.stageEnvironmentGroup.add(beam1);

			const beamMat2 = new THREE.MeshBasicMaterial({
				color: 0xf472b6,
				transparent: true,
				opacity: 0.14,
				side: THREE.DoubleSide
			});
			const beam2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7.5, 24, 1, true), beamMat2);
			beam2.position.set(3.2, 3.6, -2.5);
			beam2.rotation.z = 0.32;
			beam2.rotation.x = 0.2;
			this.stageEnvironmentGroup.add(beam2);

			this.scene.fog = new THREE.FogExp2(0x020617, 0.025);
		} else if (env === 'dojo') {
			// Sakura Garden Shrine / Tatami Stage: Woven tatami mats, shoji panels, lanterns, falling petals
			const tatamiGeo = new THREE.PlaneGeometry(12, 12);
			const tatamiMat = new THREE.MeshStandardMaterial({
				map: createTatamiTexture(),
				color: 0xa3b18a, // traditional woven tatami rush grass
				roughness: 0.8,
				metalness: 0.02
			});
			const tatami = new THREE.Mesh(tatamiGeo, tatamiMat);
			tatami.rotation.x = -Math.PI / 2;
			tatami.position.y = 0;
			this.stageEnvironmentGroup.add(tatami);

			// Tatami Borders (Black woven cloth trims)
			const borderMat = new THREE.MeshBasicMaterial({ color: 0x1f2421 });
			for (let x = -4; x <= 4; x += 4) {
				const trim = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 12), borderMat);
				trim.rotation.x = -Math.PI / 2;
				trim.position.set(x, 0.005, 0);
				this.stageEnvironmentGroup.add(trim);
			}

			// Shoji Screen Screen in Background
			const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2614, roughness: 0.6 });
			const paperMat = new THREE.MeshStandardMaterial({ color: 0xfefae0, roughness: 0.4, emissive: 0xffedd5, emissiveIntensity: 0.15 });

			const shojiGroup = new THREE.Group();
			shojiGroup.position.set(0, 2.5, -5.8);

			const paper = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), paperMat);
			shojiGroup.add(paper);

			// Wood frame borders
			const frameT = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.15, 0.08), woodMat);
			frameT.position.y = 2.5;
			shojiGroup.add(frameT);
			const frameB = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.15, 0.08), woodMat);
			frameB.position.y = -2.5;
			shojiGroup.add(frameB);

			[-5, 0, 5].forEach((x) => {
				const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5.1, 0.08), woodMat);
				post.position.x = x;
				shojiGroup.add(post);
			});

			this.stageEnvironmentGroup.add(shojiGroup);

			// Traditional Hanging Paper Lanterns on Left and Right
			const lanternMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.6 });
			[-3.8, 3.8].forEach((x) => {
				const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.65, 16), lanternMat);
				lantern.position.set(x, 3.2, -4.5);
				this.stageEnvironmentGroup.add(lantern);

				const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16), woodMat);
				cap.position.set(x, 3.55, -4.5);
				this.stageEnvironmentGroup.add(cap);
			});

			this.scene.fog = new THREE.FogExp2(0x1c1917, 0.025);
		}
	}

	private handleResize = () => {
		if (!this.container || !this.renderer) return;
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
	};

	// 1. Procedural Rigged 3D Cat Avatar with multiple breed variants
	loadProceduralCat(variant: CatVariant = 'mochi') {
		const token = ++this.activeLoadToken;
		this.clearCurrentModel();
		this.modelType = 'procedural';

		const catGroup = new THREE.Group();
		this.currentModelGroup = catGroup;

		// Color configurations based on breed variant
		let coatColor = 0xfdfcf7;
		let innerEarColor = 0xf472b6;
		let eyeColor = 0x1e3a8a;
		let collarColor = 0xef4444;

		if (variant === 'kuro') {
			coatColor = 0x18181b;
			innerEarColor = 0xa855f7;
			eyeColor = 0x10b981; // Glowing emerald
			collarColor = 0x8b5cf6;
		} else if (variant === 'tora') {
			coatColor = 0xf59e0b; // Warm ginger
			innerEarColor = 0xfb923c;
			eyeColor = 0xd97706; // Amber
			collarColor = 0x06b6d4;
		}

		// Materials
		const bodyMat = new THREE.MeshStandardMaterial({
			color: coatColor,
			roughness: 0.35,
			metalness: 0.05
		});
		const innerEarMat = new THREE.MeshStandardMaterial({
			color: innerEarColor,
			roughness: 0.5
		});
		const eyeMat = new THREE.MeshStandardMaterial({
			color: eyeColor,
			roughness: 0.15
		});
		const pinkMat = new THREE.MeshStandardMaterial({
			color: 0xf472b6,
			roughness: 0.5
		});
		const collarMat = new THREE.MeshStandardMaterial({
			color: collarColor,
			roughness: 0.4
		});
		const goldMat = new THREE.MeshStandardMaterial({
			color: 0xfbbf24,
			metalness: 0.85,
			roughness: 0.18
		});

		// --- Body ---
		const bodyGeo = new THREE.SphereGeometry(0.55, 32, 24);
		bodyGeo.scale(1, 1.2, 0.9);
		const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
		bodyMesh.position.y = -0.3;
		catGroup.add(bodyMesh);

		// Collar & Golden Bell
		const collarGeo = new THREE.TorusGeometry(0.38, 0.04, 16, 32);
		collarGeo.rotateX(Math.PI / 2);
		const collarMesh = new THREE.Mesh(collarGeo, collarMat);
		collarMesh.position.y = 0.22;
		catGroup.add(collarMesh);

		const bellGeo = new THREE.SphereGeometry(0.08, 16, 16);
		const bellMesh = new THREE.Mesh(bellGeo, goldMat);
		bellMesh.position.set(0, 0.16, 0.4);
		catGroup.add(bellMesh);

		// --- Head Node (Rigged) ---
		const headNode = new THREE.Group();
		headNode.position.set(0, 0.45, 0);
		this.headNode = headNode;
		catGroup.add(headNode);

		// Head Mesh
		const headGeo = new THREE.SphereGeometry(0.5, 32, 28);
		headGeo.scale(1.15, 0.95, 1);
		const headMesh = new THREE.Mesh(headGeo, bodyMat);
		headNode.add(headMesh);

		// Ears (Left & Right)
		const createEar = (isLeft: boolean) => {
			const earGroup = new THREE.Group();
			const earGeo = new THREE.ConeGeometry(0.2, 0.38, 4);
			const earOuter = new THREE.Mesh(earGeo, bodyMat);
			earOuter.rotation.y = Math.PI / 4;
			earGroup.add(earOuter);

			const earInnerGeo = new THREE.ConeGeometry(0.12, 0.28, 4);
			const earInner = new THREE.Mesh(earInnerGeo, innerEarMat);
			earInner.position.z = 0.04;
			earInner.rotation.y = Math.PI / 4;
			earGroup.add(earInner);

			earGroup.position.set(isLeft ? -0.38 : 0.38, 0.45, 0);
			earGroup.rotation.z = isLeft ? 0.35 : -0.35;
			earGroup.rotation.x = -0.15;
			return earGroup;
		};
		this.earLNode = createEar(true);
		this.earRNode = createEar(false);
		headNode.add(this.earLNode);
		headNode.add(this.earRNode);

		// Eyes (Rigged Left & Right)
		const createEye = (isLeft: boolean) => {
			const eyeGroup = new THREE.Group();
			// Eye socket / pupil
			const pupilGeo = new THREE.SphereGeometry(0.09, 24, 24);
			pupilGeo.scale(0.85, 1.25, 0.3);
			const pupilMesh = new THREE.Mesh(pupilGeo, eyeMat);
			eyeGroup.add(pupilMesh);

			// Eye Glint (Kawaii shine)
			const glintGeo = new THREE.SphereGeometry(0.03, 12, 12);
			const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
			const glint = new THREE.Mesh(glintGeo, glintMat);
			glint.position.set(0.02, 0.04, 0.05);
			eyeGroup.add(glint);

			eyeGroup.position.set(isLeft ? -0.2 : 0.2, 0.05, 0.46);
			return eyeGroup;
		};
		const eyeL = createEye(true);
		const eyeR = createEye(false);
		this.eyeLNode = eyeL;
		this.eyeRNode = eyeR;
		headNode.add(eyeL);
		headNode.add(eyeR);

		// Nose
		const noseGeo = new THREE.ConeGeometry(0.04, 0.04, 3);
		noseGeo.rotateX(-Math.PI / 2);
		const noseMesh = new THREE.Mesh(noseGeo, pinkMat);
		noseMesh.position.set(0, -0.05, 0.51);
		headNode.add(noseMesh);

		// Mouth (Rigged)
		const mouthGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI);
		mouthGeo.rotateZ(Math.PI);
		const mouthMesh = new THREE.Mesh(mouthGeo, pinkMat);
		mouthMesh.position.set(0, -0.14, 0.49);
		this.mouthNode = mouthMesh;
		headNode.add(mouthMesh);

		// Whiskers (3 on Left, 3 on Right)
		const whiskerColor = variant === 'kuro' ? 0x71717a : 0x52525b;
		const whiskerMat = new THREE.LineBasicMaterial({ color: whiskerColor, linewidth: 2 });
		[-1, 1].forEach((side) => {
			[-0.05, 0, 0.05].forEach((offsetY) => {
				const points = [
					new THREE.Vector3(side * 0.18, -0.06 + offsetY, 0.46),
					new THREE.Vector3(side * 0.5, -0.04 + offsetY * 1.5, 0.4)
				];
				const whiskerGeo = new THREE.BufferGeometry().setFromPoints(points);
				const whiskerLine = new THREE.Line(whiskerGeo, whiskerMat);
				headNode.add(whiskerLine);
			});
		});

		// Paws (Left & Right Arms)
		const createPaw = (isLeft: boolean) => {
			const pawGroup = new THREE.Group();
			const pawGeo = new THREE.SphereGeometry(0.14, 16, 16);
			pawGeo.scale(1, 1.2, 1.5);
			const pawMesh = new THREE.Mesh(pawGeo, bodyMat);
			pawGroup.add(pawMesh);

			// Pink paw pads
			const padGeo = new THREE.CircleGeometry(0.06, 16);
			const padMesh = new THREE.Mesh(padGeo, pinkMat);
			padMesh.position.set(0, -0.02, 0.16);
			pawGroup.add(padMesh);

			pawGroup.position.set(isLeft ? -0.36 : 0.36, -0.3, 0.4);
			return pawGroup;
		};
		this.pawLNode = createPaw(true);
		this.pawRNode = createPaw(false);
		catGroup.add(this.pawLNode);
		catGroup.add(this.pawRNode);

		// Tail (Rigged)
		const tailGroup = new THREE.Group();
		const tailGeo = new THREE.CylinderGeometry(0.06, 0.03, 0.8, 16);
		tailGeo.translate(0, 0.4, 0);
		tailGeo.rotateX(0.4);
		const tailMesh = new THREE.Mesh(tailGeo, bodyMat);
		tailGroup.add(tailMesh);
		tailGroup.position.set(0, -0.5, -0.45);
		this.tailNode = tailGroup;
		if (token !== this.activeLoadToken) return;
		this.modelBasePosition.set(0, 0, 0);
		catGroup.position.set(this.modelOffsetX, this.modelOffsetY, this.modelOffsetZ);
		catGroup.rotation.y = this.modelRotationY;
		this.scene.add(catGroup);
		this.setFraming(this.currentFraming);
	}

	private setupVRMMorphTargets(gltf: any) {
		const vrmExt = gltf.parser?.json?.extensions?.VRM;
		const bsg = vrmExt?.blendShapeMaster?.blendShapeGroups;

		const morphMeshes: THREE.SkinnedMesh[] = [];
		gltf.scene.traverse((c: any) => {
			if (c.isMesh && c.morphTargetInfluences && c.morphTargetInfluences.length > 0) {
				morphMeshes.push(c as THREE.SkinnedMesh);
			}
		});

		if (morphMeshes.length === 0) return;
		this.morphMesh = morphMeshes[0];
		if (!this.morphMesh.morphTargetDictionary) {
			this.morphMesh.morphTargetDictionary = {};
		}

		if (Array.isArray(bsg)) {
			for (const group of bsg) {
				const groupName = group.name;
				for (const bind of group.binds || []) {
					const targetMesh = morphMeshes[bind.mesh] || this.morphMesh;
					if (targetMesh && targetMesh.morphTargetDictionary) {
						targetMesh.morphTargetDictionary[groupName] = bind.index;
						targetMesh.morphTargetDictionary[groupName.toLowerCase()] = bind.index;
						if (groupName === 'Blink') targetMesh.morphTargetDictionary['vrc.blink'] = bind.index;
						if (groupName === 'A') targetMesh.morphTargetDictionary['vrc.aa'] = bind.index;
						if (groupName === 'E' || groupName === 'I' || groupName === 'Joy' || groupName === 'Fun') {
							targetMesh.morphTargetDictionary['vrc.ee'] = bind.index;
							targetMesh.morphTargetDictionary['smile'] = bind.index;
						}
						if (groupName === 'O') targetMesh.morphTargetDictionary['vrc.oh'] = bind.index;
						if (groupName === 'U') targetMesh.morphTargetDictionary['vrc.ou'] = bind.index;
						if (groupName === 'Angry') targetMesh.morphTargetDictionary['angry'] = bind.index;
						if (groupName === 'Surprised') targetMesh.morphTargetDictionary['surprised'] = bind.index;
						if (groupName === 'Extra') {
							targetMesh.morphTargetDictionary['stars'] = bind.index;
							targetMesh.morphTargetDictionary['blush'] = bind.index;
						}
					}
				}
			}
		}
		this.morphDict = this.morphMesh.morphTargetDictionary;
	}

	private discoverHumanoidBones(group: THREE.Object3D) {
		const findBone = (candidates: string[]): THREE.Object3D | null => {
			for (const name of candidates) {
				const found = group.getObjectByName(name);
				if (found) return found;
			}
			let fallback: THREE.Object3D | null = null;
			group.traverse((c) => {
				if (fallback) return;
				const lower = c.name.toLowerCase();
				for (const cand of candidates) {
					if (lower === cand.toLowerCase() || lower.includes(cand.toLowerCase())) {
						fallback = c;
						return;
					}
				}
			});
			return fallback;
		};

		this.headNode = findBone(['J_Bip_C_Head', 'head', 'mixamorig:Head', 'bip01_head']);
		this.neckNode = findBone(['J_Bip_C_Neck', 'neck', 'mixamorig:Neck', 'bip01_neck']);
		this.eyeRNode = findBone(['J_Adj_R_FaceEye', 'EyeR', 'mixamorig:RightEye', 'eye_r', 'righteye']);
		this.eyeLNode = findBone(['J_Adj_L_FaceEye', 'EyeL', 'mixamorig:LeftEye', 'eye_l', 'lefteye']);
		this.hipsNode = findBone(['J_Bip_C_Hips', 'hips', 'mixamorig:Hips', 'bip01_pelvis', 'pelvis']);
		this.spineNode = findBone(['J_Bip_C_Spine', 'spine', 'mixamorig:Spine', 'bip01_spine']);
		this.torsoNode = findBone(['J_Bip_C_UpperChest', 'J_Bip_C_Chest', 'torso', 'chest', 'mixamorig:Spine2']);
		this.shoulderLNode = findBone(['J_Bip_L_Shoulder', 'shoulderL', 'mixamorig:LeftShoulder', 'leftshoulder']);
		this.shoulderRNode = findBone(['J_Bip_R_Shoulder', 'shoulderR', 'mixamorig:RightShoulder', 'rightshoulder']);
		this.armLNode = findBone(['J_Bip_L_UpperArm', 'armL', 'mixamorig:LeftArm', 'leftarm']);
		this.armRNode = findBone(['J_Bip_R_UpperArm', 'armR', 'mixamorig:RightArm', 'rightarm']);
		this.forearmLNode = findBone(['J_Bip_L_LowerArm', 'ForearmL', 'mixamorig:LeftForeArm', 'leftforearm']);
		this.forearmRNode = findBone(['J_Bip_R_LowerArm', 'ForearmR', 'mixamorig:RightForeArm', 'rightforearm']);
		this.handLNode = findBone(['J_Bip_L_Hand', 'handL', 'mixamorig:LeftHand', 'lefthand']);
		this.handRNode = findBone(['J_Bip_R_Hand', 'handR', 'mixamorig:RightHand', 'righthand']);
		this.upperLegLNode = findBone(['J_Bip_L_UpperLeg', 'mixamorig:LeftUpLeg', 'upper_leg.l', 'thigh.l', 'thigh_l', 'leg_l']);
		this.upperLegRNode = findBone(['J_Bip_R_UpperLeg', 'mixamorig:RightUpLeg', 'upper_leg.r', 'thigh.r', 'thigh_r', 'leg_r']);
		this.lowerLegLNode = findBone(['J_Bip_L_LowerLeg', 'mixamorig:LeftLeg', 'lower_leg.l', 'calf.l', 'shin.l', 'knee_l']);
		this.lowerLegRNode = findBone(['J_Bip_R_LowerLeg', 'mixamorig:RightLeg', 'lower_leg.r', 'calf.r', 'shin.r', 'knee_r']);

		this.hairBones = [];
		this.skirtBones = [];
		this.fingerBonesL = { thumb: [], index: [], middle: [], others: [] };
		this.fingerBonesR = { thumb: [], index: [], middle: [], others: [] };
		this.initialRotations.clear();
		this.initialPositions.clear();

		group.traverse((c) => {
			if ((c as any).isBone || (c as any).isObject3D) {
				const name = c.name.toLowerCase();
				if (name.includes('hair') || name.includes('pigtail') || name.includes('ahoge')) this.hairBones.push(c);
				if (name.includes('skirt') || name.includes('cape') || name.includes('bowie') || name.includes('ribbon')) this.skirtBones.push(c);

				// Discover fingers (excluding skirts and non-finger accessories)
				if (!name.includes('skirt')) {
					const isLeft = name.includes('_l_') || name.includes('fingerl') || name.includes('left') || (name.endsWith('l') && !name.endsWith('all') && !name.endsWith('roll'));
					const isRight = name.includes('_r_') || name.includes('fingerr') || name.includes('right') || (name.endsWith('r') && !name.endsWith('bar'));
					const target = isLeft ? this.fingerBonesL : isRight ? this.fingerBonesR : null;
					if (target) {
						if (name.includes('thumb')) target.thumb.push(c);
						else if (name.includes('index')) target.index.push(c);
						else if (name.includes('middle')) target.middle.push(c);
						else if (name.includes('ring') || name.includes('little') || name.includes('pinky')) target.others.push(c);
					}
				}

				this.initialRotations.set(c, c.rotation.clone());
				this.initialPositions.set(c, c.position.clone());
			}
		});
	}

	// 2. Load Any External GLTF / GLB Model
	async loadGLTF(url: string) {
		const token = ++this.activeLoadToken;
		this.showLoadingSkeleton();
		this.clearCurrentModel();
		this.modelType = 'glb';

		const loader = new GLTFLoader();
		const gltf = await loader.loadAsync(url);
		if (token !== this.activeLoadToken) {
			this.hideLoadingSkeleton();
			return;
		}
		this.clearCurrentModel();
		const model = gltf.scene;
		this.currentModelGroup = model;

		// Calculate bounding box and center model
		const box = new THREE.Box3().setFromObject(model);
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const scale = 1.7 / (maxDim || 1);
		model.scale.set(scale, scale, scale);

		const center = box.getCenter(new THREE.Vector3());
		this.modelBasePosition.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
		model.position.set(
			this.modelBasePosition.x + this.modelOffsetX,
			this.modelBasePosition.y + this.modelOffsetY,
			this.modelBasePosition.z + this.modelOffsetZ
		);

		model.traverse((child) => {
			if ((child as any).isMesh) {
				const mesh = child as THREE.Mesh;
				mesh.castShadow = false;
				mesh.receiveShadow = false;
				if (mesh.material) {
					const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
					mats.forEach((m) => {
						if (m.transparent && m.opacity > 0.8) {
							m.depthWrite = true;
						}
					});
				}
			}
		});

		this.setupVRMMorphTargets(gltf);
		this.discoverHumanoidBones(model);

		// Animation mixer if GLTF has clips
		if (gltf.animations && gltf.animations.length > 0) {
			this.mixer = new THREE.AnimationMixer(model);
			const action = this.mixer.clipAction(gltf.animations[0]);
			action.play();
		}

		if (token !== this.activeLoadToken) {
			this.hideLoadingSkeleton();
			return;
		}
		this.hideLoadingSkeleton();
		model.rotation.y = this.modelRotationY;
		this.scene.add(model);
		this.setFraming(this.currentFraming);
	}

	// 3. Load Humanoid Neuro-sama FBX Model with 4K Textures & VRChat BlendShapes
	async loadNeuroSama() {
		const token = ++this.activeLoadToken;
		this.showLoadingSkeleton();
		this.clearCurrentModel();
		this.modelType = 'fbx';

		const loader = new FBXLoader();
		const texLoader = new THREE.TextureLoader();

		const loadTexAsync = async (url: string) => {
			try {
				const t = await texLoader.loadAsync(url);
				t.colorSpace = THREE.SRGBColorSpace;
				t.needsUpdate = true;
				return t;
			} catch {
				const fallback = new THREE.Texture();
				fallback.colorSpace = THREE.SRGBColorSpace;
				return fallback;
			}
		};

		const [group, texExp, texSec, texClothes, texHair, texBody] = await Promise.all([
			loader.loadAsync('/models/neurosama/neuro-sama.fbx'),
			loadTexAsync('/models/neurosama/textures/neuroexpresions_vrc.png'),
			loadTexAsync('/models/neurosama/textures/secondary_clothes_neuro_vrc.png'),
			loadTexAsync('/models/neurosama/textures/clothes_neuro_vrc.png'),
			loadTexAsync('/models/neurosama/textures/neuro_hair_vrc.png'),
			loadTexAsync('/models/neurosama/textures/body_neuro_vrc.png')
		]);

		if (token !== this.activeLoadToken) {
			this.hideLoadingSkeleton();
			return;
		}
		this.clearCurrentModel();
		this.currentModelGroup = group;

		const textures = {
			expressions: texExp,
			secondaryClothes: texSec,
			clothes: texClothes,
			hair: texHair,
			body: texBody
		};

		const toonGradient = this.getOrCreateToonGradient();

		group.traverse((child) => {
			if ((child as any).isMesh) {
				const mesh = child as THREE.SkinnedMesh;
				mesh.castShadow = false;
				mesh.receiveShadow = false; // Prevent harsh polygonal self-shadow artifacts across anime face

				if (mesh.morphTargetDictionary) {
					this.morphMesh = mesh;
					this.morphDict = mesh.morphTargetDictionary;
					if (typeof window !== 'undefined') {
						import('#lib/stores/riggingStore.svelte').then(({ rigging }) => {
							rigging.availableExpressions = [
								{ id: 'stars', name: 'stars', label: '⭐ Starry Eyes (Neuro-sama)' },
								{ id: 'blush', name: 'blush', label: '😳 Blush Pipi Merah' },
								{ id: 'vrc.blink', name: 'wink', label: '😉 Kedip Mata (Wink)' },
								{ id: 'vrc.ee', name: 'smile', label: '😁 Senyum Lebar (EE)' },
								{ id: 'vrc.aa', name: 'open', label: '🗣️ Mulut Terbuka Bicara (AA)' },
								{ id: 'vrc.oh', name: 'surprised', label: '😮 Kaget / Terkejut (OH)' },
								{ id: 'vrc.ou', name: 'pout', label: '😗 Cemberut / Pout (OU)' }
							];
						}).catch(() => {});
					}
				}

				if (Array.isArray(mesh.material)) {
					// Build dedicated anime cel-shaded toon materials that match YouTube/Twitch stream look:
					// Slot 0: Expressions (eyes, blush, open mouth) - unlit basic material for crystal-clear vibrant eyes & expressions
					// Slot 1: Secondary clothes (ribbons, collar tie, cuffs, gold trim) - cel-shaded toon
					// Slot 2: Main clothes (school uniform, dark navy sailor skirt, shoes) - crisp navy without milky wash
					// Slot 3: Hair (chestnut brown twin-tails, bangs, strands) - rich warm brown with cel highlights
					// Slot 4: Body (face, skin, base eyes) - luminous warm anime skin tone without dirty shadows
					const toonMaterials: THREE.Material[] = [
						new THREE.MeshBasicMaterial({
							map: textures.expressions,
							transparent: true,
							alphaTest: 0.02,
							depthWrite: false, // Prevents z-fighting with facial skin geometry
							depthTest: true,
							side: THREE.DoubleSide
						}),
						new THREE.MeshToonMaterial({
							map: textures.secondaryClothes,
							gradientMap: toonGradient,
							color: new THREE.Color(0xffffff),
							transparent: true,
							alphaTest: 0.5,
							side: THREE.DoubleSide
						}),
						new THREE.MeshToonMaterial({
							map: textures.clothes,
							gradientMap: toonGradient,
							color: new THREE.Color(0xffffff),
							side: THREE.DoubleSide
						}),
						new THREE.MeshToonMaterial({
							map: textures.hair,
							gradientMap: toonGradient,
							color: new THREE.Color(0xffffff),
							transparent: true,
							alphaTest: 0.5,
							depthWrite: true,
							side: THREE.DoubleSide
						}),
						new THREE.MeshToonMaterial({
							map: textures.body,
							gradientMap: toonGradient,
							color: new THREE.Color(0xffffff),
							side: THREE.DoubleSide
						})
					];

					// Dispose old default FBX materials to prevent texture/GPU leaks
					mesh.material.forEach((oldMat) => oldMat.dispose());
					mesh.material = toonMaterials;
				}
			}
		});

		// Ground model on floor and center along X and Z
		const box = new THREE.Box3().setFromObject(group);
		const center = box.getCenter(new THREE.Vector3());
		this.modelBasePosition.set(-center.x, -box.min.y, -center.z);
		group.position.set(
			this.modelBasePosition.x + this.modelOffsetX,
			this.modelBasePosition.y + this.modelOffsetY,
			this.modelBasePosition.z + this.modelOffsetZ
		);

		this.discoverHumanoidBones(group);

		if (token !== this.activeLoadToken) {
			this.hideLoadingSkeleton();
			return;
		}
		this.hideLoadingSkeleton();
		group.rotation.y = this.modelRotationY;
		this.scene.add(group);
		this.setFraming(this.currentFraming);
	}

	// 4. Load Humanoid Manhattan Cafe Model (Uma Musume Pretty Derby) GLB with Full Rig & Expressions
	async loadManhattanCafe() {
		const token = ++this.activeLoadToken;
		this.showLoadingSkeleton();
		this.clearCurrentModel();
		this.modelType = 'glb';

		const loader = new GLTFLoader();
		const gltf = await loader.loadAsync('/models/manhattan-cafe/manhattan-cafe.glb');

		if (token !== this.activeLoadToken) {
			this.hideLoadingSkeleton();
			return;
		}
		this.clearCurrentModel();
		const group = gltf.scene;
		this.currentModelGroup = group;

		// Center & scale
		const box = new THREE.Box3().setFromObject(group);
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const scale = 1.7 / (maxDim || 1);
		group.scale.set(scale, scale, scale);

		const center = box.getCenter(new THREE.Vector3());
		this.modelBasePosition.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
		group.position.set(
			this.modelBasePosition.x + this.modelOffsetX,
			this.modelBasePosition.y + this.modelOffsetY,
			this.modelBasePosition.z + this.modelOffsetZ
		);

		group.traverse((child) => {
			if ((child as any).isMesh) {
				const mesh = child as THREE.Mesh;
				mesh.castShadow = false;
				mesh.receiveShadow = false;
				if (mesh.material) {
					const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
					mats.forEach((m) => {
						if (m.transparent && m.opacity > 0.8) {
							m.depthWrite = true;
						}
					});
				}
			}
		});

		this.setupVRMMorphTargets(gltf);
		this.discoverHumanoidBones(group);

		if (token !== this.activeLoadToken) {
			this.hideLoadingSkeleton();
			return;
		}
		this.hideLoadingSkeleton();
		group.rotation.y = this.modelRotationY;
		this.scene.add(group);
		this.setFraming(this.currentFraming);
	}

	// 5. Load Any External Generic FBX Model
	async loadFBX(url: string) {
		if (url.includes('manhattan') || url.includes('cafe')) {
			return this.loadManhattanCafe();
		}
		if (url.includes('neuro') || url.includes('vedal')) {
			return this.loadNeuroSama();
		}

		const token = ++this.activeLoadToken;
		this.showLoadingSkeleton();
		this.clearCurrentModel();
		this.modelType = 'fbx';

		const loader = new FBXLoader();
		const group = await loader.loadAsync(url);
		if (token !== this.activeLoadToken) {
			this.hideLoadingSkeleton();
			return;
		}
		this.clearCurrentModel();
		this.currentModelGroup = group;

		// Center & scale
		const box = new THREE.Box3().setFromObject(group);
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const scale = 1.8 / (maxDim || 1);
		group.scale.set(scale, scale, scale);

		const center = box.getCenter(new THREE.Vector3());
		this.modelBasePosition.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
		group.position.set(
			this.modelBasePosition.x + this.modelOffsetX,
			this.modelBasePosition.y + this.modelOffsetY,
			this.modelBasePosition.z + this.modelOffsetZ
		);

		group.traverse((child) => {
			if ((child as any).isMesh) {
				const mesh = child as THREE.SkinnedMesh;
				if (mesh.morphTargetDictionary) {
					this.morphMesh = mesh;
					this.morphDict = mesh.morphTargetDictionary;
				}
			}
		});
		this.discoverHumanoidBones(group);

		if (token !== this.activeLoadToken) {
			this.hideLoadingSkeleton();
			return;
		}
		this.hideLoadingSkeleton();
		group.rotation.y = this.modelRotationY;
		this.scene.add(group);
		this.setFraming(this.currentFraming);
	}

	private updateHumanoidArms(params: Record<string, number>, time: number) {
		const initArmL = this.armLNode ? this.initialRotations.get(this.armLNode) : null;
		const initArmR = this.armRNode ? this.initialRotations.get(this.armRNode) : null;
		const initForeL = this.forearmLNode ? this.initialRotations.get(this.forearmLNode) : null;
		const initForeR = this.forearmRNode ? this.initialRotations.get(this.forearmRNode) : null;
		const initHandL = this.handLNode ? this.initialRotations.get(this.handLNode) : null;
		const initHandR = this.handRNode ? this.initialRotations.get(this.handRNode) : null;

		if (!initArmL || !initArmR || !this.armLNode || !this.armRNode) return;

		// Tracking values from MediaPipe webcam tracker
		const armLA = params['ParamArmLA'] ?? 0;
		const armRA = params['ParamArmRA'] ?? 0;
		const isHighFiveL = (params['ParamArmLB'] ?? 0) > 0.5 || armLA > 25;
		const isHighFiveR = (params['ParamArmRB'] ?? 0) > 0.5 || armRA > 25;

		const isWavingArm = this.activeFullBodyPose === 'wave' || this.poseLoopMode === 'wave';
		if (isWavingArm) {
			// Melambaikan tangan kanan
			this.armRNode.rotation.z = initArmR.z + 0.25;
			this.armRNode.rotation.x = initArmR.x - 0.7;
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 0.9;
				this.forearmRNode.rotation.x = initForeR.x + Math.sin(time * 0.008) * 0.35;
			}
			if (this.handRNode && initHandR) {
				this.handRNode.rotation.z = initHandR.z + Math.sin(time * 0.008) * 0.45;
			}
			// Left arm relaxed down at side
			if (this.modelType === 'fbx') {
				this.armLNode.rotation.x = initArmL.x - 0.45;
				this.armLNode.rotation.y = initArmL.y;
				this.armLNode.rotation.z = initArmL.z;
			} else {
				this.armLNode.rotation.z = initArmL.z + 1.18;
				this.armLNode.rotation.x = initArmL.x;
				this.armLNode.rotation.y = initArmL.y;
			}
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.copy(initForeL);
			}
			if (this.handLNode && initHandL) {
				this.handLNode.rotation.copy(initHandL);
			}
		} else if (this.activeFullBodyPose === 'peace') {
			// Pose V / Peace sign
			this.armRNode.rotation.z = initArmR.z + 0.2;
			this.armRNode.rotation.y = initArmR.y - 0.4;
			this.armRNode.rotation.x = initArmR.x - 0.85;
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 1.25;
			}
			if (this.handRNode && initHandR) {
				this.handRNode.rotation.y = initHandR.y + 0.5;
			}
			// Left arm relaxed down at side
			if (this.modelType === 'fbx') {
				this.armLNode.rotation.x = initArmL.x - 0.45;
				this.armLNode.rotation.y = initArmL.y;
				this.armLNode.rotation.z = initArmL.z;
			} else {
				this.armLNode.rotation.z = initArmL.z + 1.18;
				this.armLNode.rotation.x = initArmL.x;
				this.armLNode.rotation.y = initArmL.y;
			}
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.copy(initForeL);
			}
			if (this.handLNode && initHandL) {
				this.handLNode.rotation.copy(initHandL);
			}
			this.updateFingerGestures('none', 'peace', false, false);
		} else if (this.activeFullBodyPose === 'heart') {
			// Pose Hati / Heart shape
			this.armLNode.rotation.z = initArmL.z - 0.7;
			this.armLNode.rotation.x = initArmL.x - 0.5;
			this.armRNode.rotation.z = initArmR.z + 0.7;
			this.armRNode.rotation.x = initArmR.x - 0.5;
			if (this.forearmLNode && initForeL) this.forearmLNode.rotation.z = initForeL.z - 0.8;
			if (this.forearmRNode && initForeR) this.forearmRNode.rotation.z = initForeR.z + 0.8;
		} else if (this.activeFullBodyPose === 'stand') {
			// Pose tegak formal santai: kedua tangan turun lurus ke bawah di samping paha
			if (this.modelType === 'fbx') {
				this.armLNode.rotation.set(initArmL.x - 0.45, initArmL.y, initArmL.z);
				this.armRNode.rotation.set(initArmR.x - 0.45, initArmR.y, initArmR.z);
			} else {
				this.armLNode.rotation.set(initArmL.x, initArmL.y, initArmL.z + 1.18);
				this.armRNode.rotation.set(initArmR.x, initArmR.y, initArmR.z - 1.18);
			}
			if (this.forearmLNode && initForeL) this.forearmLNode.rotation.copy(initForeL);
			if (this.forearmRNode && initForeR) this.forearmRNode.rotation.copy(initForeR);
			if (this.handLNode && initHandL) this.handLNode.rotation.copy(initHandL);
			if (this.handRNode && initHandR) this.handRNode.rotation.copy(initHandR);
		} else if (this.activeFullBodyPose === 'cat-paw') {
			// Pose Nya / Cakar Kucing: kedua tangan terangkat ke depan pipi/dada melengkung gemas
			this.armLNode.rotation.z = initArmL.z - 0.75;
			this.armLNode.rotation.x = initArmL.x - 0.65;
			this.armRNode.rotation.z = initArmR.z + 0.75;
			this.armRNode.rotation.x = initArmR.x - 0.65;
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.z = initForeL.z - 1.25;
				this.forearmLNode.rotation.x = initForeL.x + 0.35;
			}
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 1.25;
				this.forearmRNode.rotation.x = initForeR.x + 0.35;
			}
			if (this.handLNode && initHandL) {
				this.handLNode.rotation.x = initHandL.x + 0.45 + Math.sin(time * 0.005) * 0.15;
			}
			if (this.handRNode && initHandR) {
				this.handRNode.rotation.x = initHandR.x + 0.45 - Math.sin(time * 0.005) * 0.15;
			}
		} else if (this.activeFullBodyPose === 'sit') {
			// Pose Duduk Santai / Seiza / Kursi Gaming: tangan rileks bertumpu di paha
			this.armLNode.rotation.z = initArmL.z - 1.15;
			this.armLNode.rotation.x = initArmL.x + 0.15;
			this.armRNode.rotation.z = initArmR.z + 1.15;
			this.armRNode.rotation.x = initArmR.x + 0.15;
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.x = initForeL.x - 0.75;
				this.forearmLNode.rotation.y = initForeL.y + 0.35;
			}
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.x = initForeR.x - 0.75;
				this.forearmRNode.rotation.y = initForeR.y - 0.35;
			}
		} else if (this.activeFullBodyPose === 'shy') {
			// Pose Malu-malu / Tunjuk Jari: kedua telunjuk bertemu di depan dada
			this.armLNode.rotation.z = initArmL.z - 0.6;
			this.armLNode.rotation.x = initArmL.x - 0.5;
			this.armLNode.rotation.y = initArmL.y + 0.35;
			this.armRNode.rotation.z = initArmR.z + 0.6;
			this.armRNode.rotation.x = initArmR.x - 0.5;
			this.armRNode.rotation.y = initArmR.y - 0.35;
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.z = initForeL.z - 0.95;
				this.forearmLNode.rotation.y = initForeL.y + 0.45;
			}
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 0.95;
				this.forearmRNode.rotation.y = initForeR.y - 0.45;
			}
		} else if (this.activeFullBodyPose === 'tsundere') {
			// Pose Tsundere / Kacak Pinggang: tangan di pinggang, siku mengembang keluar
			this.armLNode.rotation.z = initArmL.z - 0.85;
			this.armLNode.rotation.x = initArmL.x - 0.25;
			this.armLNode.rotation.y = initArmL.y - 0.5;
			this.armRNode.rotation.z = initArmR.z + 0.85;
			this.armRNode.rotation.x = initArmR.x - 0.25;
			this.armRNode.rotation.y = initArmR.y + 0.5;
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.z = initForeL.z - 1.15;
				this.forearmLNode.rotation.x = initForeL.x + 0.4;
			}
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 1.15;
				this.forearmRNode.rotation.x = initForeR.x + 0.4;
			}
		} else if (this.activeFullBodyPose === 'thinking') {
			// Pose Berpikir / Topang Dagu: tangan kanan menopang dagu, tangan kiri menyangga siku kanan
			this.armRNode.rotation.z = initArmR.z + 0.45;
			this.armRNode.rotation.x = initArmR.x - 0.85;
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 1.35;
				this.forearmRNode.rotation.y = initForeR.y - 0.3;
			}
			if (this.handRNode && initHandR) {
				this.handRNode.rotation.x = initHandR.x - 0.3;
			}
			this.armLNode.rotation.z = initArmL.z - 0.65;
			this.armLNode.rotation.x = initArmL.x - 0.35;
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.z = initForeL.z - 0.75;
				this.forearmLNode.rotation.y = initForeL.y + 0.6;
			}
		} else if (this.activeFullBodyPose === 'idol') {
			// Pose Idol Sparkle: tangan kanan salute di dekat pelipis, tangan kiri terulur anggun
			this.armRNode.rotation.z = initArmR.z + 0.35;
			this.armRNode.rotation.x = initArmR.x - 1.05;
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 1.45;
				this.forearmRNode.rotation.x = initForeR.x - 0.2;
			}
			this.armLNode.rotation.z = initArmL.z - 0.45;
			this.armLNode.rotation.x = initArmL.x - 0.2;
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.y = initForeL.y + 0.35;
			}
		} else if (this.activeFullBodyPose === 'bow') {
			// Pose Membungkuk / Ojigi: kedua tangan diletakkan sopan di depan paha
			this.armLNode.rotation.z = initArmL.z - 0.95;
			this.armLNode.rotation.x = initArmL.x - 0.2;
			this.armRNode.rotation.z = initArmR.z + 0.95;
			this.armRNode.rotation.x = initArmR.x - 0.2;
			if (this.forearmLNode && initForeL) this.forearmLNode.rotation.y = initForeL.y + 0.45;
			if (this.forearmRNode && initForeR) this.forearmRNode.rotation.y = initForeR.y - 0.45;
		} else if (this.activeFullBodyPose === 'cross-arms') {
			// Pose Sedekap Dada / Folded Arms: kedua tangan terlipat di depan dada percaya diri
			this.armLNode.rotation.z = initArmL.z - 0.7;
			this.armLNode.rotation.x = initArmL.x - 0.45;
			this.armRNode.rotation.z = initArmR.z + 0.7;
			this.armRNode.rotation.x = initArmR.x - 0.45;
			if (this.forearmLNode && initForeL) {
				this.forearmLNode.rotation.z = initForeL.z - 1.1;
				this.forearmLNode.rotation.y = initForeL.y + 0.7;
			}
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 1.1;
				this.forearmRNode.rotation.y = initForeR.y - 0.7;
			}
		} else {
			// IDLE & WEBCAM REAL-TIME HAND TRACKING:
			const breathSway = Math.sin(time * 0.002) * 0.025;
			const handAngleL = params['ParamHandAngleL'] ?? 0;
			const handAngleR = params['ParamHandAngleR'] ?? 0;

			// LEFT ARM:
			const liftRatioL = Math.max(0, Math.min(1.0, armLA / 28));
			const effLiftL = isHighFiveL ? Math.max(liftRatioL, 0.95) : liftRatioL;

			// RIGHT ARM:
			const liftRatioR = Math.max(0, Math.min(1.0, armRA / 28));
			const effLiftR = isHighFiveR ? Math.max(liftRatioR, 0.95) : liftRatioR;

			if (this.modelType === 'fbx') {
				// FBX Mixamo / Neuro-sama:
				// In Mixamo rig with shoulder rotation:
				// rotation.x lowers (-0.45 = naturally relaxed hanging down by hips/thighs) / lifts (+1.5 = raised high-five)
				if (effLiftL > 0.08 || isHighFiveL) {
					this.armLNode.rotation.x = initArmL.x - 0.45 + effLiftL * 1.5;
					this.armLNode.rotation.y = initArmL.y;
					this.armLNode.rotation.z = initArmL.z - effLiftL * 0.35;
					if (this.forearmLNode && initForeL) {
						this.forearmLNode.rotation.x = initForeL.x + effLiftL * 0.6;
						this.forearmLNode.rotation.y = initForeL.y;
						this.forearmLNode.rotation.z = initForeL.z;
					}
				} else {
					// Natural cute relaxed posture: arms hanging straight down naturally at sides/thighs without aiming forward
					this.armLNode.rotation.x = initArmL.x - 0.45 + breathSway;
					this.armLNode.rotation.y = initArmL.y;
					this.armLNode.rotation.z = initArmL.z;
					if (this.forearmLNode && initForeL) {
						this.forearmLNode.rotation.copy(initForeL);
					}
				}

				if (effLiftR > 0.08 || isHighFiveR) {
					this.armRNode.rotation.x = initArmR.x - 0.45 + effLiftR * 1.5;
					this.armRNode.rotation.y = initArmR.y;
					this.armRNode.rotation.z = initArmR.z + effLiftR * 0.35;
					if (this.forearmRNode && initForeR) {
						this.forearmRNode.rotation.x = initForeR.x - effLiftR * 0.6;
						this.forearmRNode.rotation.y = initForeR.y;
						this.forearmRNode.rotation.z = initForeR.z;
					}
				} else {
					// Natural cute relaxed posture: arms hanging straight down naturally at sides/thighs without aiming forward
					this.armRNode.rotation.x = initArmR.x - 0.45 + breathSway;
					this.armRNode.rotation.y = initArmR.y;
					this.armRNode.rotation.z = initArmR.z;
					if (this.forearmRNode && initForeR) {
						this.forearmRNode.rotation.copy(initForeR);
					}
				}
			} else {
				// GLB / VRM Humanoid:
				// rotation.z lowers (+1.18 L, -1.18 R) / lifts (-1.5 L, +1.5 R)
				if (effLiftL > 0.08 || isHighFiveL) {
					this.armLNode.rotation.z = initArmL.z + 1.18 - effLiftL * 1.5;
					this.armLNode.rotation.x = initArmL.x - effLiftL * 0.35;
					this.armLNode.rotation.y = initArmL.y;
					if (this.forearmLNode && initForeL) {
						this.forearmLNode.rotation.z = initForeL.z + effLiftL * 0.6;
						this.forearmLNode.rotation.y = initForeL.y;
						this.forearmLNode.rotation.x = initForeL.x;
					}
				} else {
					this.armLNode.rotation.z = initArmL.z + 1.18 - breathSway;
					this.armLNode.rotation.x = initArmL.x;
					this.armLNode.rotation.y = initArmL.y;
					if (this.forearmLNode && initForeL) {
						this.forearmLNode.rotation.copy(initForeL);
					}
				}

				if (effLiftR > 0.08 || isHighFiveR) {
					this.armRNode.rotation.z = initArmR.z - 1.18 + effLiftR * 1.5;
					this.armRNode.rotation.x = initArmR.x - effLiftR * 0.35;
					this.armRNode.rotation.y = initArmR.y;
					if (this.forearmRNode && initForeR) {
						this.forearmRNode.rotation.z = initForeR.z - effLiftR * 0.6;
						this.forearmRNode.rotation.y = initForeR.y;
						this.forearmRNode.rotation.x = initForeR.x;
					}
				} else {
					this.armRNode.rotation.z = initArmR.z - 1.18 + breathSway;
					this.armRNode.rotation.x = initArmR.x;
					this.armRNode.rotation.y = initArmR.y;
					if (this.forearmRNode && initForeR) {
						this.forearmRNode.rotation.copy(initForeR);
					}
				}
			}

			// HAND / WRIST ROTATION & WAVING:
			if (this.handLNode && initHandL) {
				if (effLiftL > 0.08 || isHighFiveL) {
					const waveWiggle = (isHighFiveL || this.handGestureL === 'wave') ? Math.sin(time * 0.007) * 0.35 : 0;
					const handTrackingAngle = (handAngleL * Math.PI / 180) * 0.5;
					this.handLNode.rotation.z = initHandL.z + waveWiggle + handTrackingAngle;
					this.handLNode.rotation.y = initHandL.y + (isHighFiveL ? 0.3 : 0);
				} else {
					this.handLNode.rotation.copy(initHandL);
				}
			}

			if (this.handRNode && initHandR) {
				if (effLiftR > 0.08 || isHighFiveR) {
					const waveWiggle = (isHighFiveR || this.handGestureR === 'wave') ? Math.sin(time * 0.007) * 0.35 : 0;
					const handTrackingAngle = (handAngleR * Math.PI / 180) * 0.5;
					this.handRNode.rotation.z = initHandR.z - waveWiggle + handTrackingAngle;
					this.handRNode.rotation.y = initHandR.y - (isHighFiveR ? 0.3 : 0);
				} else {
					this.handRNode.rotation.copy(initHandR);
				}
			}

			// FINGER GESTURE ANIMATION (Fist, Peace, High Five / Open):
			this.updateFingerGestures(this.handGestureL, this.handGestureR, isHighFiveL, isHighFiveR);
		}
	}

	private updateFingerGestures(gestureL: string, gestureR: string, isHighFiveL: boolean, isHighFiveR: boolean) {
		const applyFingers = (
			fingers: { thumb: THREE.Object3D[]; index: THREE.Object3D[]; middle: THREE.Object3D[]; others: THREE.Object3D[] },
			gesture: string,
			isHighFive: boolean,
			isRight: boolean
		) => {
			const sign = isRight ? -1 : 1;
			const isFist = gesture === 'fist';
			const isPeace = gesture === 'peace';
			const isOpen = gesture === 'open' || gesture === 'high_five' || isHighFive;

			const curlAmount = isFist ? 0.75 : 0;
			const peaceCurl = isPeace ? 0.8 : curlAmount;

			for (const b of fingers.index) {
				const init = this.initialRotations.get(b);
				if (init) {
					const curl = isPeace || isOpen ? 0 : curlAmount;
					b.rotation.z = init.z + curl * sign;
				}
			}
			for (const b of fingers.middle) {
				const init = this.initialRotations.get(b);
				if (init) {
					const curl = isPeace || isOpen ? 0 : curlAmount;
					b.rotation.z = init.z + curl * sign;
				}
			}
			for (const b of fingers.others) {
				const init = this.initialRotations.get(b);
				if (init) {
					const curl = isOpen ? 0 : peaceCurl;
					b.rotation.z = init.z + curl * sign;
				}
			}
			for (const b of fingers.thumb) {
				const init = this.initialRotations.get(b);
				if (init) {
					const curl = isOpen ? 0 : (isFist || isPeace ? 0.45 : 0);
					b.rotation.z = init.z + curl * sign;
				}
			}
		};

		applyFingers(this.fingerBonesL, gestureL, isHighFiveL, false);
		applyFingers(this.fingerBonesR, gestureR, isHighFiveR, true);
	}

	// 5. Real-Time Vision Tracking Update Loop
	updateParameters(params: Record<string, number>) {
		const rad = Math.PI / 180;
		const yaw = (params['ParamAngleX'] || 0) * rad;
		const pitch = (params['ParamAngleY'] || 0) * rad;
		const roll = (params['ParamAngleZ'] || 0) * rad;

		const eyeBlinkL = params['ParamEyeLOpen'] ?? 1.0;
		const eyeBlinkR = params['ParamEyeROpen'] ?? 1.0;
		const eyeBallX = params['ParamEyeBallX'] ?? 0;
		const eyeBallY = params['ParamEyeBallY'] ?? 0;

		const mouthOpen = params['ParamMouthOpenY'] ?? 0;
		const mouthX = params['ParamMouthX'] ?? 0;
		const mouthForm = params['ParamMouthForm'] ?? 0;
		const armLA = params['ParamArmLA'] ?? 0;
		const armRA = params['ParamArmRA'] ?? 0;

		// Animate holographic loading skeleton if 3D model is compiling in background
		if (this.loadingSkeletonGroup) {
			const time = performance.now();
			this.loadingSkeletonGroup.position.set(
				this.modelBasePosition.x + this.modelOffsetX,
				this.modelBasePosition.y + this.modelOffsetY + Math.sin(time * 0.003) * 0.02,
				this.modelBasePosition.z + this.modelOffsetZ
			);
			this.loadingSkeletonGroup.rotation.y = this.modelRotationY;

			const scanRing = this.loadingSkeletonGroup.getObjectByName('scanRing');
			if (scanRing) {
				scanRing.position.y = 0.8 + Math.sin(time * 0.0035) * 0.55;
				scanRing.rotation.z += 0.025;
			}

			const baseRing = this.loadingSkeletonGroup.getObjectByName('baseRing');
			if (baseRing) {
				baseRing.rotation.z += 0.012;
			}
		}

		if (this.modelType === 'fbx' || this.modelType === 'glb') {
			const initHead = this.headNode ? this.initialRotations.get(this.headNode) : null;
			const initNeck = this.neckNode ? this.initialRotations.get(this.neckNode) : null;
			const initHips = this.hipsNode ? this.initialRotations.get(this.hipsNode) : null;
			const initSpine = this.spineNode ? this.initialRotations.get(this.spineNode) : null;
			const initTorso = this.torsoNode ? this.initialRotations.get(this.torsoNode) : null;

			// 1. Head & Neck Tracking (Face Recognition)
			if (this.headNode && initHead) {
				this.headNode.rotation.y = initHead.y + yaw * 0.75;
				this.headNode.rotation.x = initHead.x - pitch * 0.75;
				this.headNode.rotation.z = initHead.z - roll * 0.75;
			}
			if (this.neckNode && initNeck) {
				this.neckNode.rotation.y = initNeck.y + yaw * 0.25;
				this.neckNode.rotation.x = initNeck.x - pitch * 0.25;
				this.neckNode.rotation.z = initNeck.z - roll * 0.25;
			}

			// 2. Eye Gaze (Iris)
			if (this.eyeLNode && this.eyeRNode) {
				const initEyeL = this.initialRotations.get(this.eyeLNode);
				const initEyeR = this.initialRotations.get(this.eyeRNode);
				if (initEyeL && initEyeR) {
					this.eyeLNode.rotation.y = initEyeL.y + eyeBallX * 0.2;
					this.eyeLNode.rotation.x = initEyeL.x - eyeBallY * 0.15;
					this.eyeRNode.rotation.y = initEyeR.y + eyeBallX * 0.2;
					this.eyeRNode.rotation.x = initEyeR.x - eyeBallY * 0.15;
				}
			}

			// 3. Morph Targets (Expressions & Lip-Sync)
			if (this.morphMesh && this.morphMesh.morphTargetInfluences) {
				const dict = this.morphDict;
				const infl = this.morphMesh.morphTargetInfluences;

				const isSmile = this.activeExpression === 'smile' || this.activeExpression === 'vrc.ee' || this.activeExpression === 'laugh' || this.activeExpression === 'love' || this.activeExpression === 'smug';
				const isWink = this.activeExpression === 'wink' || this.activeExpression === 'vrc.blink' || this.activeExpression === 'sleepy' || this.activeExpression === 'dazed';
				const isMouthOpen = this.activeExpression === 'vrc.aa' || this.activeExpression === 'open' || this.activeExpression === 'laugh' || this.activeExpression === 'tongue';
				const isSurprised = this.activeExpression === 'vrc.oh' || this.activeExpression === 'surprised' || this.activeExpression === 'surprise' || this.activeExpression === 'cry';
				const isPout = this.activeExpression === 'vrc.ou' || this.activeExpression === 'pout' || this.activeExpression === 'angry' || this.activeExpression === 'cry' || this.activeExpression === 'smug';
				const isStars = this.activeExpression === 'stars' || this.activeExpression === 'love' || this.activeExpression === 'dazed';
				const isBlush = this.activeExpression === 'blush' || this.activeExpression === 'love' || this.activeExpression === 'pout';

				// Eye Blink
				const blinkIdx = dict['vrc.blink'] ?? dict['Blink'] ?? dict['blink'];
				if (blinkIdx !== undefined) {
					const avgBlink = Math.min(eyeBlinkL, eyeBlinkR);
					const blinkVal = Math.max(0, Math.min(1.0, (1.0 - avgBlink) * 1.25));
					infl[blinkIdx] = isWink ? 1.0 : blinkVal;
				}

				// Lip sync mouth open
				const aaIdx = dict['vrc.aa'] ?? dict['A'] ?? dict['a'];
				const ohIdx = dict['vrc.oh'] ?? dict['O'] ?? dict['o'];
				if (aaIdx !== undefined) {
					infl[aaIdx] = isMouthOpen ? 1.0 : Math.max(0, Math.min(1.0, mouthOpen * 1.5));
				}
				if (ohIdx !== undefined) {
					infl[ohIdx] = isSurprised
						? 1.0
						: (mouthOpen > 0.4 && Math.abs(mouthForm) < 0.2 ? mouthOpen * 0.8 : 0);
				}

				// Smile
				const eeIdx = dict['vrc.ee'] ?? dict['Joy'] ?? dict['Fun'] ?? dict['joy'] ?? dict['fun'] ?? dict['E'] ?? dict['I'];
				if (eeIdx !== undefined) {
					const smileVal = mouthForm > 0.1 ? mouthForm : 0;
					infl[eeIdx] = isSmile ? 1.0 : Math.max(0, Math.min(1.0, smileVal));
				}

				// Star eyes (Neuro-sama signature!)
				const starsIdx = dict['stars'];
				if (starsIdx !== undefined) {
					infl[starsIdx] = isStars ? 1.0 : 0;
				}

				// Blush
				const blushIdx = dict['blush'];
				if (blushIdx !== undefined) {
					const autoBlush = mouthForm > 0.5 ? 0.4 : 0;
					infl[blushIdx] = isBlush ? 1.0 : autoBlush;
				}

				// Pout / OU
				const ouIdx = dict['vrc.ou'];
				if (ouIdx !== undefined) {
					infl[ouIdx] = isPout ? 1.0 : 0;
				}

				// Generic fallback for any arbitrary model morph target
				if (this.activeExpression && dict[this.activeExpression] !== undefined) {
					infl[dict[this.activeExpression]] = 1.0;
				}
			}

			// 4. Full Body Sway & Breathing Physics
			const time = performance.now();
			const loopSpeed = this.poseLoopSpeed || 1.0;
			const isLoopSway = this.poseLoopMode === 'gentle-sway';
			const isLoopNod = this.poseLoopMode === 'head-nod';
			const loopSwayOffset = isLoopSway ? Math.sin(time * 0.0018 * loopSpeed) * 0.08 : 0;
			const loopNodOffset = isLoopNod ? Math.sin(time * 0.004 * loopSpeed) * 0.1 : 0;
			const breathOffset = Math.sin(time * 0.002 * loopSpeed) * 0.02;
			const isBow = this.activeFullBodyPose === 'bow';
			const isSit = this.activeFullBodyPose === 'sit';

			if (this.headNode && initHead && isLoopNod) {
				this.headNode.rotation.x += loopNodOffset;
			}

			if (this.spineNode && initSpine) {
				this.spineNode.rotation.y = initSpine.y + yaw * 0.15;
				this.spineNode.rotation.x = initSpine.x + breathOffset + (isBow ? 0.42 : 0);
				this.spineNode.rotation.z = initSpine.z - roll * 0.1 + loopSwayOffset;
			}
			if (this.torsoNode && initTorso) {
				this.torsoNode.rotation.y = initTorso.y + yaw * 0.1;
				this.torsoNode.rotation.x = initTorso.x + breathOffset * 1.2 + (isBow ? 0.35 : 0);
				this.torsoNode.rotation.z = initTorso.z + loopSwayOffset * 0.5;
			}
			if (this.hipsNode && initHips) {
				const initHipsPos = this.initialPositions.get(this.hipsNode);
				if (initHipsPos) {
					this.hipsNode.position.y = initHipsPos.y + (isSit ? -0.32 : Math.sin(time * 0.002 * loopSpeed) * 0.004);
				}
				this.hipsNode.rotation.y = initHips.y + Math.sin(time * 0.001 * loopSpeed) * 0.015;
				this.hipsNode.rotation.z = initHips.z + loopSwayOffset * 0.7;
			}

			// Leg Bending when Sitting (Sit Pose)
			if (this.upperLegLNode && this.upperLegRNode) {
				const initLegL = this.initialRotations.get(this.upperLegLNode);
				const initLegR = this.initialRotations.get(this.upperLegRNode);
				if (initLegL && initLegR) {
					if (isSit) {
						this.upperLegLNode.rotation.x = initLegL.x - 1.45;
						this.upperLegRNode.rotation.x = initLegR.x - 1.45;
					} else {
						this.upperLegLNode.rotation.copy(initLegL);
						this.upperLegRNode.rotation.copy(initLegR);
					}
				}
			}
			if (this.lowerLegLNode && this.lowerLegRNode) {
				const initKneeL = this.initialRotations.get(this.lowerLegLNode);
				const initKneeR = this.initialRotations.get(this.lowerLegRNode);
				if (initKneeL && initKneeR) {
					if (isSit) {
						this.lowerLegLNode.rotation.x = initKneeL.x + 1.45;
						this.lowerLegRNode.rotation.x = initKneeR.x + 1.45;
					} else {
						this.lowerLegLNode.rotation.copy(initKneeL);
						this.lowerLegRNode.rotation.copy(initKneeR);
					}
				}
			}

			// 5. Humanoid Arms (Gestures & Idle)
			this.updateHumanoidArms(params, time);

			// 6. Secondary Hair & Skirt Rest Pose (Skirt firmly locked to authored drape)
			const sway = Math.sin(time * 0.003) * 0.035;
			for (const b of this.hairBones) {
				const initRot = this.initialRotations.get(b);
				if (initRot) {
					b.rotation.z = initRot.z + sway;
				}
			}
			for (const b of this.skirtBones) {
				const initRot = this.initialRotations.get(b);
				if (initRot) {
					b.rotation.copy(initRot);
				}
			}
			return;
		}

		// Procedural Cat Mode
		if (this.modelType === 'procedural') {
			if (this.headNode) {
				this.headNode.rotation.y = yaw;
				this.headNode.rotation.x = -pitch;
				this.headNode.rotation.z = -roll;
			}

			if (this.earLNode) {
				this.earLNode.rotation.z = 0.35 + yaw * 0.2;
			}
			if (this.earRNode) {
				this.earRNode.rotation.z = -0.35 + yaw * 0.2;
			}

			if (this.eyeLNode) {
				this.eyeLNode.scale.y = Math.max(0.08, eyeBlinkL);
				this.eyeLNode.position.x = -0.2 + eyeBallX * 0.04;
				this.eyeLNode.position.y = 0.05 + eyeBallY * 0.03;
			}
			if (this.eyeRNode) {
				this.eyeRNode.scale.y = Math.max(0.08, eyeBlinkR);
				this.eyeRNode.position.x = 0.2 + eyeBallX * 0.04;
				this.eyeRNode.position.y = 0.05 + eyeBallY * 0.03;
			}

			if (this.mouthNode) {
				this.mouthNode.scale.y = Math.max(0.2, 1 + mouthOpen * 3.5);
				this.mouthNode.scale.x = Math.max(0.5, 1 + Math.abs(mouthForm) * 0.35);
				this.mouthNode.position.x = mouthX * 0.05;
				this.mouthNode.position.y = -0.14 - mouthOpen * 0.06;
				this.mouthNode.rotation.z = mouthForm < -0.15 ? 0 : Math.PI;
			}

			const isHighFiveL = armLA > 24 || (params['ParamArmLB'] ?? 0) > 0.5;
			const isHighFiveR = armRA > 24 || (params['ParamArmRB'] ?? 0) > 0.5;
			const animTime = performance.now();

			if (this.pawLNode && this.pawRNode) {
				const isWavingCat = this.activeFullBodyPose === 'wave' || this.poseLoopMode === 'wave';
				if (this.activeFullBodyPose === 'cat-paw') {
					// Cute animated pawing in front of chest
					this.pawLNode.position.set(-0.32, -0.05 + Math.sin(animTime * 0.006) * 0.04, 0.55);
					this.pawRNode.position.set(0.32, -0.05 - Math.sin(animTime * 0.006) * 0.04, 0.55);
					this.pawLNode.rotation.set(-0.4, 0, 0.3);
					this.pawRNode.rotation.set(-0.4, 0, -0.3);
				} else if (isWavingCat) {
					this.pawLNode.position.set(-0.36, -0.3, 0.4);
					this.pawLNode.rotation.set(0, 0, 0);
					this.pawRNode.position.set(0.32, 0.15, 0.5);
					this.pawRNode.rotation.set(-0.5, 0, Math.sin(animTime * 0.008) * 0.45);
				} else if (this.activeFullBodyPose === 'sit') {
					this.pawLNode.position.set(-0.34, -0.45, 0.42);
					this.pawRNode.position.set(0.34, -0.45, 0.42);
					this.pawLNode.rotation.set(0, 0, 0);
					this.pawRNode.rotation.set(0, 0, 0);
				} else if (this.activeFullBodyPose === 'peace' || this.activeFullBodyPose === 'heart') {
					this.pawLNode.position.set(-0.16, -0.05, 0.5);
					this.pawRNode.position.set(0.16, -0.05, 0.5);
					this.pawLNode.rotation.set(-0.3, 0, 0.4);
					this.pawRNode.rotation.set(-0.3, 0, -0.4);
				} else if (this.activeFullBodyPose === 'shy') {
					this.pawLNode.position.set(-0.12, -0.05, 0.52);
					this.pawRNode.position.set(0.12, -0.05, 0.52);
					this.pawLNode.rotation.set(-0.2, 0, 0.2);
					this.pawRNode.rotation.set(-0.2, 0, -0.2);
				} else if (this.activeFullBodyPose === 'tsundere') {
					this.pawLNode.position.set(-0.45, -0.22, 0.35);
					this.pawRNode.position.set(0.45, -0.22, 0.35);
					this.pawLNode.rotation.set(-0.1, 0, -0.4);
					this.pawRNode.rotation.set(-0.1, 0, 0.4);
				} else if (this.activeFullBodyPose === 'thinking') {
					this.pawRNode.position.set(0.2, 0.08, 0.52);
					this.pawRNode.rotation.set(-0.5, 0, -0.3);
					this.pawLNode.position.set(-0.15, -0.25, 0.45);
					this.pawLNode.rotation.set(0, 0, 0.2);
				} else if (this.activeFullBodyPose === 'idol') {
					this.pawRNode.position.set(0.35, 0.25, 0.45);
					this.pawRNode.rotation.set(-0.4, 0, 0.4);
					this.pawLNode.position.set(-0.35, -0.15, 0.45);
					this.pawLNode.rotation.set(0.2, 0, -0.3);
				} else if (this.activeFullBodyPose === 'bow') {
					this.pawLNode.position.set(-0.16, -0.4, 0.5);
					this.pawRNode.position.set(0.16, -0.4, 0.5);
					this.pawLNode.rotation.set(0.3, 0, 0);
					this.pawRNode.rotation.set(0.3, 0, 0);
				} else if (this.activeFullBodyPose === 'cross-arms') {
					this.pawLNode.position.set(-0.08, -0.15, 0.5);
					this.pawRNode.position.set(0.08, -0.15, 0.5);
					this.pawLNode.rotation.set(-0.2, 0, 0.5);
					this.pawRNode.rotation.set(-0.2, 0, -0.5);
				} else if (this.activeFullBodyPose === 'stand') {
					this.pawLNode.position.set(-0.36, -0.42, 0.38);
					this.pawRNode.position.set(0.36, -0.42, 0.38);
					this.pawLNode.rotation.set(0, 0, 0);
					this.pawRNode.rotation.set(0, 0, 0);
				} else {
					const liftL = armLA / 30;
					this.pawLNode.position.y = -0.3 + liftL * 0.45;
					this.pawLNode.position.z = 0.4 + (isHighFiveL ? 0.35 : liftL * 0.15);
					this.pawLNode.rotation.z = liftL * 0.4;
					this.pawLNode.rotation.x = isHighFiveL ? -1.1 : -liftL * 0.5;

					const liftR = armRA / 30;
					this.pawRNode.position.y = -0.3 + liftR * 0.45;
					this.pawRNode.position.z = 0.4 + (isHighFiveR ? 0.35 : liftR * 0.15);
					this.pawRNode.rotation.z = -liftR * 0.4;
					this.pawRNode.rotation.x = isHighFiveR ? -1.1 : -liftR * 0.5;
				}
			}

			if (this.tailNode) {
				const time = performance.now();
				this.tailNode.rotation.z = Math.sin(time * 0.003) * 0.35;
				this.tailNode.rotation.y = Math.cos(time * 0.002) * 0.25;
			}
		}
	}

	private clearCurrentModel() {
		if (this.currentModelGroup) {
			this.scene.remove(this.currentModelGroup);
			this.currentModelGroup = null;
		}
		// Sweep all non-light/non-camera child objects from the scene to prevent duplicate models
		const toRemove: THREE.Object3D[] = [];
		this.scene.children.forEach((child) => {
			if (
				!(child instanceof THREE.Light) &&
				!(child instanceof THREE.Camera) &&
				child !== this.stageEnvironmentGroup &&
				child !== this.loadingSkeletonGroup
			) {
				toRemove.push(child);
			}
		});
		toRemove.forEach((obj) => this.scene.remove(obj));

		if (this.mixer) {
			this.mixer.stopAllAction();
			this.mixer = null;
		}
		this.headNode = null;
		this.neckNode = null;
		this.eyeLNode = null;
		this.eyeRNode = null;
		this.mouthNode = null;
		this.pawLNode = null;
		this.pawRNode = null;
		this.tailNode = null;
		this.earLNode = null;
		this.earRNode = null;
		this.hipsNode = null;
		this.spineNode = null;
		this.torsoNode = null;
		this.shoulderLNode = null;
		this.shoulderRNode = null;
		this.armLNode = null;
		this.armRNode = null;
		this.forearmLNode = null;
		this.forearmRNode = null;
		this.handLNode = null;
		this.handRNode = null;
		this.morphMesh = null;
		this.morphDict = {};
		this.hairBones = [];
		this.skirtBones = [];
		this.fingerBonesL = { thumb: [], index: [], middle: [], others: [] };
		this.fingerBonesR = { thumb: [], index: [], middle: [], others: [] };
		this.initialRotations.clear();
		this.initialPositions.clear();
		this.gltfBones.clear();
	}

	private startRenderLoop = () => {
		const render = () => {
			const now = performance.now();
			const delta = (now - this.lastFrameTime) / 1000;
			this.lastFrameTime = now;

			if (this.isAutoSpin) {
				this.rotateModelBody(this.autoSpinSpeed * delta);
			}

			if (this.camera) {
				if (this.isAutoSpin) {
					this.camera.position.lerp(this.cameraTargetPos, 0.15);
				} else {
					this.camera.position.lerp(this.cameraTargetPos, 0.35);
				}
				this.camera.up.set(0, 1, 0);
				this.camera.lookAt(this.cameraLookTarget);
			}

			if (this.mixer) {
				this.mixer.update(delta);
			}

			if (this.renderer) {
				this.renderer.render(this.scene, this.camera);
			}

			this.animationFrameId = requestAnimationFrame(render);
		};

		this.lastFrameTime = performance.now();
		render();
	};

	captureScreenshot(): string | null {
		if (!this.renderer) return null;
		this.renderer.render(this.scene, this.camera);
		return this.renderer.domElement.toDataURL('image/png');
	}

	destroy() {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
		window.removeEventListener('resize', this.handleResize);
		this.hideLoadingSkeleton();
		this.clearCurrentModel();
		if (this.renderer) {
			this.renderer.dispose();
			if (this.renderer.domElement.parentElement) {
				this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
			}
			this.renderer = null;
		}
	}
}

export const threeStage = new ThreeStage();
