import { rigging } from '#lib/stores/riggingStore.svelte';

export type SfxType =
	| 'click'
	| 'hover'
	| 'toggle'
	| 'cameraOn'
	| 'cameraOff'
	| 'calibrate'
	| 'shutter'
	| 'modal'
	| 'theme'
	| 'expression'
	| 'success';

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
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

		// Ensure audio context is running
		if (ctx.state === 'suspended') {
			ctx.resume().catch(() => {});
		}

		const masterGain = ctx.createGain();
		// Healthy volume level (0.75x of user setting)
		masterGain.gain.setValueAtTime(Math.min(1.0, Math.max(0.0, rigging.sfxVolume * 0.75)), ctx.currentTime);
		masterGain.connect(ctx.destination);

		const now = ctx.currentTime;

		switch (type) {
			case 'click': {
				// Tactile, warm modern UI pop blip (40ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(760, now);
				osc.frequency.exponentialRampToValueAtTime(380, now + 0.035);

				gain.gain.setValueAtTime(0.65, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.04);
				break;
			}

			case 'hover': {
				// Very subtle, airy micro-blip (25ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(520, now);
				osc.frequency.exponentialRampToValueAtTime(640, now + 0.022);

				gain.gain.setValueAtTime(0.22, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.025);
				break;
			}

			case 'toggle': {
				// Crisp dual-tone switch click (55ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'triangle';
				osc.frequency.setValueAtTime(440, now);
				osc.frequency.setValueAtTime(780, now + 0.022);

				gain.gain.setValueAtTime(0.6, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.055);
				break;
			}

			case 'expression': {
				// Kawaii anime expression pop-chime (70ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(880, now);
				osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);

				gain.gain.setValueAtTime(0.55, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.075);
				break;
			}

			case 'cameraOn': {
				// Sci-Fi melodic power-up chord (C5 -> E5 -> G5 -> C6)
				[523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = 'sine';
					const noteStart = now + idx * 0.025;
					osc.frequency.setValueAtTime(freq * 0.9, noteStart);
					osc.frequency.exponentialRampToValueAtTime(freq, noteStart + 0.06);

					gain.gain.setValueAtTime(0.0, now);
					gain.gain.setValueAtTime(0.35, noteStart);
					gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12);

					osc.connect(gain);
					gain.connect(masterGain);
					osc.start(noteStart);
					osc.stop(noteStart + 0.13);
				});
				break;
			}

			case 'cameraOff': {
				// Soft powering-down sweep (110ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(700, now);
				osc.frequency.exponentialRampToValueAtTime(220, now + 0.11);

				gain.gain.setValueAtTime(0.5, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.12);
				break;
			}

			case 'calibrate': {
				// Crystal harmonic target-lock chime (perfect 5th: 880Hz + 1320Hz)
				[880, 1320].forEach((freq) => {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = 'sine';
					osc.frequency.setValueAtTime(freq, now);
					osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.08);

					gain.gain.setValueAtTime(0.45, now);
					gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

					osc.connect(gain);
					gain.connect(masterGain);
					osc.start(now);
					osc.stop(now + 0.24);
				});
				break;
			}

			case 'shutter': {
				// Snappy mechanical camera shutter (dual impulse click + release)
				// Impulse 1: Mirror lift click
				const osc1 = ctx.createOscillator();
				const gain1 = ctx.createGain();
				osc1.type = 'triangle';
				osc1.frequency.setValueAtTime(420, now);
				osc1.frequency.exponentialRampToValueAtTime(90, now + 0.02);
				gain1.gain.setValueAtTime(0.85, now);
				gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
				osc1.connect(gain1);
				gain1.connect(masterGain);
				osc1.start(now);
				osc1.stop(now + 0.025);

				// Impulse 2: Curtain snap release
				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.type = 'sine';
				osc2.frequency.setValueAtTime(650, now + 0.03);
				osc2.frequency.exponentialRampToValueAtTime(140, now + 0.065);
				gain2.gain.setValueAtTime(0.7, now + 0.03);
				gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
				osc2.connect(gain2);
				gain2.connect(masterGain);
				osc2.start(now + 0.03);
				osc2.stop(now + 0.075);
				break;
			}

			case 'modal': {
				// Gentle whoosh sweep (60ms)
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(320, now);
				osc.frequency.exponentialRampToValueAtTime(640, now + 0.05);

				gain.gain.setValueAtTime(0.35, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

				osc.connect(gain);
				gain.connect(masterGain);
				osc.start(now);
				osc.stop(now + 0.07);
				break;
			}

			case 'theme': {
				// Pentatonic sparkle chime arpeggio (E5, A5, D6, F#6)
				[659.25, 880, 1174.66, 1479.98].forEach((f, idx) => {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = 'sine';
					const noteStart = now + idx * 0.025;
					osc.frequency.setValueAtTime(f, noteStart);
					gain.gain.setValueAtTime(0.35, noteStart);
					gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.1);
					osc.connect(gain);
					gain.connect(masterGain);
					osc.start(noteStart);
					osc.stop(noteStart + 0.11);
				});
				break;
			}

			case 'success': {
				// Dual chime (587Hz -> 880Hz)
				const osc1 = ctx.createOscillator();
				const gain1 = ctx.createGain();
				osc1.type = 'sine';
				osc1.frequency.setValueAtTime(587.33, now);
				gain1.gain.setValueAtTime(0.45, now);
				gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
				osc1.connect(gain1);
				gain1.connect(masterGain);
				osc1.start(now);
				osc1.stop(now + 0.09);

				const osc2 = ctx.createOscillator();
				const gain2 = ctx.createGain();
				osc2.type = 'sine';
				osc2.frequency.setValueAtTime(880, now + 0.055);
				gain2.gain.setValueAtTime(0.45, now + 0.055);
				gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
				osc2.connect(gain2);
				gain2.connect(masterGain);
				osc2.start(now + 0.055);
				osc2.stop(now + 0.17);
				break;
			}
		}
	} catch {
		// AudioContext error or user gesture blocked
	}
}
