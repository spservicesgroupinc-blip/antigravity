import React, { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');
        setIsStandalone(isStandaloneMode);

        // Initial check for iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setDeferredPrompt(null);
        }
    };

    // Don't show anything if already installed
    if (isStandalone) return null;

    // Show nothing if checking or not supported/needed yet
    if (!deferredPrompt && !isIOS) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-brand-black text-white p-4 rounded-lg shadow-xl border border-white/10 flex items-center justify-between gap-4 backdrop-blur-sm bg-opacity-95">
                <div className="flex-1">
                    <h3 className="font-semibold text-sm">Install App</h3>
                    <p className="text-xs text-slate-400">
                        {isIOS ? 'Install for better experience' : 'Install for offline access'}
                    </p>
                </div>

                {isIOS ? (
                    <div className="flex items-center gap-2 text-xs bg-white/10 px-3 py-2 rounded">
                        <span>Tap</span>
                        <Share className="w-4 h-4" />
                        <span>then "Add to Home Screen"</span>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-hover transition-colors flex items-center gap-2 shadow-lg shadow-brand/20"
                    >
                        <Download className="w-4 h-4" />
                        Install
                    </button>
                )}
            </div>
        </div>
    );
};
