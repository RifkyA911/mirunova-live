/**
 * Momose Aria & 2D Reactive Avatar Engine for MiruNova Live
 * 100% Free / Client-Side WebGL via PIXI.js
 *
 * Implements:
 * - 2.5D Head & Body kinematic parallax (Yaw, Pitch, Roll, Breathing)
 * - Dynamic Eyelid Blinking & Smiling Eyelashes
 * - Expressive Mouth Speech & Emotion Shape (Smile :) / Frown :()
 * - Interactive High-Five Anime Hands
 */
export class ReactiveAvatar2D {
	public container: any;
	public width: number = 540;
	public height: number = 540;
	public anchor = {
		x: 0.5,
		y: 0.5,
		set: (x: number, y: number) => {
			this.anchor.x = x;
			this.anchor.y = y;
			if (this.headContainer) {
				this.headContainer.pivot.set(this.width * x, this.height * y);
			}
		}
	};
	public position = {
		x: 0,
		y: 0,
		set: (x: number, y: number) => {
			this.position.x = x;
			this.position.y = y;
			if (this.container) {
				this.container.position.set(x, y);
			}
		}
	};
	public scale = {
		x: 1,
		y: 1,
		set: (val: number) => {
			this.scale.x = val;
			this.scale.y = val;
			if (this.container) {
				this.container.scale.set(val);
			}
		}
	};

	private PIXI: any;
	private headContainer: any;
	private baseSprite: any;
	private eyeOverlayL: any;
	private eyeOverlayR: any;
	private mouthOverlay: any;
	private handL: any;
	private handR: any;
	private sparkleL: any;
	private sparkleR: any;

	private cachedParams: Record<string, number> = {};

	constructor(PIXI: any) {
		this.PIXI = PIXI;
		this.container = new PIXI.Container();
		this.headContainer = new PIXI.Container();
		this.container.addChild(this.headContainer);
	}

	/**
	 * Creates the reactive avatar from an image URL with client-side background removal.
	 */
	static async create(PIXI: any, imageUrl: string): Promise<ReactiveAvatar2D> {
		const avatar = new ReactiveAvatar2D(PIXI);
		await avatar.init(imageUrl);
		return avatar;
	}

	private async init(imageUrl: string): Promise<void> {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = (e) => reject(new Error('Failed to load avatar image: ' + imageUrl));
			img.src = imageUrl;
		});

		this.width = img.naturalWidth || 540;
		this.height = img.naturalHeight || 540;

		// Key out off-white background (#f6f7f9) in client canvas
		const canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(img, 0, 0);

		const imgData = ctx.getImageData(0, 0, this.width, this.height);
		const data = imgData.data;

		// Sample corner background color
		const bgR = data[0];
		const bgG = data[1];
		const bgB = data[2];

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];

			// Check distance to background or near white
			const dR = Math.abs(r - bgR);
			const dG = Math.abs(g - bgG);
			const dB = Math.abs(b - bgB);

			if ((dR < 22 && dG < 22 && dB < 22) || (r > 244 && g > 244 && b > 245)) {
				data[i + 3] = 0; // Transparent
			} else if ((dR < 32 && dG < 32 && dB < 32) || (r > 238 && g > 238 && b > 239)) {
				// Anti-aliased boundary blend
				const factor = Math.max(0, Math.min(1, (dR + dG + dB) / 96));
				data[i + 3] = Math.round(data[i + 3] * factor);
			}
		}
		ctx.putImageData(imgData, 0, 0);

		const texture = this.PIXI.Texture.from(canvas);
		this.baseSprite = new this.PIXI.Sprite(texture);
		this.headContainer.addChild(this.baseSprite);

		// Anchor at center
		this.headContainer.pivot.set(this.width * 0.5, this.height * 0.5);

		// --- Setup Eye Blinking Overlays ---
		// In Momose Aria (540x540): Left eye (viewer's left) ~ (212, 252), Right eye ~ (328, 252)
		this.eyeOverlayL = new this.PIXI.Graphics();
		this.eyeOverlayR = new this.PIXI.Graphics();
		this.headContainer.addChild(this.eyeOverlayL);
		this.headContainer.addChild(this.eyeOverlayR);

		// --- Setup Dynamic Mouth Overlay ---
		// Mouth coordinate: ~ (273, 327)
		this.mouthOverlay = new this.PIXI.Graphics();
		this.headContainer.addChild(this.mouthOverlay);

		// --- Setup High-Five Anime Hands ---
		this.setupHands();

		this.updateParameters({});
	}

	private setupHands() {
		// Hand L (Screen Right / Viewer's Right)
		this.handL = new this.PIXI.Container();
		const handLGraphics = new this.PIXI.Graphics();
		this.drawAnimeHand(handLGraphics, true);
		this.handL.addChild(handLGraphics);
		this.handL.position.set(this.width * 0.78, this.height * 0.95);
		this.headContainer.addChild(this.handL);

		// Hand R (Screen Left / Viewer's Left)
		this.handR = new this.PIXI.Container();
		const handRGraphics = new this.PIXI.Graphics();
		this.drawAnimeHand(handRGraphics, false);
		this.handR.addChild(handRGraphics);
		this.handR.position.set(this.width * 0.22, this.height * 0.95);
		this.headContainer.addChild(this.handR);

		// Sparkle effects for High Five contact
		this.sparkleL = new this.PIXI.Graphics();
		this.drawSparkle(this.sparkleL);
		this.sparkleL.visible = false;
		this.handL.addChild(this.sparkleL);

		this.sparkleR = new this.PIXI.Graphics();
		this.drawSparkle(this.sparkleR);
		this.sparkleR.visible = false;
		this.handR.addChild(this.sparkleR);
	}

	private drawAnimeHand(g: any, isRightSide: boolean) {
		g.clear();
		// Anime pale skin tone with subtle shadow
		const skinColor = 0xfff0ea;
		const shadowColor = 0xf5d9ce;
		const lineCol = 0x3d272f;

		// Forearm
		g.beginFill(shadowColor);
		g.drawRoundedRect(isRightSide ? -14 : -18, 15, 32, 90, 10);
		g.endFill();

		g.beginFill(skinColor);
		g.drawRoundedRect(isRightSide ? -16 : -16, 10, 32, 90, 10);
		g.endFill();

		// Palm & fingers (Open Palm / High Five)
		g.lineStyle(2, lineCol, 0.8);
		g.beginFill(skinColor);
		g.drawCircle(0, 0, 24); // Palm

		// 4 fingers
		const sign = isRightSide ? 1 : -1;
		[-12, -4, 4, 12].forEach((xOff, idx) => {
			const len = 22 + (idx === 1 || idx === 2 ? 6 : 0);
			g.drawRoundedRect(xOff - 4, -len, 8, len + 4, 4);
		});

		// Thumb
		g.drawRoundedRect(-18 * sign - 3, -8, 8, 18, 4);
		g.endFill();

		// Cute pink palm blush
		g.lineStyle(0);
		g.beginFill(0xffaab8, 0.45);
		g.drawCircle(0, 2, 10);
		g.endFill();
	}

	private drawSparkle(g: any) {
		g.clear();
		g.beginFill(0xffdd44, 0.95);
		// 4-pointed star
		g.drawPolygon([
			0, -22,
			5, -6,
			22, 0,
			5, 6,
			0, 22,
			-5, 6,
			-22, 0,
			-5, -6
		]);
		g.endFill();
		g.beginFill(0xffffff, 1);
		g.drawCircle(0, 0, 5);
		g.endFill();
	}

	/**
	 * Real-time parameter updates matching tracking calculations
	 */
	public updateParameters(params: Record<string, number>) {
		this.cachedParams = params;

		const yaw = params['ParamAngleX'] ?? 0;
		const pitch = params['ParamAngleY'] ?? 0;
		const roll = params['ParamAngleZ'] ?? 0;

		const eyeLOpen = params['ParamEyeLOpen'] ?? 1.0;
		const eyeROpen = params['ParamEyeROpen'] ?? 1.0;
		const eyeLSmile = params['ParamEyeLSmile'] ?? 0;
		const eyeRSmile = params['ParamEyeRSmile'] ?? 0;

		const mouthOpen = params['ParamMouthOpenY'] ?? 0;
		const mouthForm = params['ParamMouthForm'] ?? 0;
		const mouthX = params['ParamMouthX'] ?? 0;

		const armLA = params['ParamArmLA'] ?? 0;
		const armRA = params['ParamArmRA'] ?? 0;
		const armLB = params['ParamArmLB'] ?? 0;
		const armRB = params['ParamArmRB'] ?? 0;
		const breath = params['ParamBreath'] ?? 0;

		// 1. Head 2.5D Parallax Kinematics
		const rad = Math.PI / 180;
		this.headContainer.rotation = roll * rad * 0.7;
		this.headContainer.skew.x = -yaw * 0.004;
		this.headContainer.position.x = this.width * 0.5 + yaw * 1.8;
		this.headContainer.position.y = this.height * 0.5 - pitch * 1.6;

		// Subtle breathing oscillation
		this.headContainer.scale.y = 1 + breath * 0.015;

		// 2. Eye Blinking & Smiling Lash Overlays
		// Coordinates on 540x540: L: (212, 252), R: (328, 252)
		this.drawEyeLid(this.eyeOverlayL, 212, 252, eyeLOpen, eyeLSmile);
		this.drawEyeLid(this.eyeOverlayR, 328, 252, eyeROpen, eyeRSmile);

		// 3. Dynamic Mouth Speech & Emotion Shape (Smile :) vs Frown :()
		// Coordinate on 540x540: (273, 327)
		this.drawMouth(this.mouthOverlay, 273 + mouthX * 8, 327, mouthOpen, mouthForm);

		// 4. Arms & High-Five Hand Tracking
		this.updateHand(this.handL, this.sparkleL, armLA, armLB, true);
		this.updateHand(this.handR, this.sparkleR, armRA, armRB, false);
	}

	private drawEyeLid(g: any, cx: number, cy: number, openVal: number, smileVal: number) {
		g.clear();
		// If eyes are wide open (> 0.65), eyelid is hidden
		if (openVal >= 0.65 && smileVal < 0.3) {
			g.alpha = 0;
			return;
		}

		// Calculate eyelid opacity
		const closeAlpha = Math.max(0, Math.min(1, (0.65 - openVal) / 0.45));
		g.alpha = Math.max(closeAlpha, smileVal * 0.8);

		const lashCol = 0x221c2c; // Dark anime lash color
		const skinCol = 0xfff4ef; // Skin color patch to hide open eye underneath

		// Skin patch covering open eyeball
		g.beginFill(skinCol);
		g.drawEllipse(cx, cy + 2, 26, 18);
		g.endFill();

		// Cute closed anime curved eyelash arc (^.^)
		g.lineStyle(3.5, lashCol, 1, 0.5, true);
		g.moveTo(cx - 24, cy + 4);
		g.quadraticCurveTo(cx, cy - 6, cx + 24, cy + 4);

		// Subtle upper eyelid fold
		g.lineStyle(1.5, 0x8c7885, 0.7);
		g.moveTo(cx - 16, cy - 9);
		g.quadraticCurveTo(cx, cy - 13, cx + 16, cy - 9);

		// Anime blush under eye
		g.lineStyle(0);
		g.beginFill(0xff99a8, 0.35);
		g.drawEllipse(cx, cy + 14, 16, 6);
		g.endFill();
	}

	private drawMouth(g: any, cx: number, cy: number, openVal: number, formVal: number) {
		g.clear();

		// In Momose Aria, default neutral mouth is a small line.
		// If openVal is small and neutral form, keep subtle
		const isTalking = openVal > 0.08;
		const isFrowning = formVal < -0.15;
		const isSmiling = formVal > 0.2;

		const lineCol = 0x3d202d;
		const innerCol = 0x6e1b34; // Dark ruby mouth cavity
		const tongueCol = 0xf472b6; // Anime pink tongue

		// Skin patch to cover the base texture's mouth line when talking or emoting
		if (isTalking || isFrowning || isSmiling) {
			g.beginFill(0xfff5ee);
			g.drawEllipse(cx, cy, 22, 14);
			g.endFill();
		}

		if (isTalking) {
			// Dynamic Talking Mouth Cavity
			const width = 16 + openVal * 12 + (isSmiling ? 6 : isFrowning ? -4 : 0);
			const height = 6 + openVal * 20;

			// Mouth interior
			g.lineStyle(2.5, lineCol, 1);
			g.beginFill(innerCol);

			if (isFrowning) {
				// Downturned sad open mouth (:O / D:)
				g.moveTo(cx - width, cy + height * 0.4);
				g.quadraticCurveTo(cx, cy - height * 0.6, cx + width, cy + height * 0.4);
				g.quadraticCurveTo(cx, cy + height * 0.6, cx - width, cy + height * 0.4);
			} else {
				// Cheerful / neutral open mouth (\___/)
				g.moveTo(cx - width, cy - height * 0.2);
				g.quadraticCurveTo(cx, cy - height * 0.4, cx + width, cy - height * 0.2);
				g.quadraticCurveTo(cx, cy + height, cx - width, cy - height * 0.2);
			}
			g.endFill();

			// Cute tongue at bottom
			g.lineStyle(0);
			g.beginFill(tongueCol);
			g.drawEllipse(cx, cy + height * 0.35, width * 0.55, height * 0.35);
			g.endFill();
		} else if (isFrowning) {
			// Downturned Sad Mouth Line :(
			g.lineStyle(3.0, lineCol, 1);
			g.moveTo(cx - 15, cy + 4);
			g.quadraticCurveTo(cx, cy - 5, cx + 15, cy + 4); // Arched UP in middle = corners down = :(
		} else if (isSmiling) {
			// Cheerful Smile Line :)
			g.lineStyle(3.0, lineCol, 1);
			g.moveTo(cx - 16, cy - 3);
			g.quadraticCurveTo(cx, cy + 5, cx + 16, cy - 3); // Arched DOWN in middle = corners up = :)
		}
	}

	private updateHand(hand: any, sparkle: any, armAngle: number, armHighPose: number, isRightSide: boolean) {
		const isRaised = armAngle > 6 || armHighPose > 0.5;
		const isHighFive = armAngle > 24 || armHighPose > 0.5;

		if (!isRaised) {
			hand.visible = false;
			sparkle.visible = false;
			return;
		}

		hand.visible = true;
		const lift = Math.min(1.0, armAngle / 30);

		// Move hand upwards from bottom towards center
		const baseY = this.height * 0.95;
		const targetY = this.height * 0.55 - (isHighFive ? 60 : 0);
		hand.position.y = baseY - (baseY - targetY) * lift;

		// Tilt hand naturally towards center
		const sign = isRightSide ? 1 : -1;
		hand.rotation = (0.25 - lift * 0.5) * sign;

		// High Five Sparkle contact effect
		if (isHighFive) {
			sparkle.visible = true;
			sparkle.rotation += 0.08;
			const pulse = 1 + Math.sin(performance.now() * 0.01) * 0.2;
			sparkle.scale.set(pulse);
		} else {
			sparkle.visible = false;
		}
	}

	public destroy() {
		if (this.container) {
			this.container.destroy({ children: true });
			this.container = null;
		}
	}
}
