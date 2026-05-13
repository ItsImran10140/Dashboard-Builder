import { useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { fetchMockMetrics } from '../../../api/mockApi'
import type { WidgetDataMap } from '../../../types/dashboard'
import styles from '../DashboardBuilder.module.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
)

export function ChartWidget({ data }: { data: WidgetDataMap['chart'] }) {
  const [points, setPoints] = useState<{ label: string; value: number }[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const result = await fetchMockMetrics(data.metric)
    setPoints(result)
    setLoading(false)
  }

  const chartData = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: data.metric === 'weekly' ? 'Weekly Metric' : 'Monthly Metric',
        data: points.map((point) => point.value),
        backgroundColor: 'rgba(59, 130, 246, 0.35)',
        borderColor: 'rgba(37, 99, 235, 1)',
      },
    ],
  }

  return (
    <div className={styles.chart}>
      <button type="button" onClick={load}>
        {loading ? 'Loading...' : 'Load metrics'}
      </button>
      <div className={styles.chartView}>
        {points.length === 0 ? (
          <p className={styles.muted}>No data loaded yet.</p>
        ) : data.chartType === 'bar' ? (
          <Bar data={chartData} />
        ) : (
          <Line data={chartData} />
        )}
      </div>
    </div>
  )
}
