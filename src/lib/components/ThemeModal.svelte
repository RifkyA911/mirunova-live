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
		Monitor,
		Sliders,
		SlidersHorizontal,
		Eye
	} from 'lucide-svelte';

	let fileInputEl = $state<HTMLInputElement>();

	const presetColors = [
		{ hex: '#09090b', name: 'Obsidian Zinc' },
		{ hex: '#030712', name: 'Abyss Black' },
		{ hex: '#0f172a', name: 'Midnight Slate' },
		{ hex: '#1e1b4b', name: 'Cyber Indigo' },
		{ hex: '#2e1065', name: 'Neon Violet' },
		{ hex: '#064e3b', name: 'Deep Emerald' },
		{ hex: '#4c0519', name: 'Crimson Wine' },
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

	const uiThemes: Array<{ id: UITheme; label: string; border: string }> = [
		{ id: 'cyber-dark', label: 'Cyber Dark (Cyan/Violet)', border: 'border-cyan-500' },
		{ id: 'midnight', label: 'Midnight (Navy Blue)', border: 'border-blue-500' },
		{ id: 'synthwave', label: 'Synthwave (Sunset Pink)', border: 'border-pink-500' },
		{ id: 'monochrome', label: 'Monochrome (Minimal)', border: 'border-zinc-400' }
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
		class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
	>
		<div
			class="w-full max-w-5xl xl:max-w-6xl bg-zinc-950/98 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
				<div class="flex items-center gap-2.5">
					<div class="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
						<Palette class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-sm sm:text-base font-bold tracking-wide">
							{i18n.t('themes_bg')}
						</h2>
						<p class="text-xs text-zinc-400">
							Kustomisasi tema antarmuka, gaya latar belakang, warna hex, dan overlay efek panggung
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isThemeModalOpen = false)}
					class="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Body Content (Responsive Grid Layout) -->
			<div class="p-6 overflow-y-auto space-y-6 text-xs">
				<!-- 1. UI Theme Toggler with Color Palettes -->
				<div>
					<div class="flex items-center justify-between mb-2.5">
						<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
							<Palette class="w-3.5 h-3.5 text-cyan-400" />
							{i18n.t('ui_theme')} — {i18n.t('swatch_palette')}
						</h3>
						<span class="text-[10px] text-zinc-500 font-mono">Hotkeys: [1 – 8]</span>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						{#each UI_THEMES as theme}
							<button
								onclick={() => rigging.setUITheme(theme.id)}
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
								<!-- Color Palette Swatches -->
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
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

				<!-- 2. Background Style -->
				<div>
					<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
						{i18n.t('bg_mode')}
					</h3>
					<div class="grid grid-cols-3 gap-2">
						{#each bgStyles as style}
							<button
								onclick={() => (rigging.backgroundStyle = style.id)}
								class="flex flex-col p-2.5 rounded-xl border text-left transition-all {
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
								onclick={() => fileInputEl?.click()}
								class="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors"
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
				<div>
					<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
						{i18n.t('bg_color')}
					</h3>
					<div class="flex flex-wrap gap-2 mb-3">
						{#each presetColors as preset}
							<button
								onclick={() => (rigging.backgroundColor = preset.hex)}
								class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center {
									rigging.backgroundColor.toLowerCase() === preset.hex.toLowerCase()
										? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
										: 'border-zinc-700'
								}"
								style="background-color: {preset.hex};"
								title="{preset.name} ({preset.hex})"
							>
								{#if rigging.backgroundColor.toLowerCase() === preset.hex.toLowerCase()}
									<Check class="w-3 h-3 {preset.hex === '#f8fafc' || preset.hex === '#00ff00' ? 'text-black' : 'text-white'}" />
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
					<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
						{i18n.t('bg_effects')}
					</h3>
					<div class="grid grid-cols-5 gap-1.5">
						{#each screenEffects as eff}
							<button
								onclick={() => (rigging.screenEffect = eff.id)}
								class="py-1.5 px-2 rounded-lg border text-center transition-all {
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
{/if}
