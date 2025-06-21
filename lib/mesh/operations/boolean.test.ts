import { EditableMesh } from '../EditableMesh';
import { booleanMesh, BooleanOperation } from './boolean';

describe('booleanMesh', () => {
  let meshA: EditableMesh;
  let meshB: EditableMesh;

  function addCube(mesh: EditableMesh, center: {x: number, y: number, z: number}, size: number) {
    // 8 vertices
    const s = size / 2;
    const v = [
      mesh.addVertex({ x: center.x - s, y: center.y - s, z: center.z - s }), // 0
      mesh.addVertex({ x: center.x + s, y: center.y - s, z: center.z - s }), // 1
      mesh.addVertex({ x: center.x + s, y: center.y + s, z: center.z - s }), // 2
      mesh.addVertex({ x: center.x - s, y: center.y + s, z: center.z - s }), // 3
      mesh.addVertex({ x: center.x - s, y: center.y - s, z: center.z + s }), // 4
      mesh.addVertex({ x: center.x + s, y: center.y - s, z: center.z + s }), // 5
      mesh.addVertex({ x: center.x + s, y: center.y + s, z: center.z + s }), // 6
      mesh.addVertex({ x: center.x - s, y: center.y + s, z: center.z + s }), // 7
    ];
    // 6 faces (each as quad)
    mesh.addFace([v[0], v[1], v[2], v[3]]); // bottom
    mesh.addFace([v[4], v[5], v[6], v[7]]); // top
    mesh.addFace([v[0], v[1], v[5], v[4]]); // front
    mesh.addFace([v[2], v[3], v[7], v[6]]); // back
    mesh.addFace([v[1], v[2], v[6], v[5]]); // right
    mesh.addFace([v[0], v[3], v[7], v[4]]); // left
  }

  beforeEach(() => {
    meshA = new EditableMesh();
    meshB = new EditableMesh();
    addCube(meshA, {x: 0, y: 0, z: 0}, 2);
    addCube(meshB, {x: 1, y: 0, z: 0}, 2);
  });

  (['union', 'intersection', 'difference'] as BooleanOperation[]).forEach(op => {
    it(`should produce a non-empty mesh for ${op}`, () => {
      const result = booleanMesh(meshA, meshB, op);
      expect(Array.from(result.getVertices()).length).toBeGreaterThan(0);
      expect(Array.from(result.getFaces()).length).toBeGreaterThan(0);
    });
  });
}); 