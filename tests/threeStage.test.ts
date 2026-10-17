import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import { ThreeStage } from '#lib/core/threeStage';

describe('ThreeStage 3D Cat Procedural Rigging', () => {
	it('should successfully construct Mochi, Kuro, and Tora cat variants', () => {
		const stage = new ThreeStage();

		expect(() => stage.loadProceduralCat('mochi')).not.toThrow();
		expect(() => stage.loadProceduralCat('kuro')).not.toThrow();
		expect(() => stage.loadProceduralCat('tora')).not.toThrow();
	});

	it('should accept tracking parameters and apply rotations without NaN or exceptions', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('mochi');

		const testParams = {
			ParamAngleX: 20,
			ParamAngleY: -15,
			ParamAngleZ: 5,
			ParamEyeLOpen: 0.1,
			ParamEyeROpen: 0.9,
			ParamEyeBallX: -0.5,
			ParamEyeBallY: 0.3,
			ParamMouthOpenY: 0.8,
			ParamArmLA: 15,
			ParamArmRA: -5
		};

		expect(() => stage.updateParameters(testParams)).not.toThrow();
	});

	it('should handle zero, extreme, and missing parameter inputs gracefully', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('kuro');

		expect(() => stage.updateParameters({})).not.toThrow();
		expect(() =>
			stage.updateParameters({
				ParamAngleX: 999,
				ParamAngleY: -999,
				ParamEyeLOpen: -5,
				ParamMouthOpenY: 10
			})
		).not.toThrow();
	});

	it('should support framing modes: full body, half body, and face close-up', () => {
		const stage = new ThreeStage();
		stage.setFraming('full');
		expect(stage.currentFraming).toBe('full');

		stage.setFraming('half');
		expect(stage.currentFraming).toBe('half');

		stage.setFraming('closeup');
		expect(stage.currentFraming).toBe('closeup');
	});

	it('should support facial expression and full-body pose switching', () => {
		const stage = new ThreeStage();

		expect(() => stage.setExpression('stars')).not.toThrow();
		expect(stage.activeExpression).toBe('stars');

		expect(() => stage.setExpression('blush')).not.toThrow();
		expect(stage.activeExpression).toBe('blush');

		expect(() => stage.setExpression('')).not.toThrow();
		expect(stage.activeExpression).toBe('');

		expect(() => stage.setFullBodyPose('wave')).not.toThrow();
		expect(stage.activeFullBodyPose).toBe('wave');

		expect(() => stage.setFullBodyPose('peace')).not.toThrow();
		expect(stage.activeFullBodyPose).toBe('peace');

		expect(() => stage.setFullBodyPose('heart')).not.toThrow();
		expect(stage.activeFullBodyPose).toBe('heart');

		expect(() => stage.setFullBodyPose('idle')).not.toThrow();
		expect(stage.activeFullBodyPose).toBe('idle');
	});

	it('should support zoomBy and resetZoom controls', () => {
		const stage = new ThreeStage();
		expect(() => stage.zoomBy(1.2)).not.toThrow();
		expect(() => stage.zoomBy(0.8)).not.toThrow();
		expect(() => stage.resetZoom()).not.toThrow();
	});

	it('should maintain single active model group in scene upon multiple loads', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('mochi');
		stage.loadProceduralCat('kuro');
		stage.loadProceduralCat('tora');

		expect(stage['currentModelGroup']).not.toBeNull();
		// Scene contains stageEnvironmentGroup and the active model group
		expect(stage['scene'].children.includes(stage['currentModelGroup']!)).toBe(true);
		expect(stage['scene'].children.includes(stage['stageEnvironmentGroup']!)).toBe(true);
		// Exactly 1 model group exists (no orphaned models from previous loads)
		expect(stage['scene'].children.filter((c) => c !== stage['stageEnvironmentGroup']).length).toBe(1);
	});

	it('should support interactive orbit rotation, auto-spin turntable, and angle reset', () => {
		const stage = new ThreeStage();

		// Initial orbit values
		expect(stage.orbitTheta).toBe(0);
		expect(stage.isAutoSpin).toBe(false);

		// Rotate azimuth & polar
		stage.rotateOrbit(0.5, -0.2);
		expect(stage.orbitTheta).toBeCloseTo(0.5, 4);

		// Rotate by degrees
		stage.rotateOrbitDegrees(45);
		expect(stage.orbitTheta).toBeCloseTo(0.5 + Math.PI / 4, 3);

		// Negative rotate by degrees
		stage.rotateOrbitDegrees(-90);
		// Wrap around 2*PI
		expect(stage.orbitTheta).toBeGreaterThanOrEqual(0);
		expect(stage.orbitTheta).toBeLessThan(Math.PI * 2);

		// Auto spin toggle
		expect(stage.toggleAutoSpin()).toBe(true);
		expect(stage.isAutoSpin).toBe(true);
		expect(stage.toggleAutoSpin(false)).toBe(false);
		expect(stage.isAutoSpin).toBe(false);

		// Reset orbit
		stage.rotateOrbit(1.2, 0.3);
		stage.toggleAutoSpin(true);
		stage.resetOrbit();
		expect(stage.orbitTheta).toBe(0);
		expect(stage.orbitPhi).toBeCloseTo(1.55, 2);
		expect(stage.isAutoSpin).toBe(false);
	});

	it('should provide broadcast-accurate 2-tone anime cel-shading gradient for YouTube/Twitch stream look', () => {
		const stage = new ThreeStage();
		const gradient = stage.getOrCreateToonGradient();

		expect(gradient).toBeDefined();
		expect(gradient.image.width).toBe(2);
		expect(gradient.image.height).toBe(1);
		// Stepped 2-tone ramp: ~59% vibrant anime shadow (150) and 100% lit highlight (255)
		const data = gradient.image.data;
		expect(data[0]).toBe(150);
		expect(data[1]).toBe(255);
		// NearestFilter for crisp anime cel edges without blurry gouraud gradient
		expect(gradient.minFilter).toBe(1003); // THREE.NearestFilter
		expect(gradient.magFilter).toBe(1003); // THREE.NearestFilter
	});

	it('should rotate character model body directly while keeping stage environment and camera front-aligned', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('mochi');

		const modelGroup = stage['currentModelGroup'];
		expect(modelGroup).not.toBeNull();

		// Initial rotation
		expect(stage.modelRotationY).toBe(0);
		expect(modelGroup!.rotation.y).toBe(0);
		expect(stage['cameraTargetPos'].x).toBe(0);

		// Rotate model body 45 degrees
		stage.rotateModelBodyDegrees(45);
		expect(stage.modelRotationY).toBeCloseTo(Math.PI / 4, 3);
		expect(modelGroup!.rotation.y).toBeCloseTo(Math.PI / 4, 3);
		// Camera X stays at 0 (front-aligned to stage, stage environment does not spin)
		expect(stage['cameraTargetPos'].x).toBe(0);

		// Rotate model body further via delta radians
		stage.rotateModelBody(0.5);
		expect(stage.modelRotationY).toBeCloseTo(Math.PI / 4 + 0.5, 3);
		expect(modelGroup!.rotation.y).toBeCloseTo(Math.PI / 4 + 0.5, 3);

		// Reset model body to front
		stage.resetModelBody();
		expect(stage.modelRotationY).toBe(0);
		expect(modelGroup!.rotation.y).toBe(0);
		expect(stage.isAutoSpin).toBe(false);
	});

	it('should support translating and repositioning 3D model with moveModel and resetModelPosition', () => {
		const stage = new ThreeStage();
		stage.loadProceduralCat('mochi');

		const modelGroup = stage['currentModelGroup'];
		expect(modelGroup).not.toBeNull();

		// Initial offsets
		expect(stage.modelOffsetX).toBe(0);
		expect(stage.modelOffsetY).toBe(0);
		expect(modelGroup!.position.x).toBe(0);

		// Move model right and up
		stage.moveModel(0.5, 0.3);
		expect(stage.modelOffsetX).toBeCloseTo(0.5, 3);
		expect(stage.modelOffsetY).toBeCloseTo(0.3, 3);
		expect(modelGroup!.position.x).toBeCloseTo(0.5, 3);
		expect(modelGroup!.position.y).toBeCloseTo(0.3, 3);

		// Set explicit position
		stage.setModelPosition(-1.2, 0.8);
		expect(stage.modelOffsetX).toBeCloseTo(-1.2, 3);
		expect(stage.modelOffsetY).toBeCloseTo(0.8, 3);
		expect(modelGroup!.position.x).toBeCloseTo(-1.2, 3);
		expect(modelGroup!.position.y).toBeCloseTo(0.8, 3);

		// Reset position
		stage.resetModelPosition();
		expect(stage.modelOffsetX).toBe(0);
		expect(stage.modelOffsetY).toBe(0);
		expect(modelGroup!.position.x).toBe(0);
		expect(modelGroup!.position.y).toBe(0);
	});

	it('should construct cozy girl room environment with soft cream yellow walls, zinc cream floor, and furniture', () => {
		const stage = new ThreeStage();
		stage.setStageEnvironment('room');

		expect(stage.currentStageEnv).toBe('room');
		const envGroup = stage['stageEnvironmentGroup'];
		expect(envGroup.children.length).toBeGreaterThan(5);

		// Check floor plane
		const floor = envGroup.children.find((c) => (c as any).isMesh && c.rotation.x === -Math.PI / 2);
		expect(floor).toBeDefined();

		// Check back wall with #F9E4BC color (0xf9e4bc)
		const backWall = envGroup.children.find((c) => (c as any).isMesh && c.position.z === -8) as THREE.Mesh;
		expect(backWall).toBeDefined();
		expect(((backWall.material as THREE.MeshStandardMaterial).color).getHex()).toBe(0xf9e4bc);
	});

	it('should support switching between all 9 stage environments', () => {
		const stage = new ThreeStage();
		const environments = ['grid', 'room', 'cafe', 'beach', 'field', 'sunset', 'studio', 'dojo', 'void'] as const;
		for (const env of environments) {
			stage.setStageEnvironment(env);
			expect(stage.currentStageEnv).toBe(env);
		}

		// Specifically verify cafe constructs cafe meshes
		stage.setStageEnvironment('cafe');
		const cafeFloor = stage['stageEnvironmentGroup'].children.find((c) => (c as any).isMesh && c.rotation.x === -Math.PI / 2);
		expect(cafeFloor).toBeDefined();

		// Specifically verify beach constructs sand, ocean, and sunny fog
		stage.setStageEnvironment('beach');
		const beachSand = stage['stageEnvironmentGroup'].children.find((c) => (c as any).isMesh && c.rotation.x === -Math.PI / 2);
		expect(beachSand).toBeDefined();
		expect(stage['scene'].fog).toBeDefined();
	});

	it('should lock skirt bones firmly to authored rest pose to prevent skirt flipping or lifting', () => {
		const stage = new ThreeStage();
		stage.modelType = 'fbx';

		// Create mock skirt bones matching Neuro-sama FBX structure
		const skirtControl = new THREE.Bone();
		skirtControl.name = 'skirt_control';
		skirtControl.rotation.x = -Math.PI; // -180 deg rest pose in FBX
		skirtControl.rotation.y = 0;
		skirtControl.rotation.z = 0;

		const skirtChild = new THREE.Bone();
		skirtChild.name = 'Skirt_front_2R';
		skirtChild.rotation.x = -0.1004;
		skirtChild.rotation.y = 0.1745;
		skirtChild.rotation.z = 0.0001;

		stage['skirtBones'] = [skirtControl, skirtChild];
		stage['initialRotations'].set(skirtControl, skirtControl.rotation.clone());
		stage['initialRotations'].set(skirtChild, skirtChild.rotation.clone());

		// Call updateParameters across 50 frames
		for (let i = 0; i < 50; i++) {
			stage.updateParameters({
				ParamAngleX: Math.sin(i * 0.1) * 15,
				ParamAngleY: Math.cos(i * 0.1) * 10,
				ParamEyeLOpen: 1.0,
				ParamEyeROpen: 1.0,
				ParamMouthOpenY: 0.5
			});
		}

		// Skirt control must NOT flip towards 0 or lift up; it must strictly match -Math.PI
		expect(skirtControl.rotation.x).toBeCloseTo(-Math.PI, 4);
		expect(skirtControl.rotation.y).toBeCloseTo(0, 4);
		expect(skirtControl.rotation.z).toBeCloseTo(0, 4);

		// Child skirt bone must strictly maintain authored drape
		expect(skirtChild.rotation.x).toBeCloseTo(-0.1004, 4);
		expect(skirtChild.rotation.y).toBeCloseTo(0.1745, 4);
	});

	it('should support all 13 popular full-body poses without errors or NaN values', () => {
		const stage = new ThreeStage();
		const popularPoses: Array<
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
			| 'cross-arms'
		> = [
			'idle',
			'wave',
			'peace',
			'heart',
			'stand',
			'cat-paw',
			'sit',
			'shy',
			'tsundere',
			'thinking',
			'idol',
			'bow',
			'cross-arms'
		];

		for (const pose of popularPoses) {
			expect(() => stage.setFullBodyPose(pose)).not.toThrow();
			expect(stage.activeFullBodyPose).toBe(pose);
		}
	});

	it('should teleport smoothly to stage area waypoints (PC desk, bed, cafe, beach, meadow, center)', () => {
		const stage = new ThreeStage();

		// Teleport to PC desk chair
		stage.teleportToArea('pc');
		expect(stage.activeStageWaypoint).toBe('pc');
		expect(stage.modelOffsetX).toBeCloseTo(4.8, 1);
		expect(stage.modelOffsetZ).toBeCloseTo(-3.5, 1);
		expect(stage.cameraLookTarget.x).toBeCloseTo(4.8, 1);
		expect(stage.cameraLookTarget.z).toBeCloseTo(-3.5, 1);

		// Teleport to Cozy Bed
		stage.teleportToArea('bed');
		expect(stage.activeStageWaypoint).toBe('bed');
		expect(stage.modelOffsetX).toBeCloseTo(-3.5, 1);
		expect(stage.modelOffsetZ).toBeCloseTo(-3.0, 1);

		// Teleport to Cafe Bar Counter
		stage.teleportToArea('cafe-bar');
		expect(stage.activeStageWaypoint).toBe('cafe-bar');
		expect(stage.modelOffsetX).toBeCloseTo(-2.0, 1);
		expect(stage.modelOffsetZ).toBeCloseTo(-3.2, 1);

		// Teleport to Beach Umbrella
		stage.teleportToArea('beach-umbrella');
		expect(stage.activeStageWaypoint).toBe('beach-umbrella');
		expect(stage.modelOffsetX).toBeCloseTo(-2.2, 1);
		expect(stage.modelOffsetZ).toBeCloseTo(-1.0, 1);

		// Teleport to Wildflower Meadow
		stage.teleportToArea('meadow-flowers');
		expect(stage.activeStageWaypoint).toBe('meadow-flowers');
		expect(stage.modelOffsetX).toBeCloseTo(2.2, 1);
		expect(stage.modelOffsetZ).toBeCloseTo(-1.5, 1);

		// Teleport back to Center
		stage.teleportToArea('center');
		expect(stage.activeStageWaypoint).toBe('center');
		expect(stage.modelOffsetX).toBe(0);
		expect(stage.modelOffsetZ).toBe(0);
		expect(stage.cameraLookTarget.x).toBe(0);
		expect(stage.cameraLookTarget.z).toBe(0);
	});

	it('should prevent character model collision with environment props while allowing character proximity', () => {
		const stage = new ThreeStage();
		stage.setStageEnvironment('room');

		// Attempt to walk character directly into PC desk center prop (X: 4.8, Z: -4.5)
		const blockedInsideDesk = stage.resolvePropCollision(4.8, -4.5);
		// Must be repelled away from desk boundaries (desk maxZ is -3.85, so with radius 0.42 z is pushed to >= -3.43)
		expect(blockedInsideDesk.z).toBeGreaterThanOrEqual(-3.5);

		// Attempt to walk character into cozy bed mattress (X: -4.0, Z: -3.5)
		const blockedInsideBed = stage.resolvePropCollision(-4.0, -3.5);
		// Bed maxZ is -1.0, maxX is -2.3; character must be pushed out
		const isOutsideBed =
			blockedInsideBed.x > -2.3 ||
			blockedInsideBed.x < -6.2 ||
			blockedInsideBed.z > -1.0 ||
			blockedInsideBed.z < -6.2;
		expect(isOutsideBed).toBe(true);

		// Open floor walk without obstacles (e.g. at X: 0, Z: 0) should remain unperturbed
		const freeMove = stage.resolvePropCollision(0, 0);
		expect(freeMove.x).toBe(0);
		expect(freeMove.z).toBe(0);
	});

	it('should display holographic wireframe skeleton during model loading and clean up without pop-in', () => {
		const stage = new ThreeStage();
		expect(stage.isLoadingModel).toBe(false);
		expect(stage.loadingSkeletonGroup).toBeNull();

		// Trigger holographic skeleton display
		stage.showLoadingSkeleton();
		expect(stage.isLoadingModel).toBe(true);
		expect(stage.loadingSkeletonGroup).not.toBeNull();
		expect(stage.loadingSkeletonGroup?.name).toBe('loadingSkeleton');
		expect(stage.scene.children).toContain(stage.loadingSkeletonGroup!);

		// Idempotency: multiple calls should not duplicate
		stage.showLoadingSkeleton();
		const skeletonCount = stage.scene.children.filter((c) => c.name === 'loadingSkeleton').length;
		expect(skeletonCount).toBe(1);

		// Animate during loading: updateParameters should not throw and should animate holographic scanning sweep
		expect(() => stage.updateParameters({})).not.toThrow();

		// clearCurrentModel should NOT wipe out the active loading skeleton group
		stage.clearCurrentModel();
		expect(stage.loadingSkeletonGroup).not.toBeNull();
		expect(stage.scene.children).toContain(stage.loadingSkeletonGroup!);

		// Hide holographic skeleton upon model ready
		stage.hideLoadingSkeleton();
		expect(stage.isLoadingModel).toBe(false);
		expect(stage.loadingSkeletonGroup).toBeNull();
		const postHideCount = stage.scene.children.filter((c) => c.name === 'loadingSkeleton').length;
		expect(postHideCount).toBe(0);
	});

	it('should ensure GLB humanoid models receive humanoid tracking without eyeball socket displacement', () => {
		const stage = new ThreeStage();
		stage.modelType = 'glb';

		// Create mock humanoid rig with eye and jaw bones
		const mockRoot = new THREE.Group();
		const eyeL = new THREE.Bone();
		eyeL.name = 'J_Adj_L_FaceEye';
		eyeL.position.set(-0.05, 1.45, 0.1);
		const eyeR = new THREE.Bone();
		eyeR.name = 'J_Adj_R_FaceEye';
		eyeR.position.set(0.05, 1.45, 0.1);
		const head = new THREE.Bone();
		head.name = 'J_Bip_C_Head';
		head.add(eyeL);
		head.add(eyeR);
		mockRoot.add(head);

		(stage as any).discoverHumanoidBones(mockRoot);

		// Record initial eye positions
		const initPosLX = eyeL.position.x;
		const initPosY = eyeL.position.y;

		// Run updateParameters
		stage.updateParameters({
			ParamEyeBallX: 0.8,
			ParamEyeBallY: -0.5,
			ParamEyeLOpen: 0.2
		});

		// Humanoid eye tracking MUST rotate eye bones, NEVER tear eyeball positions out of sockets
		expect(eyeL.position.x).toBe(initPosLX);
		expect(eyeL.position.y).toBe(initPosY);
		expect(eyeL.rotation.y).toBeCloseTo(0.8 * 0.2, 3);
	});

	it('should position FBX humanoid arms downward in relaxed idle without forward zombie projection', () => {
		const stage = new ThreeStage();
		stage.modelType = 'fbx';

		const mockRoot = new THREE.Group();
		const armL = new THREE.Bone();
		armL.name = 'armL';
		const armR = new THREE.Bone();
		armR.name = 'armR';
		const handL = new THREE.Bone();
		handL.name = 'handL';
		const handR = new THREE.Bone();
		handR.name = 'handR';
		mockRoot.add(armL);
		mockRoot.add(armR);
		mockRoot.add(handL);
		mockRoot.add(handR);

		(stage as any).discoverHumanoidBones(mockRoot);

		// Idle frame with zero arm lift
		stage.updateParameters({
			ParamArmLA: 0,
			ParamArmRA: 0
		});

		// Arms must be lowered along X (-0.45), NOT jutted forward along Z (-1.18)
		expect(armL.rotation.x).toBeCloseTo(-0.45, 1);
		expect(armL.rotation.z).toBeCloseTo(0, 1);
		expect(armR.rotation.x).toBeCloseTo(-0.45, 1);
		expect(armR.rotation.z).toBeCloseTo(0, 1);
	});

	it('should respond to hand gestures and animate finger curls and wrist rotations', () => {
		const stage = new ThreeStage();
		stage.modelType = 'fbx';

		const mockRoot = new THREE.Group();
		const armL = new THREE.Bone();
		armL.name = 'armL';
		const armR = new THREE.Bone();
		armR.name = 'armR';
		const handL = new THREE.Bone();
		handL.name = 'handL';
		const handR = new THREE.Bone();
		handR.name = 'handR';

		const indexL = new THREE.Bone();
		indexL.name = 'index_fingerL';
		const thumbL = new THREE.Bone();
		thumbL.name = 'thumb_fingerL';
		const ringL = new THREE.Bone();
		ringL.name = 'ring_fingerL';

		mockRoot.add(armL);
		mockRoot.add(armR);
		mockRoot.add(handL);
		mockRoot.add(handR);
		mockRoot.add(indexL);
		mockRoot.add(thumbL);
		mockRoot.add(ringL);

		(stage as any).discoverHumanoidBones(mockRoot);

		// Fist gesture on left hand
		stage.handGestureL = 'fist';
		stage.updateParameters({
			ParamArmLA: 20,
			ParamHandAngleL: 15
		});

		// Fingers should be curled closed for fist
		expect(indexL.rotation.z).toBeGreaterThan(0.5);
		expect(ringL.rotation.z).toBeGreaterThan(0.5);

		// Peace gesture: index extended (low curl), ring curled
		stage.handGestureL = 'peace';
		stage.updateParameters({
			ParamArmLA: 20
		});
		expect(indexL.rotation.z).toBe(0);
		expect(ringL.rotation.z).toBeGreaterThan(0.5);
	});

	it('should support 3D Graphics Quality Presets (low, medium, highest)', () => {
		const stage = new ThreeStage();
		expect(stage.currentQuality).toBe('medium');

		stage.setQuality('low');
		expect(stage.currentQuality).toBe('low');

		stage.setQuality('highest');
		expect(stage.currentQuality).toBe('highest');

		stage.setQuality('medium');
		expect(stage.currentQuality).toBe('medium');
	});

	it('should drive full arm spread and continuous wrist roll kinematics', () => {
		const stage = new ThreeStage();
		stage.modelType = 'fbx';

		const mockRoot = new THREE.Group();
		const armL = new THREE.Bone();
		armL.name = 'armL';
		const forearmL = new THREE.Bone();
		forearmL.name = 'ForearmL';
		const handL = new THREE.Bone();
		handL.name = 'handL';

		armL.add(forearmL);
		forearmL.add(handL);
		mockRoot.add(armL);

		const armR = new THREE.Bone();
		armR.name = 'armR';
		const forearmR = new THREE.Bone();
		forearmR.name = 'ForearmR';
		const handR = new THREE.Bone();
		handR.name = 'handR';

		armR.add(forearmR);
		forearmR.add(handR);
		mockRoot.add(armR);

		(stage as any).discoverHumanoidBones(mockRoot);

		stage.updateParameters({
			ParamArmLA: 25,
			ParamArmSpreadL: 0.8,
			ParamHandAngleL: 20
		});

		// Upper arm should spread outwards (negative Z rotation in FBX) and lift
		expect(armL.rotation.z).toBeLessThan(-0.4);
		// Forearm / elbow should flex to accompany the spread and elevation
		expect(forearmL.rotation.x).toBeGreaterThan(0.4);
		// Wrist should continuously rotate with hand angle
		expect(handL.rotation.z).toBeGreaterThan(0.15);
	});

	it('should support orbit rotation and resetOrbit in 3D camera angle mode', () => {
		const stage = new ThreeStage();
		expect(stage.orbitTheta).toBe(0);

		stage.rotateOrbit(0.5, 0.2, true);
		expect(stage.orbitTheta).toBeCloseTo(0.5);

		stage.resetOrbit();
		expect(stage.orbitTheta).toBe(0);
	});

	it('should synchronize mouth morph tracking across all sub-meshes and jaw bone', () => {
		const stage = new ThreeStage();
		stage.modelType = 'glb';

		// Create two mock meshes with morph targets (Mesh 1: face skin, Mesh 2: mouth cavity)
		const geom1 = new THREE.BufferGeometry();
		const geom2 = new THREE.BufferGeometry();
		const mat = new THREE.MeshBasicMaterial();
		const mesh1 = new THREE.Mesh(geom1, mat);
		const mesh2 = new THREE.Mesh(geom2, mat);

		mesh1.morphTargetInfluences = [0, 0];
		mesh2.morphTargetInfluences = [0, 0];

		const jawBone = new THREE.Bone();
		jawBone.name = 'J_Bip_C_Jaw';

		// Inject mock meshes, morphDict, and jawNode
		(stage as any).morphMeshes = [mesh1, mesh2];
		(stage as any).morphDict = {
			'a': 0,
			'mouthopen': 0,
			'vrc.aa': 0,
			'blink': 1
		};
		(stage as any).jawNode = jawBone;

		// Feed mouth open tracking parameter (0.5 * 1.5 = 0.75)
		stage.updateParameters({
			ParamMouthOpenY: 0.5
		});

		// Both meshes must receive the updated mouth morphTargetInfluence
		expect(mesh1.morphTargetInfluences[0]).toBeCloseTo(0.75);
		expect(mesh2.morphTargetInfluences[0]).toBeCloseTo(0.75);

		// Jaw bone must rotate downward as anatomical fallback
		expect(jawBone.rotation.x).toBeGreaterThanOrEqual(0.2);
	});
});

