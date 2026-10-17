import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normalizes any phone input into sanitized E.164 format (e.g. +14155552671)
 * or clean digits with leading plus for resilient deduplication matching.
 */
export function normalizePhone(rawPhone: string, defaultCountry: string = 'US'): string {
  if (!rawPhone) return '';
  const trimmed = rawPhone.trim();
  
  try {
    const phoneNumber = parsePhoneNumberFromString(trimmed, defaultCountry as any);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.number; // E.164 format: +1234567890
    }
  } catch {
    // fallback to digit extraction
  }

  // Fallback: extract digits, prefix with + if starts with + or just digits
  const cleaned = trimmed.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length >= 10) {
    return '+' + cleaned;
  }
  return cleaned;
}

/**
 * Formats a phone string for user display.
 */
export function formatPhoneDisplay(rawPhone: string): string {
  if (!rawPhone) return '';
  try {
    const phoneNumber = parsePhoneNumberFromString(rawPhone);
    if (phoneNumber) {
      return phoneNumber.formatInternational();
    }
  } catch {
    // fallback
  }
  return rawPhone;
}

/**
 * Generates direct WhatsApp click-to-chat URL
 */
export function getWhatsAppUrl(rawPhone: string, defaultMessage?: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const baseUrl = `https://wa.me/${digitsOnly}`;
  if (defaultMessage) {
    return `${baseUrl}?text=${encodeURIComponent(defaultMessage)}`;
  }
  return baseUrl;
}
