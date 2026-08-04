import { useEffect, useState } from 'react';

/**
 * Comme `useState`, mais la valeur est mémorisée dans localStorage sous `key` et relue au
 * montage. Utilisé pour les filtres/recherches/critères de chaque menu, ainsi que pour les
 * brouillons de formulaire en cours de saisie : sans cela, ces réglages/saisies sont perdus
 * dès qu'on quitte un menu puis qu'on y revient (le composant de page est démonté par React
 * Router, donc son état local repart de zéro à chaque retour).
 *
 * Le 3ème élément retourné, `clearValue`, efface l'entrée localStorage et réinitialise la
 * valeur à `defaultValue` — à appeler après un enregistrement réussi ou un "Annuler" pour ne
 * pas laisser de brouillon obsolète.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota dépassé ou navigation privée : on ignore silencieusement */ }
  }, [key, value]);

  const clearValue = () => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    setValue(defaultValue);
  };

  return [value, setValue, clearValue];
}
