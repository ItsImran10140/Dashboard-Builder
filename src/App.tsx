import { DashboardBuilder } from './components/DashboardBuilder/DashboardBuilder.tsx'
import styles from './styles/App.module.css'

export default function App() {
  return (
    <main className={styles.app}>
      <DashboardBuilder />
    </main>
  )
}