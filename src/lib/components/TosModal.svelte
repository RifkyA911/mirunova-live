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
		Sparkles
	} from 'lucide-svelte';

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
			onclick={(e) => e.stopPropagation()}
			class="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-200"
		>
			<!-- Header -->
			<div class="px-6 sm:px-8 py-5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
						<Scale class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-base sm:text-lg font-bold tracking-wide text-zinc-100 flex items-center gap-2">
							{i18n.t('tos_modal_title')}
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-medium">
								Transparent & Fair
							</span>
						</h2>
						<p class="text-xs text-zinc-400">
							MiruNova Live • Client-Side Privacy Charter & Community Rights
						</p>
					</div>
				</div>

				<button
					onclick={closeModal}
					class="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
					aria-label="Tutup"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Body -->
			<div class="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-zinc-300 leading-relaxed">
				<!-- Section 1: Privacy Charter (100% Client-Side) -->
				<div class="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
					<div class="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
						<Lock class="w-4 h-4 text-emerald-400" />
						<span>1. {i18n.t('tos_sec1_title')}</span>
					</div>
					<p class="text-zinc-300 text-xs leading-relaxed">
						{i18n.t('tos_sec1_desc')}
					</p>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
						<div class="p-2.5 bg-zinc-950/60 rounded-xl border border-emerald-500/20 flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
							<span>Zero Facial Cloud Telemetry</span>
						</div>
						<div class="p-2.5 bg-zinc-950/60 rounded-xl border border-emerald-500/20 flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
							<span>Zero Audio Packet Transmission</span>
						</div>
						<div class="p-2.5 bg-zinc-950/60 rounded-xl border border-emerald-500/20 flex items-center gap-2">
							<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
							<span>Local LocalStorage Only</span>
						</div>
					</div>
				</div>

				<!-- Section 2: Commercial VTuber Streaming Rights -->
				<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
					<div class="flex items-center gap-2.5 text-cyan-300 font-bold text-sm">
						<Tv class="w-4 h-4 text-cyan-400" />
						<span>2. {i18n.t('tos_sec2_title')}</span>
					</div>
					<p class="text-zinc-300 text-xs leading-relaxed">
						{i18n.t('tos_sec2_desc')}
					</p>
				</div>

				<!-- Section 3: Live2D & 3D Model Intellectual Property -->
				<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
					<div class="flex items-center gap-2.5 text-pink-300 font-bold text-sm">
						<Sparkles class="w-4 h-4 text-pink-400" />
						<span>3. {i18n.t('tos_sec3_title')}</span>
					</div>
					<p class="text-zinc-300 text-xs leading-relaxed">
						{i18n.t('tos_sec3_desc')}
					</p>
				</div>

				<!-- Section 4: Open Source License & Warranty Disclaimer -->
				<div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
					<div class="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
						<FileText class="w-4 h-4 text-amber-400" />
						<span>4. Open Source Licensing & Warranty Disclaimer</span>
					</div>
					<p class="text-zinc-400 text-xs leading-relaxed">
						MiruNova Live is free and open-source software authored and maintained by <strong>Rifky (@RifkyA911)</strong>. The core platform is provided "AS IS", without warranty of any kind, express or implied. In no event shall the authors or copyright holders be liable for any claim or damages arising from the use of the software.
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="px-6 sm:px-8 py-4 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between text-xs">
				<span class="text-zinc-500 text-[11px]">
					MiruNova Live • Privacy-First VTuber Engine
				</span>
				<button
					onclick={closeModal}
					class="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
				>
					{i18n.t('done')}
				</button>
			</div>
		</div>
	</div>
{/if}
