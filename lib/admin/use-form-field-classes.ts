import { useAdminTheme } from "@/components/admin/admin-theme-context";
import {
  adminInputClass,
  adminLabelClass,
  adminSearchInputClass,
} from "@/lib/admin/ui-classes";
import { inputClass, labelClass, searchInputClass } from "@/lib/ui-classes";

export function useFormFieldClasses() {
  const admin = useAdminTheme();
  if (admin) {
    return {
      input: adminInputClass,
      search: adminSearchInputClass,
      label: adminLabelClass,
    };
  }
  return {
    input: inputClass,
    search: searchInputClass,
    label: labelClass,
  };
}
