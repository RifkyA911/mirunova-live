import { describe, test, expect } from 'bun:test';

interface GuiLockState {
	isGuiLocked: boolean;
	isDrawerOpen: boolean;
	isSettingsModalOpen: boolean;
	isModelModalOpen: boolean;
	toastMessage: string | null;
}

function toggleGuiLock(state: GuiLockState, locked?: boolean): GuiLockState {
	const next = locked !== undefined ? locked : !state.isGuiLocked;
	const updated = { ...state };
	updated.isGuiLocked = next;
	if (next) {
		updated.isDrawerOpen = false;
		updated.isSettingsModalOpen = false;
		updated.isModelModalOpen = false;
		updated.toastMessage = 'GUI Dikunci';
	} else {
		updated.toastMessage = 'GUI Dibuka';
	}
	return updated;
}

describe('GUI Lock & Screen Clear Mode', () => {
	test('toggles GUI lock state on and off', () => {
		const state: GuiLockState = {
			isGuiLocked: false,
			isDrawerOpen: false,
			isSettingsModalOpen: false,
			isModelModalOpen: false,
			toastMessage: null
		};

		const locked = toggleGuiLock(state, true);
		expect(locked.isGuiLocked).toBe(true);
		expect(locked.toastMessage).toBe('GUI Dikunci');

		const unlocked = toggleGuiLock(locked, false);
		expect(unlocked.isGuiLocked).toBe(false);
		expect(unlocked.toastMessage).toBe('GUI Dibuka');
	});

	test('automatically closes all open drawers and modals when locking screen', () => {
		const state: GuiLockState = {
			isGuiLocked: false,
			isDrawerOpen: true,
			isSettingsModalOpen: true,
			isModelModalOpen: true,
			toastMessage: null
		};

		const locked = toggleGuiLock(state, true);

		expect(locked.isGuiLocked).toBe(true);
		expect(locked.isDrawerOpen).toBe(false);
		expect(locked.isSettingsModalOpen).toBe(false);
		expect(locked.isModelModalOpen).toBe(false);
	});
});
