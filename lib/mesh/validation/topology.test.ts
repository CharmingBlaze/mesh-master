import { EditableMesh } from '../EditableMesh';
import { validateTopology, TopologyIssue } from './topology';

describe('validateTopology', () => {
  let mesh: EditableMesh;

  beforeEach(() => {
    mesh = new EditableMesh();
  });

  it('should return no issues for an empty mesh', () => {
    const issues = validateTopology(mesh);
    expect(issues).toEqual([]);
  });

  it('should return no issues for a valid cube mesh', () => {
    mesh = EditableMesh.createSampleCube();
    const issues = validateTopology(mesh);
    if (issues.length > 0) {
      // Print issues for debugging
      console.log('Cube mesh validation issues:', issues);
    }
    expect(issues).toEqual([]);
  });

  it('should detect an orphaned vertex', () => {
    mesh.addVertex({ x: 0, y: 0, z: 0 });
    const issues = validateTopology(mesh);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('orphaned-vertex');
    expect(issues[0].elementType).toBe('vertex');
  });

  it('should detect an isolated edge', () => {
    const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
    const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
    mesh.addEdge(v1, v2);
    const issues = validateTopology(mesh);
    // It will also detect orphaned vertices, so we filter for the edge issue.
    const edgeIssue = issues.find(i => i.type === 'isolated-edge');
    expect(edgeIssue).toBeDefined();
    expect(edgeIssue?.elementType).toBe('edge');
  });

  it('should detect a degenerate face', () => {
    const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
    const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
    const v3 = mesh.addVertex({ x: 2, y: 0, z: 0 }); // Collinear
    mesh.addFace([v1, v2, v3]);
    const issues = validateTopology(mesh);
    const degenerateFaceIssue = issues.find(i => i.type === 'degenerate-face');
    expect(degenerateFaceIssue).toBeDefined();
    expect(degenerateFaceIssue?.elementType).toBe('face');
  });

  it('should detect an overlapping face', () => {
    const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
    const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
    const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
    mesh.addFace([v1, v2, v3]);
    mesh.addFace([v1, v2, v3]); // Add the same face again
    const issues = validateTopology(mesh);
    const overlappingFaceIssue = issues.find(i => i.type === 'overlapping-face');
    expect(overlappingFaceIssue).toBeDefined();
    expect(overlappingFaceIssue?.elementType).toBe('face');
  });

  it('should detect a non-manifold edge', () => {
    const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
    const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
    const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
    const v4 = mesh.addVertex({ x: -1, y: 0, z: 0 });
    const v5 = mesh.addVertex({ x: 0, y: 0, z: 1 });

    // Create a "fan" of 3 faces sharing one edge
    mesh.addFace([v1, v2, v3]);
    mesh.addFace([v1, v4, v2]);
    mesh.addFace([v1, v2, v5]);

    const issues = validateTopology(mesh);
    const nonManifoldEdgeIssue = issues.find(i => i.type === 'non-manifold-edge');
    expect(nonManifoldEdgeIssue).toBeDefined();
    expect(nonManifoldEdgeIssue?.elementType).toBe('edge');
  });

  it('should detect invalid face size', () => {
    const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
    const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
    const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
    const v4 = mesh.addVertex({ x: 1, y: 1, z: 0 });
    const v5 = mesh.addVertex({ x: 0.5, y: 0.5, z: 0 });
    
    // Create a face with 5 vertices (invalid - should be tri or quad)
    mesh.addFace([v1, v2, v3, v4, v5]);
    
    const issues = validateTopology(mesh);
    const invalidFaceIssue = issues.find(i => i.type === 'invalid-face-size');
    expect(invalidFaceIssue).toBeDefined();
    expect(invalidFaceIssue?.elementType).toBe('face');
  });

  it('should detect non-planar quad', () => {
    const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
    const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
    const v3 = mesh.addVertex({ x: 1, y: 1, z: 0 });
    const v4 = mesh.addVertex({ x: 0, y: 1, z: 1 }); // This vertex makes it non-planar
    mesh.addFace([v1, v2, v3, v4]);
    const issues = validateTopology(mesh);
    const nonPlanarQuadIssue = issues.find(i => i.type === 'non-planar-quad');
    expect(nonPlanarQuadIssue).toBeDefined();
    expect(nonPlanarQuadIssue?.elementType).toBe('face');
  });

  it('should detect isolated components', () => {
    // Component 1
    const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
    const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
    const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
    mesh.addFace([v1, v2, v3]);

    // Component 2 (not connected to component 1)
    const v4 = mesh.addVertex({ x: 5, y: 0, z: 0 });
    const v5 = mesh.addVertex({ x: 6, y: 0, z: 0 });
    const v6 = mesh.addVertex({ x: 5, y: 1, z: 0 });
    mesh.addFace([v4, v5, v6]);

    const issues = validateTopology(mesh);
    const isolatedComponentIssue = issues.find(i => i.type === 'isolated-component');
    expect(isolatedComponentIssue).toBeDefined();
    expect(isolatedComponentIssue?.elementType).toBe('mesh');
    expect(isolatedComponentIssue?.description).toContain('2');
  });
});
