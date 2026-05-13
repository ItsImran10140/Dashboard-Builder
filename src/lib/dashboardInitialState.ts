import type { DashboardLayouts, DashboardWidget, WidgetType } from '../types/dashboard'
import type { DashboardTab } from '../types/workspace'
import { createId } from '../utils/createId'

export function createDefaultWidget(type: WidgetType): DashboardWidget {
  const id = createId()
  if (type === 'todo') {
    return { id, type, title: 'To-Do List', data: { items: [], hideCompleted: false } }
  }
  if (type === 'weather') {
    return { id, type, title: 'Weather', data: { city: 'Bengaluru', unit: 'C' } }
  }
  if (type === 'chart') {
    return { id, type, title: 'Metrics', data: { chartType: 'bar', metric: 'weekly' } }
  }
  return { id, type, title: 'Notes', data: { text: '' } }
}

function buildLayoutsForWidgets(widgets: DashboardWidget[]): DashboardLayouts {
  const baseLayouts = widgets.reduce<Record<string, { i: string; x: number; y: number; w: number; h: number }>>(
    (acc, widget, index) => {
      acc[widget.id] = { i: widget.id, x: (index % 2) * 6, y: Math.floor(index / 2) * 6, w: 6, h: 6 }
      return acc
    },
    {},
  )
  return {
    lg: Object.values(baseLayouts),
    md: Object.values(baseLayouts).map((l) => ({ ...l, w: 5 })),
    sm: Object.values(baseLayouts).map((l) => ({ ...l, x: 0, w: 6 })),
    xs: Object.values(baseLayouts).map((l) => ({ ...l, x: 0, w: 4 })),
    xxs: Object.values(baseLayouts).map((l) => ({ ...l, x: 0, w: 2 })),
  }
}

export function createDefaultDashboardTab(name = 'Dashboard 1'): DashboardTab {
  const id = `dash-${createId()}`
  const widgets = [
    createDefaultWidget('todo'),
    createDefaultWidget('weather'),
    createDefaultWidget('chart'),
    createDefaultWidget('notes'),
  ]
  return {
    id,
    name,
    widgets,
    layouts: buildLayoutsForWidgets(widgets),
  }
}

export function createEmptyDashboardTab(name: string): DashboardTab {
  const id = `dash-${createId()}`
  return {
    id,
    name,
    widgets: [],
    layouts: {},
  }
}
