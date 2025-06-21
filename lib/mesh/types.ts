/**
 * Unique identifier for mesh elements
 */
export type ID = number;

/**
 * 3D vector coordinates
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 2D vector coordinates for UVs
 */
export interface Vector2 {
  u: number;
  v: number;
}

/**
 * Vertex in the mesh
 */
export interface Vertex {
  id: ID;
  position: Vector3;
  color?: [number, number, number];
}

/**
 * Edge in the mesh
 */
export interface Edge {
  id: ID;
  vertexIds: [ID, ID];
  faceIds: ID[];
}

/**
 * Face in the mesh
 */
export interface Face {
  id: ID;
  vertexIds: ID[];
  edgeIds: ID[];
  materialId: ID | null;
  uvs: Vector2[];
}

/**
 * Material layer properties
 */
export interface MaterialLayer {
  id: ID;
  name: string;
  type: 'diffuse' | 'normal' | 'roughness' | 'metalness' | 'ao' | 'emissive';
  texture?: string;
  color?: [number, number, number];
  opacity?: number;
  blendMode?: 'multiply' | 'add' | 'subtract' | 'overlay';
  uvSet?: number;
}

/**
 * Material properties
 *
 * type: 'standard' for basic materials, 'pbr' for physically-based rendering.
 * For PBR, use color, metalness, roughness, and optional texture maps.
 *
 * Example (PBR):
 * {
 *   id: 'mat1',
 *   name: 'Metal',
 *   type: 'pbr',
 *   color: [0.7, 0.7, 0.7],
 *   metalness: 1,
 *   roughness: 0.2,
 *   map: 'albedo.png',
 *   normalMap: 'normal.png',
 *   ...
 * }
 */
export interface Material {
  id: ID;
  name: string;
  type: 'standard' | 'pbr';
  // Basic properties
  color?: [number, number, number];
  opacity?: number;
  transparent?: boolean;
  // PBR properties
  metalness?: number;
  roughness?: number;
  // Texture maps
  map?: string;           // Diffuse/albedo texture
  normalMap?: string;     // Normal map
  roughnessMap?: string;  // Roughness map
  metalnessMap?: string;  // Metalness map
  aoMap?: string;         // Ambient occlusion map
  emissiveMap?: string;   // Emissive map
  // UV sets
  uvSet?: number;         // Which UV set to use (0 for primary, 1 for secondary)
  // Material layers
  layers?: MaterialLayer[];
}

/**
 * Selection types
 */
export type SelectionType = 'vertex' | 'edge' | 'face';

/**
 * Selection mode
 */
export type SelectionMode = 'single' | 'multi' | 'box';

/**
 * Selection state
 */
export interface Selection {
  type: SelectionType;
  ids: Set<ID>;
}

/**
 * Box selection bounds
 */
export interface BoxSelection {
  min: Vector3;
  max: Vector3;
}

export interface UVTransform {
  translation: [number, number];
  rotation: number;
  scale: [number, number];
}

export interface UVMap {
  id: ID;
  name: string;
  coordinates: Map<ID, [number, number]>; // Maps vertex IDs to UV coordinates
  transform?: UVTransform;
  wrapMode?: 'repeat' | 'clamp' | 'mirror';
  // Texture coordinates for each face vertex
  faceUVs?: Map<ID, [number, number][]>; // Maps face IDs to arrays of UV coordinates
}

/**
 * Bone definition for skeletal animation
 */
export interface Bone {
  id: ID;
  name: string;
  parentId?: ID;
  children: ID[];
  // Local transform
  position: [number, number, number];
  rotation: [number, number, number, number]; // Quaternion
  scale: [number, number, number];
  // Inverse bind matrix (optional, for skinning)
  inverseBindMatrix?: number[];
}

/**
 * Skeleton: a collection of bones
 */
export interface Skeleton {
  id: ID;
  name: string;
  boneIds: ID[];
}

/**
 * Skin weights for a vertex
 * Assign up to 4 weights per vertex for skeletal animation.
 * Example:
 *   [ { boneId: 'b1', weight: 0.8 }, { boneId: 'b2', weight: 0.2 } ]
 */
export interface SkinWeight {
  boneId: ID;
  weight: number;
}

/**
 * Animation keyframe for a property
 * time: seconds, value: array (e.g., [x, y, z] for position)
 */
export interface Keyframe {
  time: number;
  value: number[];
}

/**
 * Animation track for a bone or morph target
 * property: 'position', 'rotation', 'scale', etc.
 * keyframes: sorted by time
 * Example:
 *   {
 *     targetType: 'bone',
 *     targetId: 'b1',
 *     property: 'position',
 *     keyframes: [
 *       { time: 0, value: [0,0,0] },
 *       { time: 1, value: [0,1,0] }
 *     ]
 *   }
 */
export interface AnimationTrack {
  targetType: 'bone' | 'morph';
  targetId: ID;
  property: 'position' | 'rotation' | 'scale' | string;
  keyframes: Keyframe[];
}

/**
 * Animation clip (set of tracks)
 * Example:
 *   {
 *     id: 'clip1',
 *     name: 'Wave',
 *     duration: 2.0,
 *     tracks: [ ... ]
 *   }
 */
export interface AnimationClip {
  id: ID;
  name: string;
  duration: number;
  tracks: AnimationTrack[];
}

/**
 * Preset PBR materials for convenience
 */
export type MaterialPreset = 'metal' | 'plastic' | 'glass' | 'matte';

export const MATERIAL_PRESETS: Record<MaterialPreset, Partial<Material>> = {
  metal: {
    type: 'pbr',
    color: [0.7, 0.7, 0.7],
    metalness: 1,
    roughness: 0.2,
  },
  plastic: {
    type: 'pbr',
    color: [0.2, 0.2, 0.2],
    metalness: 0,
    roughness: 0.5,
  },
  glass: {
    type: 'pbr',
    color: [0.8, 0.9, 1.0],
    metalness: 0,
    roughness: 0.01,
    opacity: 0.3,
    transparent: true,
  },
  matte: {
    type: 'pbr',
    color: [0.5, 0.5, 0.5],
    metalness: 0,
    roughness: 1,
  },
}; 