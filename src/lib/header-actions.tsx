"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface HeaderActions {
  onAddItem?: () => void;
  onParseUrl?: () => void;
  /** Кнопка «Добавить» неактивна (например, не выбрана своя подборка) */
  addItemDisabled?: boolean;
  /** Подсказка при наведении на неактивную кнопку добавления */
  addItemDisabledReason?: string;
}

interface HeaderActionsContextValue {
  actions: HeaderActions;
  setActions: (actions: HeaderActions) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextValue>({
  actions: {},
  setActions: () => {},
});

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<HeaderActions>({});

  const setActions = useCallback((a: HeaderActions) => {
    setActionsState(a);
  }, []);

  return (
    <HeaderActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function useHeaderActions() {
  return useContext(HeaderActionsContext);
}
