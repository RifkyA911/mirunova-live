import type { VoiceFilterType } from '#lib/types/tracking';

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

			// Gain / Volume Node
			this.gainNode = this.audioCtx.createGain();
			this.gainNode.gain.value = 1.0;

			// Filter Node for Voice Shaping
			this.filterNode = this.audioCtx.createBiquadFilter();
			this.filterNode.type = 'allpass';

			// Analyser Node for Live VU Meter
			this.analyserNode = this.audioCtx.createAnalyser();
			this.analyserNode.fftSize = 256;
			this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

			// Monitor Gain Node (Muted by default to prevent feedback loops)
			this.monitorNode = this.audioCtx.createGain();
			this.monitorNode.gain.value = 0.0;

			// Graph Routing:
			// Source -> Filter -> Gain -> Analyser -> Monitor -> Destination (Speakers)
			this.sourceNode.connect(this.filterNode);
			this.filterNode.connect(this.gainNode);
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
		if (!this.filterNode || !this.audioCtx) return;
		const now = this.audioCtx.currentTime;

		switch (type) {
			case 'pitch-high': // Bright, crispy anime treble boost
				this.filterNode.type = 'highshelf';
				this.filterNode.frequency.setValueAtTime(2800, now);
				this.filterNode.gain.setValueAtTime(6.0, now);
				break;
			case 'pitch-low': // Deep broadcasting radio bass boost
				this.filterNode.type = 'lowshelf';
				this.filterNode.frequency.setValueAtTime(250, now);
				this.filterNode.gain.setValueAtTime(7.0, now);
				break;
			case 'radio': // Bandpass retro walkie-talkie / telephone effect
				this.filterNode.type = 'bandpass';
				this.filterNode.frequency.setValueAtTime(1400, now);
				this.filterNode.Q.setValueAtTime(2.5, now);
				break;
			case 'warmth': // Warm podcast presence boost
				this.filterNode.type = 'peaking';
				this.filterNode.frequency.setValueAtTime(800, now);
				this.filterNode.gain.setValueAtTime(4.0, now);
				this.filterNode.Q.setValueAtTime(1.0, now);
				break;
			case 'none':
			default:
				this.filterNode.type = 'allpass';
				this.filterNode.gain.setValueAtTime(0, now);
				break;
		}
	}
}

export const voice = new VoiceEngine();
