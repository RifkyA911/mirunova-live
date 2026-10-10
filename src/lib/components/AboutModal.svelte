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
		Radio
	} from 'lucide-svelte';

	let deferredInstallPrompt = $state<any>(null);
	let isStandalone = $state<boolean>(false);
	let installOutcome = $state<'idle' | 'installed' | 'dismissed'>('idle');

	onMount(() => {
		if (typeof window === 'undefined') return;

		isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

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
			// Show instructions for manual install
			rigging.showToast('Buka menu browser (...) lalu pilih "Install MiruNova Live"');
		}
	}

	const techStack = [
		{ name: 'Svelte 5', role: 'Next-gen reactive UI engine', badge: 'Runes Engine' },
		{ name: 'MediaPipe', role: '478-pt 3D face & hand tracking', badge: 'Local WASM' },
		{ name: 'Pixi.js v7', role: 'Live2D Cubism Core rendering', badge: 'WebGL 2.0' },
		{ name: 'Three.js', role: '3D VRM & GLTF avatar stage', badge: 'Discrete GPU' },
		{ name: 'Web Audio DSP', role: 'Real-time voice changer filters', badge: 'Zero Latency' },
		{ name: 'Bun Runtime', role: 'Ultra-fast testing & bundler', badge: 'v1.1+' }
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
			onclick={(e) => e.stopPropagation()}
			class="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-200"
		>
			<!-- Hero Header with Cyber Gradients -->
			<div class="relative px-6 sm:px-8 py-6 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden">
				<div class="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
				<div class="absolute -bottom-12 -left-12 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

				<div class="relative flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-extrabold text-lg border border-cyan-300/40">
							<Sparkles class="w-6 h-6 animate-pulse" />
						</div>
						<div>
							<div class="flex items-center gap-2.5">
								<h2 class="text-lg sm:text-xl font-extrabold tracking-wide text-zinc-100">
									MiruNova <span class="text-cyan-400">Live</span>
								</h2>
								<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-mono font-semibold">
									v2.4.0 Studio
								</span>
								<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-mono">
									FOSS
								</span>
							</div>
							<p class="text-xs text-zinc-400 mt-0.5">
								Next-Gen Zero-Latency Web VTuber Studio & Live Rigging Engine
							</p>
						</div>
					</div>

					<button
						onclick={closeModal}
						class="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer"
						aria-label="Tutup"
					>
						<X class="w-5 h-5" />
					</button>
				</div>
			</div>

			<!-- Modal Body (Scrollable) -->
			<div class="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-zinc-300">
				<!-- Lead Architect & Creator Spotlight Card -->
				<div class="p-5 rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 border border-cyan-500/30 shadow-xl relative overflow-hidden group">
					<div class="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-colors"></div>

					<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div class="flex items-center gap-3.5">
							<div class="relative">
								<img
									src="https://avatars.githubusercontent.com/u/104928229?v=4"
									alt="Rifky (@RifkyA911)"
									class="w-14 h-14 rounded-2xl border-2 border-cyan-400/80 object-cover shadow-md shadow-cyan-500/20"
									onerror={(e) => {
										// Fallback if offline
										const target = e.currentTarget as HTMLImageElement;
										target.style.display = 'none';
									}}
								/>
								<span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center text-[8px] text-white font-bold">✓</span>
							</div>

							<div>
								<div class="flex items-center gap-2">
									<h3 class="text-sm font-bold text-white tracking-wide">Rifky</h3>
									<span class="text-xs text-cyan-400 font-mono font-semibold">@RifkyA911</span>
								</div>
								<p class="text-[11px] text-zinc-400 mt-0.5">
									Lead Architect, Developer & Creator of MiruNova Live
								</p>
								<div class="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-400">
									<span class="flex items-center gap-1 text-emerald-400">
										<CheckCircle2 class="w-3 h-3" /> Autonomous Systems & VTuber Tech
									</span>
								</div>
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
							<a
								href="https://github.com/RifkyA911/mirunova-live"
								target="_blank"
								rel="noopener noreferrer"
								onclick={() => playSfx('click')}
								class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
							>
								<Star class="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
								<span>Star on GitHub</span>
								<ExternalLink class="w-3 h-3 text-cyan-400/80" />
							</a>

							<a
								href="https://github.com/RifkyA911"
								target="_blank"
								rel="noopener noreferrer"
								onclick={() => playSfx('click')}
								class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
							>
								<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
									<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
								</svg>
								<span>GitHub Profile</span>
							</a>
						</div>
					</div>
				</div>

				<!-- Progressive Web App (PWA) & Offline Desktop Status -->
				<div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div class="flex items-center gap-3">
						<div class="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 shrink-0">
							<Download class="w-5 h-5" />
						</div>
						<div>
							<h4 class="text-xs font-bold text-zinc-100 flex items-center gap-2">
								{i18n.t('pwa_desktop_app')}
								{#if isStandalone}
									<span class="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
										{i18n.t('pwa_installed')}
									</span>
								{/if}
							</h4>
							<p class="text-[11px] text-zinc-400 mt-0.5">
								{i18n.t('pwa_desc')}
							</p>
						</div>
					</div>

					<button
						onclick={promptInstall}
						class="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
					>
						<Download class="w-3.5 h-3.5 text-cyan-400" />
						<span>{isStandalone ? i18n.t('pwa_installed') : i18n.t('pwa_install_btn')}</span>
					</button>
				</div>

				<!-- Tech Stack Grid -->
				<div class="space-y-2.5">
					<h4 class="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
						<Cpu class="w-4 h-4 text-cyan-400" />
						<span>Studio Architecture & Technologies</span>
					</h4>
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
						{#each techStack as tech}
							<div class="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition-colors">
								<div class="flex items-center justify-between">
									<span class="font-bold text-zinc-200">{tech.name}</span>
									<span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
										{tech.badge}
									</span>
								</div>
								<p class="text-[11px] text-zinc-400 mt-1">{tech.role}</p>
							</div>
						{/each}
					</div>
				</div>

				<!-- Privacy & Security Guarantee Card -->
				<div class="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 flex items-start gap-3">
					<ShieldCheck class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
					<div class="space-y-1">
						<h4 class="text-xs font-bold text-emerald-300">
							{i18n.t('about_privacy_title')}
						</h4>
						<p class="text-[11px] text-zinc-400 leading-relaxed">
							{i18n.t('about_privacy_desc')}
						</p>
					</div>
				</div>
			</div>

			<!-- Footer with Direct ToS Button and Close -->
			<div class="px-6 sm:px-8 py-4 border-t border-zinc-800/80 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
				<div class="flex items-center gap-3">
					<button
						onclick={openTos}
						class="flex items-center gap-1.5 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
					>
						<FileText class="w-3.5 h-3.5" />
						<span class="underline underline-offset-2">{i18n.t('tos_modal_title')}</span>
					</button>
					<span class="text-zinc-600">•</span>
					<span class="text-zinc-500 text-[11px]">MIT / Apache 2.0 Open Source</span>
				</div>

				<div class="flex items-center gap-2">
					<button
						onclick={closeModal}
						class="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
					>
						{i18n.t('done')}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
