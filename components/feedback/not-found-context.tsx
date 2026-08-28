"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NotFoundContextValue = {
  isNotFound: boolean;
  setIsNotFound: (value: boolean) => void;
};

const NotFoundContext = createContext<NotFoundContextValue | null>(null);

export function NotFoundProvider({ children }: { children: ReactNode }) {
  const [isNotFound, setIsNotFound] = useState(false);
  const value = useMemo(
    () => ({ isNotFound, setIsNotFound }),
    [isNotFound],
  );

  return (
    <NotFoundContext.Provider value={value}>{children}</NotFoundContext.Provider>
  );
}

export function useIsNotFoundPage() {
  return useContext(NotFoundContext)?.isNotFound ?? false;
}

export function NotFoundMarker() {
  const context = useContext(NotFoundContext);

  useEffect(() => {
    if (!context) return;
    context.setIsNotFound(true);
    return () => context.setIsNotFound(false);
  }, [context]);

  return null;
}
