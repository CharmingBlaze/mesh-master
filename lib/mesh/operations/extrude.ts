import { EditableMesh } from '../EditableMesh';
import { ID, Vector3 } from '../types';

/**
 * Options for face extrusion
 */
export interface ExtrudeOptions {
  distance: number;
  direction?: Vector3;
  createCap?: boolean;
}

/**
 * Result of face extrusion
 */
export interface ExtrudeResult {
  newFaceIds: ID[];
  newEdgeIds: ID[];
  newVertexIds: ID[];
}

/**
 * Extrudes a face along its normal or specified direction
 */
export function extrudeFace(
  mesh: EditableMesh,
  faceId: ID,
  options: ExtrudeOptions
): ExtrudeResult {
  const face = mesh['faces'].get(faceId);
  if (!face) {
    throw new Error(`Face ${faceId} not found`);
  }

  const result: ExtrudeResult = {
    newFaceIds: [],
    newEdgeIds: [],
    newVertexIds: []
  };

  // Get face vertices
  const vertices = face.vertexIds.map(id => mesh['vertices'].get(id)!);
  
  // Calculate face normal if direction not provided
  const direction = options.direction || calculateFaceNormal(vertices);
  
  // Create new vertices
  const newVertices = vertices.map(vertex => {
    const newPos = {
      x: vertex.position.x + direction.x * options.distance,
      y: vertex.position.y + direction.y * options.distance,
      z: vertex.position.z + direction.z * options.distance
    };
    const newId = mesh.addVertex(newPos);
    result.newVertexIds.push(newId);
    return newId;
  });

  // Create new edges connecting old and new vertices
  const sideEdges: ID[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const edgeId = mesh.addEdge(face.vertexIds[i], newVertices[i]);
    sideEdges.push(edgeId);
    result.newEdgeIds.push(edgeId);
  }

  // Create new faces
  for (let i = 0; i < vertices.length; i++) {
    const nextI = (i + 1) % vertices.length;
    const faceId = mesh.addFace([
      face.vertexIds[i],
      face.vertexIds[nextI],
      newVertices[nextI],
      newVertices[i]
    ]);
    result.newFaceIds.push(faceId);
  }

  // Create cap face if requested
  if (options.createCap) {
    const capFaceId = mesh.addFace(newVertices);
    result.newFaceIds.push(capFaceId);
  }

  return result;
}

/**
 * Calculates the normal vector of a face
 */
function calculateFaceNormal(vertices: { position: Vector3 }[]): Vector3 {
  if (vertices.length < 3) {
    throw new Error('Need at least 3 vertices to calculate normal');
  }

  // Get two edges of the face
  const v1 = vertices[0].position;
  const v2 = vertices[1].position;
  const v3 = vertices[2].position;

  // Calculate two edge vectors
  const edge1 = {
    x: v2.x - v1.x,
    y: v2.y - v1.y,
    z: v2.z - v1.z
  };

  const edge2 = {
    x: v3.x - v1.x,
    y: v3.y - v1.y,
    z: v3.z - v1.z
  };

  // Calculate cross product
  const normal = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x
  };

  // Normalize
  const length = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
  );

  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length
  };
} 