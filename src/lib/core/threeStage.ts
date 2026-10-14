import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export type CatVariant = 'mochi' | 'kuro' | 'tora';
export type FramingMode3D = 'full' | 'half' | 'closeup';
export type FullBodyPose3D = 'idle' | 'wave' | 'peace' | 'heart' | 'stand';
export type StageEnvironment3D = 'grid' | 'room' | 'field' | 'void';

export class ThreeStage {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer | null = null;
	private container: HTMLElement | null = null;
	private animationFrameId: number | null = null;

	// 3D Stage Environments ('grid' | 'room' | 'field' | 'void')
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
	private hairBones: THREE.Object3D[] = [];
	private skirtBones: THREE.Object3D[] = [];
	private initialRotations: Map<THREE.Object3D, THREE.Euler> = new Map();
	private initialPositions: Map<THREE.Object3D, THREE.Vector3> = new Map();
	public modelRotationY: number = 0;

	// Morph Targets / BlendShapes for Expressions & Lip-Sync
	private morphMesh: THREE.SkinnedMesh | null = null;
	private morphDict: Record<string, number> = {};

	// Interactive States: Expression & Full Body Pose
	public activeExpression: string = '';
	public activeFullBodyPose: FullBodyPose3D = 'idle';

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
			// Clean 2-tone anime cel-shading ramp: 192/255 (75%) soft warm shadow, 255/255 (100%) lit
			const colors = new Uint8Array([192, 255]);
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
		// Use NoToneMapping so vibrant anime colors, skin tones, and rich darks are never dulled or desaturated
		this.renderer.toneMapping = THREE.NoToneMapping;
		container.appendChild(this.renderer.domElement);

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		// Studio Lights: Clean broadcast-grade anime lighting (matches YouTube/Twitch stream tone)
		// 1. Soft warm ambient fill gives character luminous presence without pitch-black crevices
		const ambientLight = new THREE.AmbientLight(0xfff8f2, 1.2);
		this.scene.add(ambientLight);

		// 2. Frontal eye-level key light directly illuminates face & chest, eliminating harsh nose/bangs shadows
		const mainLight = new THREE.DirectionalLight(0xfffefa, 1.15);
		mainLight.position.set(0.1, 1.45, 2.8);
		this.scene.add(mainLight);

		// 3. Gentle fill light from side-left softens contours
		const fillLight = new THREE.DirectionalLight(0xf5f8ff, 0.45);
		fillLight.position.set(-2.2, 1.4, 2.0);
		this.scene.add(fillLight);

		// 4. Subtle warm rim backlight gives clean edge separation from stage background
		const rimLight = new THREE.DirectionalLight(0xfffaf0, 0.35);
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
		if (this.modelType === 'fbx') {
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
			const expKeys = ['stars', 'blush', 'vrc.blink', 'vrc.ee', 'vrc.oh', 'vrc.aa'];
			for (const k of expKeys) {
				const idx = this.morphDict[k];
				if (idx !== undefined) infl[idx] = 0;
			}
			let key = name;
			if (name === 'smile') key = 'vrc.ee';
			else if (name === 'wink') key = 'vrc.blink';
			else if (name === 'surprised' || name === 'surprise') key = 'vrc.oh';
			else if (name === 'open') key = 'vrc.aa';

			if (key && this.morphDict[key] !== undefined) {
				infl[this.morphDict[key]] = 1.0;
			}
		}
	}

	setFullBodyPose(pose: FullBodyPose3D) {
		this.activeFullBodyPose = pose;
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
			// 3D Studio Room (Floor, back wall, side walls & neon accents)
			const floorGeo = new THREE.PlaneGeometry(16, 16);
			const floorMat = new THREE.MeshStandardMaterial({
				color: 0x18181b,
				roughness: 0.4,
				metalness: 0.2
			});
			const floor = new THREE.Mesh(floorGeo, floorMat);
			floor.rotation.x = -Math.PI / 2;
			floor.position.y = 0;
			this.stageEnvironmentGroup.add(floor);

			// Back Wall
			const backWallGeo = new THREE.PlaneGeometry(16, 10);
			const backWallMat = new THREE.MeshStandardMaterial({
				color: 0x121215,
				roughness: 0.8,
				metalness: 0.1
			});
			const backWall = new THREE.Mesh(backWallGeo, backWallMat);
			backWall.position.set(0, 5, -8);
			this.stageEnvironmentGroup.add(backWall);

			// Left Wall
			const leftWallGeo = new THREE.PlaneGeometry(16, 10);
			const leftWallMat = new THREE.MeshStandardMaterial({
				color: 0x141418,
				roughness: 0.8,
				metalness: 0.1
			});
			const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
			leftWall.position.set(-8, 5, 0);
			leftWall.rotation.y = Math.PI / 2;
			this.stageEnvironmentGroup.add(leftWall);

			// Right Wall
			const rightWallGeo = new THREE.PlaneGeometry(16, 10);
			const rightWallMat = new THREE.MeshStandardMaterial({
				color: 0x141418,
				roughness: 0.8,
				metalness: 0.1
			});
			const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
			rightWall.position.set(8, 5, 0);
			rightWall.rotation.y = -Math.PI / 2;
			this.stageEnvironmentGroup.add(rightWall);

			// Stage Floor Circular Platform
			const platformGeo = new THREE.CylinderGeometry(2.8, 3.0, 0.1, 32);
			const platformMat = new THREE.MeshStandardMaterial({
				color: 0x27272a,
				roughness: 0.3,
				metalness: 0.6
			});
			const platform = new THREE.Mesh(platformGeo, platformMat);
			platform.position.set(0, 0.05, 0);
			this.stageEnvironmentGroup.add(platform);

			// Neon strip accent on wall
			const stripGeo = new THREE.PlaneGeometry(12, 0.08);
			const stripMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
			const strip = new THREE.Mesh(stripGeo, stripMat);
			strip.position.set(0, 2.8, -7.98);
			this.stageEnvironmentGroup.add(strip);

			const strip2Geo = new THREE.PlaneGeometry(12, 0.08);
			const strip2Mat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
			const strip2 = new THREE.Mesh(strip2Geo, strip2Mat);
			strip2.position.set(0, 3.2, -7.98);
			this.stageEnvironmentGroup.add(strip2);
		} else if (env === 'field') {
			// Open Field / Horizon Stage
			const fieldGeo = new THREE.PlaneGeometry(40, 40);
			const fieldMat = new THREE.MeshStandardMaterial({
				color: 0x14532d, // dark lush green grass tone
				roughness: 0.85,
				metalness: 0.05
			});
			const field = new THREE.Mesh(fieldGeo, fieldMat);
			field.rotation.x = -Math.PI / 2;
			field.position.y = 0;
			this.stageEnvironmentGroup.add(field);

			// Circular stone stepping pedestal
			const stoneGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.12, 32);
			const stoneMat = new THREE.MeshStandardMaterial({
				color: 0x3f3f46,
				roughness: 0.7,
				metalness: 0.2
			});
			const stone = new THREE.Mesh(stoneGeo, stoneMat);
			stone.position.set(0, 0.06, 0);
			this.stageEnvironmentGroup.add(stone);

			// Atmospheric distant fog
			this.scene.fog = new THREE.FogExp2(0x064e3b, 0.035);
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
		catGroup.rotation.y = this.modelRotationY;
		this.scene.add(catGroup);
		this.setFraming(this.currentFraming);
	}

	// 2. Load Any External GLTF / GLB Model
	async loadGLTF(url: string) {
		const token = ++this.activeLoadToken;
		this.clearCurrentModel();
		this.modelType = 'glb';

		const loader = new GLTFLoader();
		const gltf = await loader.loadAsync(url);
		if (token !== this.activeLoadToken) return;
		this.clearCurrentModel();
		const model = gltf.scene;
		this.currentModelGroup = model;

		// Calculate bounding box and center model
		const box = new THREE.Box3().setFromObject(model);
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const scale = 1.8 / (maxDim || 1);
		model.scale.set(scale, scale, scale);

		const center = box.getCenter(new THREE.Vector3());
		model.position.x = -center.x * scale;
		model.position.y = -box.min.y * scale - 0.7;
		model.position.z = -center.z * scale;

		// Discover bone nodes (Head, Neck, Eyes)
		this.gltfBones.clear();
		model.traverse((child) => {
			if (child instanceof THREE.Bone) {
				const lowerName = child.name.toLowerCase();
				this.gltfBones.set(lowerName, child);
				if (lowerName.includes('head') && !this.headNode) {
					this.headNode = child;
				}
			}
		});

		// Animation mixer if GLTF has clips
		if (gltf.animations && gltf.animations.length > 0) {
			this.mixer = new THREE.AnimationMixer(model);
			const action = this.mixer.clipAction(gltf.animations[0]);
			action.play();
		}

		if (token !== this.activeLoadToken) return;
		model.rotation.y = this.modelRotationY;
		this.scene.add(model);
		this.setFraming(this.currentFraming);
	}

	// 3. Load Humanoid Neuro-sama FBX Model with 4K Textures & VRChat BlendShapes
	async loadNeuroSama() {
		const token = ++this.activeLoadToken;
		this.clearCurrentModel();
		this.modelType = 'fbx';

		const loader = new FBXLoader();
		const group = await loader.loadAsync('/models/neurosama/neuro-sama.fbx');
		if (token !== this.activeLoadToken) return;
		this.clearCurrentModel();
		this.currentModelGroup = group;

		// Load textures with SRGBColorSpace and reactive onLoad trigger
		const texLoader = new THREE.TextureLoader();
		const loadTex = (url: string) => {
			const t = texLoader.load(url, () => {
				t.needsUpdate = true;
				if (this.renderer && this.scene && this.camera) {
					this.renderer.render(this.scene, this.camera);
				}
			});
			t.colorSpace = THREE.SRGBColorSpace;
			return t;
		};

		const textures = {
			expressions: loadTex('/models/neurosama/textures/neuroexpresions_vrc.png'),
			secondaryClothes: loadTex('/models/neurosama/textures/secondary_clothes_neuro_vrc.png'),
			clothes: loadTex('/models/neurosama/textures/clothes_neuro_vrc.png'),
			hair: loadTex('/models/neurosama/textures/neuro_hair_vrc.png'),
			body: loadTex('/models/neurosama/textures/body_neuro_vrc.png')
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
		group.position.x = -center.x;
		group.position.y = -box.min.y;
		group.position.z = -center.z;

		// Discover humanoid bones
		this.headNode = group.getObjectByName('head') || null;
		this.neckNode = group.getObjectByName('neck') || null;
		this.eyeRNode = group.getObjectByName('EyeR') || null;
		this.eyeLNode = group.getObjectByName('EyeL') || null;
		this.hipsNode = group.getObjectByName('hips') || null;
		this.spineNode = group.getObjectByName('spine') || null;
		this.torsoNode = group.getObjectByName('torso') || null;
		this.shoulderLNode = group.getObjectByName('shoulderL') || null;
		this.shoulderRNode = group.getObjectByName('shoulderR') || null;
		this.armLNode = group.getObjectByName('armL') || null;
		this.armRNode = group.getObjectByName('armR') || null;
		this.forearmLNode = group.getObjectByName('ForearmL') || null;
		this.forearmRNode = group.getObjectByName('ForearmR') || null;
		this.handLNode = group.getObjectByName('handL') || null;
		this.handRNode = group.getObjectByName('handR') || null;

		// Cache secondary bones
		this.hairBones = [];
		this.skirtBones = [];
		this.initialRotations.clear();

		group.traverse((c) => {
			if ((c as any).isBone) {
				const name = c.name.toLowerCase();
				if (name.includes('hair') || name.includes('pigtail')) this.hairBones.push(c);
				if (name.includes('skirt') || name.includes('cape') || name.includes('bowie')) this.skirtBones.push(c);
				this.initialRotations.set(c, c.rotation.clone());
				this.initialPositions.set(c, c.position.clone());
			}
		});

		if (token !== this.activeLoadToken) return;
		group.rotation.y = this.modelRotationY;
		this.scene.add(group);
		this.setFraming(this.currentFraming);
	}

	// 4. Load Humanoid Manhattan Cafe Model with Uma Musume Horse Ears & Dark Palette
	async loadManhattanCafe() {
		const token = ++this.activeLoadToken;
		this.clearCurrentModel();
		this.modelType = 'fbx';

		const loader = new FBXLoader();
		const group = await loader.loadAsync('/models/neurosama/neuro-sama.fbx');
		if (token !== this.activeLoadToken) return;
		this.clearCurrentModel();
		this.currentModelGroup = group;

		// Load textures with SRGBColorSpace
		const texLoader = new THREE.TextureLoader();
		const loadTex = (url: string) => {
			const t = texLoader.load(url);
			t.colorSpace = THREE.SRGBColorSpace;
			return t;
		};

		const textures = {
			expressions: loadTex('/models/neurosama/textures/neuroexpresions_vrc.png'),
			secondaryClothes: loadTex('/models/neurosama/textures/secondary_clothes_neuro_vrc.png'),
			clothes: loadTex('/models/neurosama/textures/clothes_neuro_vrc.png'),
			hair: loadTex('/models/neurosama/textures/neuro_hair_vrc.png'),
			body: loadTex('/models/neurosama/textures/body_neuro_vrc.png')
		};

		const toonGradient = this.getOrCreateToonGradient();

		group.traverse((child) => {
			if ((child as any).isMesh) {
				const mesh = child as THREE.SkinnedMesh;
				mesh.castShadow = false;
				mesh.receiveShadow = false;

				if (mesh.morphTargetDictionary) {
					this.morphMesh = mesh;
					this.morphDict = mesh.morphTargetDictionary;
				}

				if (Array.isArray(mesh.material)) {
					const toonMaterials: THREE.Material[] = [
						new THREE.MeshBasicMaterial({
							map: textures.expressions,
							color: new THREE.Color(0xfff8ee),
							transparent: true,
							alphaTest: 0.05,
							depthWrite: false,
							depthTest: true,
							side: THREE.DoubleSide
						}),
						new THREE.MeshToonMaterial({
							map: textures.secondaryClothes,
							gradientMap: toonGradient,
							color: new THREE.Color(0x383a48),
							transparent: true,
							alphaTest: 0.5,
							side: THREE.DoubleSide
						}),
						new THREE.MeshToonMaterial({
							map: textures.clothes,
							gradientMap: toonGradient,
							color: new THREE.Color(0x222230),
							side: THREE.DoubleSide
						}),
						new THREE.MeshToonMaterial({
							map: textures.hair,
							gradientMap: toonGradient,
							color: new THREE.Color(0x282432),
							transparent: true,
							alphaTest: 0.5,
							depthWrite: true,
							side: THREE.DoubleSide
						}),
						new THREE.MeshToonMaterial({
							map: textures.body,
							gradientMap: toonGradient,
							color: new THREE.Color(0xfffaf5),
							side: THREE.DoubleSide
						})
					];
					mesh.material.forEach((oldMat) => oldMat.dispose());
					mesh.material = toonMaterials;
				}
			}
		});

		// Attach Uma Musume Horse Ears to head bone node!
		const head = group.getObjectByName('head');
		if (head) {
			const earMat = new THREE.MeshPhongMaterial({
				color: 0x1a1824, // dark coffee ear fur
				shininess: 12
			});
			const innerEarMat = new THREE.MeshPhongMaterial({
				color: 0xe07a8c, // soft pink inner ear
				shininess: 8
			});

			const createHorseEar = (isLeft: boolean) => {
				const earGroup = new THREE.Group();
				const earGeo = new THREE.ConeGeometry(0.045, 0.16, 16);
				earGeo.rotateZ(isLeft ? 0.35 : -0.35);
				earGeo.rotateX(-0.1);
				const outerMesh = new THREE.Mesh(earGeo, earMat);
				earGroup.add(outerMesh);

				const innerGeo = new THREE.ConeGeometry(0.028, 0.12, 16);
				innerGeo.rotateZ(isLeft ? 0.35 : -0.35);
				innerGeo.rotateX(-0.08);
				innerGeo.translate(0, -0.01, 0.01);
				const innerMesh = new THREE.Mesh(innerGeo, innerEarMat);
				earGroup.add(innerMesh);

				earGroup.position.set(isLeft ? -0.085 : 0.085, 0.17, -0.02);
				return earGroup;
			};

			head.add(createHorseEar(true));
			head.add(createHorseEar(false));
		}

		// Discover humanoid bones
		this.headNode = group.getObjectByName('head') || null;
		this.neckNode = group.getObjectByName('neck') || null;
		this.eyeRNode = group.getObjectByName('EyeR') || null;
		this.eyeLNode = group.getObjectByName('EyeL') || null;
		this.hipsNode = group.getObjectByName('hips') || null;
		this.spineNode = group.getObjectByName('spine') || null;
		this.torsoNode = group.getObjectByName('torso') || null;
		this.shoulderLNode = group.getObjectByName('shoulderL') || null;
		this.shoulderRNode = group.getObjectByName('shoulderR') || null;
		this.armLNode = group.getObjectByName('armL') || null;
		this.armRNode = group.getObjectByName('armR') || null;
		this.forearmLNode = group.getObjectByName('ForearmL') || null;
		this.forearmRNode = group.getObjectByName('ForearmR') || null;
		this.handLNode = group.getObjectByName('handL') || null;
		this.handRNode = group.getObjectByName('handR') || null;

		// Cache secondary bones
		this.hairBones = [];
		this.skirtBones = [];
		this.initialRotations.clear();

		group.traverse((c) => {
			if ((c as any).isBone) {
				const name = c.name.toLowerCase();
				if (name.includes('hair') || name.includes('pigtail')) this.hairBones.push(c);
				if (name.includes('skirt') || name.includes('cape') || name.includes('bowie')) this.skirtBones.push(c);
				this.initialRotations.set(c, c.rotation.clone());
				this.initialPositions.set(c, c.position.clone());
			}
		});

		// Ground model on floor and center along X and Z
		const box = new THREE.Box3().setFromObject(group);
		const center = box.getCenter(new THREE.Vector3());
		group.position.x = -center.x;
		group.position.y = -box.min.y;
		group.position.z = -center.z;

		if (token !== this.activeLoadToken) return;
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
		this.clearCurrentModel();
		this.modelType = 'fbx';

		const loader = new FBXLoader();
		const group = await loader.loadAsync(url);
		if (token !== this.activeLoadToken) return;
		this.clearCurrentModel();
		this.currentModelGroup = group;

		// Center & scale
		const box = new THREE.Box3().setFromObject(group);
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const scale = 1.8 / (maxDim || 1);
		group.scale.set(scale, scale, scale);

		const center = box.getCenter(new THREE.Vector3());
		group.position.x = -center.x * scale;
		group.position.y = -box.min.y * scale;
		group.position.z = -center.z * scale;

		this.initialRotations.clear();
		group.traverse((child) => {
			if ((child as any).isMesh) {
				const mesh = child as THREE.SkinnedMesh;
				if (mesh.morphTargetDictionary) {
					this.morphMesh = mesh;
					this.morphDict = mesh.morphTargetDictionary;
				}
			}
			if ((child as any).isBone) {
				const name = child.name.toLowerCase();
				if (name.includes('head') && !this.headNode) this.headNode = child;
				if (name.includes('neck') && !this.neckNode) this.neckNode = child;
				if (name.includes('hips') && !this.hipsNode) this.hipsNode = child;
				this.initialRotations.set(child, child.rotation.clone());
				this.initialPositions.set(child, child.position.clone());
			}
		});

		if (token !== this.activeLoadToken) return;
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

		const armLA = params['ParamArmLA'] ?? 0;
		const armRA = params['ParamArmRA'] ?? 0;

		if (this.activeFullBodyPose === 'wave') {
			// Melambaikan tangan kanan
			this.armRNode.rotation.z = initArmR.z + 1.2;
			this.armRNode.rotation.x = initArmR.x - 0.6;
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 0.8;
				this.forearmRNode.rotation.x = initForeR.x + Math.sin(time * 0.008) * 0.35;
			}
			if (this.handRNode && initHandR) {
				this.handRNode.rotation.z = initHandR.z + Math.sin(time * 0.008) * 0.45;
			}
			this.armLNode.rotation.z = initArmL.z - Math.sin(time * 0.002) * 0.02;
		} else if (this.activeFullBodyPose === 'peace') {
			// Pose V / Peace sign
			this.armRNode.rotation.z = initArmR.z + 1.0;
			this.armRNode.rotation.y = initArmR.y - 0.5;
			this.armRNode.rotation.x = initArmR.x - 0.8;
			if (this.forearmRNode && initForeR) {
				this.forearmRNode.rotation.z = initForeR.z + 1.2;
			}
			if (this.handRNode && initHandR) {
				this.handRNode.rotation.y = initHandR.y + 0.5;
			}
			this.armLNode.rotation.z = initArmL.z;
		} else if (this.activeFullBodyPose === 'heart') {
			// Pose Hati / Heart shape
			this.armLNode.rotation.z = initArmL.z - 0.7;
			this.armLNode.rotation.x = initArmL.x - 0.5;
			this.armRNode.rotation.z = initArmR.z + 0.7;
			this.armRNode.rotation.x = initArmR.x - 0.5;
			if (this.forearmLNode && initForeL) this.forearmLNode.rotation.z = initForeL.z - 0.8;
			if (this.forearmRNode && initForeR) this.forearmRNode.rotation.z = initForeR.z + 0.8;
		} else if (this.activeFullBodyPose === 'stand') {
			// Pose tegak natural
			this.armLNode.rotation.copy(initArmL);
			this.armRNode.rotation.copy(initArmR);
			if (this.forearmLNode && initForeL) this.forearmLNode.rotation.copy(initForeL);
			if (this.forearmRNode && initForeR) this.forearmRNode.rotation.copy(initForeR);
		} else {
			// Idle atau pelacakan tangan MediaPipe
			const hasWebcamArmL = armLA > 12;
			const hasWebcamArmR = armRA > 12;

			if (hasWebcamArmL) {
				const liftL = armLA / 30;
				this.armLNode.rotation.z = initArmL.z - liftL * 1.3;
				this.armLNode.rotation.x = initArmL.x - liftL * 0.4;
				if (this.forearmLNode && initForeL) {
					this.forearmLNode.rotation.z = initForeL.z - liftL * 0.6;
				}
			} else {
				this.armLNode.rotation.z = initArmL.z + Math.sin(time * 0.002) * 0.02;
				if (this.forearmLNode && initForeL) this.forearmLNode.rotation.copy(initForeL);
			}

			if (hasWebcamArmR) {
				const liftR = armRA / 30;
				this.armRNode.rotation.z = initArmR.z + liftR * 1.3;
				this.armRNode.rotation.x = initArmR.x - liftR * 0.4;
				if (this.forearmRNode && initForeR) {
					this.forearmRNode.rotation.z = initForeR.z + liftR * 0.6;
				}
			} else {
				this.armRNode.rotation.z = initArmR.z - Math.sin(time * 0.002) * 0.02;
				if (this.forearmRNode && initForeR) this.forearmRNode.rotation.copy(initForeR);
			}
		}
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

		if (this.modelType === 'fbx') {
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

				// Eye Blink
				const blinkIdx = dict['vrc.blink'];
				if (blinkIdx !== undefined) {
					const avgBlink = Math.min(eyeBlinkL, eyeBlinkR);
					const blinkVal = Math.max(0, Math.min(1.0, (1.0 - avgBlink) * 1.25));
					infl[blinkIdx] = (this.activeExpression === 'vrc.blink' || this.activeExpression === 'wink') ? 1.0 : blinkVal;
				}

				// Lip sync mouth open
				const aaIdx = dict['vrc.aa'];
				const ohIdx = dict['vrc.oh'];
				if (aaIdx !== undefined) {
					infl[aaIdx] = (this.activeExpression === 'vrc.aa' || this.activeExpression === 'open') ? 1.0 : Math.max(0, Math.min(1.0, mouthOpen * 1.5));
				}
				if (ohIdx !== undefined) {
					infl[ohIdx] = (this.activeExpression === 'vrc.oh' || this.activeExpression === 'surprised' || this.activeExpression === 'surprise')
						? 1.0
						: (mouthOpen > 0.4 && Math.abs(mouthForm) < 0.2 ? mouthOpen * 0.8 : 0);
				}

				// Smile
				const eeIdx = dict['vrc.ee'];
				if (eeIdx !== undefined) {
					const smileVal = mouthForm > 0.1 ? mouthForm : 0;
					infl[eeIdx] = (this.activeExpression === 'vrc.ee' || this.activeExpression === 'smile') ? 1.0 : Math.max(0, Math.min(1.0, smileVal));
				}

				// Star eyes (Neuro-sama signature!)
				const starsIdx = dict['stars'];
				if (starsIdx !== undefined) {
					infl[starsIdx] = this.activeExpression === 'stars' ? 1.0 : 0;
				}

				// Blush
				const blushIdx = dict['blush'];
				if (blushIdx !== undefined) {
					const autoBlush = mouthForm > 0.5 ? 0.4 : 0;
					infl[blushIdx] = this.activeExpression === 'blush' ? 1.0 : autoBlush;
				}
			}

			// 4. Full Body Sway & Breathing Physics
			const time = performance.now();
			const breathOffset = Math.sin(time * 0.002) * 0.02;

			if (this.spineNode && initSpine) {
				this.spineNode.rotation.y = initSpine.y + yaw * 0.15;
				this.spineNode.rotation.x = initSpine.x + breathOffset;
				this.spineNode.rotation.z = initSpine.z - roll * 0.1;
			}
			if (this.torsoNode && initTorso) {
				this.torsoNode.rotation.y = initTorso.y + yaw * 0.1;
				this.torsoNode.rotation.x = initTorso.x + breathOffset * 1.2;
			}
			if (this.hipsNode && initHips) {
				const initHipsPos = this.initialPositions.get(this.hipsNode);
				if (initHipsPos) {
					this.hipsNode.position.y = initHipsPos.y + Math.sin(time * 0.002) * 0.004;
				}
				this.hipsNode.rotation.y = initHips.y + Math.sin(time * 0.001) * 0.015;
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

		if (this.pawLNode) {
			const lift = armLA / 30;
			this.pawLNode.position.y = -0.3 + lift * 0.45;
			this.pawLNode.position.z = 0.4 + (isHighFiveL ? 0.35 : lift * 0.15);
			this.pawLNode.rotation.z = lift * 0.4;
			this.pawLNode.rotation.x = isHighFiveL ? -1.1 : -lift * 0.5;
		}
		if (this.pawRNode) {
			const lift = armRA / 30;
			this.pawRNode.position.y = -0.3 + lift * 0.45;
			this.pawRNode.position.z = 0.4 + (isHighFiveR ? 0.35 : lift * 0.15);
			this.pawRNode.rotation.z = -lift * 0.4;
			this.pawRNode.rotation.x = isHighFiveR ? -1.1 : -lift * 0.5;
		}

		if (this.tailNode) {
			const time = performance.now();
			this.tailNode.rotation.z = Math.sin(time * 0.003) * 0.35;
			this.tailNode.rotation.y = Math.cos(time * 0.002) * 0.25;
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
			if (!(child instanceof THREE.Light) && !(child instanceof THREE.Camera) && child !== this.stageEnvironmentGroup) {
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
