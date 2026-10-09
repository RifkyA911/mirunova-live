<script lang="ts">
	import { onMount } from 'svelte';
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
		Radio,
		ChevronDown,
		ChevronRight,
		Hand,
		Folder,
		RotateCcw,
		Minimize2,
		Maximize2,
		Pin,
		PinOff
	} from 'lucide-svelte';

	let activeFilter = $state<'all' | 'head' | 'eyes' | 'mouth' | 'body' | 'hands' | 'custom'>('all');
	let searchQuery = $state<string>('');
	let collapsedGroups = $state<Record<string, boolean>>({});

	onMount(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && rigging.isDrawerOpen) {
				rigging.isDrawerOpen = false;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	function toggleGroup(g: string) {
		collapsedGroups[g] = !collapsedGroups[g];
	}

	function toggleAll(collapse: boolean) {
		const groups = ['head', 'eyes', 'mouth', 'body', 'hands', 'custom'];
		for (const g of groups) {
			collapsedGroups[g] = collapse;
		}
	}

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

	const groupMeta: Record<string, { label: string; icon: any; color: string }> = {
		head: { label: 'Head Kinematics', icon: User, color: 'text-cyan-400' },
		eyes: { label: 'Eyes & Eyebrows', icon: Eye, color: 'text-indigo-400' },
		mouth: { label: 'Mouth & Phonemes', icon: Smile, color: 'text-pink-400' },
		body: { label: 'Body & Breathing', icon: Activity, color: 'text-amber-400' },
		hands: { label: 'Hands & High-Five', icon: Hand, color: 'text-emerald-400' },
		custom: { label: 'Discovered Parameters', icon: Folder, color: 'text-violet-400' }
	};

	let groupedParameters = $derived.by(() => {
		const groups: Record<string, Live2DParameterDef[]> = {
			head: [],
			eyes: [],
			mouth: [],
			body: [],
			hands: [],
			custom: []
		};

		for (const p of rigging.parameters) {
			const matchesCategory = activeFilter === 'all' || p.group === activeFilter;
			const matchesSearch =
				p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.label.toLowerCase().includes(searchQuery.toLowerCase());

			if (matchesCategory && matchesSearch) {
				const g = p.group || 'custom';
				if (!groups[g]) groups[g] = [];
				groups[g].push(p);
			}
		}

		return Object.entries(groups).filter(([_, items]) => items.length > 0);
	});
</script>

{#if rigging.isDrawerOpen}
	<!-- Backdrop overlay to close drawer on outside click (ONLY in drawer overlay mode) -->
	{#if rigging.riggingViewMode === 'drawer'}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onclick={() => (rigging.isDrawerOpen = false)}
			class="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 transition-opacity animate-in fade-in duration-150"
		></div>
	{/if}

	<!-- Container: Stay Mode (Docked full-height) vs Windowed Card vs Drawer -->
	<aside
		class="{
			rigging.riggingViewMode === 'windowed'
				? 'fixed top-14 right-6 w-[430px] max-w-[94vw] max-h-[82vh] bg-zinc-950/98 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col z-40 text-zinc-100 select-none animate-in zoom-in-95 duration-200'
				: 'fixed top-0 right-0 h-full w-[410px] max-w-[92vw] bg-zinc-950/98 backdrop-blur-2xl border-l border-zinc-800/80 shadow-2xl flex flex-col z-40 transition-all text-zinc-100 select-none animate-in slide-in-from-right duration-200'
		}"
	>
		<!-- Header with Pin/Stay and Windowed Mode Switchers -->
		<div class="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
			<div class="flex items-center gap-2.5">
				<div class="p-2 bg-violet-500/10 border border-violet-500/30 rounded-lg text-violet-400">
					<Sliders class="w-4 h-4" />
				</div>
				<div>
					<h2 class="text-sm font-semibold tracking-wide flex items-center gap-2">
						{i18n.t('rigging_title')}
					</h2>
					<p class="text-[11px] text-zinc-400">
						{rigging.parameters.length} {i18n.t('detected_params')} • {rigging.riggingViewMode === 'windowed' ? i18n.t('rigging_windowed') : rigging.riggingViewMode === 'stay' ? i18n.t('rigging_stay') : i18n.t('rigging_drawer')}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-1.5">
				<!-- Stay / Pin Toggle Button -->
				<button
					onclick={() => {
						rigging.riggingViewMode = rigging.riggingViewMode === 'stay' ? 'drawer' : 'stay';
						rigging.isRiggingPinned = rigging.riggingViewMode === 'stay';
						rigging.persist();
						rigging.showToast(rigging.riggingViewMode === 'stay' ? '✓ Mode Stay Aktif (Panel terkunci)' : 'Mode Drawer Aktif');
					}}
					class="p-1.5 rounded-lg transition-colors {
						rigging.riggingViewMode === 'stay'
							? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
							: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
					}"
					title={i18n.t('pin_tooltip')}
					aria-label="Toggle Stay Mode"
				>
					{#if rigging.riggingViewMode === 'stay'}
						<Pin class="w-3.5 h-3.5 fill-current" />
					{:else}
						<PinOff class="w-3.5 h-3.5" />
					{/if}
				</button>

				<!-- Windowed / Dock Toggle Button -->
				<button
					onclick={() => {
						rigging.riggingViewMode = rigging.riggingViewMode === 'windowed' ? 'stay' : 'windowed';
						rigging.persist();
					}}
					class="p-1.5 rounded-lg transition-colors {
						rigging.riggingViewMode === 'windowed'
							? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
							: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
					}"
					title={i18n.t('window_tooltip')}
					aria-label="Toggle Windowed Mode"
				>
					{#if rigging.riggingViewMode === 'windowed'}
						<Minimize2 class="w-3.5 h-3.5" />
					{:else}
						<Maximize2 class="w-3.5 h-3.5" />
					{/if}
				</button>

				<!-- Close Button -->
				<button
					onclick={() => (rigging.isDrawerOpen = false)}
					class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors ml-1"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Mode Switcher: Live Tracking vs Manual Rigging Override -->
		<div class="p-3 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-col gap-2.5">
			<div class="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
				<button
					onclick={() => (rigging.riggingMode = 'live')}
					class="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all {
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
					class="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all {
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
				<div class="flex items-center justify-between text-[11px] text-cyan-400">
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
						<span>{i18n.t('live_mode_desc')}</span>
					</div>
					<span class="text-zinc-500 font-mono text-[10px]">{rigging.fps || 60} FPS</span>
				</div>
			{/if}
		</div>

		<!-- Quick Presets -->
		{#if rigging.riggingMode === 'manual'}
			<div class="px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/20 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
				<span class="text-[10px] text-zinc-500 uppercase font-semibold mr-1">{i18n.t('presets')}:</span>
				<button onclick={() => applyPreset('blink')} class="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_blink')}
				</button>
				<button onclick={() => applyPreset('mouth')} class="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_mouth')}
				</button>
				<button onclick={() => applyPreset('smile')} class="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_smile')}
				</button>
				<button onclick={() => applyPreset('tilt')} class="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_tilt')}
				</button>
				<button onclick={() => applyPreset('angry')} class="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_angry')}
				</button>
				<button onclick={() => applyPreset('shock')} class="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] whitespace-nowrap">
					{i18n.t('preset_shock')}
				</button>
			</div>
		{/if}

		<!-- Search & Accordion Controls -->
		<div class="p-3 border-b border-zinc-800 flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<div class="relative flex-1">
					<Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={i18n.t('search_params')}
						class="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
					/>
				</div>
				<!-- Collapse / Expand All Buttons -->
				<button
					onclick={() => toggleAll(false)}
					class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
					title="Buka Semua Accordion"
				>
					<Maximize2 class="w-3.5 h-3.5" />
				</button>
				<button
					onclick={() => toggleAll(true)}
					class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
					title="Tutup Semua Accordion"
				>
					<Minimize2 class="w-3.5 h-3.5" />
				</button>
			</div>
		</div>

		<!-- Accordion Parameter Cards Container -->
		<div class="flex-1 overflow-y-auto p-3 space-y-3">
			{#if groupedParameters.length === 0}
				<div class="p-8 text-center text-zinc-500 text-xs">
					{i18n.t('no_params_found')}
				</div>
			{:else}
				{#each groupedParameters as [groupKey, params] (groupKey)}
					{@const meta = groupMeta[groupKey] || { label: groupKey, icon: Folder, color: 'text-zinc-400' }}
					{@const isCollapsed = !!collapsedGroups[groupKey]}
					{@const IconComponent = meta.icon}

					<!-- Foldable Accordion Card -->
					<div class="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/40 transition-all shadow-sm">
						<!-- Accordion Header -->
						<button
							onclick={() => toggleGroup(groupKey)}
							class="w-full flex items-center justify-between p-3 bg-zinc-900/70 hover:bg-zinc-800/60 transition-colors text-left"
						>
							<div class="flex items-center gap-2.5">
								<div class="p-1.5 rounded-lg bg-zinc-800/80 {meta.color}">
									<IconComponent class="w-3.5 h-3.5" />
								</div>
								<span class="font-semibold text-xs text-zinc-200">{meta.label}</span>
								<span class="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
									{params.length}
								</span>
							</div>

							<div class="flex items-center gap-1.5 text-zinc-400">
								<ChevronDown class="w-4 h-4 transition-transform duration-200 {isCollapsed ? '-rotate-90' : ''}" />
							</div>
						</button>

						<!-- Accordion Body (Sliders) -->
						{#if !isCollapsed}
							<div class="p-3 space-y-3 border-t border-zinc-800/60 bg-zinc-950/40 animate-in fade-in duration-150">
								{#each params as param (param.id)}
									{@const currentVal = rigging.getActiveValue(param.id)}
									{@const percentage = ((currentVal - param.min) / (param.max - param.min)) * 100}

									<div class="space-y-1">
										<div class="flex items-center justify-between text-xs">
											<span class="font-mono text-zinc-300 font-medium truncate max-w-[200px]" title={param.label}>
												{param.label}
											</span>
											<span
												class="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800/80 {rigging.riggingMode === 'manual' ? 'text-violet-400 font-semibold' : 'text-cyan-400'}"
											>
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
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</aside>
{/if}
