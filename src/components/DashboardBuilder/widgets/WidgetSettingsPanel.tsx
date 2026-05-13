import type { DashboardWidget, WidgetDataMap, WidgetType } from '../../../types/dashboard'
import styles from '../DashboardBuilder.module.css'

export function WidgetSettingsPanel({
  widget,
  onClose,
  onRename,
  onUpdateData,
}: {
  widget: DashboardWidget
  onClose: () => void
  onRename: (title: string) => void
  onUpdateData: <T extends WidgetType>(id: string, data: Partial<WidgetDataMap[T]>) => void
}) {
  return (
    <aside className={styles.settings}>
      <div className={styles.settingsHeader}>
        <h3>Widget settings</h3>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <label>
        Title
        <input value={widget.title} onChange={(e) => onRename(e.target.value)} />
      </label>

      {widget.type === 'weather' && (
        <>
          <label>
            City
            <input
              value={widget.data.city}
              onChange={(e) => onUpdateData<'weather'>(widget.id, { city: e.target.value })}
            />
          </label>
          <label>
            Unit
            <select
              value={widget.data.unit}
              onChange={(e) => onUpdateData<'weather'>(widget.id, { unit: e.target.value as 'C' | 'F' })}
            >
              <option value="C">Celsius</option>
              <option value="F">Fahrenheit</option>
            </select>
          </label>
        </>
      )}

      {widget.type === 'chart' && (
        <>
          <label>
            Chart Type
            <select
              value={widget.data.chartType}
              onChange={(e) => onUpdateData<'chart'>(widget.id, { chartType: e.target.value as 'bar' | 'line' })}
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
            </select>
          </label>
          <label>
            Metric
            <select
              value={widget.data.metric}
              onChange={(e) =>
                onUpdateData<'chart'>(widget.id, { metric: e.target.value as 'weekly' | 'monthly' })
              }
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </>
      )}

      {widget.type === 'notes' && (
        <p className={styles.muted}>Note appearance is fixed per theme for readability.</p>
      )}

      {widget.type === 'todo' && (
        <p className={styles.muted}>Use widget body controls for task CRUD operations.</p>
      )}
    </aside>
  )
}
