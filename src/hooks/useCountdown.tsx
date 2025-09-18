import { useEffect, useState, useRef } from 'react';
import { createSafeInterval, clearSafeInterval } from '@/utils/performanceMonitor';

interface UseCountdownOptions {
  onComplete?: () => void;
  updateInterval?: number;
}

export function useCountdown(targetDate: string, options: UseCountdownOptions = {}) {
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { onComplete, updateInterval = 1000 } = options;
  
  useEffect(() => {
    // Clear existing timer to prevent multiple timers
    if (timerRef.current) {
      clearSafeInterval(timerRef.current);
      timerRef.current = null;
    }

    // Validate target date
    const targetTime = new Date(targetDate).getTime();
    if (isNaN(targetTime)) {
      setTimeLeft('Invalid date');
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`Começa em ${days} ${days === 1 ? 'dia' : 'dias'}`);
        } else if (hours > 0) {
          setTimeLeft(`Começa em ${hours} ${hours === 1 ? 'hora' : 'horas'}`);
        } else if (minutes > 0) {
          setTimeLeft(`Começa em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
        } else {
          setTimeLeft('Começando agora!');
        }
      } else {
        setTimeLeft('Evento ativo!');
        if (onComplete) {
          onComplete();
        }
        // Clear timer when countdown is complete
        if (timerRef.current) {
          clearSafeInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    // Initial update
    updateCountdown();
    
    // Set up timer only if countdown hasn't finished
    const now = new Date().getTime();
    if (targetTime > now) {
      timerRef.current = createSafeInterval(updateCountdown, updateInterval);
    }
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearSafeInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [targetDate, onComplete, updateInterval]);
  
  return timeLeft;
}