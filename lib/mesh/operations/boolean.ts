import { EditableMesh } from '../EditableMesh';
import { CSG } from '@jscad/csg';

export type BooleanOperation = 'union' | 'intersection' | 'difference';

/**
 * Converts an EditableMesh to a CSG object.
 */
function editableMeshToCSG(mesh: EditableMesh): any {
  // Collect polygons from mesh faces
  const polygons: any[] = [];
  for (const face of mesh.getFaces()) {
    const vertices = face.vertexIds.map(id => {
      const v = mesh.getVertex(id)!;
      return new CSG.Vertex(new CSG.Vector3D(v.position.x, v.position.y, v.position.z));
    });
    if (vertices.length >= 3) {
      polygons.push(new CSG.Polygon(vertices));
    }
  }
  return CSG.fromPolygons(polygons);
}

/**
 * Converts a CSG object to an EditableMesh.
 */
function csgToEditableMesh(csg: any): EditableMesh {
  const mesh = new EditableMesh();
  const vertexMap = new Map<string, number>();
  for (const polygon of csg.toPolygons()) {
    const faceIds: number[] = [];
    for (const vertex of polygon.vertices) {
      const key = `${vertex.pos.x},${vertex.pos.y},${vertex.pos.z}`;
      let id = vertexMap.get(key);
      if (id === undefined) {
        id = mesh.addVertex({ x: vertex.pos.x, y: vertex.pos.y, z: vertex.pos.z });
        vertexMap.set(key, id);
      }
      faceIds.push(id);
    }
    if (faceIds.length >= 3) {
      mesh.addFace(faceIds);
    }
  }
  return mesh;
}

/**
 * Performs a boolean operation between two meshes.
 * @param meshA First mesh
 * @param meshB Second mesh
 * @param operation Type of boolean operation
 * @returns New EditableMesh as the result
 */
export function booleanMesh(
  meshA: EditableMesh,
  meshB: EditableMesh,
  operation: BooleanOperation
): EditableMesh {
  const csgA = editableMeshToCSG(meshA);
  const csgB = editableMeshToCSG(meshB);
  let resultCSG: any;
  switch (operation) {
    case 'union':
      resultCSG = csgA.union(csgB);
      break;
    case 'intersection':
      resultCSG = csgA.intersect(csgB);
      break;
    case 'difference':
      resultCSG = csgA.subtract(csgB);
      break;
    default:
      throw new Error('Unknown boolean operation');
  }
  return csgToEditableMesh(resultCSG);
} 