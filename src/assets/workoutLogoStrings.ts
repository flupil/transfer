export const workoutLogoSvgs: Record<string, string> = {
  'chest day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#FF6B35" opacity="0.1"/>
    <path d="M25 40 Q50 25, 75 40 L75 60 Q50 75, 25 60 Z" fill="#FF6B35"/>
  </svg>`,
  'push day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#E94E1B" opacity="0.1"/>
    <path d="M30 50 L70 50 M60 40 L70 50 L60 60" stroke="#E94E1B" stroke-width="4" fill="none"/>
  </svg>`,
  'back day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#95E1D3" opacity="0.1"/>
    <rect x="35" y="25" width="30" height="50" rx="5" fill="#95E1D3"/>
  </svg>`,
  'pull day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#F38181" opacity="0.1"/>
    <path d="M70 50 L30 50 M40 40 L30 50 L40 60" stroke="#F38181" stroke-width="4" fill="none"/>
  </svg>`,
  'leg day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#AA96DA" opacity="0.1"/>
    <rect x="35" y="30" width="10" height="40" fill="#AA96DA"/>
    <rect x="55" y="30" width="10" height="40" fill="#AA96DA"/>
  </svg>`,
  'shoulder and abs day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#FCBAD3" opacity="0.1"/>
    <circle cx="30" cy="35" r="8" fill="#FCBAD3"/>
    <circle cx="70" cy="35" r="8" fill="#FCBAD3"/>
    <rect x="45" y="50" width="10" height="20" fill="#FCBAD3"/>
  </svg>`,
  'abs day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#FFFFD2" opacity="0.1"/>
    <rect x="40" y="35" width="20" height="10" fill="#E94E1B"/>
    <rect x="40" y="50" width="20" height="10" fill="#E94E1B"/>
    <rect x="40" y="65" width="20" height="10" fill="#E94E1B"/>
  </svg>`,
  'arms day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#A8E6CF" opacity="0.1"/>
    <path d="M30 50 Q20 40, 25 30 L35 35 Q30 45, 30 50" fill="#A8E6CF"/>
    <path d="M70 50 Q80 40, 75 30 L65 35 Q70 45, 70 50" fill="#A8E6CF"/>
  </svg>`,
  'full body day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#C7CEEA" opacity="0.1"/>
    <circle cx="50" cy="25" r="8" fill="#C7CEEA"/>
    <rect x="45" y="35" width="10" height="25" fill="#C7CEEA"/>
    <rect x="35" y="40" width="30" height="5" fill="#C7CEEA"/>
    <rect x="42" y="60" width="6" height="20" fill="#C7CEEA"/>
    <rect x="52" y="60" width="6" height="20" fill="#C7CEEA"/>
  </svg>`,
  'rest day': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#E8E8E8" opacity="0.3"/>
    <path d="M35 40 Q50 30, 65 40 L65 60 Q50 70, 35 60 Z" fill="#999"/>
    <text x="50" y="52" font-size="12" text-anchor="middle" fill="#666">ZZZ</text>
  </svg>`,
  'default': `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#FF6B35" opacity="0.1"/>
    <path d="M30 50 L70 50 M50 30 L50 70" stroke="#FF6B35" stroke-width="4"/>
  </svg>`
};