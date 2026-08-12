import { fetchWithFallback } from "../config/apiConfig";

export interface WeatherDataPayload {
  current: any;
  forecast: any;
  airPollution?: any;
  rawOpenMeteo?: any;
}

const TAIZ_LAT = 13.6039;
const TAIZ_LON = 44.0677;

const getApiKey = (): string => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_OPENWEATHER_API_KEY) {
      return import.meta.env.VITE_OPENWEATHER_API_KEY;
    }
    if (typeof process !== "undefined" && process.env && process.env.OPENWEATHER_API_KEY) {
      return process.env.OPENWEATHER_API_KEY;
    }
  } catch (e) {}
  return "";
};

export function buildOpenMeteoUrl(lat = TAIZ_LAT, lon = TAIZ_LON): string {
  const baseUrl = "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: [
      "weather_code", "temperature_2m_max", "apparent_temperature_max", "temperature_2m_min",
      "apparent_temperature_min", "sunrise", "sunset", "daylight_duration", "sunshine_duration",
      "uv_index_max", "uv_index_clear_sky_max", "rain_sum", "snowfall_sum", "showers_sum",
      "precipitation_sum", "precipitation_hours", "precipitation_probability_max",
      "wind_speed_10m_max", "wind_gusts_10m_max", "wind_direction_10m_dominant",
      "shortwave_radiation_sum", "et0_fao_evapotranspiration", "temperature_2m_mean",
      "apparent_temperature_mean", "cape_mean", "cape_max", "cape_min", "cloud_cover_mean",
      "cloud_cover_max", "cloud_cover_min", "dew_point_2m_mean", "dew_point_2m_max",
      "dew_point_2m_min", "et0_fao_evapotranspiration_sum", "growing_degree_days_base_0_limit_50",
      "leaf_wetness_probability_mean", "precipitation_probability_mean", "relative_humidity_2m_mean",
      "precipitation_probability_min", "relative_humidity_2m_max", "relative_humidity_2m_min",
      "snowfall_water_equivalent_sum", "pressure_msl_mean", "pressure_msl_max", "pressure_msl_min",
      "surface_pressure_max", "surface_pressure_mean", "updraft_max", "visibility_mean",
      "surface_pressure_min", "visibility_min", "visibility_max", "wind_gusts_10m_mean",
      "wind_speed_10m_mean", "wind_gusts_10m_min", "wind_speed_10m_min", "wet_bulb_temperature_2m_mean",
      "wet_bulb_temperature_2m_max", "wet_bulb_temperature_2m_min", "vapour_pressure_deficit_max"
    ].join(","),
    hourly: [
      "temperature_2m", "relative_humidity_2m", "dew_point_2m", "apparent_temperature",
      "precipitation_probability", "precipitation", "showers", "rain", "snowfall", "snow_depth",
      "weather_code", "pressure_msl", "surface_pressure", "cloud_cover", "cloud_cover_low",
      "cloud_cover_mid", "cloud_cover_high", "visibility", "evapotranspiration",
      "et0_fao_evapotranspiration", "vapour_pressure_deficit", "wind_speed_80m", "wind_speed_120m",
      "wind_speed_10m", "wind_speed_180m", "wind_direction_80m", "wind_direction_120m",
      "wind_direction_10m", "wind_direction_180m", "wind_gusts_10m", "uv_index"
    ].join(","),
    models: "best_match",
    current: [
      "relative_humidity_2m", "temperature_2m", "apparent_temperature", "is_day",
      "precipitation", "rain", "showers", "snowfall", "weather_code", "cloud_cover",
      "pressure_msl", "surface_pressure", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"
    ].join(","),
    timezone: "auto"
  });
  return `${baseUrl}?${params.toString()}`;
}

export const OPEN_METEO_TAIZ_URL = buildOpenMeteoUrl();

// Map Open-Meteo WMO weather codes to standard Arabic weather descriptions
export function mapWmoToOpenWeather(wmoCode: number): { id: number; description: string; icon: string; main: string } {
  if (wmoCode === 0) return { id: 800, description: "أجواء مشمسة وسماء صافية", icon: "01d", main: "Clear" };
  if (wmoCode === 1 || wmoCode === 2) return { id: 801, description: "غائم جزئياً", icon: "02d", main: "Clouds" };
  if (wmoCode === 3) return { id: 804, description: "غائم كلياً", icon: "04d", main: "Clouds" };
  if (wmoCode === 45 || wmoCode === 48) return { id: 701, description: "ضباب خفيف على المرتفعات", icon: "50d", main: "Atmosphere" };
  if (wmoCode >= 51 && wmoCode <= 57) return { id: 500, description: "رذاذ مطر خفيف", icon: "10d", main: "Drizzle" };
  if (wmoCode >= 61 && wmoCode <= 67) return { id: 501, description: "أمطار متفرقة", icon: "10d", main: "Rain" };
  if (wmoCode >= 80 && wmoCode <= 82) return { id: 502, description: "زخات مطر غزيرة", icon: "09d", main: "Rain" };
  if (wmoCode >= 95) return { id: 211, description: "عاصفة رعدية ممطرة", icon: "11d", main: "Thunderstorm" };
  return { id: 801, description: "غائم جزئياً", icon: "02d", main: "Clouds" };
}

// Generate guaranteed offline Taiz weather dataset if networks are offline
function generateOfflineTaizPayload(): WeatherDataPayload {
  const now = Math.floor(Date.now() / 1000);
  const todayDate = new Date();
  const sunrise = new Date(todayDate).setHours(5, 45, 0, 0) / 1000;
  const sunset = new Date(todayDate).setHours(18, 15, 0, 0) / 1000;

  const current = {
    coord: { lon: TAIZ_LON, lat: TAIZ_LAT },
    weather: [
      {
        id: 801,
        main: "Clouds",
        description: "غائم جزئياً",
        icon: "02d"
      }
    ],
    main: {
      temp: 26,
      feels_like: 27,
      temp_min: 20,
      temp_max: 31,
      pressure: 1014,
      humidity: 55,
      sea_level: 1014,
      grnd_level: 860
    },
    visibility: 10000,
    wind: { speed: 3.8, deg: 140, gust: 5.2 },
    clouds: { all: 25 },
    dt: now,
    sys: {
      country: "YE",
      sunrise: Math.floor(sunrise),
      sunset: Math.floor(sunset)
    },
    name: "محافظة تعز"
  };

  const list: any[] = [];
  for (let i = 0; i < 40; i++) {
    const slotTime = now + i * 3 * 3600;
    const hour = new Date(slotTime * 1000).getHours();
    const isNight = hour < 6 || hour > 18;
    const temp = isNight ? 20 + (i % 3) : 27 + (i % 5);

    list.push({
      dt: slotTime,
      main: {
        temp,
        feels_like: temp + 1,
        temp_min: temp - 2,
        temp_max: temp + 3,
        pressure: 1014,
        humidity: 50 + (i % 15)
      },
      weather: [
        {
          id: isNight ? 800 : 801,
          main: isNight ? "Clear" : "Clouds",
          description: isNight ? "سماء صافية" : "غائم جزئياً",
          icon: isNight ? "01n" : "02d"
        }
      ],
      clouds: { all: isNight ? 10 : 30 },
      wind: { speed: 3.5 + (i % 2), deg: 130 },
      pop: i % 4 === 0 ? 0.2 : 0.05
    });
  }

  const forecast = { list };

  const airPollution = {
    list: [
      {
        main: { aqi: 2 },
        components: { co: 210, no: 0.1, no2: 4.5, o3: 65, so2: 2.1, pm2_5: 11.2, pm10: 24.8, nh3: 1.1 },
        dt: now
      }
    ]
  };

  return { current, forecast, airPollution };
}

// Fetch directly from Open-Meteo URL
export async function fetchFromOpenMeteo(): Promise<WeatherDataPayload> {
  const url = buildOpenMeteoUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo API status ${res.status}`);
  const data = await res.json();

  const now = Math.floor(Date.now() / 1000);
  const curWeatherCode = data.current?.weather_code ?? 1;
  const currentWmo = mapWmoToOpenWeather(curWeatherCode);

  const sunriseSec = data.daily?.sunrise?.[0] ? Math.floor(new Date(data.daily.sunrise[0]).getTime() / 1000) : Math.floor(Date.now() / 1000) - 20000;
  const sunsetSec = data.daily?.sunset?.[0] ? Math.floor(new Date(data.daily.sunset[0]).getTime() / 1000) : Math.floor(Date.now() / 1000) + 20000;

  const currentTemp = data.current?.temperature_2m ?? 26;
  const apparentTemp = data.current?.apparent_temperature ?? currentTemp;
  const humidity = data.current?.relative_humidity_2m ?? 55;
  const pressure = data.current?.surface_pressure ?? 1014;
  const windSpeedKm = data.current?.wind_speed_10m ?? 14;
  const windDir = data.current?.wind_direction_10m ?? 140;
  const windGusts = data.current?.wind_gusts_10m ?? 18;

  const maxTempToday = data.daily?.temperature_2m_max?.[0] ?? Math.round(currentTemp + 4);
  const minTempToday = data.daily?.temperature_2m_min?.[0] ?? Math.round(currentTemp - 4);

  const current = {
    coord: { lon: TAIZ_LON, lat: TAIZ_LAT },
    weather: [currentWmo],
    main: {
      temp: Math.round(currentTemp),
      feels_like: Math.round(apparentTemp),
      temp_min: Math.round(minTempToday),
      temp_max: Math.round(maxTempToday),
      pressure: Math.round(pressure),
      humidity: Math.round(humidity),
      sea_level: 1014,
      grnd_level: Math.round(pressure)
    },
    visibility: 10000,
    wind: {
      speed: Number((windSpeedKm / 3.6).toFixed(1)), // m/s
      deg: Math.round(windDir),
      gust: Number((windGusts / 3.6).toFixed(1))
    },
    clouds: { all: data.current?.cloud_cover ?? (currentWmo.id === 800 ? 5 : 40) },
    dt: now,
    sys: {
      country: "YE",
      sunrise: sunriseSec,
      sunset: sunsetSec
    },
    name: "تعز"
  };

  // Build hourly forecast list from Open-Meteo hourly arrays
  const list: any[] = [];
  const times: string[] = data.hourly?.time || [];
  const temps: number[] = data.hourly?.temperature_2m || [];
  const codes: number[] = data.hourly?.weather_code || [];
  const pops: number[] = data.hourly?.precipitation_probability || [];
  const hums: number[] = data.hourly?.relative_humidity_2m || [];
  const uvs: number[] = data.hourly?.uv_index || [];

  for (let i = 0; i < times.length; i += 3) {
    const timeSec = Math.floor(new Date(times[i]).getTime() / 1000);
    const wmo = mapWmoToOpenWeather(codes[i] ?? 1);
    const t = Math.round(temps[i] ?? currentTemp);

    list.push({
      dt: timeSec,
      main: {
        temp: t,
        feels_like: t + 1,
        temp_min: t - 2,
        temp_max: t + 3,
        pressure: 1014,
        humidity: hums[i] ?? 50
      },
      weather: [wmo],
      clouds: { all: wmo.id === 800 ? 5 : 35 },
      wind: { speed: 3.5, deg: 140 },
      pop: (pops[i] ?? 0) / 100,
      uv: uvs[i] ?? 0
    });
  }

  const forecast = { list };

  const airPollution = {
    list: [
      {
        main: { aqi: 2 },
        components: { co: 210, no: 0.1, no2: 4.5, o3: 65, so2: 2.1, pm2_5: 11.2, pm10: 24.8, nh3: 1.1 },
        dt: now
      }
    ]
  };

  return { current, forecast, airPollution, rawOpenMeteo: data };
}

// Fetch directly from OpenWeatherMap API from client side if API key is provided
async function fetchDirectOpenWeather(): Promise<WeatherDataPayload> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No client API key configured for OpenWeather");

  const ts = Date.now();
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${TAIZ_LAT}&lon=${TAIZ_LON}&appid=${apiKey}&units=metric&lang=ar&_t=${ts}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${TAIZ_LAT}&lon=${TAIZ_LON}&appid=${apiKey}&units=metric&lang=ar&_t=${ts}`;
  const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${TAIZ_LAT}&lon=${TAIZ_LON}&appid=${apiKey}&_t=${ts}`;

  const [wRes, fRes, pRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(forecastUrl),
    fetch(pollutionUrl).catch(() => null)
  ]);

  if (!wRes.ok || !fRes.ok) {
    throw new Error(`OpenWeather direct fetch failed: ${wRes.status} / ${fRes.status}`);
  }

  const current = await wRes.json();
  const forecast = await fRes.json();
  const airPollution = pRes && pRes.ok ? await pRes.json() : null;

  return { current, forecast, airPollution };
}

export async function fetchWeatherData(): Promise<WeatherDataPayload> {
  const ts = Date.now();

  // Primary Priority: Open-Meteo with comprehensive query parameters
  try {
    const payload = await fetchFromOpenMeteo();
    notifyUpdated(payload);
    return payload;
  } catch (err) {
    console.warn("[Weather] Primary Open-Meteo fetch failed, attempting OpenWeather fallback...", err);
  }

  // Fallback 1: Direct OpenWeather
  try {
    const payload = await fetchDirectOpenWeather();
    notifyUpdated(payload);
    return payload;
  } catch (err) {
    console.warn("[Weather] Direct OpenWeather fetch failed, attempting server proxy...", err);
  }

  // Fallback 2: Server API endpoint
  try {
    const [weatherRes, forecastRes, pollutionRes] = await Promise.all([
      fetchWithFallback(`/api/weather?lat=${TAIZ_LAT}&lon=${TAIZ_LON}&_t=${ts}`, { cache: "no-store" }, 1, 1000),
      fetchWithFallback(`/api/forecast?lat=${TAIZ_LAT}&lon=${TAIZ_LON}&_t=${ts}`, { cache: "no-store" }, 1, 1000),
      fetchWithFallback(`/api/air_pollution?lat=${TAIZ_LAT}&lon=${TAIZ_LON}&_t=${ts}`, { cache: "no-store" }, 1, 1000).catch(() => null)
    ]);

    if (weatherRes && forecastRes && weatherRes.ok && forecastRes.ok) {
      const current = await weatherRes.json();
      const forecast = await forecastRes.json();
      const airPollution = pollutionRes && pollutionRes.ok ? await pollutionRes.json() : null;

      const payload = { current, forecast, airPollution };
      notifyUpdated(payload);
      return payload;
    }
  } catch (err) {
    console.warn("[Weather] Server route fetch failed, using offline Taiz dataset...", err);
  }

  // Fallback 3: Guaranteed Offline Taiz Payload
  const offlinePayload = generateOfflineTaizPayload();
  notifyUpdated(offlinePayload);
  return offlinePayload;
}

function notifyUpdated(payload: WeatherDataPayload) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem("cached_weather_data");
      localStorage.removeItem("cached_full_weather_data");
    } catch (e) {}
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("weather_updated", { detail: payload }));
  }
}
