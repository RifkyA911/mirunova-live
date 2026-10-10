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
		Sliders
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let fileInputEl = $state<HTMLInputElement>();
	let themeCategory = $state<'light' | 'dark' | 'custom'>('light');

	// Group themes by category
	const lightThemes = $derived(
		UI_THEMES.filter((t) => ['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(t.id))
	);
	const darkThemes = $derived(
		UI_THEMES.filter(
			(t) =>
				!['light', 'light-cyan-sea', 'sakura-light', 'matcha-light', 'custom'].includes(t.id)
		)
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

	const bgStyles: Array<{ id: BackgroundStyle; label: string; desc: string }> = [
		{ id: 'transparent', label: 'Transparent', desc: 'OBS Browser Source overlay' },
		{ id: 'solid', label: 'Solid Color', desc: 'Clean background using active color' },
		{ id: 'mesh', label: 'Cyber Mesh (Kotak-Kotak)', desc: 'High-contrast square wireframe mesh grid' },
		{ id: 'grid', label: 'Tech Grid', desc: 'Cyberpunk graph paper wireframe' },
		{ id: 'dots', label: 'Polka Dots', desc: 'Anime style patterned dots' },
		{ id: 'cosmic', label: 'Cosmic Animated', desc: 'Slow drifting deep-space nebula' },
		{ id: 'gradient', label: 'Deep Gradient', desc: 'Smooth gradient to deep space' },
		{ id: 'chroma', label: 'Chroma Key', desc: 'High saturation green for keying' },
		{ id: 'custom-image', label: 'Custom Image', desc: 'User uploaded image or wallpaper' }
	];

	const screenEffects: Array<{ id: ScreenEffect; label: string }> = [
		{ id: 'none', label: 'None' },
		{ id: 'vignette', label: 'Vignette' },
		{ id: 'scanlines', label: 'Retro Scanlines' },
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
		class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
	>
		<div
			class="w-full max-w-5xl xl:max-w-6xl bg-zinc-950/98 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="px-6 py-4.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
						<Palette class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-sm sm:text-base font-bold tracking-wide flex items-center gap-2">
							<span>{i18n.t('themes_bg')}</span>
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 font-mono">13 Themes</span>
						</h2>
						<p class="text-xs text-zinc-400">
							Kustomisasi tema antarmuka terang/gelap, studio palet warna kustom, latar belakang, dan efek panggung
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isThemeModalOpen = false)}
					class="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Body Content -->
			<div class="p-6 overflow-y-auto space-y-6 text-xs custom-scrollbar">
				<!-- 1. UI Theme Toggler with Categorized Tabs -->
				<div class="space-y-3">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/70 pb-2">
						<div class="flex items-center gap-2">
							<Palette class="w-4 h-4 text-cyan-400" />
							<h3 class="text-xs font-bold text-zinc-200 uppercase tracking-wider">
								{i18n.t('ui_theme')} — {i18n.t('swatch_palette')}
							</h3>
						</div>

						<!-- Category Switcher Pill Tabs -->
						<div class="flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
							<button
								type="button"
								onclick={() => (themeCategory = 'light')}
								class="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {
									themeCategory === 'light'
										? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
										: 'text-zinc-400 hover:text-zinc-200'
								}"
							>
								<Sun class="w-3.5 h-3.5" />
								<span>{i18n.t('theme_category_light')}</span>
								<span class="text-[9px] px-1 py-0.2 rounded bg-zinc-800 font-mono text-zinc-400">4</span>
							</button>

							<button
								type="button"
								onclick={() => (themeCategory = 'dark')}
								class="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {
									themeCategory === 'dark'
										? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
										: 'text-zinc-400 hover:text-zinc-200'
								}"
							>
								<Moon class="w-3.5 h-3.5" />
								<span>{i18n.t('theme_category_dark')}</span>
								<span class="text-[9px] px-1 py-0.2 rounded bg-zinc-800 font-mono text-zinc-400">8</span>
							</button>

							<button
								type="button"
								onclick={() => (themeCategory = 'custom')}
								class="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {
									themeCategory === 'custom'
										? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
										: 'text-zinc-400 hover:text-zinc-200'
								}"
							>
								<Wand2 class="w-3.5 h-3.5" />
								<span>{i18n.t('theme_category_custom')}</span>
								<span class="text-[9px] px-1 py-0.2 rounded bg-pink-500/20 text-pink-300 font-mono">PRO</span>
							</button>
						</div>
					</div>

					<!-- TAB CONTENT: LIGHT THEMES -->
					{#if themeCategory === 'light'}
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
							{#each lightThemes as theme}
								<button
									type="button"
									onclick={() => selectTheme(theme.id)}
									class="flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] {
										rigging.uiTheme === theme.id
											? 'bg-zinc-900 border-cyan-400 text-white shadow-lg ring-2 ring-cyan-400/30'
											: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
									}"
								>
									<div class="flex items-center justify-between w-full mb-1">
										<div class="flex items-center gap-1.5">
											<span class="font-bold text-xs text-zinc-100">{theme.name}</span>
											<span class="text-[9px] px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">{theme.badge}</span>
										</div>
										{#if rigging.uiTheme === theme.id}
											<div class="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-zinc-950">
												<Check class="w-3 h-3 stroke-[3]" />
											</div>
										{/if}
									</div>
									<p class="text-[10px] text-zinc-400 leading-tight mb-2.5 line-clamp-2">
										{theme.desc}
									</p>
									<!-- Color Swatches -->
									<div class="mt-auto pt-2 border-t border-zinc-800/80 flex items-center gap-1.5">
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.bg};" title="Background: {theme.palette.bg}"></div>
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.surface};" title="Surface: {theme.palette.surface}"></div>
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.accent};" title="Accent: {theme.palette.accent}"></div>
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.border};" title="Border: {theme.palette.border}"></div>
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.text};" title="Text: {theme.palette.text}"></div>
										<span class="text-[9px] font-mono text-zinc-500 ml-auto">{theme.bgHex}</span>
									</div>
								</button>
							{/each}
						</div>

					<!-- TAB CONTENT: DARK & NEON THEMES -->
					{:else if themeCategory === 'dark'}
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
							{#each darkThemes as theme}
								<button
									type="button"
									onclick={() => selectTheme(theme.id)}
									class="flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] {
										rigging.uiTheme === theme.id
											? 'bg-zinc-900 border-cyan-500 text-white shadow-lg ring-2 ring-cyan-500/30'
											: 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
									}"
								>
									<div class="flex items-center justify-between w-full mb-1">
										<div class="flex items-center gap-1.5">
											<span class="font-bold text-xs text-zinc-100">{theme.name}</span>
											<span class="text-[9px] px-1.5 py-0.2 rounded font-mono bg-zinc-800 text-zinc-400">{theme.badge}</span>
										</div>
										{#if rigging.uiTheme === theme.id}
											<div class="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-zinc-950">
												<Check class="w-3 h-3 stroke-[3]" />
											</div>
										{/if}
									</div>
									<p class="text-[10px] text-zinc-400 leading-tight mb-2.5 line-clamp-2">
										{theme.desc}
									</p>
									<!-- Color Swatches -->
									<div class="mt-auto pt-2 border-t border-zinc-800/80 flex items-center gap-1.5">
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.bg};" title="Background: {theme.palette.bg}"></div>
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.surface};" title="Surface: {theme.palette.surface}"></div>
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.accent};" title="Accent: {theme.palette.accent}"></div>
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.border};" title="Border: {theme.palette.border}"></div>
										<div class="w-3.5 h-3.5 rounded-full border border-zinc-700 shadow-sm" style="background-color: {theme.palette.text};" title="Text: {theme.palette.text}"></div>
										<span class="text-[9px] font-mono text-zinc-500 ml-auto">{theme.bgHex}</span>
									</div>
								</button>
							{/each}
						</div>

					<!-- TAB CONTENT: CUSTOM THEME STUDIO -->
					{:else if themeCategory === 'custom'}
						<div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-5 animate-in fade-in duration-150">
							<!-- Preset Quick Pickers -->
							<div>
								<span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
									{i18n.t('custom_presets_title')}
								</span>
								<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
									{#each customPresets as preset}
										<button
											type="button"
											onclick={() => applyCustomPreset(preset)}
											class="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left flex flex-col gap-1.5 cursor-pointer"
										>
											<span class="font-bold text-[11px] text-zinc-200 truncate">{preset.name}</span>
											<div class="flex items-center gap-1">
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {preset.bg};"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {preset.accent};"></div>
												<div class="w-3 h-3 rounded-full border border-zinc-700" style="background-color: {preset.border};"></div>
											</div>
										</button>
									{/each}
								</div>
							</div>

							<!-- Color Pickers Grid -->
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
								<!-- Background -->
								<div class="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800/90 space-y-1.5">
									<label for="th-bg" class="text-[11px] font-semibold text-zinc-400 block">{i18n.t('theme_custom_bg')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-bg"
											type="color"
											bind:value={rigging.customThemeConfig.bg}
											oninput={() => {
												rigging.setCustomThemeColors({ bg: rigging.customThemeConfig.bg });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.bg}
											oninput={() => {
												rigging.setCustomThemeColors({ bg: rigging.customThemeConfig.bg });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-[11px] uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>

								<!-- Surface -->
								<div class="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800/90 space-y-1.5">
									<label for="th-surface" class="text-[11px] font-semibold text-zinc-400 block">{i18n.t('theme_custom_surface')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-surface"
											type="color"
											bind:value={rigging.customThemeConfig.surface}
											oninput={() => {
												rigging.setCustomThemeColors({ surface: rigging.customThemeConfig.surface });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.surface}
											oninput={() => {
												rigging.setCustomThemeColors({ surface: rigging.customThemeConfig.surface });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-[11px] uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>

								<!-- Accent -->
								<div class="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800/90 space-y-1.5">
									<label for="th-accent" class="text-[11px] font-semibold text-zinc-400 block">{i18n.t('theme_custom_accent')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-accent"
											type="color"
											bind:value={rigging.customThemeConfig.accent}
											oninput={() => {
												rigging.setCustomThemeColors({ accent: rigging.customThemeConfig.accent });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.accent}
											oninput={() => {
												rigging.setCustomThemeColors({ accent: rigging.customThemeConfig.accent });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-[11px] uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>

								<!-- Border -->
								<div class="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800/90 space-y-1.5">
									<label for="th-border" class="text-[11px] font-semibold text-zinc-400 block">{i18n.t('theme_custom_border')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-border"
											type="color"
											bind:value={rigging.customThemeConfig.border}
											oninput={() => {
												rigging.setCustomThemeColors({ border: rigging.customThemeConfig.border });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.border}
											oninput={() => {
												rigging.setCustomThemeColors({ border: rigging.customThemeConfig.border });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-[11px] uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>

								<!-- Text -->
								<div class="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800/90 space-y-1.5">
									<label for="th-text" class="text-[11px] font-semibold text-zinc-400 block">{i18n.t('theme_custom_text')}</label>
									<div class="flex items-center gap-2">
										<input
											id="th-text"
											type="color"
											bind:value={rigging.customThemeConfig.text}
											oninput={() => {
												rigging.setCustomThemeColors({ text: rigging.customThemeConfig.text });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
										/>
										<input
											type="text"
											bind:value={rigging.customThemeConfig.text}
											oninput={() => {
												rigging.setCustomThemeColors({ text: rigging.customThemeConfig.text });
												if (rigging.uiTheme !== 'custom') rigging.setUITheme('custom');
											}}
											class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-[11px] uppercase text-zinc-100 focus:outline-none"
										/>
									</div>
								</div>
							</div>

							<!-- Live Preview & Apply Button -->
							<div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border"
								style="background-color: {rigging.customThemeConfig.surface}; border-color: {rigging.customThemeConfig.border}; color: {rigging.customThemeConfig.text};">
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
										style="background-color: {rigging.customThemeConfig.accent}; color: #ffffff;">
										★
									</div>
									<div>
										<h4 class="font-bold text-xs" style="color: {rigging.customThemeConfig.text};">
											{i18n.t('custom_preview_card')}
										</h4>
										<p class="text-[11px] opacity-80">
											MiruNova Live Studio Custom UI Palette Active
										</p>
									</div>
								</div>

								<div class="flex items-center gap-2">
									<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold"
										style="background-color: {rigging.customThemeConfig.accent}25; color: {rigging.customThemeConfig.accent}; border: 1px solid {rigging.customThemeConfig.accent}60;">
										Active Preview
									</span>

									<button
										type="button"
										onclick={() => rigging.setUITheme('custom')}
										class="px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
										style="background-color: {rigging.customThemeConfig.accent}; color: #ffffff;"
									>
										{#if rigging.uiTheme === 'custom'}
											<Check class="w-3.5 h-3.5 stroke-[3]" />
											<span>Aktif Sekarang</span>
										{:else}
											<Wand2 class="w-3.5 h-3.5" />
											<span>{i18n.t('apply_custom_theme')}</span>
										{/if}
									</button>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-800/80">
					<!-- 2. Background Style -->
					<div>
						<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
							<Layers class="w-3.5 h-3.5 text-cyan-400" />
							<span>{i18n.t('bg_mode')}</span>
						</h3>
						<div class="grid grid-cols-3 gap-2">
							{#each bgStyles as style}
								<button
									type="button"
									onclick={() => (rigging.backgroundStyle = style.id)}
									class="flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer {
										rigging.backgroundStyle === style.id
											? 'bg-zinc-900 border-cyan-500/80 text-white shadow-sm'
											: 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
									}"
								>
									<div class="flex items-center justify-between w-full mb-1">
										<span class="font-medium text-xs">{style.label}</span>
										{#if rigging.backgroundStyle === style.id}
											<Check class="w-3 h-3 text-cyan-400" />
										{/if}
									</div>
									<span class="text-[10px] text-zinc-500 leading-tight">{style.desc}</span>
								</button>
							{/each}
						</div>

						<!-- Image Uploader Button when Custom Image is selected -->
						{#if rigging.backgroundStyle === 'custom-image'}
							<div class="mt-2.5 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between">
								<span class="text-[11px] text-zinc-300">
									{rigging.customBgUrl ? 'Image loaded' : 'No image uploaded yet'}
								</span>
								<button
									type="button"
									onclick={() => fileInputEl?.click()}
									class="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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

					<!-- 3. Color Palette & Custom Hex -->
					<div class="space-y-4">
						<div>
							<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
								<Palette class="w-3.5 h-3.5 text-cyan-400" />
								<span>{i18n.t('bg_color')}</span>
							</h3>
							<div class="flex flex-wrap gap-2 mb-3">
								{#each presetColors as preset}
									<button
										type="button"
										onclick={() => (rigging.backgroundColor = preset.hex)}
										class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer {
											rigging.backgroundColor.toLowerCase() === preset.hex.toLowerCase()
												? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
												: 'border-zinc-700'
										}"
										style="background-color: {preset.hex};"
										title="{preset.name} ({preset.hex})"
									>
										{#if rigging.backgroundColor.toLowerCase() === preset.hex.toLowerCase()}
											<Check class="w-3 h-3 {preset.hex === '#f8fafc' || preset.hex === '#00ff00' || preset.hex === '#fff5f8' || preset.hex === '#f0fdf4' ? 'text-black' : 'text-white'}" />
										{/if}
									</button>
								{/each}
							</div>

							<!-- Custom Hex Input with native color picker -->
							<div class="flex items-center gap-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
								<input
									type="color"
									bind:value={rigging.backgroundColor}
									class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
								/>
								<span class="text-zinc-500 font-mono text-xs">HEX:</span>
								<input
									type="text"
									bind:value={rigging.backgroundColor}
									placeholder="#09090b"
									class="flex-1 bg-transparent font-mono text-xs text-zinc-100 uppercase focus:outline-none"
								/>
								<div class="w-4 h-4 rounded border border-zinc-700" style="background-color: {rigging.backgroundColor};"></div>
							</div>
						</div>

						<!-- 4. Screen Effects -->
						<div>
							<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
								<Sparkles class="w-3.5 h-3.5 text-cyan-400" />
								<span>{i18n.t('bg_effects')}</span>
							</h3>
							<div class="grid grid-cols-5 gap-1.5">
								{#each screenEffects as eff}
									<button
										type="button"
										onclick={() => (rigging.screenEffect = eff.id)}
										class="py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer {
											rigging.screenEffect === eff.id
												? 'bg-zinc-800 border-cyan-500 text-cyan-300 font-medium'
												: 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
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
