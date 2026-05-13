import type { DashboardState } from './dashboard'

export type ThemeMode = 'light' | 'dark'


export interface DashboardTab extends DashboardState {
  id: string
  name: string
}

export interface WorkspaceFileV2 {
  version: 2
  theme: ThemeMode
  activeDashboardId: string
  dashboards: DashboardTab[]
}


export type WorkspaceExportFile = WorkspaceFileV2

export interface SingleDashboardExport extends DashboardTab {
  exportKind: 'single-dashboard'
  exportedAt: string
}
