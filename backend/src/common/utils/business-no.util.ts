import { randomBytes } from 'crypto';

function formatDatePart(date: Date): string {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function normalizeOrgTag(orgId: string): string {
  const cleaned = orgId.replace(/-/g, '').toUpperCase();
  return cleaned.slice(0, 4).padEnd(4, 'X');
}

export function generateBusinessNo(prefix: string, orgId: string): string {
  const datePart = formatDatePart(new Date());
  const orgTag = normalizeOrgTag(orgId);
  const randomPart = randomBytes(5).toString('hex').toUpperCase();
  return `${prefix}-${datePart}-${orgTag}-${randomPart}`;
}

export function isUniqueConstraintViolation(
  error: unknown,
  expectedConstraint?: string,
): boolean {
  const dbError = error as { code?: string; constraint?: string } | undefined;
  if (!dbError || dbError.code !== '23505') return false;
  if (!expectedConstraint) return true;
  return dbError.constraint === expectedConstraint;
}
