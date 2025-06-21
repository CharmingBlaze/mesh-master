import { EditableMesh } from '../EditableMesh';
import { ID, Vector3 } from '../types';

/**
 * Options for vertex merging
 */
export interface MergeOptions {
  threshold?: number;
  position?: Vector3;
}

/**
 * Result of vertex merging
 */
export interface MergeResult {
  mergedVertexId: ID;
  removedVertexIds: ID[];
  updatedEdgeIds: ID[];
  updatedFaceIds: ID[];
}

/**
 * Merges vertices that are within a threshold distance of each other
 */
export function mergeVertices(
  mesh: EditableMesh,
  vertexIds: ID[],
  options: MergeOptions = {}
): MergeResult {
  if (vertexIds.length < 2) {
    throw new Error('Need at least 2 vertices to merge');
  }

  const result: MergeResult = {
    mergedVertexId: vertexIds[0],
    removedVertexIds: [],
    updatedEdgeIds: [],
    updatedFaceIds: []
  };

  // Calculate average position if not provided
  const position = options.position || calculateAveragePosition(
    vertexIds.map(id => mesh['vertices'].get(id)!)
  );

  // Update first vertex position
  const firstVertex = mesh['vertices'].get(vertexIds[0])!;
  firstVertex.position = position;

  // Process remaining vertices
  for (let i = 1; i < vertexIds.length; i++) {
    const vertexId = vertexIds[i];
    const vertex = mesh['vertices'].get(vertexId)!;

    // Find all edges connected to this vertex
    const connectedEdges = Array.from(mesh['edges'].values())
      .filter(edge => edge.vertexIds.includes(vertexId));

    // Update edges to point to the first vertex
    connectedEdges.forEach(edge => {
      if (edge.vertexIds[0] === vertexId) {
        edge.vertexIds[0] = vertexIds[0];
      } else {
        edge.vertexIds[1] = vertexIds[0];
      }
      result.updatedEdgeIds.push(edge.id);
    });

    // Update faces
    const connectedFaces = new Set<ID>();
    connectedEdges.forEach(edge => {
      edge.faceIds.forEach(faceId => connectedFaces.add(faceId));
    });

    connectedFaces.forEach(faceId => {
      const face = mesh['faces'].get(faceId)!;
      const vertexIndex = face.vertexIds.indexOf(vertexId);
      if (vertexIndex !== -1) {
        face.vertexIds[vertexIndex] = vertexIds[0];
        result.updatedFaceIds.push(faceId);
      }
    });

    // Remove the vertex
    mesh['vertices'].delete(vertexId);
    result.removedVertexIds.push(vertexId);
  }

  // Remove duplicate edges
  const edgeMap = new Map<string, ID>();
  result.updatedEdgeIds.forEach(edgeId => {
    const edge = mesh['edges'].get(edgeId)!;
    const key = `${edge.vertexIds[0]},${edge.vertexIds[1]}`;
    if (edgeMap.has(key)) {
      // Merge face references
      const existingEdge = mesh['edges'].get(edgeMap.get(key)!)!;
      edge.faceIds.forEach(faceId => {
        if (!existingEdge.faceIds.includes(faceId)) {
          existingEdge.faceIds.push(faceId);
        }
      });
      mesh['edges'].delete(edgeId);
    } else {
      edgeMap.set(key, edgeId);
    }
  });

  return result;
}

/**
 * Calculates the average position of a set of vertices
 */
function calculateAveragePosition(vertices: { position: Vector3 }[]): Vector3 {
  const sum = vertices.reduce(
    (acc, v) => ({
      x: acc.x + v.position.x,
      y: acc.y + v.position.y,
      z: acc.z + v.position.z
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length,
    z: sum.z / vertices.length
  };
}

/**
 * Finds vertices within a threshold distance of a point
 */
export function findVerticesNearPoint(
  mesh: EditableMesh,
  point: Vector3,
  threshold: number
): ID[] {
  const result: ID[] = [];

  mesh['vertices'].forEach((vertex, id) => {
    const distance = Math.sqrt(
      Math.pow(vertex.position.x - point.x, 2) +
      Math.pow(vertex.position.y - point.y, 2) +
      Math.pow(vertex.position.z - point.z, 2)
    );

    if (distance <= threshold) {
      result.push(id);
    }
  });

  return result;
} 