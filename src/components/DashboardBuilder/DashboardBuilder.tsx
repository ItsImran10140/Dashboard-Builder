import { useEffect, useRef, useState } from 'react'
import { Responsive } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useDashboardWorkspace } from '../../hooks/useDashboardWorkspace.ts'
import type { DashboardLayouts } from '../../types/dashboard.ts'
import styles from './DashboardBuilder.module.css'
import { MarketplaceModal } from './MarketplaceModal.tsx'
import { ChartWidget } from './widgets/ChartWidget.tsx'
import { NotesWidget } from './widgets/NotesWidget.tsx'
import { TodoWidget } from './widgets/TodoWidget.tsx'
import { WeatherWidget } from './widgets/WeatherWidget.tsx'
import { WidgetSettingsPanel } from './widgets/WidgetSettingsPanel.tsx'

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }

export function DashboardBuilder() {
  const ws = useDashboardWorkspace()
  const {
    theme,
    setTheme,
    state,
    dashboards,
    activeDashboardId,
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
  } = ws

  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId)!

  const [activeSettingsId, setActiveSettingsId] = useState<string | null>(null)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)
  const importMergeRef = useRef<HTMLInputElement>(null)
  const importReplaceRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const node = canvasRef.current
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setWidth(Math.floor(entry.contentRect.width))
    })
    observer.observe(node)
    setWidth(Math.floor(node.getBoundingClientRect().width))
    return () => observer.disconnect()
  }, [])

  const activeWidget =
    state.widgets.find((widget) => widget.id === activeSettingsId) ?? null

  const gridMargin: [number, number] = width > 0 && width < 420 ? [10, 10] : [12, 12]

  const readFileJson = (file: File, onResult: (parsed: unknown) => void) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        onResult(parsed)
      } catch {
        alert('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
  }

  const onImportMerge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    readFileJson(file, (parsed) => {
      const res = importFromParsed(parsed)
      if (res.ok === false) alert(res.message)
    })
  }

  const onImportReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!window.confirm('Replace all dashboards and theme with this workspace file?')) return
    readFileJson(file, (parsed) => {
      const res = replaceWorkspaceFromImport(parsed)
      if (res.ok === false) alert(res.message)
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>Dashboard Builder</h1>
            <p>Drag, resize, configure widgets. Multi-dashboard workspace auto-saves.</p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <label htmlFor="dash-select" className="sr-only">
              Active dashboard
            </label>
            <select
              id="dash-select"
              className={styles.dashboardSelect}
              value={activeDashboardId}
              onChange={(e) => selectDashboard(e.target.value)}
            >
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              key={activeDashboardId}
              className={styles.renameInput}
              defaultValue={activeDashboard.name}
              onBlur={(e) => {
                const trimmed = e.target.value.trim()
                if (trimmed && trimmed !== activeDashboard.name) {
                  renameDashboard(activeDashboard.id, trimmed)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              aria-label="Rename dashboard"
            />
            <button type="button" onClick={newDashboard} title="Create a new dashboard tab">
              <span className={styles.btnLabelFull}>+ New dashboard</span>
              <span className={styles.btnLabelShort}>+ New</span>
            </button>
            <button
              type="button"
              className={styles.danger}
              title="Delete current dashboard"
              onClick={() => {
                if (dashboards.length <= 1) return
                if (window.confirm(`Delete “${activeDashboard.name}”?`)) {
                  deleteDashboard(activeDashboard.id)
                }
              }}
              disabled={dashboards.length <= 1}
            >
              <span className={styles.btnLabelFull}>Delete tab</span>
              <span className={styles.btnLabelShort}>Delete</span>
            </button>
          </div>

          <div className={styles.toolbarGroup}>
            <button type="button" onClick={() => setMarketplaceOpen(true)}>
              Marketplace
            </button>
            <button type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              Undo
            </button>
            <button type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
              Redo
            </button>
          </div>

          <div className={styles.toolbarGroup}>
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              <span className={styles.btnLabelFull}>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
              <span className={styles.btnLabelShort}>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            <button type="button" onClick={exportWorkspaceJson} title="Download all dashboards + theme as JSON">
              <span className={styles.btnLabelFull}>Export workspace</span>
              <span className={styles.btnLabelShort}>Export all</span>
            </button>
            <button type="button" onClick={exportCurrentDashboardJson} title="Download this dashboard as JSON">
              <span className={styles.btnLabelFull}>Export dashboard</span>
              <span className={styles.btnLabelShort}>Export tab</span>
            </button>
            <button type="button" onClick={() => importMergeRef.current?.click()} title="Add dashboards from JSON file">
              <span className={styles.btnLabelFull}>Import (add)</span>
              <span className={styles.btnLabelShort}>Import +</span>
            </button>
            <button type="button" onClick={() => importReplaceRef.current?.click()} title="Replace entire workspace from JSON">
              <span className={styles.btnLabelFull}>Import workspace (replace)</span>
              <span className={styles.btnLabelShort}>Replace…</span>
            </button>
            <input
              ref={importMergeRef}
              type="file"
              accept="application/json,.json"
              className={styles.hiddenFile}
              onChange={onImportMerge}
            />
            <input
              ref={importReplaceRef}
              type="file"
              accept="application/json,.json"
              className={styles.hiddenFile}
              onChange={onImportReplace}
            />
          </div>

          <div className={styles.catalog}>
            <button type="button" onClick={() => addWidget('todo')}>
              + To-Do
            </button>
            <button type="button" onClick={() => addWidget('weather')}>
              + Weather
            </button>
            <button type="button" onClick={() => addWidget('chart')}>
              + Chart
            </button>
            <button type="button" onClick={() => addWidget('notes')}>
              + Notes
            </button>
          </div>
        </div>
      </header>

      <MarketplaceModal
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
        onAdd={(type) => {
          addWidget(type)
          setMarketplaceOpen(false)
        }}
      />

      <div className={`${styles.workspace} ${activeWidget ? styles.workspaceWithPanel : ''}`}>
        <div className={styles.canvasArea} ref={canvasRef}>
          <Responsive
            className={styles.grid}
            width={width}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            layouts={state.layouts}
            rowHeight={width > 0 && width < 420 ? 32 : 30}
            margin={gridMargin}
            onDragStart={beginLayoutUndoGroup}
            onResizeStart={beginLayoutUndoGroup}
            onLayoutChange={(_, layouts) => applyLayoutsSilent(layouts as DashboardLayouts)}
          >
            {state.widgets.map((widget) => (
              <article key={widget.id} className={styles.widget}>
                <div className={styles.widgetHeader}>
                  <strong>{widget.title}</strong>
                  <div className={styles.widgetActions}>
                    <button
                      type="button"
                      className={activeSettingsId === widget.id ? styles.settingsActive : ''}
                      title={activeSettingsId === widget.id ? 'Hide settings panel' : 'Widget settings'}
                      aria-label={activeSettingsId === widget.id ? 'Hide settings' : 'Open settings'}
                      onClick={() =>
                        setActiveSettingsId((previous) => (previous === widget.id ? null : widget.id))
                      }
                    >
                      <span className={styles.btnLabelFull}>
                        {activeSettingsId === widget.id ? 'Hide settings' : 'Settings'}
                      </span>
                      <span className={styles.btnLabelShort}>
                        {activeSettingsId === widget.id ? 'Hide' : 'Edit'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWidget(widget.id)}
                      className={styles.danger}
                      title="Remove this widget"
                      aria-label="Remove widget"
                    >
                      <span className={styles.btnLabelFull}>Remove</span>
                      <span className={styles.btnLabelShort} aria-hidden="true">
                        ×
                      </span>
                    </button>
                  </div>
                </div>
                <div className={styles.widgetBody}>
                  {widget.type === 'todo' && (
                    <TodoWidget
                      data={widget.data}
                      onSaveItems={(items) => updateTodoItems(widget.id, items)}
                      onToggleHideCompleted={(hideCompleted) => updateWidgetData<'todo'>(widget.id, { hideCompleted })}
                    />
                  )}
                  {widget.type === 'weather' && <WeatherWidget data={widget.data} />}
                  {widget.type === 'chart' && <ChartWidget data={widget.data} />}
                  {widget.type === 'notes' && (
                    <NotesWidget
                      data={widget.data}
                      theme={theme}
                      onChange={(text) => updateWidgetData<'notes'>(widget.id, { text })}
                    />
                  )}
                </div>
              </article>
            ))}
          </Responsive>
        </div>

        {activeWidget && (
          <>
            <button
              type="button"
              className={styles.backdrop}
              onClick={() => setActiveSettingsId(null)}
              aria-label="Close settings"
            />
            <WidgetSettingsPanel
              widget={activeWidget}
              onClose={() => setActiveSettingsId(null)}
              onRename={(title) => updateWidgetTitle(activeWidget.id, title)}
              onUpdateData={(id, data) => updateWidgetData(id, data)}
            />
          </>
        )}
      </div>
    </section>
  )
}
