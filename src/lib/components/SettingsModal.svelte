<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { detectHardwareBenchmark, type HardwareReport } from '#lib/core/hardware';
	import { clearPreferences, exportConfigJson, importConfigJson } from '#lib/core/storage';
	import type { UITheme, BackgroundStyle, ScreenEffect } from '#lib/types/tracking';
	import {
		Settings,
		X,
		Cpu,
		Palette,
		Mic,
		Database,
		Check,
		Download,
		Upload,
		RotateCcw,
		Sparkles,
		ShieldCheck,
		Crosshair,
		Info,
		Layers
	} from 'lucide-svelte';

	let activeTab = $state<'perf' | 'appearance' | 'voice' | 'storage'>('perf');
	let hardware = $state<HardwareReport>(detectHardwareBenchmark(60));
	let importedJson = $state<string>('');

	const themes: Array<{ id: UITheme; label: string; desc: string; color: string }> = [
		{ id: 'cyber-dark', label: 'Cyber Dark', desc: 'Futuristic cyan & violet accents with deep zinc background', color: 'bg-cyan-500' },
		{ id: 'midnight', label: 'Midnight Blue', desc: 'Deep oceanic navy tone for calm streaming environment', color: 'bg-blue-500' },
		{ id: 'synthwave', label: 'Synthwave', desc: 'Vibrant sunset pink and neon magenta energy', color: 'bg-pink-500' },
		{ id: 'monochrome', label: 'Monochrome Minimal', desc: 'Clean, distraction-free neutral slate & silver', color: 'bg-zinc-400' }
	];

	onMount(() => {
		hardware = detectHardwareBenchmark(rigging.fps || 60);

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && rigging.isSettingsModalOpen) {
				rigging.isSettingsModalOpen = false;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	function handleExport() {
		const json = exportConfigJson({
			modelUrl: rigging.modelUrl,
			modelName: rigging.modelName,
			selectedModelId: rigging.selectedModelId,
			avatarEngine: rigging.avatarEngine,
			selected3DModelId: rigging.selected3DModelId,
			uiTheme: rigging.uiTheme,
			backgroundStyle: rigging.backgroundStyle,
			backgroundColor: rigging.backgroundColor,
			screenEffect: rigging.screenEffect,
			trackingSensitivity: rigging.trackingSensitivity,
			smoothingAmount: rigging.smoothingAmount,
			eyeBlinkLinked: rigging.eyeBlinkLinked,
			deadzoneThreshold: rigging.deadzoneThreshold,
			enableHandTracking: rigging.enableHandTracking,
			poseLoopMode: rigging.poseLoopMode,
			calibrationYaw: rigging.calibrationYaw,
			calibrationPitch: rigging.calibrationPitch,
			calibrationRoll: rigging.calibrationRoll
		});

		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `mirunova-config-backup-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
		rigging.showToast('✓ Konfigurasi berhasil diekspor!');
	}

	function handleImportFile(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			const content = ev.target?.result as string;
			const parsed = importConfigJson(content);
			if (parsed) {
				if (parsed.uiTheme) rigging.uiTheme = parsed.uiTheme as any;
				if (parsed.trackingSensitivity) rigging.trackingSensitivity = parsed.trackingSensitivity;
				if (parsed.smoothingAmount) rigging.smoothingAmount = parsed.smoothingAmount;
				if (parsed.deadzoneThreshold) rigging.deadzoneThreshold = parsed.deadzoneThreshold;
				if (parsed.backgroundStyle) rigging.backgroundStyle = parsed.backgroundStyle as any;
				if (parsed.backgroundColor) rigging.backgroundColor = parsed.backgroundColor;
				rigging.persist();
				rigging.showToast('✓ Konfigurasi berhasil dipulihkan!');
			} else {
				alert('File konfigurasi JSON tidak valid.');
			}
		};
		reader.readAsText(file);
	}

	function handleResetDefaults() {
		if (confirm('Reset semua preferensi ke pengaturan awal default?')) {
			clearPreferences();
			rigging.trackingSensitivity = 1.0;
			rigging.smoothingAmount = 0.35;
			rigging.deadzoneThreshold = 0.3;
			rigging.eyeBlinkLinked = false;
			rigging.enableHandTracking = true;
			rigging.uiTheme = 'cyber-dark';
			rigging.backgroundStyle = 'solid';
			rigging.backgroundColor = '#09090b';
			rigging.screenEffect = 'none';
			rigging.resetCalibration();
			rigging.persist();
			rigging.showToast('Pengaturan telah di-reset ke default.');
		}
	}
</script>

{#if rigging.isSettingsModalOpen}
	<!-- Modal Backdrop (Click Outside to Close) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) rigging.isSettingsModalOpen = false;
		}}
		class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
	>
		<div
			class="w-full max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
				<div class="flex items-center gap-2.5">
					<div class="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
						<Settings class="w-4 h-4" />
					</div>
					<div>
						<h2 class="text-sm font-semibold tracking-wide flex items-center gap-2">
							Pengaturan & Spesifikasi Sistem
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">PRO</span>
						</h2>
						<p class="text-xs text-zinc-400">
							Konfigurasi hardware, benchmark performa, tema UI, voice changer & penyimpanan
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isSettingsModalOpen = false)}
					class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Tabs Navigation -->
			<div class="px-5 pt-2.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center gap-2 overflow-x-auto">
				<button
					onclick={() => (activeTab = 'perf')}
					class="flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-medium transition-all {
						activeTab === 'perf'
							? 'border-cyan-500 text-cyan-300 font-semibold'
							: 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Cpu class="w-3.5 h-3.5" />
					<span>Hardware & Performa</span>
				</button>

				<button
					onclick={() => (activeTab = 'appearance')}
					class="flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-medium transition-all {
						activeTab === 'appearance'
							? 'border-pink-500 text-pink-300 font-semibold'
							: 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Palette class="w-3.5 h-3.5" />
					<span>Tema & Tampilan</span>
				</button>

				<button
					onclick={() => (activeTab = 'voice')}
					class="flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-medium transition-all {
						activeTab === 'voice'
							? 'border-emerald-500 text-emerald-300 font-semibold'
							: 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Mic class="w-3.5 h-3.5" />
					<span>Voice Changer</span>
				</button>

				<button
					onclick={() => (activeTab = 'storage')}
					class="flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-medium transition-all {
						activeTab === 'storage'
							? 'border-amber-500 text-amber-300 font-semibold'
							: 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Database class="w-3.5 h-3.5" />
					<span>Penyimpanan & Backup</span>
				</button>
			</div>

			<!-- Tab Contents -->
			<div class="p-5 overflow-y-auto space-y-5 text-xs">
				<!-- TAB 1: Hardware & Performa -->
				{#if activeTab === 'perf'}
					<!-- Benchmark Bar: Merah to Hijau -->
					<div class="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="font-semibold text-zinc-200 text-xs">Tingkatan Kelancaran Sistem:</span>
								<span
									class="px-2 py-0.5 rounded text-[11px] font-bold"
									style="color: {hardware.tierColor}; background: {hardware.tierColor}18; border: 1px solid {hardware.tierColor}40;"
								>
									{hardware.tierLabel}
								</span>
							</div>
							<span class="text-zinc-400 font-mono text-[11px]">{hardware.score} / 100 PTS</span>
						</div>

						<!-- Progress Bar Gradient (Red -> Yellow -> Green -> Emerald) -->
						<div class="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 relative">
							<div
								class="h-full rounded-full transition-all duration-500"
								style="width: {hardware.score}%; background: linear-gradient(90deg, #ef4444 0%, #eab308 35%, #22c55e 70%, #10b981 100%);"
							></div>
						</div>

						<div class="flex justify-between text-[10px] text-zinc-500 font-medium">
							<span class="text-rose-400">Tidak Lancar (&lt; 25 FPS)</span>
							<span class="text-amber-400">Cukup (30 FPS)</span>
							<span class="text-emerald-400">Lancar (60 FPS)</span>
							<span class="text-cyan-400 font-bold">Ultra 60+ FPS</span>
						</div>

						<!-- Hardware details -->
						<div class="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-[11px]">
							<div class="flex flex-col">
								<span class="text-zinc-500">GPU Renderer Terdeteksi:</span>
								<span class="font-mono text-zinc-200 truncate">{hardware.gpuRenderer}</span>
							</div>
							<div class="flex flex-col">
								<span class="text-zinc-500">CPU Thread Concurrency:</span>
								<span class="font-mono text-zinc-200">{hardware.cpuCores} Threads Aktif</span>
							</div>
						</div>

						<!-- RTX Acceleration Explanation -->
						<div class="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-start gap-2.5">
							<Sparkles class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
							<div class="space-y-1">
								<span class="font-semibold text-cyan-300">Apakah NVIDIA RTX Makin Smooth?</span>
								<p class="text-[11px] text-zinc-300 leading-relaxed">
									<strong>Ya, sangat signifikan!</strong> GPU NVIDIA RTX memiliki Tensor Cores & akselerasi WebGL FP16 paralel yang memproses pelacakan wajah & tangan Google MediaPipe secara real-time dengan latensi &lt; 10ms. VSync 60-144 FPS berjalan terkunci tanpa frame drop saat streaming di OBS.
								</p>
							</div>
						</div>
					</div>

					<!-- Tuners -->
					<div class="space-y-3">
						<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
							Pengaturan Sensitivitas & Tracking
						</h3>

						<div class="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
							<!-- Sensitivity -->
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span class="text-zinc-300">{i18n.t('sensitivity')}</span>
									<span class="font-mono text-cyan-400">{rigging.trackingSensitivity.toFixed(2)}x</span>
								</div>
								<input
									type="range"
									min="0.5"
									max="2.0"
									step="0.05"
									bind:value={rigging.trackingSensitivity}
									oninput={() => rigging.persist()}
									class="w-full accent-cyan-400 cursor-pointer"
								/>
							</div>

							<!-- Smoothing -->
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span class="text-zinc-300">{i18n.t('smoothing')}</span>
									<span class="font-mono text-cyan-400">{rigging.smoothingAmount.toFixed(2)}</span>
								</div>
								<input
									type="range"
									min="0.1"
									max="0.7"
									step="0.05"
									bind:value={rigging.smoothingAmount}
									oninput={() => rigging.persist()}
									class="w-full accent-cyan-400 cursor-pointer"
								/>
							</div>

							<!-- Deadzone -->
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span class="text-zinc-300">{i18n.t('deadzone')}</span>
									<span class="font-mono text-cyan-400">{rigging.deadzoneThreshold.toFixed(1)}°</span>
								</div>
								<input
									type="range"
									min="0"
									max="1.5"
									step="0.1"
									bind:value={rigging.deadzoneThreshold}
									oninput={() => rigging.persist()}
									class="w-full accent-cyan-400 cursor-pointer"
								/>
							</div>

							<!-- Toggles -->
							<div class="pt-2 border-t border-zinc-800 flex items-center justify-between">
								<span class="text-zinc-300">Sinkronkan Kedipan Kedua Mata</span>
								<input
									type="checkbox"
									bind:checked={rigging.eyeBlinkLinked}
									onchange={() => rigging.persist()}
									class="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
								/>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-zinc-300">Pelacakan Tangan & High-Five</span>
								<input
									type="checkbox"
									bind:checked={rigging.enableHandTracking}
									onchange={() => rigging.persist()}
									class="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
								/>
							</div>
						</div>
					</div>

				<!-- TAB 2: Tema & Tampilan -->
				{:else if activeTab === 'appearance'}
					<div class="space-y-4">
						<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
							Pilihan UI Theme Toggler
						</h3>
						<div class="grid grid-cols-2 gap-2.5">
							{#each themes as t}
								<button
									onclick={() => {
										rigging.uiTheme = t.id;
										rigging.persist();
									}}
									class="p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 {
										rigging.uiTheme === t.id
											? 'bg-zinc-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30 text-white'
											: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
									}"
								>
									<div class="flex items-center justify-between w-full">
										<div class="flex items-center gap-2">
											<span class="w-3 h-3 rounded-full {t.color}"></span>
											<span class="font-semibold text-xs text-zinc-100">{t.label}</span>
										</div>
										{#if rigging.uiTheme === t.id}
											<Check class="w-3.5 h-3.5 text-cyan-400" />
										{/if}
									</div>
									<span class="text-[10px] text-zinc-500 leading-snug">{t.desc}</span>
								</button>
							{/each}
						</div>
					</div>

				<!-- TAB 3: Voice Changer -->
				{:else if activeTab === 'voice'}
					<div class="space-y-4">
						<div class="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5">
							<div class="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
								<Mic class="w-4 h-4" />
								<span>Solusi & Rekomendasi Voice Changer (100% Gratis)</span>
							</div>
							<p class="text-zinc-300 leading-relaxed text-xs">
								Untuk streaming VTuber dengan suara anime atau karakter wanita/pria, ada 2 metode terbaik yang 100% gratis dan berjalan di komputer Anda:
							</p>

							<div class="space-y-2 pt-2">
								<div class="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1">
									<div class="flex items-center justify-between">
										<span class="font-bold text-zinc-100">1. W-Okada Realtime AI Voice Changer (Rekomendasi Utama)</span>
										<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">AI RVC</span>
									</div>
									<p class="text-zinc-400 text-[11px] leading-relaxed">
										Aplikasi open-source (GitHub) gratis yang menggunakan model AI RVC (Retrieval-based Voice Conversion). Sangat optimal di GPU <strong>NVIDIA RTX</strong> dengan latensi di bawah 150ms. Suara terdengar sangat natural seperti pengisi suara asli.
									</p>
									<p class="text-zinc-500 text-[10px]">
										Cukup pasang <em>VB-Audio Virtual Cable</em> (gratis) untuk menyambungkan mikrofon hasil AI langsung ke OBS Studio dan Discord.
									</p>
								</div>

								<div class="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1">
									<div class="flex items-center justify-between">
										<span class="font-bold text-zinc-100">2. Browser Web Audio Formant & Pitch Shifter</span>
										<span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Web Audio</span>
									</div>
									<p class="text-zinc-400 text-[11px] leading-relaxed">
										Modulasi pitch dan formant vokal langsung di browser menggunakan Web Audio API + SoundTouch Wasm. Bebas instalasi software tambahan, latensi 0ms.
									</p>
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 4: Storage & Data Management -->
				{:else if activeTab === 'storage'}
					<div class="space-y-4">
						<div class="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
							<div class="flex items-center gap-2 font-semibold text-zinc-200">
								<Database class="w-4 h-4 text-amber-400" />
								<span>Penyimpanan Otomatis (Auto-Save LocalStorage)</span>
							</div>
							<p class="text-zinc-400 text-xs leading-relaxed">
								Semua konfigurasi model yang dipilih, warna latar, sensitivitas, kalibrasi kepala, hingga posisi rigging otomatis tersimpan di peramban (localStorage). Saat halaman di-reload, semua konfigurasi tetap utuh tanpa reset.
							</p>
						</div>

						<div class="grid grid-cols-2 gap-2.5">
							<!-- Export -->
							<button
								onclick={handleExport}
								class="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-200 font-medium transition-all active:scale-95"
							>
								<Download class="w-4 h-4 text-cyan-400" />
								<span>Export Konfigurasi JSON</span>
							</button>

							<!-- Import -->
							<label
								class="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-200 font-medium transition-all active:scale-95 cursor-pointer"
							>
								<Upload class="w-4 h-4 text-pink-400" />
								<span>Import Konfigurasi JSON</span>
								<input type="file" accept=".json" onchange={handleImportFile} class="hidden" />
							</label>
						</div>

						<!-- Reset Button -->
						<div class="pt-2">
							<button
								onclick={handleResetDefaults}
								class="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl transition-colors font-medium active:scale-95 text-xs"
							>
								<RotateCcw class="w-3.5 h-3.5" />
								<span>Reset Semua Konfigurasi ke Pengaturan Awal</span>
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="p-3.5 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-400">
				<span class="text-[11px] font-mono">MiruNova Live v0.6.0 • Free & Client-Side</span>
				<button
					onclick={() => (rigging.isSettingsModalOpen = false)}
					class="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors"
				>
					Selesai
				</button>
			</div>
		</div>
	</div>
{/if}
