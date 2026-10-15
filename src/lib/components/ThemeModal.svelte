<script lang="ts">
	import { rigging, UI_THEMES } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import type { BackgroundStyle, ScreenEffect, UITheme } from '#lib/types/tracking';
	import {
		Palette,
		X,
		Check,
		Image,
		Sparkles,
		Layers,
		Sun,
		Moon,
		Wand2,
		Eye,
		Sliders,
		CheckCircle2,
		Compass
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let fileInputEl = $state<HTMLInputElement>();
	let themeCategory = $state<'all' | 'light' | 'dark' | 'custom'>('all');

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	const lightThemes = $derived(
		UI_THEMES.filter((t) => ['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(t.id))
	);
	const darkThemes = $derived(
		UI_THEMES.filter(
			(t) => !['light', 'light-cyan-sea', 'sakura-light', 'matcha-light', 'custom'].includes(t.id)
		)
	);
	const allSelectableThemes = $derived(
		UI_THEMES.filter((t) => t.id !== 'custom')
	);

	const customPresets = [
		{
			name: '🌸 Sakura Bloom',
			bg: '#fff5f8',
			surface: '#ffffff',
			accent: '#FA7FC2',
			border: '#F5B7CE',
			text: '#4a044e'
		},
		{
			name: '🍵 Matcha Zen',
			bg: '#f0fdf4',
			surface: '#ffffff',
			accent: '#16a34a',
			border: '#bbf7d0',
			text: '#14532d'
		},
		{
			name: '⚡ Cyber Neon',
			bg: '#09090b',
			surface: '#13111c',
			accent: '#00f0ff',
			border: '#7000ff',
			text: '#f1f5f9'
		},
		{
			name: '🌌 Cosmic Violet',
			bg: '#0d0714',
			surface: '#190f28',
			accent: '#a855f7',
			border: '#6b21a8',
			text: '#faf5ff'
		},
		{
			name: '🍊 Sunset Amber',
			bg: '#1c0f0a',
			surface: '#291811',
			accent: '#f97316',
			border: '#ea580c',
			text: '#fff7ed'
		},
		{
			name: '💎 Arctic Ice',
			bg: '#0f172a',
			surface: '#1e293b',
			accent: '#38bdf8',
			border: '#0ea5e9',
			text: '#f0f9ff'
		}
	];

	function selectTheme(themeId: UITheme) {
		playSfx('theme');
		rigging.setUITheme(themeId);
	}

	function applyCustomPreset(preset: (typeof customPresets)[0]) {
		playSfx('theme');
		rigging.setCustomThemeColors({
			bg: preset.bg,
			surface: preset.surface,
			accent: preset.accent,
			border: preset.border,
			text: preset.text
		});
		rigging.setUITheme('custom');
	}

	const presetColors = [
		{ hex: '#09090b', name: 'Obsidian Zinc' },
		{ hex: '#030712', name: 'Abyss Black' },
		{ hex: '#0f172a', name: 'Midnight Slate' },
		{ hex: '#1e1b4b', name: 'Cyber Indigo' },
		{ hex: '#2e1065', name: 'Neon Violet' },
		{ hex: '#064e3b', name: 'Deep Emerald' },
		{ hex: '#4c0519', name: 'Crimson Wine' },
		{ hex: '#fff5f8', name: 'Sakura White' },
		{ hex: '#f0fdf4', name: 'Matcha White' },
		{ hex: '#00ff00', name: 'Chroma Green' },
		{ hex: '#0000ff', name: 'Chroma Blue' },
		{ hex: '#f8fafc', name: 'Studio White' }
	];

	const bgStyles: Array<{ id: BackgroundStyle; label: string; desc: string; previewClass: string }> = [
		{ id: 'solid', label: 'Solid Color', desc: 'Warna latar bersih sesuai palet', previewClass: 'border-zinc-700' },
		{ id: 'transparent', label: 'Transparent', desc: 'OBS Browser overlay stream', previewClass: 'bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[size:10px_10px]' },
		{ id: 'mesh', label: 'Cyber Mesh Grid', desc: 'Wireframe kotak-kotak kontras', previewClass: 'bg-zinc-950 bg-[linear-gradient(to_right,#06b6d433_1px,transparent_1px),linear-gradient(to_bottom,#06b6d433_1px,transparent_1px)] bg-[size:12px_12px]' },
		{ id: 'grid', label: 'Tech Grid Paper', desc: 'Wireframe grafik presisi cyber', previewClass: 'bg-zinc-900 bg-[linear-gradient(to_right,#3f3f4640_1px,transparent_1px),linear-gradient(to_bottom,#3f3f4640_1px,transparent_1px)] bg-[size:8px_8px]' },
		{ id: 'dots', label: 'Anime Polka Dots', desc: 'Pola titik estetik anime', previewClass: 'bg-zinc-950 bg-[radial-gradient(#38bdf840_1.5px,transparent_1.5px)] bg-[size:8px_8px]' },
		{ id: 'cosmic', label: 'Cosmic Animated', desc: 'Drifting nebula panggung', previewClass: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950' },
		{ id: 'gradient', label: 'Deep Gradient', desc: 'Gradien halus ke luar angkasa', previewClass: 'bg-gradient-to-b from-zinc-900 via-indigo-950 to-zinc-950' },
		{ id: 'chroma', label: 'Chroma Key Green', desc: 'Layar hijau jernih untuk OBS', previewClass: 'bg-[#00FF00]' },
		{ id: 'custom-image', label: 'Custom Wallpaper', desc: 'Upload file gambar Anda', previewClass: 'bg-gradient-to-r from-violet-900 to-indigo-900' }
	];

	const screenEffects: Array<{ id: ScreenEffect; label: string }> = [
		{ id: 'none', label: 'None' },
		{ id: 'vignette', label: 'Vignette' },
		{ id: 'scanlines', label: 'Scanlines' },
		{ id: 'crt', label: 'CRT Glow' },
		{ id: 'blur', label: 'Subtle Blur' }
	];

	function handleImageUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		rigging.customBgUrl = URL.createObjectURL(file);
		rigging.backgroundStyle = 'custom-image';
	}
</script>

{#if rigging.isThemeModalOpen}
	<!-- Backdrop Modal (Click outside to close) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) rigging.isThemeModalOpen = false;
		}}
		class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
	>
		<!-- Studio Theme Modal Dialog Card -->
		<div
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			class="w-full max-w-5xl xl:max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-200 border {
				isLightTheme
					? 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
					: 'bg-zinc-950 text-zinc-100 border-zinc-800 shadow-2xl'
			}"
		>
			<!-- Header -->
			<div
				class="px-6 py-4.5 border-b flex items-center justify-between shrink-0 {
					isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
				}"
			>
				<div class="flex items-center gap-3">
					<div
						class="p-2.5 rounded-2xl flex items-center justify-center {
							isLightTheme ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
						}"
					>
						<Palette class="w-5 h-5" />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="text-sm sm:text-base font-extrabold tracking-wide">
								{i18n.t('themes_bg')}
							</h2>
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
								13 Color Palettes
							</span>
						</div>
						<p class="text-xs text-zinc-400 mt-0.5">
							{i18n.t('themes_sub')}
						</p>
					</div>
				</div>

				<button
					onclick={() => (rigging.isThemeModalOpen = false)}
					class="p-2 rounded-xl transition-colors cursor-pointer {
						isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
					}"
					aria-label={i18n.t('close_btn')}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Body Content -->
			<div class="p-6 overflow-y-auto space-y-6 text-xs custom-scrollbar">
				<!-- Category Filter Pill Tabs -->
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 {
					isLightTheme ? 'border-zinc-200' : 'border-zinc-800/70'
				}">
					<div class="flex items-center gap-2">
						<Compass class="w-4 h-4 text-cyan-400" />
						<span class="text-xs font-bold uppercase tracking-wider {isLightTheme ? 'text-zinc-700' : 'text-zinc-200'}">
							{i18n.t('theme_selector_title')}
						</span>
					</div>

					<div class="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border {
						isLightTheme ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
					}">
						<!-- All -->
						<button
							type="button"
							onclick={() => (themeCategory = 'all')}
							class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {
								themeCategory === 'all'
									? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/25'
									: 'text-zinc-400 hover:text-zinc-200'
							}"
						>
							<span>{i18n.t('themes_all_filter')}</span>
							<span class="text-[10px] px-1.5 py-0.2 rounded font-mono {themeCategory === 'all' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}">13</span>
						</button>

						<!-- Daylight -->
						<button
							type="button"
							onclick={() => (themeCategory = 'light')}
							class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {
								themeCategory === 'light'
									? 'bg-amber-400 text-amber-950 font-bold shadow-md shadow-amber-400/25'
									: 'text-zinc-400 hover:text-zinc-200'
							}"
						>
							<Sun class="w-3.5 h-3.5" />
							<span>{i18n.t('themes_daylight_filter')}</span>
							<span class="text-[10px] px-1.5 py-0.2 rounded font-mono {themeCategory === 'light' ? 'bg-amber-950/20 text-amber-950' : 'bg-zinc-800 text-zinc-400'}">4</span>
						</button>

						<!-- Dark & Neon -->
						<button
							type="button"
							onclick={() => (themeCategory = 'dark')}
							class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {
								themeCategory === 'dark'
									? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/25'
									: 'text-zinc-400 hover:text-zinc-200'
							}"
						>
							<Moon class="w-3.5 h-3.5" />
							<span>{i18n.t('themes_dark_filter')}</span>
							<span class="text-[10px] px-1.5 py-0.2 rounded font-mono {themeCategory === 'dark' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}">8</span>
						</button>

						<!-- Custom Studio -->
						<button
							type="button"
							onclick={() => (themeCategory = 'custom')}
							class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {
								themeCategory === 'custom'
									? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/25'
									: 'text-zinc-400 hover:text-zinc-200'
							}"
						>
							<Wand2 class="w-3.5 h-3.5" />
							<span>{i18n.t('themes_custom_filter')}</span>
							<span class="text-[10px] px-1.5 py-0.2 rounded font-mono bg-white/20 text-white">PRO</span>
						</button>
					</div>
				</div>

				<!-- THEMES GRID (ALL / LIGHT / DARK) -->
				{#if themeCategory !== 'custom'}
					{@const displayList = themeCategory === 'all' ? allSelectableThemes : (themeCategory === 'light' ? lightThemes : darkThemes)}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-150">
						{#each displayList as theme}
							{@const isSelected = rigging.uiTheme === theme.id}
							<button
								type="button"
								onclick={() => selectTheme(theme.id)}
								class="flex flex-col p-3.5 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden {
									isSelected
										? 'ring-2 ring-cyan-400 shadow-xl border-cyan-400'
										: (isLightTheme ? 'bg-zinc-50 hover:bg-zinc-100/90 border-zinc-200' : 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800')
								}"
							>
								<!-- Realistic Mini UI Preview Box -->
								<div
									class="w-full h-24 rounded-xl border p-2 flex flex-col justify-between mb-3 shadow-inner relative overflow-hidden transition-transform group-hover:scale-[1.01]"
									style="background-color: {theme.palette.bg}; border-color: {theme.palette.border}; color: {theme.palette.text};"
								>
									<!-- Mini Mockup Top Bar -->
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-1">
											<div class="w-2 h-2 rounded-full" style="background-color: {theme.palette.accent};"></div>
											<span class="text-[9px] font-bold font-mono tracking-wider opacity-90 truncate max-w-[100px]" style="color: {theme.palette.text};">
												{theme.name}
											</span>
										</div>
										<span
											class="text-[8px] px-1.5 py-0.5 rounded font-mono font-semibold"
											style="background-color: {theme.palette.surface}; color: {theme.palette.accent}; border: 1px solid {theme.palette.border};"
										>
											{theme.badge}
										</span>
									</div>

									<!-- Mini Mockup Center Surface Card -->
									<div
										class="p-1.5 rounded-lg border flex items-center justify-between"
										style="background-color: {theme.palette.surface}; border-color: {theme.palette.border};"
									>
										<div class="flex items-center gap-1.5">
											<div class="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-bold" style="background-color: {theme.palette.accent}; color: {theme.palette.bg};">
												★
											</div>
											<span class="text-[9px] font-medium" style="color: {theme.palette.text};">Live Rigging</span>
										</div>
										<!-- Mini active toggle -->
										<div class="w-5 h-2.5 rounded-full flex items-center px-0.5" style="background-color: {theme.palette.accent};">
											<div class="w-1.5 h-1.5 rounded-full ml-auto" style="background-color: {theme.palette.bg};"></div>
										</div>
									</div>

									<!-- Mini Mockup Bottom Dock Strip -->
									<div class="flex items-center gap-1">
										<div class="w-4 h-2 rounded" style="background-color: {theme.palette.accent};"></div>
										<div class="w-4 h-2 rounded" style="background-color: {theme.palette.border}; opacity: 0.7;"></div>
										<div class="w-4 h-2 rounded" style="background-color: {theme.palette.surface}; opacity: 0.9;"></div>
									</div>
								</div>

								<!-- Theme Info Header -->
								<div class="flex items-center justify-between w-full mb-1">
									<div class="flex items-center gap-1.5">
										<span class="font-bold text-xs {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
											{theme.name}
										</span>
									</div>
									{#if isSelected}
										<div class="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-400 text-zinc-950 font-bold text-[9px]">
											<Check class="w-3 h-3 stroke-[3]" />
											<span>{i18n.t('theme_active_badge')}</span>
										</div>
									{/if}
								</div>

								<p class="text-[10px] text-zinc-400 leading-tight mb-3 line-clamp-2">
									{theme.desc}
								</p>

								<!-- 5-Color Complete Palette Strip -->
								<div class="mt-auto pt-2 border-t flex flex-col gap-1.5 {isLightTheme ? 'border-zinc-200' : 'border-zinc-800'}">
									<div class="flex items-center justify-between text-[9px] text-zinc-400 font-medium">
										<span>Color Palette</span>
										<span class="font-mono">{theme.palette.bg}</span>
									</div>
									<div class="grid grid-cols-5 gap-1">
										<div class="flex flex-col items-center gap-0.5" title="Background: {theme.palette.bg}">
											<div class="w-full h-3.5 rounded border border-black/10 shadow-sm" style="background-color: {theme.palette.bg};"></div>
											<span class="text-[8px] font-mono text-zinc-400">{i18n.t('themes_palette_bg')}</span>
										</div>
										<div class="flex flex-col items-center gap-0.5" title="Surface: {theme.palette.surface}">
											<div class="w-full h-3.5 rounded border border-black/10 shadow-sm" style="background-color: {theme.palette.surface};"></div>
											<span class="text-[8px] font-mono text-zinc-400">{i18n.t('themes_palette_card')}</span>
										</div>
										<div class="flex flex-col items-center gap-0.5" title="Accent: {theme.palette.accent}">
											<div class="w-full h-3.5 rounded border border-black/10 shadow-sm" style="background-color: {theme.palette.accent};"></div>
											<span class="text-[8px] font-mono text-zinc-400">{i18n.t('themes_palette_accent')}</span>
										</div>
										<div class="flex flex-col items-center gap-0.5" title="Border: {theme.palette.border}">
											<div class="w-full h-3.5 rounded border border-black/10 shadow-sm" style="background-color: {theme.palette.border};"></div>
											<span class="text-[8px] font-mono text-zinc-400">{i18n.t('themes_palette_border')}</span>
										</div>
										<div class="flex flex-col items-center gap-0.5" title="Text: {theme.palette.text}">
											<div class="w-full h-3.5 rounded border border-black/10 shadow-sm" style="background-color: {theme.palette.text};"></div>
											<span class="text-[8px] font-mono text-zinc-400">{i18n.t('themes_palette_text')}</span>
										</div>
									</div>
								</div>
							</button>
						{/each}
					</div>

				<!-- TAB CONTENT: CUSTOM THEME STUDIO -->
				{:else}
					<div class="p-6 rounded-3xl border space-y-6 animate-in fade-in duration-150 {
						isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
					}">
						<!-- Curated 1-Click Presets -->
						<div>
							<div class="flex items-center justify-between mb-3">
								<span class="text-xs font-bold uppercase tracking-wider {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
									{i18n.t('themes_presets_1click')}
								</span>
								<span class="text-[10px] text-zinc-400">{i18n.t('themes_presets_sub')}</span>
							</div>

							<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
								{#each customPresets as preset}
									<button
										type="button"
										onclick={() => applyCustomPreset(preset)}
										class="p-3 rounded-2xl border transition-all text-left flex flex-col gap-2 cursor-pointer hover:scale-105 active:scale-95 {
											isLightTheme ? 'bg-white border-zinc-200 hover:border-zinc-400 shadow-sm' : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
										}"
									>
										<span class="font-bold text-xs truncate {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
											{preset.name}
										</span>
										<div class="flex items-center gap-1.5">
											<div class="w-4 h-4 rounded-full border border-black/20 shadow-sm" style="background-color: {preset.bg};" title="BG: {preset.bg}"></div>
											<div class="w-4 h-4 rounded-full border border-black/20 shadow-sm" style="background-color: {preset.accent};" title="Accent: {preset.accent}"></div>
											<div class="w-4 h-4 rounded-full border border-black/20 shadow-sm" style="background-color: {preset.border};" title="Border: {preset.border}"></div>
											<div class="w-4 h-4 rounded-full border border-black/20 shadow-sm" style="background-color: {preset.text};" title="Text: {preset.text}"></div>
										</div>
									</button>
								{/each}
							</div>
						</div>

						<!-- 5-Color Picker Sliders & Hex Controls -->
						<div class="space-y-2">
							<span class="text-xs font-bold uppercase tracking-wider block {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
								{i18n.t('themes_custom_5col')}
							</span>

							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
								<!-- 1. Background -->
								<div class="p-3 rounded-2xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
									<label for="th-bg" class="text-[11px] font-bold text-zinc-400 block">1. {i18n.t('themes_palette_bg')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-bg"
											type="color"
											bind:value={rigging.customThemeConfig.bg}
											oninput={() => {
												rigging.setCustomThemeColors({ bg: rigging.customThemeConfig.bg });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-8 h-8 rounded-xl border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.bg}
											oninput={() => {
												rigging.setCustomThemeColors({ bg: rigging.customThemeConfig.bg });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 font-mono text-xs uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>

								<!-- 2. Surface -->
								<div class="p-3 rounded-2xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
									<label for="th-surface" class="text-[11px] font-bold text-zinc-400 block">2. {i18n.t('themes_palette_card')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-surface"
											type="color"
											bind:value={rigging.customThemeConfig.surface}
											oninput={() => {
												rigging.setCustomThemeColors({ surface: rigging.customThemeConfig.surface });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-8 h-8 rounded-xl border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.surface}
											oninput={() => {
												rigging.setCustomThemeColors({ surface: rigging.customThemeConfig.surface });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 font-mono text-xs uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>

								<!-- 3. Accent -->
								<div class="p-3 rounded-2xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
									<label for="th-accent" class="text-[11px] font-bold text-zinc-400 block">3. {i18n.t('themes_palette_accent')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-accent"
											type="color"
											bind:value={rigging.customThemeConfig.accent}
											oninput={() => {
												rigging.setCustomThemeColors({ accent: rigging.customThemeConfig.accent });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-8 h-8 rounded-xl border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.accent}
											oninput={() => {
												rigging.setCustomThemeColors({ accent: rigging.customThemeConfig.accent });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 font-mono text-xs uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>

								<!-- 4. Border -->
								<div class="p-3 rounded-2xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
									<label for="th-border" class="text-[11px] font-bold text-zinc-400 block">4. {i18n.t('themes_palette_border')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-border"
											type="color"
											bind:value={rigging.customThemeConfig.border}
											oninput={() => {
												rigging.setCustomThemeColors({ border: rigging.customThemeConfig.border });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-8 h-8 rounded-xl border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.border}
											oninput={() => {
												rigging.setCustomThemeColors({ border: rigging.customThemeConfig.border });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 font-mono text-xs uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>

								<!-- 5. Text -->
								<div class="p-3 rounded-2xl border space-y-1.5 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}">
									<label for="th-text" class="text-[11px] font-bold text-zinc-400 block">5. {i18n.t('themes_palette_text')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-text"
											type="color"
											bind:value={rigging.customThemeConfig.text}
											oninput={() => {
												rigging.setCustomThemeColors({ text: rigging.customThemeConfig.text });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-8 h-8 rounded-xl border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.text}
											oninput={() => {
												rigging.setCustomThemeColors({ text: rigging.customThemeConfig.text });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 font-mono text-xs uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>
							</div>
						</div>

						<!-- Live Custom Preview Bar & Apply -->
						<div
							class="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border shadow-lg"
							style="background-color: {rigging.customThemeConfig.surface}; border-color: {rigging.customThemeConfig.border}; color: {rigging.customThemeConfig.text};"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
									style="background-color: {rigging.customThemeConfig.accent}; color: {rigging.customThemeConfig.bg};"
								>
									★
								</div>
								<div>
									<h4 class="font-extrabold text-sm" style="color: {rigging.customThemeConfig.text};">
										{i18n.t('themes_preview_title')}
									</h4>
									<p class="text-xs opacity-85">
										{i18n.t('themes_preview_sub')}
									</p>
								</div>
							</div>

							<div class="flex items-center gap-2.5">
								<button
									type="button"
									onclick={() => {
										playSfx('theme');
										rigging.setUITheme('custom');
									}}
									class="px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95"
									style="background-color: {rigging.customThemeConfig.accent}; color: {rigging.customThemeConfig.bg};"
								>
									{#if rigging.uiTheme === 'custom'}
										<Check class="w-4 h-4 stroke-[3]" />
										<span>{i18n.t('themes_applied_badge')}</span>
									{:else}
										<Wand2 class="w-4 h-4" />
										<span>{i18n.t('themes_apply_btn')}</span>
									{/if}
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- STAGE BACKGROUND & SCREEN EFFECTS SECTION -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t {isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'}">
					<!-- Stage Background Style Mode -->
					<div class="space-y-3">
						<h3 class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
							<Layers class="w-4 h-4 text-cyan-400" />
							<span>{i18n.t('bg_mode')}</span>
						</h3>
						<div class="grid grid-cols-3 gap-2">
							{#each bgStyles as style}
								{@const isSelectedBg = rigging.backgroundStyle === style.id}
								<button
									type="button"
									onclick={() => {
										playSfx('click');
										rigging.backgroundStyle = style.id;
										if (style.id === 'custom-image' && !rigging.customBgUrl) {
											fileInputEl?.click();
										}
									}}
									class="flex flex-col p-2 rounded-xl border text-left transition-all cursor-pointer overflow-hidden {
										isSelectedBg
											? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-semibold shadow-sm ring-1 ring-cyan-500/40'
											: (isLightTheme ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-600' : 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800/80 text-zinc-400')
									}"
								>
									<!-- Miniature Visual Preview Box -->
									<div class="w-full h-8 rounded-lg border border-zinc-700/60 overflow-hidden mb-1.5 relative flex items-center justify-center shadow-inner {style.previewClass}"
										style={style.id === 'solid' ? `background-color: ${rigging.backgroundColor};` : (style.id === 'custom-image' && rigging.customBgUrl ? `background-image: url(${rigging.customBgUrl}); background-size: cover; background-position: center;` : '')}
									>
										{#if isSelectedBg}
											<div class="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-cyan-500 text-zinc-950 flex items-center justify-center shadow">
												<Check class="w-2.5 h-2.5 stroke-[3]" />
											</div>
										{/if}
									</div>

									<div class="flex items-center justify-between w-full mb-0.5">
										<span class="font-bold text-xs truncate">{style.label}</span>
									</div>
									<span class="text-[10px] opacity-75 leading-tight line-clamp-1">{style.desc}</span>
								</button>
							{/each}
						</div>

						<!-- Custom Wallpaper Upload Box -->
						{#if rigging.backgroundStyle === 'custom-image'}
							<div class="mt-2.5 p-3 rounded-xl border flex items-center justify-between {
								isLightTheme ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900/80 border-zinc-800'
							}">
								<span class="text-xs text-zinc-400">
									{rigging.customBgUrl ? i18n.t('image_loaded') : i18n.t('no_image_uploaded')}
								</span>
								<button
									type="button"
									onclick={() => fileInputEl?.click()}
									class="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
								>
									<Image class="w-3.5 h-3.5" />
									{i18n.t('upload_image')}
								</button>
								<input
									type="file"
									accept="image/*"
									bind:this={fileInputEl}
									onchange={handleImageUpload}
									class="hidden"
								/>
							</div>
						{/if}
					</div>

					<!-- Stage Color Presets & Screen Effects -->
					<div class="space-y-4">
						<!-- Stage Color Presets -->
						<div class="space-y-2">
							<h3 class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
								<Palette class="w-4 h-4 text-cyan-400" />
								<span>{i18n.t('bg_color')}</span>
							</h3>
							<div class="flex flex-wrap gap-2">
								{#each presetColors as preset}
									{@const isSelectedCol = rigging.backgroundColor.toLowerCase() === preset.hex.toLowerCase()}
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											rigging.backgroundColor = preset.hex;
										}}
										class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer {
											isSelectedCol ? 'border-cyan-400 scale-110 shadow-md shadow-cyan-400/30' : 'border-zinc-700'
										}"
										style="background-color: {preset.hex};"
										title="{preset.name} ({preset.hex})"
									>
										{#if isSelectedCol}
											<Check class="w-3.5 h-3.5 {['#f8fafc', '#00ff00', '#fff5f8', '#f0fdf4'].includes(preset.hex) ? 'text-black' : 'text-white'}" />
										{/if}
									</button>
								{/each}
							</div>

							<!-- Custom Stage Hex Input -->
							<div class="flex items-center gap-2 p-2 rounded-xl border {
								isLightTheme ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
							}">
								<input
									type="color"
									bind:value={rigging.backgroundColor}
									class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
								/>
								<span class="text-zinc-400 font-mono text-xs font-bold">HEX:</span>
								<input
									type="text"
									bind:value={rigging.backgroundColor}
									placeholder="#09090b"
									class="flex-1 bg-transparent font-mono text-xs uppercase focus:outline-none {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}"
								/>
								<div class="w-4 h-4 rounded border border-black/20" style="background-color: {rigging.backgroundColor};"></div>
							</div>
						</div>

						<!-- Screen Post-Processing Effects -->
						<div class="space-y-2">
							<h3 class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
								<Sparkles class="w-4 h-4 text-cyan-400" />
								<span>{i18n.t('bg_effects')}</span>
							</h3>
							<div class="grid grid-cols-5 gap-1.5">
								{#each screenEffects as eff}
									{@const isSelectedEff = rigging.screenEffect === eff.id}
									<button
										type="button"
										onclick={() => {
											playSfx('click');
											rigging.screenEffect = eff.id;
										}}
										class="py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer text-xs {
											isSelectedEff
												? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm'
												: (isLightTheme ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-600' : 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800/80 text-zinc-400')
										}"
									>
										{eff.label}
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
