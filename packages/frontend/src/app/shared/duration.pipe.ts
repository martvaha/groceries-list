import { Pipe, PipeTransform } from '@angular/core';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(date: Date | null | undefined, now: number = Date.now()): string | null {
    if (!date) return null;
    const nowDate = new Date(now);

    const days = differenceInDays(nowDate, date);
    if (days >= 1) {
      return days === 1 ? $localize`:@@duration.day:1 day` : $localize`:@@duration.days:${days}:INTERPOLATION: days`;
    }

    const hours = differenceInHours(nowDate, date);
    if (hours >= 1) {
      return hours === 1 ? $localize`:@@duration.hour:1 hour` : $localize`:@@duration.hours:${hours}:INTERPOLATION: hours`;
    }

    const minutes = Math.max(1, differenceInMinutes(nowDate, date));
    return minutes === 1 ? $localize`:@@duration.minute:1 minute` : $localize`:@@duration.minutes:${minutes}:INTERPOLATION: minutes`;
  }
}
