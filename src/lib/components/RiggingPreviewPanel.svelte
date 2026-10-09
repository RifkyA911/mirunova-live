<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import type { Live2DParameterDef } from '#lib/types/tracking';
	import {
		Sliders,
		Activity,
		RefreshCw,
		X,
		Search,
		Sparkles,
		Eye,
		Smile,
		User,
		Radio
	} from 'lucide-svelte';

	let activeFilter = $state<'all' | 'head' | 'eyes' | 'mouth' | 'body' | 'hands' | 'custom'>('all');
	let searchQuery = $state<string>('');

	let filteredParameters = $derived(
		rigging.parameters.filter((p: Live2DParameterDef) => {
			const matchesCategory = activeFilter === 'all' || p.group === activeFilter;
			const matchesSearch =
				p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.label.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCategory && matchesSearch;
		})
	);

	function handleSliderChange(id: string, e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseFloat(target.value);
		rigging.setManualValue(id, val);
	}

	// Quick Test Presets
	function applyPreset(preset: 'blink' | 'mouth' | 'smile' | 'tilt' | 'angry' | 'shock') {
		rigging.riggingMode = 'manual';
		if (preset === 'blink') {
			rigging.setManualValue('ParamEyeLOpen', 0);
			rigging.setManualValue('ParamEyeROpen', 0);
		} else if (preset === 'mouth') {
			rigging.setManualValue('ParamMouthOpenY', 1.0);
			rigging.setManualValue('ParamMouthForm', 0.5);
		} else if (preset === 'smile') {
			rigging.setManualValue('ParamEyeLSmile', 1.0);
			rigging.setManualValue('ParamEyeRSmile', 1.0);
			rigging.setManualValue('ParamMouthForm', 1.0);
			rigging.setManualValue('ParamCheek', 0.8);
		} else if (preset === 'tilt') {
			rigging.setManualValue('ParamAngleX', 20);
			rigging.setManualValue('ParamAngleZ', -15);
		} else if (preset === 'angry') {
			rigging.setManualValue('ParamBrowLY', -1.0);
			rigging.setManualValue('ParamBrowRY', -1.0);
			rigging.setManualValue('ParamMouthForm', -0.8);
			rigging.setManualValue('ParamEyeLOpen', 0.8);
			rigging.setManualValue('ParamEyeROpen', 0.8);
		} else if (preset === 'shock') {
			rigging.setManualValue('ParamEyeLOpen', 1.2);
			rigging.setManualValue('ParamEyeROpen', 1.2);
			rigging.setManualValue('ParamBrowLY', 0.9);
			rigging.setManualValue('ParamBrowRY', 0.9);
			rigging.setManualValue('ParamMouthOpenY', 0.9);
		}
	}
</script>

{#if rigging.isDrawerOpen}
	<!-- Slide-in Rigging Preview Drawer -->
	<aside
		class="fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800/80 shadow-2xl flex flex-col z-40 transition-all text-zinc-100 select-none animate-in slide-in-from-right duration-200"
	>
		<!-- Drawer Header -->
		<div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
			<div class="flex items-center gap-2.5">
				<div class="p-2 bg-violet-500/10 border border-violet-500/30 rounded-lg text-violet-400">
					<Sliders class="w-4 h-4" />
				</div>
				<div>
					<h2 class="text-sm font-semibold tracking-wide flex items-center gap-2">
						{i18n.t('rigging_title')}
					</h2>
					<p class="text-xs text-zinc-400">
						{rigging.parameters.length} {i18n.t('detected_params')}
					</p>
				</div>
			</div>
			<button
				onclick={() => (rigging.isDrawerOpen = false)}
				class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
				aria-label="Close"
			>
				<X class="w-4 h-4" />
			</button>
		</div>

		<!-- Mode Switcher: Live Tracking vs Manual Rigging Override -->
		<div class="p-3 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-col gap-2.5">
			<div class="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
				<button
					onclick={() => (rigging.riggingMode = 'live')}
					class="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all {
						rigging.riggingMode === 'live'
							? 'bg-cyan-500 text-zinc-950 font-semibold shadow-sm'
							: 'text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Activity class="w-3.5 h-3.5" />
					{i18n.t('live_tracking_mode')}
				</button>
				<button
					onclick={() => (rigging.riggingMode = 'manual')}
					class="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all {
						rigging.riggingMode === 'manual'
							? 'bg-violet-500 text-white font-semibold shadow-sm'
							: 'text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Sliders class="w-3.5 h-3.5" />
					{i18n.t('manual_override_mode')}
				</button>
			</div>

			{#if rigging.riggingMode === 'manual'}
				<div class="flex items-center justify-between pt-1">
					<span class="text-[11px] text-violet-400 font-medium">{i18n.t('test_mode_desc')}</span>
					<button
						onclick={() => rigging.resetManualOverrides()}
						class="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-violet-300 transition-colors"
					>
						<RefreshCw class="w-3 h-3" />
						{i18n.t('reset')}
					</button>
				</div>
			{:else}
				<div class="flex items-center gap-2 text-[11px] text-cyan-400">
					<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
					<span>{i18n.t('live_mode_desc')}</span>
				</div>
			{/if}
		</div>

		<!-- Live Tracking Accuracy & Quality Tuning -->
		{#if rigging.riggingMode === 'live'}
			<div class="p-3 bg-zinc-900/60 border-b border-zinc-800 space-y-2.5">
				<div class="flex items-center justify-between">
					<span class="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
						<Sparkles class="w-3.5 h-3.5 text-cyan-400" />
						{i18n.t('tracking_quality')}
					</span>
					<span class="text-[10px] text-zinc-500 font-mono">Sens: {rigging.trackingSensitivity.toFixed(1)}x</span>
				</div>

				<!-- Sensitivity Slider -->
				<div class="space-y-1">
					<div class="flex items-center justify-between text-[11px] text-zinc-400">
						<span>{i18n.t('sensitivity')}</span>
						<span class="font-mono text-cyan-400">{rigging.trackingSensitivity.toFixed(1)}x</span>
					</div>
					<input
						type="range"
						min="0.5"
						max="2.0"
						step="0.1"
						bind:value={rigging.trackingSensitivity}
						class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
					/>
				</div>

				<!-- Smoothing Slider -->
				<div class="space-y-1">
					<div class="flex items-center justify-between text-[11px] text-zinc-400">
						<span>{i18n.t('smoothing')}</span>
						<span class="font-mono text-cyan-400">{(rigging.smoothingAmount * 100).toFixed(0)}%</span>
					</div>
					<input
						type="range"
						min="0.1"
						max="0.7"
						step="0.05"
						bind:value={rigging.smoothingAmount}
						class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
					/>
				</div>

				<!-- Deadzone Slider -->
				<div class="space-y-1">
					<div class="flex items-center justify-between text-[11px] text-zinc-400">
						<span>{i18n.t('deadzone')}</span>
						<span class="font-mono text-cyan-400">{rigging.deadzoneThreshold.toFixed(1)}°</span>
					</div>
					<input
						type="range"
						min="0"
						max="1.5"
						step="0.1"
						bind:value={rigging.deadzoneThreshold}
						class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
					/>
				</div>

				<!-- Synchronized Eye Blink Toggle -->
				<div class="flex items-center justify-between pt-1">
					<span class="text-[11px] text-zinc-400">{i18n.t('blink_sync')}</span>
					<button
						onclick={() => (rigging.eyeBlinkLinked = !rigging.eyeBlinkLinked)}
						class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors {
							rigging.eyeBlinkLinked
								? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
								: 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
						}"
					>
						{rigging.eyeBlinkLinked ? 'Active' : 'Wink Mode'}
					</button>
				</div>
			</div>
		{/if}

		<!-- Quick Presets -->
		{#if rigging.riggingMode === 'manual'}
			<div class="px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/20 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
				<span class="text-[10px] text-zinc-500 uppercase font-semibold mr-1">{i18n.t('presets')}:</span>
				<button onclick={() => applyPreset('blink')} class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_blink')}
				</button>
				<button onclick={() => applyPreset('mouth')} class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_mouth')}
				</button>
				<button onclick={() => applyPreset('smile')} class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_smile')}
				</button>
				<button onclick={() => applyPreset('tilt')} class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_tilt')}
				</button>
				<button onclick={() => applyPreset('angry')} class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_angry')}
				</button>
				<button onclick={() => applyPreset('shock')} class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_shock')}
				</button>
			</div>
		{/if}

		<!-- Filter Tabs & Search -->
		<div class="p-3 border-b border-zinc-800 flex flex-col gap-2">
			<div class="relative">
				<Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder={i18n.t('search_params')}
					class="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-md pl-8 pr-3 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
				/>
			</div>

			<!-- Filter Category Pills -->
			<div class="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
				{#each [
					{ id: 'all', label: i18n.t('filter_all') },
					{ id: 'head', label: i18n.t('filter_head') },
					{ id: 'eyes', label: i18n.t('filter_eyes') },
					{ id: 'mouth', label: i18n.t('filter_mouth') },
					{ id: 'body', label: i18n.t('filter_body') },
					{ id: 'hands', label: i18n.t('filter_hands') },
					{ id: 'custom', label: i18n.t('filter_custom') }
				] as cat}
					<button
						onclick={() => (activeFilter = cat.id as any)}
						class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap {
							activeFilter === cat.id
								? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
								: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
						}"
					>
						{cat.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Parameter Sliders List -->
		<div class="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-zinc-900/60">
			{#if filteredParameters.length === 0}
				<div class="p-6 text-center text-zinc-500 text-xs">
					{i18n.t('no_params_found')}
				</div>
			{:else}
				{#each filteredParameters as param (param.id)}
					{@const currentVal = rigging.getActiveValue(param.id)}
					{@const percentage = ((currentVal - param.min) / (param.max - param.min)) * 100}

					<div class="pt-2.5 first:pt-0">
						<div class="flex items-center justify-between text-xs mb-1">
							<span class="font-mono text-zinc-300 font-medium truncate max-w-[180px]" title={param.label}>
								{param.label}
							</span>
							<span class="font-mono text-[11px] {rigging.riggingMode === 'manual' ? 'text-violet-400 font-semibold' : 'text-cyan-400'}">
								{currentVal.toFixed(2)}
							</span>
						</div>

						{#if rigging.riggingMode === 'manual'}
							<div class="flex items-center gap-2">
								<span class="text-[10px] text-zinc-500 font-mono w-6 text-right">{param.min}</span>
								<input
									type="range"
									min={param.min}
									max={param.max}
									step={(param.max - param.min) / 100}
									value={currentVal}
									oninput={(e) => handleSliderChange(param.id, e)}
									class="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
								/>
								<span class="text-[10px] text-zinc-500 font-mono w-6">{param.max}</span>
							</div>
						{:else}
							<div class="flex items-center gap-2">
								<span class="text-[10px] text-zinc-500 font-mono w-6 text-right">{param.min}</span>
								<div class="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 relative">
									<div
										class="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-75"
										style="width: {Math.max(0, Math.min(100, percentage))}%"
									></div>
								</div>
								<span class="text-[10px] text-zinc-500 font-mono w-6">{param.max}</span>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</aside>
{/if}
