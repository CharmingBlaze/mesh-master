import { EditableMesh } from '../EditableMesh';
import { Vector3, ID } from '../types';

interface SmoothOptions {
  iterations?: number;
  alpha?: number;
  preserveBoundaries?: boolean;
  preserveFeatures?: boolean;
  featureAngle?: number;
  useWeights?: boolean;
}

/**
 * Applies Laplacian smoothing to the mesh with enhanced features.
 * Each vertex is moved towards the weighted average position of its connected neighbors.
 *
 * @param mesh The EditableMesh instance to modify
 * @param options Smoothing options:
 *   - iterations: Number of smoothing iterations (default: 1)
 *   - alpha: Smoothing factor 0.0 to 1.0 (default: 1.0)
 *   - preserveBoundaries: Whether to preserve mesh boundaries (default: true)
 *   - preserveFeatures: Whether to preserve sharp features (default: true)
 *   - featureAngle: Angle threshold for feature preservation in degrees (default: 30)
 *   - useWeights: Whether to use edge length-based weights (default: true)
 * @returns The modified EditableMesh instance
 */
export function smoothMesh(
  mesh: EditableMesh,
  options: SmoothOptions = {}
): EditableMesh {
  const {
    iterations = 1,
    alpha = 1.0,
    preserveBoundaries = true,
    preserveFeatures = true,
    featureAngle = 30,
    useWeights = true
  } = options;

  if (iterations <= 0 || alpha <= 0) {
    return mesh;
  }

  // Clamp alpha to the range [0, 1]
  const smoothingFactor = Math.max(0, Math.min(1, alpha));
  const featureAngleRad = (featureAngle * Math.PI) / 180;

  // Precompute vertex neighborhoods and weights
  const vertexNeighbors = new Map<ID, { id: ID; weight: number }[]>();
  const isBoundaryVertex = new Set<ID>();
  const isFeatureVertex = new Set<ID>();

  // First pass: identify boundary vertices and compute neighborhoods
  const vertices = Array.from(mesh.getVertices());
  const edges = Array.from(mesh.getEdges());
  const faces = Array.from(mesh.getFaces());

  // Identify boundary vertices
  if (preserveBoundaries) {
    // Count how many faces each edge belongs to
    const edgeFaceCount = new Map<string, number>();
    for (const face of faces) {
      for (let i = 0; i < face.vertexIds.length; i++) {
        const v1 = face.vertexIds[i];
        const v2 = face.vertexIds[(i + 1) % face.vertexIds.length];
        const edgeKey = [v1, v2].sort().join('-');
        edgeFaceCount.set(edgeKey, (edgeFaceCount.get(edgeKey) || 0) + 1);
      }
    }

    // A vertex is a boundary vertex if it has at least one edge that belongs to only one face
    for (const [edgeKey, count] of edgeFaceCount) {
      if (count === 1) {
        const [v1, v2] = edgeKey.split('-').map(Number);
        isBoundaryVertex.add(v1);
        isBoundaryVertex.add(v2);
      }
    }

    // Also mark vertices that are not part of any face as boundary vertices
    const verticesInFaces = new Set<ID>();
    for (const face of faces) {
      for (const vertexId of face.vertexIds) {
        verticesInFaces.add(vertexId);
      }
    }
    for (const vertex of vertices) {
      if (!verticesInFaces.has(vertex.id)) {
        isBoundaryVertex.add(vertex.id);
      }
    }
  }

  // Identify feature vertices
  if (preserveFeatures) {
    for (const vertex of vertices) {
      const connectedFaces = faces.filter(f => f.vertexIds.includes(vertex.id));
      if (connectedFaces.length > 0) {
        const normals = connectedFaces.map(f => {
          const v1 = mesh.getVertex(f.vertexIds[0])!.position;
          const v2 = mesh.getVertex(f.vertexIds[1])!.position;
          const v3 = mesh.getVertex(f.vertexIds[2])!.position;
          return computeNormal(v1, v2, v3);
        });

        // Check if any pair of normals exceeds the feature angle
        for (let i = 0; i < normals.length; i++) {
          for (let j = i + 1; j < normals.length; j++) {
            const angle = Math.acos(dotProduct(normals[i], normals[j]));
            if (angle > featureAngleRad) {
              isFeatureVertex.add(vertex.id);
              break;
            }
          }
        }
      }
    }
  }

  // Compute neighborhoods and weights
  for (const vertex of vertices) {
    const neighbors: { id: ID; weight: number }[] = [];
    for (const edge of edges) {
      let neighborId: ID | null = null;
      if (edge.vertexIds[0] === vertex.id) {
        neighborId = edge.vertexIds[1];
      } else if (edge.vertexIds[1] === vertex.id) {
        neighborId = edge.vertexIds[0];
      }

      if (neighborId !== null) {
        const neighborVertex = mesh.getVertex(neighborId);
        if (neighborVertex) {
          const weight = useWeights ? 1 / distance(vertex.position, neighborVertex.position) : 1;
          neighbors.push({ id: neighborId, weight });
        }
      }
    }
    vertexNeighbors.set(vertex.id, neighbors);
  }

  // Perform smoothing iterations
  for (let iter = 0; iter < iterations; iter++) {
    const newPositions = new Map<ID, Vector3>();

    for (const vertex of vertices) {
      // Skip boundary or feature vertices if preservation is enabled
      if ((preserveBoundaries && isBoundaryVertex.has(vertex.id)) ||
          (preserveFeatures && isFeatureVertex.has(vertex.id))) {
        continue;
      }

      const neighbors = vertexNeighbors.get(vertex.id) || [];
      if (neighbors.length === 0) continue;

      let totalWeight = 0;
      const weightedSum: Vector3 = { x: 0, y: 0, z: 0 };

      for (const { id, weight } of neighbors) {
        const neighborVertex = mesh.getVertex(id)!;
        totalWeight += weight;
        weightedSum.x += neighborVertex.position.x * weight;
        weightedSum.y += neighborVertex.position.y * weight;
        weightedSum.z += neighborVertex.position.z * weight;
      }

      if (totalWeight > 0) {
        const averagePosition: Vector3 = {
          x: weightedSum.x / totalWeight,
          y: weightedSum.y / totalWeight,
          z: weightedSum.z / totalWeight
        };

        newPositions.set(vertex.id, {
          x: vertex.position.x + smoothingFactor * (averagePosition.x - vertex.position.x),
          y: vertex.position.y + smoothingFactor * (averagePosition.y - vertex.position.y),
          z: vertex.position.z + smoothingFactor * (averagePosition.z - vertex.position.z)
        });
      }
    }

    // Apply the new positions
    for (const [vertexId, newPosition] of newPositions) {
      mesh.moveVertex(vertexId, newPosition);
    }
  }

  return mesh;
}

// Helper functions
function distance(v1: Vector3, v2: Vector3): number {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const dz = v2.z - v1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function dotProduct(v1: Vector3, v2: Vector3): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function computeNormal(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
  const u = {
    x: v2.x - v1.x,
    y: v2.y - v1.y,
    z: v2.z - v1.z
  };
  const v = {
    x: v3.x - v1.x,
    y: v3.y - v1.y,
    z: v3.z - v1.z
  };
  
  return {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x
  };
}
