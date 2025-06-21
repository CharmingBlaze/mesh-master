"use client"

import { useState } from "react"
import type { ObjectType } from "../core/types"
import type { PrimitiveOptions } from "../core/primitive-creator"

interface PrimitiveCreatorProps {
  onCreatePrimitive: (type: ObjectType, options: PrimitiveOptions) => void
  className?: string
}

export function PrimitiveCreator({ onCreatePrimitive, className }: PrimitiveCreatorProps) {
  const [primitiveType, setPrimitiveType] = useState<ObjectType>("box")
  const [options, setOptions] = useState<PrimitiveOptions>({})

  const handleCreate = () => {
    onCreatePrimitive(primitiveType, options)
  }

  const updateOption = (key: keyof PrimitiveOptions, value: any) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <label htmlFor="primitive-type" className="block text-sm font-medium mb-1">
            Primitive Type
          </label>
          <select
            id="primitive-type"
            value={primitiveType}
            onChange={(e) => setPrimitiveType(e.target.value as ObjectType)}
            className="w-full p-2 border rounded"
          >
            <option value="box">Box</option>
            <option value="sphere">Sphere</option>
            <option value="cylinder">Cylinder</option>
            <option value="plane">Plane</option>
            <option value="cone">Cone</option>
          </select>
        </div>

        {/* Primitive-specific options */}
        {(primitiveType === "box" || primitiveType === "plane") && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="width" className="block text-sm font-medium mb-1">
                Width
              </label>
              <input
                id="width"
                type="number"
                step="0.1"
                min="0.1"
                value={options.width || 1}
                onChange={(e) => updateOption("width", Number.parseFloat(e.target.value) || 1)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-1">
                Height
              </label>
              <input
                id="height"
                type="number"
                step="0.1"
                min="0.1"
                value={options.height || 1}
                onChange={(e) => updateOption("height", Number.parseFloat(e.target.value) || 1)}
                className="w-full p-2 border rounded"
              />
            </div>
            {primitiveType === "box" && (
              <div>
                <label htmlFor="depth" className="block text-sm font-medium mb-1">
                  Depth
                </label>
                <input
                  id="depth"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={options.depth || 1}
                  onChange={(e) => updateOption("depth", Number.parseFloat(e.target.value) || 1)}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
          </div>
        )}

        {primitiveType === "sphere" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="radius" className="block text-sm font-medium mb-1">
                Radius
              </label>
              <input
                id="radius"
                type="number"
                step="0.1"
                min="0.1"
                value={options.radius || 0.5}
                onChange={(e) => updateOption("radius", Number.parseFloat(e.target.value) || 0.5)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="widthSegments" className="block text-sm font-medium mb-1">
                Width Segments
              </label>
              <input
                id="widthSegments"
                type="number"
                min="3"
                value={options.widthSegments || 32}
                onChange={(e) => updateOption("widthSegments", Number.parseInt(e.target.value) || 32)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}

        {(primitiveType === "cylinder" || primitiveType === "cone") && (
          <div className="grid grid-cols-2 gap-4">
            {primitiveType === "cylinder" && (
              <div>
                <label htmlFor="radiusTop" className="block text-sm font-medium mb-1">
                  Radius Top
                </label>
                <input
                  id="radiusTop"
                  type="number"
                  step="0.1"
                  min="0"
                  value={options.radiusTop || 0.5}
                  onChange={(e) => updateOption("radiusTop", Number.parseFloat(e.target.value) || 0.5)}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
            <div>
              <label htmlFor="radiusBottom" className="block text-sm font-medium mb-1">
                Radius {primitiveType === "cone" ? "" : "Bottom"}
              </label>
              <input
                id="radiusBottom"
                type="number"
                step="0.1"
                min="0.1"
                value={options.radiusBottom || 0.5}
                onChange={(e) => updateOption("radiusBottom", Number.parseFloat(e.target.value) || 0.5)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-1">
                Height
              </label>
              <input
                id="height"
                type="number"
                step="0.1"
                min="0.1"
                value={options.height || 1}
                onChange={(e) => updateOption("height", Number.parseFloat(e.target.value) || 1)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
        >
          Create Primitive
        </button>
      </div>
    </div>
  )
}
