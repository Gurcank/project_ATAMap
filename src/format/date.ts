// Turkish date text (SPEC §2.3). "approximate" is a badge the UI draws, not part of this string.
import type { DateValue } from '../schema/index.ts';

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

type Formattable = Pick<DateValue, 'iso' | 'isoEnd' | 'precision'>;

/** "3 Mart 1900", "Mart 1900" or "1900" by the length of the ISO string. */
function formatIso(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (month === undefined) return year ?? iso;
  const name = MONTHS[Number(month) - 1];
  if (name === undefined) return iso;
  return day === undefined ? `${name} ${year}` : `${Number(day)} ${name} ${year}`;
}

export function formatDate(date: Formattable): string {
  if (date.precision === 'range' && date.isoEnd !== undefined) {
    return `${formatIso(date.iso)} – ${formatIso(date.isoEnd)}`;
  }
  return formatIso(date.iso);
}

export function yearOf(date: Pick<DateValue, 'iso'>): number {
  return Number(date.iso.slice(0, 4));
}
