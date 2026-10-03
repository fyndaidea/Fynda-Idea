/** Client-safe dashboard query paths (no server/DB imports). */

export const DASHBOARD_SETTINGS_GROUP = "settings";
export const DASHBOARD_API_TAB = "api";
export const API_KEYS_DASHBOARD_QUERY = `group=${DASHBOARD_SETTINGS_GROUP}&tab=${DASHBOARD_API_TAB}`;
export const PREFERENCES_DASHBOARD_QUERY = `group=${DASHBOARD_SETTINGS_GROUP}&tab=preferences`;

export function isPreferencesSettingsTab(tab: string | null | undefined): boolean {
  return tab === "preferences";
}
