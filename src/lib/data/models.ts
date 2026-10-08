import type { Live2DModelItem } from '#lib/types/tracking';

export interface Model3DItem {
	id: string;
	name: string;
	type: 'procedural' | 'glb';
	url?: string;
	description: string;
}

export const MODEL_CATALOG: Live2DModelItem[] = [
	{
		id: 'haru',
		name: 'Haru Greeter',
		url: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json',
		description: 'Standard Cubism 4 greeter model with complete facial & body rigging.',
		version: 'Cubism 3/4'
	},
	{
		id: 'hiyori',
		name: 'Hiyori Momose',
		url: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/%E5%B0%91%E5%A5%B3%E5%89%8D%E7%BA%BF%20girls%20frontline/live2dnew/hiyori/hiyori_pro_t10.model3.json',
		description: 'Official Live2D Cubism high-definition showcase anime model.',
		version: 'Cubism 3/4'
	},
	{
		id: 'mao',
		name: 'Mao Pro',
		url: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/%E5%B0%91%E5%A5%B3%E5%89%8D%E7%BA%BF%20girls%20frontline/live2dnew/mao_pro_t02/mao_pro_t02.model3.json',
		description: 'Expressive student avatar with broad eyebrow and mouth blendshapes.',
		version: 'Cubism 3/4'
	},
	{
		id: 'shizuku',
		name: 'Shizuku',
		url: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
		description: 'Classic Live2D avatar featuring fluid motion presets.',
		version: 'Cubism 2'
	},
	{
		id: 'wanko',
		name: 'Wanko Puppy',
		url: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/%E5%B0%91%E5%A5%B3%E5%89%8D%E7%BA%BF%20girls%20frontline/live2dnew/wanko/wanko.model3.json',
		description: 'Adorable puppy mascot with reactive ear and tail physics.',
		version: 'Cubism 3/4'
	},
	{
		id: 'rice',
		name: 'Rice Cat',
		url: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/%E5%B0%91%E5%A5%B3%E5%89%8D%E7%BA%BF%20girls%20frontline/live2dnew/rice/rice.model3.json',
		description: 'Cute chibi cat avatar suitable for casual streams.',
		version: 'Cubism 3/4'
	}
];

export const MODEL_3D_CATALOG: Model3DItem[] = [
	{
		id: 'mochi-cat',
		name: 'Mochi The Cat (3D Rigged)',
		type: 'procedural',
		description: 'Stylized 3D Anime Cat with responsive ears, eyes, blinking, mouth sync, and swaying tail.'
	},
	{
		id: 'fox',
		name: 'Fox 3D (GLB)',
		type: 'glb',
		url: '/models/3d/fox.glb',
		description: 'Low-poly animated 3D Fox model with skeletal bone tracking.'
	}
];
