import { Logger } from './Logger';

export class ErrorBoundary {
  private static isInitialized = false;

  public static initialize(containerId = 'app-root'): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    window.addEventListener('error', (event) => {
      Logger.getInstance().error('GlobalError', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
      ErrorBoundary.renderCrashUI(event.error?.stack || event.message, containerId);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error ? event.reason.stack : String(event.reason);
      Logger.getInstance().error('UnhandledRejection', reason || 'Unknown rejection');
      ErrorBoundary.renderCrashUI(reason || 'Unhandled Promise Rejection', containerId);
    });
  }

  public static renderCrashUI(errorDetails: string, containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="
        position: fixed; inset: 0; background: #0A0E17; color: #F8F9FA;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
      ">
        <div style="
          max-width: 650px; width: 100%; background: #121824; border: 1px solid #EF476F;
          border-radius: 8px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">⚠️</span>
            <h2 style="margin: 0; color: #EF476F; font-size: 20px;">Sanctum Anomaly — Execution Suspended</h2>
          </div>
          <p style="color: #A0AAB8; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
            An unhandled cosmic exception occurred within the Astra Engine. The state has been captured safely to prevent data corruption.
          </p>
          <pre style="
            background: #080C14; color: #FFD166; padding: 12px; border-radius: 4px;
            font-size: 12px; overflow-x: auto; max-height: 200px; border: 1px solid #1F1A24;
          ">${escapeHtml(errorDetails)}</pre>
          <div style="margin-top: 20px; display: flex; gap: 12px;">
            <button id="btn-crash-reload" style="
              background: #FFB703; color: #080C14; border: none; padding: 10px 20px;
              border-radius: 4px; font-weight: bold; cursor: pointer;
            ">Rekindle Engine</button>
            <button id="btn-crash-reset" style="
              background: transparent; color: #A0AAB8; border: 1px solid #A0AAB8;
              padding: 10px 20px; border-radius: 4px; cursor: pointer;
            ">Clear Local State & Reset</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-crash-reload')?.addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('btn-crash-reset')?.addEventListener('click', () => {
      localStorage.clear();
      window.location.reload();
    });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
