<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { Radio, X, Copy, Check, Tv, ExternalLink, ShieldCheck, Sparkles } from 'lucide-svelte';

	let copied = $state<boolean>(false);

	function getObsUrl(): string {
		if (typeof window === 'undefined') return 'http://localhost:5173/?obs=1';
		const origin = window.location.origin;
		return `${origin}/?obs=1&bg=${rigging.obsBgType}`;
	}

	async function copyUrl() {
		try {
			await navigator.clipboard.writeText(getObsUrl());
			copied = true;
			setTimeout(() => (copied = false), 2500);
		} catch {
			// Fallback copy
			const input = document.createElement('input');
			input.value = getObsUrl();
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			copied = true;
			setTimeout(() => (copied = false), 2500);
		}
	}

	function handleEnterObsMode() {
		rigging.toggleObsMode(true);
	}
</script>

{#if rigging.isObsModalOpen}
	<!-- Backdrop Modal (Click outside to close) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) rigging.isObsModalOpen = false;
		}}
		class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
	>
		<div
			class="w-full max-w-lg bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
				<div class="flex items-center gap-2.5">
					<div class="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
						<Radio class="w-4 h-4 animate-pulse" />
					</div>
					<div>
						<h2 class="text-sm font-semibold tracking-wide">
							{i18n.t('obs_setup')}
						</h2>
						<p class="text-xs text-zinc-400">
							{i18n.t('obs_desc')}
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isObsModalOpen = false)}
					class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Body -->
			<div class="p-5 space-y-4 text-xs">
				<!-- 1. Background Keying Selector -->
				<div>
					<span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
						Stream Background Transparency
					</span>
					<div class="grid grid-cols-2 gap-2">
						<button
							onclick={() => (rigging.obsBgType = 'transparent')}
							class="flex items-center justify-between p-3 rounded-xl border text-left transition-all {
								rigging.obsBgType === 'transparent'
									? 'bg-zinc-900 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/30'
									: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
							}"
						>
							<div class="flex flex-col">
								<span class="font-medium text-xs text-zinc-100">{i18n.t('obs_transparent_btn')}</span>
								<span class="text-[10px] text-zinc-500">Zero halo, native alpha channel</span>
							</div>
							{#if rigging.obsBgType === 'transparent'}
								<Check class="w-4 h-4 text-cyan-400" />
							{/if}
						</button>

						<button
							onclick={() => (rigging.obsBgType = 'chroma')}
							class="flex items-center justify-between p-3 rounded-xl border text-left transition-all {
								rigging.obsBgType === 'chroma'
									? 'bg-zinc-900 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
									: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
							}"
						>
							<div class="flex flex-col">
								<span class="font-medium text-xs text-zinc-100">{i18n.t('obs_chroma_btn')}</span>
								<span class="text-[10px] text-zinc-500">For Window / Game Capture</span>
							</div>
							{#if rigging.obsBgType === 'chroma'}
								<Check class="w-4 h-4 text-emerald-400" />
							{/if}
						</button>
					</div>
				</div>

				<!-- 2. Copy Browser Source URL -->
				<div>
					<span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
						OBS Browser Source Direct URL
					</span>
					<div class="flex items-center gap-2 p-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
						<input
							type="text"
							readonly
							value={getObsUrl()}
							class="flex-1 bg-transparent px-2 text-xs font-mono text-zinc-300 focus:outline-none select-all"
						/>
						<button
							onclick={copyUrl}
							class="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
						>
							{#if copied}
								<Check class="w-3.5 h-3.5" />
								<span>{i18n.t('obs_copied')}</span>
							{:else}
								<Copy class="w-3.5 h-3.5" />
								<span>{i18n.t('copy_obs_url')}</span>
							{/if}
						</button>
					</div>
				</div>

				<!-- 3. OBS Studio Setup Guide -->
				<div class="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-800/80 space-y-2">
					<h3 class="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
						<ShieldCheck class="w-3.5 h-3.5 text-cyan-400" />
						{i18n.t('obs_instructions_title')}
					</h3>
					<ol class="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
						<li>{i18n.t('obs_step_1')}</li>
						<li>{i18n.t('obs_step_2')}</li>
						<li>{i18n.t('obs_step_3')}</li>
						<li>{i18n.t('obs_step_4')}</li>
					</ol>
				</div>
			</div>

			<!-- Footer Action -->
			<div class="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between">
				<span class="text-[11px] text-zinc-500">
					Hotkey: Press <kbd class="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">ESC</kbd> to exit OBS Mode
				</span>
				<button
					onclick={handleEnterObsMode}
					class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95"
				>
					<Tv class="w-4 h-4" />
					<span>Enter Full OBS Mode</span>
				</button>
			</div>
		</div>
	</div>
{/if}
