import { useState } from 'react'
import { fetchMockWeather } from '../../../api/mockApi'
import type { WidgetDataMap } from '../../../types/dashboard'
import styles from '../DashboardBuilder.module.css'

export function WeatherWidget({ data }: { data: WidgetDataMap['weather'] }) {
  const [result, setResult] = useState<{ condition: string; temperature: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetchMockWeather(data.city)
    const temperature = data.unit === 'C' ? res.temperatureC : Math.round((res.temperatureC * 9) / 5 + 32)
    setResult({ condition: res.condition, temperature })
    setLoading(false)
  }

  return (
    <div className={styles.weather}>
      <button type="button" onClick={load}>
        {loading ? 'Loading...' : `Fetch ${data.city}`}
      </button>
      {result && (
        <p>
          {result.condition} - {result.temperature} deg{data.unit}
        </p>
      )}
      {!result && <p className={styles.muted}>Use settings to change city/unit.</p>}
    </div>
  )
}
