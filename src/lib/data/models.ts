import type { Live2DModelItem } from '#lib/types/tracking';

export interface Model3DItem {
	id: string;
	name: string;
	type: 'procedural' | 'glb' | 'fbx';
	url?: string;
	avatarUrl?: string;
	description: string;
	variant?: 'mochi' | 'kuro' | 'tora';
	tags?: string[];
}

export const MODEL_CATALOG: (Live2DModelItem & { tags?: string[] })[] = [
	{
		id: 'jian',
		name: '简 (Jane Doe - Zenless Zone Zero)',
		url: '/models/jian/简.model3.json',
		description: 'Model Live2D Cubism 4 komunitas Jane Doe (简·杜) dari Zenless Zone Zero dengan tekstur 8K ultra HD, 10 ekspresi (bintang, hati, blush, menangis, marah), dan fisika rambut & mantel dinamis.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/jian.png',
		source: 'booth',
		author: 'ZZZ Community',
		tags: ['ZZZ', 'Jane Doe', 'Cubism 4', '8K Ultra HD', '10 Expressions', 'Zenless Zone Zero', 'Anime VTuber']
	},
	{
		id: 'changli',
		name: '长离 (Changli - Wuthering Waves)',
		url: '/models/changli/长离.model3.json',
		description: 'Model Live2D Cubism 4 Changli (长离) dari Wuthering Waves (鸣潮) dengan 4 tekstur 4K HD, 7 ekspresi lengkap (jacket, heart, angry, eyeroll, eyepatch, blush, dark), dan fisika bulu & jubah dinamis.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/changli.png',
		source: 'booth',
		author: 'Wuthering Waves Community',
		tags: ['Wuthering Waves', 'Changli', 'Cubism 4', '4K HD', '7 Expressions', 'Kuro Games', 'Anime VTuber']
	},
	{
		id: 'chun',
		name: '椿 (Camellya - Wuthering Waves)',
		url: '/models/chun/椿.model3.json',
		description: 'Model Live2D Cubism 4 Camellya / Chun (椿) dari Wuthering Waves dengan 3 tekstur 4K, 5 ekspresi emosional (cry, heart eyes, yandere, blush, dark), dan animasi idle looping dinamis.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/chun.png',
		source: 'booth',
		author: 'Wuthering Waves Community',
		tags: ['Wuthering Waves', 'Camellya', 'Chun', 'Cubism 4', '4K HD', '5 Expressions', 'Idle Motion', 'Kuro Games']
	},
	{
		id: 'tingyun',
		name: '停云 (Tingyun - Honkai: Star Rail)',
		url: '/models/tingyun/停云.model3.json',
		description: 'Model Live2D Cubism 4 Tingyun (停云) dari Honkai: Star Rail dengan tekstur 4K, rigging telinga & ekor rubah berbulu yang reaktif, serta 4 ekspresi (tail, heart eyes, blush, dark shock).',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/tingyun.png',
		source: 'booth',
		author: 'HSR Community',
		tags: ['Honkai Star Rail', 'Tingyun', 'Cubism 4', 'Foxian', 'Tail Physics', 'Heart Eyes', 'Hoyoverse']
	},
	{
		id: 'ruan-mei',
		name: '阮·梅 (Ruan Mei - Honkai: Star Rail)',
		url: '/models/ruan-mei/1208阮梅1-12.20 - 动画.model3.json',
		description: 'Model Live2D Cubism 4 Ruan Mei (阮·梅) dari Honkai: Star Rail dengan 4 tekstur 8K ultra HD, instrumen ruan tradisional, fisika kain sutra halus, dan latar belakang pemandangan studio.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/ruan-mei.png',
		source: 'booth',
		author: 'HSR Community',
		tags: ['Honkai Star Rail', 'Ruan Mei', 'Cubism 4', '8K Ultra HD', 'Hoyoverse', 'Anime VTuber']
	},
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
		name: 'Haru (Gesture & High-Five)',
		url: '/models/haru/Haru.model3.json',
		description: 'Model resmi Cubism 4 dengan rigging tangan & lengan lengkap: mendukung gesture High-Five, angkat tangan, dan lambaian realtime.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/haru.jpg',
		source: 'official',
		author: 'Live2D Official',
		tags: ['High-Five Gesture', 'Hand Tracking', 'Arm Rigging', 'Cubism 4', 'Motions']
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
	},
	{
		id: 'mark',
		name: 'Mark (Live2D Official)',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Mark/Mark.model3.json',
		description: 'Model resmi Cubism 4 karakter laki-laki berkacamata dengan fisika rambut dan artikulasi ekspresi halus.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/mark.svg',
		source: 'official',
		author: 'Live2D Official',
		tags: ['Live2D Official', 'Cubism 4', 'Glasses', 'Male Avatar', 'WebSample']
	},
	{
		id: 'ren',
		name: 'Ren (Live2D Official)',
		url: 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@master/Samples/Resources/Ren/Ren.model3.json',
		description: 'Model resmi Cubism 4 berkarakter anime ceria dengan fisika rambut dinamis dan artikulasi senyuman alami.',
		version: 'Cubism 3/4',
		avatarUrl: '/models/previews/ren.svg',
		source: 'official',
		author: 'Live2D Official',
		tags: ['Live2D Official', 'Cubism 4', 'Anime Boy', 'WebSample', 'Dynamic Physics']
	}
];

export const MODEL_3D_CATALOG: Model3DItem[] = [
	{
		id: 'neuro-sama',
		name: "Neuro-sama (Vedal's Version)",
		type: 'fbx',
		url: '/models/neurosama/neuro-sama.fbx',
		avatarUrl: '/models/previews/neurosama.svg',
		description: 'Model 3D humanoid resmi Neuro-sama karya Vedal dengan full-body humanoid rig (172 bones), tekstur 4K, MediaPipe face tracking, dan VRChat morph targets (Starry Eyes, Blush, Lip-Sync).',
		tags: ['3D Humanoid', 'Neuro-sama', 'Vedal', 'Full Body', 'Face Tracking', 'Starry Eyes', 'Visemes', 'VRChat FBX']
	},
	{
		id: 'manhattan-cafe',
		name: 'Manhattan Cafe (マンハッタンカフェ - Uma Musume)',
		type: 'fbx',
		url: '/models/manhattan-cafe/manhattan-cafe.vroid',
		avatarUrl: '/models/previews/manhattan-cafe.jpg',
		description: 'Model 3D humanoid Manhattan Cafe karya Uma Musume Pretty Derby dengan rambut raven hitam panjang, telinga kuda (uma mimi), full-body humanoid rig, dan estetika anime elegan.',
		tags: ['3D Humanoid', 'VRoid', 'Uma Musume', 'Manhattan Cafe', 'Horse Ears', 'Full Body Rig', 'MediaPipe Tracking']
	},
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

export type BoothCategory = 'hoyoverse-kuro' | 'original-anime' | 'vts-popular';

export interface BoothShowcaseItem {
	id: string;
	itemId: string;
	name: string;
	author: string;
	authorUrl?: string;
	avatarUrl: string;
	boothUrl: string;
	modelUrl?: string;
	category: BoothCategory;
	categoryLabel: string;
	description: string;
	copyright: string;
	tags: string[];
}

export const BOOTH_SHOWCASE_CATALOG: BoothShowcaseItem[] = [
	{
		id: 'booth-5408293',
		itemId: '5408293',
		name: 'Villhaze (ヴィルヘイズ)',
		author: 'koiyume',
		avatarUrl: 'https://booth.pximg.net/c/620x620/18b5da43-8450-4455-bc2c-9d3156a4f5ed/i/5408293/486ea3dd-0205-4b1a-ac4a-eb253d55d873_base_resized.jpg',
		boothUrl: 'https://booth.pm/en/items/5408293',
		category: 'original-anime',
		categoryLabel: 'Original Anime & Kawaii Girls',
		description: 'Model Live2D gratis berkarakter anime girl imut dengan fisika rambut halus dan kostum modis.',
		copyright: '© koiyume. Free Live2D model for personal use.',
		tags: ['BOOTH.pm', 'Free Download', 'koiyume', 'VTS Ready', 'Kawaii Girl']
	},
	{
		id: 'booth-5411426',
		itemId: '5411426',
		name: 'Roxy (ロキシー)',
		author: 'koiyume',
		avatarUrl: 'https://booth.pximg.net/c/620x620/18b5da43-8450-4455-bc2c-9d3156a4f5ed/i/5411426/1d481ff7-08cd-4701-b626-bdc7a4bf4bb6_base_resized.jpg',
		boothUrl: 'https://booth.pm/en/items/5411426',
		category: 'original-anime',
		categoryLabel: 'Original Anime & Kawaii Girls',
		description: 'Model Live2D anime girl bertopi penyihir kawaii dengan fisika jubah & rambut melambai.',
		copyright: '© koiyume. Free Live2D model for personal use.',
		tags: ['BOOTH.pm', 'Free Download', 'koiyume', 'Witch Girl', 'Cubism 4']
	},
	{
		id: 'booth-5975192',
		itemId: '5975192',
		name: 'Ice Girl (氷の少女)',
		author: 'TianYeLuLu',
		avatarUrl: 'https://booth.pximg.net/c/620x620/7852de40-0e15-4aaa-a153-c87a69b871e1/i/5975192/560ba409-48c6-492e-b6aa-9c364cc3dffa_base_resized.jpg',
		boothUrl: 'https://booth.pm/en/items/5975192',
		category: 'original-anime',
		categoryLabel: 'Original Anime & Kawaii Girls',
		description: 'Model Live2D original bertema es kristal anggun dengan fisika gaun transparan dan ekspresi kaya.',
		copyright: '© TianYeLuLu. Commercial streaming allowed with credit tag 【Live2D: @TianYeLulu】.',
		tags: ['BOOTH.pm', 'Free Download', 'TianYeLuLu', 'Commercial OK with Credit']
	},
	{
		id: 'booth-5399636',
		itemId: '5399636',
		name: 'Belle / Rin (リン - ゼンレスゾーンゼロ)',
		author: 'pbsddy (Rigging) / shinan (Art)',
		avatarUrl: 'https://booth.pximg.net/c/620x620/7ab816c3-bd68-4ea3-b099-c540787eb395/i/5399636/b067cfb9-9459-402f-988a-d5ae6e3924ea_base_resized.jpg',
		boothUrl: 'https://booth.pm/en/items/5399636',
		category: 'hoyoverse-kuro',
		categoryLabel: 'HoYoverse & Kuro Games Fanmade',
		description: 'Fan-made Live2D model Belle (リン) dari Zenless Zone Zero (ZZZ) dengan rigging ekspresi lengkap.',
		copyright: 'Fanmade secondary creation based on HoYoverse ZZZ. Rigged by pbsddy, Art by shinan.',
		tags: ['BOOTH.pm', 'Zenless Zone Zero', 'Belle', 'pbsddy', 'HoYoverse Fanmade']
	},
	{
		id: 'booth-8034348',
		itemId: '8034348',
		name: 'Tsukimi Yachiyo (月見ヤチヨ - 超かぐや姫！)',
		author: 'SnowBear Project',
		avatarUrl: 'https://booth.pximg.net/c/620x620/12bc9ed4-4f56-4b8f-9741-772cab0a5540/i/8034348/6725e3ac-ff17-4f84-add2-dfd81d69ddc2_base_resized.jpg',
		boothUrl: 'https://booth.pm/en/items/8034348',
		category: 'original-anime',
		categoryLabel: 'Original Anime & Kawaii Girls',
		description: 'Fan-made Live2D model Tsukimi Yachiyo dari "Chou Kaguya-hime!" dengan fisika kelinci dan telinga kawaii.',
		copyright: '© SnowBear Project. Fanmade creation based on Chou Kaguya-hime! Non-commercial personal use only.',
		tags: ['BOOTH.pm', 'Tsukimi Yachiyo', 'SnowBear Project', 'Fanmade', 'Free Download']
	},
	{
		id: 'booth-7654174',
		itemId: '7654174',
		name: 'KE (Live2D Free Model)',
		author: 'Sennyu',
		avatarUrl: 'https://booth.pximg.net/c/620x620/eb1fdd19-80b3-4024-b9f3-133daa459953/i/7654174/c570cef8-b93f-4755-9c69-65e911909b71_base_resized.jpg',
		boothUrl: 'https://booth.pm/en/items/7654174',
		category: 'vts-popular',
		categoryLabel: 'VTube Studio Community',
		description: 'Model Live2D gratis berkualitas tinggi siap pakai di VTube Studio dengan fisika dinamis.',
		copyright: '© Sennyu. Free Live2D model for personal/individual use. Redistribution prohibited.',
		tags: ['BOOTH.pm', 'KE', 'Sennyu', 'VTS Ready', 'Free Download']
	},
	{
		id: 'booth-3988142',
		itemId: '3988142',
		name: 'Hoshino Nya (星乃にゃ)',
		author: 'skiyoshi (Rigging) / サッカウキツ (Art)',
		avatarUrl: 'https://booth.pximg.net/c/620x620/2e3badde-5e2f-4dca-bf64-24099f76db47/i/3988142/61950053-3496-4149-a705-04451750efa4_base_resized.jpg',
		boothUrl: 'https://booth.pm/en/items/3988142',
		category: 'vts-popular',
		categoryLabel: 'VTube Studio Community',
		description: 'Model avatar VTuber Neko Chibi super populer dari VTube Studio Workshop dengan telinga kucing dan senyum gemas.',
		copyright: 'Rigged by skiyoshi with permission from artist サッカウキツ. VTube Studio workshop favorite.',
		tags: ['BOOTH.pm', 'Hoshino Nya', 'Cat Girl', 'skiyoshi', 'VTS Workshop']
	},
	{
		id: 'booth-7483530',
		itemId: '7483530',
		name: 'Changli / Chang Li (长离 - 鳴潮 Wuthering Waves)',
		author: 'shibutani',
		avatarUrl: 'https://booth.pximg.net/c/620x620/1c46376d-1906-4f8e-9888-35e1d61384b3/i/7483530/b3fc6574-6706-4c7e-aecb-efebff2968c8_base_resized.jpg',
		boothUrl: 'https://shibutani.booth.pm/items/7483530',
		category: 'hoyoverse-kuro',
		categoryLabel: 'HoYoverse & Kuro Games Fanmade',
		description: 'Fan-made Live2D model Changli dari Wuthering Waves dengan fisika rambut panjang api dan detail kostum anggun.',
		copyright: '© shibutani. Fanmade model based on Kuro Games Wuthering Waves. Personal viewing only, strictly non-commercial.',
		tags: ['BOOTH.pm', 'Changli', 'Wuthering Waves', 'shibutani', 'Fanmade', 'Free Model']
	},
	{
		id: 'booth-6360847',
		itemId: '6360847',
		name: 'Fugue / Tingyun (帰忘の流離人 - 崩壊：スターレイル)',
		author: 'shibutani',
		avatarUrl: 'https://booth.pximg.net/c/620x620/1c46376d-1906-4f8e-9888-35e1d61384b3/i/6360847/f8ff267e-fece-4f2d-aec4-cc9df6d13be5_base_resized.jpg',
		boothUrl: 'https://shibutani.booth.pm/items/6360847',
		category: 'hoyoverse-kuro',
		categoryLabel: 'HoYoverse & Kuro Games Fanmade',
		description: 'Fan-made Live2D model Fugue (Tingyun SP) dari Honkai: Star Rail dengan fisika ekor rubah dan ornamen sutra.',
		copyright: '© shibutani. Fanmade model based on HoYoverse Honkai: Star Rail. Personal viewing only, strictly non-commercial.',
		tags: ['BOOTH.pm', 'Fugue', 'Honkai: Star Rail', 'shibutani', 'Fanmade', 'Free Model']
	},
	{
		id: 'booth-6313490',
		itemId: '6313490',
		name: 'Camellya (椿 - 鳴潮 Wuthering Waves)',
		author: 'shibutani',
		avatarUrl: 'https://booth.pximg.net/c/620x620/1c46376d-1906-4f8e-9888-35e1d61384b3/i/6313490/743f82a1-dd6f-4497-914d-ced923e40106_base_resized.jpg',
		boothUrl: 'https://shibutani.booth.pm/items/6313490',
		category: 'hoyoverse-kuro',
		categoryLabel: 'HoYoverse & Kuro Games Fanmade',
		description: 'Fan-made Live2D model Camellya dari Wuthering Waves dengan fisika sulur bunga merah dan rambut pirang dinamis.',
		copyright: '© shibutani. Fanmade model based on Kuro Games Wuthering Waves. Personal viewing only, strictly non-commercial.',
		tags: ['BOOTH.pm', 'Camellya', 'Wuthering Waves', 'shibutani', 'Fanmade', 'Free Model']
	}
];

export interface OfficialSampleItem {
	id: string;
	name: string;
	author: string;
	avatarUrl: string;
	sampleUrl: string;
	modelUrl?: string;
	description: string;
	copyright: string;
	tags: string[];
}

export const OFFICIAL_SAMPLE_CATALOG: OfficialSampleItem[] = [
	{
		id: 'sample-shizuku',
		name: 'Shizuku (雫 - Live2D Standard Sample)',
		author: 'Live2D Inc.',
		avatarUrl: '/models/previews/shizuku.svg',
		sampleUrl: 'https://www.live2d.com/en/learn/sample/',
		modelUrl: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
		description: 'Model standar legendaris Live2D Cubism dengan rigging rambut panjang halus, ekspresi kaya, dan fisika seragam sekolah.',
		copyright: '© Live2D Inc. Free sample data under Live2D Free Material License for personal learning and evaluation.',
		tags: ['Live2D Inc.', 'Official Free Sample', 'Shizuku', 'Standard Cubism', 'Free Material']
	},
	{
		id: 'sample-chitose',
		name: 'Chitose (チトセ - High School Anime)',
		author: 'Live2D Inc.',
		avatarUrl: '/models/previews/chitose.svg',
		sampleUrl: 'https://www.live2d.com/en/learn/sample/',
		description: 'Model Cubism definisi tinggi dengan fisika sweater rajut, beret modis, dan kedipan mata ekspresif.',
		copyright: '© Live2D Inc. Free sample data under Live2D Free Material License for personal learning and evaluation.',
		tags: ['Live2D Inc.', 'Official Free Sample', 'Chitose', 'High Definition', 'Student Avatar']
	},
	{
		id: 'sample-koharu',
		name: 'Koharu (コハル - Chibi Kawaii)',
		author: 'Live2D Inc.',
		avatarUrl: '/models/previews/koharu.svg',
		sampleUrl: 'https://www.live2d.com/en/learn/sample/',
		description: 'Model anime chibi imut dengan kuncir kembar, pita merah jambu, dan goyangan kepala membal yang menggemaskan.',
		copyright: '© Live2D Inc. Free sample data under Live2D Free Material License for personal learning and evaluation.',
		tags: ['Live2D Inc.', 'Official Free Sample', 'Koharu', 'Chibi Girl', 'Twin Buns']
	},
	{
		id: 'sample-epsilon',
		name: 'Epsilon (イプシロン - Cyber Mech Suit)',
		author: 'Live2D Inc.',
		avatarUrl: '/models/previews/epsilon.svg',
		sampleUrl: 'https://www.live2d.com/en/learn/sample/',
		description: 'Model anime futuristik bersetelan mecha sci-fi dengan visor HUD bercahaya dan artikulasi part pelindung canggih.',
		copyright: '© Live2D Inc. Free sample data under Live2D Free Material License for personal learning and evaluation.',
		tags: ['Live2D Inc.', 'Official Free Sample', 'Epsilon', 'Cyberpunk', 'Sci-Fi Armor']
	},
	{
		id: 'sample-tororo',
		name: 'Tororo & Hijiki (トロロ & ヒジキ - Neko Mascots)',
		author: 'Live2D Inc.',
		avatarUrl: '/models/previews/tororo.svg',
		sampleUrl: 'https://www.live2d.com/en/learn/sample/',
		description: 'Maskot kucing putih dan hitam Live2D Cubism dengan fisika telinga membal, kibasan ekor fluid, dan respon ceria.',
		copyright: '© Live2D Inc. Free sample data under Live2D Free Material License for personal learning and evaluation.',
		tags: ['Live2D Inc.', 'Official Free Sample', 'Tororo', 'Cat Mascot', 'Pet Physics']
	},
	{
		id: 'sample-hibiki',
		name: 'Hibiki (ヒビキ - Action Anime Hero)',
		author: 'Live2D Inc.',
		avatarUrl: '/models/previews/hibiki.svg',
		sampleUrl: 'https://www.live2d.com/en/learn/sample/',
		description: 'Karakter pria anime energik dengan jaket kasual berkerah, rambut jabrik dinamis, dan ragam motion aksi lincah.',
		copyright: '© Live2D Inc. Free sample data under Live2D Free Material License for personal learning and evaluation.',
		tags: ['Live2D Inc.', 'Official Free Sample', 'Hibiki', 'Action Male', 'Dynamic Motion']
	}
];

export interface CommunityLegendItem {
	id: string;
	name: string;
	author: string;
	avatarUrl: string;
	sourceUrl: string;
	modelUrl?: string;
	description: string;
	copyright: string;
	tags: string[];
}

export const COMMUNITY_LEGEND_CATALOG: CommunityLegendItem[] = [];


