'use strict';

/**
 * Student Registration Number Format Utility
 * Supports:
 * - Legacy format: STO1-001A
 * - Modern Academic format: 2026/ICT/001, STU-2026-001, etc.
 * Max length: 32 chars
 */

const LEGACY_REGEX = /^STO[0-9]+-\d{3}[A-Z]$/i;
const ACADEMIC_REGEX = /^[A-Za-z0-9][A-Za-z0-9/_\-.]{2,31}$/;

function normalizeRegistrationNumber(value) {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  const legacyMatch = s.match(/^(STO[0-9]+-)(\d{3})([A-Za-z])$/i);
  if (legacyMatch) {
    return `${legacyMatch[1].toUpperCase()}${legacyMatch[2]}${legacyMatch[3].toUpperCase()}`;
  }
  return s.toUpperCase();
}

function isValidRegistrationNumber(value) {
  if (typeof value !== 'string') return false;
  const n = normalizeRegistrationNumber(value);
  if (n.length < 3 || n.length > 32) return false;
  return LEGACY_REGEX.test(n) || ACADEMIC_REGEX.test(n);
}

module.exports = {
  LEGACY_REGEX,
  ACADEMIC_REGEX,
  normalizeRegistrationNumber,
  isValidRegistrationNumber
};
