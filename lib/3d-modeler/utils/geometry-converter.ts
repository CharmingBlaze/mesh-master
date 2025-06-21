"use client"

/**
 * Utility functions for converting between different geometry formats.
 * This module handles the conversion of ModelerObject to Three.js BufferGeometry
 * with proper validation and error handling.
 */

import { BufferGeometry, Float32BufferAttribute } from "three"
import type { ModelerObject } from "../core/types"

/**
 * Converts a ModelerObject to a Three.js BufferGeometry.
 * Handles triangulation of faces and proper attribute setup.
 * 
 * @param object - The ModelerObject to convert
 * @returns A Three.js BufferGeometry instance
 * 
 * @example
 * ```typescript
 * const geometry = convertToBufferGeometry(modelerObject);
 * const mesh = new THREE.Mesh(geometry, material);
 * ```
 */
export function convertToBufferGeometry(object: ModelerObject): BufferGeometry {
  console.log("Converting object to BufferGeometry:", object.name, {
    vertices: object.vertices.length,
    faces: object.faces.length,
  })

  const geometry = new BufferGeometry()

  // Validate input
  if (!object.vertices || object.vertices.length === 0) {
    console.warn("No vertices found, creating empty geometry")
    return geometry
  }

  if (!object.faces || object.faces.length === 0) {
    console.warn("No faces found, creating point cloud")
    // Create a simple point cloud if no faces
    const positions = object.vertices.flatMap((v) => [v.position.x, v.position.y, v.position.z])
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
    return geometry
  }

  // Prepare arrays for geometry data
  const vertices: number[] = []  // Vertex positions
  const normals: number[] = []   // Vertex normals
  const colors: number[] = []    // Vertex colors

  // Parse the color to RGB values
  const color = object.color || "#4a90e2"
  let r = 0.3,
    g = 0.6,
    b = 0.9 // Default blue

  try {
    if (color && color.startsWith("#") && color.length === 7) {
      r = Number.parseInt(color.slice(1, 3), 16) / 255
      g = Number.parseInt(color.slice(3, 5), 16) / 255
      b = Number.parseInt(color.slice(5, 7), 16) / 255
    }
  } catch (e) {
    console.warn("Invalid color format, using default:", color)
  }

  // Create vertex lookup map for efficient access
  const vertexMap = new Map()
  object.vertices.forEach((vertex) => {
    if (vertex && vertex.id !== undefined && vertex.position) {
      if (typeof vertex.position.x === 'number' && 
          typeof vertex.position.y === 'number' && 
          typeof vertex.position.z === 'number') {
        vertexMap.set(vertex.id, vertex)
      } else {
        console.warn(`Vertex ${vertex.id} has invalid position data`)
      }
    }
  })

  // Process each face and triangulate if necessary
  let triangleCount = 0
  object.faces.forEach((face, faceIndex) => {
    // Validate face data
    if (!face || !Array.isArray(face.vertexIds) || face.vertexIds.length < 3) {
      console.warn(`Face ${faceIndex} is invalid or has insufficient vertices`)
      return
    }

    // Triangulate faces with more than 3 vertices
    if (face.vertexIds.length >= 3) {
      // Use fan triangulation for convex polygons
      for (let i = 1; i < face.vertexIds.length - 1; i++) {
        const v0 = vertexMap.get(face.vertexIds[0])
        const v1 = vertexMap.get(face.vertexIds[i])
        const v2 = vertexMap.get(face.vertexIds[i + 1])

        if (v0 && v1 && v2) {
          // Add vertex positions
          vertices.push(
            v0.position.x, v0.position.y, v0.position.z,
            v1.position.x, v1.position.y, v1.position.z,
            v2.position.x, v2.position.y, v2.position.z,
          )

          // Add face normal (same for all vertices in the face)
          const normal = face.normal || { x: 0, y: 1, z: 0 }
          if (typeof normal.x === 'number' && 
              typeof normal.y === 'number' && 
              typeof normal.z === 'number') {
            for (let j = 0; j < 3; j++) {
              normals.push(normal.x, normal.y, normal.z)
            }
          } else {
            // Default normal if invalid
            for (let j = 0; j < 3; j++) {
              normals.push(0, 1, 0)
            }
          }

          // Add vertex colors
          for (let j = 0; j < 3; j++) {
            colors.push(r, g, b)
          }

          triangleCount++
        } else {
          console.warn(`Face ${faceIndex}: Missing vertex data for triangle ${i}`)
        }
      }
    }
  })

  console.log(`Generated ${triangleCount} triangles from ${object.faces.length} faces`)

  // Set geometry attributes if we have valid data
  if (vertices.length > 0) {
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3))
    geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3))
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3))

    // Compute bounding volumes for efficient rendering
    geometry.computeBoundingSphere()
    geometry.computeBoundingBox()
  } else {
    console.error("No valid triangles generated")
  }

  return geometry
}
