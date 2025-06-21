import { EditableMesh } from '../EditableMesh';
import { ID, Vector3, Edge } from '../types';

/**
 * Topology validation issues
 */
export interface TopologyIssue {
  type:
    | 'orphaned-vertex'
    | 'isolated-edge'
    | 'degenerate-face'
    | 'non-manifold-edge'
    | 'overlapping-face'
    | 'inconsistent-face-edge-link'
    | 'invalid-face-size'
    | 'non-planar-quad'
    | 'isolated-component';
  elementType: 'vertex' | 'edge' | 'face' | 'mesh';
  elementId?: ID;
  description: string;
}

const VERY_SMALL_AREA = 1e-9;

/**
 * Validates the mesh topology and returns any issues found.
 * This function performs a comprehensive check for various topological issues.
 */
export function validateTopology(mesh: EditableMesh): TopologyIssue[] {
  const issues: TopologyIssue[] = [];
  const vertices = Array.from(mesh.getVertices());
  const edges = Array.from(mesh.getEdges());
  const faces = Array.from(mesh.getFaces());

  if (vertices.length === 0) {
    return issues; // No issues in an empty mesh
  }

  const vertexToEdgeMap = new Map<ID, ID[]>();
  vertices.forEach((v) => vertexToEdgeMap.set(v.id, []));
  edges.forEach((edge) => {
    edge.vertexIds.forEach(vertexId => {
      vertexToEdgeMap.get(vertexId)?.push(edge.id);
    });
  });

  // 1. Check for orphaned vertices (vertices not connected to any edges)
  vertexToEdgeMap.forEach((edgeIds, vertexId) => {
    if (edgeIds.length === 0) {
      issues.push({
        type: 'orphaned-vertex',
        elementType: 'vertex',
        elementId: vertexId,
        description: `Vertex ${vertexId} is not connected to any edges.`,
      });
    }
  });

  const faceVertexKeys = new Set<string>();
  const edgeFaceCount = new Map<ID, number>();
  edges.forEach(edge => edgeFaceCount.set(edge.id, edge.faceIds.length));

  // 2. Comprehensive face-based checks
  faces.forEach((face) => {
    const { vertexIds, edgeIds } = face;
    const faceId = face.id;

    // 2a. Check for invalid face size (not a tri or quad)
    if (vertexIds.length < 3 || vertexIds.length > 4) {
      issues.push({
        type: 'invalid-face-size',
        elementType: 'face',
        elementId: faceId,
        description: `Face ${faceId} has an invalid number of vertices (${vertexIds.length}). Only triangles and quads are supported.`,
      });
      return; // Skip other checks for this invalid face
    }

    // 2b. Check for degenerate faces (collinear vertices, zero area)
    const faceVertices = vertexIds.map(id => mesh.getVertex(id)?.position).filter(Boolean) as Vector3[];
    if (faceVertices.length === vertexIds.length) {
      const area = getFaceArea(faceVertices);
      if (area < VERY_SMALL_AREA) {
        issues.push({
          type: 'degenerate-face',
          elementType: 'face',
          elementId: faceId,
          description: `Face ${faceId} is degenerate (has zero or near-zero area).`,
        });
      }
    }

    // 2c. Check for overlapping faces (faces with the same vertices)
    const sortedVertexIds = [...vertexIds].sort().join(',');
    if (faceVertexKeys.has(sortedVertexIds)) {
      issues.push({
        type: 'overlapping-face',
        elementType: 'face',
        elementId: faceId,
        description: `Face ${faceId} is overlapping with another face (shares the same vertices).`,
      });
    } else {
      faceVertexKeys.add(sortedVertexIds);
    }

    // 2d. Check for non-planar quads
    if (faceVertices.length === 4) {
      if (!isQuadPlanar(faceVertices)) {
        issues.push({
          type: 'non-planar-quad',
          elementType: 'face',
          elementId: faceId,
          description: `Quad face ${faceId} is non-planar.`,
        });
      }
    }
  });

  // 3. Comprehensive edge-based checks
  edges.forEach((edge) => {
    const faceCount = edge.faceIds.length;
    // 3a. Check for isolated edges (edges not belonging to any face)
    if (faceCount === 0) {
      issues.push({
        type: 'isolated-edge',
        elementType: 'edge',
        elementId: edge.id,
        description: `Edge ${edge.id} is isolated (not part of any face).`,
      });
    }
    // 3b. Check for non-manifold edges (connected to more than 2 faces)
    if (faceCount > 2) {
      issues.push({
        type: 'non-manifold-edge',
        elementType: 'edge',
        elementId: edge.id,
        description: `Edge ${edge.id} is non-manifold (connected to ${faceCount} faces).`,
      });
    }
  });

  // 4. Check for isolated components (islands of faces)
  if (faces.length > 0) {
    const visitedFaces = new Set<ID>();
    let componentCount = 0;
    
    // Get all face IDs from the mesh, not just the faces array
    const allFaceIds = new Set<ID>();
    faces.forEach(face => allFaceIds.add(face.id));
    
    // Create a map of edge IDs to edge objects for efficient lookup
    const edgeMap = new Map<ID, Edge>();
    edges.forEach(edge => edgeMap.set(edge.id, edge));
    
    allFaceIds.forEach(faceId => {
      if (!visitedFaces.has(faceId)) {
        componentCount++;
        const stack: ID[] = [faceId];
        visitedFaces.add(faceId);
        while (stack.length > 0) {
          const currentFaceId = stack.pop()!;
          const currentFace = mesh.getFace(currentFaceId);
          currentFace?.edgeIds.forEach(edgeId => {
            const edge = edgeMap.get(edgeId);
            if (edge) {
              edge.faceIds.forEach(neighborFaceId => {
                if (neighborFaceId !== currentFaceId && !visitedFaces.has(neighborFaceId)) {
                  visitedFaces.add(neighborFaceId);
                  stack.push(neighborFaceId);
                }
              });
            }
          });
        }
      }
    });
    
    if (componentCount > 1) {
      issues.push({
        type: 'isolated-component',
        elementType: 'mesh',
        description: `Mesh contains ${componentCount} separate connected components (islands of faces).`,
      });
    }
  }

  return issues;
}

function getFaceArea(verts: Vector3[]): number {
  if (verts.length < 3) return 0;
  // Shoelace formula for polygon area (works for non-planar quads too, giving projected area)
  // For triangles, it's half the magnitude of the cross product.
  if (verts.length === 3) {
    const v0 = verts[0],
      v1 = verts[1],
      v2 = verts[2];
    const edge1 = sub(v1, v0);
    const edge2 = sub(v2, v0);
    const crossProduct = cross(edge1, edge2);
    return 0.5 * magnitude(crossProduct);
  }
  // For quads, split into two triangles
  if (verts.length === 4) {
    return getFaceArea([verts[0], verts[1], verts[2]]) + getFaceArea([verts[0], verts[2], verts[3]]);
  }
  return 0;
}

/**
 * Checks if a quad is planar (all points lie in the same plane)
 * A more robust check using a tolerance for floating point errors.
 */
function isQuadPlanar(verts: Vector3[], tolerance = 1e-5): boolean {
  if (verts.length !== 4) return true; // Not a quad, not non-planar
  const v0 = verts[0],
    v1 = verts[1],
    v2 = verts[2],
    v3 = verts[3];
  const normal = cross(sub(v1, v0), sub(v2, v0));
  const dist = dot(normal, sub(v3, v0));
  return Math.abs(dist) < tolerance;
}

function sub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function magnitude(a: Vector3): number {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}