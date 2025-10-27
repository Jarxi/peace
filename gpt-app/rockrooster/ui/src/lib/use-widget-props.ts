import { useMemo } from 'react'
import { useOpenAiGlobal } from './use-openai-global'

export function useWidgetProps<T extends Record<string, unknown>>(
  fallback?: T,
): T {
  const toolOutput = useOpenAiGlobal('toolOutput') as T | null
  return useMemo(() => toolOutput ?? fallback ?? ({} as T), [toolOutput, fallback])
}
