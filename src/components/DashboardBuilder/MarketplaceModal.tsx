import type { WidgetType } from '../../types/dashboard'
import styles from './DashboardBuilder.module.css'

const ITEMS: { type: WidgetType; title: string; description: string }[] = [
  {
    type: 'todo',
    title: 'To-Do List',
    description: 'Tasks with checkboxes, hide completed, persisted locally.',
  },
  {
    type: 'weather',
    title: 'Weather',
    description: 'Mock forecast for any city; unit in settings.',
  },
  {
    type: 'chart',
    title: 'Metrics chart',
    description: 'Bar or line chart from mock weekly/monthly data.',
  },
  {
    type: 'notes',
    title: 'Sticky notes',
    description: 'Autosaving note; warm sticky styling per theme.',
  },
]

export function MarketplaceModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (type: WidgetType) => void
}) {
  if (!open) return null

  return (
    <div className={styles.modalRoot} role="presentation">
      <button type="button" className={styles.modalBackdrop} onClick={onClose} aria-label="Close marketplace" />
      <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="marketplace-title">
        <div className={styles.modalHeader}>
          <h2 id="marketplace-title">Widget marketplace</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <p className={styles.modalIntro}>Browse widgets and add them to the active dashboard.</p>
        <ul className={styles.marketplaceList}>
          {ITEMS.map((item) => (
            <li key={item.type} className={styles.marketplaceCard}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
              <button type="button" onClick={() => onAdd(item.type)}>
                Add
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
