import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { PRAYER_ARABIC_NAMES } from '../components/PrayerAdhanPopup';

export class PrayerNotificationService {
  static async scheduleDailyPrayers(timings: Record<string, string>) {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }

      // Clear existing scheduled notifications to avoid duplicates
      await LocalNotifications.cancel({ notifications: (await LocalNotifications.getPending()).notifications });

      const scheduledList: any[] = [];
      let idCounter = 1000;

      const prayerEntries: Array<[string, string]> = [
        ["Fajr", timings.Fajr],
        ["Dhuhr", timings.Dhuhr],
        ["Asr", timings.Asr],
        ["Maghrib", timings.Maghrib],
        ["Isha", timings.Isha],
      ];

      for (const [key, rawTime] of prayerEntries) {
        if (!rawTime) continue;
        const cleanTime = rawTime.split(" ")[0].substring(0, 5); // "HH:MM"
        const [hour, minute] = cleanTime.split(":").map(Number);

        const name = PRAYER_ARABIC_NAMES[key] || key;
        scheduledList.push({
          id: idCounter++,
          title: `أذان ${name}`,
          body: `حان الآن موعد أذان ${name} حسب التوقيت المحلي لمحافظة تعز وضواحيها`,
          schedule: { 
            on: { hour: hour, minute: minute } // Repeats daily at this time
          },
          sound: 'beep.wav', // default sound
          smallIcon: 'ic_stat_icon_config_sample', // default icon
          iconColor: '#D9A441'
        });
      }

      if (scheduledList.length > 0) {
        await LocalNotifications.schedule({ notifications: scheduledList });
        console.log("Scheduled local prayer notifications:", scheduledList.length);
      }
    } catch (e) {
      console.warn("Failed to schedule local prayer notifications:", e);
    }
  }
}
