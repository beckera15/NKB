'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, MapPin } from 'lucide-react'
import { getWeather, type WeatherData } from '@/lib/weather'

interface WeatherWidgetProps {
  className?: string
  compact?: boolean
}

function getWeatherIcon(description: string) {
  const lower = description.toLowerCase()
  if (lower.includes('rain') || lower.includes('drizzle')) return CloudRain
  if (lower.includes('snow') || lower.includes('sleet')) return Snowflake
  if (lower.includes('cloud') || lower.includes('overcast')) return Cloud
  if (lower.includes('clear') || lower.includes('sun')) return Sun
  return Cloud
}

export function WeatherWidget({ className = '', compact = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true)
      setError(null)
      try {
        // Uses default Kearney, MO coordinates
        const data = await getWeather()
        if (data) {
          setWeather(data)
        } else {
          setError('Unable to fetch weather')
        }
      } catch (err) {
        setError('Weather service unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <Cloud className="animate-pulse" size={compact ? 16 : 20} />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <Cloud size={compact ? 16 : 20} />
        <span className="text-sm">{error || 'Weather unavailable'}</span>
      </div>
    )
  }

  const WeatherIcon = getWeatherIcon(weather.description)

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <WeatherIcon size={16} className="text-blue-400" />
        <span className="text-sm font-medium">{weather.temp}°F</span>
        <span className="text-xs text-gray-400">{weather.city}</span>
      </div>
    )
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg p-3 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-gray-400" />
          <span className="text-sm text-gray-300">{weather.city}, {weather.country}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <WeatherIcon size={32} className="text-blue-400" />
          <div>
            <div className="text-2xl font-bold">{weather.temp}°F</div>
            <div className="text-xs text-gray-400 capitalize">{weather.description}</div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-400">
            <span>H:</span>
            <span className="text-gray-200">{weather.tempMax}°</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <span>L:</span>
            <span className="text-gray-200">{weather.tempMin}°</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Wind size={12} />
            <span className="text-gray-200">{weather.windSpeed} mph</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Droplets size={12} />
            <span className="text-gray-200">{weather.humidity}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
