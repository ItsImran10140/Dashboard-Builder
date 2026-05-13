import type { Layout, LayoutItem } from 'react-grid-layout'

export type WidgetType = 'todo' | 'weather' | 'chart' | 'notes'

export interface TodoItem {
  id: string
  text: string
  done: boolean
}

export interface WidgetDataMap {
  todo: { items: TodoItem[]; hideCompleted: boolean }
  weather: { city: string; unit: 'C' | 'F' }
  chart: { chartType: 'bar' | 'line'; metric: 'weekly' | 'monthly' }
  notes: { text: string }
}

interface DashboardWidgetBase<T extends WidgetType, D> {
  id: string
  type: T
  title: string
  data: D
}

export type DashboardWidget =
  | DashboardWidgetBase<'todo', WidgetDataMap['todo']>
  | DashboardWidgetBase<'weather', WidgetDataMap['weather']>
  | DashboardWidgetBase<'chart', WidgetDataMap['chart']>
  | DashboardWidgetBase<'notes', WidgetDataMap['notes']>

export type DashboardLayouts = Partial<Record<string, Layout>>

export interface DashboardState {
  widgets: DashboardWidget[]
  layouts: DashboardLayouts
}

export type WidgetLayout = LayoutItem
