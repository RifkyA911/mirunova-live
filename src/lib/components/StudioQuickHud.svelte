<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import type { AvatarFramingMode } from '#lib/types/tracking';
	import { threeStage, type FramingMode3D, type FullBodyPose3D } from '#lib/core/threeStage';
	import { playSfx } from '#lib/core/sfx';
	import {
		Camera,
		Sparkles,
		User,
		Activity,
		ChevronUp,
		ChevronDown,
		Check,
		Sliders
	} from 'lucide-svelte';

	let isHudCollapsed = $state<boolean>(false);
	let hudTab = $state<'framing' | 'expression' | 'pose' | 'tracking'>('framing');

	const isLightTheme = $derived(
		rigging.uiTheme === 'light' ||
		rigging.uiTheme === 'light-cyan-sea' ||
		rigging.uiTheme === 'sakura-light' ||
		rigging.uiTheme === 'matcha-light'
	);

	function handleSelectFraming(mode: AvatarFramingMode) {
		playSfx('click');
		rigging.framingMode = mode;
		if (rigging.avatarEngine === '3d') {
			threeStage.setFraming(mode as FramingMode3D);
		}
		rigging.showToast(`Kamera: ${mode === 'full' ? '🧍 Full Body' : mode === 'half' ? '🥋 Half Body' : '👤 Close-Up Face'}`);
	}

	function handleSelectExpression(expId: string, label: string) {
		playSfx('expression');
		rigging.activeExpression = expId;
		if (rigging.avatarEngine === '3d') {
			threeStage.setExpression(expId);
		}
		rigging.showToast(expId ? `Ekspresi: ${label}` : 'Ekspresi Netral');
	}

	function handleSelectPose(pose: FullBodyPose3D | string, label: string) {
		playSfx('click');
		if (pose === 'idle') {
			rigging.poseLoopMode = 'idle-breath';
			if (rigging.avatarEngine === '3d') threeStage.setFullBodyPose('idle');
		} else if (pose === 'wave') {
			rigging.poseLoopMode = 'wave';
			if (rigging.avatarEngine === '3d') threeStage.setFullBodyPose('wave');
		} else if (pose === 'peace') {
			if (rigging.avatarEngine === '3d') threeStage.setFullBodyPose('peace');
		} else if (pose === 'heart') {
			if (rigging.avatarEngine === '3d') threeStage.setFullBodyPose('heart');
		} else if (pose === 'stand') {
			rigging.poseLoopMode = 'gentle-sway';
			if (rigging.avatarEngine === '3d') threeStage.setFullBodyPose('stand');
		} else if (pose === 'none') {
			rigging.poseLoopMode = 'none';
			if (rigging.avatarEngine === '3d') threeStage.setFullBodyPose('stand');
		}
		rigging.showToast(`Pose Gerakan: ${label}`);
	}

	function toggleFaceTracking() {
		playSfx('toggle');
		rigging.enableFaceTracking = !rigging.enableFaceTracking;
		rigging.persist();
		rigging.showToast(rigging.enableFaceTracking ? '✓ Deteksi Wajah Aktif' : 'Deteksi Wajah Dinonaktifkan');
	}

	function toggleBodyTracking() {
		playSfx('toggle');
		rigging.enableBodyTracking = !rigging.enableBodyTracking;
		rigging.persist();
		rigging.showToast(rigging.enableBodyTracking ? '✓ Goyangan Tubuh (Body Sway) Aktif' : 'Goyangan Tubuh Dinonaktifkan');
	}

	function toggleHandTracking() {
		playSfx('toggle');
		rigging.enableHandTracking = !rigging.enableHandTracking;
		rigging.persist();
		rigging.showToast(rigging.enableHandTracking ? '✓ Deteksi Tangan MediaPipe Aktif' : 'Deteksi Tangan Dinonaktifkan');
	}
</script>

<!-- Universal Quick-Action Studio HUD Toolbar (Berlaku untuk Live2D & 3D Stage) -->
{#if !rigging.isObsMode && !rigging.isGuiLocked}
	<div
		class="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 select-none max-w-[96vw] transition-all"
	>
		{#if !isHudCollapsed}
			<div
				class="flex flex-col rounded-2xl shadow-2xl p-2.5 space-y-2 max-w-full backdrop-blur-2xl border transition-all {
					isLightTheme
						? 'bg-white/95 border-zinc-300 text-zinc-900 shadow-xl'
						: 'bg-zinc-950/95 border-zinc-800/90 text-zinc-200 shadow-2xl'
				}"
			>
				<!-- Tab Navigation Header -->
				<div class="flex items-center justify-between gap-2 border-b pb-1.5 px-1 {
					isLightTheme ? 'border-zinc-200' : 'border-zinc-800/80'
				}">
					<div class="flex items-center gap-1 overflow-x-auto py-0.5">
						<button
							onclick={() => { playSfx('click'); hudTab = 'framing'; }}
							class="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer {
								hudTab === 'framing'
									? 'bg-cyan-500/20 text-cyan-500 dark:text-cyan-300 border border-cyan-500/40 shadow-sm'
									: isLightTheme ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
							}"
						>
							<Camera class="w-3.5 h-3.5 text-cyan-500" />
							<span>Framing Kamera</span>
						</button>

						<button
							onclick={() => { playSfx('click'); hudTab = 'expression'; }}
							class="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer {
								hudTab === 'expression'
									? 'bg-pink-500/20 text-pink-500 dark:text-pink-300 border border-pink-500/40 shadow-sm'
									: isLightTheme ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
							}"
						>
							<Sparkles class="w-3.5 h-3.5 text-pink-500" />
							<span>Ekspresi Wajah</span>
						</button>

						<button
							onclick={() => { playSfx('click'); hudTab = 'pose'; }}
							class="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer {
								hudTab === 'pose'
									? 'bg-purple-500/20 text-purple-500 dark:text-purple-300 border border-purple-500/40 shadow-sm'
									: isLightTheme ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
							}"
						>
							<User class="w-3.5 h-3.5 text-purple-500" />
							<span>Pose Gerakan</span>
						</button>

						<button
							onclick={() => { playSfx('click'); hudTab = 'tracking'; }}
							class="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer {
								hudTab === 'tracking'
									? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
									: isLightTheme ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
							}"
						>
							<Activity class="w-3.5 h-3.5 text-emerald-500" />
							<span>Toggle Tracking</span>
						</button>
					</div>

					<!-- Minimize Button -->
					<button
						onclick={() => { playSfx('click'); isHudCollapsed = true; }}
						class="p-1 rounded-lg transition-colors cursor-pointer {
							isLightTheme ? 'text-zinc-500 hover:bg-zinc-200' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
						}"
						title="Sembunyikan Menu Cepat"
						aria-label="Sembunyikan Menu Cepat"
					>
						<ChevronDown class="w-4 h-4" />
					</button>
				</div>

				<!-- Tab 1: Framing Kamera (Tombol Bergambar) -->
				{#if hudTab === 'framing'}
					<div class="flex items-center gap-2 overflow-x-auto py-0.5 px-0.5">
						<button
							onclick={() => handleSelectFraming('full')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.framingMode === 'full'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-600 dark:text-cyan-200 shadow-md'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span class="text-base">🧍</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Full Body</span>
								<span class="text-[9px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5">Kepala - Kaki</span>
							</div>
						</button>

						<button
							onclick={() => handleSelectFraming('half')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.framingMode === 'half'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-600 dark:text-cyan-200 shadow-md'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span class="text-base">🥋</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Half Body</span>
								<span class="text-[9px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5">Pinggang ke Atas</span>
							</div>
						</button>

						<button
							onclick={() => handleSelectFraming('closeup')}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.framingMode === 'closeup'
									? 'bg-cyan-500/25 border-cyan-500 text-cyan-600 dark:text-cyan-200 shadow-md'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span class="text-base">👤</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Close-Up Face</span>
								<span class="text-[9px] {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'} mt-0.5">Fokus Wajah</span>
							</div>
						</button>
					</div>

				<!-- Tab 2: Ekspresi Wajah (Tombol Bergambar) -->
				{:else if hudTab === 'expression'}
					<div class="flex items-center gap-1.5 flex-wrap max-w-xl py-0.5">
						<button
							onclick={() => handleSelectExpression('', 'Netral')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								!rigging.activeExpression
									? 'bg-pink-500/25 border-pink-500 text-pink-600 dark:text-pink-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😐</span>
							<span>Netral</span>
						</button>

						<button
							onclick={() => handleSelectExpression('stars', 'Mata Bintang (Starry Eyes)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'stars'
									? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-200 shadow-sm'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>⭐</span>
							<span>Star Eyes</span>
						</button>

						<button
							onclick={() => handleSelectExpression('smile', 'Senyum (Smile)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'smile' || rigging.activeExpression === 'vrc.ee'
									? 'bg-pink-500/25 border-pink-500 text-pink-600 dark:text-pink-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😊</span>
							<span>Senyum</span>
						</button>

						<button
							onclick={() => handleSelectExpression('blush', 'Pipi Merona (Blush)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'blush'
									? 'bg-rose-500/25 border-rose-500 text-rose-600 dark:text-rose-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😳</span>
							<span>Blush</span>
						</button>

						<button
							onclick={() => handleSelectExpression('wink', 'Kedipan (Wink)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'wink' || rigging.activeExpression === 'vrc.blink'
									? 'bg-purple-500/25 border-purple-500 text-purple-600 dark:text-purple-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😉</span>
							<span>Kedip</span>
						</button>

						<button
							onclick={() => handleSelectExpression('surprised', 'Terkejut (Surprised)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'surprised' || rigging.activeExpression === 'vrc.oh'
									? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😮</span>
							<span>Kaget</span>
						</button>

						<button
							onclick={() => handleSelectExpression('cry', 'Menangis (Cry)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'cry'
									? 'bg-blue-500/25 border-blue-500 text-blue-600 dark:text-blue-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😭</span>
							<span>Menangis</span>
						</button>

						<button
							onclick={() => handleSelectExpression('pout', 'Merengut (Pout)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.activeExpression === 'pout'
									? 'bg-orange-500/25 border-orange-500 text-orange-600 dark:text-orange-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>😡</span>
							<span>Pout</span>
						</button>
					</div>

				<!-- Tab 3: Pose & Gerakan Tubuh (Tombol Bergambar) -->
				{:else if hudTab === 'pose'}
					<div class="flex items-center gap-1.5 flex-wrap max-w-xl py-0.5">
						<button
							onclick={() => handleSelectPose('idle', 'Bernapas Alami (Idle Breath)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.poseLoopMode === 'idle-breath'
									? 'bg-purple-500/25 border-purple-500 text-purple-600 dark:text-purple-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>💨</span>
							<span>Nafas Alami</span>
						</button>

						<button
							onclick={() => handleSelectPose('stand', 'Goyangan Tubuh Lembut (Gentle Sway)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.poseLoopMode === 'gentle-sway'
									? 'bg-purple-500/25 border-purple-500 text-purple-600 dark:text-purple-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>🌊</span>
							<span>Goyangan Tubuh</span>
						</button>

						<button
							onclick={() => handleSelectPose('wave', 'Melambaikan Tangan (Wave)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.poseLoopMode === 'wave'
									? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-200 shadow-sm'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>👋</span>
							<span>Lambaikan Tangan</span>
						</button>

						<button
							onclick={() => handleSelectPose('peace', 'Pose Peace Sign (✌️)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>✌️</span>
							<span>Peace Sign</span>
						</button>

						<button
							onclick={() => handleSelectPose('heart', 'Pose Hati Cinta (🫶)')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>🫶</span>
							<span>Love Heart</span>
						</button>

						<button
							onclick={() => handleSelectPose('none', 'Pose Diam / Nonaktif')}
							class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer {
								rigging.poseLoopMode === 'none'
									? 'bg-rose-500/25 border-rose-500 text-rose-600 dark:text-rose-200'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200' : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
							}"
						>
							<span>🛑</span>
							<span>Pose Diam</span>
						</button>
					</div>

				<!-- Tab 4: Quick Tracking Toggles (Live2D & 3D) -->
				{:else if hudTab === 'tracking'}
					<div class="flex items-center gap-2 overflow-x-auto py-0.5 px-0.5">
						<button
							onclick={toggleFaceTracking}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.enableFaceTracking
									? 'bg-indigo-500/25 border-indigo-500 text-indigo-600 dark:text-indigo-200 shadow-sm'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500'
							}"
						>
							<span class="text-base">{rigging.enableFaceTracking ? '👤' : '👤❌'}</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Face Tracking</span>
								<span class="text-[9px] {rigging.enableFaceTracking ? 'text-indigo-400' : 'text-zinc-500'} mt-0.5">
									{rigging.enableFaceTracking ? 'Aktif (Kamera)' : 'Nonaktif'}
								</span>
							</div>
						</button>

						<button
							onclick={toggleBodyTracking}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.enableBodyTracking
									? 'bg-emerald-500/25 border-emerald-500 text-emerald-600 dark:text-emerald-200 shadow-sm'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500'
							}"
						>
							<span class="text-base">{rigging.enableBodyTracking ? '💃' : '💃❌'}</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Body Sway</span>
								<span class="text-[9px] {rigging.enableBodyTracking ? 'text-emerald-400' : 'text-zinc-500'} mt-0.5">
									{rigging.enableBodyTracking ? 'Kinematika Tubuh' : 'Nonaktif'}
								</span>
							</div>
						</button>

						<button
							onclick={toggleHandTracking}
							class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border {
								rigging.enableHandTracking
									? 'bg-amber-500/25 border-amber-500 text-amber-600 dark:text-amber-200 shadow-sm'
									: isLightTheme ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500'
							}"
						>
							<span class="text-base">{rigging.enableHandTracking ? '✋' : '✋❌'}</span>
							<div class="flex flex-col text-left">
								<span class="leading-none">Hand Gestures</span>
								<span class="text-[9px] {rigging.enableHandTracking ? 'text-amber-400' : 'text-zinc-500'} mt-0.5">
									{rigging.enableHandTracking ? 'MediaPipe Tangan' : 'Nonaktif'}
								</span>
							</div>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Mini Floating Pill when Collapsed -->
			<button
				onclick={() => { playSfx('click'); isHudCollapsed = false; }}
				class="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 {
					isLightTheme
						? 'bg-white/95 border-zinc-300 text-zinc-800 hover:bg-zinc-100'
						: 'bg-zinc-950/90 border-cyan-500/40 text-cyan-300 hover:bg-zinc-900 hover:border-cyan-400'
				}"
				title="Buka Menu Studio (Framing, Ekspresi & Poses)"
			>
				<span class="text-xs">⚡</span>
				<span class="text-[11px] font-bold">Studio HUD</span>
				<ChevronUp class="w-3.5 h-3.5" />
			</button>
		{/if}
	</div>
{/if}
