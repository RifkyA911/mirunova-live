import { rigging } from '#lib/stores/riggingStore.svelte';

export type SfxType =
	| 'click'
	| 'toggle'
	| 'cameraOn'
	| 'cameraOff'
	| 'calibrate'
	| 'shutter'
	| 'modal'
	| 'theme'
	| 'success';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!audioCtx) {
		const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
		if (AudioCtxClass) {
			audioCtx = new AudioCtxClass();
		}
	}
	if (audioCtx && audioCtx.state === 'suspended') {
		audioCtx.resume().catch(() => {});
	}
	return audioCtx;
}

export function playSfx(type: SfxType) {
	if (!rigging.isSfxEnabled || rigging.sfxVolume <= 0.01) return;

	try {
		const ctx = getAudioContext();
		if (!ctx) return;

		const masterGain = ctx.createGain();
		masterGain.gain.setValueAtTime(Math.min(1.0, Math.max(0.0, rigging.sfxVolume * 0.4)), ctx.currentTime);
		masterGain.connect(ctx.destination);

		const now = ctx.currentTime;

		switch (type) {
			case 'click': {
				// Crisp UI Micro-Tick (30ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'triangle';
				osc.frequency.setValueAtTime(1400, now);
				osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

				gain.gain.setValueAtTime(0.7, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.03);
				break;
			}

			case 'toggle': {
				// Dual tone switch snap (50ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(580, now);
				osc.frequency.setValueAtTime(920, now + 0.02);

				gain.gain.setValueAtTime(0.6, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.05);
				break;
			}

			case 'cameraOn': {
				// Sci-Fi Power-Up Chord (140ms)
				[523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = 'sine';
					osc.frequency.setValueAtTime(freq * 0.8, now + idx * 0.02);
					osc.frequency.exponentialRampToValueAtTime(freq, now + idx * 0.02 + 0.08);

					gain.gain.setValueAtTime(0.0, now);
					gain.gain.setValueAtTime(0.35, now + idx * 0.02);
					gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.12);

					osc.connect(gain);
					gain.connect(masterGain);
					osc.start(now + idx * 0.02);
					osc.stop(now + idx * 0.02 + 0.14);
				});
				break;
			}

			case 'cameraOff': {
				// Soft Power-Down (120ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(650, now);
				osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

				gain.gain.setValueAtTime(0.5, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.13);
				break;
			}

			case 'calibrate': {
				// Crystal Target Lock Chime (200ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(1046.5, now);
				osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.06);

				gain.gain.setValueAtTime(0.8, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.23);
				break;
			}

			case 'shutter': {
				// Realistic Mechanical Camera Shutter (Double impulse + filter)
				const osc1 = ctx.createOscillator();
				const gain1 = ctx.createGain();
				osc1.type = 'square';
				osc1.frequency.setValueAtTime(180, now);
				osc1.frequency.exponentialRampToValueAtTime(60, now + 0.025);
				gain1.gain.setValueAtTime(0.8, now);
				gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
				osc1.connect(gain1);
				gain1.connect(masterGain);
				osc1.start(now);
				osc1.stop(now + 0.03);

				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.type = 'triangle';
				osc2.frequency.setValueAtTime(320, now + 0.035);
				osc2.frequency.exponentialRampToValueAtTime(80, now + 0.07);
				gain2.gain.setValueAtTime(0.7, now + 0.035);
				gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
				osc2.connect(gain2);
				gain2.connect(masterGain);
				osc2.start(now + 0.035);
				osc2.stop(now + 0.08);
				break;
			}

			case 'modal': {
				// Gentle whoosh sweep (70ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(360, now);
				osc.frequency.exponentialRampToValueAtTime(740, now + 0.06);

				gain.gain.setValueAtTime(0.35, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.08);
				break;
			}

			case 'theme': {
				// Sparkle chime arpeggio (120ms)
				[659.25, 880, 1174.66].forEach((f, idx) => {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = 'sine';
					osc.frequency.setValueAtTime(f, now + idx * 0.03);
					gain.gain.setValueAtTime(0.4, now + idx * 0.03);
					gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.09);
					osc.connect(gain);
					gain.connect(masterGain);
					osc.start(now + idx * 0.03);
					osc.stop(now + idx * 0.03 + 0.1);
				});
				break;
			}

			case 'success': {
				// Dual chime (150ms)
				const osc1 = ctx.createOscillator();
				const gain1 = ctx.createGain();
				osc1.type = 'sine';
				osc1.frequency.setValueAtTime(587.33, now);
				gain1.gain.setValueAtTime(0.5, now);
				gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
				osc1.connect(gain1);
				gain1.connect(masterGain);
				osc1.start(now);
				osc1.stop(now + 0.08);

				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.type = 'sine';
				osc2.frequency.setValueAtTime(880, now + 0.06);
				gain2.gain.setValueAtTime(0.5, now + 0.06);
				gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
				osc2.connect(gain2);
				gain2.connect(masterGain);
				osc2.start(now + 0.06);
				osc2.stop(now + 0.16);
				break;
			}
		}
	} catch {
		// AudioContext error or user gesture blocked
	}
}
