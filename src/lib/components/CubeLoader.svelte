<script lang="ts">
	import { i18n } from '#lib/i18n/index.svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		modelName?: string;
		engine?: string;
		asOverlay?: boolean;
	}

	let {
		title = 'MEMUAT AVATAR',
		subtitle = i18n.t('loading_stage_subtitle'),
		modelName = '',
		engine = '',
		asOverlay = true
	}: Props = $props();
</script>

<div
	class={asOverlay
		? 'fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/85 backdrop-blur-md select-none animate-in fade-in duration-300'
		: 'flex items-center justify-center p-6 select-none'}
>
	<div class="flex flex-col items-center justify-center gap-10 p-6 sm:p-12 perspective-container">
		<!-- 3D Cube Assembly (Daiwiik Harihar Cube Loader) -->
		<div class="relative w-24 h-24 flex items-center justify-center preserve-3d">
			<div class="relative w-full h-full preserve-3d animate-cube-spin">
				<!-- Glowing Central Core -->
				<div
					class="absolute inset-0 m-auto w-8 h-8 bg-white rounded-full blur-md shadow-[0_0_40px_rgba(255,255,255,0.95)] animate-pulse-fast"
				></div>

				<!-- Front & Back Faces: Cyan Translucent -->
				<div class="side-wrapper front">
					<div
						class="face bg-cyan-500/10 border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.45)]"
					></div>
				</div>
				<div class="side-wrapper back">
					<div
						class="face bg-cyan-500/10 border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.45)]"
					></div>
				</div>

				<!-- Left & Right Faces: Purple Translucent -->
				<div class="side-wrapper right">
					<div
						class="face bg-purple-500/10 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]"
					></div>
				</div>
				<div class="side-wrapper left">
					<div
						class="face bg-purple-500/10 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]"
					></div>
				</div>

				<!-- Top & Bottom Faces: Indigo Translucent -->
				<div class="side-wrapper top">
					<div
						class="face bg-indigo-500/10 border-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.45)]"
					></div>
				</div>
				<div class="side-wrapper bottom">
					<div
						class="face bg-indigo-500/10 border-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.45)]"
					></div>
				</div>
			</div>

			<!-- Ambient Floor Shadow -->
			<div
				class="absolute -bottom-20 w-28 h-8 bg-black/60 blur-xl rounded-[100%] animate-shadow-breathe pointer-events-none"
			></div>
		</div>

		<!-- Futuristic Loading Microcopy & Avatar Details -->
		<div class="flex flex-col items-center gap-2 mt-4 text-center z-10">
			<h3
				class="text-xs sm:text-sm font-bold tracking-[0.35em] text-cyan-300 uppercase animate-glitch-text drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
			>
				{title}
			</h3>

			{#if modelName}
				<div
					class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-medium shadow-[0_0_15px_rgba(6,182,212,0.2)] max-w-xs truncate"
				>
					<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
					<span class="truncate">{modelName}</span>
					{#if engine}
						<span
							class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold ml-1 border border-cyan-500/30"
						>
							{engine}
						</span>
					{/if}
				</div>
			{/if}

			<p class="text-xs text-zinc-400 font-sans tracking-wide max-w-xs">
				{subtitle}
			</p>

			<!-- Equalizer Rhythm Indicator -->
			<div class="flex items-center gap-1 pt-2">
				{#each [30, 65, 90, 55, 80, 45, 70] as height, idx}
					<div
						class="w-1 rounded-full bg-gradient-to-t from-cyan-500 via-purple-500 to-indigo-400 animate-pulse"
						style="height: {height / 4}px; animation-delay: {idx * 80}ms; animation-duration: 800ms;"
					></div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.perspective-container {
		perspective: 1200px;
	}

	.preserve-3d {
		transform-style: preserve-3d;
	}

	/* 1. Cube Spin: Rotates the entire assembly smoothly across X and Y axes */
	@keyframes cubeSpin {
		0% {
			transform: rotateX(0deg) rotateY(0deg);
		}
		100% {
			transform: rotateX(360deg) rotateY(360deg);
		}
	}

	/* 2. Face Breathing: Moves the face outward (translateZ) and back */
	@keyframes breathe {
		0%,
		100% {
			transform: translateZ(48px);
			opacity: 0.85;
		}
		50% {
			transform: translateZ(80px);
			opacity: 0.45;
			border-color: rgba(255, 255, 255, 0.85);
		}
	}

	/* 3. Central Core Glowing Pulse */
	@keyframes pulse-fast {
		0%,
		100% {
			transform: scale(0.8);
			opacity: 0.6;
		}
		50% {
			transform: scale(1.2);
			opacity: 1;
		}
	}

	/* 4. Floor Shadow Breathing */
	@keyframes shadow-breathe {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.45;
		}
		50% {
			transform: scale(1.5);
			opacity: 0.2;
		}
	}

	/* 5. Futuristic Microcopy Subtle Glitch */
	@keyframes glitch {
		0% {
			clip-path: inset(10% 0 80% 0);
			transform: translate(-2px, 1px);
		}
		20% {
			clip-path: inset(80% 0 5% 0);
			transform: translate(2px, -1px);
		}
		40% {
			clip-path: inset(40% 0 50% 0);
			transform: translate(-2px, 2px);
		}
		60% {
			clip-path: inset(10% 0 60% 0);
			transform: translate(2px, -2px);
		}
		80% {
			clip-path: inset(30% 0 20% 0);
			transform: translate(1px, 2px);
		}
		100% {
			clip-path: inset(10% 0 80% 0);
			transform: translate(-2px, 1px);
		}
	}

	.animate-cube-spin {
		animation: cubeSpin 8s linear infinite;
	}

	.animate-pulse-fast {
		animation: pulse-fast 2s ease-in-out infinite;
	}

	.animate-shadow-breathe {
		animation: shadow-breathe 3s ease-in-out infinite;
	}

	.animate-glitch-text {
		animation: glitch 2.4s infinite linear alternate-reverse;
	}

	/* Side Positioning & 3D Depth */
	.side-wrapper {
		position: absolute;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		transform-style: preserve-3d;
	}

	.face {
		width: 100%;
		height: 100%;
		position: absolute;
		animation: breathe 3s ease-in-out infinite;
		backdrop-filter: blur(2px);
	}

	/* Rotations to form the regular 6-sided 3D cube */
	.front {
		transform: rotateY(0deg);
	}
	.back {
		transform: rotateY(180deg);
	}
	.right {
		transform: rotateY(90deg);
	}
	.left {
		transform: rotateY(-90deg);
	}
	.top {
		transform: rotateX(90deg);
	}
	.bottom {
		transform: rotateX(-90deg);
	}
</style>
