import * as THREE from "three"
import { PrimitiveCreator } from "./primitive-creator"
import type { ModelerObject } from "./types"
import { v4 as uuidv4 } from "uuid"
import { generateEdgesFromFaces, calculateFaceNormal } from "./geometry-utils"

/**
 * Utility class for converting ModelerObject to Three.js and React Three Fiber compatible formats.
 * This class handles the conversion of mesh data with proper validation and error handling.
 */
export class FiberConverter {
  /**
   * Convert a Three.js BufferGeometry to a ModelerObject
   */
  static fromThreeGeometry(
    geometry: THREE.BufferGeometry,
    options: {
      name?: string
      type?: string
      color?: string
      position?: THREE.Vector3
      rotation?: THREE.Euler
      scale?: THREE.Vector3
    } = {},
  ): ModelerObject {
    const vertices = []
    const faces = []

    // Get position attribute
    const positionAttribute = geometry.getAttribute("position")
    const normalAttribute = geometry.getAttribute("normal")
    const uvAttribute = geometry.getAttribute("uv")
    const indexAttribute = geometry.getIndex()

    // Create vertices
    for (let i = 0; i < positionAttribute.count; i++) {
      vertices.push({
        id: uuidv4(),
        position: {
          x: positionAttribute.getX(i),
          y: positionAttribute.getY(i),
          z: positionAttribute.getZ(i),
        },
        selected: false,
        normal: normalAttribute
          ? {
              x: normalAttribute.getX(i),
              y: normalAttribute.getY(i),
              z: normalAttribute.getZ(i),
            }
          : undefined,
        uv: uvAttribute
          ? {
              x: uvAttribute.getX(i),
              y: uvAttribute.getY(i),
            }
          : undefined,
      })
    }

    // Create faces
    if (indexAttribute) {
      // Indexed geometry
      for (let i = 0; i < indexAttribute.count; i += 3) {
        const a = indexAttribute.getX(i)
        const b = indexAttribute.getX(i + 1)
        const c = indexAttribute.getX(i + 2)

        faces.push({
          id: uuidv4(),
          vertexIds: [vertices[a].id, vertices[b].id, vertices[c].id],
          selected: false,
        })
      }
    } else {
      // Non-indexed geometry
      for (let i = 0; i < positionAttribute.count; i += 3) {
        faces.push({
          id: uuidv4(),
          vertexIds: [vertices[i].id, vertices[i + 1].id, vertices[i + 2].id],
          selected: false,
        })
      }
    }

    // Calculate face normals
    faces.forEach((face) => {
      face.normal = calculateFaceNormal(vertices, face)
    })

    // Generate edges
    const edges = generateEdgesFromFaces(vertices, faces)

    // Create the modeler object
    const id = uuidv4()
    return {
      id,
      name: options.name || `Imported ${id.slice(0, 4)}`,
      type: options.type || "custom",
      position: options.position
        ? {
            x: options.position.x,
            y: options.position.y,
            z: options.position.z,
          }
        : { x: 0, y: 0, z: 0 },
      rotation: options.rotation
        ? {
            x: options.rotation.x,
            y: options.rotation.y,
            z: options.rotation.z,
          }
        : { x: 0, y: 0, z: 0 },
      scale: options.scale
        ? {
            x: options.scale.x,
            y: options.scale.y,
            z: options.scale.z,
          }
        : { x: 1, y: 1, z: 1 },
      color: options.color || "#4a90e2",
      wireframe: false,
      visible: true,
      vertices,
      edges,
      faces,
    }
  }

  /**
   * Converts a ModelerObject to a Three.js BufferGeometry.
   * Handles vertex data, normals, UVs, and face indices with proper validation.
   * 
   * @param object - The ModelerObject to convert
   * @returns A Three.js BufferGeometry instance
   * 
   * @example
   * ```typescript
   * const geometry = FiberConverter.toThreeGeometry(modelerObject);
   * const mesh = new THREE.Mesh(geometry, material);
   * ```
   */
  static toThreeGeometry(object: ModelerObject): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()

    // Prepare arrays for geometry data
    const positions: number[] = []  // Vertex positions
    const normals: number[] = []    // Vertex normals
    const uvs: number[] = []        // Texture coordinates
    const indices: number[] = []    // Face indices

    // Create vertex index mapping for efficient access
    const vertexMap = new Map()
    object.vertices.forEach((vertex, index) => {
      // Validate vertex data
      if (!vertex || !vertex.id || !vertex.position) {
        console.warn(`Skipping invalid vertex at index ${index}`)
        return
      }

      // Validate position data
      if (typeof vertex.position.x !== 'number' || 
          typeof vertex.position.y !== 'number' || 
          typeof vertex.position.z !== 'number') {
        console.warn(`Vertex ${vertex.id} has invalid position data`)
        return
      }

      // Store vertex index for face creation
      vertexMap.set(vertex.id, index)

      // Add vertex position
      positions.push(vertex.position.x, vertex.position.y, vertex.position.z)

      // Add vertex normal with validation
      if (vertex.normal && 
          typeof vertex.normal.x === 'number' && 
          typeof vertex.normal.y === 'number' && 
          typeof vertex.normal.z === 'number') {
        normals.push(vertex.normal.x, vertex.normal.y, vertex.normal.z)
      } else {
        normals.push(0, 1, 0) // Default normal (up)
      }

      // Add UV coordinates with validation
      if (vertex.uv && 
          typeof vertex.uv.x === 'number' && 
          typeof vertex.uv.y === 'number') {
        uvs.push(vertex.uv.x, vertex.uv.y)
      } else {
        uvs.push(0, 0) // Default UV (origin)
      }
    })

    // Create face indices with triangulation
    object.faces.forEach((face) => {
      // Validate face data
      if (!face || !Array.isArray(face.vertexIds) || face.vertexIds.length < 3) {
        console.warn('Skipping invalid face')
        return
      }

      // Triangulate face if it has more than 3 vertices
      if (face.vertexIds.length >= 3) {
        // Use fan triangulation for convex polygons
        for (let i = 1; i < face.vertexIds.length - 1; i++) {
          const idx0 = vertexMap.get(face.vertexIds[0])
          const idx1 = vertexMap.get(face.vertexIds[i])
          const idx2 = vertexMap.get(face.vertexIds[i + 1])

          if (idx0 !== undefined && idx1 !== undefined && idx2 !== undefined) {
            indices.push(idx0, idx1, idx2)
          } else {
            console.warn(`Skipping invalid triangle in face: missing vertex indices`)
          }
        }
      }
    })

    // Set geometry attributes if we have valid data
    if (positions.length > 0) {
      // Set required attributes
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3))

      // Set optional attributes if available
      if (uvs.length > 0) {
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
      }

      if (indices.length > 0) {
        geometry.setIndex(indices)
      }

      // Compute bounding volumes for efficient rendering
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
    } else {
      console.warn('No valid geometry data to create mesh')
    }

    return geometry
  }

  /**
   * Convert React Three Fiber primitive props to a ModelerObject
   */
  static fromFiberPrimitive(type: string, props: any = {}): ModelerObject {
    switch (type) {
      case "boxGeometry":
        return PrimitiveCreator.createBox({
          width: props.args?.[0] || 1,
          height: props.args?.[1] || 1,
          depth: props.args?.[2] || 1,
          widthSegments: props.args?.[3] || 1,
          heightSegments: props.args?.[4] || 1,
          depthSegments: props.args?.[5] || 1,
          color: props.color || "#4a90e2",
        })

      case "sphereGeometry":
        return PrimitiveCreator.createSphere({
          radius: props.args?.[0] || 1,
          widthSegments: props.args?.[1] || 32,
          heightSegments: props.args?.[2] || 16,
          color: props.color || "#4a90e2",
        })

      case "cylinderGeometry":
        return PrimitiveCreator.createCylinder({
          radiusTop: props.args?.[0] || 1,
          radiusBottom: props.args?.[1] || 1,
          height: props.args?.[2] || 1,
          radialSegments: props.args?.[3] || 32,
          heightSegments: props.args?.[4] || 1,
          color: props.color || "#4a90e2",
        })

      case "planeGeometry":
        return PrimitiveCreator.createPlane({
          width: props.args?.[0] || 1,
          height: props.args?.[1] || 1,
          widthSegments: props.args?.[2] || 1,
          heightSegments: props.args?.[3] || 1,
          color: props.color || "#4a90e2",
        })

      case "coneGeometry":
        return PrimitiveCreator.createPrimitive("cone", {
          radiusBottom: props.args?.[0] || 1,
          height: props.args?.[1] || 1,
          radialSegments: props.args?.[2] || 32,
          heightSegments: props.args?.[3] || 1,
          color: props.color || "#4a90e2",
        })

      default:
        throw new Error(`Unsupported primitive type: ${type}`)
    }
  }
}
