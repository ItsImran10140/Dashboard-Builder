import type { ThemeMode } from '../../../types/workspace'
import type { WidgetDataMap } from '../../../types/dashboard'
import styles from '../DashboardBuilder.module.css'

export function NotesWidget({
  data,
  theme,
  onChange,
}: {
  data: WidgetDataMap['notes']
  theme: ThemeMode
  onChange: (text: string) => void
}) {
  const tone = theme === 'dark' ? styles.notesDark : styles.notesLight

  return (
    <textarea
      className={`${styles.notes} ${tone}`}
      value={data.text}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your note..."
    />
  )
}
