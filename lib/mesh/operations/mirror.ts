import { EditableMesh } from '../EditableMesh';
import { ID, Vector3 } from '../types';

/**
 * Options for mirroring a mesh
 */
export interface MirrorOptions {
  axis: 'x' | 'y' | 'z';
  origin?: Vector3; // Optional origin for the mirror plane
}

/**
 * Mirrors the mesh across the specified axis and origin.
 * @param mesh - The mesh to mirror
 * @param options - Mirror options
 * @returns The mirrored mesh (in-place)
 */
export function mirrorMesh(mesh: EditableMesh, options: MirrorOptions): EditableMesh {
  const { axis, origin } = options;
  const o = origin || { x: 0, y: 0, z: 0 };

  mesh['vertices'].forEach(vertex => {
    switch (axis) {
      case 'x':
        vertex.position.x = o.x - (vertex.position.x - o.x);
        break;
      case 'y':
        vertex.position.y = o.y - (vertex.position.y - o.y);
        break;
      case 'z':
        vertex.position.z = o.z - (vertex.position.z - o.z);
        break;
    }
  });

  // Optionally, flip face winding if needed
  mesh['faces'].forEach(face => {
    face.vertexIds.reverse();
  });

  return mesh;
} 