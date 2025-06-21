import { EditableMesh } from '../mesh/EditableMesh';
import { ID, Vector2, Vector3 } from '../mesh/types';
import { parseOBJ, exportOBJ } from './obj';

describe('OBJ Adapter', () => {
  it('should correctly parse and export a simple mesh with UVs', () => {
    // 1. Create an original mesh
    const originalMesh = new EditableMesh();

    // Add vertices
    const v1Id = originalMesh.addVertex({ x: 0, y: 0, z: 0 });
    const v2Id = originalMesh.addVertex({ x: 1, y: 0, z: 0 });
    const v3Id = originalMesh.addVertex({ x: 0, y: 1, z: 0 });

    // Add a face
    const faceId = originalMesh.addFace([v1Id, v2Id, v3Id]);

    // Define and add UVs for the face
    const uvs: Vector2[] = [
      { u: 0, v: 0 },
      { u: 1, v: 0 },
      { u: 0, v: 1 },
    ];
    originalMesh.updateFaceUVs(faceId, uvs);

    // 2. Export to OBJ string
    const objString = exportOBJ(originalMesh);

    // 3. Parse OBJ string back to a new mesh
    const parsedMesh = parseOBJ(objString);

    // 4. Assertions
    const originalVertices = Array.from(originalMesh.getVertices());
    const parsedVertices = Array.from(parsedMesh.getVertices());
    const originalFaces = Array.from(originalMesh.getFaces());
    const parsedFaces = Array.from(parsedMesh.getFaces());

    // Check counts
    expect(parsedVertices.length).toBe(originalVertices.length);
    expect(parsedFaces.length).toBe(originalFaces.length);

    // Check vertex positions (order might differ, so we check for existence or sort)
    // For simplicity with a small, defined mesh, we can assume order or find by properties.
    // Here, we'll assume the order from OBJ parsing is consistent for this simple case.
    originalVertices.forEach((originalVertex, index) => {
      const parsedVertex = parsedVertices[index];
      expect(parsedVertex.position.x).toBeCloseTo(originalVertex.position.x);
      expect(parsedVertex.position.y).toBeCloseTo(originalVertex.position.y);
      expect(parsedVertex.position.z).toBeCloseTo(originalVertex.position.z);
    });

    // Check face vertex IDs and UVs
    // Note: OBJ parsing re-creates vertex IDs. We need to map them or check structure.
    // For this test, we'll check the first face's UVs, assuming a single face.
    expect(parsedFaces.length).toBe(1);
    const parsedFace = parsedFaces[0];
    
    // The parsed UVs should match the original UVs, though their order within the face
    // should correspond to the order of vertices in the parsed face.
    // The `exportOBJ` writes unique UVs and then `parseOBJ` reads them.
    // We expect the UVs on the parsed face to match the original UVs provided.
    expect(parsedFace.uvs.length).toBe(uvs.length);
    uvs.forEach((originalUV, index) => {
      // Find a matching UV in the parsed face's UVs (order might not be guaranteed for complex cases)
      // For a simple triangle, the order should be preserved if vertex order is preserved.
      const parsedUV = parsedFace.uvs[index];
      expect(parsedUV.u).toBeCloseTo(originalUV.u);
      expect(parsedUV.v).toBeCloseTo(originalUV.v);
    });

    // Optional: Check a snippet of the OBJ string for correctness
    expect(objString).toContain('v 0 0 0');
    expect(objString).toContain('v 1 0 0');
    expect(objString).toContain('v 0 1 0');
    expect(objString).toContain('vt 0 0');
    expect(objString).toContain('vt 1 0');
    expect(objString).toContain('vt 0 1');
    // Face indices are 1-based in OBJ
    // The exact face line depends on how UVs are indexed after collection.
    // If UVs are [ (0,0), (1,0), (0,1) ], their indices will be 1, 2, 3.
    // So, the face line should be something like 'f 1/1 2/2 3/3'
    expect(objString).toContain('f 1/1 2/2 3/3');
  });
});
