"use client"

import { useContext, createContext } from "react"
import type { ModelerState } from "../core/types"

export const ModelerContext = createContext<ModelerState | null>(null)

export function useModeler() {
  const context = useContext(ModelerContext)
  if (!context) {
    throw new Error("useModeler must be used within a ModelerProvider")
  }
  return context
}
