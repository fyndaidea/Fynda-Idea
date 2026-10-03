/** Client-safe dashboard query paths (no server/DB imports). */

export const DASHBOARD_SETTINGS_GROUP = "settings";
export const PREFERENCES_DASHBOARD_QUERY = `group=${DASHBOARD_SETTINGS_GROUP}&tab=preferences`;

export function isPreferencesSettingsTab(tab: string | null | undefined): boolean {
  return tab === "preferences";
}
