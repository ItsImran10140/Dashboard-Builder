import type { DashboardState } from '../types/dashboard'
import type { WorkspaceFileV2 } from '../types/workspace'
import { createDefaultDashboardTab } from './dashboardInitialState'

const STORAGE_KEY_V1 = 'dashboard-builder:v1'
const STORAGE_KEY_V2 = 'dashboard-builder:v2'

export function migrateV1ToV2(state: DashboardState): WorkspaceFileV2 {
  const id = `dash-${Date.now()}`
  return {
    version: 2,
    theme: 'light',
    activeDashboardId: id,
    dashboards: [{ id, name: 'Dashboard 1', widgets: state.widgets, layouts: state.layouts }],
  }
}

export function loadWorkspace(): WorkspaceFileV2 {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2)
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as WorkspaceFileV2
      if (parsed.version === 2 && Array.isArray(parsed.dashboards) && parsed.dashboards.length > 0) {
        return parsed
      }
    }
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
    if (rawV1) {
      const legacy = JSON.parse(rawV1) as DashboardState
      const migrated = migrateV1ToV2(legacy)
      saveWorkspace(migrated)
      return migrated
    }
  } catch {
    void 0
  }
  const fresh = createDefaultDashboardTab()
  const workspace: WorkspaceFileV2 = {
    version: 2,
    theme: 'light',
    activeDashboardId: fresh.id,
    dashboards: [fresh],
  }
  saveWorkspace(workspace)
  return workspace
}

export function saveWorkspace(workspace: WorkspaceFileV2): void {
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(workspace))
}
