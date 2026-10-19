import { useColorScheme } from 'react-native';
import { light, dark } from '../theme/colors';
import { spacing, radii, typography, shadow } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useTheme() {
  const systemScheme = useColorScheme();
  const [overrideScheme, setOverrideScheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val === 'light' || val === 'dark') setOverrideScheme(val);
    });
  }, []);

  const scheme = overrideScheme ?? systemScheme ?? 'light';
  const colors = scheme === 'dark' ? dark : light;
  const isDark = scheme === 'dark';

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setOverrideScheme(next);
    await AsyncStorage.setItem('theme', next);
  };

  return { colors, isDark, scheme, toggleTheme, spacing, radii, typography, shadow };
}
