import React from 'react';

export type PasswordStrength = 'weak' | 'moderate' | 'strong';

interface PasswordStrengthBarsProps {
  password: string;
  className?: string;
}

export function PasswordStrengthBars({ password, className = '' }: PasswordStrengthBarsProps) {
  const getPasswordStrength = (password: string): PasswordStrength => {
    if (password.length === 0) return 'weak';
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    
    // Uppercase letter check
    if (/[A-Z]/.test(password)) score++;
    
    // Lowercase letter check
    if (/[a-z]/.test(password)) score++;
    
    // Number check
    if (/\d/.test(password)) score++;
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score >= 4) return 'strong';
    if (score >= 2) return 'moderate';
    return 'weak';
  };

  const strength = getPasswordStrength(password);
  
  const getBarColor = (barIndex: number, strength: PasswordStrength) => {
    if (password.length === 0) return 'bg-gray-200';
    
    switch (strength) {
      case 'weak':
        return barIndex === 0 ? 'bg-red-500' : 'bg-gray-200';
      case 'moderate':
        return barIndex <= 1 ? 'bg-yellow-500' : 'bg-gray-200';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getStrengthText = (strength: PasswordStrength) => {
    switch (strength) {
      case 'weak':
        return 'Password is too weak';
      case 'moderate':
        return 'Password is moderate';
      case 'strong':
        return 'Password is strong';
      default:
        return '';
    }
  };

  return (
    <div className={className}>
      {/* Progress bars */}
      <div className="flex gap-2 mb-2">
        {[0, 1, 2].map((barIndex) => (
          <div
            key={barIndex}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${getBarColor(barIndex, strength)}`}
          />
        ))}
      </div>
      
      {/* Strength text */}
      {password.length > 0 && (
        <p className={`text-xs ${
          strength === 'weak' ? 'text-red-500' :
          strength === 'moderate' ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {getStrengthText(strength)}
        </p>
      )}
    </div>
  );
}

