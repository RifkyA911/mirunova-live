<script lang="ts">
	import { onMount } from 'svelte';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { MODEL_CATALOG, MODEL_3D_CATALOG, type Model3DItem } from '#lib/data/models';
	import type { PoseLoopMode } from '#lib/types/tracking';
	import {
		Layers,
		X,
		Check,
		Play,
		Repeat,
		Sparkles,
		Link,
		Sliders,
		Box,
		UploadCloud,
		RotateCcw,
		Maximize2,
		Activity,
		Tag,
		ExternalLink,
		Heart,
		FolderOpen
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let customUrlInput = $state<string>('');
	let glbFileInput = $state<HTMLInputElement>();
	let localModelFileInput = $state<HTMLInputElement>();
	let catalogTab = $state<'2d' | '3d'>('2d');
	let model2DFilter = $state<'all' | 'booth' | 'official'>('all');

	let boothCount = $derived(MODEL_CATALOG.filter((m) => m.source === 'booth').length);
	let officialCount = $derived(MODEL_CATALOG.filter((m) => m.source === 'official').length);
	let displayed2DModels = $derived(
		MODEL_CATALOG.filter(
			(m) =>
				model2DFilter === 'all' ||
				(model2DFilter === 'booth' && m.source === 'booth') ||
				(model2DFilter === 'official' && m.source === 'official')
		)
	);

	const poseLoops: Array<{ id: PoseLoopMode; label: string; desc: string }> = [
		{ id: 'none', label: 'Mati', desc: 'Hanya ikuti tracking webcam' },
		{ id: 'idle-breath', label: 'Breathing', desc: 'Siklus nafas halus' },
		{ id: 'gentle-sway', label: 'Gentle Sway', desc: 'Goyangan santai kiri-kanan' },
		{ id: 'head-nod', label: 'Head Nod', desc: 'Anggukan kepala ritmis' }
	];

	onMount(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && rigging.isModelModalOpen) {
				rigging.isModelModalOpen = false;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	function handleSelect2DModel(m: typeof MODEL_CATALOG[0]) {
		playSfx('click');
		rigging.avatarEngine = 'live2d';
		rigging.setModel(m.id, m.name, m.url);
		rigging.showToast(`Memuat avatar 2D: ${m.name}`);
	}

	function handleSelect3DModel(m: Model3DItem) {
		playSfx('click');
		rigging.avatarEngine = '3d';
		rigging.selected3DModelId = m.id;
		rigging.modelName = m.name;
		rigging.showToast(`Memuat avatar 3D: ${m.name}`);
	}

	function handleLoadCustomUrl() {
		if (!customUrlInput.trim()) return;
		rigging.avatarEngine = 'live2d';
		rigging.setModel('custom', 'Custom Model', customUrlInput.trim());
		rigging.showToast('Memuat model Live2D dari URL...');
		customUrlInput = '';
	}

	function handleLocalModelSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		rigging.avatarEngine = 'live2d';
		rigging.setModel('custom-local', file.name.replace(/\.[^/.]+$/, ''), url);
		rigging.showToast(`Memuat model Live2D lokal: ${file.name}`);
	}

	function handleGlbUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		rigging.avatarEngine = '3d';
		rigging.customGlbUrl = url;
		rigging.selected3DModelId = 'custom-glb';
		rigging.modelName = file.name.replace(/\.[^/.]+$/, '');
		rigging.showToast(`Model 3D GLB dimuat: ${file.name}`);
	}
</script>

{#if rigging.isModelModalOpen}
	<!-- Backdrop Modal (Click outside to close) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={(e) => {
			if (e.target === e.currentTarget) rigging.isModelModalOpen = false;
		}}
		class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
	>
		<!-- 2X WIDER CONTAINER (max-w-5xl) -->
		<div
			class="w-full max-w-5xl bg-zinc-950/98 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100"
		>
			<!-- Header -->
			<div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
				<div class="flex items-center gap-3">
					<div class="p-2 bg-pink-500/10 border border-pink-500/30 rounded-xl text-pink-400 shadow-sm">
						<Layers class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-sm font-semibold tracking-wide flex items-center gap-2">
							{i18n.t('models')} & Katalog Avatar
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono">
								{catalogTab === '2d' ? `${MODEL_CATALOG.length} Live2D` : `${MODEL_3D_CATALOG.length} 3D Mesh`}
							</span>
						</h2>
						<p class="text-xs text-zinc-400">
							Pilih model avatar 2D/3D dengan visual preview lengkap, pose looping, dan kontrol gerakan
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<!-- Reset Position & Scale Button -->
					<button
						onclick={() => rigging.resetAvatarTransform()}
						class="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-medium transition-colors border border-zinc-700/80 active:scale-95 shadow-sm"
						title="Posisikan ulang avatar ke tengah layar"
					>
						<RotateCcw class="w-3.5 h-3.5 text-cyan-400" />
						<span>Reset Posisi Avatar</span>
					</button>

					<button
						onclick={() => (rigging.isModelModalOpen = false)}
						class="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
						aria-label="Close"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- Tab Selector: 2D Live2D vs 3D Avatars -->
			<div class="px-6 pt-3 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<button
						onclick={() => (catalogTab = '2d')}
						class="flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs transition-all {
							catalogTab === '2d'
								? 'border-pink-500 text-pink-300 font-semibold shadow-sm'
								: 'border-transparent text-zinc-400 hover:text-zinc-200'
						}"
					>
						<Layers class="w-4 h-4" />
						<span>2D Live2D & Reactive Avatars ({MODEL_CATALOG.length})</span>
					</button>
					<button
						onclick={() => (catalogTab = '3d')}
						class="flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs transition-all {
							catalogTab === '3d'
								? 'border-cyan-500 text-cyan-300 font-semibold shadow-sm'
								: 'border-transparent text-zinc-400 hover:text-zinc-200'
						}"
					>
						<Box class="w-4 h-4" />
						<span>3D Procedural WebGL Cats ({MODEL_3D_CATALOG.length})</span>
					</button>
				</div>

				<!-- Active Status Tag -->
				<div class="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400">
					<span>Avatar Aktif:</span>
					<span class="px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 font-semibold font-mono border border-zinc-700">
						{rigging.avatarEngine === '3d' ? rigging.selected3DModelId : rigging.modelName}
					</span>
				</div>
			</div>

			<!-- Body Content (Scrollable) -->
			<div class="p-6 overflow-y-auto space-y-6 text-xs custom-scrollbar">
				{#if catalogTab === '2d'}
					<!-- 2D Live2D Catalog Grid (Multi-Column) -->
					<div class="space-y-4">
						<!-- BOOTH.pm Kawaii Showcase Banner -->
						<div class="p-4 bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-zinc-900/60 rounded-2xl border border-pink-500/30 shadow-lg space-y-3">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div class="flex items-start gap-3">
									<div class="p-2.5 bg-pink-500/20 border border-pink-500/40 rounded-xl text-pink-400 shadow-sm shrink-0">
										<Heart class="w-5 h-5 fill-pink-500/30 text-pink-400" />
									</div>
									<div>
										<div class="flex items-center gap-2">
											<h4 class="font-bold text-sm text-pink-200">{i18n.t('booth_hub_title')}</h4>
											<span class="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono text-[9px] font-semibold uppercase tracking-wider border border-pink-500/30">
												Kawaii Anime Girl
											</span>
										</div>
										<p class="text-xs text-zinc-300/90 mt-0.5 leading-relaxed">
											{i18n.t('booth_hub_desc')} Model seperti <strong>Mihari</strong> dan <strong>Vivian</strong> sudah terpasang siap pakai dengan fisika rambut, pakaian, dan ekspresi lengkap.
										</p>
									</div>
								</div>

								<div class="flex items-center gap-2 shrink-0">
									<a
										href="https://booth.pm/ja/topics/FREE_LIVE2D"
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
									>
										<ExternalLink class="w-3.5 h-3.5" />
										<span>{i18n.t('booth_open_btn')}</span>
									</a>
									<a
										href="https://booth.pm/en/items?tags%5B%5D=Live2D&sort=popular"
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer"
									>
										<ExternalLink class="w-3.5 h-3.5 text-pink-400" />
										<span>BOOTH Populer</span>
									</a>
								</div>
							</div>

							<!-- Filter Chips -->
							<div class="flex items-center gap-2 pt-2 border-t border-pink-500/20 text-[11px]">
								<span class="text-zinc-400 font-medium mr-1">Filter:</span>
								<button
									onclick={() => (model2DFilter = 'all')}
									class="px-2.5 py-1 rounded-lg border font-medium transition-colors {
										model2DFilter === 'all'
											? 'bg-pink-500/20 border-pink-500/50 text-pink-200 font-semibold'
											: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
									}"
								>
									Semua ({MODEL_CATALOG.length})
								</button>
								<button
									onclick={() => (model2DFilter = 'booth')}
									class="flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium transition-colors {
										model2DFilter === 'booth'
											? 'bg-pink-500/30 border-pink-500 text-pink-200 font-semibold shadow-sm'
											: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-pink-300'
									}"
								>
									<Heart class="w-3 h-3 text-pink-400 fill-pink-400/40" />
									<span>BOOTH.pm Kawaii ({boothCount})</span>
								</button>
								<button
									onclick={() => (model2DFilter = 'official')}
									class="px-2.5 py-1 rounded-lg border font-medium transition-colors {
										model2DFilter === 'official'
											? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-semibold'
											: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
									}"
								>
									Official Samples ({officialCount})
								</button>
							</div>
						</div>

						<div class="flex items-center justify-between">
							<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
								<Sparkles class="w-3.5 h-3.5 text-pink-400" />
								Pilih Model Live2D ({displayed2DModels.length} Tersedia)
							</h3>
							<span class="text-[10px] text-zinc-500">Klik kartu untuk langsung mengaktifkan avatar</span>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
							{#each displayed2DModels as model}
								{@const isActive = rigging.avatarEngine === 'live2d' && (rigging.selectedModelId === model.id || rigging.modelUrl === model.url)}
								<div
									role="button"
									tabindex="0"
									onclick={() => handleSelect2DModel(model)}
									onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect2DModel(model); }}
									class="relative flex flex-col p-3.5 rounded-2xl border text-left transition-all cursor-pointer group {
										isActive
											? 'bg-zinc-900 border-pink-500 text-white shadow-lg shadow-pink-500/10 ring-2 ring-pink-500/40'
											: 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700'
									}"
								>
									<!-- Active Indicator Badge -->
									{#if isActive}
										<div class="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500 text-zinc-950 font-bold text-[9px] shadow-sm tracking-wide">
											<Check class="w-3 h-3 stroke-[3]" />
											AKTIF
										</div>
									{/if}

									<!-- Top Card Row: Avatar Visual Preview + Title -->
									<div class="flex items-start gap-3 mb-2.5">
										<div class="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/80 shrink-0 shadow-md group-hover:scale-105 transition-transform">
											{#if model.avatarUrl}
												<img
													src={model.avatarUrl}
													alt={model.name}
													class="w-full h-full object-cover"
													loading="lazy"
												/>
											{:else}
												<div class="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
													<Layers class="w-6 h-6" />
												</div>
											{/if}
										</div>

										<div class="flex flex-col min-w-0 flex-1 pt-0.5">
											<div class="flex items-center gap-1.5 mb-1">
												<span class="font-bold text-xs text-zinc-100 truncate">{model.name}</span>
											</div>
											<div class="flex items-center gap-1.5 mb-1">
												<span class="inline-flex self-start px-1.5 py-0.5 rounded bg-zinc-800 text-pink-400 font-mono text-[9px] border border-zinc-700">
													{model.version}
												</span>
												{#if model.source === 'booth'}
													<span class="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold text-[8px] uppercase tracking-wide">
														BOOTH.pm
													</span>
												{/if}
											</div>
											{#if model.author}
												<span class="text-[9px] text-zinc-400 truncate mb-1">
													{model.author}
												</span>
											{/if}
											<p class="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
												{model.description}
											</p>
										</div>
									</div>

									<!-- Feature Tags -->
									{#if model.tags && model.tags.length > 0}
										<div class="flex flex-wrap gap-1 mt-auto pt-2 border-t border-zinc-800/60">
											{#each model.tags as tag}
												<span class="px-1.5 py-0.5 rounded text-[9px] font-medium {tag.includes('BOOTH') ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-zinc-800/80 text-zinc-300'}">
													{tag}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Custom Live2D Model Loader (URL & Local File) -->
						<div class="mt-4 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
									<UploadCloud class="w-4 h-4 text-pink-400" />
									Muat Model Live2D Sendiri (URL / File Lokal)
								</span>
								<button
									onclick={() => localModelFileInput?.click()}
									class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
								>
									<FolderOpen class="w-3.5 h-3.5 text-pink-400" />
									<span>{i18n.t('import_local_model')}</span>
								</button>
								<input
									type="file"
									accept=".json,.model3.json"
									bind:this={localModelFileInput}
									onchange={handleLocalModelSelect}
									class="hidden"
								/>
							</div>
							<div class="flex items-center gap-2">
								<Link class="w-4 h-4 text-pink-400 shrink-0 ml-1" />
								<input
									type="text"
									bind:value={customUrlInput}
									placeholder="Muat Live2D Kustom: https://.../model.model3.json"
									class="flex-1 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
								/>
								<button
									onclick={handleLoadCustomUrl}
									class="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
								>
									Muat URL
								</button>
							</div>
						</div>
					</div>
				{:else}
					<!-- 3D Models Catalog Grid (Multi-Column) -->
					<div>
						<div class="flex items-center justify-between mb-3">
							<h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
								<Box class="w-3.5 h-3.5 text-cyan-400" />
								Pilih Avatar 3D (Procedural Rigged Cats & GLTF)
							</h3>
							<span class="text-[10px] text-zinc-500">Avatar 3D WebGL Three.js dengan reactive tracking</span>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
							{#each MODEL_3D_CATALOG as model}
								{@const isActive = rigging.avatarEngine === '3d' && rigging.selected3DModelId === model.id}
								<div
									role="button"
									tabindex="0"
									onclick={() => handleSelect3DModel(model)}
									onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect3DModel(model); }}
									class="relative flex flex-col p-3.5 rounded-2xl border text-left transition-all cursor-pointer group {
										isActive
											? 'bg-zinc-900 border-cyan-500 text-white shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/40'
											: 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700'
									}"
								>
									<!-- Active Indicator Badge -->
									{#if isActive}
										<div class="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500 text-zinc-950 font-bold text-[9px] shadow-sm tracking-wide">
											<Check class="w-3 h-3 stroke-[3]" />
											AKTIF
										</div>
									{/if}

									<!-- Top Card Row: Avatar Visual Preview + Title -->
									<div class="flex items-start gap-3 mb-2.5">
										<div class="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/80 shrink-0 shadow-md group-hover:scale-105 transition-transform">
											{#if model.avatarUrl}
												<img
													src={model.avatarUrl}
													alt={model.name}
													class="w-full h-full object-cover"
													loading="lazy"
												/>
											{:else}
												<div class="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
													<Box class="w-6 h-6" />
												</div>
											{/if}
										</div>

										<div class="flex flex-col min-w-0 flex-1 pt-0.5">
											<div class="flex items-center gap-1.5 mb-1">
												<span class="font-bold text-xs text-zinc-100 truncate">{model.name}</span>
											</div>
											<span class="inline-flex self-start px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 font-mono text-[9px] border border-zinc-700 mb-1">
												3D PROCEDURAL
											</span>
											<p class="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
												{model.description}
											</p>
										</div>
									</div>

									<!-- Feature Tags -->
									{#if model.tags && model.tags.length > 0}
										<div class="flex flex-wrap gap-1 mt-auto pt-2 border-t border-zinc-800/60">
											{#each model.tags as tag}
												<span class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-800/80 text-cyan-300">
													{tag}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Upload Custom 3D Model (GLB/GLTF) -->
						<div class="mt-4 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/30">
									<Box class="w-5 h-5" />
								</div>
								<div>
									<p class="font-semibold text-zinc-200 text-xs">Unggah Model 3D Sendiri (.GLB / .GLTF)</p>
									<p class="text-[10px] text-zinc-400">Ekspor langsung model karakter dari Blender atau Sketchfab untuk ditampilkan</p>
								</div>
							</div>
							<button
								onclick={() => glbFileInput?.click()}
								class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
							>
								<UploadCloud class="w-4 h-4" />
								Pilih File GLB...
							</button>
							<input
								type="file"
								accept=".glb,.gltf"
								bind:this={glbFileInput}
								onchange={handleGlbUpload}
								class="hidden"
							/>
						</div>
					</div>
				{/if}

				<!-- Pose Looping Studio Section -->
				<div class="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="p-1.5 bg-violet-500/10 rounded-lg text-violet-400 border border-violet-500/30">
								<Repeat class="w-4 h-4" />
							</div>
							<div>
								<span class="font-semibold text-xs text-zinc-200">{i18n.t('pose_loop')} Studio</span>
								<p class="text-[10px] text-zinc-400">Gerakan otomatis looping agar avatar terlihat hidup saat diam</p>
							</div>
						</div>
						<span class="text-xs font-mono font-semibold text-violet-400 px-2 py-0.5 bg-violet-500/10 rounded border border-violet-500/20">
							{rigging.poseLoopSpeed.toFixed(1)}x Kecepatan
						</span>
					</div>

					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
						{#each poseLoops as loop}
							<button
								onclick={() => (rigging.poseLoopMode = loop.id)}
								class="p-2.5 rounded-xl border text-left transition-all {
									rigging.poseLoopMode === loop.id
										? 'bg-violet-600 border-violet-400 text-white font-semibold shadow-md'
										: 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
								}"
							>
								<div class="font-semibold text-xs mb-0.5">{loop.label}</div>
								<div class="text-[9px] opacity-75 leading-tight">{loop.desc}</div>
							</button>
						{/each}
					</div>

					{#if rigging.poseLoopMode !== 'none'}
						<div class="flex items-center gap-3 pt-2">
							<span class="text-[11px] font-medium text-zinc-400 shrink-0">Kecepatan Loop:</span>
							<input
								type="range"
								min="0.2"
								max="2.5"
								step="0.1"
								bind:value={rigging.poseLoopSpeed}
								class="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
							/>
							<span class="text-[10px] text-zinc-400 font-mono w-8 text-right">{rigging.poseLoopSpeed.toFixed(1)}x</span>
						</div>
					{/if}
				</div>

				<!-- Built-in Motions Trigger Section (Only in 2D mode with available motions) -->
				{#if catalogTab === '2d' && rigging.availableMotions.length > 0}
					<div class="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-2.5">
						<div class="flex items-center justify-between">
							<h3 class="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
								<Play class="w-3.5 h-3.5 text-pink-400" />
								{i18n.t('motion_list')} ({rigging.availableMotions.length} Gerakan)
							</h3>
							<span class="text-[10px] text-zinc-500">Klik untuk memutar animasi bawaan model</span>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each rigging.availableMotions as motion}
								<button
									onclick={() => rigging.playMotion(motion)}
									class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-pink-500/60 hover:bg-pink-500/10 text-zinc-300 hover:text-pink-300 transition-all active:scale-95 shadow-sm"
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
