import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, r) {
            console.log(`Service Worker at: ${swUrl}`);
            if (r) {
                // Check for updates every hour
                setInterval(() => {
                    r.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-800 text-white p-4 rounded-lg shadow-xl border border-white/10 max-w-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">
                            {offlineReady ? 'App ready to work offline' : 'New version available'}
                        </h3>
                        <p className="text-xs text-slate-300">
                            {offlineReady
                                ? 'You can use this app without an internet connection.'
                                : 'Click reload to update to the latest version.'}
                        </p>
                    </div>
                    <button
                        onClick={close}
                        className="text-slate-400 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 w-full"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload
                    </button>
                )}
            </div>
        </div>
    );
};
