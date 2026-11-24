import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppVersionMonitor, type VersionState } from '@/lib/app-version-monitor';
import { currentVersion } from '@/stores/app-version/service';
import { UpdateAvailableNotification } from '@/components/app-version/UpdateAvailableNotification';

type VersionContextValue = VersionState & Pick<AppVersionMonitor, 'checkForUpdate' | 'reloadApplication' | 'deferUpdate'>;
const AppVersionContext = createContext<VersionContextValue | null>(null);

export function AppVersionProvider({ children }: { children: React.ReactNode }) {
  const [monitor] = useState(() => new AppVersionMonitor(currentVersion));
  const state = useSyncExternalStore(monitor.subscribe, monitor.getSnapshot);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    monitor.start();
    return () => monitor.stop();
  }, [monitor]);
  return <AppVersionContext.Provider value={{ ...state, checkForUpdate: monitor.checkForUpdate, reloadApplication: monitor.reloadApplication, deferUpdate: monitor.deferUpdate }}>
    {children}
    <UpdateAvailableNotification open={state.notificationVisible} onUpdate={monitor.reloadApplication} onLater={monitor.deferUpdate} />
  </AppVersionContext.Provider>;
}

export function useAppVersion() {
  const context = useContext(AppVersionContext);
  if (!context) throw new Error('useAppVersion deve ser usado dentro de AppVersionProvider.');
  return context;
}
