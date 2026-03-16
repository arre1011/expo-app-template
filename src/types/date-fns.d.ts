// Type declarations for date-fns v4
// This fixes module resolution issues with ts-jest
declare module 'date-fns' {
  export function format(date: Date | number, formatStr: string, options?: any): string;
  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function addDays(date: Date | number, amount: number): Date;
  export function addHours(date: Date | number, amount: number): Date;
  export function addMinutes(date: Date | number, amount: number): Date;
  export function differenceInMinutes(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
  export function eachDayOfInterval(interval: { start: Date | number; end: Date | number }): Date[];
  export function isWithinInterval(date: Date | number, interval: { start: Date | number; end: Date | number }): boolean;
  export function parseISO(argument: string): Date;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isToday(date: Date | number): boolean;
  export function startOfWeek(date: Date | number, options?: any): Date;
  export function endOfWeek(date: Date | number, options?: any): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function getDay(date: Date | number): number;
  export function getDate(date: Date | number): number;
  export function getMonth(date: Date | number): number;
  export function getYear(date: Date | number): number;
  export function setHours(date: Date | number, hours: number): Date;
  export function setMinutes(date: Date | number, minutes: number): Date;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
}

declare module 'date-fns/locale' {
  export const enUS: any;
  export const de: any;
}
