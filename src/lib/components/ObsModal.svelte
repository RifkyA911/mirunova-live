<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { Radio, X, Copy, Check, Tv, ExternalLink, ShieldCheck, Sparkles } from 'lucide-svelte';

	let copied = $state<boolean>(false);

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

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
			class="w-full max-w-4xl xl:max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border transition-colors duration-200 {
				isLightTheme
					? 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
					: 'bg-zinc-950/98 text-zinc-100 border-zinc-800 shadow-2xl'
			}"
		>
			<!-- Header -->
			<div class="px-6 py-5 border-b flex items-center justify-between {
				isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
			}">
				<div class="flex items-center gap-2.5">
					<div class="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500">
						<Radio class="w-5 h-5 animate-pulse" />
					</div>
					<div>
						<h2 class="text-sm sm:text-base font-bold tracking-wide {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							{i18n.t('obs_setup')}
						</h2>
						<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
							{i18n.t('obs_desc')}
						</p>
					</div>
				</div>
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

			<!-- Body (2-Column Grid) -->
			<div class="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
				<!-- 1. Background Keying Selector -->
				<div>
					<span class="text-[11px] font-semibold uppercase tracking-wider block mb-2 {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
						Stream Background Transparency
					</span>
					<div class="grid grid-cols-2 gap-2">
						<button
							onclick={() => (rigging.obsBgType = 'transparent')}
							class="flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer {
								rigging.obsBgType === 'transparent'
									? isLightTheme
										? 'bg-cyan-50 border-cyan-500 text-zinc-900 shadow-sm ring-1 ring-cyan-500/30'
										: 'bg-zinc-900 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/30'
									: isLightTheme
										? 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
										: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
							}"
						>
							<div class="flex flex-col">
								<span class="font-medium text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('obs_transparent_btn')}</span>
								<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-500'}">Zero halo, native alpha channel</span>
							</div>
							{#if rigging.obsBgType === 'transparent'}
								<Check class="w-4 h-4 text-cyan-500" />
							{/if}
						</button>

						<button
							onclick={() => (rigging.obsBgType = 'chroma')}
							class="flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer {
								rigging.obsBgType === 'chroma'
									? isLightTheme
										? 'bg-emerald-50 border-emerald-500 text-zinc-900 shadow-sm ring-1 ring-emerald-500/30'
										: 'bg-zinc-900 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
									: isLightTheme
										? 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
										: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
							}"
						>
							<div class="flex flex-col">
								<span class="font-medium text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">{i18n.t('obs_chroma_btn')}</span>
								<span class="text-[10px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-500'}">For Window / Game Capture</span>
							</div>
							{#if rigging.obsBgType === 'chroma'}
								<Check class="w-4 h-4 text-emerald-500" />
							{/if}
						</button>
					</div>
				</div>

				<!-- 2. Copy Browser Source URL -->
				<div>
					<span class="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
						OBS Browser Source Direct URL
					</span>
					<div class="flex items-center gap-2 p-1.5 rounded-xl border {isLightTheme ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-800'}">
						<input
							type="text"
							readonly
							value={getObsUrl()}
							class="flex-1 bg-transparent px-2 text-xs font-mono focus:outline-none select-all {isLightTheme ? 'text-zinc-800' : 'text-zinc-300'}"
						/>
						<button
							onclick={copyUrl}
							class="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
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
				<div class="p-3.5 rounded-xl border space-y-2 {isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/80'}">
					<h3 class="font-semibold text-xs flex items-center gap-1.5 {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
						<ShieldCheck class="w-3.5 h-3.5 text-cyan-500" />
						{i18n.t('obs_instructions_title')}
					</h3>
					<ol class="list-decimal list-inside space-y-1 text-[11px] leading-relaxed {isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}">
						<li>{i18n.t('obs_step_1')}</li>
						<li>{i18n.t('obs_step_2')}</li>
						<li>{i18n.t('obs_step_3')}</li>
						<li>{i18n.t('obs_step_4')}</li>
					</ol>
				</div>
			</div>

			<!-- Footer Action -->
			<div class="p-4 border-t flex items-center justify-between {isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/80 border-zinc-800'}">
				<span class="text-[11px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-500'}">
					Hotkey: Press <kbd class="px-1 py-0.5 rounded border {isLightTheme ? 'bg-white border-zinc-300 text-zinc-700' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}">ESC</kbd> to exit OBS Mode
				</span>
				<button
					onclick={handleEnterObsMode}
					class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
				>
					<Tv class="w-4 h-4" />
					<span>Enter Full OBS Mode</span>
				</button>
			</div>
		</div>
	</div>
{/if}
