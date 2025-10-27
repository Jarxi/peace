import { useSyncExternalStore } from 'react'

const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals'

type UnknownObject = Record<string, unknown>

export type Theme = 'light' | 'dark'

type OpenAiGlobals = {
  toolOutput: UnknownObject | null
  theme?: Theme
}

type SetGlobalsEvent = CustomEvent<{
  globals: Partial<OpenAiGlobals>
}>

declare global {
  interface Window {
    openai?: OpenAiGlobals
  }

  interface WindowEventMap {
    [SET_GLOBALS_EVENT_TYPE]: SetGlobalsEvent
  }
}

export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(
  key: K,
): OpenAiGlobals[K] | null {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') {
        return () => {}
      }

      const handler = (event: SetGlobalsEvent) => {
        if (event.detail.globals[key] !== undefined) {
          onChange()
        }
      }

      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handler, { passive: true })

      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handler)
      }
    },
    () => window.openai?.[key] ?? null,
    () => window.openai?.[key] ?? null,
  )
}
