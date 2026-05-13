import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { DashboardState, DashboardLayouts, DashboardWidget, TodoItem, WidgetDataMap, WidgetType } from '../types/dashboard'
import type { DashboardTab, SingleDashboardExport, ThemeMode, WorkspaceFileV2 } from '../types/workspace'
import { cloneDashboardState } from '../lib/dashboardClone'
import {
  createDefaultWidget,
  createEmptyDashboardTab,
} from '../lib/dashboardInitialState'
import { loadWorkspace, saveWorkspace } from '../lib/workspaceStorage'
import { createId } from '../utils/createId'

const MAX_UNDO = 50

type Stacks = { past: DashboardState[]; future: DashboardState[] }

export function useDashboardWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceFileV2>(() => loadWorkspace())
  const workspaceRef = useRef(workspace)
  const stacksRef = useRef<Record<string, Stacks>>({})
  const [stackTick, bumpStackTick] = useReducer((n: number) => n + 1, 0)
  const [undoUi, setUndoUi] = useState({ canUndo: false, canRedo: false })

  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  useEffect(() => {
    document.documentElement.dataset.theme = workspace.theme
  }, [workspace.theme])

  const persist = useCallback((next: WorkspaceFileV2) => {
    workspaceRef.current = next
    saveWorkspace(next)
    setWorkspace(next)
  }, [])

  const activeDashboard = useMemo(
    () => workspace.dashboards.find((d) => d.id === workspace.activeDashboardId)!,
    [workspace.dashboards, workspace.activeDashboardId],
  )

  const state: DashboardState = useMemo(
    () => ({ widgets: activeDashboard.widgets, layouts: activeDashboard.layouts }),
    [activeDashboard.widgets, activeDashboard.layouts],
  )

  useEffect(() => {
    const id = workspace.activeDashboardId
    const s = stacksRef.current[id] ?? { past: [], future: [] }
    setUndoUi({ canUndo: s.past.length > 0, canRedo: s.future.length > 0 })
  }, [workspace.activeDashboardId, stackTick])

  const canUndo = undoUi.canUndo
  const canRedo = undoUi.canRedo

  const commitDashboardState = useCallback(
    (next: DashboardState) => {
      const w = workspaceRef.current
      const id = w.activeDashboardId
      const tab = w.dashboards.find((t) => t.id === id)!
      const prevSnapshot = cloneDashboardState({ widgets: tab.widgets, layouts: tab.layouts })
      const cur = stacksRef.current[id] ?? { past: [], future: [] }
      stacksRef.current[id] = {
        past: [...cur.past, prevSnapshot].slice(-MAX_UNDO),
        future: [],
      }
      bumpStackTick()
      const nextWorkspace: WorkspaceFileV2 = {
        ...w,
        dashboards: w.dashboards.map((t) =>
          t.id === id ? { ...t, widgets: next.widgets, layouts: next.layouts } : t,
        ),
      }
      persist(nextWorkspace)
    },
    [persist],
  )

  const undo = useCallback(() => {
    const w = workspaceRef.current
    const id = w.activeDashboardId
    const stacks = stacksRef.current[id] ?? { past: [], future: [] }
    if (stacks.past.length === 0) return
    const tab = w.dashboards.find((t) => t.id === id)!
    const currentSnapshot = cloneDashboardState({ widgets: tab.widgets, layouts: tab.layouts })
    const prevState = stacks.past[stacks.past.length - 1]!
    stacksRef.current[id] = {
      past: stacks.past.slice(0, -1),
      future: [currentSnapshot, ...stacks.future],
    }
    bumpStackTick()
    const nextWorkspace: WorkspaceFileV2 = {
      ...w,
      dashboards: w.dashboards.map((t) =>
        t.id === id ? { ...t, widgets: prevState.widgets, layouts: prevState.layouts } : t,
      ),
    }
    persist(nextWorkspace)
  }, [persist])

  const redo = useCallback(() => {
    const w = workspaceRef.current
    const id = w.activeDashboardId
    const stacks = stacksRef.current[id] ?? { past: [], future: [] }
    if (stacks.future.length === 0) return
    const tab = w.dashboards.find((t) => t.id === id)!
    const currentSnapshot = cloneDashboardState({ widgets: tab.widgets, layouts: tab.layouts })
    const nextState = stacks.future[0]!
    stacksRef.current[id] = {
      past: [...stacks.past, currentSnapshot],
      future: stacks.future.slice(1),
    }
    bumpStackTick()
    const nextWorkspace: WorkspaceFileV2 = {
      ...w,
      dashboards: w.dashboards.map((t) =>
        t.id === id ? { ...t, widgets: nextState.widgets, layouts: nextState.layouts } : t,
      ),
    }
    persist(nextWorkspace)
  }, [persist])

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      persist({ ...workspaceRef.current, theme })
    },
    [persist],
  )

  const selectDashboard = useCallback(
    (id: string) => {
      if (!workspaceRef.current.dashboards.some((d) => d.id === id)) return
      persist({ ...workspaceRef.current, activeDashboardId: id })
    },
    [persist],
  )

  const newDashboard = useCallback(() => {
    const tab = createEmptyDashboardTab(`Dashboard ${workspaceRef.current.dashboards.length + 1}`)
    const w = workspaceRef.current
    persist({
      ...w,
      dashboards: [...w.dashboards, tab],
      activeDashboardId: tab.id,
    })
  }, [persist])

  const renameDashboard = useCallback(
    (id: string, name: string) => {
      const w = workspaceRef.current
      persist({
        ...w,
        dashboards: w.dashboards.map((d) => (d.id === id ? { ...d, name } : d)),
      })
    },
    [persist],
  )

  const deleteDashboard = useCallback(
    (id: string) => {
      const w = workspaceRef.current
      if (w.dashboards.length <= 1) return
      const rest = w.dashboards.filter((d) => d.id !== id)
      const nextActive =
        w.activeDashboardId === id ? rest[0]!.id : w.activeDashboardId
      delete stacksRef.current[id]
      bumpStackTick()
      persist({
        ...w,
        dashboards: rest,
        activeDashboardId: nextActive,
      })
    },
    [persist],
  )

  const addWidget = useCallback(
    (type: WidgetType) => {
      const newWidget = createDefaultWidget(type)
      const tab = workspaceRef.current.dashboards.find((t) => t.id === workspaceRef.current.activeDashboardId)!
      const nextWidgets = [...tab.widgets, newWidget]
      const nextLayouts: DashboardLayouts = { ...tab.layouts }
      Object.keys(nextLayouts).forEach((key) => {
        nextLayouts[key] = [
          ...(nextLayouts[key] ?? []),
          {
            i: newWidget.id,
            x: 0,
            y: Infinity,
            w: key === 'xxs' ? 2 : key === 'xs' ? 4 : key === 'sm' ? 6 : 4,
            h: 6,
          },
        ]
      })
      commitDashboardState({ widgets: nextWidgets, layouts: nextLayouts })
    },
    [commitDashboardState],
  )

  const removeWidget = useCallback(
    (widgetId: string) => {
      const tab = workspaceRef.current.dashboards.find((t) => t.id === workspaceRef.current.activeDashboardId)!
      const nextWidgets = tab.widgets.filter((w) => w.id !== widgetId)
      const nextLayouts: DashboardLayouts = {}
      Object.entries(tab.layouts).forEach(([key, layouts]) => {
        nextLayouts[key] = (layouts ?? []).filter((layout) => layout.i !== widgetId)
      })
      commitDashboardState({ widgets: nextWidgets, layouts: nextLayouts })
    },
    [commitDashboardState],
  )

  const updateWidgetTitle = useCallback(
    (widgetId: string, title: string) => {
      const tab = workspaceRef.current.dashboards.find((t) => t.id === workspaceRef.current.activeDashboardId)!
      const nextWidgets = tab.widgets.map((widget) => (widget.id === widgetId ? { ...widget, title } : widget))
      commitDashboardState({ widgets: nextWidgets, layouts: tab.layouts })
    },
    [commitDashboardState],
  )

  const updateWidgetData = useCallback(
    <T extends WidgetType>(widgetId: string, data: Partial<WidgetDataMap[T]>) => {
      const tab = workspaceRef.current.dashboards.find((t) => t.id === workspaceRef.current.activeDashboardId)!
      const nextWidgets = tab.widgets.map((widget) => {
        if (widget.id !== widgetId) return widget
        return {
          ...widget,
          data: { ...widget.data, ...data },
        } as DashboardWidget
      })
      commitDashboardState({ widgets: nextWidgets, layouts: tab.layouts })
    },
    [commitDashboardState],
  )

  const updateTodoItems = useCallback(
    (widgetId: string, items: TodoItem[]) => {
      updateWidgetData<'todo'>(widgetId, { items })
    },
    [updateWidgetData],
  )

  const beginLayoutUndoGroup = useCallback(() => {
    const w = workspaceRef.current
    const id = w.activeDashboardId
    const tab = w.dashboards.find((t) => t.id === id)!
    const prevSnapshot = cloneDashboardState({ widgets: tab.widgets, layouts: tab.layouts })
    const cur = stacksRef.current[id] ?? { past: [], future: [] }
    stacksRef.current[id] = {
      past: [...cur.past, prevSnapshot].slice(-MAX_UNDO),
      future: [],
    }
    bumpStackTick()
  }, [])

  const applyLayoutsSilent = useCallback(
    (layouts: DashboardLayouts) => {
      const w = workspaceRef.current
      const id = w.activeDashboardId
      const tab = w.dashboards.find((t) => t.id === id)!
      const nextWorkspace: WorkspaceFileV2 = {
        ...w,
        dashboards: w.dashboards.map((t) =>
          t.id === id ? { ...t, widgets: tab.widgets, layouts } : t,
        ),
      }
      persist(nextWorkspace)
    },
    [persist],
  )

  const exportWorkspaceJson = useCallback(() => {
    const json = JSON.stringify(workspaceRef.current, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dashboard-workspace-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [])

  const exportCurrentDashboardJson = useCallback(() => {
    const tab = workspaceRef.current.dashboards.find((t) => t.id === workspaceRef.current.activeDashboardId)!
    const payload: SingleDashboardExport = {
      ...tab,
      exportKind: 'single-dashboard',
      exportedAt: new Date().toISOString(),
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dashboard-${tab.name.replace(/\s+/g, '-')}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [])

  const importFromParsed = useCallback(
    (parsed: unknown): { ok: true } | { ok: false; message: string } => {
      if (!parsed || typeof parsed !== 'object') return { ok: false, message: 'Invalid JSON' }
      const o = parsed as Record<string, unknown>

      if (o.exportKind === 'single-dashboard' && Array.isArray(o.widgets)) {
        const tab = o as unknown as SingleDashboardExport
        const newTab: DashboardTab = {
          id: `dash-${createId()}`,
          name: `${tab.name} (imported)`,
          widgets: tab.widgets,
          layouts: tab.layouts,
        }
        const w = workspaceRef.current
        persist({
          ...w,
          dashboards: [...w.dashboards, newTab],
          activeDashboardId: newTab.id,
        })
        return { ok: true }
      }

      if (o.version === 2 && Array.isArray(o.dashboards)) {
        const w = o as unknown as WorkspaceFileV2
        if (!w.dashboards.length) return { ok: false, message: 'No dashboards in file' }
        const normalized: DashboardTab[] = w.dashboards.map((d) => ({
          ...d,
          id: d.id || `dash-${createId()}`,
        }))
        persist({
          version: 2,
          theme: w.theme === 'dark' ? 'dark' : 'light',
          activeDashboardId: normalized.some((d) => d.id === w.activeDashboardId)
            ? w.activeDashboardId
            : normalized[0]!.id,
          dashboards: normalized,
        })
        stacksRef.current = {}
        bumpStackTick()
        return { ok: true }
      }

      if (Array.isArray(o.widgets) && o.layouts !== undefined) {
        const legacy = o as unknown as DashboardState
        const newTab: DashboardTab = {
          id: `dash-${createId()}`,
          name: 'Imported dashboard',
          widgets: legacy.widgets,
          layouts: legacy.layouts,
        }
        const w = workspaceRef.current
        persist({
          ...w,
          dashboards: [...w.dashboards, newTab],
          activeDashboardId: newTab.id,
        })
        return { ok: true }
      }

      return { ok: false, message: 'Unrecognized dashboard JSON format' }
    },
    [persist],
  )

  const replaceWorkspaceFromImport = useCallback(
    (parsed: unknown): { ok: true } | { ok: false; message: string } => {
      if (!parsed || typeof parsed !== 'object') return { ok: false, message: 'Invalid JSON' }
      const o = parsed as Record<string, unknown>
      if (o.version === 2 && Array.isArray(o.dashboards)) {
        const w = o as unknown as WorkspaceFileV2
        if (!w.dashboards.length) return { ok: false, message: 'No dashboards in file' }
        const normalized: DashboardTab[] = w.dashboards.map((d) => ({
          ...d,
          id: d.id || `dash-${createId()}`,
        }))
        persist({
          version: 2,
          theme: w.theme === 'dark' ? 'dark' : 'light',
          activeDashboardId: normalized[0]!.id,
          dashboards: normalized,
        })
        stacksRef.current = {}
        bumpStackTick()
        return { ok: true }
      }
      return { ok: false, message: 'File must be a full workspace export (version 2)' }
    },
    [persist],
  )

  return {
    workspace,
    theme: workspace.theme,
    setTheme,
    activeDashboard,
    state,
    dashboards: workspace.dashboards,
    activeDashboardId: workspace.activeDashboardId,
    selectDashboard,
    newDashboard,
    renameDashboard,
    deleteDashboard,
    addWidget,
    removeWidget,
    updateWidgetTitle,
    updateWidgetData,
    updateTodoItems,
    beginLayoutUndoGroup,
    applyLayoutsSilent,
    undo,
    redo,
    canUndo,
    canRedo,
    exportWorkspaceJson,
    exportCurrentDashboardJson,
    importFromParsed,
    replaceWorkspaceFromImport,
  }
}
