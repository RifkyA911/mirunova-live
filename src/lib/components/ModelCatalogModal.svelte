<script lang="ts">
	import { onMount } from 'svelte';
	import { unzip } from 'fflate';
	import { rigging } from '#lib/stores/riggingStore.svelte';
	import { i18n } from '#lib/i18n/index.svelte';
	import {
		MODEL_CATALOG,
		MODEL_3D_CATALOG,
		BOOTH_SHOWCASE_CATALOG,
		OFFICIAL_SAMPLE_CATALOG,
		COMMUNITY_LEGEND_CATALOG,
		type Model3DItem,
		type OfficialSampleItem,
		type CommunityLegendItem,
		type BoothShowcaseItem
	} from '#lib/data/models';
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
		FolderOpen,
		FileCode,
		Download,
		Bot
	} from 'lucide-svelte';
	import { playSfx } from '#lib/core/sfx';

	let customUrlInput = $state<string>('');
	let glbFileInput = $state<HTMLInputElement>();
	let folderInputEl = $state<HTMLInputElement>();
	let multiFileInputEl = $state<HTMLInputElement>();
	let zipInputEl = $state<HTMLInputElement>();

	let catalogTab = $state<'2d' | 'booth' | '3d'>('2d');
	let boothCategoryFilter = $state<'all' | 'hoyoverse-kuro' | 'original-anime' | 'vts-popular'>('all');
	let activeTargetModelName = $state<string>('');
	let activeTargetModelId = $state<string>('');
	let isDownloadingModel = $state<boolean>(false);
	let downloadProgressText = $state<string>('');

	const isLightTheme = $derived(
		['light', 'light-cyan-sea', 'sakura-light', 'matcha-light'].includes(rigging.uiTheme)
	);

	let catalog2DFilter = $state<'all' | 'game' | 'booth' | 'official'>('all');

	// Separation: Pre-installed Booth models vs Pre-installed Official models
	const boothPreinstalledModels = $derived(MODEL_CATALOG.filter((m) => m.source === 'booth'));
	const officialPreinstalledModels = $derived(MODEL_CATALOG.filter((m) => m.source !== 'booth'));

	const displayed2DModels = $derived(
		MODEL_CATALOG.filter((m) => {
			if (catalog2DFilter === 'game') return ['jian', 'changli', 'chun', 'tingyun', 'ruan-mei'].includes(m.id);
			if (catalog2DFilter === 'booth') return ['mihari', 'vivian'].includes(m.id);
			if (catalog2DFilter === 'official') return m.source === 'official';
			return true;
		})
	);

	let displayedBoothModels = $derived(
		BOOTH_SHOWCASE_CATALOG.filter(
			(b) => boothCategoryFilter === 'all' || b.category === boothCategoryFilter
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
		rigging.isModelModalOpen = false;
		rigging.avatarEngine = 'live2d';
		rigging.setModel(m.id, m.name, m.url);
		rigging.showToast(`Memuat avatar 2D: ${m.name}`);
	}

	function handleSelect3DModel(m: Model3DItem) {
		playSfx('click');
		rigging.isModelModalOpen = false;
		rigging.avatarEngine = '3d';
		rigging.selected3DModelId = m.id;
		rigging.modelName = m.name;
		rigging.showToast(`Memuat avatar 3D: ${m.name}`);
	}

	async function downloadAndInstallFromUrl(url: string, name?: string, id?: string) {
		if (!url || !url.trim()) return;
		const cleanUrl = url.trim();
		playSfx('click');
		isDownloadingModel = true;
		const displayName = name || 'Model Live2D';
		downloadProgressText = `Mengunduh & memasang ${displayName}...`;
		rigging.showToast(`Memasang model: ${displayName}`);

		try {
			// If URL is direct .model3.json or .model.json
			if (
				cleanUrl.toLowerCase().endsWith('.model3.json') ||
				cleanUrl.toLowerCase().endsWith('.model.json')
			) {
				rigging.avatarEngine = 'live2d';
				rigging.setModel(id || 'url-model-' + Date.now(), displayName, cleanUrl);
				playSfx('success');
				rigging.showToast(`✓ Model Live2D aktif: ${displayName}`);
				isDownloadingModel = false;
				return;
			}

			// Download file (e.g. ZIP archive or bundle)
			downloadProgressText = `Mengunduh paket model ${displayName}...`;
			const res = await fetch(cleanUrl);
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}

			downloadProgressText = 'Mengekstrak file model di memori...';
			const blob = await res.blob();
			const filename =
				cleanUrl.split('/').pop()?.split('?')[0] ||
				(name ? `${name}.zip` : 'model.zip');
			const zipFile = new File([blob], filename, {
				type: blob.type || 'application/zip'
			});

			activeTargetModelName = displayName;
			activeTargetModelId = id || '';
			await processLive2DFiles([zipFile]);
		} catch (err: any) {
			console.warn('Auto download & install error:', err);
			// Fallback: if network or CORS error, let the user pick the file manually
			rigging.showToast(
				`⚠️ Server unduh dibatasi CORS atau offline. Silakan pilih file ZIP hasil unduh manual.`
			);
			activeTargetModelName = displayName;
			activeTargetModelId = id || '';
			zipInputEl?.click();
		} finally {
			isDownloadingModel = false;
			downloadProgressText = '';
		}
	}

	async function handleLoadCustomUrl() {
		if (!customUrlInput.trim()) return;
		const url = customUrlInput.trim();
		customUrlInput = '';
		await downloadAndInstallFromUrl(url);
	}

	async function triggerInstallModel(item: {
		id: string;
		name: string;
		modelUrl?: string;
		boothUrl?: string;
		sampleUrl?: string;
	}) {
		if (item.modelUrl) {
			await downloadAndInstallFromUrl(item.modelUrl, item.name, item.id);
			return;
		}
		playSfx('click');
		activeTargetModelName = item.name;
		activeTargetModelId = item.id;
		rigging.showToast(`Pilih file ZIP atau folder hasil unduh untuk: ${item.name}`);
		zipInputEl?.click();
	}

	async function handleZipSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		await processLive2DFiles(target.files);
		target.value = '';
	}

	async function handleFolderSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		await processLive2DFiles(target.files);
		target.value = '';
	}

	async function handleMultiFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		await processLive2DFiles(target.files);
		target.value = '';
	}

	async function processLive2DFiles(files: FileList | File[]) {
		if (!files || files.length === 0) return;
		let fileArr = Array.from(files);

		// Handle ZIP file directly in memory via fflate
		if (fileArr.length === 1 && fileArr[0].name.toLowerCase().endsWith('.zip')) {
			try {
				rigging.showToast(`Mengekstrak file ZIP di memori: ${fileArr[0].name}...`);
				const zipBuf = await fileArr[0].arrayBuffer();
				const unzippedFiles: File[] = await new Promise((resolve, reject) => {
					unzip(new Uint8Array(zipBuf), (err, data) => {
						if (err) return reject(err);
						const list: File[] = [];
						for (const fullPath in data) {
							const bytes = data[fullPath];
							if (!bytes || bytes.length === 0) continue;
							const filename = fullPath.split('/').pop() || fullPath;
							const blob = new Blob([bytes]);
							const f = new File([blob], filename);
							(f as any).webkitRelativePath = fullPath;
							list.push(f);
						}
						resolve(list);
					});
				});
				if (unzippedFiles.length === 0) {
					rigging.showToast('⚠️ Arsip ZIP kosong atau tidak memuat file model!');
					return;
				}
				fileArr = unzippedFiles;
			} catch (zipErr: any) {
				console.error('ZIP unpack error:', zipErr);
				rigging.showToast(`⚠️ Gagal membuka ZIP: ${zipErr.message || zipErr}`);
				return;
			}
		}

		// Find the model3.json file
		const modelFile = fileArr.find(
			(f) =>
				f.name.toLowerCase().endsWith('.model3.json') ||
				(f.name.toLowerCase().endsWith('.json') &&
					!f.name.includes('motion') &&
					!f.name.includes('physics') &&
					!f.name.includes('cdi'))
		);

		if (!modelFile) {
			rigging.showToast('⚠️ File .model3.json tidak ditemukan dalam file yang dipilih!');
			return;
		}

		try {
			const text = await modelFile.text();
			let modelJson: any;
			try {
				modelJson = JSON.parse(text);
			} catch {
				rigging.showToast('⚠️ File .model3.json rusak atau bukan format JSON valid!');
				return;
			}

			// Single file check: if user only chose a single file and textures are referenced
			const textures = modelJson.FileReferences?.Textures || [];
			if (fileArr.length === 1 && textures.length > 0) {
				rigging.showToast('⚠️ Live2D butuh file tekstur! Mohon pilih Folder model atau semua file bersamaan.');
				folderInputEl?.click();
				return;
			}

			// Map all files by filename (lowercase) and clean relative path
			const urlMap = new Map<string, string>();
			for (const file of fileArr) {
				const blobUrl = URL.createObjectURL(file);
				urlMap.set(file.name.toLowerCase(), blobUrl);
				if (file.webkitRelativePath) {
					const cleanRel = file.webkitRelativePath.split('/').slice(1).join('/').toLowerCase();
					if (cleanRel) urlMap.set(cleanRel, blobUrl);
				}
			}

			const resolveBlob = (relPath: string) => {
				if (!relPath) return relPath;
				const nameOnly = relPath.split('/').pop()?.toLowerCase() || '';
				return urlMap.get(relPath.toLowerCase()) || urlMap.get(nameOnly) || relPath;
			};

			if (modelJson.FileReferences) {
				const refs = modelJson.FileReferences;
				if (refs.Moc) refs.Moc = resolveBlob(refs.Moc);
				if (Array.isArray(refs.Textures)) {
					refs.Textures = refs.Textures.map((t: string) => resolveBlob(t));
				}
				if (refs.Physics) refs.Physics = resolveBlob(refs.Physics);
				if (refs.Pose) refs.Pose = resolveBlob(refs.Pose);
				if (refs.DisplayInfo) refs.DisplayInfo = resolveBlob(refs.DisplayInfo);
				if (refs.UserData) refs.UserData = resolveBlob(refs.UserData);
				if (refs.Motions && typeof refs.Motions === 'object') {
					for (const grp in refs.Motions) {
						if (Array.isArray(refs.Motions[grp])) {
							refs.Motions[grp].forEach((m: any) => {
								if (m.File) m.File = resolveBlob(m.File);
							});
						}
					}
				}
				if (Array.isArray(refs.Expressions)) {
					refs.Expressions.forEach((exp: any) => {
						if (exp.File) exp.File = resolveBlob(exp.File);
					});
				}
			}

			const patchedBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });
			const finalUrl = URL.createObjectURL(patchedBlob);

			const modelName =
				activeTargetModelName ||
				modelFile.name.replace(/\.model3\.json$/i, '').replace(/\.json$/i, '');
			const modelId = activeTargetModelId || 'custom-local-' + Date.now();

			rigging.avatarEngine = 'live2d';
			rigging.isModelModalOpen = false;
			rigging.setModel(modelId, modelName, finalUrl);
			playSfx('success');
			rigging.showToast(`✓ Model Live2D aktif: ${modelName}`);

			activeTargetModelName = '';
			activeTargetModelId = '';
		} catch (err: any) {
			console.error('Failed to unpack Live2D files:', err);
			rigging.showToast('Gagal memproses file model: ' + (err?.message || err));
		}
	}

	function handleGlbUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		rigging.isModelModalOpen = false;
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
		<!-- EXPANSIVE WIDER CONTAINER (max-w-6xl xl:max-w-7xl) -->
		<div
			class="w-full max-w-6xl xl:max-w-7xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border transition-colors duration-200 {
				isLightTheme
					? 'bg-white text-zinc-900 border-zinc-200 shadow-xl'
					: 'bg-zinc-950/98 text-zinc-100 border-zinc-800 shadow-2xl'
			}"
		>
			<!-- Header -->
			<div class="p-4 border-b flex items-center justify-between {
				isLightTheme ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'
			}">
				<div class="flex items-center gap-3">
					<div class="p-2 bg-pink-500/10 border border-pink-500/30 rounded-xl text-pink-500 shadow-sm">
						<Layers class="w-5 h-5" />
					</div>
					<div>
						<h2 class="text-sm font-semibold tracking-wide flex items-center gap-2 {isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}">
							{i18n.t('models')} & Katalog Avatar
							<span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-600 dark:text-pink-300 font-mono font-bold">
								{catalogTab === '2d' ? `${MODEL_CATALOG.length} Live2D` : catalogTab === 'booth' ? `${BOOTH_SHOWCASE_CATALOG.length} BOOTH` : `${MODEL_3D_CATALOG.length} 3D Mesh`}
							</span>
						</h2>
						<p class="text-xs {isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}">
							Pilih model avatar 2D/3D dengan visual preview lengkap, pose looping, dan kontrol gerakan
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<!-- Reset Position & Scale Button -->
					<button
						onclick={() => rigging.resetAvatarTransform()}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border active:scale-95 shadow-sm {
							isLightTheme
								? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
								: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700/80'
						}"
						title="Posisikan ulang avatar ke tengah layar"
					>
						<RotateCcw class="w-3.5 h-3.5 text-cyan-500" />
						<span>Reset Posisi Avatar</span>
					</button>

					<button
						onclick={() => (rigging.isModelModalOpen = false)}
						class="p-1.5 rounded-md transition-colors cursor-pointer {
							isLightTheme ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
						}"
						aria-label="Close"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- Tab Selector: 2D Live2D vs BOOTH vs 3D Avatars -->
			<div class="px-6 pt-3 border-b flex items-center justify-between {
				isLightTheme ? 'bg-zinc-100/60 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/80'
			}">
				<div class="flex items-center gap-3">
					<button
						onclick={() => (catalogTab = '2d')}
						class="flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs transition-all {
							catalogTab === '2d'
								? 'border-pink-500 text-pink-600 dark:text-pink-300 font-semibold shadow-sm'
								: isLightTheme
									? 'border-transparent text-zinc-500 hover:text-zinc-900'
									: 'border-transparent text-zinc-400 hover:text-zinc-200'
						}"
					>
						<Layers class="w-4 h-4 text-pink-500" />
						<span>2D Live2D Resmi & Sampel ({officialPreinstalledModels.length + OFFICIAL_SAMPLE_CATALOG.length})</span>
					</button>
					<button
						onclick={() => (catalogTab = 'booth')}
						class="flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs transition-all {
							catalogTab === 'booth'
								? 'border-purple-500 text-purple-600 dark:text-purple-300 font-semibold shadow-sm'
								: isLightTheme
									? 'border-transparent text-zinc-500 hover:text-zinc-900'
									: 'border-transparent text-zinc-400 hover:text-zinc-200'
						}"
					>
						<Heart class="w-4 h-4 text-purple-500 fill-purple-500/30" />
						<span>BOOTH.pm Koleksi ({boothPreinstalledModels.length + BOOTH_SHOWCASE_CATALOG.length})</span>
					</button>
					<button
						onclick={() => (catalogTab = '3d')}
						class="flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs transition-all {
							catalogTab === '3d'
								? 'border-cyan-500 text-cyan-600 dark:text-cyan-300 font-semibold shadow-sm'
								: isLightTheme
									? 'border-transparent text-zinc-500 hover:text-zinc-900'
									: 'border-transparent text-zinc-400 hover:text-zinc-200'
						}"
					>
						<Box class="w-4 h-4 text-cyan-500" />
						<span>3D WebGL Avatar ({MODEL_3D_CATALOG.length})</span>
					</button>
				</div>

				<!-- Active Status Tag -->
				<div class="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400">
					<span>Avatar Aktif:</span>
					<span class="px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 font-semibold font-mono border border-zinc-700">
						{rigging.avatarEngine === '3d'
							? (MODEL_3D_CATALOG.find((m) => m.id === rigging.selected3DModelId)?.name || rigging.selected3DModelId)
							: rigging.modelName}
					</span>
				</div>
			</div>

			<!-- Live Model Download & Extract Progress Banner -->
			{#if isDownloadingModel}
				<div class="px-6 py-2.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border-b border-pink-500/30 flex items-center justify-between text-xs text-pink-300 animate-pulse shadow-inner">
					<div class="flex items-center gap-2.5">
						<Sparkles class="w-4 h-4 text-pink-400 animate-spin" />
						<span class="font-semibold text-zinc-100">{downloadProgressText || 'Sedang memproses model...'}</span>
					</div>
					<span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono font-medium">
						Auto-Installer In-Memory
					</span>
				</div>
			{/if}

			<!-- Body Content (Scrollable with Drag & Drop ZIP support) -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="p-6 overflow-y-auto space-y-6 text-xs custom-scrollbar"
				ondragover={(e) => e.preventDefault()}
				ondrop={(e) => {
					e.preventDefault();
					if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
						processLive2DFiles(e.dataTransfer.files);
					}
				}}
			>
				<!-- Hidden Folder, Multi-file, and ZIP Pickers for 100% Reliable Local Model Loading -->
				<input
					type="file"
					accept=".zip,application/zip,application/x-zip-compressed"
					bind:this={zipInputEl}
					onchange={handleZipSelect}
					class="hidden"
				/>
				<input
					type="file"
					webkitdirectory
					bind:this={folderInputEl}
					onchange={handleFolderSelect}
					class="hidden"
				/>
				<input
					type="file"
					multiple
					accept=".json,.moc3,.png,.motion3.json,.physics3.json,.cdi3.json"
					bind:this={multiFileInputEl}
					onchange={handleMultiFileSelect}
					class="hidden"
				/>

				{#if catalogTab === '2d'}
					<!-- 2D Live2D Catalog Grid: Official Ready, Official Free Samples, Neuro-sama & Custom Loader -->
					<div class="space-y-6">
						<!-- Live2D Official Learn & Sample Banner -->
						<div class="p-4 bg-gradient-to-r from-cyan-950/40 via-sky-950/30 to-zinc-900/60 rounded-2xl border border-cyan-500/30 shadow-lg space-y-3">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div class="flex items-start gap-3">
									<div class="p-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-sm shrink-0">
										<Layers class="w-5 h-5 text-cyan-400" />
									</div>
									<div>
										<div class="flex items-center gap-2">
											<h4 class="font-bold text-sm text-cyan-200">Katalog Sampel Resmi Live2D Cubism & Komunitas</h4>
											<span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-semibold uppercase tracking-wider border border-cyan-500/30">
												Cubism 3/4
											</span>
										</div>
										<p class="text-xs text-zinc-300/90 mt-0.5 leading-relaxed">
											Model resmi dari <strong>Live2D Inc. (live2d.com/learn/sample)</strong> dan avatar AI VTuber komunitas. Klik model siap pakai untuk langsung beralih, atau pasang folder model hasil unduhan Anda.
										</p>
									</div>
								</div>

								<div class="flex items-center gap-2 shrink-0">
									<a
										href="https://www.live2d.com/en/learn/sample/"
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
									>
										<ExternalLink class="w-3.5 h-3.5" />
										<span>Sampel live2d.com</span>
									</a>
								</div>
							</div>
						</div>

						<!-- GROUP 1: Model 2D Siap Pakai (All 15 Pre-installed Models: HoYoverse/Kuro, Booth & Official) -->
						<div class="space-y-3">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<h3 class="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
									<Sparkles class="w-3.5 h-3.5 text-cyan-400" />
									Model 2D Siap Pakai ({displayed2DModels.length} dari {MODEL_CATALOG.length} Model)
								</h3>
								<span class="text-[10px] text-zinc-500">Klik kartu untuk langsung aktifkan avatar</span>
							</div>

							<!-- Category Filter Pills for 2D Models -->
							<div class="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
								<button
									type="button"
									onclick={() => (catalog2DFilter = 'all')}
									class="px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer {
										catalog2DFilter === 'all'
											? 'bg-cyan-500/25 border-cyan-500 text-cyan-200 shadow-sm'
											: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
									}"
								>
									Semua 2D ({MODEL_CATALOG.length})
								</button>
								<button
									type="button"
									onclick={() => (catalog2DFilter = 'game')}
									class="px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 {
										catalog2DFilter === 'game'
											? 'bg-amber-500/25 border-amber-500 text-amber-200 shadow-sm'
											: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-amber-300'
									}"
								>
									<span>🌟 ZZZ / WuWa / HSR</span>
									<span class="text-[10px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">5</span>
								</button>
								<button
									type="button"
									onclick={() => (catalog2DFilter = 'booth')}
									class="px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 {
										catalog2DFilter === 'booth'
											? 'bg-pink-500/25 border-pink-500 text-pink-200 shadow-sm'
											: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-pink-300'
									}"
								>
									<span>🌸 BOOTH Anime</span>
									<span class="text-[10px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">2</span>
								</button>
								<button
									type="button"
									onclick={() => (catalog2DFilter = 'official')}
									class="px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 {
										catalog2DFilter === 'official'
											? 'bg-sky-500/25 border-sky-500 text-sky-200 shadow-sm'
											: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-sky-300'
									}"
								>
									<span>🎌 Live2D Resmi</span>
									<span class="text-[10px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">8</span>
								</button>
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
												? 'bg-zinc-900 border-cyan-500 text-white shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/40'
												: 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700'
										}"
									>
										{#if isActive}
											<div class="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500 text-zinc-950 font-bold text-[9px] shadow-sm tracking-wide z-10">
												<Check class="w-3 h-3 stroke-[3]" />
												AKTIF
											</div>
										{/if}

										<div class="flex items-start gap-3.5 mb-2.5">
											<div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-800/90 border border-zinc-700/80 shrink-0 shadow-md group-hover:scale-105 transition-transform">
												{#if model.avatarUrl}
													<img
														src={model.avatarUrl}
														alt={model.name}
														class="w-full h-full object-cover object-top"
														style="image-rendering: -webkit-optimize-contrast;"
														loading="lazy"
														referrerpolicy="no-referrer"
													/>
												{:else}
													<div class="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
														<Layers class="w-8 h-8" />
													</div>
												{/if}
											</div>

											<div class="flex flex-col min-w-0 flex-1 pt-0.5">
												<div class="flex items-center gap-1.5 mb-1">
													<span class="font-bold text-xs text-zinc-100 truncate">{model.name}</span>
												</div>
												<div class="flex items-center gap-1.5 mb-1">
													<span class="inline-flex self-start px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 font-mono text-[9px] border border-zinc-700">
														{model.version}
													</span>
													<span class="px-1.5 py-0.5 rounded font-semibold text-[8px] uppercase tracking-wide border {
														model.source === 'booth'
															? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
															: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
													}">
														{model.source === 'booth' ? 'BOOTH' : 'Resmi'}
													</span>
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

										{#if model.tags && model.tags.length > 0}
											<div class="flex flex-wrap gap-1 mt-auto pt-2 border-t border-zinc-800/60">
												{#each model.tags as tag}
													<span class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-800/80 text-zinc-300">
														{tag}
													</span>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						<!-- GROUP 2: Sampel Gratis Resmi dari live2d.com -->
						<div class="space-y-3 pt-2 border-t border-zinc-800/60">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
								<h3 class="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
									<Download class="w-3.5 h-3.5 text-sky-400" />
									Sampel Gratis Live2D Inc. (live2d.com/learn/sample)
								</h3>
								<span class="text-[10px] text-zinc-400">Unduh paket resmi dari Live2D lalu klik <strong>Pasang Folder Model</strong></span>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
								{#each OFFICIAL_SAMPLE_CATALOG as sample}
									{@const isActive = rigging.selectedModelId === sample.id}
									<div class="flex flex-col p-3.5 rounded-2xl border text-left transition-all bg-zinc-900/60 border-zinc-800/80 hover:border-sky-500/50 hover:bg-zinc-900 group shadow-md relative {
										isActive ? 'ring-2 ring-sky-500/50 border-sky-500' : ''
									}">
										{#if isActive}
											<div class="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500 text-zinc-950 font-bold text-[9px] shadow-sm tracking-wide z-10">
												<Check class="w-3 h-3 stroke-[3]" />
												AKTIF
											</div>
										{/if}

										<div class="flex items-start gap-3.5 mb-2.5">
											<div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-800/90 border border-zinc-700/80 shrink-0 shadow-md group-hover:scale-105 transition-transform">
												<img src={sample.avatarUrl} alt={sample.name} class="w-full h-full object-cover object-top" style="image-rendering: -webkit-optimize-contrast;" loading="lazy" referrerpolicy="no-referrer" />
											</div>
											<div class="flex flex-col min-w-0 flex-1 pt-0.5">
												<div class="flex items-center gap-1.5 mb-0.5">
													<span class="font-bold text-xs text-zinc-100 truncate group-hover:text-sky-300 transition-colors" title={sample.name}>
														{sample.name}
													</span>
												</div>
												<span class="text-[10px] text-zinc-400 truncate mb-1">
													Kreator: <strong class="text-sky-400 font-semibold">{sample.author}</strong>
												</span>
												<p class="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
													{sample.description}
												</p>
											</div>
										</div>

										<div class="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[9px] text-zinc-400 leading-tight mb-2.5">
											<span class="text-zinc-500 block font-mono font-semibold uppercase mb-0.5">Lisensi Resmi:</span>
											{sample.copyright}
										</div>

										<div class="flex flex-wrap gap-1 mb-3">
											{#each sample.tags as tag}
												<span class="px-1.5 py-0.5 rounded text-[8px] font-medium bg-zinc-800 text-zinc-300">
													{tag}
												</span>
											{/each}
										</div>

										<div class="mt-auto pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
											<button
												type="button"
												onclick={() => triggerInstallModel(sample)}
												class="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sky-300 hover:text-white border border-sky-500/40 rounded-xl text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
												title="Pasang folder model hasil download dari Live2D"
											>
												<UploadCloud class="w-3.5 h-3.5 text-sky-400" />
												<span>Pasang Model Ini</span>
											</button>

											<a
												href={sample.sampleUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/90 hover:bg-sky-500 text-white rounded-xl text-[11px] font-semibold transition-all active:scale-95 shadow-sm"
											>
												<ExternalLink class="w-3 h-3" />
												<span>Unduh live2d.com</span>
											</a>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- Section 4: Muat Model Live2D Sendiri (Folder / Multi-File / Unduh Otomatis URL) -->
						<div class="mt-4 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<span class="text-xs font-semibold text-zinc-200 flex items-center gap-2">
									<FolderOpen class="w-4 h-4 text-pink-400" />
									Muat Model Live2D Sendiri (Folder / Multi-File / Unduh Otomatis URL)
								</span>
								<div class="flex items-center gap-2">
									<button
										onclick={() => folderInputEl?.click()}
										class="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
										title="Pilih folder model unzipped yang berisi .model3.json dan folder tekstur"
									>
										<FolderOpen class="w-3.5 h-3.5" />
										<span>Pilih Folder Model</span>
									</button>
									<button
										onclick={() => multiFileInputEl?.click()}
										class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
										title="Pilih semua file di dalam folder (.model3.json, .moc3, .png)"
									>
										<FileCode class="w-3.5 h-3.5 text-cyan-400" />
										<span>Pilih Multi-File</span>
									</button>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Link class="w-4 h-4 text-pink-400 shrink-0 ml-1" />
								<input
									type="text"
									bind:value={customUrlInput}
									placeholder="Unduh & Pasang Otomatis dari URL (.zip atau .model3.json): https://..."
									class="flex-1 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
								/>
								<button
									onclick={handleLoadCustomUrl}
									disabled={isDownloadingModel}
									class="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-lg text-xs transition-colors border border-pink-500/50 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
								>
									<Download class="w-3.5 h-3.5" />
									<span>Unduh & Pasang Auto</span>
								</button>
							</div>
						</div>
					</div>
				{:else if catalogTab === 'booth'}
					<!-- BOOTH.pm Tab: Separated Pre-installed Ready-to-Use vs Curated Showcase -->
					<div class="space-y-6 animate-in fade-in duration-150">
						<!-- BOOTH Header Banner -->
						<div class="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-zinc-900 border border-pink-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
							<div class="flex items-center gap-3">
								<div class="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
									<Heart class="w-5 h-5 fill-pink-500/40" />
								</div>
								<div>
									<h3 class="text-sm font-bold text-pink-200 flex items-center gap-2">
										Koleksi Kreator BOOTH.pm (Siap Pakai & Showcase)
										<span class="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono font-semibold">
											{boothPreinstalledModels.length + BOOTH_SHOWCASE_CATALOG.length} Model
										</span>
									</h3>
									<p class="text-xs text-zinc-300 mt-0.5 leading-relaxed">
										Koleksi avatar Live2D dari kreator BOOTH.pm. Model siap pakai dapat langsung Anda klik, sedangkan model showcase terkurasi dapat diunduh dari BOOTH dan dipasang via folder.
									</p>
								</div>
							</div>
							<div class="flex items-center gap-2 shrink-0">
								<a
									href="https://booth.pm/ja/topics/FREE_LIVE2D"
									target="_blank"
									rel="noopener noreferrer"
									class="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
								>
									<ExternalLink class="w-3.5 h-3.5" />
									<span>Katalog BOOTH Free</span>
								</a>
							</div>
						</div>

						<!-- GROUP 1: Model Siap Pakai BOOTH.pm (Pre-installed: Mihari & Vivian) -->
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<h3 class="text-[11px] font-semibold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
									<Heart class="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
									Model BOOTH.pm Siap Pakai ({boothPreinstalledModels.length} Model Terpasang)
								</h3>
								<span class="text-[10px] text-zinc-500">Model terpasang lokal dengan tekstur 4K & fisika lengkap</span>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
								{#each boothPreinstalledModels as model}
									{@const isActive = rigging.avatarEngine === 'live2d' && (rigging.selectedModelId === model.id || rigging.modelUrl === model.url)}
									<div
										role="button"
										tabindex="0"
										onclick={() => handleSelect2DModel(model)}
										onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect2DModel(model); }}
										class="relative flex flex-col p-4 rounded-2xl border text-left transition-all cursor-pointer group {
											isActive
												? 'bg-zinc-900 border-pink-500 text-white shadow-lg shadow-pink-500/15 ring-2 ring-pink-500/40'
												: 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 hover:border-pink-500/40'
										}"
									>
										{#if isActive}
											<div class="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500 text-zinc-950 font-bold text-[9px] shadow-sm tracking-wide z-10">
												<Check class="w-3 h-3 stroke-[3]" />
												SEDANG AKTIF
											</div>
										{/if}

										<div class="flex items-start gap-3.5 mb-2.5">
											<div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-800/90 border border-zinc-700/80 shrink-0 shadow-md group-hover:scale-105 transition-transform">
												{#if model.avatarUrl}
													<img
														src={model.avatarUrl}
														alt={model.name}
														class="w-full h-full object-cover object-top"
														style="image-rendering: -webkit-optimize-contrast;"
														loading="lazy"
														referrerpolicy="no-referrer"
													/>
												{/if}
											</div>

											<div class="flex flex-col min-w-0 flex-1 pt-0.5">
												<div class="flex items-center gap-2 mb-1">
													<span class="font-bold text-sm text-zinc-100 truncate group-hover:text-pink-300 transition-colors">{model.name}</span>
													<span class="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono text-[9px] font-bold border border-pink-500/30">
														SIAP PAKAI
													</span>
												</div>
												<span class="text-[10px] text-zinc-400 truncate mb-1">
													Kreator: <strong class="text-pink-400 font-semibold">{model.author}</strong>
												</span>
												<p class="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
													{model.description}
												</p>
											</div>
										</div>

										{#if model.tags && model.tags.length > 0}
											<div class="flex flex-wrap gap-1 mt-auto pt-2.5 border-t border-zinc-800/60">
												{#each model.tags as tag}
													<span class="px-2 py-0.5 rounded text-[9px] font-medium {tag.includes('BOOTH') ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-zinc-800 text-zinc-300'}">
														{tag}
													</span>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						<!-- GROUP 2: Showcase Terkurasi BOOTH.pm (Download & Pasang) -->
						<div class="space-y-3 pt-3 border-t border-zinc-800/60">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
								<h3 class="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
									<Sparkles class="w-3.5 h-3.5 text-purple-400" />
									Showcase Terkurasi BOOTH.pm ({BOOTH_SHOWCASE_CATALOG.length} Model)
								</h3>
								<span class="text-[10px] text-zinc-400">Unduh paket resmi dari BOOTH lalu pasang folder model di sini</span>
							</div>

							<!-- Category Group Filter Pills -->
							<div class="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
								<span class="text-zinc-400 font-medium text-[11px] mr-1">Kelompok:</span>
								<button
									type="button"
									onclick={() => (boothCategoryFilter = 'all')}
									class="px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer {
										boothCategoryFilter === 'all'
											? 'bg-pink-500/25 border-pink-500 text-pink-200 shadow-sm'
											: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
									}"
								>
									Semua BOOTH ({BOOTH_SHOWCASE_CATALOG.length})
								</button>
								<button
									type="button"
									onclick={() => (boothCategoryFilter = 'hoyoverse-kuro')}
									class="px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 {
										boothCategoryFilter === 'hoyoverse-kuro'
											? 'bg-amber-500/25 border-amber-500 text-amber-200 shadow-sm'
											: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-amber-300'
									}"
								>
									<span>🌟 HoYoverse & Kuro Games</span>
									<span class="text-[10px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">4</span>
								</button>
								<button
									type="button"
									onclick={() => (boothCategoryFilter = 'original-anime')}
									class="px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 {
										boothCategoryFilter === 'original-anime'
											? 'bg-pink-500/25 border-pink-500 text-pink-200 shadow-sm'
											: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-pink-300'
									}"
								>
									<span>🌸 Original Anime Girls</span>
									<span class="text-[10px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">4</span>
								</button>
								<button
									type="button"
									onclick={() => (boothCategoryFilter = 'vts-popular')}
									class="px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 {
										boothCategoryFilter === 'vts-popular'
											? 'bg-cyan-500/25 border-cyan-500 text-cyan-200 shadow-sm'
											: 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-cyan-300'
									}"
								>
									<span>🐱 VTube Studio Favorites</span>
									<span class="text-[10px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">2</span>
								</button>
							</div>

							<!-- Grid of Filtered BOOTH Models -->
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
								{#each displayedBoothModels as item}
									{@const isActive = rigging.selectedModelId === item.id}
									<div class="flex flex-col p-3.5 rounded-2xl border text-left transition-all bg-zinc-900/60 border-zinc-800/80 hover:border-pink-500/50 hover:bg-zinc-900 group shadow-md relative {
										isActive ? 'ring-2 ring-pink-500/50 border-pink-500' : ''
									}">
										{#if isActive}
											<div class="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500 text-zinc-950 font-bold text-[9px] shadow-sm tracking-wide z-10">
												<Check class="w-3 h-3 stroke-[3]" />
												AKTIF
											</div>
										{/if}

										<!-- Top Row: Thumbnail + Info -->
										<div class="flex items-start gap-3.5 mb-2.5">
											<div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-800/90 border border-zinc-700/80 shrink-0 shadow-md group-hover:scale-105 transition-transform">
												<img src={item.avatarUrl} alt={item.name} class="w-full h-full object-cover object-top" style="image-rendering: -webkit-optimize-contrast;" loading="lazy" referrerpolicy="no-referrer" />
											</div>
											<div class="flex flex-col min-w-0 flex-1 pt-0.5">
												<div class="flex items-center gap-1.5 mb-0.5">
													<span class="font-bold text-xs text-zinc-100 truncate group-hover:text-pink-300 transition-colors" title={item.name}>
														{item.name}
													</span>
												</div>
												<div class="flex items-center gap-1.5 mb-1">
													<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold {
														item.category === 'hoyoverse-kuro'
															? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
															: item.category === 'vts-popular'
															? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
															: 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
													}">
														{item.categoryLabel}
													</span>
												</div>
												<span class="text-[10px] text-zinc-400 truncate">
													Kreator: <strong class="text-pink-400 font-semibold">{item.author}</strong>
												</span>
												<p class="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mt-1">
													{item.description}
												</p>
											</div>
										</div>

										<!-- Copyright & Terms Notice -->
										<div class="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[9px] text-zinc-400 leading-tight mb-2.5">
											<span class="text-zinc-500 block font-mono font-semibold uppercase mb-0.5">Lisensi & Hak Cipta:</span>
											{item.copyright}
										</div>

										<!-- Tags -->
										<div class="flex flex-wrap gap-1 mb-3">
											{#each item.tags as tag}
												<span class="px-1.5 py-0.5 rounded text-[8px] font-medium {tag.includes('BOOTH') ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-zinc-800 text-zinc-300'}">
													{tag}
												</span>
											{/each}
										</div>

										<!-- Action Buttons: Pasang Model Ini + Buka di BOOTH -->
										<div class="mt-auto pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
											<button
												type="button"
												onclick={() => triggerInstallModel(item)}
												class="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-pink-300 hover:text-white border border-pink-500/40 rounded-xl text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
												title="Unduh gratis di BOOTH lalu pasang file ZIP untuk {item.name}"
											>
												<UploadCloud class="w-3.5 h-3.5 text-pink-400" />
												<span>Pasang ZIP Model Ini</span>
											</button>

											<a
												href={item.boothUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600/90 hover:bg-pink-500 text-white rounded-xl text-[11px] font-semibold transition-all active:scale-95 shadow-sm"
											>
												<ExternalLink class="w-3 h-3" />
												<span>Unduh BOOTH</span>
											</a>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- Section: Pasang Model BOOTH Anda Sendiri (Folder / Multi-File / Unduh Otomatis URL) -->
						<div class="mt-4 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<span class="text-xs font-semibold text-zinc-200 flex items-center gap-2">
									<FolderOpen class="w-4 h-4 text-purple-400" />
									Pasang Model BOOTH Anda Sendiri (Folder / Multi-File / Unduh Otomatis URL)
								</span>
								<div class="flex items-center gap-2">
									<button
										onclick={() => folderInputEl?.click()}
										class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
										title="Pilih folder model unzipped yang berisi .model3.json dan folder tekstur"
									>
										<FolderOpen class="w-3.5 h-3.5" />
										<span>Pilih Folder Model</span>
									</button>
									<button
										onclick={() => multiFileInputEl?.click()}
										class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
										title="Pilih semua file di dalam folder (.model3.json, .moc3, .png)"
									>
										<FileCode class="w-3.5 h-3.5 text-cyan-400" />
										<span>Pilih Multi-File</span>
									</button>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Link class="w-4 h-4 text-purple-400 shrink-0 ml-1" />
								<input
									type="text"
									bind:value={customUrlInput}
									placeholder="Unduh & Pasang Otomatis dari URL (.zip atau .model3.json): https://..."
									class="flex-1 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
								/>
								<button
									onclick={handleLoadCustomUrl}
									disabled={isDownloadingModel}
									class="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition-colors border border-purple-500/50 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
								>
									<Download class="w-3.5 h-3.5" />
									<span>Unduh & Pasang Auto</span>
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
									<div class="flex items-start gap-3.5 mb-2.5">
										<div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-800/90 border border-zinc-700/80 shrink-0 shadow-md group-hover:scale-105 transition-transform">
											{#if model.avatarUrl}
												<img
													src={model.avatarUrl}
													alt={model.name}
													class="w-full h-full object-cover object-top"
													style="image-rendering: -webkit-optimize-contrast;"
													loading="lazy"
													referrerpolicy="no-referrer"
												/>
											{:else}
												<div class="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
													<Box class="w-8 h-8" />
												</div>
											{/if}
										</div>

										<div class="flex flex-col min-w-0 flex-1 pt-0.5">
											<div class="flex items-center gap-1.5 mb-1">
												<span class="font-bold text-xs text-zinc-100 truncate">{model.name}</span>
											</div>
											<span class="inline-flex self-start px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 font-mono text-[9px] border border-zinc-700 mb-1">
												{model.type === 'fbx' ? '3D HUMANOID (FBX)' : model.type === 'glb' ? '3D GLB MESH' : '3D PROCEDURAL'}
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
