<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import type { AvatarFramingMode } from '#lib/types/tracking';
	import { threeStage, type FramingMode3D } from '#lib/core/threeStage';
	import { playSfx } from '#lib/core/sfx';
	import {
		Sparkles,
		ChevronUp,
		ChevronDown,
		X
	} from 'lucide-svelte';

	let isHudCollapsed = $state<boolean>(false);

	const isLightTheme = $derived(
		rigging.uiTheme === 'light' ||
		rigging.uiTheme === 'light-cyan-sea' ||
		rigging.uiTheme === 'sakura-light' ||
		rigging.uiTheme === 'matcha-light'
	);

	function handleSelectExpression(expId: string, label: string) {
		playSfx('expression');
		rigging.activeExpression = expId;
		if (rigging.avatarEngine === '3d') {
			threeStage.setExpression(expId);
		}
		rigging.showToast(expId ? `Ekspresi: ${label}` : 'Ekspresi Netral');
	}

	function handleSelectFraming(mode: AvatarFramingMode) {
		playSfx('click');
		rigging.framingMode = mode;
		if (rigging.avatarEngine === '3d') {
			threeStage.setFraming(mode as FramingMode3D);
		}
		rigging.showToast(`Kamera: ${mode === 'full' ? '🧍 Full Body' : mode === 'half' ? '🥋 Half Body' : '👤 Close-Up Face'}`);
	}

	const DEFAULT_EXPRESSIONS = [
		{ id: '', label: 'Netral', emoji: '😐' },
		{ id: 'stars', label: 'Star Eyes', emoji: '⭐' },
		{ id: 'smile', label: 'Senyum', emoji: '😊' },
		{ id: 'blush', label: 'Blush', emoji: '😳' },
		{ id: 'wink', label: 'Kedip', emoji: '😉' },
		{ id: 'surprised', label: 'Kaget', emoji: '😮' },
		{ id: 'cry', label: 'Menangis', emoji: '😭' },
		{ id: 'pout', label: 'Marah', emoji: '😡' },
		{ id: 'love', label: 'Love', emoji: '💖' }
	];
</script>

<!-- Universal Facial Expressions Studio Quick Bar (Merged & Streamlined) -->
{#if !rigging.isObsMode && !rigging.isGuiLocked}
	<div
		class="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 select-none max-w-[96vw] transition-all"
	>
		{#if !isHudCollapsed}
			<div
				class="flex flex-col rounded-2xl shadow-2xl p-2 max-w-full backdrop-blur-2xl border transition-all {
					isLightTheme
						? 'bg-white/95 border-zinc-300 text-zinc-900 shadow-xl'
						: 'bg-zinc-950/95 border-zinc-800/90 text-zinc-200 shadow-2xl'
				}"
			>
				<!-- Header Bar -->
				<div class="flex items-center justify-between gap-3 px-1.5 pb-1.5 border-b {
					isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'
				}">
					<div class="flex items-center gap-2">
						<Sparkles class="w-3.5 h-3.5 text-pink-500 animate-pulse" />
						<span class="text-xs font-bold tracking-wide {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
							Ekspresi Wajah
						</span>

						{#if rigging.activeExpression}
							<button
								type="button"
								onclick={() => handleSelectExpression('', 'Netral')}
								class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-mono cursor-pointer hover:bg-pink-500/30 transition-colors"
								title="Reset ke Netral"
							>
								<span>Aktif: {rigging.activeExpression}</span>
								<X class="w-3 h-3" />
							</button>
						{/if}
					</div>

					<div class="flex items-center gap-1">
						<!-- Minimize Button -->
						<button
							onclick={() => { playSfx('click'); isHudCollapsed = true; }}
							class="p-1 rounded-lg transition-colors cursor-pointer {
								isLightTheme ? 'text-zinc-500 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
							}"
							title="Sembunyikan Menu Ekspresi"
							aria-label="Sembunyikan Menu Ekspresi"
						>
							<ChevronDown class="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				<!-- Expression Buttons Row -->
				<div class="flex items-center gap-1.5 overflow-x-auto py-1 px-1 max-w-[88vw] scrollbar-thin">
					<!-- Standard Universal Expressions -->
					{#each DEFAULT_EXPRESSIONS as exp}
						<button
							type="button"
							onclick={() => handleSelectExpression(exp.id, exp.label)}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shrink-0 {
								rigging.activeExpression === exp.id || (!rigging.activeExpression && !exp.id)
									? 'bg-pink-500/25 border-pink-500 text-pink-600 dark:text-pink-200 shadow-sm font-semibold ring-1 ring-pink-500/40'
									: isLightTheme
										? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
										: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span class="text-sm">{exp.emoji}</span>
							<span>{exp.label}</span>
						</button>
					{/each}

					<!-- Dynamic Model-Specific Expressions (if available) -->
					{#if rigging.availableExpressions && rigging.availableExpressions.length > 0}
						<div class="h-5 w-px bg-zinc-300 dark:bg-zinc-800 mx-1 shrink-0"></div>
						{#each rigging.availableExpressions as customExp}
							<button
								type="button"
								onclick={() => handleSelectExpression(customExp.id, customExp.label || customExp.name)}
								class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shrink-0 {
									rigging.activeExpression === customExp.id
										? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-200 shadow-sm font-semibold ring-1 ring-amber-500/40'
										: isLightTheme
											? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
											: 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
								}"
							>
								<span class="text-sm">✨</span>
								<span class="truncate max-w-[100px]">{customExp.label || customExp.name}</span>
							</button>
						{/each}
					{/if}

					<!-- Compact 3D Orbit / Spin Controls (if in 3D Mode) -->
					{#if rigging.avatarEngine === '3d'}
						<div class="h-5 w-px bg-zinc-300 dark:bg-zinc-800 mx-1 shrink-0"></div>

						<!-- Auto-Spin 360 Turntable -->
						<button
							type="button"
							onclick={() => {
								playSfx('toggle');
								rigging.is3DAutoSpin = !rigging.is3DAutoSpin;
								rigging.showToast(rigging.is3DAutoSpin ? '🔄 3D Auto-Spin 360° Aktif' : 'Auto-Spin Dihentikan');
							}}
							class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shrink-0 {
								rigging.is3DAutoSpin
									? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-200 shadow-sm ring-1 ring-amber-500/50'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
							title="Putar Otomatis 360° Turntable"
						>
							<span class="text-sm {rigging.is3DAutoSpin ? 'animate-spin' : ''}">🔄</span>
							<span>{rigging.is3DAutoSpin ? 'Stop Spin' : '360° Spin'}</span>
						</button>

						<!-- Rotate Left 45 -->
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								threeStage.rotateOrbitDegrees(-45);
								rigging.showToast('↺ Putar Sudut 3D -45°');
							}}
							class="p-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 {
								isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
							title="Putar Kiri 45°"
							aria-label="Putar Kiri 45°"
						>
							<span class="text-sm">↺</span>
						</button>

						<!-- Rotate Right 45 -->
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								threeStage.rotateOrbitDegrees(45);
								rigging.showToast('↻ Putar Sudut 3D +45°');
							}}
							class="p-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 {
								isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
							title="Putar Kanan 45°"
							aria-label="Putar Kanan 45°"
						>
							<span class="text-sm">↻</span>
						</button>

						<!-- Reset 3D Angle -->
						<button
							type="button"
							onclick={() => {
								playSfx('click');
								threeStage.resetOrbit();
								rigging.is3DAutoSpin = false;
								rigging.showToast('🎯 Sudut 3D Direset ke Depan');
							}}
							class="p-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 {
								isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
							title="Reset Sudut Pandang 3D ke Depan"
							aria-label="Reset Sudut 3D"
						>
							<span class="text-sm">🎯</span>
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Mini Floating Pill when Collapsed -->
			<button
				onclick={() => { playSfx('click'); isHudCollapsed = false; }}
				class="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 {
					isLightTheme
						? 'bg-white/95 border-zinc-300 text-zinc-800 hover:bg-zinc-100'
						: 'bg-zinc-950/90 border-pink-500/40 text-pink-300 hover:bg-zinc-900 hover:border-pink-400'
				}"
				title="Buka Menu Cepat Ekspresi Wajah"
			>
				<Sparkles class="w-3.5 h-3.5 text-pink-400" />
				<span class="text-[11px] font-bold">Ekspresi Wajah</span>
				{#if rigging.activeExpression}
					<span class="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-mono text-[9px]">
						{rigging.activeExpression}
					</span>
				{/if}
				<ChevronUp class="w-3.5 h-3.5" />
			</button>
		{/if}
	</div>
{/if}
