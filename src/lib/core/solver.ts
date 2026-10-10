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
	handData?: {
		leftDetected: boolean;
		rightDetected: boolean;
		armLA: number;
		armRA: number;
		gestureL?: 'high_five' | 'wave' | 'open' | 'fist' | 'peace' | 'none';
		gestureR?: 'high_five' | 'wave' | 'open' | 'fist' | 'peace' | 'none';
		isHighFiveL?: boolean;
		isHighFiveR?: boolean;
	}
): TrackingResults {
	const sensitivity = config?.sensitivity ?? 1.0;
	const deadzone = config?.deadzone ?? 0.3;
	const eyeBlinkLinked = config?.eyeBlinkLinked ?? false;
	const invertPitch = config?.invertPitch ?? false;
	const invertYaw = config?.invertYaw ?? false;

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
		// Standard MediaPipe matrix: tilting head down rotates forward around X;
		// Live2D ParamAngleY requires negative angle (-30) for nod-down, positive (+30) for tilt-up.
		const matrixPitch = Math.asin(Math.max(-1, Math.min(1, m12))) * radToDeg;
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

		// Pitch (Up/Down): Looking down (ndiluk) produces negative pitch; looking up (ndangak) produces positive pitch
		const midFaceY = (forehead.y + chin.y) / 2;
		const faceHeight = Math.abs(chin.y - forehead.y) || 0.001;
		rawPitch = -((nose.y - midFaceY) / faceHeight) * 90 * sensitivity;

		// Roll (Tilt)
		const dX = rightEye.x - leftEye.x;
		const dY = rightEye.y - leftEye.y;
		rawRoll = Math.atan2(dY, dX) * (180 / Math.PI) * sensitivity;
	}

	// Apply Calibration & Continuous Deadzone Filter (eliminates idle trembles & removes step jump pops)
	let diffYaw = rawYaw - offsets.yaw;
	if (deadzone > 0) {
		const absY = Math.abs(diffYaw);
		diffYaw = absY <= deadzone ? 0 : Math.sign(diffYaw) * (absY - deadzone);
	}
	let yaw = Math.max(-30, Math.min(30, diffYaw));
	if (invertYaw) yaw = -yaw;

	let diffPitch = rawPitch - offsets.pitch;
	if (deadzone > 0) {
		const absP = Math.abs(diffPitch);
		diffPitch = absP <= deadzone ? 0 : Math.sign(diffPitch) * (absP - deadzone);
	}
	let pitch = Math.max(-30, Math.min(30, diffPitch));
	if (invertPitch) pitch = -pitch;

	let diffRoll = rawRoll - offsets.roll;
	if (deadzone > 0) {
		const absR = Math.abs(diffRoll);
		diffRoll = absR <= deadzone ? 0 : Math.sign(diffRoll) * (absR - deadzone);
	}
	const roll = Math.max(-30, Math.min(30, diffRoll));

	// 2. Eyes: Non-linear Eyelid Curve with Dual-Source (Blendshape + Geometric EAR) & Asymmetric Wink Isolation
	let blinkL = blendshapesMap.get('eyeBlinkLeft') ?? 0;
	let blinkR = blendshapesMap.get('eyeBlinkRight') ?? 0;

	// Dual-source fallback: Geometric Eye Aspect Ratio (EAR) ONLY when blendshapes are absent
	if (!blendshapesMap.has('eyeBlinkLeft') && landmarks && landmarks.length >= 468) {
		const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
			Math.hypot(p1.x - p2.x, p1.y - p2.y);

		const p33 = landmarks[33], p133 = landmarks[133], p159 = landmarks[159], p145 = landmarks[145];
		const p362 = landmarks[362], p263 = landmarks[263], p386 = landmarks[386], p374 = landmarks[374];

		if (p33 && p133 && p159 && p145) {
			const widthL = dist(p33, p133);
			const heightL = dist(p159, p145);
			if (widthL > 0.01 && heightL > 0.005) {
				const earL = heightL / widthL;
				const earBlinkL = Math.max(0, Math.min(1, (0.24 - earL) / 0.14));
				if (earBlinkL > 0) blinkL = earBlinkL;
			}
		}

		if (p362 && p263 && p386 && p374) {
			const widthR = dist(p362, p263);
			const heightR = dist(p386, p374);
			if (widthR > 0.01 && heightR > 0.005) {
				const earR = heightR / widthR;
				const earBlinkR = Math.max(0, Math.min(1, (0.24 - earR) / 0.14));
				if (earBlinkR > 0) blinkR = earBlinkR;
			}
		}
	}

	if (eyeBlinkLinked) {
		const combined = Math.max(blinkL, blinkR);
		blinkL = combined;
		blinkR = combined;
	} else {
		// Asymmetric Wink Isolation:
		// When one eye is intentionally closing while the other is open,
		// prevent facial squint muscle bleed from partially closing the open eye!
		const blinkDiff = blinkL - blinkR;
		if (blinkDiff > 0.18 && blinkL > 0.35) {
			// Deliberate Left eye wink: Keep right eye fully open
			blinkR = Math.max(0, blinkR - 0.25);
			blinkL = Math.min(1.0, blinkL * 1.25);
		} else if (blinkDiff < -0.18 && blinkR > 0.35) {
			// Deliberate Right eye wink: Keep left eye fully open
			blinkL = Math.max(0, blinkL - 0.25);
			blinkR = Math.min(1.0, blinkR * 1.25);
		}
	}

	// Crisp eyelid response: baseline open eyes (0.0 to 0.25) remain 100% open
	let eyeBlinkL = 1 - smoothStep(0.25, 0.65, blinkL);
	let eyeBlinkR = 1 - smoothStep(0.25, 0.65, blinkR);

	// Solid open eyes lock: snap to 1.0 when >= 0.78
	if (eyeBlinkL >= 0.78) eyeBlinkL = 1.0;
	if (eyeBlinkR >= 0.78) eyeBlinkR = 1.0;
	// Clean closed eye lock: snap to 0.0 when <= 0.18
	if (eyeBlinkL <= 0.18) eyeBlinkL = 0.0;
	if (eyeBlinkR <= 0.18) eyeBlinkR = 0.0;

	// Smiling eye blendshapes (^.^)
	const squintL = blendshapesMap.get('eyeSquintLeft') ?? 0;
	const squintR = blendshapesMap.get('eyeSquintRight') ?? 0;
	const eyeSmileL = Math.min(1.0, squintL * 1.5);
	const eyeSmileR = Math.min(1.0, squintR * 1.5);

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

	// 4. Enhanced Mouth Expressions & Cheeks with Geometric Curvature Analysis
	const jawOpen = blendshapesMap.get('jawOpen') ?? 0;
	const mouthClose = blendshapesMap.get('mouthClose') ?? 0;
	const mouthPucker = blendshapesMap.get('mouthPucker') ?? 0;
	const mouthFunnel = blendshapesMap.get('mouthFunnel') ?? 0;
	const mouthOpen = Math.max(0, Math.min(1, jawOpen * 1.5 + mouthFunnel * 0.5 - mouthClose * 0.7));

	const smileL = blendshapesMap.get('mouthSmileLeft') ?? 0;
	const smileR = blendshapesMap.get('mouthSmileRight') ?? 0;
	const frownL = blendshapesMap.get('mouthFrownLeft') ?? 0;
	const frownR = blendshapesMap.get('mouthFrownRight') ?? 0;
	const shrugLower = blendshapesMap.get('mouthShrugLower') ?? 0;
	const shrugUpper = blendshapesMap.get('mouthShrugUpper') ?? 0;
	const mouthLowerDown = ((blendshapesMap.get('mouthLowerDownLeft') ?? 0) + (blendshapesMap.get('mouthLowerDownRight') ?? 0)) / 2;

	const rawSmile = (smileL + smileR) / 2;
	const rawFrown = (frownL + frownR) / 2;

	// Geometric 3D corner curvature analysis for foolproof :( and :)
	let geometricFrown = 0;
	let geometricSmile = 0;
	if (landmarks && landmarks[61] && landmarks[291] && landmarks[13]) {
		const cornerAvgY = (landmarks[61].y + landmarks[291].y) / 2;
		const centerLipY = landmarks[13].y;
		const mouthWidth = Math.abs(landmarks[291].x - landmarks[61].x) || 0.08;
		// Delta: corners are lower than center lip = FROWN :(
		const delta = (cornerAvgY - centerLipY) / mouthWidth;
		if (delta > 0.015) {
			geometricFrown = Math.min(1.0, (delta - 0.015) * 5.0);
		} else if (delta < -0.01) {
			geometricSmile = Math.min(1.0, (-delta - 0.01) * 5.0);
		}
	}

	const totalSmile = Math.max(rawSmile * 1.4, geometricSmile);
	const totalFrown = Math.max(rawFrown * 2.5, geometricFrown, shrugLower * 1.4, mouthLowerDown * 1.2);

	let mouthForm = 0;
	if (totalSmile > 0.15 && totalSmile >= totalFrown) {
		mouthForm = Math.min(1.0, totalSmile);
	} else if (totalFrown > 0.12) {
		mouthForm = -Math.min(1.0, totalFrown * 1.5);
	}
	if (mouthPucker > 0.3) {
		mouthForm = Math.max(-1.0, mouthForm - mouthPucker * 0.4);
	}

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
		handRDetected: handData?.rightDetected ?? false,
		handLGesture: handData?.gestureL,
		handRGesture: handData?.gestureR,
		eyeSmileL,
		eyeSmileR,
		isHighFiveL: handData?.isHighFiveL,
		isHighFiveR: handData?.isHighFiveR
	};
}
