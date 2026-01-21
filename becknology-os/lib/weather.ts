// Open-Meteo API integration (free, no API key required)

// Default coordinates for Kearney, MO
const DEFAULT_LAT = 39.36
const DEFAULT_LON = -94.35

export interface WeatherData {
  temp: number
  tempMin: number
  tempMax: number
  feelsLike: number
  humidity: number
  description: string
  icon: string
  city: string
  country: string
  windSpeed: number
  sunrise: number
  sunset: number
}

// Weather code to description mapping
const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '01d' },
  1: { description: 'Mainly clear', icon: '02d' },
  2: { description: 'Partly cloudy', icon: '03d' },
  3: { description: 'Overcast', icon: '04d' },
  45: { description: 'Fog', icon: '50d' },
  48: { description: 'Depositing rime fog', icon: '50d' },
  51: { description: 'Light drizzle', icon: '09d' },
  53: { description: 'Moderate drizzle', icon: '09d' },
  55: { description: 'Dense drizzle', icon: '09d' },
  61: { description: 'Slight rain', icon: '10d' },
  63: { description: 'Moderate rain', icon: '10d' },
  65: { description: 'Heavy rain', icon: '10d' },
  66: { description: 'Light freezing rain', icon: '13d' },
  67: { description: 'Heavy freezing rain', icon: '13d' },
  71: { description: 'Slight snow', icon: '13d' },
  73: { description: 'Moderate snow', icon: '13d' },
  75: { description: 'Heavy snow', icon: '13d' },
  77: { description: 'Snow grains', icon: '13d' },
  80: { description: 'Slight rain showers', icon: '09d' },
  81: { description: 'Moderate rain showers', icon: '09d' },
  82: { description: 'Violent rain showers', icon: '09d' },
  85: { description: 'Slight snow showers', icon: '13d' },
  86: { description: 'Heavy snow showers', icon: '13d' },
  95: { description: 'Thunderstorm', icon: '11d' },
  96: { description: 'Thunderstorm with slight hail', icon: '11d' },
  99: { description: 'Thunderstorm with heavy hail', icon: '11d' },
}

export async function getWeather(lat: number = DEFAULT_LAT, lon: number = DEFAULT_LON): Promise<WeatherData | null> {
  try {
    // Fetch current weather and daily forecast from Open-Meteo
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago`
    )

    if (!response.ok) {
      console.error('Weather fetch failed:', await response.text())
      return null
    }

    const data = await response.json()

    const weatherCode = data.current?.weather_code ?? 0
    const weatherInfo = WEATHER_CODES[weatherCode] || { description: 'Unknown', icon: '01d' }

    // Determine if it's night time for icon suffix
    const now = new Date()
    const sunrise = new Date(data.daily?.sunrise?.[0] || now)
    const sunset = new Date(data.daily?.sunset?.[0] || now)
    const isNight = now < sunrise || now > sunset
    const iconSuffix = isNight ? 'n' : 'd'
    const icon = weatherInfo.icon.replace('d', iconSuffix)

    return {
      temp: Math.round(data.current?.temperature_2m ?? 0),
      tempMin: Math.round(data.daily?.temperature_2m_min?.[0] ?? 0),
      tempMax: Math.round(data.daily?.temperature_2m_max?.[0] ?? 0),
      feelsLike: Math.round(data.current?.apparent_temperature ?? 0),
      humidity: data.current?.relative_humidity_2m ?? 0,
      description: weatherInfo.description,
      icon: icon,
      city: 'Kearney',
      country: 'US',
      windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
      sunrise: Math.floor(sunrise.getTime() / 1000),
      sunset: Math.floor(sunset.getTime() / 1000),
    }
  } catch (error) {
    console.error('Weather fetch error:', error)
    return null
  }
}

export function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}
