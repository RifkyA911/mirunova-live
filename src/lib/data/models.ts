import type { Live2DModelItem } from '#lib/types/tracking';

export interface Model3DItem {
	id: string;
	name: string;
	type: 'procedural' | 'glb';
	url?: string;
	description: string;
	variant?: 'mochi' | 'kuro' | 'tora';
}

export const MODEL_CATALOG: Live2DModelItem[] = [
	{
		id: 'haru',
		name: 'Haru Greeter',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Haru/Haru.model3.json',
		description: 'Standard Cubism 4 greeter model with complete facial, hair & body rigging.',
		version: 'Cubism 3/4'
	},
	{
		id: 'hiyori',
		name: 'Hiyori Momose',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Hiyori/Hiyori.model3.json',
		description: 'Official Live2D Cubism high-definition showcase anime model with rich expressions.',
		version: 'Cubism 3/4'
	},
	{
		id: 'mao',
		name: 'Mao Pro',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Mao/Mao.model3.json',
		description: 'Expressive student avatar with broad eyebrow and mouth blendshapes.',
		version: 'Cubism 3/4'
	},
	{
		id: 'rice',
		name: 'Rice (Neko Chibi)',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Rice/Rice.model3.json',
		description: 'Adorable cat-eared chibi anime mascot with fluid physics.',
		version: 'Cubism 3/4'
	},
	{
		id: 'wanko',
		name: 'Wanko Puppy',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Wanko/Wanko.model3.json',
		description: 'Adorable puppy mascot with reactive ear and tail physics.',
		version: 'Cubism 3/4'
	},
	{
		id: 'natori',
		name: 'Natori',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Natori/Natori.model3.json',
		description: 'Classic school uniform avatar with subtle tilt and expression dynamics.',
		version: 'Cubism 3/4'
	}
];

export const MODEL_3D_CATALOG: Model3DItem[] = [
	{
		id: 'mochi-cat',
		name: 'Mochi The Cat (Shiro Neko)',
		type: 'procedural',
		variant: 'mochi',
		description: 'Snow-white 3D anime cat with responsive ears, eyes, blinking, mouth sync, and swaying tail.'
	},
	{
		id: 'kuro-cat',
		name: 'Kuro The Cat (Kuro Neko)',
		type: 'procedural',
		variant: 'kuro',
		description: 'Midnight black 3D cat with glowing emerald eyes and reactive tracking.'
	},
	{
		id: 'tora-cat',
		name: 'Ginger The Cat (Tora Neko)',
		type: 'procedural',
		variant: 'tora',
		description: 'Golden ginger tabby 3D cat with warm amber eyes and bell collar.'
	}
];
