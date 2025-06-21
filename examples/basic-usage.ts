import { EditableMesh } from '../lib/mesh/EditableMesh';
import { toThreeMesh } from '../lib/adapters/three';
import * as THREE from 'three';

// Create a new mesh
const mesh = new EditableMesh();

// Create a simple cube
const vertices = [
  { x: -1, y: -1, z: -1 }, // 0
  { x: 1, y: -1, z: -1 },  // 1
  { x: 1, y: 1, z: -1 },   // 2
  { x: -1, y: 1, z: -1 },  // 3
  { x: -1, y: -1, z: 1 },  // 4
  { x: 1, y: -1, z: 1 },   // 5
  { x: 1, y: 1, z: 1 },    // 6
  { x: -1, y: 1, z: 1 }    // 7
];

// Add vertices
const vertexIds = vertices.map(v => mesh.addVertex(v));

// Create faces (each face is a quad)
const faces = [
  [0, 1, 2, 3], // front
  [1, 5, 6, 2], // right
  [5, 4, 7, 6], // back
  [4, 0, 3, 7], // left
  [3, 2, 6, 7], // top
  [4, 5, 1, 0]  // bottom
];

// Add faces
const faceIds = faces.map(f => mesh.addFace(f));

// Add materials
const metalMaterial = mesh.addMaterialFromPreset('metal', 'Shiny Metal');
const glassMaterial = mesh.addMaterialFromPreset('glass', 'Transparent Glass');

// Assign materials to faces
mesh.assignMaterial(faceIds[0], metalMaterial); // front face
mesh.assignMaterial(faceIds[1], glassMaterial); // right face

// Add a bone for animation
const boneId = mesh.addBone({
  name: 'CubeBone',
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
  children: []
});

// Create an animation
const clipId = mesh.createAnimationClip('Rotate', 2.0);
mesh.addKeyframeToTrack(clipId, boneId, 'rotation', 0, [0, 0, 0, 1]);
mesh.addKeyframeToTrack(clipId, boneId, 'rotation', 1, [0, 1, 0, 0]);
mesh.addKeyframeToTrack(clipId, boneId, 'rotation', 2, [0, 0, 0, 1]);

// Convert to Three.js mesh
const threeMesh = toThreeMesh(mesh);

// Example of how to use the Three.js mesh
const scene = new THREE.Scene();
scene.add(threeMesh);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  // The animation will be handled by Three.js
  // You can also manually update the mesh here
}
animate();

// --- UV Mapping Example ---
// Create a UV map and assign UVs to vertices
const uvMapId = mesh.createUVMap('MainUV');
mesh.setVertexUV(vertices[0], uvMapId, 0, 0);
mesh.setVertexUV(vertices[1], uvMapId, 1, 0);
mesh.setVertexUV(vertices[2], uvMapId, 1, 1);
mesh.setVertexUV(vertices[3], uvMapId, 0, 1);

// --- Edge and Face Removal Example ---
// Remove an edge and a face
const faceToRemove = faceIds[0];
mesh.removeFace(faceToRemove);

// --- Material Assignment Example ---
// Assign a material to a face
const anotherMaterialId = mesh.addMaterialFromPreset('plastic', 'Plastic');
const anotherFaceId = faceIds[1];
mesh.assignMaterial(anotherFaceId, anotherMaterialId);

// --- Animation Example ---
// Add a keyframe to the animation clip
mesh.addKeyframeToTrack(clipId, boneId, 'position', 0, [0, 0, 0]);
mesh.addKeyframeToTrack(clipId, boneId, 'position', 1, [0, 2, 0]); 