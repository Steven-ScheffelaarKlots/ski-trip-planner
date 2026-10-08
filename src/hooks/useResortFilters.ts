import { useCallback, useMemo, useState } from 'react';
import { activeFilterCount } from '@/lib/filters/apply';
import type { FilterDefinition, FilterState, FilterValue } from '@/lib/filters/types';

export function useResortFilters(defs: FilterDefinition[]) {
  const [state, setState] = useState<FilterState>({});

  const setValue = useCallback((id: string, value: FilterValue | undefined) => {
    setState((s) => ({ ...s, [id]: value }));
  }, []);

  const clear = useCallback(() => setState({}), []);

  const activeCount = useMemo(() => activeFilterCount(defs, state), [defs, state]);

  return { state, setValue, clear, activeCount };
}
