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
		id: 'mihari',
		name: 'Mihari (绪山美波里)',
		url: '/models/mihari/Mihari_V1.model3.json',
		description: 'Model Live2D Cubism 3/4 Oyama Mihari dengan fisika kuncir perak, tekstur 4K, dan part pakaian lengkap dari Booth VTS.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/mihari/Mihari.jpg',
		source: 'booth',
		boothUrl: 'https://booth.pm/en/search/Live2D',
		author: 'nekotoufu / Booth VTS',
		tags: ['BOOTH.pm', 'Kawaii Girl', 'Cubism 3/4', 'High-Res 4K', 'Ponytail Physics', 'Body Parts', 'Anime']
	},
	{
		id: 'vivian',
		name: '薇薇安 (Vivian)',
		url: '/models/vivian/薇薇安.model3.json',
		description: 'Model Live2D Cubism 4 beresolusi ultra-tinggi (4096px) dengan fisika rambut gaun halus, parasol, dan 6 ekspresi dari Booth.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/vivian.png',
		source: 'booth',
		boothUrl: 'https://booth.pm/en/search/Live2D',
		author: '魔都Romantic / Booth Creator',
		tags: ['BOOTH.pm', 'Kawaii Girl', 'Cubism 4', 'High-Res 4K', 'Expressions', 'Physics', 'Parasol']
	},
	{
		id: 'hiyori',
		name: 'Hiyori Momose (百瀬ヒヨリ)',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Hiyori/Hiyori.model3.json',
		description: 'Official Live2D Cubism high-definition showcase anime twin-tail idol dengan ekspresi kaya.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/hiyori.jpg',
		source: 'official',
		author: 'Live2D Official',
		tags: ['Kawaii Idol', 'Cubism 4', 'Showcase', 'Expressions', 'Twin-Tail']
	},
	{
		id: 'rice',
		name: 'Rice (Neko Chibi / こめ)',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Rice/Rice.model3.json',
		description: 'Maskot anime chibi telinga kucing super kawaii dengan fisika fluid dan ekspresi gemas.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/rice.jpg',
		source: 'official',
		author: 'Live2D Official',
		tags: ['Kawaii Neko', 'Chibi', 'Cat Ears', 'Fluid Physics']
	},
	{
		id: 'haru',
		name: 'Haru Greeter',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Haru/Haru.model3.json',
		description: 'Official Cubism 4 greeter model with complete facial, hair & body physics rigging.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/haru.jpg',
		source: 'official',
		author: 'Live2D Official',
		tags: ['Cubism 4', 'Full Rig', 'Hair Physics', 'Motions']
	},
	{
		id: 'mao',
		name: 'Mao Pro',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Mao/Mao.model3.json',
		description: 'Expressive student avatar with broad eyebrow and phoneme mouth blendshapes.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/mao.jpg',
		source: 'official',
		author: 'Live2D Official',
		tags: ['Cubism 4', 'Student', 'Eyebrow Sync', 'Motions']
	},
	{
		id: 'wanko',
		name: 'Wanko Puppy',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Wanko/Wanko.model3.json',
		description: 'Adorable puppy mascot with reactive ear and wagging tail physics.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/wanko.png',
		source: 'official',
		author: 'Live2D Official',
		tags: ['Cubism 4', 'Puppy', 'Tail Wag', 'Ear Bounce']
	},
	{
		id: 'natori',
		name: 'Natori',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Natori/Natori.model3.json',
		description: 'Classic school uniform avatar with subtle tilt and expression dynamics.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/natori.jpg',
		source: 'official',
		author: 'Live2D Official',
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
