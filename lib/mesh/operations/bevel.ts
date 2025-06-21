import { EditableMesh } from '../EditableMesh';
import { ID, Vector3, Edge } from '../types';

/**
 * Options for bevel operations
 */
export interface BevelOptions {
  width: number;
  segments?: number;
  profile?: number; // 0 = linear, 1 = curved
  limitAngle?: number; // Angle in degrees to limit bevel
}

/**
 * Result of bevel operation
 */
export interface BevelResult {
  newFaceIds: ID[];
  newEdgeIds: ID[];
  newVertexIds: ID[];
}

/**
 * Bevels an edge by creating new faces and vertices
 */
export function bevelEdge(
  mesh: EditableMesh,
  edgeId: ID,
  options: BevelOptions
): BevelResult {
  const edge = mesh['edges'].get(edgeId);
  if (!edge) {
    throw new Error(`Edge ${edgeId} not found`);
  }

  const result: BevelResult = {
    newFaceIds: [],
    newEdgeIds: [],
    newVertexIds: []
  };

  // Get edge vertices
  const v1 = mesh['vertices'].get(edge.vertexIds[0])!;
  const v2 = mesh['vertices'].get(edge.vertexIds[1])!;

  // Calculate edge vector and length
  const edgeVector = {
    x: v2.position.x - v1.position.x,
    y: v2.position.y - v1.position.y,
    z: v2.position.z - v1.position.z
  };

  // Calculate bevel direction (perpendicular to edge)
  const bevelDir = calculateBevelDirection(edge, mesh);

  // Create new vertices
  const segments = options.segments || 1;
  const newVertices: ID[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const width = options.width * (1 - Math.pow(2 * t - 1, 2) * (options.profile ?? 0));

    // Create vertices for both sides of the edge
    const pos1 = {
      x: v1.position.x + edgeVector.x * t + bevelDir.x * width,
      y: v1.position.y + edgeVector.y * t + bevelDir.y * width,
      z: v1.position.z + edgeVector.z * t + bevelDir.z * width
    };

    const pos2 = {
      x: v1.position.x + edgeVector.x * t - bevelDir.x * width,
      y: v1.position.y + edgeVector.y * t - bevelDir.y * width,
      z: v1.position.z + edgeVector.z * t - bevelDir.z * width
    };

    const id1 = mesh.addVertex(pos1);
    const id2 = mesh.addVertex(pos2);
    newVertices.push(id1, id2);
    result.newVertexIds.push(id1, id2);
  }

  // Create new edges and faces
  for (let i = 0; i < segments; i++) {
    const baseIndex = i * 2;
    const nextIndex = (i + 1) * 2;

    // Create edges
    const edge1 = mesh.addEdge(newVertices[baseIndex], newVertices[nextIndex]);
    const edge2 = mesh.addEdge(newVertices[baseIndex + 1], newVertices[nextIndex + 1]);
    const edge3 = mesh.addEdge(newVertices[baseIndex], newVertices[baseIndex + 1]);
    const edge4 = mesh.addEdge(newVertices[nextIndex], newVertices[nextIndex + 1]);

    result.newEdgeIds.push(edge1, edge2, edge3, edge4);

    // Create faces
    const face1 = mesh.addFace([
      newVertices[baseIndex],
      newVertices[nextIndex],
      newVertices[nextIndex + 1],
      newVertices[baseIndex + 1]
    ]);

    result.newFaceIds.push(face1);
  }

  // Update connected faces
  edge.faceIds.forEach(faceId => {
    const face = mesh['faces'].get(faceId)!;
    const edgeIndex = face.edgeIds.indexOf(edgeId);
    if (edgeIndex !== -1) {
      // Remove old edge
      face.edgeIds.splice(edgeIndex, 1);
      // Add new edges
      face.edgeIds.splice(edgeIndex, 0, ...result.newEdgeIds);
    }
  });

  // Remove old edge
  mesh['edges'].delete(edgeId);

  return result;
}

/**
 * Bevels a vertex by creating new faces and vertices
 */
export function bevelVertex(
  mesh: EditableMesh,
  vertexId: ID,
  options: BevelOptions
): BevelResult {
  const vertex = mesh['vertices'].get(vertexId);
  if (!vertex) {
    throw new Error(`Vertex ${vertexId} not found`);
  }

  const result: BevelResult = {
    newFaceIds: [],
    newEdgeIds: [],
    newVertexIds: []
  };

  // Find all connected edges
  const connectedEdges = Array.from(mesh['edges'].values())
    .filter(edge => edge.vertexIds.includes(vertexId));

  // Calculate average direction of connected edges
  const avgDir = calculateAverageDirection(connectedEdges, vertexId, mesh);

  // Create new vertices
  const segments = options.segments || 1;
  const newVertices: ID[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const width = options.width * (1 - Math.pow(2 * t - 1, 2) * (options.profile ?? 0));

    const pos = {
      x: vertex.position.x + avgDir.x * width,
      y: vertex.position.y + avgDir.y * width,
      z: vertex.position.z + avgDir.z * width
    };

    const id = mesh.addVertex(pos);
    newVertices.push(id);
    result.newVertexIds.push(id);
  }

  // Create new edges and faces
  for (let i = 0; i < segments; i++) {
    const edge = mesh.addEdge(newVertices[i], newVertices[i + 1]);
    result.newEdgeIds.push(edge);
  }

  // Update connected edges
  connectedEdges.forEach(edge => {
    if (edge.vertexIds[0] === vertexId) {
      edge.vertexIds[0] = newVertices[0];
    } else {
      edge.vertexIds[1] = newVertices[0];
    }
  });

  return result;
}

/**
 * Calculates the bevel direction for an edge
 */
function calculateBevelDirection(edge: { vertexIds: [ID, ID], faceIds: ID[] }, mesh: EditableMesh): Vector3 {
  const v1 = mesh['vertices'].get(edge.vertexIds[0])!;
  const v2 = mesh['vertices'].get(edge.vertexIds[1])!;

  // Get connected faces
  const faces = edge.faceIds.map(id => mesh['faces'].get(id)!);
  if (faces.length === 0) {
    throw new Error('Edge must be connected to at least one face');
  }

  // Calculate face normals
  const normals = faces.map(face => {
    const vertices = face.vertexIds.map(id => mesh['vertices'].get(id)!);
    return calculateFaceNormal(vertices);
  });

  // Average the normals
  const avgNormal = {
    x: normals.reduce((sum, n) => sum + n.x, 0) / normals.length,
    y: normals.reduce((sum, n) => sum + n.y, 0) / normals.length,
    z: normals.reduce((sum, n) => sum + n.z, 0) / normals.length
  };

  // Calculate edge vector
  const edgeVector = {
    x: v2.position.x - v1.position.x,
    y: v2.position.y - v1.position.y,
    z: v2.position.z - v1.position.z
  };

  // Cross product of edge vector and average normal
  const bevelDir = {
    x: edgeVector.y * avgNormal.z - edgeVector.z * avgNormal.y,
    y: edgeVector.z * avgNormal.x - edgeVector.x * avgNormal.z,
    z: edgeVector.x * avgNormal.y - edgeVector.y * avgNormal.x
  };

  // Normalize
  const length = Math.sqrt(
    bevelDir.x * bevelDir.x +
    bevelDir.y * bevelDir.y +
    bevelDir.z * bevelDir.z
  );

  return {
    x: bevelDir.x / length,
    y: bevelDir.y / length,
    z: bevelDir.z / length
  };
}

/**
 * Calculates the average direction of connected edges
 */
function calculateAverageDirection(
  edges: { vertexIds: [ID, ID] }[],
  vertexId: ID,
  mesh: EditableMesh
): Vector3 {
  const vertex = mesh['vertices'].get(vertexId)!;
  const directions = edges.map(edge => {
    const otherId = edge.vertexIds[0] === vertexId ? edge.vertexIds[1] : edge.vertexIds[0];
    const other = mesh['vertices'].get(otherId)!;
    return {
      x: other.position.x - vertex.position.x,
      y: other.position.y - vertex.position.y,
      z: other.position.z - vertex.position.z
    };
  });

  const avgDir = {
    x: directions.reduce((sum, d) => sum + d.x, 0) / directions.length,
    y: directions.reduce((sum, d) => sum + d.y, 0) / directions.length,
    z: directions.reduce((sum, d) => sum + d.z, 0) / directions.length
  };

  // Normalize
  const length = Math.sqrt(
    avgDir.x * avgDir.x +
    avgDir.y * avgDir.y +
    avgDir.z * avgDir.z
  );

  return {
    x: avgDir.x / length,
    y: avgDir.y / length,
    z: avgDir.z / length
  };
}

/**
 * Calculates the normal vector of a face
 */
function calculateFaceNormal(vertices: { position: Vector3 }[]): Vector3 {
  if (vertices.length < 3) {
    throw new Error('Need at least 3 vertices to calculate normal');
  }

  const v1 = vertices[0].position;
  const v2 = vertices[1].position;
  const v3 = vertices[2].position;

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

  const normal = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x
  };

  const length = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
  );

  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length
  };
} 