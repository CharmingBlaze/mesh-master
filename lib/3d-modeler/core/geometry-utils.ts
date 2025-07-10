import { Vector3, Vertex, Face, Edge } from "./types";

// Generate a UUID (simple version for browser compatibility)
function generateId(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9);
}

export function calculateFaceNormal(vertices: Vertex[], face: Face): Vector3 {
  if (face.vertexIds.length < 3) return { x: 0, y: 1, z: 0 };

  const v1 = vertices.find((v) => v.id === face.vertexIds[0])?.position;
  const v2 = vertices.find((v) => v.id === face.vertexIds[1])?.position;
  const v3 = vertices.find((v) => v.id === face.vertexIds[2])?.position;

  if (!v1 || !v2 || !v3) return { x: 0, y: 1, z: 0 };

  // Calculate two edge vectors
  const edge1: Vector3 = {
    x: v2.x - v1.x,
    y: v2.y - v1.y,
    z: v2.z - v1.z
  };
  const edge2: Vector3 = {
    x: v3.x - v1.x,
    y: v3.y - v1.y,
    z: v3.z - v1.z
  };

  // Cross product for normal
  let normal: Vector3 = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x
  };

  // Normalize
  const length = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z,
  );
  if (length > 0) {
    normal = {
      x: normal.x / length,
      y: normal.y / length,
      z: normal.z / length
    };
  }

  return normal;
}

export function generateEdgesFromFaces(
  vertices: Vertex[],
  faces: Face[],
): Edge[] {
  const edgeMap = new Map<string, Edge>();

  faces.forEach((face) => {
    for (let i = 0; i < face.vertexIds.length; i++) {
      const v1 = face.vertexIds[i];
      const v2 = face.vertexIds[(i + 1) % face.vertexIds.length];

      // Create consistent edge key (smaller id first)
      const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;

      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          id: generateId(),
          vertexIds: v1 < v2 ? [v1, v2] : [v2, v1],
          selected: false,
        });
      }
    }
  });

  return Array.from(edgeMap.values());
}

export function createCube(): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  const vertices: Vertex[] = [
    // Front face
    { id: "v0", position: { x: -0.5, y: -0.5, z: 0.5 }, selected: false },
    { id: "v1", position: { x: 0.5, y: -0.5, z: 0.5 }, selected: false },
    { id: "v2", position: { x: 0.5, y: 0.5, z: 0.5 }, selected: false },
    { id: "v3", position: { x: -0.5, y: 0.5, z: 0.5 }, selected: false },
    // Back face
    { id: "v4", position: { x: -0.5, y: -0.5, z: -0.5 }, selected: false },
    { id: "v5", position: { x: 0.5, y: -0.5, z: -0.5 }, selected: false },
    { id: "v6", position: { x: 0.5, y: 0.5, z: -0.5 }, selected: false },
    { id: "v7", position: { x: -0.5, y: 0.5, z: -0.5 }, selected: false }
  ];

  const edges: Edge[] = [
    // Front face edges
    { id: "e0", vertexIds: ["v0", "v1"], selected: false },
    { id: "e1", vertexIds: ["v1", "v2"], selected: false },
    { id: "e2", vertexIds: ["v2", "v3"], selected: false },
    { id: "e3", vertexIds: ["v3", "v0"], selected: false },
    // Back face edges
    { id: "e4", vertexIds: ["v4", "v5"], selected: false },
    { id: "e5", vertexIds: ["v5", "v6"], selected: false },
    { id: "e6", vertexIds: ["v6", "v7"], selected: false },
    { id: "e7", vertexIds: ["v7", "v4"], selected: false },
    // Connecting edges
    { id: "e8", vertexIds: ["v0", "v4"], selected: false },
    { id: "e9", vertexIds: ["v1", "v5"], selected: false },
    { id: "e10", vertexIds: ["v2", "v6"], selected: false },
    { id: "e11", vertexIds: ["v3", "v7"], selected: false }
  ];

  const faces: Face[] = [
    // Front face
    { id: "f0", vertexIds: ["v0", "v1", "v2", "v3"], selected: false },
    // Back face
    { id: "f1", vertexIds: ["v5", "v4", "v7", "v6"], selected: false },
    // Right face
    { id: "f2", vertexIds: ["v1", "v5", "v6", "v2"], selected: false },
    // Left face
    { id: "f3", vertexIds: ["v4", "v0", "v3", "v7"], selected: false },
    // Top face
    { id: "f4", vertexIds: ["v3", "v2", "v6", "v7"], selected: false },
    // Bottom face
    { id: "f5", vertexIds: ["v4", "v5", "v1", "v0"], selected: false }
  ];

  return { vertices, edges, faces };
}

export function createSphere(segments: number = 16): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  const vertices: Vertex[] = [];
  const edges: Edge[] = [];
  const faces: Face[] = [];

  // Generate sphere vertices
  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      const vertexId = `v${lat}_${lon}`;
      vertices.push({
        id: vertexId,
        position: { x: x * 0.5, y: y * 0.5, z: z * 0.5 },
        selected: false,
        normal: { x, y, z }
      });
    }
  }

  // Generate faces
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const current = lat * (segments + 1) + lon;
      const next = current + segments + 1;

      const v0 = current;
      const v1 = next;
      const v2 = next + 1;
      const v3 = current + 1;

      const faceId = `f${lat}_${lon}`;
      faces.push({
        id: faceId,
        vertexIds: [
          vertices[v0].id,
          vertices[v1].id,
          vertices[v2].id,
          vertices[v3].id
        ],
        selected: false
      });
    }
  }

  return { vertices, edges, faces };
}

export function createCylinder(segments: number = 16): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  const vertices: Vertex[] = [];
  const edges: Edge[] = [];
  const faces: Face[] = [];

  // Top and bottom center vertices
  vertices.push({ id: "v_top", position: { x: 0, y: 0.5, z: 0 }, selected: false });
  vertices.push({ id: "v_bottom", position: { x: 0, y: -0.5, z: 0 }, selected: false });

  // Generate side vertices
  for (let i = 0; i < segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    const x = Math.cos(angle) * 0.5;
    const z = Math.sin(angle) * 0.5;

    // Top ring
    vertices.push({
      id: `v_top_${i}`,
      position: { x, y: 0.5, z },
      selected: false
    });

    // Bottom ring
    vertices.push({
      id: `v_bottom_${i}`,
      position: { x, y: -0.5, z },
      selected: false
    });
  }

  // Generate faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    
    // Side face
    faces.push({
      id: `f_side_${i}`,
      vertexIds: [
        `v_top_${i}`,
        `v_top_${next}`,
        `v_bottom_${next}`,
        `v_bottom_${i}`
      ],
      selected: false
    });

    // Top face triangle
    faces.push({
      id: `f_top_${i}`,
      vertexIds: ["v_top", `v_top_${i}`, `v_top_${next}`],
      selected: false
    });

    // Bottom face triangle
    faces.push({
      id: `f_bottom_${i}`,
      vertexIds: ["v_bottom", `v_bottom_${next}`, `v_bottom_${i}`],
      selected: false
    });
  }

  return { vertices, edges, faces };
}

export function createPlaneGeometry(
  width = 1,
  height = 1,
  widthSegments = 1,
  heightSegments = 1,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(
    `Creating plane geometry: ${width}x${height}, segments=${widthSegments}x${heightSegments}`,
  );

  const vertices: Vertex[] = [];
  const faces: Face[] = [];

  const widthHalf = width / 2;
  const heightHalf = height / 2;
  const segmentWidth = width / widthSegments;
  const segmentHeight = height / heightSegments;

  // Generate vertices
  for (let iy = 0; iy <= heightSegments; iy++) {
    const y = iy * segmentHeight - heightHalf;

    for (let ix = 0; ix <= widthSegments; ix++) {
      const x = ix * segmentWidth - widthHalf;

      vertices.push({
        id: generateId(),
        position: { x, y: 0, z: -y },
        selected: false,
        normal: { x: 0, y: 1, z: 0 },
      });
    }
  }

  // Generate faces
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = ix + (widthSegments + 1) * iy;
      const b = ix + (widthSegments + 1) * (iy + 1);
      const c = ix + 1 + (widthSegments + 1) * (iy + 1);
      const d = ix + 1 + (widthSegments + 1) * iy;

      faces.push({
        id: generateId(),
        vertexIds: [
          vertices[a].id,
          vertices[b].id,
          vertices[c].id,
          vertices[d].id,
        ],
        selected: false,
      });
    }
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face);
  });

  const edges = generateEdgesFromFaces(vertices, faces);

  console.log(
    `Plane geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`,
  );
  return { vertices, edges, faces };
}

export function createPyramidGeometry(
  baseRadius = 0.5,
  height = 1,
  baseSegments = 3,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(
    `Creating pyramid geometry: baseRadius=${baseRadius}, height=${height}, segments=${baseSegments}`,
  );

  const vertices: Vertex[] = [];
  const faces: Face[] = [];

  // Create base vertices
  for (let i = 0; i < baseSegments; i++) {
    const angle = (i / baseSegments) * Math.PI * 2;
    const x = baseRadius * Math.cos(angle);
    const z = baseRadius * Math.sin(angle);

    vertices.push({
      id: generateId(),
      position: { x, y: -height / 2, z },
      selected: false,
    });
  }

  // Create apex vertex
  const apex = {
    id: generateId(),
    position: { x: 0, y: height / 2, z: 0 },
    selected: false,
  };
  vertices.push(apex);

  // Create base face
  const baseFace: string[] = [];
  for (let i = 0; i < baseSegments; i++) {
    baseFace.push(vertices[i].id);
  }
  faces.push({
    id: generateId(),
    vertexIds: baseFace,
    selected: false,
  });

  // Create triangular side faces
  for (let i = 0; i < baseSegments; i++) {
    const v1 = vertices[i].id;
    const v2 = vertices[(i + 1) % baseSegments].id;

    faces.push({
      id: generateId(),
      vertexIds: [v1, v2, apex.id],
      selected: false,
    });
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face);
  });

  const edges = generateEdgesFromFaces(vertices, faces);

  console.log(
    `Pyramid geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`,
  );
  return { vertices, edges, faces };
}

export function createPrismGeometry(
  baseRadius = 0.5,
  height = 1,
  baseSegments = 6,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(
    `Creating prism geometry: baseRadius=${baseRadius}, height=${height}, segments=${baseSegments}`,
  );

  const vertices: Vertex[] = [];
  const faces: Face[] = [];
  const halfHeight = height / 2;

  // Create bottom base vertices
  for (let i = 0; i < baseSegments; i++) {
    const angle = (i / baseSegments) * Math.PI * 2;
    const x = baseRadius * Math.cos(angle);
    const z = baseRadius * Math.sin(angle);

    vertices.push({
      id: generateId(),
      position: { x, y: -halfHeight, z },
      selected: false,
    });
  }

  // Create top base vertices
  for (let i = 0; i < baseSegments; i++) {
    const angle = (i / baseSegments) * Math.PI * 2;
    const x = baseRadius * Math.cos(angle);
    const z = baseRadius * Math.sin(angle);

    vertices.push({
      id: generateId(),
      position: { x, y: halfHeight, z },
      selected: false,
    });
  }

  // Create bottom base face
  const bottomFace: string[] = [];
  for (let i = 0; i < baseSegments; i++) {
    bottomFace.push(vertices[i].id);
  }
  faces.push({
    id: generateId(),
    vertexIds: bottomFace,
    selected: false,
  });

  // Create top base face
  const topFace: string[] = [];
  for (let i = 0; i < baseSegments; i++) {
    topFace.push(vertices[baseSegments + i].id);
  }
  faces.push({
    id: generateId(),
    vertexIds: topFace,
    selected: false,
  });

  // Create side faces (quads)
  for (let i = 0; i < baseSegments; i++) {
    const v1 = vertices[i].id;
    const v2 = vertices[(i + 1) % baseSegments].id;
    const v3 = vertices[baseSegments + ((i + 1) % baseSegments)].id;
    const v4 = vertices[baseSegments + i].id;

    faces.push({
      id: generateId(),
      vertexIds: [v1, v2, v3, v4],
      selected: false,
    });
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face);
  });

  const edges = generateEdgesFromFaces(vertices, faces);

  console.log(
    `Prism geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`,
  );
  return { vertices, edges, faces };
}

export function createTorusGeometry(
  radius = 0.5,
  tubeRadius = 0.2,
  radialSegments = 16,
  tubularSegments = 32,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(
    `Creating torus geometry: radius=${radius}, tubeRadius=${tubeRadius}, segments=${radialSegments}x${tubularSegments}`,
  );

  const vertices: Vertex[] = [];
  const faces: Face[] = [];

  // Generate vertices
  for (let i = 0; i <= radialSegments; i++) {
    const u = (i / radialSegments) * Math.PI * 2;

    for (let j = 0; j <= tubularSegments; j++) {
      const v = (j / tubularSegments) * Math.PI * 2;

      const x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
      const y = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);
      const z = tubeRadius * Math.sin(v);

      vertices.push({
        id: generateId(),
        position: { x, y, z },
        selected: false,
        normal: {
          x: Math.cos(v) * Math.cos(u),
          y: Math.cos(v) * Math.sin(u),
          z: Math.sin(v),
        },
      });
    }
  }

  // Generate faces
  for (let i = 0; i < radialSegments; i++) {
    for (let j = 0; j < tubularSegments; j++) {
      const a = i * (tubularSegments + 1) + j;
      const b = (i + 1) * (tubularSegments + 1) + j;
      const c = (i + 1) * (tubularSegments + 1) + j + 1;
      const d = i * (tubularSegments + 1) + j + 1;

      faces.push({
        id: generateId(),
        vertexIds: [
          vertices[a].id,
          vertices[b].id,
          vertices[c].id,
          vertices[d].id,
        ],
        selected: false,
      });
    }
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face);
  });

  const edges = generateEdgesFromFaces(vertices, faces);

  console.log(
    `Torus geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`,
  );
  return { vertices, edges, faces };
}

export function createHelixGeometry(
  radius = 0.5,
  height = 2,
  turns = 3,
  radialSegments = 8,
  heightSegments = 32,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(
    `Creating helix geometry: radius=${radius}, height=${height}, turns=${turns}, segments=${radialSegments}x${heightSegments}`,
  );

  const vertices: Vertex[] = [];
  const faces: Face[] = [];

  // Generate vertices along the helix path
  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments;
    const angle = t * turns * Math.PI * 2;
    const y = t * height - height / 2;

    // Create a circle of vertices at this height
    for (let j = 0; j <= radialSegments; j++) {
      const circleAngle = (j / radialSegments) * Math.PI * 2;
      const x = radius * Math.cos(angle + circleAngle);
      const z = radius * Math.sin(angle + circleAngle);

      vertices.push({
        id: generateId(),
        position: { x, y, z },
        selected: false,
      });
    }
  }

  // Generate faces
  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + j + 1;
      const d = i * (radialSegments + 1) + j + 1;

      faces.push({
        id: generateId(),
        vertexIds: [
          vertices[a].id,
          vertices[b].id,
          vertices[c].id,
          vertices[d].id,
        ],
        selected: false,
      });
    }
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face);
  });

  const edges = generateEdgesFromFaces(vertices, faces);

  console.log(
    `Helix geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`,
  );
  return { vertices, edges, faces };
}

export function calculateBoundingBox(vertices: Vertex[]): { min: Vector3; max: Vector3 } {
  if (vertices.length === 0) {
    return { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
  }

  let minX = vertices[0].position.x;
  let minY = vertices[0].position.y;
  let minZ = vertices[0].position.z;
  let maxX = vertices[0].position.x;
  let maxY = vertices[0].position.y;
  let maxZ = vertices[0].position.z;

  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.position.x);
    minY = Math.min(minY, vertex.position.y);
    minZ = Math.min(minZ, vertex.position.z);
    maxX = Math.max(maxX, vertex.position.x);
    maxY = Math.max(maxY, vertex.position.y);
    maxZ = Math.max(maxZ, vertex.position.z);
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ }
  };
}

export function calculateCenter(vertices: Vertex[]): Vector3 {
  if (vertices.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const sumX = vertices.reduce((sum, v) => sum + v.position.x, 0);
  const sumY = vertices.reduce((sum, v) => sum + v.position.y, 0);
  const sumZ = vertices.reduce((sum, v) => sum + v.position.z, 0);

  return {
    x: sumX / vertices.length,
    y: sumY / vertices.length,
    z: sumZ / vertices.length
  };
}
