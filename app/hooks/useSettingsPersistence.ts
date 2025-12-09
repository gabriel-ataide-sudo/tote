import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface Settings {
    position: 'top' | 'bottom' | 'middle';
    fontFamily: string;
    fontWeight: string;
    fontSize: string;
    transparency: string;
}

const DEFAULT_SETTINGS: Settings = {
    position: 'top',
    fontFamily: 'sans',
    fontWeight: 'normal',
    fontSize: '16px',
    transparency: '100',
};

export const useSettingsPersistence = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);
    const { setTheme } = useTheme();

    // Load settings on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('tote-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });

                // Restore theme if saved separately or part of settings?
                // Usually next-themes handles theme persistence automatically in localStorage key 'theme'
                // So we don't need to manually handle it here unless we want to sync it.
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        setLoaded(true);
    }, []);

    // Save settings whenever they change
    useEffect(() => {
        if (loaded) {
            localStorage.setItem('tote-settings', JSON.stringify(settings));
        }
    }, [settings, loaded]);

    const updateSetting = (key: keyof Settings, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    return { settings, updateSetting, loaded };
};
