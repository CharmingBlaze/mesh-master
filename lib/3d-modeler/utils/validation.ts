import type { ModelerObject, Vertex, Edge, Face } from "../core/types"

export function validateGeometry(object: ModelerObject): boolean {
  try {
    // Basic checks
    if (!object.vertices || !object.edges || !object.faces) {
      return false
    }

    // Check if all vertex IDs are unique
    const vertexIds = new Set(object.vertices.map((v) => v.id))
    if (vertexIds.size !== object.vertices.length) {
      return false
    }

    // Check if all edge vertex references exist
    for (const edge of object.edges) {
      if (!edge.vertexIds.every((id) => vertexIds.has(id))) {
        return false
      }
    }

    // Check if all face vertex references exist
    for (const face of object.faces) {
      if (!face.vertexIds.every((id) => vertexIds.has(id))) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Geometry validation error:", error)
    return false
  }
}

export function validateVertex(vertex: Vertex): boolean {
  return (
    typeof vertex.id === "string" &&
    typeof vertex.position === "object" &&
    typeof vertex.position.x === "number" &&
    typeof vertex.position.y === "number" &&
    typeof vertex.position.z === "number" &&
    typeof vertex.selected === "boolean"
  )
}

export function validateEdge(edge: Edge, vertexIds: Set<string>): boolean {
  return (
    typeof edge.id === "string" &&
    Array.isArray(edge.vertexIds) &&
    edge.vertexIds.length === 2 &&
    edge.vertexIds.every((id) => vertexIds.has(id)) &&
    typeof edge.selected === "boolean"
  )
}

export function validateFace(face: Face, vertexIds: Set<string>): boolean {
  return (
    typeof face.id === "string" &&
    Array.isArray(face.vertexIds) &&
    face.vertexIds.length >= 3 &&
    face.vertexIds.every((id) => vertexIds.has(id)) &&
    typeof face.selected === "boolean"
  )
}
