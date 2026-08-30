import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { PrayerTimesConfig, WeatherConfig, PrayerAlertBroadcast } from "../types";

export class PrayerWeatherService {
  private static PRAYER_CONFIG_DOC = "prayer_times_config";
  private static WEATHER_CONFIG_DOC = "weather_config";
  private static ADHAN_BROADCAST_DOC = "prayer_alert_broadcast";

  // Subscribe to Prayer Times Config
  static subscribePrayerTimesConfig(callback: (config: PrayerTimesConfig | null) => void) {
    try {
      const docRef = doc(db, "settings", this.PRAYER_CONFIG_DOC);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            callback(snap.data() as PrayerTimesConfig);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.warn("PrayerTimesConfig snapshot error:", error);
          callback(null);
        }
      );
    } catch (e) {
      console.warn("Error setting up prayer times subscription:", e);
      return () => {};
    }
  }

  // Subscribe to Weather Config
  static subscribeWeatherConfig(callback: (config: WeatherConfig | null) => void) {
    try {
      const docRef = doc(db, "settings", this.WEATHER_CONFIG_DOC);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            callback(snap.data() as WeatherConfig);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.warn("WeatherConfig snapshot error:", error);
          callback(null);
        }
      );
    } catch (e) {
      console.warn("Error setting up weather subscription:", e);
      return () => {};
    }
  }

  // Subscribe to Instant Adhan Broadcasts
  static subscribeAdhanBroadcast(callback: (broadcast: PrayerAlertBroadcast | null) => void) {
    try {
      const docRef = doc(db, "settings", this.ADHAN_BROADCAST_DOC);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            callback(snap.data() as PrayerAlertBroadcast);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.warn("Adhan broadcast snapshot error:", error);
          callback(null);
        }
      );
    } catch (e) {
      console.warn("Error setting up adhan broadcast subscription:", e);
      return () => {};
    }
  }

  // Save Prayer Times Config
  static async savePrayerTimesConfig(config: Partial<PrayerTimesConfig>, updatedBy: string = "admin"): Promise<boolean> {
    try {
      const docRef = doc(db, "settings", this.PRAYER_CONFIG_DOC);
      const payload: PrayerTimesConfig = {
        mode: config.mode || "auto",
        timings: config.timings || {
          Fajr: "04:27",
          Sunrise: "05:46",
          Dhuhr: "12:10",
          Asr: "15:30",
          Maghrib: "18:34",
          Isha: "20:04",
        },
        hijriDateOverride: config.hijriDateOverride || "",
        updatedAt: Date.now(),
        updatedBy,
      };
      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving prayer times config:", e);
      return false;
    }
  }

  // Save Weather Config
  static async saveWeatherConfig(config: Partial<WeatherConfig>, updatedBy: string = "admin"): Promise<boolean> {
    try {
      const docRef = doc(db, "settings", this.WEATHER_CONFIG_DOC);
      const payload: WeatherConfig = {
        mode: config.mode || "auto",
        temp: config.temp ?? 26,
        feelsLike: config.feelsLike ?? 27,
        conditionText: config.conditionText || "صافٍ ومشمس",
        weatherCode: config.weatherCode ?? 0,
        humidity: config.humidity ?? 55,
        windSpeed: config.windSpeed ?? 3.8,
        tempMax: config.tempMax ?? 30,
        tempMin: config.tempMin ?? 20,
        isNight: config.isNight ?? false,
        rainProb: config.rainProb ?? 0,
        updatedAt: Date.now(),
        updatedBy,
      };
      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (e) {
      console.error("Error saving weather config:", e);
      return false;
    }
  }

  // Trigger Adhan Broadcast for all users
  static async broadcastAdhan(
    prayerKey: "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha",
    prayerName: string,
    triggeredBy: string = "admin"
  ): Promise<boolean> {
    try {
      const docRef = doc(db, "settings", this.ADHAN_BROADCAST_DOC);
      const payload: PrayerAlertBroadcast = {
        prayerKey,
        prayerName,
        message: `حان الآن موعد أذان ${prayerName} حسب التوقيت المحلي لمحافظة تعز وضواحيها.`,
        timestamp: Date.now(),
        triggeredBy,
      };
      await setDoc(docRef, payload);
      return true;
    } catch (e) {
      console.error("Error broadcasting adhan alert:", e);
      return false;
    }
  }
}
