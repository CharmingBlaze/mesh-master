import type { ModelerObject, ObjectType, Material } from "./types"
import { createBoxGeometry, createSphereGeometry, createCylinderGeometry, createPlaneGeometry } from "./geometry-utils"

// Generate a UUID (simple version for browser compatibility)
function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)
}

export interface PrimitiveOptions {
  // Box/Plane options
  width?: number
  height?: number
  depth?: number
  widthSegments?: number
  heightSegments?: number
  depthSegments?: number

  // Sphere options
  radius?: number

  // Cylinder options
  radiusTop?: number
  radiusBottom?: number
  radialSegments?: number

  // General options
  color?: string
  name?: string
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  scale?: { x: number; y: number; z: number }
}

export class PrimitiveCreator {
  static createPrimitive(type: ObjectType, options: PrimitiveOptions = {}): ModelerObject {
    const id = generateId()
    const name = options.name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${id.slice(0, 4)}`

    console.log(`Creating ${type} primitive with options:`, options)

    let geometry
    try {
      switch (type) {
        case "box":
          geometry = createBoxGeometry(
            options.width || 1,
            options.height || 1,
            options.depth || 1,
            options.widthSegments || 1,
            options.heightSegments || 1,
            options.depthSegments || 1,
          )
          break
        case "sphere":
          geometry = createSphereGeometry(
            options.radius || 0.5,
            options.widthSegments || 16,
            options.heightSegments || 12,
          )
          break
        case "cylinder":
          geometry = createCylinderGeometry(
            options.radiusTop || 0.5,
            options.radiusBottom || 0.5,
            options.height || 1,
            options.radialSegments || 16,
            options.heightSegments || 1,
          )
          break
        case "plane":
          geometry = createPlaneGeometry(
            options.width || 1,
            options.height || 1,
            options.widthSegments || 1,
            options.heightSegments || 1,
          )
          break
        case "cone":
          geometry = createCylinderGeometry(
            0,
            options.radiusBottom || 0.5,
            options.height || 1,
            options.radialSegments || 16,
            options.heightSegments || 1,
          )
          break
        default:
          console.warn(`Unknown primitive type: ${type}, defaulting to box`)
          geometry = createBoxGeometry()
      }

      console.log(`Generated geometry for ${type}:`, {
        vertices: geometry.vertices.length,
        edges: geometry.edges.length,
        faces: geometry.faces.length,
      })
    } catch (error) {
      console.error(`Error creating ${type} geometry:`, error)
      // Fallback to simple box
      geometry = createBoxGeometry()
    }

    const defaultMaterial: Material = {
      id: generateId(),
      name: "Default Material",
      color: options.color || "#4a90e2",
      metalness: 0.1,
      roughness: 0.8,
      opacity: 1.0,
      transparent: false,
      emissive: "#000000",
    }

    const object: ModelerObject = {
      id,
      name,
      type,
      position: options.position || { x: 0, y: 0, z: 0 },
      rotation: options.rotation || { x: 0, y: 0, z: 0 },
      scale: options.scale || { x: 1, y: 1, z: 1 },
      color: options.color || "#4a90e2",
      wireframe: false,
      visible: true,
      vertices: geometry.vertices,
      edges: geometry.edges,
      faces: geometry.faces,
      materials: [defaultMaterial],
    }

    console.log(`Created ${type} object:`, object)
    return object
  }

  static createBox(options: PrimitiveOptions = {}): ModelerObject {
    return this.createPrimitive("box", options)
  }

  static createSphere(options: PrimitiveOptions = {}): ModelerObject {
    return this.createPrimitive("sphere", options)
  }

  static createCylinder(options: PrimitiveOptions = {}): ModelerObject {
    return this.createPrimitive("cylinder", options)
  }

  static createPlane(options: PrimitiveOptions = {}): ModelerObject {
    return this.createPrimitive("plane", options)
  }

  static createCone(options: PrimitiveOptions = {}): ModelerObject {
    return this.createPrimitive("cone", options)
  }
}
