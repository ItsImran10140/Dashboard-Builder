export interface WeatherResponse {
  city: string
  condition: string
  temperatureC: number
}

export interface MetricPoint {
  label: string
  value: number
}

export async function fetchMockWeather(city: string): Promise<WeatherResponse> {
  await new Promise((resolve) => setTimeout(resolve, 450))
  const seed = city.length || 5
  return {
    city,
    condition: seed % 2 === 0 ? 'Sunny' : 'Cloudy',
    temperatureC: 18 + (seed % 12),
  }
}

export async function fetchMockMetrics(
  metric: 'weekly' | 'monthly',
): Promise<MetricPoint[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  if (metric === 'monthly') {
    return [
      { label: 'Jan', value: 30 },
      { label: 'Feb', value: 45 },
      { label: 'Mar', value: 38 },
      { label: 'Apr', value: 56 },
      { label: 'May', value: 42 },
      { label: 'Jun', value: 63 },
    ]
  }
  return [
    { label: 'Mon', value: 8 },
    { label: 'Tue', value: 14 },
    { label: 'Wed', value: 11 },
    { label: 'Thu', value: 17 },
    { label: 'Fri', value: 13 },
    { label: 'Sat', value: 9 },
    { label: 'Sun', value: 7 },
  ]
}
