export interface CountryCode {
  name: string;
  code: string;
  dial_code: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { name: 'Bangladesh', code: 'BD', dial_code: '+880', flag: '🇧🇩' },
  { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: 'AE', dial_code: '+971', flag: '🇦🇪' },
  { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dial_code: '+61', flag: '🇦🇺' },
  { name: 'India', code: 'IN', dial_code: '+91', flag: '🇮🇳' },
  { name: 'Saudi Arabia', code: 'SA', dial_code: '+966', flag: '🇸🇦' },
  { name: 'Singapore', code: 'SG', dial_code: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: 'MY', dial_code: '+60', flag: '🇲🇾' },
  { name: 'Germany', code: 'DE', dial_code: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dial_code: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: 'IT', dial_code: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dial_code: '+34', flag: '🇪🇸' },
  { name: 'Netherlands', code: 'NL', dial_code: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', dial_code: '+64', flag: '🇳🇿' },
  { name: 'Pakistan', code: 'PK', dial_code: '+92', flag: '🇵🇰' },
  { name: 'Nigeria', code: 'NG', dial_code: '+234', flag: '🇳🇬' },
  { name: 'South Africa', code: 'ZA', dial_code: '+27', flag: '🇿🇦' },
  { name: 'Brazil', code: 'BR', dial_code: '+55', flag: '🇧🇷' },
  { name: 'Qatar', code: 'QA', dial_code: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dial_code: '+965', flag: '🇰🇼' },
];

/**
 * Detects if a phone string starts with any known country dial code
 */
export function detectCountryFromPhone(phoneInput: string): CountryCode | null {
  const cleaned = phoneInput.trim().replace(/^00/, '+');
  if (!cleaned.startsWith('+')) return null;

  // Sort by dial code length descending so +880 matches before +8
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dial_code.length - a.dial_code.length);
  for (const country of sorted) {
    if (cleaned.startsWith(country.dial_code)) {
      return country;
    }
  }
  return null;
}

/**
 * Combines country code with phone input, stripping redundant local prefixes
 */
export function formatWithCountryCode(countryDialCode: string, rawInput: string): string {
  if (!rawInput.trim()) return '';
  const trimmed = rawInput.trim();

  // If already starts with +, normalize
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  // Remove all non-digits
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) return '';

  // If starts with dial_code without + (e.g. 88017...)
  const dialDigits = countryDialCode.replace(/\D/g, '');
  if (digitsOnly.startsWith(dialDigits)) {
    return `+${digitsOnly}`;
  }

  // If starts with leading 0 (e.g. 01712345678), remove leading zero
  const strippedLeadingZero = digitsOnly.replace(/^0+/, '');

  return `${countryDialCode}${strippedLeadingZero}`;
}

export const COUNTRY_TIMEZONES: Record<string, string> = {
  BD: 'Asia/Dhaka',
  US: 'America/New_York',
  GB: 'Europe/London',
  AE: 'Asia/Dubai',
  CA: 'America/Toronto',
  AU: 'Australia/Sydney',
  IN: 'Asia/Kolkata',
  SA: 'Asia/Riyadh',
  SG: 'Asia/Singapore',
  MY: 'Asia/Kuala_Lumpur',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  NL: 'Europe/Amsterdam',
  NZ: 'Pacific/Auckland',
  PK: 'Asia/Karachi',
  NG: 'Africa/Lagos',
  ZA: 'Africa/Johannesburg',
  BR: 'America/Sao_Paulo',
  QA: 'Asia/Qatar',
  KW: 'Asia/Kuwait',
};

/**
 * Returns formatted local time string and business hours indicator for a country
 */
export function getCountryLocalTime(countryCode: string): { timeString: string; isBusinessHours: boolean } {
  const tz = COUNTRY_TIMEZONES[countryCode] || 'Asia/Dhaka';
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const timeString = formatter.format(now);

    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(hourFormatter.format(now), 10);
    const isBusinessHours = hour >= 9 && hour < 18;

    return { timeString, isBusinessHours };
  } catch {
    return { timeString: '1:34 PM', isBusinessHours: true };
  }
}
