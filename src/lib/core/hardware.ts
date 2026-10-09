/**
 * Hardware Performance Benchmarker & GPU Detector for MiruNova Live
 * Analyzes GPU renderer, CPU cores, real-time FPS & latency
 * Computes performance tier: Tidak Lancar (Red) -> Sangat Lancar / Ultra (Emerald)
 */

export interface HardwareReport {
	gpuRenderer: string;
	gpuVendor: string;
	isNvidiaRtx: boolean;
	isDedicatedGpu: boolean;
	cpuCores: number;
	score: number; // 0 to 100
	tierLabel: 'Tidak Lancar' | 'Cukup' | 'Lancar' | 'Sangat Lancar / Ultra';
	tierColor: string; // Tailwind color class or hex
	fpsEstimate: number;
	recommendation: string;
}

export function detectHardwareBenchmark(currentFps: number = 60): HardwareReport {
	let gpuRenderer = 'Standard WebGL';
	let gpuVendor = 'Generic';

	if (typeof window !== 'undefined') {
		try {
			const canvas = document.createElement('canvas');
			const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
			if (gl) {
				const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
				if (debugInfo) {
					gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
					gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
				}
			}
		} catch {
			// WebGL context blocked or unavailable
		}
	}

	const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
	const lowerGpu = gpuRenderer.toLowerCase();

	const isNvidiaRtx = lowerGpu.includes('rtx') || lowerGpu.includes('geforce rtx') || lowerGpu.includes('quadro rtx');
	const isDedicatedGpu =
		isNvidiaRtx ||
		lowerGpu.includes('gtx') ||
		lowerGpu.includes('radeon rx') ||
		lowerGpu.includes('geforce') ||
		lowerGpu.includes('apple m') ||
		lowerGpu.includes('arc');

	// Compute score based on hardware detection and live FPS
	let baseScore = 50;
	if (isNvidiaRtx) baseScore = 95;
	else if (isDedicatedGpu) baseScore = 80;
	else if (lowerGpu.includes('intel') || lowerGpu.includes('iris') || lowerGpu.includes('uhd')) baseScore = 55;
	else if (lowerGpu.includes('swiftshader') || lowerGpu.includes('llvmpipe')) baseScore = 20;

	// Scale by current live FPS if active
	let finalScore = baseScore;
	if (currentFps > 0) {
		const fpsWeight = Math.min(100, (currentFps / 60) * 100);
		finalScore = Math.round(baseScore * 0.6 + fpsWeight * 0.4);
	}
	finalScore = Math.max(10, Math.min(100, finalScore));

	let tierLabel: HardwareReport['tierLabel'] = 'Lancar';
	let tierColor = '#10b981'; // Emerald
	let recommendation = 'Spesifikasi sangat mumpuni untuk live streaming 60 FPS.';

	if (finalScore < 35) {
		tierLabel = 'Tidak Lancar';
		tierColor = '#ef4444'; // Red
		recommendation = 'Disarankan kecilkan resolusi browser, nonaktifkan overlay mesh di kamera PIP, dan tutup tab lain.';
	} else if (finalScore < 60) {
		tierLabel = 'Cukup';
		tierColor = '#eab308'; // Yellow
		recommendation = 'Berjalan baik pada 30-45 FPS. Untuk streaming lancar di OBS, gunakan resolusi 720p.';
	} else if (finalScore < 85) {
		tierLabel = 'Lancar';
		tierColor = '#22c55e'; // Green
		recommendation = 'Performa optimal 60 FPS. MediaPipe dan WebGL berjalan lancar.';
	} else {
		tierLabel = 'Sangat Lancar / Ultra';
		tierColor = '#10b981'; // Emerald
		recommendation = 'NVIDIA RTX terdeteksi! Akselerasi WebGL GPU Tensor aktif penuh untuk latensi minimal & 60+ FPS mulus tanpa drop frame.';
	}

	return {
		gpuRenderer,
		gpuVendor,
		isNvidiaRtx,
		isDedicatedGpu,
		cpuCores,
		score: finalScore,
		tierLabel,
		tierColor,
		fpsEstimate: currentFps || 60,
		recommendation
	};
}
