import type { TrackingResults } from '#lib/types/tracking';

export function solveFaceLandmarks(
	landmarks: Array<{ x: number; y: number; z: number }>,
	blendshapesMap: Map<string, number>,
	offsets: { yaw: number; pitch: number; roll: number },
	handData?: { leftDetected: boolean; rightDetected: boolean; armLA: number; armRA: number }
): TrackingResults {
	// 1. Calculate Head Rotation (Euler Angles) using key geometry points
	const nose = landmarks[1];
	const forehead = landmarks[10];
	const chin = landmarks[152];
	const leftCheek = landmarks[234];
	const rightCheek = landmarks[454];
	const leftEye = landmarks[33];
	const rightEye = landmarks[263];

	// Yaw (Kiri / Kanan)
	const midCheekX = (leftCheek.x + rightCheek.x) / 2;
	const cheekWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.001;
	const rawYaw = ((nose.x - midCheekX) / cheekWidth) * 90;
	const yaw = Math.max(-30, Math.min(30, rawYaw - offsets.yaw));

	// Pitch (Atas / Bawah)
	const midFaceY = (forehead.y + chin.y) / 2;
	const faceHeight = Math.abs(chin.y - forehead.y) || 0.001;
	const rawPitch = -((nose.y - midFaceY) / faceHeight) * 90;
	const pitch = Math.max(-30, Math.min(30, rawPitch - offsets.pitch));

	// Roll (Miring)
	const dX = rightEye.x - leftEye.x;
	const dY = rightEye.y - leftEye.y;
	const rawRoll = Math.atan2(dY, dX) * (180 / Math.PI);
	const roll = Math.max(-30, Math.min(30, rawRoll - offsets.roll));

	// 2. Eyes (Blink & Gaze)
	const blinkL = blendshapesMap.get('eyeBlinkLeft') ?? 0;
	const blinkR = blendshapesMap.get('eyeBlinkRight') ?? 0;
	const eyeBlinkL = Math.max(0, Math.min(1, 1 - blinkL * 1.2));
	const eyeBlinkR = Math.max(0, Math.min(1, 1 - blinkR * 1.2));

	// Eye Ball Gaze (-1 to 1)
	const lookInL = blendshapesMap.get('eyeLookInLeft') ?? 0;
	const lookOutL = blendshapesMap.get('eyeLookOutLeft') ?? 0;
	const lookUpL = blendshapesMap.get('eyeLookUpLeft') ?? 0;
	const lookDownL = blendshapesMap.get('eyeLookDownLeft') ?? 0;
	const eyeBallX = Math.max(-1, Math.min(1, (lookOutL - lookInL) * 1.5));
	const eyeBallY = Math.max(-1, Math.min(1, (lookUpL - lookDownL) * 1.5));

	// 3. Eyebrows (-1 to 1)
	const browInnerUp = blendshapesMap.get('browInnerUp') ?? 0;
	const browDownL = blendshapesMap.get('browDownLeft') ?? 0;
	const browDownR = blendshapesMap.get('browDownRight') ?? 0;
	const browL = Math.max(-1, Math.min(1, browInnerUp - browDownL));
	const browR = Math.max(-1, Math.min(1, browInnerUp - browDownR));

	// 4. Mouth & Cheeks
	const jawOpen = blendshapesMap.get('jawOpen') ?? 0;
	const mouthOpen = Math.max(0, Math.min(1, jawOpen * 1.5));

	const smileL = blendshapesMap.get('mouthSmileLeft') ?? 0;
	const smileR = blendshapesMap.get('mouthSmileRight') ?? 0;
	const frownL = blendshapesMap.get('mouthFrownLeft') ?? 0;
	const frownR = blendshapesMap.get('mouthFrownRight') ?? 0;
	const mouthSmile = (smileL + smileR) / 2;
	const mouthFrown = (frownL + frownR) / 2;
	const mouthForm = Math.max(-1, Math.min(1, mouthSmile - mouthFrown));

	const cheekPuff = Math.max(0, Math.min(1, (blendshapesMap.get('cheekPuff') ?? 0) * 1.5));

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
