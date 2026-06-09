import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface BreadcrumbCrumb {
  label: string;
  to?: string;
}

interface BreadcrumbContextValue {
  trail: BreadcrumbCrumb[] | null;
  setTrail: (trail: BreadcrumbCrumb[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [trail, setTrail] = useState<BreadcrumbCrumb[] | null>(null);
  const value = useMemo(() => ({ trail, setTrail }), [trail]);

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

function useBreadcrumbContext(): BreadcrumbContextValue {
  const context = useContext(BreadcrumbContext);
  if (!context) throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  return context;
}

export function useBreadcrumbTrail(): BreadcrumbCrumb[] | null {
  return useBreadcrumbContext().trail;
}

/** Lets a page publish its breadcrumb trail (e.g. Courses > CSC 401 > Compiler Forum) to the layout. */
export function useSetBreadcrumbs(trail: BreadcrumbCrumb[] | null): void {
  const { setTrail } = useBreadcrumbContext();
  const key = trail ? JSON.stringify(trail) : null;

  useEffect(() => {
    setTrail(trail);
    return () => setTrail(null);
    // Re-publish only when the serialized trail content actually changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
