<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { playSfx } from '#lib/core/sfx';
	import {
		X,
		ShieldCheck,
		Tv,
		FileText,
		CheckCircle2,
		AlertCircle,
		Scale,
		Lock,
		Sparkles,
		Heart,
		ExternalLink
	} from 'lucide-svelte';

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	onMount(() => {
		if (typeof window === 'undefined') return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && rigging.isTosModalOpen) {
				closeModal();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function closeModal() {
		playSfx('modal');
		rigging.toggleTosModal(false);
	}
</script>

{#if rigging.isTosModalOpen}
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
			<!-- Header -->
			<div
				class="px-6 sm:px-8 py-5 border-b flex items-center justify-between shrink-0 {
					isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800/80'
				}"
			>
				<div class="flex items-center gap-3.5">
					<div
						class="p-2.5 rounded-2xl flex items-center justify-center {
							isLightTheme ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
						}"
					>
						<Scale class="w-5 h-5" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="text-base sm:text-lg font-extrabold tracking-wide {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
								{i18n.t('tos_modal_title')}
							</h2>
							<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold {
								isLightTheme ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
							}">
								Transparent & Fair
							</span>
						</div>
						<p class="text-xs {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'} mt-0.5">
							MiruNova Live • Piagam Privasi Klien 100% Lokal & Hak Komunitas Streamer
						</p>
					</div>
				</div>

				<button
					onclick={closeModal}
					class="p-2.5 rounded-xl transition-colors cursor-pointer {
						isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
					}"
					aria-label={i18n.t('close_btn')}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Body (Scrollable) -->
			<div class="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs leading-relaxed custom-scrollbar {
				isLightTheme ? 'text-zinc-700' : 'text-zinc-300'
			}">
				<!-- Section 1: Privacy Charter (100% Client-Side) -->
				<div
					class="p-5 sm:p-6 rounded-3xl border space-y-3 {
						isLightTheme ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
					}"
				>
					<div class="flex items-center gap-2.5 font-extrabold text-sm {
						isLightTheme ? 'text-emerald-900' : 'text-emerald-300'
					}">
						<Lock class="w-4 h-4 text-emerald-500" />
						<span>1. {i18n.t('tos_sec1_title')}</span>
					</div>
					<p class="text-xs leading-relaxed">
						{i18n.t('tos_sec1_desc')}
					</p>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
						<div class="p-3 rounded-xl border flex items-center gap-2 {
							isLightTheme ? 'bg-white border-emerald-200 text-emerald-900 shadow-sm' : 'bg-zinc-950/60 border-emerald-500/20 text-zinc-200'
						}">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<span class="font-semibold">Zero Facial Cloud Telemetry</span>
						</div>
						<div class="p-3 rounded-xl border flex items-center gap-2 {
							isLightTheme ? 'bg-white border-emerald-200 text-emerald-900 shadow-sm' : 'bg-zinc-950/60 border-emerald-500/20 text-zinc-200'
						}">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<span class="font-semibold">Zero Audio Packet Transmission</span>
						</div>
						<div class="p-3 rounded-xl border flex items-center gap-2 {
							isLightTheme ? 'bg-white border-emerald-200 text-emerald-900 shadow-sm' : 'bg-zinc-950/60 border-emerald-500/20 text-zinc-200'
						}">
							<CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
							<span class="font-semibold">100% On-Device Neural Net</span>
						</div>
					</div>
				</div>

				<!-- Section 2: Commercial & Streaming Rights -->
				<div
					class="p-5 sm:p-6 rounded-3xl border space-y-3 {
						isLightTheme ? 'bg-sky-50/70 border-sky-200' : 'bg-cyan-950/20 border-cyan-500/30'
					}"
				>
					<div class="flex items-center gap-2.5 font-extrabold text-sm {
						isLightTheme ? 'text-sky-900' : 'text-cyan-300'
					}">
						<Tv class="w-4 h-4 text-cyan-500" />
						<span>2. {i18n.t('tos_sec2_title')}</span>
					</div>
					<p class="text-xs leading-relaxed">
						{i18n.t('tos_sec2_desc')}
					</p>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
						<div class="p-3 rounded-xl border flex items-center gap-2 {
							isLightTheme ? 'bg-white border-sky-200 text-sky-900 shadow-sm' : 'bg-zinc-950/60 border-cyan-500/20 text-zinc-200'
						}">
							<CheckCircle2 class="w-4 h-4 text-cyan-500 shrink-0" />
							<span>Monetisasi Penuh di YouTube, Twitch, TikTok & Kick</span>
						</div>
						<div class="p-3 rounded-xl border flex items-center gap-2 {
							isLightTheme ? 'bg-white border-sky-200 text-sky-900 shadow-sm' : 'bg-zinc-950/60 border-cyan-500/20 text-zinc-200'
						}">
							<CheckCircle2 class="w-4 h-4 text-cyan-500 shrink-0" />
							<span>Bebas Biaya Royalti MiruNova Live (0% Fee)</span>
						</div>
					</div>
				</div>

				<!-- Section 3: Model Licensing & Community Ethics -->
				<div
					class="p-5 sm:p-6 rounded-3xl border space-y-3 {
						isLightTheme ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
					}"
				>
					<div class="flex items-center gap-2.5 font-extrabold text-sm {
						isLightTheme ? 'text-amber-900' : 'text-amber-300'
					}">
						<AlertCircle class="w-4 h-4 text-amber-500" />
						<span>3. {i18n.t('tos_sec3_title')}</span>
					</div>
					<p class="text-xs leading-relaxed">
						{i18n.t('tos_sec3_desc')}
					</p>
					<div class="p-3 rounded-xl border text-[11px] leading-relaxed {
						isLightTheme ? 'bg-white border-amber-200 text-zinc-700 shadow-sm' : 'bg-zinc-950/60 border-amber-500/20 text-zinc-300'
					}">
						Model yang diunduh dari Booth.pm, Nizima, atau VRoid Hub harus mematuhi lisensi masing-masing kreator asli model tersebut. MiruNova Live bertindak sebagai runtime/viewer independen dan tidak mengklaim hak cipta atas model pengguna.
					</div>
				</div>

				<!-- Section 4: Creator Attribution & Open Source Commitment -->
				<div
					class="p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 {
						isLightTheme ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
					}"
				>
					<div class="flex items-center gap-3">
						<Heart class="w-5 h-5 text-pink-500 shrink-0" />
						<div>
							<div class="font-extrabold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
								Dibuat & Dikembangkan oleh Rifky (@RifkyA911)
							</div>
							<p class="text-[11px] {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
								Proyek FOSS berlisensi terbuka untuk kemajuan ekosistem VTuber global
							</p>
						</div>
					</div>

					<a
						href="https://github.com/RifkyA911/mirunova-live"
						target="_blank"
						rel="noopener noreferrer"
						onclick={() => playSfx('click')}
						class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
					>
						<span>GitHub Repository</span>
						<ExternalLink class="w-3.5 h-3.5" />
					</a>
				</div>
			</div>

			<!-- Footer -->
			<div
				class="px-6 sm:px-8 py-4 border-t flex items-center justify-between {
					isLightTheme ? 'bg-zinc-50 border-zinc-200 text-zinc-600' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
				}"
			>
				<span class="text-[11px]">
					MiruNova Live • Privacy First VTuber Platform
				</span>
				<button
					onclick={closeModal}
					class="px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer {
						isLightTheme ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
					}"
				>
					{i18n.t('close_btn')}
				</button>
			</div>
		</div>
	</div>
{/if}
