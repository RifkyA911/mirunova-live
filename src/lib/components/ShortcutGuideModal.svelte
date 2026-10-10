<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import {
		Keyboard,
		X,
		Camera,
		Crosshair,
		Sliders,
		Layers,
		Palette,
		Radio,
		Aperture,
		Settings,
		Eye,
		HelpCircle,
		Search,
		ZoomIn,
		ZoomOut,
		RotateCcw,
		Lock,
		Volume2
	} from 'lucide-svelte';

	interface ShortcutItem {
		key: string;
		title: string;
		description: string;
		category: 'tracking' | 'navigation' | 'streaming' | 'zoom';
		badge?: string;
	}

	let searchQuery = $state<string>('');
	let selectedCategory = $state<'all' | 'tracking' | 'navigation' | 'streaming' | 'zoom'>('all');

	const shortcuts = $derived<ShortcutItem[]>([
		// Vision Tracking & Audio
		{ key: 'Space', title: 'Webcam Face Tracking', description: i18n.t('shortcut_space'), category: 'tracking', badge: 'Vision' },
		{ key: 'V', title: 'Microphone Engine', description: i18n.t('shortcut_v'), category: 'tracking', badge: 'Audio' },
		{ key: 'C', title: 'Center Pose Calibration', description: i18n.t('shortcut_c'), category: 'tracking', badge: 'Vision' },
		{ key: 'P', title: 'PIP Camera Overlay', description: i18n.t('shortcut_p'), category: 'tracking', badge: 'Webcam' },
		{ key: 'B', title: 'Blink Sync Mode', description: i18n.t('shortcut_b'), category: 'tracking', badge: 'Eyes' },

		// Zoom & Framing
		{ key: '+ / =', title: 'Zoom In Stage', description: i18n.t('shortcut_zoom_in'), category: 'zoom', badge: 'Zoom' },
		{ key: '- / _', title: 'Zoom Out Stage', description: i18n.t('shortcut_zoom_out'), category: 'zoom', badge: 'Zoom' },
		{ key: 'Z', title: 'Reset Zoom & Center', description: i18n.t('shortcut_zoom_reset'), category: 'zoom', badge: 'Reset' },

		// Studio Navigation
		{ key: 'H', title: 'Toggle Bottom Dock', description: i18n.t('shortcut_h'), category: 'navigation', badge: 'Dock' },
		{ key: 'M', title: 'Model & Motions Catalog', description: i18n.t('shortcut_m'), category: 'navigation', badge: 'Catalog' },
		{ key: 'T', title: 'Theme & Stage Studio', description: i18n.t('shortcut_t'), category: 'navigation', badge: 'Theme' },
		{ key: 'R', title: 'Rigging Inspector Drawer', description: i18n.t('shortcut_r'), category: 'navigation', badge: 'Rigging' },
		{ key: 'F2 / ,', title: 'Studio Settings & Hardware', description: i18n.t('shortcut_f2'), category: 'navigation', badge: 'Config' },
		{ key: 'F1 / ?', title: 'Shortcuts Cheatsheet', description: i18n.t('shortcut_f1'), category: 'navigation', badge: 'Help' },
		{ key: 'Esc', title: 'Close Modals & Clear Screen', description: i18n.t('shortcut_esc'), category: 'navigation', badge: 'General' },

		// Streaming & Quick Actions
		{ key: 'L', title: 'Screen Lock & Clean Stage', description: i18n.t('shortcut_l'), category: 'streaming', badge: 'Stage' },
		{ key: 'O', title: 'OBS Screen Mode (Alpha / Chroma)', description: i18n.t('shortcut_o'), category: 'streaming', badge: 'OBS' },
		{ key: 'S', title: 'Screenshot PNG Download', description: i18n.t('shortcut_s'), category: 'streaming', badge: 'Capture' },
		{ key: '1 - 9, 0', title: 'Instant Theme Switcher', description: i18n.t('shortcut_numbers'), category: 'streaming', badge: '10 Themes' }
	]);

	const filteredShortcuts = $derived<ShortcutItem[]>(
		shortcuts.filter((item) => {
			const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
			const q = searchQuery.trim().toLowerCase();
			const matchQuery = !q || item.key.toLowerCase().includes(q) || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
			return matchCategory && matchQuery;
		})
	);

	onMount(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && rigging.isShortcutModalOpen) {
				rigging.isShortcutModalOpen = false;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>

{#if rigging.isShortcutModalOpen}
	<!-- Modal Backdrop (Click Outside to Close) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) rigging.isShortcutModalOpen = false;
		}}
		class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
	>
		<div
			class="w-full max-w-5xl bg-zinc-950/98 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-sm">
						<Keyboard class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-base font-bold tracking-wide flex items-center gap-2">
							{i18n.t('shortcuts_title')}
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold">STUDIO CHEATSHEET</span>
						</h2>
						<p class="text-xs text-zinc-400">
							{i18n.t('shortcuts_subtitle')}
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isShortcutModalOpen = false)}
					class="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Filter & Search Toolbar -->
			<div class="px-6 py-3.5 border-b border-zinc-800/70 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3">
				<!-- Category Filter Tabs -->
				<div class="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
					<button
						onclick={() => (selectedCategory = 'all')}
						class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer {
							selectedCategory === 'all'
								? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
								: 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
						}"
					>
						{i18n.t('shortcut_all_tab')}
					</button>
					<button
						onclick={() => (selectedCategory = 'tracking')}
						class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 {
							selectedCategory === 'tracking'
								? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
								: 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
						}"
					>
						<Camera class="w-3.5 h-3.5" />
						<span>{i18n.t('shortcut_cat_tracking')}</span>
					</button>
					<button
						onclick={() => (selectedCategory = 'zoom')}
						class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 {
							selectedCategory === 'zoom'
								? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
								: 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
						}"
					>
						<ZoomIn class="w-3.5 h-3.5" />
						<span>{i18n.t('shortcut_cat_zoom')}</span>
					</button>
					<button
						onclick={() => (selectedCategory = 'navigation')}
						class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 {
							selectedCategory === 'navigation'
								? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
								: 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
						}"
					>
						<Sliders class="w-3.5 h-3.5" />
						<span>{i18n.t('shortcut_cat_navigation')}</span>
					</button>
					<button
						onclick={() => (selectedCategory = 'streaming')}
						class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 {
							selectedCategory === 'streaming'
								? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
								: 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
						}"
					>
						<Radio class="w-3.5 h-3.5" />
						<span>{i18n.t('shortcut_cat_streaming')}</span>
					</button>
				</div>

				<!-- Live Search Box -->
				<div class="relative w-full sm:w-64">
					<Search class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={i18n.t('shortcut_search_placeholder')}
						class="w-full pl-9 pr-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
					/>
				</div>
			</div>

			<!-- Shortcuts Grid Body -->
			<div class="p-6 overflow-y-auto max-h-[60vh] space-y-4">
				{#if filteredShortcuts.length === 0}
					<div class="py-12 flex flex-col items-center justify-center text-center text-zinc-500 gap-2">
						<Keyboard class="w-10 h-10 stroke-[1.5] text-zinc-600" />
						<p class="text-xs">{i18n.t('shortcut_no_results')}</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each filteredShortcuts as item}
							<div
								class="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/90 transition-all flex flex-col justify-between gap-3 shadow-sm group"
							>
								<div class="flex items-start justify-between gap-2">
									<div class="space-y-1 min-w-0">
										<div class="flex items-center gap-1.5 flex-wrap">
											<span class="font-bold text-xs text-zinc-200 group-hover:text-cyan-300 transition-colors">
												{item.title}
											</span>
											{#if item.badge}
												<span class="text-[9px] px-1.5 py-0.2 rounded-md font-mono bg-zinc-800/90 text-zinc-400">
													{item.badge}
												</span>
											{/if}
										</div>
										<p class="text-[11px] text-zinc-400 leading-relaxed">
											{item.description}
										</p>
									</div>
								</div>

								<!-- Keyboard Cap (KBD) Badge -->
								<div class="flex items-center justify-end pt-2 border-t border-zinc-800/60">
									<kbd
										class="px-2.5 py-1.5 bg-zinc-950/90 border border-zinc-700/80 rounded-lg text-xs font-mono font-bold text-cyan-300 shadow-[0_2px_0_0_rgba(255,255,255,0.1),inset_0_1px_0_0_rgba(255,255,255,0.15)] tracking-wider"
									>
										{item.key}
									</kbd>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Pro Tip Banner -->
				<div class="p-3.5 bg-cyan-950/20 border border-cyan-800/40 rounded-2xl flex items-start gap-3 mt-4">
					<HelpCircle class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
					<div class="text-[11px] text-zinc-300 leading-relaxed">
						<span class="text-cyan-300 font-bold">{i18n.t('shortcut_pro_tip_title')}</span>
						<span>{i18n.t('shortcut_pro_tip_desc')}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
