import { getAvailableVersion } from '@/stores/app-version/service';

export const VERSION_CHECK_INTERVAL = 60_000;
export const VERSION_SNOOZE_INTERVAL = 600_000;
export type VersionState = {
  currentVersion: string;
  availableVersion: string | null;
  updateAvailable: boolean;
  notificationVisible: boolean;
  isChecking: boolean;
  lastCheckedAt: number | null;
};

export class AppVersionMonitor {
  private state: VersionState;
  private listeners = new Set<() => void>();
  private active = false;
  private interval?: ReturnType<typeof setInterval>;
  private reminder?: ReturnType<typeof setTimeout>;
  private controller: AbortController | null = null;
  private deferredVersion: string | null = null;
  private deferredUntil = 0;

  constructor(version: string) {
    this.state = { currentVersion: version, availableVersion: null, updateAvailable: false, notificationVisible: false, isChecking: false, lastCheckedAt: null };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(change: Partial<VersionState>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach(listener => listener());
  }
  private onVisibility = () => { if (document.visibilityState === 'visible') void this.checkForUpdate(); };
  private onFocus = () => { void this.checkForUpdate(); };

  start() {
    if (this.active) return;
    this.active = true;
    this.interval = setInterval(() => { void this.checkForUpdate(); }, VERSION_CHECK_INTERVAL);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('focus', this.onFocus);
    void this.checkForUpdate();
  }
  stop() {
    this.active = false;
    clearInterval(this.interval);
    clearTimeout(this.reminder);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('focus', this.onFocus);
    this.controller?.abort();
    this.controller = null;
    this.publish({ isChecking: false });
  }
  checkForUpdate = async () => {
    if (!this.active || this.controller) return;
    const controller = new AbortController();
    this.controller = controller;
    this.publish({ isChecking: true });
    try {
      const available = await getAvailableVersion(controller.signal);
      if (!this.active || controller.signal.aborted || this.controller !== controller) return;
      const updateAvailable = available.version !== this.state.currentVersion;
      const deferred = this.deferredVersion === available.version && Date.now() < this.deferredUntil;
      this.publish({ availableVersion: available.version, updateAvailable, notificationVisible: updateAvailable && !deferred, lastCheckedAt: Date.now() });
    } catch {
      // Mantém o aviso e o CRM funcionando durante falhas de rede ou publicações.
    } finally {
      if (this.controller === controller) { this.controller = null; this.publish({ isChecking: false }); }
    }
  };
  deferUpdate = () => {
    if (!this.state.updateAvailable) return;
    this.deferredVersion = this.state.availableVersion;
    this.deferredUntil = Date.now() + VERSION_SNOOZE_INTERVAL;
    this.publish({ notificationVisible: false });
    clearTimeout(this.reminder);
    this.reminder = setTimeout(() => {
      if (this.active && this.state.updateAvailable) this.publish({ notificationVisible: true });
    }, VERSION_SNOOZE_INTERVAL);
  };
  reloadApplication = () => {
    if (window.confirm('Atualizar o CRM agora? Alterações ainda não salvas poderão ser perdidas. Salve seu trabalho antes de continuar.')) window.location.reload();
  };
}
