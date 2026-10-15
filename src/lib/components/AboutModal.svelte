<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { playSfx } from '#lib/core/sfx';
	import {
		X,
		Sparkles,
		ExternalLink,
		Heart,
		ShieldCheck,
		Download,
		Cpu,
		Layers,
		Terminal,
		CheckCircle2,
		FileText,
		Star,
		Radio,
		Laptop,
		Code2,
		User
	} from 'lucide-svelte';

	let deferredInstallPrompt = $state<any>(null);
	let isStandalone = $state<boolean>(false);
	let installOutcome = $state<'idle' | 'installed' | 'dismissed'>('idle');

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	onMount(() => {
		if (typeof window === 'undefined') return;

		isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true;

		const handleBeforeInstall = (e: Event) => {
			e.preventDefault();
			deferredInstallPrompt = e;
		};

		const handleAppInstalled = () => {
			deferredInstallPrompt = null;
			isStandalone = true;
			installOutcome = 'installed';
			rigging.showToast('✓ MiruNova Live desktop app installed!');
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && rigging.isAboutModalOpen) {
				closeModal();
			}
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstall);
		window.addEventListener('appinstalled', handleAppInstalled);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
			window.removeEventListener('appinstalled', handleAppInstalled);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function closeModal() {
		playSfx('modal');
		rigging.toggleAboutModal(false);
	}

	function openTos() {
		playSfx('click');
		rigging.toggleAboutModal(false);
		rigging.toggleTosModal(true);
	}

	async function promptInstall() {
		playSfx('click');
		if (deferredInstallPrompt) {
			deferredInstallPrompt.prompt();
			const choice = await deferredInstallPrompt.userChoice;
			if (choice.outcome === 'accepted') {
				installOutcome = 'installed';
				deferredInstallPrompt = null;
			} else {
				installOutcome = 'dismissed';
			}
		} else {
			rigging.showToast('Buka menu browser (...) lalu pilih "Install MiruNova Live"');
		}
	}

	const techStack = [
		{ name: 'Svelte 5', role: 'Reactive Runes Engine & Zero-Overhead Virtual DOM', badge: 'Runes Engine' },
		{ name: 'MediaPipe', role: '478-pt 3D Face Landmark & Hand Tracking via WASM', badge: 'Local Neural Net' },
		{ name: 'Pixi.js v7', role: 'Hardware-Accelerated Live2D Cubism Core Renderer', badge: 'WebGL 2.0' },
		{ name: 'Three.js', role: 'High-Performance 3D Cat Stage with Discrete GPU', badge: 'Discrete GPU' },
		{ name: 'Web Audio DSP', role: 'Zero-Latency Voice Changer & Procedural Synth SFX', badge: 'Web Audio API' },
		{ name: 'Bun Runtime', role: 'Native Fast Testing, Scaffolding & Zero-Lag Build', badge: 'v1.1+ Native' }
	];
</script>

{#if rigging.isAboutModalOpen}
	<!-- Backdrop with smooth blur -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={closeModal}
		class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
	>
		<!-- Studio Modal Dialog Card -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			class="w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-200 border {
				isLightTheme
					? 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
					: 'bg-zinc-950 text-zinc-100 border-zinc-800 shadow-2xl'
			}"
		>
			<!-- Hero Header -->
			<div
				class="relative px-6 sm:px-8 py-6 border-b flex items-center justify-between shrink-0 overflow-hidden {
					isLightTheme
						? 'bg-gradient-to-r from-sky-50 via-white to-pink-50 border-zinc-200'
						: 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-zinc-800/80'
				}"
			>
				<div class="relative flex items-center gap-4">
					<div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-extrabold text-lg border border-cyan-300/40">
						<Sparkles class="w-6 h-6 animate-pulse" />
					</div>
					<div>
						<div class="flex items-center gap-2.5">
							<h2 class="text-lg sm:text-xl font-extrabold tracking-wide {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
								MiruNova <span class="text-cyan-500 font-black">Live</span>
							</h2>
							<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold {
								isLightTheme ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
							}">
								v0.20.1-beta (Beta)
							</span>
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono {
								isLightTheme ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
							}">
								FOSS
							</span>
						</div>
						<p class="text-xs {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'} mt-0.5">
							Studio VTuber Web Berkinerja Tinggi, Zero Latency, 100% Client-Side Privacy
						</p>
					</div>
				</div>

				<button
					onclick={closeModal}
					class="p-2.5 rounded-xl transition-colors cursor-pointer {
						isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
					}"
					aria-label="Tutup"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Modal Body (Scrollable) -->
			<div class="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs custom-scrollbar">
				<!-- Lead Architect & Creator Spotlight Card (Rifky / @RifkyA911) -->
				<div
					class="p-5 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all {
						isLightTheme
							? 'bg-gradient-to-br from-cyan-50/70 via-white to-pink-50/50 border-cyan-200 text-zinc-800'
							: 'bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 border-cyan-500/40 text-zinc-200'
					}"
				>
					<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
						<div class="flex items-center gap-4">
							<div class="relative shrink-0">
								<img
									src="https://avatars.githubusercontent.com/u/104928229?v=4"
									alt="Rifky (@RifkyA911)"
									class="w-16 h-16 rounded-2xl border-2 border-cyan-400 object-cover shadow-lg shadow-cyan-500/25"
									onerror={(e) => {
										const target = e.currentTarget as HTMLImageElement;
										target.style.display = 'none';
									}}
								/>
								<span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center text-[9px] text-white font-extrabold shadow-sm">
									✓
								</span>
							</div>

							<div>
								<div class="flex items-center gap-2">
									<h3 class="text-base font-extrabold tracking-wide {isLightTheme ? 'text-zinc-900' : 'text-white'}">
										Rifky
									</h3>
									<span class="text-xs text-cyan-500 font-mono font-bold">@RifkyA911</span>
									<span class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold {
										isLightTheme ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
									}">
										Lead Creator
									</span>
								</div>
								<p class="text-xs {isLightTheme ? 'text-zinc-600' : 'text-zinc-300'} font-medium mt-1">
									Lead Architect, Developer & Creator of MiruNova Live
								</p>
								<div class="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
									<span class="flex items-center gap-1 text-emerald-500 font-semibold">
										<CheckCircle2 class="w-3.5 h-3.5" /> Autonomous Systems & VTuber Live2D Engineering
									</span>
								</div>
							</div>
						</div>

						<!-- GitHub Actions -->
						<div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
							<a
								href="https://github.com/RifkyA911/mirunova-live"
								target="_blank"
								rel="noopener noreferrer"
								onclick={() => playSfx('click')}
								class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-2xl text-xs transition-all hover:scale-105 active:scale-95 shadow-md shadow-cyan-500/25 cursor-pointer"
							>
								<Star class="w-4 h-4 fill-current" />
								<span>Star Repository</span>
								<ExternalLink class="w-3.5 h-3.5 opacity-80" />
							</a>

							<a
								href="https://github.com/RifkyA911"
								target="_blank"
								rel="noopener noreferrer"
								onclick={() => playSfx('click')}
								class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 border cursor-pointer {
									isLightTheme
										? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
										: 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
								}"
							>
								<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
									<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
								</svg>
								<span>GitHub @RifkyA911</span>
							</a>
						</div>
					</div>
				</div>

				<!-- Progressive Web App (PWA) & Offline Desktop Status -->
				<div
					class="p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 {
						isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
					}"
				>
					<div class="flex items-center gap-3.5">
						<div class="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
							<Laptop class="w-5 h-5" />
						</div>
						<div>
							<div class="flex items-center gap-2">
								<h4 class="font-extrabold text-sm {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
									Aplikasi Desktop Standalone (PWA)
								</h4>
								{#if isStandalone}
									<span class="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
										Aplikasi Aktif (Standalone)
									</span>
								{:else}
									<span class="text-[9px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
										Web Browser Mode
									</span>
								{/if}
							</div>
							<p class="text-xs {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'} mt-0.5">
								Mendukung instalasi desktop instan ke Windows/Mac, shortcut terdaftar, dan offline service worker caching
							</p>
						</div>
					</div>

					<button
						type="button"
						onclick={promptInstall}
						disabled={isStandalone}
						class="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 {
							isStandalone
								? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
								: 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
						}"
					>
						<Download class="w-4 h-4" />
						<span>{isStandalone ? 'Sudah Terpasang' : 'Pasang Aplikasi Desktop'}</span>
					</button>
				</div>

				<!-- Tech Stack Architecture Grid -->
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<Code2 class="w-4 h-4 text-cyan-400" />
						<span class="text-xs font-bold uppercase tracking-wider {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
							Arsitektur & Tech Stack Inti
						</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each techStack as tech}
							<div
								class="p-3.5 rounded-2xl border flex flex-col justify-between gap-1.5 transition-all {
									isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/80'
								}"
							>
								<div class="flex items-center justify-between">
									<span class="font-extrabold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										{tech.name}
									</span>
									<span class="text-[9px] px-2 py-0.5 rounded font-mono font-semibold {
										isLightTheme ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'
									}">
										{tech.badge}
									</span>
								</div>
								<p class="text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'} leading-tight">
									{tech.role}
								</p>
							</div>
						{/each}
					</div>
				</div>

				<!-- Privacy Charter & Terms Quick Banner -->
				<div
					class="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 {
						isLightTheme ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
					}"
				>
					<div class="flex items-center gap-3">
						<ShieldCheck class="w-5 h-5 text-emerald-500 shrink-0" />
						<div>
							<div class="font-extrabold text-xs {isLightTheme ? 'text-emerald-900' : 'text-emerald-300'}">
								Privasi Klien 100% Zero-Telemetry & Bebas Royalti
							</div>
							<p class="text-[11px] {isLightTheme ? 'text-emerald-700' : 'text-zinc-400'}">
								Semua pemrosesan kamera & mikrofon berjalan sepenuhnya secara lokal di browser Anda
							</p>
						</div>
					</div>

					<button
						type="button"
						onclick={openTos}
						class="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer {
							isLightTheme
								? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
								: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
						}"
					>
						<FileText class="w-3.5 h-3.5" />
						<span>Buka Piagam Privasi & ToS</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
