import { describe, it, expect } from 'vitest';
import { ErrorBoundary } from '../../src/core/ErrorBoundary';

describe('ErrorBoundary Global Exception Interceptor', () => {
  it('initializes listeners without crashing', () => {
    expect(() => ErrorBoundary.initialize('test-root')).not.toThrow();
  });

  it('renders crash UI into DOM container with reload and reset actions', () => {
    const root = document.createElement('div');
    root.id = 'crash-container';
    document.body.appendChild(root);

    ErrorBoundary.renderCrashUI('Simulated Null Pointer in Scene', 'crash-container');

    expect(root.innerHTML).toContain('Sanctum Anomaly — Execution Suspended');
    expect(root.innerHTML).toContain('Simulated Null Pointer in Scene');
    expect(root.querySelector('#btn-crash-reload')).not.toBeNull();
    expect(root.querySelector('#btn-crash-reset')).not.toBeNull();
  });
});
