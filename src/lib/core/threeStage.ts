import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type CatVariant = 'mochi' | 'kuro' | 'tora';

export class ThreeStage {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer | null = null;
	private container: HTMLElement | null = null;
	private animationFrameId: number | null = null;

	// Model root & rigged nodes
	private currentModelGroup: THREE.Group | null = null;
	private headNode: THREE.Object3D | null = null;
	private eyeLNode: THREE.Object3D | null = null;
	private eyeRNode: THREE.Object3D | null = null;
	private mouthNode: THREE.Object3D | null = null;
	private pawLNode: THREE.Object3D | null = null;
	private pawRNode: THREE.Object3D | null = null;
	private tailNode: THREE.Object3D | null = null;
	private earLNode: THREE.Object3D | null = null;
	private earRNode: THREE.Object3D | null = null;

	// External GLTF animations & mixer
	private mixer: THREE.AnimationMixer | null = null;
	private gltfBones: Map<string, THREE.Bone> = new Map();
	private lastFrameTime = performance.now();

	constructor() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
		this.camera.position.set(0, 0.35, 2.8);
	}

	init(container: HTMLElement) {
		this.container = container;
		const width = container.clientWidth || 800;
		const height = container.clientHeight || 600;

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance'
		});
		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		container.appendChild(this.renderer.domElement);

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		// Studio Lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
		this.scene.add(ambientLight);

		const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
		mainLight.position.set(2, 4, 3);
		this.scene.add(mainLight);

		const fillLight = new THREE.DirectionalLight(0x06b6d4, 1.2); // Cyan rim light
		fillLight.position.set(-3, 2, -1);
		this.scene.add(fillLight);

		const rimLight = new THREE.DirectionalLight(0xec4899, 1.0); // Pink rim light
		rimLight.position.set(3, -1, -2);
		this.scene.add(rimLight);

		window.addEventListener('resize', this.handleResize);
		this.startRenderLoop();
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
		this.clearCurrentModel();

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
		catGroup.add(tailGroup);

		this.scene.add(catGroup);
	}

	// 2. Load Any External GLTF / GLB Model
	async loadGLTF(url: string) {
		this.clearCurrentModel();

		const loader = new GLTFLoader();
		const gltf = await loader.loadAsync(url);
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

		this.scene.add(model);
	}

	// 3. Real-Time Vision Tracking Update Loop
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
		const armLA = params['ParamArmLA'] ?? 0;
		const armRA = params['ParamArmRA'] ?? 0;

		// Apply Head Rotation
		if (this.headNode) {
			this.headNode.rotation.y = yaw;
			this.headNode.rotation.x = -pitch;
			this.headNode.rotation.z = -roll;
		}

		// Ear twitch physics on head movement
		if (this.earLNode) {
			this.earLNode.rotation.z = 0.35 + yaw * 0.2;
		}
		if (this.earRNode) {
			this.earRNode.rotation.z = -0.35 + yaw * 0.2;
		}

		// Apply Eye Blinks & Gaze (Procedural Cat)
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

		// Apply Mouth Opening
		if (this.mouthNode) {
			this.mouthNode.scale.y = 1 + mouthOpen * 3.5;
			this.mouthNode.position.y = -0.14 - mouthOpen * 0.06;
		}

		// Apply Arm / Paw gestures
		if (this.pawLNode) {
			this.pawLNode.position.y = -0.3 + (armLA / 30) * 0.35;
			this.pawLNode.rotation.z = (armLA / 30) * 0.6;
		}
		if (this.pawRNode) {
			this.pawRNode.position.y = -0.3 + (armRA / 30) * 0.35;
			this.pawRNode.rotation.z = -(armRA / 30) * 0.6;
		}

		// Tail Wagging
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
		if (this.mixer) {
			this.mixer.stopAllAction();
			this.mixer = null;
		}
		this.headNode = null;
		this.eyeLNode = null;
		this.eyeRNode = null;
		this.mouthNode = null;
		this.pawLNode = null;
		this.pawRNode = null;
		this.tailNode = null;
		this.earLNode = null;
		this.earRNode = null;
		this.gltfBones.clear();
	}

	private startRenderLoop = () => {
		const render = () => {
			const now = performance.now();
			const delta = (now - this.lastFrameTime) / 1000;
			this.lastFrameTime = now;

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
