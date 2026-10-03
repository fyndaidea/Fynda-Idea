"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AdminPrimaryAction = {
  label: string;
  onClick: () => void;
} | null;

type AdminActionContextValue = {
  primaryAction: AdminPrimaryAction;
  setPrimaryAction: (action: AdminPrimaryAction) => void;
};

const AdminActionContext = createContext<AdminActionContextValue | null>(null);

export function AdminActionProvider({ children }: { children: ReactNode }) {
  const [primaryAction, setPrimaryActionState] = useState<AdminPrimaryAction>(null);
  const setPrimaryAction = useCallback((action: AdminPrimaryAction) => {
    setPrimaryActionState(action);
  }, []);

  const value = useMemo(
    () => ({ primaryAction, setPrimaryAction }),
    [primaryAction, setPrimaryAction]
  );

  return <AdminActionContext.Provider value={value}>{children}</AdminActionContext.Provider>;
}

export function useAdminActionContext() {
  const ctx = useContext(AdminActionContext);
  if (!ctx) {
    throw new Error("useAdminActionContext must be used within AdminActionProvider");
  }
  return ctx;
}

/** Register a header primary action while this component is mounted. */
export function useRegisterAdminAction(action: AdminPrimaryAction) {
  const { setPrimaryAction } = useAdminActionContext();
  const onClickRef = useRef(action?.onClick);

  onClickRef.current = action?.onClick;

  const label = action?.label ?? "";
  const isActive = action != null;

  useEffect(() => {
    if (!isActive) {
      setPrimaryAction(null);
      return () => setPrimaryAction(null);
    }

    setPrimaryAction({
      label,
      onClick: () => onClickRef.current?.(),
    });
    return () => setPrimaryAction(null);
  }, [label, isActive, setPrimaryAction]);
}
