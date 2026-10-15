import type { VoiceFilterType } from '#lib/types/tracking';
export type { VoiceFilterType };

export interface VoiceModelPreset {
	id: VoiceFilterType;
	name: string;
	desc: string;
	badge: string;
	pitchInfo: string;
	pitchRatio: number;
	category: 'anime' | 'effects' | 'studio';
}

export const VOICE_MODELS: VoiceModelPreset[] = [
	{
		id: 'none',
		name: 'Natural Passthrough',
		desc: 'Suara asli jernih tanpa pemrosesan efek atau filter',
		badge: 'Clean',
		pitchInfo: 'Pitch Normal (1.0x)',
		pitchRatio: 1.0,
		category: 'studio'
	},
	{
		id: 'anime-girl',
		name: 'Kawaii Anime Girl',
		desc: 'Pitch shift +5 semitone, formant resonansi cerah & treble boost ala anime girl',
		badge: 'Kawaii',
		pitchInfo: 'Pitch +5 Semitones (+34%)',
		pitchRatio: 1.335,
		category: 'anime'
	},
	{
		id: 'ikemen',
		name: 'Ikemen / Deep Anime Boy',
		desc: 'Pitch shift -5 semitone, resonansi bass sub-harmonic tebal & de-esser maskulin',
		badge: 'Deep',
		pitchInfo: 'Pitch -5 Semitones (-25%)',
		pitchRatio: 0.749,
		category: 'anime'
	},
	{
		id: 'chipmunk',
		name: 'Chipmunk Helium FX',
		desc: 'Pitch shift tinggi +9 semitone ala kartun tupai helium menggemaskan',
		badge: 'Helium',
		pitchInfo: 'Pitch +9 Semitones (+68%)',
		pitchRatio: 1.682,
		category: 'effects'
	},
	{
		id: 'robot',
		name: 'Cyber Robot (Ring Modulator)',
		desc: 'Modulasi amplitudo sci-fi 55Hz & pitch -2 semitone untuk vokal cybernetic',
		badge: 'Sci-Fi',
		pitchInfo: 'Ring Mod 55Hz (Pitch -2st)',
		pitchRatio: 0.891,
		category: 'effects'
	},
	{
		id: 'radio-retro',
		name: 'Vintage Walkie-Talkie',
		desc: 'Bandpass telepon militer 1980-an dengan saturasi harmonik retro',
		badge: 'Retro',
		pitchInfo: 'Bandpass Lo-Fi + Saturation',
		pitchRatio: 1.0,
		category: 'effects'
	},
	{
		id: 'echo-hall',
		name: 'Concert Hall Echo',
		desc: 'Delay panggung live concert dengan peredaman reverb akustik 220ms',
		badge: 'Echo',
		pitchInfo: 'Delay 220ms + Reverb Curve',
		pitchRatio: 1.0,
		category: 'effects'
	},
	{
		id: 'podcast-pro',
		name: 'Studio Broadcast Vocal',
		desc: 'Optimasi kehadiran vokal studio podcast hangat, jernih & berwibawa',
		badge: 'Studio',
		pitchInfo: 'Warm Presence & Sub-Bass',
		pitchRatio: 1.0,
		category: 'studio'
	}
];

function makeDistortionCurve(amount: number = 25): Float32Array {
	const k = amount;
	const n_samples = 22050;
	const curve = new Float32Array(n_samples);
	const deg = Math.PI / 180;
	for (let i = 0; i < n_samples; ++i) {
		const x = (i * 2) / n_samples - 1;
		curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
	}
	return curve;
}

/**
 * Real Web Audio API Microphone & DSP Processing Engine
 * Pure browser standard library, zero external dependencies, 100% client-side.
 */
class VoiceEngine {
	private audioCtx: AudioContext | null = null;
	private micStream: MediaStream | null = null;
	private sourceNode: MediaStreamAudioSourceNode | null = null;
	private pitchNode: ScriptProcessorNode | null = null;
	private gainNode: GainNode | null = null;
	private analyserNode: AnalyserNode | null = null;
	private filterNode: BiquadFilterNode | null = null;
	private secondaryFilterNode: BiquadFilterNode | null = null;
	private distortionNode: WaveShaperNode | null = null;
	private delayNode: DelayNode | null = null;
	private delayGain: GainNode | null = null;
	private ringOsc: OscillatorNode | null = null;
	private ringGain: GainNode | null = null;
	private monitorNode: GainNode | null = null;
	private animFrameId: number | null = null;
	private dataArray: Uint8Array | null = null;
	private lastGain: number = 1.0;
	private lastMonitor: boolean = false;
	private lastFilter: VoiceFilterType = 'none';
	private currentPitchRatio: number = 1.0;
	private lastOnVolumeChange?: (vol: number) => void;

	public getPitchRatio(filter: VoiceFilterType): number {
		const model = VOICE_MODELS.find((m) => m.id === filter);
		if (model) return model.pitchRatio;
		if (filter === 'pitch-high') return 1.335;
		if (filter === 'pitch-low') return 0.749;
		return 1.0;
	}

	public isRunning: boolean = false;
	public currentVolume: number = 0; // 0.0 to 1.0

	async getAudioInputDevices(requestPermissionIfEmpty: boolean = false): Promise<Array<{ deviceId: string; label: string }>> {
		if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
			return [];
		}
		try {
			let devices = await navigator.mediaDevices.enumerateDevices();
			let audioDevices = devices.filter((d) => d.kind === 'audioinput');

			if (requestPermissionIfEmpty && audioDevices.length > 0 && !audioDevices[0].label) {
				try {
					const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
					tempStream.getTracks().forEach((t) => t.stop());
					devices = await navigator.mediaDevices.enumerateDevices();
					audioDevices = devices.filter((d) => d.kind === 'audioinput');
				} catch {
					// User denied or cancelled
				}
			}

			return audioDevices.map((d, i) => ({
				deviceId: d.deviceId,
				label: d.label || `Microphone ${i + 1} (${d.deviceId.slice(0, 6)}...)`
			}));
		} catch {
			return [];
		}
	}

	async switchDevice(deviceId?: string): Promise<boolean> {
		if (!this.isRunning) return true;
		return this.start(deviceId, this.lastOnVolumeChange);
	}

	async start(deviceId?: string, onVolumeChange?: (vol: number) => void): Promise<boolean> {
		this.stop();

		try {
			const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
			if (!AudioContextClass) return false;

			this.audioCtx = new AudioContextClass();
			if (this.audioCtx.state === 'suspended') {
				await this.audioCtx.resume();
			}

			const constraints: MediaStreamConstraints = {
				audio: deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : true,
				video: false
			};

			try {
				this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
			} catch {
				this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
			}
			this.sourceNode = this.audioCtx.createMediaStreamSource(this.micStream);

			// DSP Node 0: Realtime Granular Pitch Shifter with Linear Interpolation
			const bufferSize = 8192;
			const ringBuffer = new Float32Array(bufferSize);
			let writeIdx = 0;
			const grainSize = 1024;
			let delay0 = 0.0;
			let delay1 = grainSize * 0.5;

			this.pitchNode = this.audioCtx.createScriptProcessor(2048, 1, 1);
			this.pitchNode.onaudioprocess = (e) => {
				const input = e.inputBuffer.getChannelData(0);
				const output = e.outputBuffer.getChannelData(0);
				const pitch = this.currentPitchRatio;

				if (Math.abs(pitch - 1.0) < 0.015) {
					output.set(input);
					return;
				}

				// The delay rate of change dD/dt = 1.0 - pitch
				// Pitch > 1 (higher frequency) => rate < 0 (delay shrinks, reading faster)
				// Pitch < 1 (lower frequency)  => rate > 0 (delay grows, reading slower)
				const rate = 1.0 - pitch;

				for (let i = 0; i < input.length; i++) {
					ringBuffer[writeIdx] = input[i];

					delay0 += rate;
					while (delay0 >= grainSize) delay0 -= grainSize;
					while (delay0 < 0) delay0 += grainSize;

					delay1 += rate;
					while (delay1 >= grainSize) delay1 -= grainSize;
					while (delay1 < 0) delay1 += grainSize;

					// Smooth Hanning crossfade window
					const w0 = 0.5 * (1.0 - Math.cos((2.0 * Math.PI * delay0) / grainSize));
					const w1 = 0.5 * (1.0 - Math.cos((2.0 * Math.PI * delay1) / grainSize));

					// Interpolated sample for tap 0
					let readPos0 = writeIdx - delay0;
					while (readPos0 < 0) readPos0 += bufferSize;
					while (readPos0 >= bufferSize) readPos0 -= bufferSize;
					const idx0A = Math.floor(readPos0);
					const idx0B = (idx0A + 1) % bufferSize;
					const frac0 = readPos0 - idx0A;
					const s0 = ringBuffer[idx0A] * (1.0 - frac0) + ringBuffer[idx0B] * frac0;

					// Interpolated sample for tap 1
					let readPos1 = writeIdx - delay1;
					while (readPos1 < 0) readPos1 += bufferSize;
					while (readPos1 >= bufferSize) readPos1 -= bufferSize;
					const idx1A = Math.floor(readPos1);
					const idx1B = (idx1A + 1) % bufferSize;
					const frac1 = readPos1 - idx1A;
					const s1 = ringBuffer[idx1A] * (1.0 - frac1) + ringBuffer[idx1B] * frac1;

					output[i] = s0 * w0 + s1 * w1;
					writeIdx = (writeIdx + 1) % bufferSize;
				}
			};

			// DSP Node 1: Primary Biquad Filter
			this.filterNode = this.audioCtx.createBiquadFilter();
			this.filterNode.type = 'allpass';

			// DSP Node 2: Secondary Resonant Filter (Formants)
			this.secondaryFilterNode = this.audioCtx.createBiquadFilter();
			this.secondaryFilterNode.type = 'allpass';

			// DSP Node 3: Waveshaper for subtle/retro harmonic distortion
			this.distortionNode = this.audioCtx.createWaveShaper();
			this.distortionNode.oversample = '2x';

			// DSP Node 4: Echo/Delay effect
			this.delayNode = this.audioCtx.createDelay(1.0);
			this.delayNode.delayTime.value = 0.22;
			this.delayGain = this.audioCtx.createGain();
			this.delayGain.gain.value = 0.0; // off by default

			// Connect Delay Feedback loop
			this.delayNode.connect(this.delayGain);
			this.delayGain.connect(this.delayNode);

			// DSP Node 5: Ring Modulator for Sci-Fi Robot
			this.ringOsc = this.audioCtx.createOscillator();
			this.ringOsc.type = 'sine';
			this.ringOsc.frequency.setValueAtTime(55, this.audioCtx.currentTime);
			this.ringGain = this.audioCtx.createGain();
			this.ringGain.gain.value = 1.0;
			try {
				this.ringOsc.start();
			} catch {}

			// Master Gain Node
			this.gainNode = this.audioCtx.createGain();
			this.gainNode.gain.value = 1.0;

			// Analyser Node for Live VU Meter
			this.analyserNode = this.audioCtx.createAnalyser();
			this.analyserNode.fftSize = 256;
			this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

			// Monitor Gain Node (Muted by default to prevent acoustic feedback)
			this.monitorNode = this.audioCtx.createGain();
			this.monitorNode.gain.value = 0.0;

			// Routing graph:
			// sourceNode -> pitchNode -> filterNode -> secondaryFilterNode -> distortionNode -> ringGain -> gainNode -> analyserNode -> monitorNode -> destination
			// with parallel wet connections for delay
			this.sourceNode.connect(this.pitchNode);
			this.pitchNode.connect(this.filterNode);
			this.filterNode.connect(this.secondaryFilterNode);
			this.secondaryFilterNode.connect(this.distortionNode);
			this.distortionNode.connect(this.ringGain);
			this.ringGain.connect(this.gainNode);
			this.secondaryFilterNode.connect(this.delayNode);
			this.delayGain.connect(this.gainNode);

			this.gainNode.connect(this.analyserNode);
			this.analyserNode.connect(this.monitorNode);
			this.monitorNode.connect(this.audioCtx.destination);

			this.isRunning = true;
			this.setGain(this.lastGain);
			this.setMonitor(this.lastMonitor);
			this.setFilter(this.lastFilter);

			// Metering loop - Throttled to 60ms (~16 FPS) to prevent 60 FPS Svelte reactive churn
			let lastMeterTime = 0;
			const updateMeter = () => {
				if (!this.isRunning || !this.analyserNode || !this.dataArray) return;
				const now = performance.now();
				if (now - lastMeterTime >= 60) {
					lastMeterTime = now;
					this.analyserNode.getByteFrequencyData(this.dataArray as any);

					let sum = 0;
					for (let i = 0; i < this.dataArray.length; i++) {
						sum += this.dataArray[i];
					}
					const avg = sum / this.dataArray.length;
					this.currentVolume = Math.min(1.0, (avg / 128) * 1.5);

					if (onVolumeChange) {
						onVolumeChange(this.currentVolume);
					}
				}

				this.animFrameId = requestAnimationFrame(updateMeter);
			};
			updateMeter();

			return true;
		} catch (err) {
			console.warn('VoiceEngine: Failed to access microphone:', err);
			this.stop();
			return false;
		}
	}

	stop() {
		this.isRunning = false;
		if (this.animFrameId) {
			cancelAnimationFrame(this.animFrameId);
			this.animFrameId = null;
		}
		if (this.pitchNode) {
			try { this.pitchNode.disconnect(); } catch {}
			this.pitchNode = null;
		}
		if (this.ringOsc) {
			try { this.ringOsc.stop(); } catch {}
			this.ringOsc = null;
		}
		if (this.micStream) {
			this.micStream.getTracks().forEach((t) => t.stop());
			this.micStream = null;
		}
		if (this.audioCtx) {
			this.audioCtx.close().catch(() => {});
			this.audioCtx = null;
		}
		this.sourceNode = null;
		this.gainNode = null;
		this.filterNode = null;
		this.secondaryFilterNode = null;
		this.distortionNode = null;
		this.delayNode = null;
		this.delayGain = null;
		this.ringGain = null;
		this.analyserNode = null;
		this.monitorNode = null;
		this.currentVolume = 0;
	}

	setGain(gain: number) {
		this.lastGain = gain;
		if (this.gainNode && this.audioCtx) {
			this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(3, gain)), this.audioCtx.currentTime);
		}
	}

	setMonitor(enabled: boolean) {
		this.lastMonitor = enabled;
		if (this.monitorNode && this.audioCtx) {
			this.monitorNode.gain.setValueAtTime(enabled ? 0.9 : 0.0, this.audioCtx.currentTime);
		}
	}

	setFilter(type: VoiceFilterType) {
		this.lastFilter = type;
		this.currentPitchRatio = this.getPitchRatio(type);
		if (!this.filterNode || !this.secondaryFilterNode || !this.audioCtx) return;
		const now = this.audioCtx.currentTime;

		// Reset delay wet gain
		if (this.delayGain) {
			this.delayGain.gain.setValueAtTime(0.0, now);
		}
		// Reset distortion curve
		if (this.distortionNode) {
			this.distortionNode.curve = null;
		}
		// Reset ring modulator
		if (this.ringOsc && this.ringGain) {
			try {
				this.ringOsc.disconnect();
				this.ringGain.gain.setValueAtTime(1.0, now);
			} catch {}
		}

		switch (type) {
			case 'anime-girl':
			case 'pitch-high': {
				// Bright Kawaii E-Girl Vocal: Upper formant peak + high-shelf brightness
				this.filterNode.type = 'highshelf';
				this.filterNode.frequency.setValueAtTime(2900, now);
				this.filterNode.gain.setValueAtTime(8.0, now);

				this.secondaryFilterNode.type = 'peaking';
				this.secondaryFilterNode.frequency.setValueAtTime(1750, now);
				this.secondaryFilterNode.gain.setValueAtTime(5.0, now);
				this.secondaryFilterNode.Q.setValueAtTime(2.2, now);
				break;
			}

			case 'ikemen':
			case 'pitch-low': {
				// Deep Masculine Resonant Voice: Sub-harmonic low shelf + sibilance cut
				this.filterNode.type = 'lowshelf';
				this.filterNode.frequency.setValueAtTime(190, now);
				this.filterNode.gain.setValueAtTime(8.5, now);

				this.secondaryFilterNode.type = 'lowpass';
				this.secondaryFilterNode.frequency.setValueAtTime(5200, now);
				this.secondaryFilterNode.Q.setValueAtTime(0.9, now);
				break;
			}

			case 'chipmunk': {
				// Extreme High Helium Cartoon Shifter: Highpass cut + high formant boost
				this.filterNode.type = 'highpass';
				this.filterNode.frequency.setValueAtTime(650, now);
				this.filterNode.Q.setValueAtTime(1.2, now);

				this.secondaryFilterNode.type = 'peaking';
				this.secondaryFilterNode.frequency.setValueAtTime(3800, now);
				this.secondaryFilterNode.gain.setValueAtTime(12.0, now);
				this.secondaryFilterNode.Q.setValueAtTime(3.0, now);
				break;
			}

			case 'robot': {
				// Sci-Fi Metallic Ring Modulator Style Resonance
				this.filterNode.type = 'bandpass';
				this.filterNode.frequency.setValueAtTime(950, now);
				this.filterNode.Q.setValueAtTime(4.5, now);

				this.secondaryFilterNode.type = 'peaking';
				this.secondaryFilterNode.frequency.setValueAtTime(2400, now);
				this.secondaryFilterNode.gain.setValueAtTime(10.0, now);
				this.secondaryFilterNode.Q.setValueAtTime(5.0, now);

				if (this.ringOsc && this.ringGain) {
					try {
						this.ringOsc.frequency.setValueAtTime(55, now);
						this.ringGain.gain.setValueAtTime(0.0, now);
						this.ringOsc.connect(this.ringGain.gain);
					} catch {}
				}
				break;
			}

			case 'radio-retro':
			case 'radio': {
				// Vintage 1980s Walkie-Talkie: Narrow bandpass + harmonic saturation
				this.filterNode.type = 'bandpass';
				this.filterNode.frequency.setValueAtTime(1450, now);
				this.filterNode.Q.setValueAtTime(2.8, now);

				this.secondaryFilterNode.type = 'highpass';
				this.secondaryFilterNode.frequency.setValueAtTime(420, now);
				this.secondaryFilterNode.Q.setValueAtTime(1.5, now);

				if (this.distortionNode) {
					this.distortionNode.curve = makeDistortionCurve(18) as any;
				}
				break;
			}

			case 'echo-hall': {
				// Live Concert Reverb & Echo: Smooth shelf + 220ms delay feedback
				this.filterNode.type = 'peaking';
				this.filterNode.frequency.setValueAtTime(2200, now);
				this.filterNode.gain.setValueAtTime(2.0, now);
				this.filterNode.Q.setValueAtTime(1.0, now);

				this.secondaryFilterNode.type = 'lowpass';
				this.secondaryFilterNode.frequency.setValueAtTime(6000, now);

				if (this.delayGain) {
					this.delayGain.gain.setValueAtTime(0.38, now);
				}
				break;
			}

			case 'podcast-pro':
			case 'warmth': {
				// Warm Studio Broadcast: Warm presence + gentle high-end clarity
				this.filterNode.type = 'lowshelf';
				this.filterNode.frequency.setValueAtTime(140, now);
				this.filterNode.gain.setValueAtTime(3.5, now);

				this.secondaryFilterNode.type = 'peaking';
				this.secondaryFilterNode.frequency.setValueAtTime(3100, now);
				this.secondaryFilterNode.gain.setValueAtTime(3.0, now);
				this.secondaryFilterNode.Q.setValueAtTime(1.2, now);
				break;
			}

			case 'none':
			default: {
				this.filterNode.type = 'allpass';
				this.filterNode.gain.setValueAtTime(0, now);
				this.secondaryFilterNode.type = 'allpass';
				this.secondaryFilterNode.gain.setValueAtTime(0, now);
				break;
			}
		}
	}

	// ==========================================
	// MIC TEST & VOICE CONVERSION TEST ENGINE
	// ==========================================
	private testAudioBuffer: AudioBuffer | null = null;
	private testSourceNode: AudioBufferSourceNode | null = null;
	private isRecordingTest = false;

	async recordSample(deviceId?: string, durationSec: number = 4, onTick?: (left: number) => void): Promise<boolean> {
		if (typeof window === 'undefined') return false;
		if (this.isRecordingTest) return false;
		this.isRecordingTest = true;

		try {
			if (!this.audioCtx) {
				const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
				this.audioCtx = new AudioCtxClass();
			}
			if (this.audioCtx.state === 'suspended') {
				await this.audioCtx.resume();
			}

			let streamToUse = this.micStream;
			let ownsStream = false;

			if (!streamToUse || !streamToUse.active) {
				const constraints: MediaStreamConstraints = {
					audio: deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : true,
					video: false
				};
				try {
					streamToUse = await navigator.mediaDevices.getUserMedia(constraints);
				} catch {
					streamToUse = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
				}
				ownsStream = true;
			}

			const recorder = new MediaRecorder(streamToUse);
			const chunks: Blob[] = [];

			recorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) chunks.push(e.data);
			};

			const recordPromise = new Promise<boolean>((resolve) => {
				recorder.onstop = async () => {
					try {
						const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
						const arrayBuf = await blob.arrayBuffer();
						if (this.audioCtx) {
							this.testAudioBuffer = await this.audioCtx.decodeAudioData(arrayBuf);
							resolve(true);
						} else {
							resolve(false);
						}
					} catch (err) {
						console.warn('VoiceEngine: Failed to decode recorded test sample:', err);
						resolve(false);
					} finally {
						if (ownsStream) {
							streamToUse?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
						}
						this.isRecordingTest = false;
					}
				};
			});

			recorder.start();
			let secRemaining = durationSec;
			if (onTick) onTick(secRemaining);

			const interval = setInterval(() => {
				secRemaining -= 1;
				if (secRemaining > 0) {
					if (onTick) onTick(secRemaining);
				} else {
					clearInterval(interval);
					if (recorder.state === 'recording') {
						recorder.stop();
					}
				}
			}, 1000);

			return await recordPromise;
		} catch (err) {
			console.warn('VoiceEngine: recordSample error:', err);
			this.isRecordingTest = false;
			return false;
		}
	}

	hasRecordedSample(): boolean {
		return this.testAudioBuffer !== null;
	}

	stopPlayback() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
		}
		if (this.testSourceNode) {
			try {
				this.testSourceNode.stop();
				this.testSourceNode.disconnect();
			} catch {}
			this.testSourceNode = null;
		}
	}

	ensureTestBuffer(): AudioBuffer | null {
		if (this.testAudioBuffer) return this.testAudioBuffer;
		if (typeof window === 'undefined') return null;
		try {
			if (!this.audioCtx) {
				const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
				this.audioCtx = new AudioCtxClass();
			}
			const sampleRate = this.audioCtx.sampleRate || 44100;
			const duration = 2.4;
			const numSamples = Math.floor(sampleRate * duration);
			const buffer = this.audioCtx.createBuffer(1, numSamples, sampleRate);
			const data = buffer.getChannelData(0);
			const baseF0 = 220; // Natural A3 fundamental pitch

			for (let i = 0; i < numSamples; i++) {
				const t = i / sampleRate;
				// Speech syllables envelope with natural breathing cadence
				const env = Math.sin((t / duration) * Math.PI) * (0.75 + 0.25 * Math.sin(t * 16));
				// Rich human vocal harmonic spectrum
				const h1 = Math.sin(2 * Math.PI * baseF0 * t) * 0.45;
				const h2 = Math.sin(2 * Math.PI * baseF0 * 2 * t) * 0.25;
				const h3 = Math.sin(2 * Math.PI * baseF0 * 3 * t) * 0.16;
				const h4 = Math.sin(2 * Math.PI * baseF0 * 4 * t) * 0.09;
				const h5 = Math.sin(2 * Math.PI * baseF0 * 5 * t) * 0.05;
				data[i] = (h1 + h2 + h3 + h4 + h5) * env * 0.5;
			}
			this.testAudioBuffer = buffer;
			return buffer;
		} catch (e) {
			console.warn('VoiceEngine: ensureTestBuffer failed:', e);
			return null;
		}
	}

	async playRawSample(onEnded?: () => void): Promise<boolean> {
		if (!this.testAudioBuffer) {
			this.ensureTestBuffer();
		}
		if (!this.testAudioBuffer) return false;
		if (typeof window === 'undefined') return false;
		this.stopPlayback();

		try {
			if (!this.audioCtx) {
				const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
				this.audioCtx = new AudioCtxClass();
			}
			if (this.audioCtx.state === 'suspended') {
				await this.audioCtx.resume();
			}

			const source = this.audioCtx.createBufferSource();
			source.buffer = this.testAudioBuffer;
			source.connect(this.audioCtx.destination);
			source.onended = () => {
				this.testSourceNode = null;
				try {
					source.disconnect();
				} catch {}
				if (onEnded) onEnded();
			};
			this.testSourceNode = source;
			source.start(0);
			return true;
		} catch (err) {
			console.warn('VoiceEngine: playRawSample error:', err);
			return false;
		}
	}

	async playConvertedSample(onEnded?: () => void, filterType?: VoiceFilterType): Promise<boolean> {
		if (!this.testAudioBuffer) {
			this.ensureTestBuffer();
		}
		if (!this.testAudioBuffer) return false;
		if (typeof window === 'undefined') return false;

		try {
			if (!this.audioCtx) {
				const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
				this.audioCtx = new AudioCtxClass();
			}
			if (this.audioCtx.state === 'suspended') {
				await this.audioCtx.resume();
			}

			this.stopPlayback();

			// If filterType is 'none' or unspecified, default to 'anime-girl' so conversion is immediately audible
			const activeFilter = (filterType && filterType !== 'none') ? filterType : (this.lastFilter && this.lastFilter !== 'none' ? this.lastFilter : 'anime-girl');
			const source = this.audioCtx.createBufferSource();
			source.buffer = this.testAudioBuffer;

			// Apply real pitch transposition factor
			const pitch = this.getPitchRatio(activeFilter);
			source.playbackRate.value = pitch;

			// Build dedicated standalone preview DSP chain
			const previewFilter1 = this.audioCtx.createBiquadFilter();
			const previewFilter2 = this.audioCtx.createBiquadFilter();
			const previewGain = this.audioCtx.createGain();
			previewGain.gain.value = 1.0;

			let previewRingOsc: OscillatorNode | null = null;
			let previewRingGain: GainNode | null = null;
			let previewDist: WaveShaperNode | null = null;
			let previewDelay: DelayNode | null = null;
			let previewDelayGain: GainNode | null = null;

			const now = this.audioCtx.currentTime;
			switch (activeFilter) {
				case 'anime-girl':
					previewFilter1.type = 'peaking';
					previewFilter1.frequency.setValueAtTime(3400, now);
					previewFilter1.gain.setValueAtTime(6.0, now);
					previewFilter1.Q.setValueAtTime(1.5, now);
					previewFilter2.type = 'highshelf';
					previewFilter2.frequency.setValueAtTime(5500, now);
					previewFilter2.gain.setValueAtTime(4.0, now);
					break;
				case 'ikemen':
					previewFilter1.type = 'lowshelf';
					previewFilter1.frequency.setValueAtTime(180, now);
					previewFilter1.gain.setValueAtTime(6.5, now);
					previewFilter2.type = 'peaking';
					previewFilter2.frequency.setValueAtTime(350, now);
					previewFilter2.gain.setValueAtTime(4.0, now);
					previewFilter2.Q.setValueAtTime(1.2, now);
					break;
				case 'chipmunk':
					previewFilter1.type = 'highpass';
					previewFilter1.frequency.setValueAtTime(320, now);
					previewFilter2.type = 'peaking';
					previewFilter2.frequency.setValueAtTime(4200, now);
					previewFilter2.gain.setValueAtTime(5.0, now);
					previewFilter2.Q.setValueAtTime(2.0, now);
					break;
				case 'robot':
					previewFilter1.type = 'bandpass';
					previewFilter1.frequency.setValueAtTime(1200, now);
					previewFilter1.Q.setValueAtTime(3.0, now);
					previewFilter2.type = 'peaking';
					previewFilter2.frequency.setValueAtTime(2400, now);
					previewFilter2.gain.setValueAtTime(4.0, now);

					// True Sci-Fi Ring Modulator for Preview
					previewRingOsc = this.audioCtx.createOscillator();
					previewRingOsc.type = 'sine';
					previewRingOsc.frequency.setValueAtTime(55, now);
					previewRingGain = this.audioCtx.createGain();
					previewRingGain.gain.setValueAtTime(0.0, now);
					previewRingOsc.connect(previewRingGain.gain);
					try {
						previewRingOsc.start(now);
					} catch {}
					break;
				case 'radio-retro':
					previewFilter1.type = 'bandpass';
					previewFilter1.frequency.setValueAtTime(1800, now);
					previewFilter1.Q.setValueAtTime(1.8, now);
					previewFilter2.type = 'peaking';
					previewFilter2.frequency.setValueAtTime(1000, now);
					previewFilter2.gain.setValueAtTime(5.0, now);

					// Vintage Lo-Fi Saturation Distortion for Preview
					previewDist = this.audioCtx.createWaveShaper();
					previewDist.curve = makeDistortionCurve(22) as any;
					previewDist.oversample = '2x';
					break;
				case 'echo-hall':
					previewFilter1.type = 'lowpass';
					previewFilter1.frequency.setValueAtTime(4500, now);
					previewFilter2.type = 'allpass';

					// Concert Reverb Delay Feedback for Preview
					previewDelay = this.audioCtx.createDelay(1.0);
					previewDelay.delayTime.setValueAtTime(0.22, now);
					previewDelayGain = this.audioCtx.createGain();
					previewDelayGain.gain.setValueAtTime(0.38, now);
					previewDelay.connect(previewDelayGain);
					previewDelayGain.connect(previewDelay);
					break;
				case 'podcast-pro':
					previewFilter1.type = 'lowshelf';
					previewFilter1.frequency.setValueAtTime(120, now);
					previewFilter1.gain.setValueAtTime(3.5, now);
					previewFilter2.type = 'peaking';
					previewFilter2.frequency.setValueAtTime(3100, now);
					previewFilter2.gain.setValueAtTime(3.0, now);
					previewFilter2.Q.setValueAtTime(1.2, now);
					break;
				default:
					previewFilter1.type = 'allpass';
					previewFilter2.type = 'allpass';
					break;
			}

			// Chain preview audio nodes
			source.connect(previewFilter1);
			previewFilter1.connect(previewFilter2);

			let lastChainNode: AudioNode = previewFilter2;
			if (previewDist) {
				lastChainNode.connect(previewDist);
				lastChainNode = previewDist;
			}
			if (previewRingGain) {
				lastChainNode.connect(previewRingGain);
				lastChainNode = previewRingGain;
			}

			lastChainNode.connect(previewGain);

			if (previewDelay && previewDelayGain) {
				lastChainNode.connect(previewDelay);
				previewDelayGain.connect(previewGain);
			}

			previewGain.connect(this.audioCtx.destination);

			source.onended = () => {
				this.testSourceNode = null;
				try {
					source.disconnect();
					previewFilter1.disconnect();
					previewFilter2.disconnect();
					if (previewDist) previewDist.disconnect();
					if (previewRingGain) previewRingGain.disconnect();
					if (previewRingOsc) {
						previewRingOsc.stop();
						previewRingOsc.disconnect();
					}
					if (previewDelay) previewDelay.disconnect();
					if (previewDelayGain) previewDelayGain.disconnect();
					previewGain.disconnect();
				} catch {}
				if (onEnded) onEnded();
			};

			this.testSourceNode = source;
			source.start(0);
			return true;
		} catch (err) {
			console.warn('VoiceEngine: playConvertedSample error:', err);
			return false;
		}
	}

	async synthesizeVoiceText(
		text: string,
		filterType?: VoiceFilterType,
		preferredVoiceName?: string,
		onEnded?: () => void
	): Promise<boolean> {
		if (typeof window === 'undefined') return false;

		// Cancel any previous speech
		if ('speechSynthesis' in window) {
			window.speechSynthesis.cancel();
		}

		const cleanText = (text || 'Halo, ini uji coba suara alami Mirunova Live. Suara ini terdengar jernih seperti manusia.').trim();
		const activeFilter = filterType || this.lastFilter || 'anime-girl';

		if ('speechSynthesis' in window) {
			return new Promise<boolean>((resolve) => {
				try {
					const utterance = new SpeechSynthesisUtterance(cleanText);
					const voices = window.speechSynthesis.getVoices();

					// Detect language of text for accurate phonetic pronunciation
					const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]|konnichiwa|arigato|ohayou/i.test(cleanText);
					const hasIndonesian = /halo|selamat|suara|ini|dengan|kamu|aku|dan|di|pagi|malam|bicara|tes|nyaman/i.test(cleanText);

					let chosenVoice: SpeechSynthesisVoice | undefined;
					if (preferredVoiceName) {
						chosenVoice = voices.find((v) => v.name === preferredVoiceName);
					}

					if (!chosenVoice && voices.length > 0) {
						if (hasJapanese) {
							const jaVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('ja'));
							if (jaVoices.length > 0) {
								if (activeFilter === 'anime-girl' || activeFilter === 'chipmunk') {
									chosenVoice = jaVoices.find((v) => /haruka|ayumi|nanami|kyoko|sayaka|female/i.test(v.name)) || jaVoices[0];
								} else if (activeFilter === 'ikemen') {
									chosenVoice = jaVoices.find((v) => /keita|ichiro|male/i.test(v.name)) || jaVoices[0];
								} else {
									chosenVoice = jaVoices[0];
								}
							}
						} else if (hasIndonesian) {
							const idVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('id'));
							if (idVoices.length > 0) {
								if (activeFilter === 'anime-girl' || activeFilter === 'chipmunk') {
									chosenVoice = idVoices.find((v) => /gadis|female/i.test(v.name)) || idVoices[0];
								} else if (activeFilter === 'ikemen') {
									chosenVoice = idVoices.find((v) => /male|arfi/i.test(v.name)) || idVoices[0];
								} else {
									chosenVoice = idVoices[0];
								}
							}
						}

						// Fallback: Pick highest-quality natural voice matching persona
						if (!chosenVoice) {
							if (activeFilter === 'anime-girl' || activeFilter === 'chipmunk') {
								chosenVoice =
									voices.find((v) => /natural|neural|online/i.test(v.name) && /female|gadis|haruka|zira|jenny/i.test(v.name)) ||
									voices.find((v) => /gadis|haruka|ayumi|nanami|kyoko|zira|jenny|female/i.test(v.name)) ||
									voices.find((v) => !/male|david|george|ichiro/i.test(v.name));
							} else if (activeFilter === 'ikemen') {
								chosenVoice =
									voices.find((v) => /natural|neural|online/i.test(v.name) && /male|david|george|ichiro|keita|guy/i.test(v.name)) ||
									voices.find((v) => /male|david|george|ichiro|keita|guy/i.test(v.name)) ||
									voices.find((v) => !/female|zira|gadis|haruka|jenny/i.test(v.name));
							}
						}

						if (!chosenVoice) {
							chosenVoice = voices.find((v) => v.default) || voices[0];
						}
					}

					if (chosenVoice) {
						utterance.voice = chosenVoice;
					}

					// Characteristic pitch & prosody presets based on active voice filter
					switch (activeFilter) {
						case 'anime-girl':
							utterance.pitch = 1.32; // Sweet, bright feminine anime pitch
							utterance.rate = 1.08;
							break;
						case 'ikemen':
							utterance.pitch = 0.76; // Deep, handsome anime baritone resonance
							utterance.rate = 0.94;
							break;
						case 'chipmunk':
							utterance.pitch = 1.82; // Playful helium cartoon pitch
							utterance.rate = 1.25;
							break;
						case 'robot':
							utterance.pitch = 0.78; // Monotone deliberate robotic cadence
							utterance.rate = 0.85;
							break;
						case 'radio-retro':
							utterance.pitch = 1.05;
							utterance.rate = 1.10;
							break;
						case 'echo-hall':
							utterance.pitch = 1.0;
							utterance.rate = 0.95;
							break;
						case 'podcast-pro':
							utterance.pitch = 0.95;
							utterance.rate = 0.98;
							break;
						case 'none':
						default:
							utterance.pitch = 1.0;
							utterance.rate = 1.0;
							break;
					}

					// Lip-sync animation: Drive avatar mouth opening during speech reading
					let lipSyncTimer: any = null;
					let frameCount = 0;
					import('#lib/stores/riggingStore.svelte')
						.then(({ rigging }) => {
							lipSyncTimer = setInterval(() => {
								frameCount++;
								// Syllable rhythm modulation between 0.15 and 0.75
								const amp = 0.35 + 0.3 * Math.sin(frameCount * 0.8) * Math.sin(frameCount * 0.3);
								rigging.micVolumeLevel = Math.max(0.08, amp);
							}, 60);
						})
						.catch(() => {});

					const cleanupLipSync = () => {
						if (lipSyncTimer) {
							clearInterval(lipSyncTimer);
							lipSyncTimer = null;
						}
						import('#lib/stores/riggingStore.svelte')
							.then(({ rigging }) => {
								rigging.micVolumeLevel = 0;
							})
							.catch(() => {});
					};

					utterance.onend = () => {
						cleanupLipSync();
						if (onEnded) onEnded();
						resolve(true);
					};
					utterance.onerror = (err) => {
						cleanupLipSync();
						console.warn('VoiceEngine: SpeechSynthesis error:', err);
						if (onEnded) onEnded();
						resolve(false);
					};

					window.speechSynthesis.speak(utterance);
				} catch (err) {
					console.warn('VoiceEngine: synthesizeVoiceText error:', err);
					if (onEnded) onEnded();
					resolve(false);
				}
			});
		}

		return false;
	}
}

export const voice = new VoiceEngine();
