import type { DashboardState } from '../types/dashboard'

export function cloneDashboardState(state: DashboardState): DashboardState {
  return JSON.parse(JSON.stringify(state)) as DashboardState
}
