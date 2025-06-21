# 3D Mesh Editor Library

<!-- Project Logo Placeholder -->
<p align="center">
  <img src="./public/placeholder-logo.svg" alt="3D Mesh Editor Logo" width="120" />
</p>

[![npm version](https://badge.fury.io/js/mesh-master.svg)](https://www.npmjs.com/package/mesh-master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/CharmingBlaze/mesh-master.svg?style=social&label=Star)](https://github.com/CharmingBlaze/mesh-master)

A **framework-agnostic, headless TypeScript library** for advanced 3D mesh editing operations. Build 3D modeling, CAD, or geometry tools for web, desktop, or server—no UI dependencies required.

---

## Why use this library?
- **Headless & UI-agnostic:** Use with React, Vue, Svelte, vanilla JS, or in Node.js.
- **Rich mesh operations:** Extrude, subdivide, merge, smooth, validate, and more.
- **Robust topology validation:** Detect and repair degenerate faces, non-manifold edges, and more.
- **Adapters for Three.js & Babylon.js:** Easily connect to popular renderers.
- **TypeScript-first:** Full type safety and modern API design.
- **OBJ import/export:** Interoperable with standard 3D tools.

---

## Features

- Vertex, edge, and face management with unique IDs
- UV coordinate and material system
- Selection API (single, multi, box selection)
- Mesh operations: extrude, subdivide, merge, smooth, etc.
- Topology validation and repair
- JSON serialization/deserialization
- OBJ file format import/export
- Three.js adapter for rendering
- TypeScript support with full type definitions

---

## Installation

```bash
npm install mesh-master
```

---

## Basic Usage

```typescript
import { EditableMesh, extrudeFace, subdivideEdge, mergeVertices, smoothMesh, validateTopology, repairTopology, toThreeMesh, parseOBJ, exportOBJ } from 'mesh-master';
import * as THREE from 'three'; // For rendering example

// Create a new mesh
const mesh = new EditableMesh();

// Add vertices
const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
const v4 = mesh.addVertex({ x: 1, y: 1, z: 0 });

// Create a face
const faceId = mesh.addFace([v1, v2, v4, v3]);

// Extrude the face
extrudeFace(mesh, faceId, { distance: 1, createCap: true });

// Smooth the mesh
smoothMesh(mesh, { iterations: 2, strength: 0.5 });

// Validate topology
const issues = validateTopology(mesh);
if (issues.length > 0) {
  console.warn('Mesh has topology issues:', issues);
  // repairTopology(mesh); // Optionally repair
}

// Convert to Three.js mesh
const threeMesh = toThreeMesh(mesh, { includeUVs: true, includeNormals: true });

// Serialize to JSON
const json = mesh.toJSON();

// Deserialize from JSON
const newMesh = EditableMesh.fromJSON(json);

// Export to OBJ
const objData = exportOBJ(newMesh);

// Import from OBJ
const importedMesh = parseOBJ(`
v 0.0 0.0 0.0
v 1.0 0.0 0.0
v 0.0 1.0 0.0
f 1 2 3
`);
```

---

## API Reference

See [API Documentation](./docs/index.html) for full details.

### EditableMesh

- `addVertex(position: Vector3): ID`
- `removeVertex(id: ID): void`
- `moveVertex(id: ID, newPosition: Vector3): void`
- `addEdge(vertexId1: ID, vertexId2: ID): ID`
- `addFace(vertexIds: ID[], materialId?: ID): ID`
- `removeFace(id: ID): void`
- `updateFaceUVs(faceId: ID, uvs: Vector2[]): void`
- `addMaterial(name: string, properties?): ID`
- `assignMaterial(faceId: ID, materialId: ID | null): void`
- `selectBox(box: BoxSelection, type: SelectionType): Selection`
- `toJSON(): string`
- `static fromJSON(json: string): EditableMesh`

### Mesh Operations

- `extrudeFace(mesh, faceId, options)`
- `subdivideEdge(mesh, edgeId, options)`
- `mergeVertices(mesh, vertexIds, options?)`
- `smoothMesh(mesh, options?)`
- `validateTopology(mesh)`
- `repairTopology(mesh)`

### Adapters

- `toThreeGeometry(mesh, options?)`
- `toThreeMaterials(mesh)`
- `toThreeMesh(mesh, options?)`
- `parseOBJ(objContent)`
- `exportOBJ(mesh)`

---

## TypeScript & Framework Agnostic

This library is written in TypeScript and can be used in any JavaScript or TypeScript project, regardless of framework. It is suitable for use in Node.js, browser, or hybrid environments.

---

## Contributing

Contributions, bug reports, and feature requests are welcome! Please open an issue or pull request on [GitHub](https://github.com/CharmingBlaze/mesh-master).

---

## Support / Contact

For questions, issues, or support, please use the [GitHub Issues](https://github.com/CharmingBlaze/mesh-master/issues) page.

---

## Changelog

See [Releases](https://github.com/CharmingBlaze/mesh-master/releases) for version history and changelog.

---

## License

This project is licensed under the [MIT License](./LICENSE).
