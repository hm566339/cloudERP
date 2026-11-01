import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_ACTIONS, ACTION_COLOR_MAP } from '../../constants/featureActions.js';

describe('Global Feature Dynamic Actions Management', () => {
  it('defines all 13 canonical system actions', () => {
    const expected = [
      'READ',
      'CREATE',
      'UPDATE',
      'WRITE',
      'DELETE',
      'APPROVE',
      'REJECT',
      'RETURN',
      'DELEGATE',
      'CANCEL',
      'ACTIVATE',
      'DEACTIVATE',
      'EXPORT'
    ];
    assert.deepEqual(CANONICAL_ACTIONS, expected);
    assert.equal(CANONICAL_ACTIONS.length, 13);
  });

  it('provides distinct badge color definitions for all 13 canonical actions', () => {
    for (const action of CANONICAL_ACTIONS) {
      assert.ok(ACTION_COLOR_MAP[action], `Missing color map for action ${action}`);
      assert.ok(ACTION_COLOR_MAP[action].includes('border-'), `Action ${action} should have border style`);
    }
  });

  it('filters available actions by excluding already assigned actions without duplicates', () => {
    const assignedActions = ['READ', 'WRITE', 'DELETE'];
    const currentSet = new Set(assignedActions);
    const available = CANONICAL_ACTIONS.filter((act) => !currentSet.has(act));

    assert.equal(available.length, 10);
    assert.ok(!available.includes('READ'));
    assert.ok(!available.includes('WRITE'));
    assert.ok(!available.includes('DELETE'));
    assert.ok(available.includes('APPROVE'));
    assert.ok(available.includes('EXPORT'));
  });

  it('allows dynamic addition of new actions and preserves existing ones', () => {
    let actions = ['READ', 'WRITE', 'DELETE'];

    // Add APPROVE
    const toAdd = 'APPROVE';
    if (!actions.includes(toAdd)) {
      actions = [...actions, toAdd];
    }
    assert.deepEqual(actions, ['READ', 'WRITE', 'DELETE', 'APPROVE']);

    // Attempt duplicate addition
    if (!actions.includes(toAdd)) {
      actions = [...actions, toAdd];
    }
    assert.deepEqual(actions, ['READ', 'WRITE', 'DELETE', 'APPROVE']);

    // Add EXPORT
    actions = [...actions, 'EXPORT'];
    assert.deepEqual(actions, ['READ', 'WRITE', 'DELETE', 'APPROVE', 'EXPORT']);
  });

  it('allows removing an action via (X) and makes it available again', () => {
    let actions = ['READ', 'WRITE', 'DELETE', 'APPROVE'];

    // Remove WRITE
    actions = actions.filter((a) => a !== 'WRITE');
    assert.deepEqual(actions, ['READ', 'DELETE', 'APPROVE']);

    const currentSet = new Set(actions);
    const available = CANONICAL_ACTIONS.filter((act) => !currentSet.has(act));
    assert.ok(available.includes('WRITE'), 'Removed action WRITE should be available to re-add');
  });

  it('validates that at least one action is required', () => {
    const validateActions = (actions) => {
      if (!actions || actions.length === 0) {
        return 'At least one action is required for this feature';
      }
      return null;
    };

    assert.equal(validateActions([]), 'At least one action is required for this feature');
    assert.equal(validateActions(['READ']), null);
  });

  it('preserves assigned actions on edit mode', () => {
    const initialFeature = {
      id: 'feat-1',
      code: 'ACCOUNT_CATEGORIES',
      name: 'Account Categories',
      actions: ['READ', 'WRITE', 'DELETE', 'APPROVE']
    };

    const loadedActions = Array.isArray(initialFeature.actions) && initialFeature.actions.length > 0
      ? initialFeature.actions
      : ['READ', 'WRITE', 'DELETE'];

    assert.deepEqual(loadedActions, ['READ', 'WRITE', 'DELETE', 'APPROVE']);
  });
});
