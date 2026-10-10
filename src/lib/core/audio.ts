import type { VoiceFilterType } from '#lib/types/tracking';

export interface VoiceModelPreset {
	id: VoiceFilterType;
	name: string;
	desc: string;
	badge: string;
	category: 'anime' | 'effects' | 'studio';
}

export const VOICE_MODELS: VoiceModelPreset[] = [
	{
		id: 'none',
		name: 'Natural Passthrough',
		desc: 'Suara asli jernih tanpa pemrosesan efek atau filter',
		badge: 'Clean',
		category: 'studio'
	},
	{
		id: 'anime-girl',
		name: 'Kawaii Anime Girl',
		desc: 'Treble boost & formant resonansi cerah untuk suara imut ala anime girl',
		badge: 'Kawaii',
		category: 'anime'
	},
	{
		id: 'ikemen',
		name: 'Ikemen / Deep Anime Boy',
		desc: 'Resonansi bass sub-harmonic tebal & de-esser hangat untuk vokal maskulin',
		badge: 'Deep',
		category: 'anime'
	},
	{
		id: 'chipmunk',
		name: 'Chipmunk Helium FX',
		desc: 'Formant frekuensi tinggi ekstrim ala kartun tupai helium',
		badge: 'Funny',
		category: 'effects'
	},
	{
		id: 'robot',
		name: 'Cyber Robot (Ring Modulator)',
		desc: 'Modulasi amplitudo sci-fi 55Hz menghasilkan efek suara robotik cybernetic',
		badge: 'Sci-Fi',
		category: 'effects'
	},
	{
		id: 'radio-retro',
		name: 'Vintage Walkie-Talkie',
		desc: 'Bandpass telepon militer 1980-an dengan saturasi harmonik retro',
		badge: 'Retro',
		category: 'effects'
	},
	{
		id: 'echo-hall',
		name: 'Concert Hall Echo',
		desc: 'Delay panggung live concert dengan peredaman reverb akustik 220ms',
		badge: 'Stage',
		category: 'effects'
	},
	{
		id: 'podcast-pro',
		name: 'Studio Broadcast Vocal',
		desc: 'Optimasi kehadiran vokal studio podcast hangat, jernih & berwibawa',
		badge: 'Studio',
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
	private lastOnVolumeChange?: (vol: number) => void;

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
				audio: deviceId ? { deviceId: { exact: deviceId } } : true,
				video: false
			};

			this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
			this.sourceNode = this.audioCtx.createMediaStreamSource(this.micStream);

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
			// sourceNode -> filterNode -> secondaryFilterNode -> gainNode -> analyserNode -> monitorNode -> destination
			// with parallel wet connections for delay and ring-mod
			this.sourceNode.connect(this.filterNode);
			this.filterNode.connect(this.secondaryFilterNode);
			this.secondaryFilterNode.connect(this.gainNode);
			this.secondaryFilterNode.connect(this.delayNode);
			this.delayGain.connect(this.gainNode);

			this.gainNode.connect(this.analyserNode);
			this.analyserNode.connect(this.monitorNode);
			this.monitorNode.connect(this.audioCtx.destination);

			this.isRunning = true;
			this.setGain(this.lastGain);
			this.setMonitor(this.lastMonitor);
			this.setFilter(this.lastFilter);

			// Metering loop
			const updateMeter = () => {
				if (!this.isRunning || !this.analyserNode || !this.dataArray) return;
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
					audio: deviceId ? { deviceId: { exact: deviceId } } : true,
					video: false
				};
				streamToUse = await navigator.mediaDevices.getUserMedia(constraints);
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
		if (this.testSourceNode) {
			try {
				this.testSourceNode.stop();
				this.testSourceNode.disconnect();
			} catch {}
			this.testSourceNode = null;
		}
	}

	playRawSample(onEnded?: () => void): boolean {
		if (!this.testAudioBuffer || !this.audioCtx) return false;
		this.stopPlayback();

		try {
			const source = this.audioCtx.createBufferSource();
			source.buffer = this.testAudioBuffer;
			source.connect(this.audioCtx.destination);
			source.onended = () => {
				this.testSourceNode = null;
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

	playConvertedSample(onEnded?: () => void): boolean {
		if (!this.testAudioBuffer || !this.audioCtx || !this.filterNode || !this.gainNode) return false;
		this.stopPlayback();

		try {
			const source = this.audioCtx.createBufferSource();
			source.buffer = this.testAudioBuffer;

			// Route through active DSP filter chain directly to destination
			source.connect(this.filterNode);
			this.gainNode.connect(this.audioCtx.destination);

			source.onended = () => {
				this.testSourceNode = null;
				try {
					this.gainNode?.disconnect(this.audioCtx!.destination);
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
}

export const voice = new VoiceEngine();
