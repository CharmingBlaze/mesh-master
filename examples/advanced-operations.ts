import { EditableMesh } from '../lib/mesh/EditableMesh';
import { bevelEdge } from '../lib/mesh/operations/bevel';
import { chamferEdge } from '../lib/mesh/operations/chamfer';
import { mergeVertices } from '../lib/mesh/operations/merge';
import { subdivideEdge } from '../lib/mesh/operations/subdivide';

// Create a sample mesh (cube)
const mesh = EditableMesh.createSampleCube();

// --- Bevel Operation ---
// Bevel the first edge
const firstEdge = mesh.getEdges().next().value;
if (firstEdge) {
  bevelEdge(mesh, firstEdge.id, { width: 0.1 });
}

// --- Chamfer Operation ---
// Chamfer the second edge
const edges = Array.from(mesh.getEdges());
if (edges[1]) {
  chamferEdge(mesh, edges[1].id, { width: 0.1 });
}

// --- Merge Vertices ---
// Merge the first two vertices
const verts = Array.from(mesh.getVertices());
if (verts[0] && verts[1]) {
  mergeVertices(mesh, [verts[0].id, verts[1].id]);
}

// --- Subdivide Edge ---
// Subdivide the third edge
if (edges[2]) {
  subdivideEdge(mesh, edges[2].id, { segments: 2 });
}

console.log('Advanced mesh operations complete!'); 