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

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	let searchQuery = $state<string>('');
	let selectedCategory = $state<'all' | 'tracking' | 'navigation' | 'streaming' | 'zoom'>('all');

	const shortcuts = $derived<ShortcutItem[]>([
		// Vision Tracking & Audio
		{ key: 'Space', title: i18n.t('shortcut_title_space'), description: i18n.t('shortcut_space'), category: 'tracking', badge: i18n.t('badge_vision') },
		{ key: 'V', title: i18n.t('shortcut_title_v'), description: i18n.t('shortcut_v'), category: 'tracking', badge: i18n.t('badge_audio') },
		{ key: 'C', title: i18n.t('shortcut_title_c'), description: i18n.t('shortcut_c'), category: 'tracking', badge: i18n.t('badge_vision') },
		{ key: 'E', title: i18n.t('shortcut_title_e'), description: i18n.t('expressions_title'), category: 'tracking', badge: i18n.t('badge_expressions') },
		{ key: 'P', title: i18n.t('shortcut_title_p'), description: i18n.t('shortcut_p'), category: 'tracking', badge: i18n.t('badge_webcam') },
		{ key: 'B', title: i18n.t('shortcut_title_b'), description: i18n.t('shortcut_b'), category: 'tracking', badge: i18n.t('badge_eyes') },

		// Zoom & Framing
		{ key: '+ / =', title: i18n.t('shortcut_title_zoom_in'), description: i18n.t('shortcut_zoom_in'), category: 'zoom', badge: i18n.t('badge_zoom') },
		{ key: '- / _', title: i18n.t('shortcut_title_zoom_out'), description: i18n.t('shortcut_zoom_out'), category: 'zoom', badge: i18n.t('badge_zoom') },
		{ key: 'Z', title: i18n.t('shortcut_title_zoom_reset'), description: i18n.t('shortcut_zoom_reset'), category: 'zoom', badge: i18n.t('badge_reset') },

		// Studio Navigation
		{ key: 'H', title: i18n.t('shortcut_title_h'), description: i18n.t('shortcut_h'), category: 'navigation', badge: i18n.t('badge_dock') },
		{ key: 'M', title: i18n.t('shortcut_title_m'), description: i18n.t('shortcut_m'), category: 'navigation', badge: i18n.t('badge_catalog') },
		{ key: 'T', title: i18n.t('shortcut_title_t'), description: i18n.t('shortcut_t'), category: 'navigation', badge: i18n.t('badge_theme') },
		{ key: 'R', title: i18n.t('shortcut_title_r'), description: i18n.t('shortcut_r'), category: 'navigation', badge: i18n.t('badge_rigging') },
		{ key: 'F2 / ,', title: i18n.t('shortcut_title_f2'), description: i18n.t('shortcut_f2'), category: 'navigation', badge: i18n.t('badge_config') },
		{ key: 'F1 / ?', title: i18n.t('shortcut_title_f1'), description: i18n.t('shortcut_f1'), category: 'navigation', badge: i18n.t('badge_help') },
		{ key: 'Esc', title: i18n.t('shortcut_title_esc'), description: i18n.t('shortcut_esc'), category: 'navigation', badge: i18n.t('badge_general') },

		// Streaming & Quick Actions
		{ key: 'L', title: i18n.t('shortcut_title_l'), description: i18n.t('shortcut_l'), category: 'streaming', badge: i18n.t('badge_stage') },
		{ key: 'O', title: i18n.t('shortcut_title_o'), description: i18n.t('shortcut_o'), category: 'streaming', badge: i18n.t('badge_obs') },
		{ key: 'S', title: i18n.t('shortcut_title_s'), description: i18n.t('shortcut_s'), category: 'streaming', badge: i18n.t('badge_capture') },
		{ key: '1 - 9, 0', title: i18n.t('shortcut_title_numbers'), description: i18n.t('shortcut_numbers'), category: 'streaming', badge: i18n.t('badge_themes') }
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
			class="w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border transition-colors duration-200 {
				isLightTheme
					? 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
					: 'bg-zinc-950/98 text-zinc-100 border-zinc-800'
			}"
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b flex items-center justify-between {
				isLightTheme
					? 'border-zinc-200 bg-zinc-50'
					: 'border-zinc-800/80 bg-zinc-900/60'
			}">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-500 shadow-sm">
						<Keyboard class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-base font-bold tracking-wide flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							{i18n.t('shortcuts_title')}
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-mono font-semibold">STUDIO CHEATSHEET</span>
						</h2>
						<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
							{i18n.t('shortcuts_subtitle')}
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isShortcutModalOpen = false)}
					class="p-2 rounded-xl transition-colors cursor-pointer {
						isLightTheme
							? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
							: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
					}"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Filter & Search Toolbar -->
			<div class="px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 {
				isLightTheme
					? 'border-zinc-200 bg-zinc-100/50'
					: 'border-zinc-800/70 bg-zinc-900/30'
			}">
				<!-- Category Filter Tabs -->
				<div class="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
					<button
						onclick={() => (selectedCategory = 'all')}
						class="px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer {
							selectedCategory === 'all'
								? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
								: isLightTheme
									? 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200'
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
								: isLightTheme
									? 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200'
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
								: isLightTheme
									? 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200'
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
								: isLightTheme
									? 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200'
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
								: isLightTheme
									? 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 border border-zinc-200'
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
						class="w-full pl-9 pr-3 py-1.5 border rounded-xl text-xs transition-colors focus:outline-none focus:border-cyan-500 {
							isLightTheme
								? 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
								: 'bg-zinc-900/90 border-zinc-800 text-zinc-200 placeholder-zinc-500'
						}"
					/>
				</div>
			</div>

			<!-- Shortcuts Grid Body -->
			<div class="p-6 overflow-y-auto max-h-[60vh] space-y-4">
				{#if filteredShortcuts.length === 0}
					<div class="py-12 flex flex-col items-center justify-center text-center text-zinc-500 gap-2">
						<Keyboard class="w-10 h-10 stroke-[1.5] text-zinc-500" />
						<p class="text-xs">{i18n.t('shortcut_no_results')}</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each filteredShortcuts as item}
							<div
								class="p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-sm group {
									isLightTheme
										? 'bg-zinc-50/80 border-zinc-200 hover:border-cyan-500/50 hover:bg-white'
										: 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/90'
								}"
							>
								<div class="flex items-start justify-between gap-2">
									<div class="space-y-1 min-w-0">
										<div class="flex items-center gap-1.5 flex-wrap">
											<span class="font-bold text-xs transition-colors {
												isLightTheme
													? 'text-zinc-800 group-hover:text-cyan-600'
													: 'text-zinc-200 group-hover:text-cyan-300'
											}">
												{item.title}
											</span>
											{#if item.badge}
												<span class="text-[9px] px-1.5 py-0.2 rounded-md font-mono {
													isLightTheme
														? 'bg-zinc-200/80 text-zinc-600'
														: 'bg-zinc-800/90 text-zinc-400'
												}">
													{item.badge}
												</span>
											{/if}
										</div>
										<p class="text-[11px] leading-relaxed {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
											{item.description}
										</p>
									</div>
								</div>

								<!-- Keyboard Cap (KBD) Badge -->
								<div class="flex items-center justify-end pt-2 border-t {
									isLightTheme ? 'border-zinc-200' : 'border-zinc-800/60'
								}">
									<kbd
										class="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider {
											isLightTheme
												? 'bg-white border border-zinc-300 text-cyan-700 shadow-sm'
												: 'bg-zinc-950/90 border border-zinc-700/80 text-cyan-300 shadow-[0_2px_0_0_rgba(255,255,255,0.1),inset_0_1px_0_0_rgba(255,255,255,0.15)]'
										}"
									>
										{item.key}
									</kbd>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Pro Tip Banner -->
				<div class="p-3.5 rounded-2xl flex items-start gap-3 mt-4 border {
					isLightTheme
						? 'bg-cyan-50 border-cyan-200 text-zinc-800'
						: 'bg-cyan-950/20 border-cyan-800/40 text-zinc-300'
				}">
					<HelpCircle class="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
					<div class="text-[11px] leading-relaxed">
						<span class="font-bold text-cyan-600 dark:text-cyan-300">{i18n.t('shortcut_pro_tip_title')}</span>
						<span>{i18n.t('shortcut_pro_tip_desc')}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
