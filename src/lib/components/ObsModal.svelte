<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import {
		Radio,
		X,
		Copy,
		Check,
		Tv,
		ExternalLink,
		ShieldCheck,
		Sparkles,
		Monitor,
		Smartphone,
		Sliders,
		SlidersHorizontal,
		Maximize2,
		Layers,
		CheckCircle2,
		Code2,
		Activity,
		Camera,
		Volume2,
		RotateCcw
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let copiedUrl = $state<boolean>(false);
	let copiedCss = $state<boolean>(false);

	// Streaming profiles
	type StreamProfile = '1080p' | '1440p' | '4k' | 'vertical' | '720p';
	let selectedProfile = $state<StreamProfile>('1080p');
	let streamWidth = $state<number>(1920);
	let streamHeight = $state<number>(1080);
	let streamFps = $state<number>(60);

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	const PROFILES: Record<StreamProfile, { name: string; desc: string; w: number; h: number; icon: any; badge: string }> = {
		'1080p': {
			name: '1080p Full HD',
			desc: 'Twitch, YouTube & Kick Standard (16:9)',
			w: 1920,
			h: 1080,
			icon: Monitor,
			badge: 'REKOMENDASI'
		},
		'1440p': {
			name: '1440p QHD 2K',
			desc: 'YouTube Ultra HD Crispy Sharpness',
			w: 2560,
			h: 1440,
			icon: Monitor,
			badge: 'HIGH-RES'
		},
		'4k': {
			name: '4K UHD Master',
			desc: 'Master Broadcast Quality (High-Bitrate)',
			w: 3840,
			h: 2160,
			icon: Monitor,
			badge: 'MASTER'
		},
		'vertical': {
			name: 'Vertical 9:16',
			desc: 'TikTok Live, Shorts & IG Reels VTuber',
			w: 1080,
			h: 1920,
			icon: Smartphone,
			badge: 'TIKTOK'
		},
		'720p': {
			name: '720p HD',
			desc: 'Low Latency & Ringan untuk PC Kentang',
			w: 1280,
			h: 720,
			icon: Monitor,
			badge: 'HEMAT'
		}
	};

	function selectProfile(p: StreamProfile) {
		playSfx('click');
		selectedProfile = p;
		streamWidth = PROFILES[p].w;
		streamHeight = PROFILES[p].h;
	}

	function getObsUrl(): string {
		if (typeof window === 'undefined') return 'http://localhost:5173/?obs=1';
		const origin = window.location.origin;
		return `${origin}/?obs=1&bg=${rigging.obsBgType}&w=${streamWidth}&h=${streamHeight}&fps=${streamFps}`;
	}

	const customCssSnippet = `body {
  background-color: rgba(0, 0, 0, 0);
  margin: 0px auto;
  overflow: hidden;
}`;

	async function copyUrl() {
		playSfx('click');
		const url = getObsUrl();
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			const input = document.createElement('input');
			input.value = url;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
		}
		copiedUrl = true;
		rigging.showToast('✓ URL OBS Browser Source berhasil disalin!');
		setTimeout(() => (copiedUrl = false), 2500);
	}

	async function copyCss() {
		playSfx('click');
		try {
			await navigator.clipboard.writeText(customCssSnippet);
		} catch {
			const input = document.createElement('textarea');
			input.value = customCssSnippet;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
		}
		copiedCss = true;
		rigging.showToast('✓ Custom CSS OBS berhasil disalin!');
		setTimeout(() => (copiedCss = false), 2500);
	}

	function handleEnterObsMode() {
		playSfx('success');
		rigging.toggleObsMode(true);
	}
</script>

{#if rigging.isObsModalOpen}
	<!-- Backdrop Modal -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) rigging.isObsModalOpen = false;
		}}
		class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
	>
		<!-- Broadcast Command Center Window -->
		<div
			class="w-full max-w-5xl xl:max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border transition-colors duration-200 {
				isLightTheme
					? 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
					: 'bg-zinc-950/98 text-zinc-100 border-zinc-800 shadow-2xl shadow-emerald-950/20'
			}"
		>
			<!-- Broadcast Header -->
			<div class="px-6 py-4 border-b flex items-center justify-between shrink-0 {
				isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
			}">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-sm shrink-0">
						<Radio class="w-5 h-5 animate-pulse" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="text-sm sm:text-base font-bold tracking-wide {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
								OBS Studio & Broadcast Command Center
							</h2>
							<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30">
								BROADCAST ENGINE
							</span>
						</div>
						<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5">
							Integrasi native OBS Browser Source, chroma keying, dan profil resolusi streaming profesional
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<button
						onclick={() => (rigging.isObsModalOpen = false)}
						class="p-2 rounded-xl transition-colors cursor-pointer {
							isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
						}"
						aria-label="Close"
					>
						<X class="w-5 h-5" />
					</button>
				</div>
			</div>

			<!-- Live Studio Diagnostics Bar -->
			<div class="px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-[11px] {
				isLightTheme ? 'bg-zinc-100/70 border-zinc-200 text-zinc-600' : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400'
			}">
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full {rigging.isCameraActive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-zinc-600'}"></span>
						<span>Webcam:</span>
						<strong class="font-mono {rigging.isCameraActive ? 'text-emerald-400' : 'text-zinc-500'}">
							{rigging.activeCameraLabel || (rigging.isCameraActive ? 'Webcam Aktif' : 'Standby')}
						</strong>
					</div>

					<div class="flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full {rigging.isMicActive ? 'bg-cyan-400' : 'bg-zinc-600'}"></span>
						<span>Audio DSP:</span>
						<strong class="font-mono {rigging.isMicActive ? 'text-cyan-400' : 'text-zinc-500'}">
							{rigging.isMicActive ? 'Mic Active' : 'Bypass'}
						</strong>
					</div>

					<div class="flex items-center gap-1.5">
						<span>Avatar:</span>
						<strong class="text-zinc-200">{rigging.modelName}</strong>
					</div>
				</div>

				<div class="flex items-center gap-3 font-mono text-[10px]">
					<span class="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
						Target: {streamWidth}x{streamHeight} @ {streamFps}fps
					</span>
				</div>
			</div>

			<!-- Body: 2-Column Broadcast Grid -->
			<div class="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs flex-1 custom-scrollbar">
				<!-- LEFT COLUMN (7 Cols): Resolution Profiles & Transparency Keying -->
				<div class="lg:col-span-7 space-y-5">
					<!-- 1. Resolution Profile Presets -->
					<div class="space-y-2.5">
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
								<Monitor class="w-3.5 h-3.5 text-emerald-400" />
								Profil Resolusi & Framerate Canvas
							</span>
							<span class="text-[10px] text-zinc-500">Pilih format siaran Anda</span>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{#each Object.entries(PROFILES) as [key, prof]}
								{@const isSelected = selectedProfile === key}
								{@const ProfIcon = prof.icon}
								<button
									type="button"
									onclick={() => selectProfile(key as StreamProfile)}
									class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 {
										isSelected
											? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
											: isLightTheme
												? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-700'
												: 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
									}"
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<ProfIcon class="w-4 h-4 {isSelected ? 'text-emerald-400' : 'text-zinc-500'}" />
											<span class="font-bold text-xs">{prof.name}</span>
										</div>
										<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold {
											isSelected
												? 'bg-emerald-500 text-zinc-950'
												: 'bg-zinc-800 text-zinc-400'
										}">
											{prof.badge}
										</span>
									</div>
									<div class="text-[10px] text-zinc-400 leading-snug">
										{prof.desc}
									</div>
									<div class="font-mono text-[9px] text-zinc-500 pt-1 border-t border-zinc-800/40">
										{prof.w} × {prof.h} px
									</div>
								</button>
							{/each}
						</div>

						<!-- Custom Dimension & Framerate Fine Tuning -->
						<div class="p-3 rounded-xl border bg-zinc-950/40 border-zinc-800/80 flex items-center justify-between gap-3 text-[11px]">
							<span class="text-zinc-400">Custom FPS:</span>
							<div class="flex items-center gap-1.5">
								{#each [30, 60, 120] as fps}
									<button
										type="button"
										onclick={() => (streamFps = fps)}
										class="px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer {
											streamFps === fps
												? 'bg-emerald-500 text-zinc-950 shadow-xs'
												: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
										}"
									>
										{fps} FPS
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- 2. Background Keying & Transparency Pipeline -->
					<div class="space-y-2.5">
						<span class="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 {isLightTheme ? 'text-zinc-700' : 'text-zinc-300'}">
							<Layers class="w-3.5 h-3.5 text-cyan-400" />
							Pipeline Transparansi Panggung
						</span>

						<div class="grid grid-cols-2 gap-2.5">
							<!-- Alpha Transparent Button -->
							<button
								type="button"
								onclick={() => (rigging.obsBgType = 'transparent')}
								class="p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 {
									rigging.obsBgType === 'transparent'
										? 'bg-cyan-500/15 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/40'
										: isLightTheme
											? 'bg-zinc-50 border-zinc-200 text-zinc-600'
											: 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
								}"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<div class="w-6 h-6 rounded-lg bg-[repeating-conic-gradient(#3f3f46_0%_25%,#18181b_0%_50%)] bg-[size:6px_6px] border border-zinc-700 shrink-0"></div>
										<span class="font-bold text-xs">Alpha Transparan</span>
									</div>
									{#if rigging.obsBgType === 'transparent'}
										<CheckCircle2 class="w-4 h-4 text-cyan-400" />
									{/if}
								</div>
								<p class="text-[10px] text-zinc-400 leading-relaxed">
									Native Alpha Channel. Zero halo hijau, transparan 100% sempurna langsung di OBS Browser Source.
								</p>
								<span class="text-[9px] font-mono text-cyan-400">
									Direct OBS Alpha (Paling Bersih)
								</span>
							</button>

							<!-- Chroma Green Button -->
							<button
								type="button"
								onclick={() => (rigging.obsBgType = 'chroma')}
								class="p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 {
									rigging.obsBgType === 'chroma'
										? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
										: isLightTheme
											? 'bg-zinc-50 border-zinc-200 text-zinc-600'
											: 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
								}"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<div class="w-6 h-6 rounded-lg bg-[#00FF00] border border-emerald-400 shadow-sm shrink-0"></div>
										<span class="font-bold text-xs">Chroma Green #00FF00</span>
									</div>
									{#if rigging.obsBgType === 'chroma'}
										<CheckCircle2 class="w-4 h-4 text-emerald-400" />
									{/if}
								</div>
								<p class="text-[10px] text-zinc-400 leading-relaxed">
									Green screen standar untuk Window Capture atau Game Capture. Gunakan filter Chroma Key di OBS.
								</p>
								<span class="text-[9px] font-mono text-emerald-400">
									Filter: Chroma Key (Similarity: 400)
								</span>
							</button>
						</div>
					</div>
				</div>

				<!-- RIGHT COLUMN (5 Cols): Direct URL Generator, Custom CSS & Setup Steps -->
				<div class="lg:col-span-5 space-y-4">
					<!-- 1. Interactive Browser Source URL Box -->
					<div class="p-4 rounded-2xl border bg-zinc-900/70 border-zinc-800 space-y-2.5 shadow-sm">
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
								<Radio class="w-3.5 h-3.5 text-emerald-400" />
								URL Browser Source OBS
							</span>
							<a
								href={getObsUrl()}
								target="_blank"
								rel="noopener noreferrer"
								class="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
								title="Buka langsung di tab baru"
							>
								<span>Buka di Tab</span>
								<ExternalLink class="w-3 h-3" />
							</a>
						</div>

						<div class="flex items-center gap-2 p-1.5 rounded-xl border bg-zinc-950 border-zinc-800">
							<input
								type="text"
								readonly
								value={getObsUrl()}
								class="flex-1 bg-transparent px-2 text-[11px] font-mono text-zinc-300 focus:outline-none select-all truncate"
							/>
							<button
								type="button"
								onclick={copyUrl}
								class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 {
									copiedUrl
										? 'bg-emerald-500 text-zinc-950'
										: 'bg-emerald-600 hover:bg-emerald-500 text-white'
								}"
							>
								{#if copiedUrl}
									<Check class="w-3.5 h-3.5" />
									<span>Tersalin!</span>
								{:else}
									<Copy class="w-3.5 h-3.5" />
									<span>Salin URL</span>
								{/if}
							</button>
						</div>
					</div>

					<!-- 2. Recommended Custom CSS Snippet Box -->
					<div class="p-4 rounded-2xl border bg-zinc-900/70 border-zinc-800 space-y-2 shadow-sm">
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
								<Code2 class="w-3.5 h-3.5 text-cyan-400" />
								OBS Custom CSS (Zero Margins)
							</span>
							<button
								type="button"
								onclick={copyCss}
								class="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
							>
								{#if copiedCss}
									<Check class="w-3 h-3" />
									<span>CSS Tersalin!</span>
								{:else}
									<Copy class="w-3 h-3" />
									<span>Salin CSS</span>
								{/if}
							</button>
						</div>

						<pre class="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[10px] text-zinc-300 leading-relaxed overflow-x-auto select-all">{customCssSnippet}</pre>
					</div>

					<!-- 3. Illustrated OBS Studio Step-by-Step Flow Cards -->
					<div class="p-4 rounded-2xl border bg-zinc-900/50 border-zinc-800/80 space-y-2.5">
						<h3 class="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
							<ShieldCheck class="w-4 h-4 text-emerald-400" />
							Panduan 4 Langkah Pasang di OBS Studio:
						</h3>

						<div class="space-y-2 text-[11px] leading-relaxed text-zinc-300">
							<div class="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
								<span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
								<span>Di OBS Studio > Panel <strong>Sources (Sumber)</strong> > Klik tombol <strong>+</strong> > Pilih <strong>Browser</strong>.</span>
							</div>

							<div class="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
								<span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
								<span>Beri nama "MiruNova VTuber", lalu <strong>Paste URL</strong> yang Anda salin di atas ke kolom URL.</span>
							</div>

							<div class="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
								<span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
								<span>Atur Width: <strong>{streamWidth}</strong>, Height: <strong>{streamHeight}</strong>, FPS: <strong>{streamFps}</strong>.</span>
							</div>

							<div class="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
								<span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
								<span>Centang <em>"Shutdown source when not visible"</em> dan <em>"Refresh browser when scene becomes active"</em>.</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Footer Action Command Bar -->
			<div class="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 {
				isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/80 border-zinc-800'
			}">
				<div class="flex items-center gap-2 text-[11px] text-zinc-400">
					<span>Tips: Tekan tombol</span>
					<kbd class="px-1.5 py-0.5 rounded border font-mono font-bold {isLightTheme ? 'bg-white border-zinc-300 text-zinc-800' : 'bg-zinc-800 text-zinc-200 border-zinc-700'}">
						ESC
					</kbd>
					<span>untuk keluar dari Mode Full OBS kapan saja.</span>
				</div>

				<div class="flex items-center gap-2 w-full sm:w-auto">
					<button
						type="button"
						onclick={() => (rigging.isObsModalOpen = false)}
						class="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
					>
						Tutup
					</button>

					<button
						type="button"
						onclick={handleEnterObsMode}
						class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
					>
						<Tv class="w-4 h-4" />
						<span>Masuk Full OBS Mode Sekarang</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
