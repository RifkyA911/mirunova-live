<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { MODEL_CATALOG } from '#lib/data/models';
	import type { PoseLoopMode } from '#lib/types/tracking';
	import {
		Layers,
		X,
		Check,
		Play,
		Repeat,
		Sparkles,
		Link,
		Sliders
	} from 'lucide-svelte';

	let customUrlInput = $state<string>('');

	const poseLoops: Array<{ id: PoseLoopMode; label: string }> = [
		{ id: 'none', label: 'Disabled' },
		{ id: 'idle-breath', label: 'Breathing Loop' },
		{ id: 'gentle-sway', label: 'Gentle Sway Loop' },
		{ id: 'head-nod', label: 'Head Nodding Loop' }
	];

	function handleSelectModel(m: typeof MODEL_CATALOG[0]) {
		rigging.setModel(m.id, m.name, m.url);
	}

	function handleLoadCustomUrl() {
		if (!customUrlInput.trim()) return;
		rigging.setModel('custom', 'Custom Model', customUrlInput.trim());
		customUrlInput = '';
	}
</script>

{#if rigging.isModelModalOpen}
	<div class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
		<div
			class="w-full max-w-xl bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
				<div class="flex items-center gap-2.5">
					<div class="p-2 bg-pink-500/10 border border-pink-500/30 rounded-lg text-pink-400">
						<Layers class="w-4 h-4" />
					</div>
					<div>
						<h2 class="text-sm font-semibold tracking-wide">
							{i18n.t('models')}
						</h2>
						<p class="text-xs text-zinc-400">
							Select anime avatars, configure pose looping, and trigger built-in animations
						</p>
					</div>
				</div>
				<button
					onclick={() => (rigging.isModelModalOpen = false)}
					class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Body Content -->
			<div class="p-5 overflow-y-auto space-y-5 text-xs">
				<!-- 1. Model Catalog List -->
				<div>
					<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
						{i18n.t('select_model')}
					</h3>
					<div class="grid grid-cols-2 gap-2">
						{#each MODEL_CATALOG as model}
							<button
								onclick={() => handleSelectModel(model)}
								class="flex flex-col p-3 rounded-xl border text-left transition-all {
									rigging.modelUrl === model.url
										? 'bg-zinc-900 border-pink-500/80 text-white shadow-sm ring-1 ring-pink-500/30'
										: 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
								}"
							>
								<div class="flex items-center justify-between w-full mb-1">
									<span class="font-semibold text-xs text-zinc-100">{model.name}</span>
									<span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
										{model.version}
									</span>
								</div>
								<span class="text-[10px] text-zinc-500 leading-snug">{model.description}</span>
							</button>
						{/each}
					</div>

					<!-- Custom Model URL Input -->
					<div class="mt-3 flex items-center gap-2 p-1.5 bg-zinc-900 rounded-xl border border-zinc-800">
						<Link class="w-4 h-4 text-zinc-500 ml-1.5" />
						<input
							type="text"
							bind:value={customUrlInput}
							placeholder="https://.../model.model3.json"
							class="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
						/>
						<button
							onclick={handleLoadCustomUrl}
							class="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
						>
							Load
						</button>
					</div>
				</div>

				<!-- 2. Pose Looping Configuration -->
				<div class="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/80 space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Repeat class="w-4 h-4 text-violet-400" />
							<span class="font-semibold text-xs text-zinc-200">{i18n.t('pose_loop')}</span>
						</div>
						<span class="text-[11px] font-mono text-violet-400">{rigging.poseLoopSpeed.toFixed(1)}x Speed</span>
					</div>

					<div class="grid grid-cols-4 gap-1.5">
						{#each poseLoops as loop}
							<button
								onclick={() => (rigging.poseLoopMode = loop.id)}
								class="py-1.5 px-2 rounded-lg border text-center transition-all {
									rigging.poseLoopMode === loop.id
										? 'bg-violet-600 border-violet-400 text-white font-medium shadow-sm'
										: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
								}"
							>
								{loop.label}
							</button>
						{/each}
					</div>

					{#if rigging.poseLoopMode !== 'none'}
						<div class="flex items-center gap-3 pt-1">
							<span class="text-[10px] text-zinc-500">Speed:</span>
							<input
								type="range"
								min="0.2"
								max="2.5"
								step="0.1"
								bind:value={rigging.poseLoopSpeed}
								class="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
							/>
						</div>
					{/if}
				</div>

				<!-- 3. Built-in Motions Trigger -->
				{#if rigging.availableMotions.length > 0}
					<div>
						<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
							{i18n.t('motion_list')}
						</h3>
						<div class="flex flex-wrap gap-1.5">
							{#each rigging.availableMotions as motion}
								<button
									onclick={() => rigging.playMotion(motion)}
									class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
								>
									<Play class="w-3 h-3 text-pink-400" />
									<span class="font-mono text-xs">{motion}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
