import { describe, it, expect } from 'bun:test';

interface ObsState {
	isObsMode: boolean;
	backgroundStyle: string;
	obsBgType: 'transparent' | 'chroma';
	previousBgStyle: string;
	isDrawerOpen: boolean;
}

function toggleObsMode(state: ObsState, enable?: boolean): ObsState {
	const next = enable !== undefined ? enable : !state.isObsMode;
	const updated = { ...state };
	if (next && !state.isObsMode) {
		updated.previousBgStyle = state.backgroundStyle;
		updated.backgroundStyle = state.obsBgType;
		updated.isDrawerOpen = false;
	} else if (!next && state.isObsMode) {
		updated.backgroundStyle = state.previousBgStyle;
	}
	updated.isObsMode = next;
	return updated;
}

function parseObsQueryParams(search: string): { isObs: boolean; bgType: 'transparent' | 'chroma' } {
	const params = new URLSearchParams(search);
	const isObs = params.has('obs') || params.get('mode') === 'obs';
	const bgType = params.get('bg') === 'chroma' ? 'chroma' : 'transparent';
	return { isObs, bgType };
}

describe('OBS Screen Mode State Transitions & URL Parameters', () => {
	it('should cleanly enter and exit OBS Mode with background restoration', () => {
		const initial: ObsState = {
			isObsMode: false,
			backgroundStyle: 'mesh',
			obsBgType: 'transparent',
			previousBgStyle: 'solid',
			isDrawerOpen: true
		};

		// Enter OBS Mode
		const entered = toggleObsMode(initial, true);
		expect(entered.isObsMode).toBe(true);
		expect(entered.backgroundStyle).toBe('transparent');
		expect(entered.isDrawerOpen).toBe(false);

		// Exit OBS Mode
		const exited = toggleObsMode(entered, false);
		expect(exited.isObsMode).toBe(false);
		expect(exited.backgroundStyle).toBe('mesh');
	});

	it('should support chroma green background in OBS Mode for window capture', () => {
		const initial: ObsState = {
			isObsMode: false,
			backgroundStyle: 'solid',
			obsBgType: 'chroma',
			previousBgStyle: 'solid',
			isDrawerOpen: false
		};

		const entered = toggleObsMode(initial, true);
		expect(entered.isObsMode).toBe(true);
		expect(entered.backgroundStyle).toBe('chroma');

		const exited = toggleObsMode(entered, false);
		expect(exited.backgroundStyle).toBe('solid');
	});

	it('should parse OBS browser source URL query parameters correctly', () => {
		const res1 = parseObsQueryParams('?obs=true&bg=transparent');
		expect(res1.isObs).toBe(true);
		expect(res1.bgType).toBe('transparent');

		const res2 = parseObsQueryParams('?obs=1&bg=chroma');
		expect(res2.isObs).toBe(true);
		expect(res2.bgType).toBe('chroma');

		const res3 = parseObsQueryParams('?mode=obs');
		expect(res3.isObs).toBe(true);
		expect(res3.bgType).toBe('transparent');

		const res4 = parseObsQueryParams('');
		expect(res4.isObs).toBe(false);
	});
});
