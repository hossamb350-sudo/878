export interface WeatherDataPayload {
  current: any;
  forecast: any;
  airPollution?: any;
}

export async function fetchWeatherData(): Promise<WeatherDataPayload> {
  // Fixed coordinates for accurate OpenWeatherMap queries
  const lat = 13.660174;
  const lon = 44.131802;
  const ts = Date.now();

  try {
    // Direct live request without caching (cache: 'no-store')
    const [weatherRes, forecastRes, pollutionRes] = await Promise.all([
      fetch(`/api/weather?lat=${lat}&lon=${lon}&_t=${ts}`, { cache: "no-store" }),
      fetch(`/api/forecast?lat=${lat}&lon=${lon}&_t=${ts}`, { cache: "no-store" }),
      fetch(`/api/air_pollution?lat=${lat}&lon=${lon}&_t=${ts}`, { cache: "no-store" }).catch(() => null)
    ]);

    if (!weatherRes.ok || !forecastRes.ok) {
      throw new Error("Failed to fetch weather data from API");
    }

    const current = await weatherRes.json();
    const forecast = await forecastRes.json();
    const airPollution = pollutionRes && pollutionRes.ok ? await pollutionRes.json() : null;

    const payload: WeatherDataPayload = {
      current,
      forecast,
      airPollution
    };

    // Clean up any stale local storage cache to ensure zero local caching reliance
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("cached_weather_data");
      localStorage.removeItem("cached_full_weather_data");
      localStorage.removeItem("cached_full_forecast_data");
      localStorage.removeItem("cached_full_air_pollution");
    }

    // Notify all active listeners in the web app
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("weather_updated", { detail: payload }));
    }

    return payload;
  } catch (error) {
    console.error("Error fetching live weather data:", error);
    throw error;
  }
}
