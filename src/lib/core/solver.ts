import type { TrackingResults, TrackingConfig } from '#lib/types/tracking';
import type { Matrix } from '@mediapipe/tasks-vision';

function smoothStep(edge0: number, edge1: number, x: number): number {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}

export function solveFaceLandmarks(
	landmarks: Array<{ x: number; y: number; z: number }>,
	blendshapesMap: Map<string, number>,
	offsets: { yaw: number; pitch: number; roll: number },
	matrix?: Float32Array | number[] | Matrix | { data: number[] } | null,
	config?: Partial<TrackingConfig>,
	handData?: { leftDetected: boolean; rightDetected: boolean; armLA: number; armRA: number }
): TrackingResults {
	const sensitivity = config?.sensitivity ?? 1.0;
	const deadzone = config?.deadzone ?? 0.3;
	const eyeBlinkLinked = config?.eyeBlinkLinked ?? false;

	let rawYaw = 0;
	let rawPitch = 0;
	let rawRoll = 0;

	// Extract raw array if Matrix object from MediaPipe
	const mData = (matrix && 'data' in matrix && Array.isArray((matrix as any).data))
		? (matrix as any).data
		: (matrix as Float32Array | number[] | null);

	// 1. High-Precision 6-DoF Head Pose: Try 4x4 Transformation Matrix first
	if (mData && mData.length >= 16) {
		const m10 = mData[1];
		const m11 = mData[5];
		const m02 = mData[8];
		const m12 = mData[9];
		const m22 = mData[10];
		const radToDeg = 180 / Math.PI;

		// Extract Euler angles (Pitch, Yaw, Roll)
		const matrixPitch = Math.asin(Math.max(-1, Math.min(1, -m12))) * radToDeg;
		const matrixYaw = Math.atan2(m02, m22) * radToDeg;
		const matrixRoll = Math.atan2(m10, m11) * radToDeg;

		rawYaw = matrixYaw * sensitivity;
		rawPitch = matrixPitch * sensitivity;
		rawRoll = matrixRoll * sensitivity;
	} else if (landmarks && landmarks.length > 0) {
		// Fallback: 3D geometric landmarks calculation with depth awareness
		const nose = landmarks[1] || { x: 0.5, y: 0.5, z: 0 };
		const forehead = landmarks[10] || { x: 0.5, y: 0.3, z: 0 };
		const chin = landmarks[152] || { x: 0.5, y: 0.7, z: 0 };
		const leftCheek = landmarks[234] || { x: 0.3, y: 0.5, z: 0 };
		const rightCheek = landmarks[454] || { x: 0.7, y: 0.5, z: 0 };
		const leftEye = landmarks[33] || { x: 0.4, y: 0.45, z: 0 };
		const rightEye = landmarks[263] || { x: 0.6, y: 0.45, z: 0 };

		// Yaw (Left/Right)
		const midCheekX = (leftCheek.x + rightCheek.x) / 2;
		const cheekWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.001;
		rawYaw = ((nose.x - midCheekX) / cheekWidth) * 90 * sensitivity;

		// Pitch (Up/Down)
		const midFaceY = (forehead.y + chin.y) / 2;
		const faceHeight = Math.abs(chin.y - forehead.y) || 0.001;
		rawPitch = -((nose.y - midFaceY) / faceHeight) * 90 * sensitivity;

		// Roll (Tilt)
		const dX = rightEye.x - leftEye.x;
		const dY = rightEye.y - leftEye.y;
		rawRoll = Math.atan2(dY, dX) * (180 / Math.PI) * sensitivity;
	}

	// Apply Calibration & Deadzone Filter (eliminates idle breathing trembles)
	let diffYaw = rawYaw - offsets.yaw;
	if (Math.abs(diffYaw) < deadzone) diffYaw = 0;
	const yaw = Math.max(-30, Math.min(30, diffYaw));

	let diffPitch = rawPitch - offsets.pitch;
	if (Math.abs(diffPitch) < deadzone) diffPitch = 0;
	const pitch = Math.max(-30, Math.min(30, diffPitch));

	let diffRoll = rawRoll - offsets.roll;
	if (Math.abs(diffRoll) < deadzone) diffRoll = 0;
	const roll = Math.max(-30, Math.min(30, diffRoll));

	// 2. Eyes: Non-linear Eyelid Curve (Organic smoothstep response)
	let blinkL = blendshapesMap.get('eyeBlinkLeft') ?? 0;
	let blinkR = blendshapesMap.get('eyeBlinkRight') ?? 0;

	if (eyeBlinkLinked) {
		const combined = Math.max(blinkL, blinkR);
		blinkL = combined;
		blinkR = combined;
	}

	// Eyelid response: < 0.18 is fully open (no micro-twitch), > 0.65 is fully closed
	let eyeBlinkL = 1 - smoothStep(0.18, 0.65, blinkL);
	let eyeBlinkR = 1 - smoothStep(0.18, 0.65, blinkR);

	// Squint integration for anime expression
	const squintL = blendshapesMap.get('eyeSquintLeft') ?? 0;
	const squintR = blendshapesMap.get('eyeSquintRight') ?? 0;
	if (squintL > 0.3 && eyeBlinkL > 0.4) eyeBlinkL *= 1 - squintL * 0.35;
	if (squintR > 0.3 && eyeBlinkR > 0.4) eyeBlinkR *= 1 - squintR * 0.35;

	// Symmetrical Eye Gaze (-1 to 1) using both left and right eye blendshapes
	const lookInL = blendshapesMap.get('eyeLookInLeft') ?? 0;
	const lookOutL = blendshapesMap.get('eyeLookOutLeft') ?? 0;
	const lookInR = blendshapesMap.get('eyeLookInRight') ?? 0;
	const lookOutR = blendshapesMap.get('eyeLookOutRight') ?? 0;
	const eyeBallX = Math.max(-1, Math.min(1, (((lookOutL - lookInL) + (lookInR - lookOutR)) / 2) * 1.6));

	const lookUpAvg = ((blendshapesMap.get('eyeLookUpLeft') ?? 0) + (blendshapesMap.get('eyeLookUpRight') ?? 0)) / 2;
	const lookDownAvg = ((blendshapesMap.get('eyeLookDownLeft') ?? 0) + (blendshapesMap.get('eyeLookDownRight') ?? 0)) / 2;
	const eyeBallY = Math.max(-1, Math.min(1, (lookUpAvg - lookDownAvg) * 1.6));

	// 3. Eyebrows (-1 to 1)
	const browInnerUp = blendshapesMap.get('browInnerUp') ?? 0;
	const browOuterUpL = blendshapesMap.get('browOuterUpLeft') ?? 0;
	const browOuterUpR = blendshapesMap.get('browOuterUpRight') ?? 0;
	const browDownL = blendshapesMap.get('browDownLeft') ?? 0;
	const browDownR = blendshapesMap.get('browDownRight') ?? 0;
	const browL = Math.max(-1, Math.min(1, browInnerUp * 0.6 + browOuterUpL * 0.4 - browDownL * 1.2));
	const browR = Math.max(-1, Math.min(1, browInnerUp * 0.6 + browOuterUpR * 0.4 - browDownR * 1.2));

	// 4. Enhanced Mouth Expressions & Cheeks
	const jawOpen = blendshapesMap.get('jawOpen') ?? 0;
	const mouthClose = blendshapesMap.get('mouthClose') ?? 0;
	const mouthPucker = blendshapesMap.get('mouthPucker') ?? 0;
	const mouthFunnel = blendshapesMap.get('mouthFunnel') ?? 0;
	const mouthOpen = Math.max(0, Math.min(1, jawOpen * 1.5 + mouthFunnel * 0.5 - mouthClose * 0.7));

	const smileL = blendshapesMap.get('mouthSmileLeft') ?? 0;
	const smileR = blendshapesMap.get('mouthSmileRight') ?? 0;
	const frownL = blendshapesMap.get('mouthFrownLeft') ?? 0;
	const frownR = blendshapesMap.get('mouthFrownRight') ?? 0;
	const smile = (smileL + smileR) / 2;
	const frown = (frownL + frownR) / 2;
	const mouthForm = Math.max(-1, Math.min(1, smile * 1.4 - frown * 1.1 - mouthPucker * 0.4));

	// Mouth & Jaw horizontal shift (chewing, smirking, talking sideways)
	const jawLeft = blendshapesMap.get('jawLeft') ?? 0;
	const jawRight = blendshapesMap.get('jawRight') ?? 0;
	const mouthLeft = blendshapesMap.get('mouthLeft') ?? 0;
	const mouthRight = blendshapesMap.get('mouthRight') ?? 0;
	const mouthX = Math.max(-1, Math.min(1, ((jawRight + mouthRight) - (jawLeft + mouthLeft)) * 1.6));

	const cheekPuff = Math.max(0, Math.min(1, (blendshapesMap.get('cheekPuff') ?? 0) * 1.8));

	// 5. Body reactive kinematics
	const bodyAngleX = yaw * 0.35;
	const bodyAngleY = pitch * 0.2;
	const bodyAngleZ = roll * 0.25;

	// 6. Arms / Hands
	const armLA = handData?.armLA ?? (yaw > 10 ? 10 : 0);
	const armRA = handData?.armRA ?? (yaw < -10 ? 10 : 0);

	return {
		yaw,
		pitch,
		roll,
		eyeBlinkL,
		eyeBlinkR,
		eyeBallX,
		eyeBallY,
		browL,
		browR,
		mouthOpen,
		mouthForm,
		mouthX,
		cheekPuff,
		bodyAngleX,
		bodyAngleY,
		bodyAngleZ,
		armLA,
		armRA,
		handLDetected: handData?.leftDetected ?? false,
		handRDetected: handData?.rightDetected ?? false
	};
}
