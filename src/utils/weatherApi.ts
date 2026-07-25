import { fetchWeatherApi } from "openmeteo";

export async function fetchOpenMeteoData() {
  const params = {
    latitude: 13.5795,
    longitude: 44.0203,
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "wind_speed_10m_max",
      "relative_humidity_2m_max",
      "precipitation_probability_max"
    ],
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "surface_pressure",
      "wind_speed_10m",
      "visibility"
    ],
    timezone: "Asia/Riyadh"
  };
  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);
  
  // Process first location.
  const response = responses[0];
  const current = response.current()!;
  const daily = response.daily()!;
  const utcOffsetSeconds = response.utcOffsetSeconds();
  
  const currentData = {
    temperature_2m: current.variables(0)!.value(),
    relative_humidity_2m: current.variables(1)!.value(),
    apparent_temperature: current.variables(2)!.value(),
    is_day: current.variables(3)!.value(),
    precipitation: current.variables(4)!.value(),
    weather_code: current.variables(5)!.value(),
    surface_pressure: current.variables(6)!.value(),
    wind_speed_10m: current.variables(7)!.value(),
    visibility: current.variables(8)!.value(),
  };

  const sunrise = daily.variables(3)!;
  const sunset = daily.variables(4)!;

  const dailyData = {
    time: Array.from(
      { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
      (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
    ),
    weather_code: daily.variables(0)!.valuesArray()!,
    temperature_2m_max: daily.variables(1)!.valuesArray()!,
    temperature_2m_min: daily.variables(2)!.valuesArray()!,
    sunrise: [...Array(sunrise.valuesInt64Length())].map(
      (_, i) => new Date(Number(sunrise.valuesInt64(i)) * 1000)
    ),
    sunset: [...Array(sunset.valuesInt64Length())].map(
      (_, i) => new Date(Number(sunset.valuesInt64(i)) * 1000)
    ),
    wind_speed_10m_max: daily.variables(5)!.valuesArray()!,
    relative_humidity_2m_max: daily.variables(6)!.valuesArray()!,
    precipitation_probability_max: daily.variables(7)!.valuesArray()!,
  };

  return {
    current: currentData,
    daily: dailyData,
  };
}
