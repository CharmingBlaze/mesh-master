import { EditableMesh } from '../mesh/EditableMesh';
import { ID, Vector2, Vector3, Material, Vertex, Bone as MeshBone, Skeleton as MeshSkeleton, SkinWeight, AnimationClip as MeshAnimationClip } from '../mesh/types';
import * as THREE from 'three';
import { BufferGeometry, Float32BufferAttribute } from 'three';

/**
 * Options for converting to Three.js geometry
 */
export interface ThreeGeometryOptions {
  includeUVs?: boolean;
  includeNormals?: boolean;
  includeColors?: boolean;
  uvMapId?: number;
  normalsMode?: 'face' | 'vertex';
}

export interface ThreeMaterialOptions {
  textureLoader?: THREE.TextureLoader;
  defaultColor?: [number, number, number];
}

/**
 * Converts an EditableMesh to a Three.js BufferGeometry
 */
export function toThreeGeometry(
  mesh: EditableMesh,
  options: ThreeGeometryOptions = {}
): THREE.BufferGeometry {
  const {
    includeUVs = true,
    includeNormals = true,
    includeColors = true,
    uvMapId,
    normalsMode = 'vertex'
  } = options;

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];

  // Create vertex lookup map
  const vertexMap = new Map<ID, number>();
  let vertexIndex = 0;

  // Process all faces
  mesh['faces'].forEach((face, faceId) => {
    const faceVertices = face.vertexIds.map(id => mesh['vertices'].get(id)!);
    
    // Calculate face normal
    const normal = calculateFaceNormal(faceVertices);

    // Process each vertex in the face
    face.vertexIds.forEach((vertexId, i) => {
      const vertex = mesh['vertices'].get(vertexId)!;
      
      // Add vertex if not already processed
      if (!vertexMap.has(vertexId)) {
        positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
        vertexMap.set(vertexId, vertexIndex++);

        // Add normal
        if (includeNormals) {
          normals.push(normal.x, normal.y, normal.z);
        }

        // Add color (default white)
        if (includeColors) {
          colors.push(1, 1, 1);
        }
      }

      // Add UV coordinates
      if (includeUVs && face.uvs[i]) {
        uvs.push(face.uvs[i].u, face.uvs[i].v);
      }

      // Add index
      indices.push(vertexMap.get(vertexId)!);
    });
  });

  // Set attributes
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  if (includeUVs && uvs.length > 0) {
    geometry.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(uvs, 2)
    );
  }

  if (includeNormals && normals.length > 0) {
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3)
    );
  }

  if (includeColors && colors.length > 0) {
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
  }

  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  return geometry;
}

/**
 * Creates a Three.js material from mesh materials
 */
export function toThreeMaterials(
  mesh: EditableMesh
): THREE.Material[] {
  const materials: THREE.Material[] = [];
  const materialMap = new Map<ID, number>();

  mesh['materials'].forEach((material, id) => {
    const threeMaterial = toThreeMaterial(material, {});
    materials.push(threeMaterial);
    materialMap.set(id, materials.length - 1);
  });

  return materials;
}

/**
 * Creates a Three.js mesh from an EditableMesh
 */
export function toThreeMesh(
  mesh: EditableMesh,
  options: ThreeGeometryOptions & ThreeMaterialOptions = {}
): THREE.Mesh {
  const geometry = toThreeGeometry(mesh, options);
  const materials = toThreeMaterials(mesh);
  
  if (!geometry) {
    throw new Error('Failed to create Three.js geometry');
  }
  
  if (materials.length === 0) {
    // Create default material if none exist
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  } else if (materials.length === 1) {
    return new THREE.Mesh(geometry, materials[0]);
  } else {
    return new THREE.Mesh(geometry, materials);
  }
}

/**
 * Calculates the normal vector of a face
 */
function calculateFaceNormal(vertices: { position: Vector3 }[]): Vector3 {
  if (vertices.length < 3) {
    throw new Error('Need at least 3 vertices to calculate normal');
  }

  const v1 = vertices[0].position;
  const v2 = vertices[1].position;
  const v3 = vertices[2].position;

  const edge1 = {
    x: v2.x - v1.x,
    y: v2.y - v1.y,
    z: v2.z - v1.z
  };

  const edge2 = {
    x: v3.x - v1.x,
    y: v3.y - v1.y,
    z: v3.z - v1.z
  };

  const normal = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x
  };

  const length = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
  );

  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length
  };
}

/**
 * Converts EditableMesh to Three.js BufferGeometry, splitting quads into triangles.
 * Options: normalsMode ('vertex' | 'face'), includeColors (boolean)
 */
export function toBufferGeometry(mesh: EditableMesh, options?: { normalsMode?: 'vertex' | 'face', includeColors?: boolean }): BufferGeometry {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const vertexMap = new Map<number, number>(); // mesh vertex id -> buffer index
  let bufferIndex = 0;

  // Build position array and mapping
  mesh['vertices'].forEach((vertex, id) => {
    positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
    vertexMap.set(id, bufferIndex++);
    if (options?.includeColors && vertex.color) {
      colors.push(vertex.color[0], vertex.color[1], vertex.color[2]);
    }
  });

  // Compute normals
  const { faceNormals, vertexNormals } = mesh.computeNormals();

  // Build index and normal arrays
  mesh['faces'].forEach(face => {
    if (face.vertexIds.length === 3) {
      const [a, b, c] = face.vertexIds.map(id => vertexMap.get(id)!);
      indices.push(a, b, c);
      // Normals
      [a, b, c].forEach((vi, i) => {
        const n = options?.normalsMode === 'face' ? faceNormals.get(face.id)! : vertexNormals.get(face.vertexIds[i])!;
        normals[vi * 3] = n.x;
        normals[vi * 3 + 1] = n.y;
        normals[vi * 3 + 2] = n.z;
      });
    } else if (face.vertexIds.length === 4) {
      // Split quad into two triangles
      const [a, b, c, d] = face.vertexIds.map(id => vertexMap.get(id)!);
      indices.push(a, b, c, a, c, d);
      // Normals
      [a, b, c, d].forEach((vi, i) => {
        const n = options?.normalsMode === 'face' ? faceNormals.get(face.id)! : vertexNormals.get(face.vertexIds[i])!;
        normals[vi * 3] = n.x;
        normals[vi * 3 + 1] = n.y;
        normals[vi * 3 + 2] = n.z;
      });
    } else {
      throw new Error('Only tris and quads are supported');
    }
  });

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  if (options?.includeColors && colors.length > 0) {
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  }
  return geometry;
}

/**
 * Converts EditableMesh to a structure compatible with @react-three/fiber (Float32Arrays)
 */
export function toFiberGeometry(mesh: EditableMesh, options?: { normalsMode?: 'vertex' | 'face', includeColors?: boolean }) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const vertexMap = new Map<number, number>();
  let bufferIndex = 0;

  mesh['vertices'].forEach((vertex, id) => {
    positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
    vertexMap.set(id, bufferIndex++);
    if (options?.includeColors && vertex.color) {
      colors.push(vertex.color[0], vertex.color[1], vertex.color[2]);
    }
  });

  const { faceNormals, vertexNormals } = mesh.computeNormals();

  mesh['faces'].forEach(face => {
    if (face.vertexIds.length === 3) {
      const [a, b, c] = face.vertexIds.map(id => vertexMap.get(id)!);
      indices.push(a, b, c);
      [a, b, c].forEach((vi, i) => {
        const n = options?.normalsMode === 'face' ? faceNormals.get(face.id)! : vertexNormals.get(face.vertexIds[i])!;
        normals[vi * 3] = n.x;
        normals[vi * 3 + 1] = n.y;
        normals[vi * 3 + 2] = n.z;
      });
    } else if (face.vertexIds.length === 4) {
      const [a, b, c, d] = face.vertexIds.map(id => vertexMap.get(id)!);
      indices.push(a, b, c, a, c, d);
      [a, b, c, d].forEach((vi, i) => {
        const n = options?.normalsMode === 'face' ? faceNormals.get(face.id)! : vertexNormals.get(face.vertexIds[i])!;
        normals[vi * 3] = n.x;
        normals[vi * 3 + 1] = n.y;
        normals[vi * 3 + 2] = n.z;
      });
    } else {
      throw new Error('Only tris and quads are supported');
    }
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    colors: colors.length > 0 ? new Float32Array(colors) : undefined
  };
}

// Sample usage example for the Three.js adapter
function sampleUsage() {
  // Create a sample cube mesh
  const mesh = EditableMesh.createSampleCube();
  
  // Convert to Three.js BufferGeometry
  const geometry = toBufferGeometry(mesh, { normalsMode: 'vertex', includeColors: false });
  console.log('BufferGeometry:', geometry);
  
  // Convert to @react-three/fiber compatible geometry
  const fiberGeometry = toFiberGeometry(mesh, { normalsMode: 'vertex', includeColors: false });
  console.log('FiberGeometry:', fiberGeometry);
}

// Uncomment to run the sample
// sampleUsage();

export function toThreeMaterial(material: Material, options: ThreeMaterialOptions = {}): THREE.Material {
  const { textureLoader = new THREE.TextureLoader(), defaultColor = [1, 1, 1] } = options;

  if (material.type === 'pbr') {
    const pbrMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(...(material.color || defaultColor)),
      metalness: material.metalness ?? 0,
      roughness: material.roughness ?? 1,
      opacity: material.opacity ?? 1,
      transparent: material.transparent ?? false,
    });

    // Load textures if provided
    if (material.map) pbrMaterial.map = textureLoader.load(material.map);
    if (material.normalMap) pbrMaterial.normalMap = textureLoader.load(material.normalMap);
    if (material.roughnessMap) pbrMaterial.roughnessMap = textureLoader.load(material.roughnessMap);
    if (material.metalnessMap) pbrMaterial.metalnessMap = textureLoader.load(material.metalnessMap);
    if (material.aoMap) pbrMaterial.aoMap = textureLoader.load(material.aoMap);
    if (material.emissiveMap) pbrMaterial.emissiveMap = textureLoader.load(material.emissiveMap);

    return pbrMaterial;
  } else {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(...(material.color || defaultColor)),
      opacity: material.opacity ?? 1,
      transparent: material.transparent ?? false,
      map: material.map ? textureLoader.load(material.map) : undefined,
    });
  }
}

export function toThreeSkinnedMesh(mesh: EditableMesh, options: ThreeGeometryOptions & ThreeMaterialOptions = {}): THREE.SkinnedMesh {
  // Create geometry with skinning attributes
  const geometry = toThreeGeometry(mesh, options);

  // Collect bones and build hierarchy
  const meshBones = mesh.getBones();
  const boneMap = new Map<number, THREE.Bone>();
  meshBones.forEach(bone => {
    const threeBone = new THREE.Bone();
    threeBone.name = bone.name;
    threeBone.position.fromArray(bone.position);
    threeBone.quaternion.fromArray(bone.rotation);
    threeBone.scale.fromArray(bone.scale);
    boneMap.set(bone.id, threeBone);
  });
  // Set up parent-child relationships
  meshBones.forEach(bone => {
    const threeBone = boneMap.get(bone.id)!;
    if (bone.parentId !== undefined && boneMap.has(bone.parentId)) {
      boneMap.get(bone.parentId)!.add(threeBone);
    }
  });
  // Find root bones
  const rootBones = meshBones.filter(bone => bone.parentId === undefined).map(bone => boneMap.get(bone.id)!);

  // Build skeleton
  const bones = meshBones.map(bone => boneMap.get(bone.id)!);
  const skeleton = new THREE.Skeleton(bones);

  // Skin indices and weights
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  for (const vertex of mesh.getVertices()) {
    const weights: SkinWeight[] = (vertex as any).skinWeights || [];
    for (let i = 0; i < 4; i++) {
      if (weights[i]) {
        skinIndices.push(meshBones.findIndex(b => b.id === weights[i].boneId));
        skinWeights.push(weights[i].weight);
      } else {
        skinIndices.push(0);
        skinWeights.push(0);
      }
    }
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

  // Get the first material (if any)
  const material = toThreeMaterial(mesh.getMaterials()[0] || { id: 0, name: 'default', type: 'standard' }, options);
  const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
  rootBones.forEach(root => skinnedMesh.add(root));
  skinnedMesh.bind(skeleton);

  // Export animation clips
  (skinnedMesh as any).animationClips = mesh.getAnimationClips().map(clip => toThreeAnimationClip(clip, meshBones, boneMap));

  return skinnedMesh;
}

function toThreeAnimationClip(clip: MeshAnimationClip, meshBones: MeshBone[], boneMap: Map<number, THREE.Bone>): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    if (track.targetType === 'bone') {
      const bone = meshBones.find(b => b.id === track.targetId);
      if (!bone) continue;
      const threeBone = boneMap.get(bone.id);
      if (!threeBone) continue;
      const times = track.keyframes.map(kf => kf.time);
      const values = ([] as number[]).concat(...track.keyframes.map((kf: { time: number; value: number[] }) => kf.value));
      let propertyPath = threeBone.name;
      let property;
      switch (track.property) {
        case 'position': property = '.position'; break;
        case 'rotation': property = '.quaternion'; break;
        case 'scale': property = '.scale'; break;
        default: property = '.' + track.property; break;
      }
      tracks.push(new THREE.KeyframeTrack(`${propertyPath}${property}`, times, values));
    }
  }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
} 