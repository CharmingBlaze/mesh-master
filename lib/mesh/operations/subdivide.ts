import { EditableMesh } from '../EditableMesh';
import { ID, Vector3 } from '../types';

/**
 * Options for edge subdivision
 */
export interface SubdivideOptions {
  segments: number;
  smooth?: boolean;
}

/**
 * Result of edge subdivision
 */
export interface SubdivideResult {
  newVertexIds: ID[];
  newEdgeIds: ID[];
}

/**
 * Subdivides an edge into multiple segments
 */
export function subdivideEdge(
  mesh: EditableMesh,
  edgeId: ID,
  options: SubdivideOptions
): SubdivideResult {
  const edge = mesh['edges'].get(edgeId);
  if (!edge) {
    throw new Error(`Edge ${edgeId} not found`);
  }

  const result: SubdivideResult = {
    newVertexIds: [],
    newEdgeIds: []
  };

  // Get edge vertices
  const v1 = mesh['vertices'].get(edge.vertexIds[0])!;
  const v2 = mesh['vertices'].get(edge.vertexIds[1])!;

  // Calculate segment vectors
  const segmentVector = {
    x: (v2.position.x - v1.position.x) / options.segments,
    y: (v2.position.y - v1.position.y) / options.segments,
    z: (v2.position.z - v1.position.z) / options.segments
  };

  // Create new vertices
  const newVertices: ID[] = [];
  for (let i = 1; i < options.segments; i++) {
    const position = {
      x: v1.position.x + segmentVector.x * i,
      y: v1.position.y + segmentVector.y * i,
      z: v1.position.z + segmentVector.z * i
    };

    // Apply smoothing if requested
    if (options.smooth) {
      const connectedFaces = edge.faceIds.map(id => mesh['faces'].get(id)!);
      const connectedVertices = new Set<ID>();
      
      connectedFaces.forEach(face => {
        face.vertexIds.forEach(id => {
          if (id !== edge.vertexIds[0] && id !== edge.vertexIds[1]) {
            connectedVertices.add(id);
          }
        });
      });

      // Average positions of connected vertices
      let avgX = 0, avgY = 0, avgZ = 0;
      connectedVertices.forEach(id => {
        const v = mesh['vertices'].get(id)!;
        avgX += v.position.x;
        avgY += v.position.y;
        avgZ += v.position.z;
      });

      const count = connectedVertices.size;
      if (count > 0) {
        position.x = (position.x + avgX / count) / 2;
        position.y = (position.y + avgY / count) / 2;
        position.z = (position.z + avgZ / count) / 2;
      }
    }

    const newId = mesh.addVertex(position);
    newVertices.push(newId);
    result.newVertexIds.push(newId);
  }

  // Create new edges
  let prevVertexId = edge.vertexIds[0];
  for (const vertexId of newVertices) {
    const newEdgeId = mesh.addEdge(prevVertexId, vertexId);
    result.newEdgeIds.push(newEdgeId);
    prevVertexId = vertexId;
  }
  
  // Add final edge
  const finalEdgeId = mesh.addEdge(prevVertexId, edge.vertexIds[1]);
  result.newEdgeIds.push(finalEdgeId);

  // Update connected faces
  edge.faceIds.forEach(faceId => {
    const face = mesh['faces'].get(faceId)!;
    const edgeIndex = face.edgeIds.indexOf(edgeId);
    if (edgeIndex !== -1) {
      // Remove old edge
      face.edgeIds.splice(edgeIndex, 1);
      // Add new edges
      face.edgeIds.splice(edgeIndex, 0, ...result.newEdgeIds);
      
      // Update vertex order
      const v1Index = face.vertexIds.indexOf(edge.vertexIds[0]);
      const v2Index = face.vertexIds.indexOf(edge.vertexIds[1]);
      
      if (v1Index !== -1 && v2Index !== -1) {
        face.vertexIds.splice(v2Index, 0, ...newVertices);
      }
    }
  });

  // Remove old edge
  mesh['edges'].delete(edgeId);

  return result;
}

/**
 * Subdivides all edges in a face
 */
export function subdivideFace(
  mesh: EditableMesh,
  faceId: ID,
  options: SubdivideOptions
): SubdivideResult {
  const face = mesh['faces'].get(faceId);
  if (!face) {
    throw new Error(`Face ${faceId} not found`);
  }

  const result: SubdivideResult = {
    newVertexIds: [],
    newEdgeIds: []
  };

  // Subdivide each edge
  face.edgeIds.forEach(edgeId => {
    const subResult = subdivideEdge(mesh, edgeId, options);
    result.newVertexIds.push(...subResult.newVertexIds);
    result.newEdgeIds.push(...subResult.newEdgeIds);
  });

  return result;
} 