import type { Vector3, Vertex, Edge, Face } from "./types"

// Generate a UUID (simple version for browser compatibility)
function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)
}

export function calculateFaceNormal(vertices: Vertex[], face: Face): Vector3 {
  if (face.vertexIds.length < 3) return { x: 0, y: 1, z: 0 }

  const v1 = vertices.find((v) => v.id === face.vertexIds[0])?.position
  const v2 = vertices.find((v) => v.id === face.vertexIds[1])?.position
  const v3 = vertices.find((v) => v.id === face.vertexIds[2])?.position

  if (!v1 || !v2 || !v3) return { x: 0, y: 1, z: 0 }

  // Calculate two edge vectors
  const edge1 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z }
  const edge2 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z }

  // Cross product for normal
  const normal = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x,
  }

  // Normalize
  const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z)
  if (length > 0) {
    normal.x /= length
    normal.y /= length
    normal.z /= length
  }

  return normal
}

export function generateEdgesFromFaces(vertices: Vertex[], faces: Face[]): Edge[] {
  const edgeMap = new Map<string, Edge>()

  faces.forEach((face) => {
    for (let i = 0; i < face.vertexIds.length; i++) {
      const v1 = face.vertexIds[i]
      const v2 = face.vertexIds[(i + 1) % face.vertexIds.length]

      // Create consistent edge key (smaller id first)
      const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`

      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          id: generateId(),
          vertexIds: v1 < v2 ? [v1, v2] : [v2, v1],
          selected: false,
        })
      }
    }
  })

  return Array.from(edgeMap.values())
}

export function createBoxGeometry(
  width = 1,
  height = 1,
  depth = 1,
  widthSegments = 1,
  heightSegments = 1,
  depthSegments = 1,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(`Creating box geometry: ${width}x${height}x${depth}`)

  const vertices: Vertex[] = [
    // Front face
    { id: generateId(), position: { x: -width / 2, y: -height / 2, z: depth / 2 }, selected: false },
    { id: generateId(), position: { x: width / 2, y: -height / 2, z: depth / 2 }, selected: false },
    { id: generateId(), position: { x: width / 2, y: height / 2, z: depth / 2 }, selected: false },
    { id: generateId(), position: { x: -width / 2, y: height / 2, z: depth / 2 }, selected: false },
    // Back face
    { id: generateId(), position: { x: -width / 2, y: -height / 2, z: -depth / 2 }, selected: false },
    { id: generateId(), position: { x: width / 2, y: -height / 2, z: -depth / 2 }, selected: false },
    { id: generateId(), position: { x: width / 2, y: height / 2, z: -depth / 2 }, selected: false },
    { id: generateId(), position: { x: -width / 2, y: height / 2, z: -depth / 2 }, selected: false },
  ]

  const faces: Face[] = [
    // Front face
    { id: generateId(), vertexIds: [vertices[0].id, vertices[1].id, vertices[2].id, vertices[3].id], selected: false },
    // Back face
    { id: generateId(), vertexIds: [vertices[5].id, vertices[4].id, vertices[7].id, vertices[6].id], selected: false },
    // Top face
    { id: generateId(), vertexIds: [vertices[3].id, vertices[2].id, vertices[6].id, vertices[7].id], selected: false },
    // Bottom face
    { id: generateId(), vertexIds: [vertices[4].id, vertices[5].id, vertices[1].id, vertices[0].id], selected: false },
    // Right face
    { id: generateId(), vertexIds: [vertices[1].id, vertices[5].id, vertices[6].id, vertices[2].id], selected: false },
    // Left face
    { id: generateId(), vertexIds: [vertices[4].id, vertices[0].id, vertices[3].id, vertices[7].id], selected: false },
  ]

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face)
  })

  const edges = generateEdgesFromFaces(vertices, faces)

  console.log(`Box geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`)
  return { vertices, edges, faces }
}

export function createSphereGeometry(
  radius = 0.5,
  widthSegments = 16,
  heightSegments = 12,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(`Creating sphere geometry: radius=${radius}, segments=${widthSegments}x${heightSegments}`)

  const vertices: Vertex[] = []
  const faces: Face[] = []

  // Generate vertices
  for (let iy = 0; iy <= heightSegments; iy++) {
    const v = iy / heightSegments
    const theta = v * Math.PI

    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments
      const phi = u * Math.PI * 2

      const x = -radius * Math.cos(phi) * Math.sin(theta)
      const y = radius * Math.cos(theta)
      const z = radius * Math.sin(phi) * Math.sin(theta)

      vertices.push({
        id: generateId(),
        position: { x, y, z },
        selected: false,
        normal: { x: x / radius, y: y / radius, z: z / radius },
      })
    }
  }

  // Generate faces
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = iy * (widthSegments + 1) + ix
      const b = iy * (widthSegments + 1) + ix + 1
      const c = (iy + 1) * (widthSegments + 1) + ix + 1
      const d = (iy + 1) * (widthSegments + 1) + ix

      if (iy !== 0) {
        faces.push({
          id: generateId(),
          vertexIds: [vertices[a].id, vertices[b].id, vertices[d].id],
          selected: false,
        })
      }

      if (iy !== heightSegments - 1) {
        faces.push({
          id: generateId(),
          vertexIds: [vertices[b].id, vertices[c].id, vertices[d].id],
          selected: false,
        })
      }
    }
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face)
  })

  const edges = generateEdgesFromFaces(vertices, faces)

  console.log(`Sphere geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`)
  return { vertices, edges, faces }
}

export function createCylinderGeometry(
  radiusTop = 0.5,
  radiusBottom = 0.5,
  height = 1,
  radialSegments = 16,
  heightSegments = 1,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(`Creating cylinder geometry: ${radiusTop}/${radiusBottom}, height=${height}, segments=${radialSegments}`)

  const vertices: Vertex[] = []
  const faces: Face[] = []
  const halfHeight = height / 2

  // Generate side vertices
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments
    const radius = v * (radiusBottom - radiusTop) + radiusTop

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments
      const theta = u * Math.PI * 2

      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)

      vertices.push({
        id: generateId(),
        position: {
          x: radius * sinTheta,
          y: -v * height + halfHeight,
          z: radius * cosTheta,
        },
        selected: false,
        normal: { x: sinTheta, y: 0, z: cosTheta },
      })
    }
  }

  // Generate side faces
  for (let x = 0; x < radialSegments; x++) {
    for (let y = 0; y < heightSegments; y++) {
      const a = y * (radialSegments + 1) + x
      const b = (y + 1) * (radialSegments + 1) + x
      const c = (y + 1) * (radialSegments + 1) + x + 1
      const d = y * (radialSegments + 1) + x + 1

      faces.push({
        id: generateId(),
        vertexIds: [vertices[a].id, vertices[b].id, vertices[c].id, vertices[d].id],
        selected: false,
      })
    }
  }

  // Add top cap if needed
  if (radiusTop > 0) {
    const centerTop = {
      id: generateId(),
      position: { x: 0, y: halfHeight, z: 0 },
      selected: false,
      normal: { x: 0, y: 1, z: 0 },
    }
    vertices.push(centerTop)

    for (let x = 0; x < radialSegments; x++) {
      const a = x
      const b = x + 1
      faces.push({
        id: generateId(),
        vertexIds: [centerTop.id, vertices[a].id, vertices[b].id],
        selected: false,
      })
    }
  }

  // Add bottom cap if needed
  if (radiusBottom > 0) {
    const centerBottom = {
      id: generateId(),
      position: { x: 0, y: -halfHeight, z: 0 },
      selected: false,
      normal: { x: 0, y: -1, z: 0 },
    }
    vertices.push(centerBottom)

    const bottomRowStart = heightSegments * (radialSegments + 1)
    for (let x = 0; x < radialSegments; x++) {
      const a = bottomRowStart + x + 1
      const b = bottomRowStart + x
      faces.push({
        id: generateId(),
        vertexIds: [centerBottom.id, vertices[a].id, vertices[b].id],
        selected: false,
      })
    }
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face)
  })

  const edges = generateEdgesFromFaces(vertices, faces)

  console.log(`Cylinder geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`)
  return { vertices, edges, faces }
}

export function createPlaneGeometry(
  width = 1,
  height = 1,
  widthSegments = 1,
  heightSegments = 1,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(`Creating plane geometry: ${width}x${height}, segments=${widthSegments}x${heightSegments}`)

  const vertices: Vertex[] = []
  const faces: Face[] = []

  const widthHalf = width / 2
  const heightHalf = height / 2
  const segmentWidth = width / widthSegments
  const segmentHeight = height / heightSegments

  // Generate vertices
  for (let iy = 0; iy <= heightSegments; iy++) {
    const y = iy * segmentHeight - heightHalf

    for (let ix = 0; ix <= widthSegments; ix++) {
      const x = ix * segmentWidth - widthHalf

      vertices.push({
        id: generateId(),
        position: { x, y: 0, z: -y },
        selected: false,
        normal: { x: 0, y: 1, z: 0 },
      })
    }
  }

  // Generate faces
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = ix + (widthSegments + 1) * iy
      const b = ix + (widthSegments + 1) * (iy + 1)
      const c = ix + 1 + (widthSegments + 1) * (iy + 1)
      const d = ix + 1 + (widthSegments + 1) * iy

      faces.push({
        id: generateId(),
        vertexIds: [vertices[a].id, vertices[b].id, vertices[c].id, vertices[d].id],
        selected: false,
      })
    }
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face)
  })

  const edges = generateEdgesFromFaces(vertices, faces)

  console.log(`Plane geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`)
  return { vertices, edges, faces }
}

export function createPyramidGeometry(
  baseRadius = 0.5,
  height = 1,
  baseSegments = 3,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(`Creating pyramid geometry: baseRadius=${baseRadius}, height=${height}, segments=${baseSegments}`)

  const vertices: Vertex[] = []
  const faces: Face[] = []

  // Create base vertices
  for (let i = 0; i < baseSegments; i++) {
    const angle = (i / baseSegments) * Math.PI * 2
    const x = baseRadius * Math.cos(angle)
    const z = baseRadius * Math.sin(angle)
    
    vertices.push({
      id: generateId(),
      position: { x, y: -height / 2, z },
      selected: false,
    })
  }

  // Create apex vertex
  const apex = {
    id: generateId(),
    position: { x: 0, y: height / 2, z: 0 },
    selected: false,
  }
  vertices.push(apex)

  // Create base face
  const baseFace: number[] = []
  for (let i = 0; i < baseSegments; i++) {
    baseFace.push(vertices[i].id)
  }
  faces.push({
    id: generateId(),
    vertexIds: baseFace,
    selected: false,
  })

  // Create triangular side faces
  for (let i = 0; i < baseSegments; i++) {
    const v1 = vertices[i].id
    const v2 = vertices[(i + 1) % baseSegments].id
    
    faces.push({
      id: generateId(),
      vertexIds: [v1, v2, apex.id],
      selected: false,
    })
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face)
  })

  const edges = generateEdgesFromFaces(vertices, faces)

  console.log(`Pyramid geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`)
  return { vertices, edges, faces }
}

export function createPrismGeometry(
  baseRadius = 0.5,
  height = 1,
  baseSegments = 6,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(`Creating prism geometry: baseRadius=${baseRadius}, height=${height}, segments=${baseSegments}`)

  const vertices: Vertex[] = []
  const faces: Face[] = []
  const halfHeight = height / 2

  // Create bottom base vertices
  for (let i = 0; i < baseSegments; i++) {
    const angle = (i / baseSegments) * Math.PI * 2
    const x = baseRadius * Math.cos(angle)
    const z = baseRadius * Math.sin(angle)
    
    vertices.push({
      id: generateId(),
      position: { x, y: -halfHeight, z },
      selected: false,
    })
  }

  // Create top base vertices
  for (let i = 0; i < baseSegments; i++) {
    const angle = (i / baseSegments) * Math.PI * 2
    const x = baseRadius * Math.cos(angle)
    const z = baseRadius * Math.sin(angle)
    
    vertices.push({
      id: generateId(),
      position: { x, y: halfHeight, z },
      selected: false,
    })
  }

  // Create bottom base face
  const bottomFace: number[] = []
  for (let i = 0; i < baseSegments; i++) {
    bottomFace.push(vertices[i].id)
  }
  faces.push({
    id: generateId(),
    vertexIds: bottomFace,
    selected: false,
  })

  // Create top base face
  const topFace: number[] = []
  for (let i = 0; i < baseSegments; i++) {
    topFace.push(vertices[baseSegments + i].id)
  }
  faces.push({
    id: generateId(),
    vertexIds: topFace,
    selected: false,
  })

  // Create side faces (quads)
  for (let i = 0; i < baseSegments; i++) {
    const v1 = vertices[i].id
    const v2 = vertices[(i + 1) % baseSegments].id
    const v3 = vertices[baseSegments + (i + 1) % baseSegments].id
    const v4 = vertices[baseSegments + i].id
    
    faces.push({
      id: generateId(),
      vertexIds: [v1, v2, v3, v4],
      selected: false,
    })
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face)
  })

  const edges = generateEdgesFromFaces(vertices, faces)

  console.log(`Prism geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`)
  return { vertices, edges, faces }
}

export function createTorusGeometry(
  radius = 0.5,
  tubeRadius = 0.2,
  radialSegments = 16,
  tubularSegments = 32,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(`Creating torus geometry: radius=${radius}, tubeRadius=${tubeRadius}, segments=${radialSegments}x${tubularSegments}`)

  const vertices: Vertex[] = []
  const faces: Face[] = []

  // Generate vertices
  for (let i = 0; i <= radialSegments; i++) {
    const u = i / radialSegments * Math.PI * 2
    
    for (let j = 0; j <= tubularSegments; j++) {
      const v = j / tubularSegments * Math.PI * 2
      
      const x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u)
      const y = (radius + tubeRadius * Math.cos(v)) * Math.sin(u)
      const z = tubeRadius * Math.sin(v)
      
      vertices.push({
        id: generateId(),
        position: { x, y, z },
        selected: false,
        normal: { 
          x: Math.cos(v) * Math.cos(u), 
          y: Math.cos(v) * Math.sin(u), 
          z: Math.sin(v) 
        },
      })
    }
  }

  // Generate faces
  for (let i = 0; i < radialSegments; i++) {
    for (let j = 0; j < tubularSegments; j++) {
      const a = i * (tubularSegments + 1) + j
      const b = (i + 1) * (tubularSegments + 1) + j
      const c = (i + 1) * (tubularSegments + 1) + j + 1
      const d = i * (tubularSegments + 1) + j + 1
      
      faces.push({
        id: generateId(),
        vertexIds: [vertices[a].id, vertices[b].id, vertices[c].id, vertices[d].id],
        selected: false,
      })
    }
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face)
  })

  const edges = generateEdgesFromFaces(vertices, faces)

  console.log(`Torus geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`)
  return { vertices, edges, faces }
}

export function createHelixGeometry(
  radius = 0.5,
  height = 2,
  turns = 3,
  radialSegments = 8,
  heightSegments = 32,
): { vertices: Vertex[]; edges: Edge[]; faces: Face[] } {
  console.log(`Creating helix geometry: radius=${radius}, height=${height}, turns=${turns}, segments=${radialSegments}x${heightSegments}`)

  const vertices: Vertex[] = []
  const faces: Face[] = []

  // Generate vertices along the helix path
  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments
    const angle = t * turns * Math.PI * 2
    const y = t * height - height / 2
    
    // Create a circle of vertices at this height
    for (let j = 0; j <= radialSegments; j++) {
      const circleAngle = (j / radialSegments) * Math.PI * 2
      const x = radius * Math.cos(angle + circleAngle)
      const z = radius * Math.sin(angle + circleAngle)
      
      vertices.push({
        id: generateId(),
        position: { x, y, z },
        selected: false,
      })
    }
  }

  // Generate faces
  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j
      const b = (i + 1) * (radialSegments + 1) + j
      const c = (i + 1) * (radialSegments + 1) + j + 1
      const d = i * (radialSegments + 1) + j + 1
      
      faces.push({
        id: generateId(),
        vertexIds: [vertices[a].id, vertices[b].id, vertices[c].id, vertices[d].id],
        selected: false,
      })
    }
  }

  // Calculate normals for faces
  faces.forEach((face) => {
    face.normal = calculateFaceNormal(vertices, face)
  })

  const edges = generateEdgesFromFaces(vertices, faces)

  console.log(`Helix geometry created: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`)
  return { vertices, edges, faces }
}
