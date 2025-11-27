/**
 * Hook personnalisé pour animer un compteur de 0 à une valeur cible
 * 
 * @param targetValue - Valeur cible à atteindre
 * @param duration - Durée de l'animation en millisecondes (défaut: 2000ms)
 * @param format - Format de la valeur : 'number' pour les nombres, 'currency' pour les devises (défaut: 'number')
 * @returns Valeur animée formatée
 */

import { useEffect, useState, useRef } from "react";

type FormatType = "number" | "currency";

interface UseAnimatedCounterOptions {
  duration?: number;
  format?: FormatType;
  prefix?: string;
  suffix?: string;
}

export const useAnimatedCounter = (
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
): string => {
  const { duration = 2000, format = "number", prefix = "", suffix = "" } = options;
  const [displayValue, setDisplayValue] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const targetValueRef = useRef<number>(targetValue);

  useEffect(() => {
    // Réinitialiser si la valeur cible change
    if (targetValueRef.current !== targetValue) {
      targetValueRef.current = targetValue;
      setDisplayValue(0);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      startTimeRef.current = null;
    }

    // Ne pas animer si la valeur cible est 0
    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Utiliser une fonction d'easing pour une animation plus fluide (ease-out)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(targetValue * easeOutCubic);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // S'assurer que la valeur finale est exactement la valeur cible
        setDisplayValue(targetValue);
        startTimeRef.current = null;
      }
    };

    // Démarrer l'animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Nettoyer l'animation si le composant est démonté ou si la valeur cible change
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      startTimeRef.current = null;
    };
  }, [targetValue, duration]);

  /**
   * Formate la valeur selon le type spécifié
   * Utilise des virgules comme séparateurs de milliers
   */
  const formatValue = (value: number): string => {
    // Convertir le nombre en chaîne et formater avec des virgules pour les milliers
    const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${prefix}${formatted}${suffix}`;
  };

  return formatValue(displayValue);
};

