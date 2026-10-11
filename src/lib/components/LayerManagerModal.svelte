<script lang="ts">
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import { MODEL_CATALOG, MODEL_3D_CATALOG } from '#lib/data/models';
	import {
		Layers,
		X,
		Eye,
		EyeOff,
		Lock,
		Unlock,
		ArrowUp,
		ArrowDown,
		SlidersHorizontal,
		Sparkles,
		Smile,
		Users,
		Plus,
		Check,
		Glasses,
		Headphones,
		Crown,
		Mic,
		Heart,
		Palette,
		Tv
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let activeSubTab = $state<'layers' | 'accessories' | 'collab'>('layers');

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	const activeAccCount = $derived(
		rigging.activeAccessories.filter((a) => a.visible).length
	);

	function getLayerThumbnail(type: string): { bgClass: string; icon: any; label: string } {
		if (type === 'background') {
			if (rigging.backgroundStyle === 'solid') {
				return { bgClass: 'border-zinc-700', icon: Palette, label: rigging.backgroundColor };
			}
			if (rigging.backgroundStyle === 'chroma') {
				return { bgClass: 'bg-[#00FF00]', icon: Palette, label: 'Chroma' };
			}
			if (rigging.backgroundStyle === 'transparent') {
				return { bgClass: 'bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[size:8px_8px]', icon: Palette, label: 'Alpha' };
			}
			if (rigging.backgroundStyle === 'mesh') {
				return { bgClass: 'bg-zinc-950 bg-[linear-gradient(to_right,#06b6d433_1px,transparent_1px),linear-gradient(to_bottom,#06b6d433_1px,transparent_1px)] bg-[size:8px_8px]', icon: Palette, label: 'Mesh' };
			}
			return { bgClass: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950', icon: Palette, label: 'Cosmic' };
		}
		if (type === 'model-host') {
			return { bgClass: 'bg-pink-500/20 border-pink-500/40 text-pink-300', icon: Smile, label: rigging.modelName.slice(0, 10) };
		}
		if (type === 'model-collab') {
			return { bgClass: 'bg-purple-500/20 border-purple-500/40 text-purple-300', icon: Users, label: rigging.collabModelName.slice(0, 10) };
		}
		if (type === 'accessories') {
			return { bgClass: 'bg-amber-500/20 border-amber-500/40 text-amber-300', icon: Sparkles, label: `${activeAccCount} Aktif` };
		}
		return { bgClass: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300', icon: Tv, label: rigging.screenEffect };
	}
</script>

{#if rigging.isLayerManagerOpen}
	<!-- Modal Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={() => (rigging.isLayerManagerOpen = false)}
		class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
	>
		<!-- Photoshop-Style Layer Manager Dialog Card (max-w-4xl) -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onclick={(e) => e.stopPropagation()}
			class="w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-colors duration-200 {
				isLightTheme
					? 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
					: 'bg-zinc-950 text-zinc-100 border-zinc-800 shadow-2xl'
			}"
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b flex items-center justify-between {
				isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800/80'
			}">
				<div class="flex items-center gap-3">
					<div class="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-500">
						<Layers class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-sm sm:text-base font-bold flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							Photoshop Layer Manager & Stage Studio
							<span class="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/15 text-cyan-500 border border-cyan-500/30">
								{rigging.stageLayers.length} Layers
							</span>
						</h2>
						<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
							Susun urutan Z-Index, kontrol transparansi, pasang aksesoris avatar, dan aktifkan mode collab streamer
						</p>
					</div>
				</div>

				<button
					onclick={() => (rigging.isLayerManagerOpen = false)}
					class="p-2 rounded-xl transition-colors {
						isLightTheme ? 'hover:bg-zinc-200 text-zinc-500' : 'hover:bg-zinc-800 text-zinc-400'
					}"
					aria-label="Tutup"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Navigation Tabs Bar -->
			<div class="px-6 pt-2 border-b flex items-center gap-2 {
				isLightTheme ? 'bg-zinc-100/60 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/60'
			}">
				<button
					type="button"
					onclick={() => {
						playSfx('click');
						activeSubTab = 'layers';
					}}
					class="py-2.5 px-3.5 border-b-2 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer {
						activeSubTab === 'layers'
							? 'border-cyan-500 text-cyan-500 font-bold'
							: isLightTheme ? 'border-transparent text-zinc-500 hover:text-zinc-800' : 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Layers class="w-3.5 h-3.5" />
					<span>Daftar Layer Photoshop</span>
				</button>

				<button
					type="button"
					onclick={() => {
						playSfx('click');
						activeSubTab = 'accessories';
					}}
					class="py-2.5 px-3.5 border-b-2 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer {
						activeSubTab === 'accessories'
							? 'border-amber-500 text-amber-500 font-bold'
							: isLightTheme ? 'border-transparent text-zinc-500 hover:text-zinc-800' : 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Sparkles class="w-3.5 h-3.5" />
					<span>Aksesoris & Props ({activeAccCount})</span>
				</button>

				<button
					type="button"
					onclick={() => {
						playSfx('click');
						activeSubTab = 'collab';
					}}
					class="py-2.5 px-3.5 border-b-2 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer {
						activeSubTab === 'collab'
							? 'border-purple-500 text-purple-500 font-bold'
							: isLightTheme ? 'border-transparent text-zinc-500 hover:text-zinc-800' : 'border-transparent text-zinc-400 hover:text-zinc-200'
					}"
				>
					<Users class="w-3.5 h-3.5" />
					<span>Mode Collab Streamer</span>
					{#if rigging.isCollabModeActive}
						<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
					{/if}
				</button>
			</div>

			<!-- Tab 1: PHOTOSHOP LAYER STACK -->
			<div class="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-140px)] custom-scrollbar">
				{#if activeSubTab === 'layers'}
					<div class="space-y-3">
						<div class="flex items-center justify-between text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
							<span>Urutan Layer Panggung (Atas $\to$ Bawah sesuai Z-Index):</span>
							<span class="font-mono text-[11px]">Layer 1 paling depan</span>
						</div>

						<div class="space-y-2">
							{#each rigging.stageLayers as layer, idx}
								{@const thumb = getLayerThumbnail(layer.type)}
								{@const ThumbIcon = thumb.icon}
								<div
									class="p-3 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 {
										layer.visible
											? isLightTheme
												? 'bg-white border-zinc-200 shadow-sm'
												: 'bg-zinc-900/60 border-zinc-800 shadow-md'
											: 'opacity-50 bg-zinc-950/40 border-dashed border-zinc-800'
									}"
								>
									<!-- Left: Thumbnail Preview & Layer Meta -->
									<div class="flex items-center gap-3">
										<!-- Live Miniature Visual Preview Box -->
										<div
											class="w-12 h-12 rounded-xl border overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner {thumb.bgClass}"
											style={layer.type === 'background' && rigging.backgroundStyle === 'solid' ? `background-color: ${rigging.backgroundColor};` : ''}
										>
											<ThumbIcon class="w-4 h-4 opacity-70" />
											<span class="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold px-1 rounded bg-black/60 text-white backdrop-blur-xs">
												{thumb.label}
											</span>
										</div>

										<div>
											<div class="flex items-center gap-2">
												<span class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
													{layer.name}
												</span>
												<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
													{layer.badge}
												</span>
												{#if layer.type === 'model-collab' && !rigging.isCollabModeActive}
													<span class="text-[9px] px-1.5 py-0.2 rounded font-mono text-amber-400 bg-amber-950/40 border border-amber-800">
														(Collab Nonaktif)
													</span>
												{/if}
											</div>
											<p class="text-[10px] text-zinc-400 leading-tight mt-0.5">
												{layer.description}
											</p>
										</div>
									</div>

									<!-- Right: Controls (Visibility, Lock, Opacity Slider, Reorder) -->
									<div class="flex items-center gap-3 shrink-0 self-end sm:self-center">
										<!-- Opacity Slider -->
										<div class="flex items-center gap-1.5 w-32 sm:w-36">
											<span class="text-[10px] text-zinc-400 font-mono w-8 text-right">
												{Math.round(layer.opacity * 100)}%
											</span>
											<input
												type="range"
												min="0"
												max="1"
												step="0.05"
												value={layer.opacity}
												disabled={layer.locked}
												oninput={(e) => rigging.setLayerOpacity(layer.id, parseFloat((e.target as HTMLInputElement).value))}
												class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
											/>
										</div>

										<!-- Visibility Eye Toggle -->
										<button
											type="button"
											onclick={() => {
												playSfx('toggle');
												rigging.toggleLayer(layer.id);
											}}
											title={layer.visible ? 'Sembunyikan Layer' : 'Tampilkan Layer'}
											class="p-2 rounded-xl border transition-colors cursor-pointer {
												layer.visible
													? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
													: 'bg-zinc-800/80 border-zinc-700 text-zinc-500'
											}"
										>
											{#if layer.visible}
												<Eye class="w-3.5 h-3.5" />
											{:else}
												<EyeOff class="w-3.5 h-3.5" />
											{/if}
										</button>

										<!-- Lock Toggle -->
										<button
											type="button"
											onclick={() => {
												playSfx('click');
												rigging.setLayerLock(layer.id);
											}}
											title={layer.locked ? 'Buka Kunci Layer' : 'Kunci Layer'}
											class="p-2 rounded-xl border transition-colors cursor-pointer {
												layer.locked
													? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
													: 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
											}"
										>
											{#if layer.locked}
												<Lock class="w-3.5 h-3.5" />
											{:else}
												<Unlock class="w-3.5 h-3.5" />
											{/if}
										</button>

										<!-- Reorder Z-Index Buttons -->
										<div class="flex items-center gap-1">
											<button
												type="button"
												disabled={idx === 0}
												onclick={() => {
													playSfx('click');
													rigging.moveLayer(layer.id, 'up');
												}}
												title="Naikkan Layer (Z-Index +1)"
												class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors disabled:opacity-30 cursor-pointer"
											>
												<ArrowUp class="w-3 h-3" />
											</button>
											<button
												type="button"
												disabled={idx === rigging.stageLayers.length - 1}
												onclick={() => {
													playSfx('click');
													rigging.moveLayer(layer.id, 'down');
												}}
												title="Turunkan Layer (Z-Index -1)"
												class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors disabled:opacity-30 cursor-pointer"
											>
												<ArrowDown class="w-3 h-3" />
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

				<!-- Tab 2: ACCESSORIES & PROPS -->
				{:else if activeSubTab === 'accessories'}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-xs font-bold {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
									Katalog Aksesoris & Props Avatar
								</h3>
								<p class="text-[10px] text-zinc-400">
									Aksesoris akan menempel dan berorientasi mengikuti gerakan kepala model Live2D
								</p>
							</div>
							<span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
								{activeAccCount} Terpasang
							</span>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{#each rigging.activeAccessories as item}
								<div
									class="p-3.5 rounded-2xl border transition-all {
										item.visible
											? 'border-amber-500/50 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30'
											: isLightTheme
												? 'bg-white border-zinc-200'
												: 'bg-zinc-900/60 border-zinc-800/80'
									}"
								>
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2.5">
											<div class="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-lg shadow-sm">
												{item.emoji}
											</div>
											<div>
												<span class="text-xs font-bold block {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
													{item.name}
												</span>
												<span class="text-[9px] uppercase font-mono px-1 rounded bg-zinc-800 text-zinc-400">
													{item.category}
												</span>
											</div>
										</div>

										<button
											type="button"
											onclick={() => {
												playSfx('toggle');
												rigging.toggleAccessory(item.id);
											}}
											class="px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer {
												item.visible
													? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
													: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
											}"
										>
											{item.visible ? '✓ Terpasang' : '+ Pasang'}
										</button>
									</div>

									{#if item.visible}
										<!-- Fine Adjustment Controls -->
										<div class="space-y-2 pt-2 border-t border-zinc-800/60 text-[10px]">
											<div class="flex items-center justify-between">
												<span class="text-zinc-400">Ukuran (Scale):</span>
												<span class="font-mono text-amber-400 font-bold">{item.scale.toFixed(2)}x</span>
											</div>
											<input
												type="range"
												min="0.5"
												max="2.0"
												step="0.05"
												bind:value={item.scale}
												oninput={() => rigging.persist()}
												class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
											/>

											<div class="grid grid-cols-2 gap-2 pt-1">
												<div>
													<div class="flex justify-between text-[9px] text-zinc-400 mb-0.5">
														<span>Geser X:</span>
														<span class="font-mono text-zinc-300">{item.offsetX}px</span>
													</div>
													<input
														type="range"
														min="-200"
														max="200"
														step="5"
														bind:value={item.offsetX}
														oninput={() => rigging.persist()}
														class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
													/>
												</div>
												<div>
													<div class="flex justify-between text-[9px] text-zinc-400 mb-0.5">
														<span>Geser Y:</span>
														<span class="font-mono text-zinc-300">{item.offsetY}px</span>
													</div>
													<input
														type="range"
														min="-350"
														max="150"
														step="5"
														bind:value={item.offsetY}
														oninput={() => rigging.persist()}
														class="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
													/>
												</div>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

				<!-- Tab 3: COLLAB STREAMER MODE -->
				{:else if activeSubTab === 'collab'}
					<div class="space-y-4">
						<!-- Toggle Switch Card -->
						<div class="p-4 rounded-2xl border flex items-center justify-between {
							rigging.isCollabModeActive
								? 'bg-purple-500/15 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
								: isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
						}">
							<div class="flex items-center gap-3">
								<div class="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
									<Users class="w-5 h-5" />
								</div>
								<div>
									<h3 class="text-xs font-bold {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
										Mode Collab Streamer (Dual Avatar di Panggung)
									</h3>
									<p class="text-[10px] text-zinc-400">
										Menampilkan dua model sekaligus (Avatar Host & Avatar Tamu) pada satu layar kanvas
									</p>
								</div>
							</div>

							<button
								type="button"
								onclick={() => rigging.toggleCollabMode()}
								class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer {
									rigging.isCollabModeActive
										? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
										: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
								}"
							>
								{rigging.isCollabModeActive ? '✓ Collab Aktif' : 'Aktifkan Collab'}
							</button>
						</div>

						{#if rigging.isCollabModeActive}
							<!-- Partner Model Selector -->
							<div class="p-4 rounded-2xl border space-y-3 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900/50 border-zinc-800'}">
								<span class="text-xs font-bold block {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
									Pilih Avatar Partner (Collab Guest):
								</span>

								<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
									{#each MODEL_CATALOG as model}
										<button
											type="button"
											onclick={() => rigging.setCollabModel(model.id, model.name, model.url)}
											class="p-2 rounded-xl border text-left transition-all cursor-pointer {
												rigging.collabModelId === model.id
													? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold ring-1 ring-purple-500/50'
													: 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
											}"
										>
											<div class="truncate text-xs">{model.name}</div>
											<div class="text-[9px] opacity-75">{model.version}</div>
										</button>
									{/each}
								</div>
							</div>

							<!-- Layout & Positioning Controls -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="p-3.5 rounded-2xl border space-y-2 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900/50 border-zinc-800'}">
									<span class="text-xs font-bold block {isLightTheme ? 'text-zinc-800' : 'text-zinc-200'}">
										Layout Penempatan Collab
									</span>
									<div class="grid grid-cols-3 gap-1.5 text-xs">
										<button
											type="button"
											onclick={() => (rigging.collabPosition = 'left')}
											class="p-2 rounded-xl border text-center transition-all {
												rigging.collabPosition === 'left' ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
											}"
										>
											Partner Kiri
										</button>
										<button
											type="button"
											onclick={() => (rigging.collabPosition = 'right')}
											class="p-2 rounded-xl border text-center transition-all {
												rigging.collabPosition === 'right' ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
											}"
										>
											Partner Kanan
										</button>
										<button
											type="button"
											onclick={() => (rigging.collabPosition = 'pip')}
											class="p-2 rounded-xl border text-center transition-all {
												rigging.collabPosition === 'pip' ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
											}"
										>
											PiP Sudut
										</button>
									</div>
								</div>

								<div class="p-3.5 rounded-2xl border space-y-2 {isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900/50 border-zinc-800'}">
									<div class="flex justify-between text-xs">
										<span class="text-zinc-400">Skala Partner:</span>
										<span class="font-mono text-purple-400 font-bold">{Math.round(rigging.collabScale * 100)}%</span>
									</div>
									<input
										type="range"
										min="0.4"
										max="1.5"
										step="0.05"
										bind:value={rigging.collabScale}
										oninput={() => rigging.persist()}
										class="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
									/>

									<div class="flex items-center justify-between pt-1">
										<span class="text-[11px] text-zinc-400">Sinkronkan Gerakan Wajah:</span>
										<button
											type="button"
											onclick={() => {
												rigging.collabSyncTracking = !rigging.collabSyncTracking;
												rigging.persist();
											}}
											class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {
												rigging.collabSyncTracking ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
											}"
										>
											{rigging.collabSyncTracking ? 'Aktif (Sync)' : 'Mati (Idle)'}
										</button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
