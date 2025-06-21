import { EditableMesh } from '../EditableMesh';
import { ID, Vector3, Edge } from '../types';

/**
 * Options for chamfer operations
 */
export interface ChamferOptions {
  width: number;
  segments?: number;
  profile?: number; // 0 = linear, 1 = curved
  limitAngle?: number; // Angle in degrees to limit chamfer
}

/**
 * Result of a chamfer operation
 */
export interface ChamferResult {
  newVertexIds: ID[];
  newEdgeIds: ID[];
  newFaceIds: ID[];
}

/**
 * Creates a chamfer (beveled corner) on a vertex
 * @param mesh - The mesh to operate on
 * @param vertexId - The vertex to chamfer
 * @param options - Chamfer options
 * @returns IDs of new geometry elements
 */
export function chamferVertex(
  mesh: EditableMesh,
  vertexId: ID,
  options: ChamferOptions
): ChamferResult {
  const vertex = mesh['vertices'].get(vertexId);
  if (!vertex) {
    throw new Error(`Vertex ${vertexId} not found`);
  }

  const result: ChamferResult = {
    newVertexIds: [],
    newEdgeIds: [],
    newFaceIds: []
  };

  // Get connected edges
  const connectedEdges = Array.from(mesh['edges'].values())
    .filter(edge => edge.vertexIds.includes(vertexId));

  if (connectedEdges.length < 2) {
    throw new Error('Vertex must be connected to at least 2 edges');
  }

  const segments = options.segments || 1;
  const profile = options.profile || 0;

  // Calculate chamfer directions
  const directions = connectedEdges.map(edge => {
    const otherId = edge.vertexIds[0] === vertexId ? edge.vertexIds[1] : edge.vertexIds[0];
    const other = mesh['vertices'].get(otherId)!;
    const dir = {
      x: other.position.x - vertex.position.x,
      y: other.position.y - vertex.position.y,
      z: other.position.z - vertex.position.z
    };
    const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    return {
      x: dir.x / length,
      y: dir.y / length,
      z: dir.z / length
    };
  });

  // Create new vertices
  const newVertices: ID[] = [];
  for (let i = 0; i < connectedEdges.length; i++) {
    const dir = directions[i];
    const newPos = {
      x: vertex.position.x + dir.x * options.width,
      y: vertex.position.y + dir.y * options.width,
      z: vertex.position.z + dir.z * options.width
    };
    const newId = mesh.addVertex(newPos);
    newVertices.push(newId);
    result.newVertexIds.push(newId);
  }

  // Create new edges
  for (let i = 0; i < newVertices.length; i++) {
    const nextI = (i + 1) % newVertices.length;
    const edgeId = mesh.addEdge(newVertices[i], newVertices[nextI]);
    result.newEdgeIds.push(edgeId);
  }

  // Create new faces
  for (let i = 0; i < connectedEdges.length; i++) {
    const nextI = (i + 1) % connectedEdges.length;
    const faceId = mesh.addFace([
      vertexId,
      newVertices[i],
      newVertices[nextI]
    ]);
    result.newFaceIds.push(faceId);
  }

  // Update connected faces
  connectedEdges.forEach(edge => {
    edge.faceIds.forEach(faceId => {
      const face = mesh['faces'].get(faceId)!;
      const vertexIndex = face.vertexIds.indexOf(vertexId);
      if (vertexIndex !== -1) {
        // Replace vertex with new vertices
        face.vertexIds.splice(vertexIndex, 1, ...newVertices);
      }
    });
  });

  return result;
}

/**
 * Creates a chamfer on an edge
 * @param mesh - The mesh to operate on
 * @param edgeId - The edge to chamfer
 * @param options - Chamfer options
 * @returns IDs of new geometry elements
 */
export function chamferEdge(
  mesh: EditableMesh,
  edgeId: ID,
  options: ChamferOptions
): ChamferResult {
  const edge = mesh['edges'].get(edgeId);
  if (!edge) {
    throw new Error(`Edge ${edgeId} not found`);
  }

  const result: ChamferResult = {
    newVertexIds: [],
    newEdgeIds: [],
    newFaceIds: []
  };

  const segments = options.segments || 1;
  const profile = options.profile || 0;

  // Get edge vertices
  const v1 = mesh['vertices'].get(edge.vertexIds[0])!;
  const v2 = mesh['vertices'].get(edge.vertexIds[1])!;

  // Calculate edge direction
  const edgeDir = {
    x: v2.position.x - v1.position.x,
    y: v2.position.y - v1.position.y,
    z: v2.position.z - v1.position.z
  };
  const edgeLength = Math.sqrt(
    edgeDir.x * edgeDir.x +
    edgeDir.y * edgeDir.y +
    edgeDir.z * edgeDir.z
  );
  const normalizedDir = {
    x: edgeDir.x / edgeLength,
    y: edgeDir.y / edgeLength,
    z: edgeDir.z / edgeLength
  };

  // Calculate bevel direction
  const bevelDir = calculateBevelDirection(edge, mesh);

  // Create new vertices
  const newVertices: ID[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const offset = options.width * (profile === 0 ? 1 : Math.sin(t * Math.PI));
    
    // Create vertex on each side of the edge
    for (let side = 0; side < 2; side++) {
      const pos = {
        x: v1.position.x + normalizedDir.x * t * edgeLength + bevelDir.x * offset * (side === 0 ? 1 : -1),
        y: v1.position.y + normalizedDir.y * t * edgeLength + bevelDir.y * offset * (side === 0 ? 1 : -1),
        z: v1.position.z + normalizedDir.z * t * edgeLength + bevelDir.z * offset * (side === 0 ? 1 : -1)
      };
      const newId = mesh.addVertex(pos);
      newVertices.push(newId);
      result.newVertexIds.push(newId);
    }
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
    normal.x * normal.x +
    normal.y * normal.y +
    normal.z * normal.z
  );

  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length
  };
} 