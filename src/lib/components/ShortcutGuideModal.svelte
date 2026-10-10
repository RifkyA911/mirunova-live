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
		HelpCircle
	} from 'lucide-svelte';

	interface ShortcutItem {
		key: string;
		description: string;
		category: 'tracking' | 'navigation' | 'streaming';
	}

	let shortcuts = $derived<ShortcutItem[]>([
		// Vision Tracking & Audio
		{ key: 'Space', description: i18n.t('shortcut_space'), category: 'tracking' },
		{ key: 'V', description: i18n.t('shortcut_v'), category: 'tracking' },
		{ key: 'C', description: i18n.t('shortcut_c'), category: 'tracking' },
		{ key: 'P', description: i18n.t('shortcut_p'), category: 'tracking' },
		{ key: 'B', description: i18n.t('shortcut_b'), category: 'tracking' },

		// Navigasi Studio
		{ key: 'H', description: i18n.t('shortcut_h'), category: 'navigation' },
		{ key: 'M', description: i18n.t('shortcut_m'), category: 'navigation' },
		{ key: 'T', description: i18n.t('shortcut_t'), category: 'navigation' },
		{ key: 'R', description: i18n.t('shortcut_r'), category: 'navigation' },
		{ key: 'F2 / ,', description: i18n.t('shortcut_f2'), category: 'navigation' },
		{ key: 'F1 / ?', description: i18n.t('shortcut_f1'), category: 'navigation' },
		{ key: 'Esc', description: i18n.t('shortcut_esc'), category: 'navigation' },

		// Streaming & Themes
		{ key: 'L', description: i18n.t('shortcut_l'), category: 'streaming' },
		{ key: 'O', description: i18n.t('shortcut_o'), category: 'streaming' },
		{ key: 'S', description: i18n.t('shortcut_s'), category: 'streaming' },
		{ key: '1 - 9, 0', description: i18n.t('shortcut_numbers'), category: 'streaming' }
	]);

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
		class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
	>
		<div
			class="w-full max-w-5xl xl:max-w-6xl bg-zinc-950/98 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
						<Keyboard class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-sm sm:text-base font-bold tracking-wide flex items-center gap-2">
							{i18n.t('shortcuts_title')}
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">HOTKEYS</span>
						</h2>
						<p class="text-xs text-zinc-400">
							{i18n.t('shortcuts_subtitle')}
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isShortcutModalOpen = false)}
					class="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Body (3-Column Responsive Grid) -->
			<div class="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
				<!-- Category 1: Vision Tracking -->
				<div>
					<h3 class="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
						<Camera class="w-3.5 h-3.5" />
						{i18n.t('shortcut_cat_tracking')}
					</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each shortcuts.filter((s) => s.category === 'tracking') as item}
							<div class="flex items-center justify-between p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl">
								<span class="text-zinc-300 text-xs">{item.description}</span>
								<kbd class="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-[11px] font-mono font-semibold text-cyan-300 shadow-sm shrink-0 ml-2">
									{item.key}
								</kbd>
							</div>
						{/each}
					</div>
				</div>

				<!-- Category 2: Navigation & Studio Panels -->
				<div>
					<h3 class="text-[11px] font-semibold text-violet-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
						<Sliders class="w-3.5 h-3.5" />
						{i18n.t('shortcut_cat_navigation')}
					</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each shortcuts.filter((s) => s.category === 'navigation') as item}
							<div class="flex items-center justify-between p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl">
								<span class="text-zinc-300 text-xs">{item.description}</span>
								<kbd class="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-[11px] font-mono font-semibold text-violet-300 shadow-sm shrink-0 ml-2">
									{item.key}
								</kbd>
							</div>
						{/each}
					</div>
				</div>

				<!-- Category 3: Streaming & Quick Actions -->
				<div>
					<h3 class="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
						<Radio class="w-3.5 h-3.5" />
						{i18n.t('shortcut_cat_streaming')}
					</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each shortcuts.filter((s) => s.category === 'streaming') as item}
							<div class="flex items-center justify-between p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl">
								<span class="text-zinc-300 text-xs">{item.description}</span>
								<kbd class="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-[11px] font-mono font-semibold text-emerald-300 shadow-sm shrink-0 ml-2">
									{item.key}
								</kbd>
							</div>
						{/each}
					</div>
				</div>

				<!-- Pro Streamer Tips -->
				<div class="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl flex items-start gap-2.5 col-span-1 md:col-span-3">
					<HelpCircle class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
					<div class="text-[11px] text-zinc-400 leading-relaxed">
						<span class="text-cyan-300 font-semibold">{i18n.t('shortcut_pro_tip_title')}</span> {i18n.t('shortcut_pro_tip_desc')}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
