import { useState } from 'react'
import type { TodoItem, WidgetDataMap } from '../../../types/dashboard'
import { createId } from '../../../utils/createId'
import styles from '../DashboardBuilder.module.css'

export function TodoWidget({
  data,
  onSaveItems,
  onToggleHideCompleted,
}: {
  data: WidgetDataMap['todo']
  onSaveItems: (items: TodoItem[]) => void
  onToggleHideCompleted: (hideCompleted: boolean) => void
}) {
  const [input, setInput] = useState('')
  const visibleItems = data.hideCompleted ? data.items.filter((item) => !item.done) : data.items

  const addTodo = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSaveItems([...data.items, { id: createId(), text: trimmed, done: false }])
    setInput('')
  }

  return (
    <div className={styles.todo}>
      <div className={styles.todoControls}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add a task..." />
        <button type="button" onClick={addTodo}>
          Add
        </button>
      </div>
      <label className={styles.inlineCheck}>
        <input
          type="checkbox"
          checked={data.hideCompleted}
          onChange={(e) => onToggleHideCompleted(e.target.checked)}
        />
        Hide completed
      </label>
      <ul>
        {visibleItems.map((item) => (
          <li key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => {
                  onSaveItems(
                    data.items.map((todo) => (todo.id === item.id ? { ...todo, done: e.target.checked } : todo)),
                  )
                }}
              />
              <span className={item.done ? styles.done : ''}>{item.text}</span>
            </label>
            <button
              type="button"
              onClick={() => onSaveItems(data.items.filter((todo) => todo.id !== item.id))}
              className={styles.iconButton}
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
