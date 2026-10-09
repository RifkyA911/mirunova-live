import type { Live2DModelItem } from '#lib/types/tracking';

export interface Model3DItem {
	id: string;
	name: string;
	type: 'procedural' | 'glb';
	url?: string;
	avatarUrl?: string;
	description: string;
	variant?: 'mochi' | 'kuro' | 'tora';
	tags?: string[];
}

export const MODEL_CATALOG: (Live2DModelItem & { tags?: string[] })[] = [
	{
		id: 'momose_aria',
		name: 'Momose Aria (百瀬アリア)',
		url: '/models/momose_aria/momose_aria.jpg',
		description: '2D Reactive illustration with head parallax, natural eye blink, speech sync & high-five hands.',
		version: '2D Reactive',
		modelType: 'avatar2d',
		avatarUrl: '/models/momose_aria/chara_icon_02.jpg',
		tags: ['2D Reactive', 'High-Five', 'Parallax', 'Lip Sync']
	},
	{
		id: 'haru',
		name: 'Haru Greeter',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Haru/Haru.model3.json',
		description: 'Official Cubism 4 greeter model with complete facial, hair & body physics rigging.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/haru.svg',
		tags: ['Cubism 4', 'Full Rig', 'Hair Physics', 'Motions']
	},
	{
		id: 'hiyori',
		name: 'Hiyori Momose',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Hiyori/Hiyori.model3.json',
		description: 'Official Live2D Cubism high-definition showcase anime model with rich expressions.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/hiyori.svg',
		tags: ['Cubism 4', 'Showcase', 'Expressions', 'Twin-Tail']
	},
	{
		id: 'mao',
		name: 'Mao Pro',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Mao/Mao.model3.json',
		description: 'Expressive student avatar with broad eyebrow and phoneme mouth blendshapes.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/mao.svg',
		tags: ['Cubism 4', 'Student', 'Eyebrow Sync', 'Motions']
	},
	{
		id: 'rice',
		name: 'Rice (Neko Chibi)',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Rice/Rice.model3.json',
		description: 'Adorable cat-eared chibi anime mascot with fluid physics and cute expressions.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/rice.svg',
		tags: ['Cubism 4', 'Chibi', 'Cat Ears', 'Fluid Physics']
	},
	{
		id: 'wanko',
		name: 'Wanko Puppy',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Wanko/Wanko.model3.json',
		description: 'Adorable puppy mascot with reactive ear and wagging tail physics.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/wanko.svg',
		tags: ['Cubism 4', 'Puppy', 'Tail Wag', 'Ear Bounce']
	},
	{
		id: 'natori',
		name: 'Natori',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Natori/Natori.model3.json',
		description: 'Classic school uniform avatar with subtle tilt and expression dynamics.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/natori.svg',
		tags: ['Cubism 4', 'School', 'Subtle Physics', 'Classic']
	}
];

export const MODEL_3D_CATALOG: Model3DItem[] = [
	{
		id: 'mochi-cat',
		name: 'Mochi The Cat (Shiro Neko)',
		type: 'procedural',
		variant: 'mochi',
		avatarUrl: '/models/previews/mochi.svg',
		description: 'Snow-white 3D anime cat with responsive ears, eyes, blinking, mouth sync, and swaying tail.',
		tags: ['3D WebGL', 'Procedural', 'Ear Twitch', 'Tail Sway', 'Paw Wave']
	},
	{
		id: 'kuro-cat',
		name: 'Kuro The Cat (Kuro Neko)',
		type: 'procedural',
		variant: 'kuro',
		avatarUrl: '/models/previews/kuro.svg',
		description: 'Midnight black 3D cat with glowing emerald eyes and reactive tracking.',
		tags: ['3D WebGL', 'Emerald Eyes', 'Procedural', 'Dark Mode']
	},
	{
		id: 'tora-cat',
		name: 'Ginger The Cat (Tora Neko)',
		type: 'procedural',
		variant: 'tora',
		avatarUrl: '/models/previews/tora.svg',
		description: 'Golden ginger tabby 3D cat with warm amber eyes and bell collar.',
		tags: ['3D WebGL', 'Tabby Stripes', 'Amber Eyes', 'Bell Collar']
	}
];
