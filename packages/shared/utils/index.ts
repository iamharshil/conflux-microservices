export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0].substring(0, 5);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isBusinessHours(date: Date, workingHours: Record<string, any>): boolean {
  const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const time = formatTime(date);
  
  const dayHours = workingHours[day];
  if (!dayHours || !Array.isArray(dayHours) || dayHours.length === 0) {
    return false;
  }
  
  return dayHours.some((slot: any) => time >= slot.start && time <= slot.end);
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number,
  bufferTime: number
): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let current = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  const slotDuration = duration + bufferTime;
  
  while (current + slotDuration <= end) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    current += slotDuration;
  }
  
  return slots;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
}