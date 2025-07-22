export const DAYS_OF_WEEK = [
  { id: 1, name: 'จันทร์' },
  { id: 2, name: 'อังคาร' },
  { id: 3, name: 'พุธ' },
  { id: 4, name: 'พฤหัสบดี' },
  { id: 5, name: 'ศุกร์' },
];

export const TIME_SLOTS = [
  // Morning
  { start: '08:30', end: '09:30' },
  { start: '09:30', end: '10:30' },
  { start: '10:30', end: '11:30' },
  // Lunch
  { start: '11:30', end: '12:30', isLunch: true },
  // Afternoon
  { start: '12:30', end: '13:30' },
  { start: '13:30', end: '14:30' },
  { start: '14:30', end: '15:30' },
];