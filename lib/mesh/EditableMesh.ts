import {
  ID,
  Vector3,
  Vector2,
  Vertex,
  Edge,
  Face,
  Material,
  Selection,
  SelectionType,
  BoxSelection,
  UVMap,
  Bone,
  Skeleton,
  SkinWeight,
  AnimationClip
} from './types';

/**
 * Core mesh editing class that manages vertices, edges, faces, UVs, and materials.
 * This class provides a robust foundation for 3D mesh manipulation with built-in
 * validation and error handling.
 * 
 * @example
 * ```typescript
 * const mesh = new EditableMesh();
 * const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
 * const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
 * const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
 * const face = mesh.addFace([v1, v2, v3]);
 * ```
 */
export class EditableMesh {
  // Core mesh data structures
  private vertices: Map<ID, Vertex>;  // Maps vertex IDs to vertex data
  private edges: Map<ID, Edge>;       // Maps edge IDs to edge data
  private faces: Map<ID, Face>;       // Maps face IDs to face data
  private materials: Map<ID, Material>; // Maps material IDs to material data
  private uvMaps: Map<ID, UVMap>;     // Maps UV map IDs to UV data
  private bones: Map<ID, Bone>;       // Maps bone IDs to bone data
  private skeletons: Map<ID, Skeleton>; // Maps skeleton IDs to skeleton data
  private animationClips: Map<ID, AnimationClip>; // Maps animation clip IDs to clip data
  private nextId: ID;                 // Next available ID for new elements

  constructor() {
    // Initialize all data structures
    this.vertices = new Map();
    this.edges = new Map();
    this.faces = new Map();
    this.materials = new Map();
    this.uvMaps = new Map();
    this.bones = new Map();
    this.skeletons = new Map();
    this.animationClips = new Map();
    this.nextId = 0;
  }

  /**
   * Generates a new unique ID
   */
  private generateId(): ID {
    return this.nextId++;
  }

  /**
   * Adds a new vertex to the mesh
   */
  public addVertex(position: Vector3, color?: [number, number, number]): ID {
    const id = this.generateId();
    this.vertices.set(id, { id, position, color });
    return id;
  }

  /**
   * Removes a vertex and all connected edges and faces
   */
  public removeVertex(id: ID): void {
    const vertex = this.vertices.get(id);
    if (!vertex) return;

    // Find all edges connected to this vertex
    const connectedEdges = Array.from(this.edges.values())
      .filter(edge => edge.vertexIds.includes(id));

    // Remove all connected faces
    connectedEdges.forEach(edge => {
      edge.faceIds.forEach(faceId => {
        this.removeFace(faceId);
      });
    });

    // Remove all connected edges
    connectedEdges.forEach(edge => {
      this.edges.delete(edge.id);
    });

    // Finally remove the vertex
    this.vertices.delete(id);
  }

  /**
   * Moves a vertex to a new position
   */
  public moveVertex(id: ID, newPosition: Vector3): void {
    const vertex = this.vertices.get(id);
    if (!vertex) return;
    vertex.position = newPosition;
  }

  /**
   * Adds a new edge between two vertices
   */
  public addEdge(vertexId1: ID, vertexId2: ID): ID {
    if (!this.vertices.has(vertexId1) || !this.vertices.has(vertexId2)) {
      throw new Error('Invalid vertex IDs');
    }

    const id = this.generateId();
    this.edges.set(id, {
      id,
      vertexIds: [vertexId1, vertexId2],
      faceIds: []
    });
    return id;
  }

  /**
   * Adds a new face with the given vertices.
   * Creates necessary edges and validates the input data.
   * 
   * @param vertexIds - Array of vertex IDs that form the face
   * @param materialId - Optional material ID to assign to the face
   * @returns The ID of the newly created face
   * @throws Error if vertices are invalid or face cannot be created
   * 
   * @example
   * ```typescript
   * // Create a triangular face
   * const faceId = mesh.addFace([v1, v2, v3]);
   * 
   * // Create a face with material
   * const faceId = mesh.addFace([v1, v2, v3, v4], materialId);
   * ```
   */
  public addFace(vertexIds: ID[], materialId: ID | null = null): ID {
    // Validate input
    if (!vertexIds || vertexIds.length < 3) {
      throw new Error('Face must have at least 3 vertices');
    }

    // Validate vertices exist and have valid positions
    vertexIds.forEach(id => {
      const vertex = this.vertices.get(id);
      if (!vertex) {
        throw new Error(`Invalid vertex ID: ${id}`);
      }
      if (!vertex.position || typeof vertex.position.x !== 'number' || 
          typeof vertex.position.y !== 'number' || typeof vertex.position.z !== 'number') {
        throw new Error(`Vertex ${id} has invalid position data`);
      }
    });

    // Generate new face ID and prepare edge data
    const id = this.generateId();
    const edgeIds: ID[] = [];

    // Create or reuse edges for the face
    for (let i = 0; i < vertexIds.length; i++) {
      const v1 = vertexIds[i];
      const v2 = vertexIds[(i + 1) % vertexIds.length];
      // Check if an edge already exists between v1 and v2 (in either order)
      let edgeId: ID | undefined = undefined;
      for (const edge of this.edges.values()) {
        if (
          (edge.vertexIds[0] === v1 && edge.vertexIds[1] === v2) ||
          (edge.vertexIds[0] === v2 && edge.vertexIds[1] === v1)
        ) {
          edgeId = edge.id;
          // Add this face to the edge's faceIds if not already present
          if (!edge.faceIds.includes(id)) {
            edge.faceIds.push(id);
          }
          break;
        }
      }
      if (edgeId === undefined) {
        edgeId = this.addEdge(v1, v2);
        const edge = this.edges.get(edgeId);
        if (edge) {
          edge.faceIds.push(id);
        }
      }
      edgeIds.push(edgeId);
    }

    // Create default UVs (can be updated later)
    const uvs: Vector2[] = vertexIds.map(() => ({ u: 0, v: 0 }));

    // Create and store the face
    this.faces.set(id, {
      id,
      vertexIds,
      edgeIds,
      materialId,
      uvs
    });

    return id;
  }

  /**
   * Removes a face from the mesh
   */
  public removeFace(id: ID): void {
    const face = this.faces.get(id);
    if (!face) return;

    // Remove face reference from edges
    face.edgeIds.forEach(edgeId => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        edge.faceIds = edge.faceIds.filter(fid => fid !== id);
      }
    });

    this.faces.delete(id);
  }

  /**
   * Updates UV coordinates for a face
   */
  public updateFaceUVs(faceId: ID, uvs: Vector2[]): void {
    const face = this.faces.get(faceId);
    if (!face) return;
    if (uvs.length !== face.vertexIds.length) {
      throw new Error('UV count must match vertex count');
    }
    face.uvs = uvs;
  }

  /**
   * Assigns a material to a face.
   * Validates both face and material existence.
   * 
   * @param faceId - ID of the face to assign material to
   * @param materialId - ID of the material to assign, or null to remove material
   * 
   * @example
   * ```typescript
   * // Assign a material to a face
   * mesh.assignMaterial(faceId, materialId);
   * 
   * // Remove material from a face
   * mesh.assignMaterial(faceId, null);
   * ```
   */
  public assignMaterial(faceId: ID, materialId: ID | null): void {
    const face = this.faces.get(faceId);
    if (!face) {
      console.warn(`Cannot assign material: Face ${faceId} not found`);
      return;
    }
    if (materialId !== null && !this.materials.has(materialId)) {
      console.warn(`Cannot assign material: Material ${materialId} not found`);
      return;
    }
    face.materialId = materialId;
  }

  /**
   * Returns an iterator for all vertices in the mesh.
   */
  public getVertices(): IterableIterator<Vertex> {
    return this.vertices.values();
  }

  /**
   * Returns an iterator for all faces in the mesh.
   */
  public getFaces(): IterableIterator<Face> {
    return this.faces.values();
  }

  /**
   * Retrieves a vertex by its ID.
   * @param id - The ID of the vertex to retrieve.
   * @returns The vertex object if found, otherwise undefined.
   */
  public getVertex(id: ID): Vertex | undefined {
    return this.vertices.get(id);
  }

  /**
   * Returns an iterator for all edges in the mesh.
   */
  public getEdges(): IterableIterator<Edge> {
    return this.edges.values();
  }

  /**
   * Adds a new material to the mesh
   */
  public addMaterial(
    name: string,
    materialProps: Omit<Partial<Material>, 'id' | 'name' | 'type'> & { type?: 'standard' | 'pbr' } = {}
  ): ID {
    const id = this.generateId();
    const newMaterial: Material = {
      id,
      name,
      type: materialProps.type || 'standard', // Default type if not provided
      ...materialProps,
    };
    this.materials.set(id, newMaterial);
    return id;
  }

  /**
   * Selects elements within a box selection
   */
  public selectBox(box: BoxSelection, type: SelectionType): Selection {
    const ids = new Set<ID>();

    switch (type) {
      case 'vertex':
        this.vertices.forEach(vertex => {
          if (this.isPointInBox(vertex.position, box)) {
            ids.add(vertex.id);
          }
        });
        break;
      case 'edge':
        this.edges.forEach(edge => {
          const v1 = this.vertices.get(edge.vertexIds[0])!;
          const v2 = this.vertices.get(edge.vertexIds[1])!;
          if (this.isPointInBox(v1.position, box) || this.isPointInBox(v2.position, box)) {
            ids.add(edge.id);
          }
        });
        break;
      case 'face':
        this.faces.forEach(face => {
          const vertices = face.vertexIds.map(id => this.vertices.get(id)!);
          if (vertices.some(v => this.isPointInBox(v.position, box))) {
            ids.add(face.id);
          }
        });
        break;
    }

    return { type, ids };
  }

  /**
   * Checks if a point is within a box selection
   */
  private isPointInBox(point: Vector3, box: BoxSelection): boolean {
    return (
      point.x >= box.min.x && point.x <= box.max.x &&
      point.y >= box.min.y && point.y <= box.max.y &&
      point.z >= box.min.z && point.z <= box.max.z
    );
  }

  /**
   * Deserializes a mesh from JSON data.
   * Performs comprehensive validation of the input data.
   * 
   * @param json - JSON string containing mesh data
   * @returns A new EditableMesh instance
   * @throws Error if JSON is invalid or data format is incorrect
   * 
   * @example
   * ```typescript
   * const json = '{"vertices":[...], "faces":[...]}';
   * const mesh = EditableMesh.fromJSON(json);
   * ```
   */
  public static fromJSON(json: string): EditableMesh {
    // Validate input
    if (!json) {
      throw new Error('Invalid JSON data');
    }

    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid mesh data format');
    }

    // Create new mesh instance
    const mesh = new EditableMesh();
    
    // Set next ID with fallback
    mesh.nextId = data.nextId || 0;
    
    // Process vertices
    if (Array.isArray(data.vertices)) {
      data.vertices.forEach((v: Vertex) => {
        if (v && v.id !== undefined && v.position) {
          mesh.vertices.set(v.id, v);
        }
      });
    }
    
    // Process edges
    if (Array.isArray(data.edges)) {
      data.edges.forEach((e: Edge) => {
        if (e && e.id !== undefined && Array.isArray(e.vertexIds)) {
          mesh.edges.set(e.id, e);
        }
      });
    }
    
    // Process faces
    if (Array.isArray(data.faces)) {
      data.faces.forEach((f: Face) => {
        if (f && f.id !== undefined && Array.isArray(f.vertexIds)) {
          mesh.faces.set(f.id, f);
        }
      });
    }
    
    // Process materials
    if (Array.isArray(data.materials)) {
      data.materials.forEach((m: Material) => {
        if (m && m.id !== undefined && m.name) {
          mesh.materials.set(m.id, m);
        }
      });
    }
    
    return mesh;
  }

  /**
   * Computes per-face and per-vertex normals for the mesh.
   * For quads, averages the normals of the two triangles.
   */
  public computeNormals(): { faceNormals: Map<ID, Vector3>, vertexNormals: Map<ID, Vector3> } {
    const faceNormals = new Map<ID, Vector3>();
    const vertexNormals = new Map<ID, Vector3>();

    // Compute face normals
    this.faces.forEach(face => {
      const vertices = face.vertexIds.map(id => this.vertices.get(id)!);
      let normal: Vector3;
      if (face.vertexIds.length === 3) {
        normal = this.calculateFaceNormal(vertices);
      } else if (face.vertexIds.length === 4) {
        // Split quad into two triangles and average their normals
        const tri1 = [vertices[0], vertices[1], vertices[2]];
        const tri2 = [vertices[0], vertices[2], vertices[3]];
        const n1 = this.calculateFaceNormal(tri1);
        const n2 = this.calculateFaceNormal(tri2);
        normal = {
          x: (n1.x + n2.x) / 2,
          y: (n1.y + n2.y) / 2,
          z: (n1.z + n2.z) / 2
        };
        // Normalize
        const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
        normal = { x: normal.x / len, y: normal.y / len, z: normal.z / len };
      } else {
        throw new Error('Only tris and quads are supported');
      }
      faceNormals.set(face.id, normal);
    });

    // Compute vertex normals by averaging connected face normals
    this.vertices.forEach((vertex, id) => {
      let nx = 0, ny = 0, nz = 0, count = 0;
      this.faces.forEach(face => {
        if (face.vertexIds.includes(id)) {
          const n = faceNormals.get(face.id)!;
          nx += n.x; ny += n.y; nz += n.z; count++;
        }
      });
      if (count > 0) {
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        vertexNormals.set(id, { x: nx / len, y: ny / len, z: nz / len });
      }
    });

    return { faceNormals, vertexNormals };
  }

  /**
   * Helper to calculate the normal of a triangle face.
   */
  private calculateFaceNormal(vertices: { position: Vector3 }[]): Vector3 {
    if (vertices.length < 3) throw new Error('Need at least 3 vertices');
    const v1 = vertices[0].position;
    const v2 = vertices[1].position;
    const v3 = vertices[2].position;
    const edge1 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
    const edge2 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };
    const normal = {
      x: edge1.y * edge2.z - edge1.z * edge2.y,
      y: edge1.z * edge2.x - edge1.x * edge2.z,
      z: edge1.x * edge2.y - edge1.y * edge2.x
    };
    const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    return { x: normal.x / len, y: normal.y / len, z: normal.z / len };
  }

  /**
   * Creates a sample cube mesh for testing.
   * Returns the created EditableMesh instance.
   */
  public static createSampleCube(): EditableMesh {
    const mesh = new EditableMesh();
    const defaultColor: [number, number, number] = [1, 1, 1]; // White color

    // Create 8 vertices for the cube
    const v0 = mesh.addVertex({ x: 0, y: 0, z: 0 }, defaultColor);
    const v1 = mesh.addVertex({ x: 1, y: 0, z: 0 }, defaultColor);
    const v2 = mesh.addVertex({ x: 1, y: 1, z: 0 }, defaultColor);
    const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 }, defaultColor);
    const v4 = mesh.addVertex({ x: 0, y: 0, z: 1 }, defaultColor);
    const v5 = mesh.addVertex({ x: 1, y: 0, z: 1 }, defaultColor);
    const v6 = mesh.addVertex({ x: 1, y: 1, z: 1 }, defaultColor);
    const v7 = mesh.addVertex({ x: 0, y: 1, z: 1 }, defaultColor);

    // Create 6 faces (quads)
    mesh.addFace([v0, v1, v2, v3]);
    mesh.addFace([v1, v5, v6, v2]);
    mesh.addFace([v5, v4, v7, v6]);
    mesh.addFace([v4, v0, v3, v7]);
    mesh.addFace([v3, v2, v6, v7]);
    mesh.addFace([v4, v5, v1, v0]);

    return mesh;
  }

  /**
   * Creates a new UV map
   */
  public createUVMap(name: string): ID {
    const id = this.generateId();
    this.uvMaps.set(id, {
      id,
      name,
      coordinates: new Map()
    });
    return id;
  }

  /**
   * Sets UV coordinates for a vertex in a specific UV map
   */
  public setVertexUV(vertexId: ID, uvMapId: ID, u: number, v: number): void {
    const uvMap = this.uvMaps.get(uvMapId);
    if (!uvMap) {
      throw new Error(`UV map ${uvMapId} not found`);
    }
    if (!this.vertices.has(vertexId)) {
      throw new Error(`Vertex ${vertexId} not found`);
    }
    uvMap.coordinates.set(vertexId, [u, v]);
  }

  /**
   * Gets UV coordinates for a vertex in a specific UV map
   */
  public getVertexUV(vertexId: ID, uvMapId: ID): [number, number] | undefined {
    const uvMap = this.uvMaps.get(uvMapId);
    if (!uvMap) {
      throw new Error(`UV map ${uvMapId} not found`);
    }
    return uvMap.coordinates.get(vertexId);
  }

  /**
   * Creates a new material with PBR properties
   */
  public createPBRMaterial(name: string, options: {
    color?: [number, number, number];
    metalness?: number;
    roughness?: number;
    opacity?: number;
    transparent?: boolean;
    map?: string;
    normalMap?: string;
    roughnessMap?: string;
    metalnessMap?: string;
    aoMap?: string;
    emissiveMap?: string;
    uvSet?: number;
  } = {}): ID {
    const id = this.generateId();
    this.materials.set(id, {
      id,
      name,
      type: 'pbr',
      ...options
    });
    return id;
  }

  /**
   * Creates a new standard material
   */
  public createStandardMaterial(name: string, options: {
    color?: [number, number, number];
    opacity?: number;
    transparent?: boolean;
    map?: string;
    uvSet?: number;
  } = {}): ID {
    const id = this.generateId();
    this.materials.set(id, {
      id,
      name,
      type: 'standard',
      ...options
    });
    return id;
  }

  /**
   * Updates a material's properties
   */
  public updateMaterial(id: ID, properties: Partial<Material>): void {
    const material = this.materials.get(id);
    if (!material) {
      throw new Error(`Material ${id} not found`);
    }
    this.materials.set(id, { ...material, ...properties });
  }

  /**
   * Gets all UV maps
   */
  public getUVMaps(): UVMap[] {
    return Array.from(this.uvMaps.values());
  }

  /**
   * Gets a specific UV map
   */
  public getUVMap(id: ID): UVMap | undefined {
    return this.uvMaps.get(id);
  }

  /**
   * Adds a new bone
   */
  public addBone(bone: Omit<Bone, 'id'>): ID {
    const id = this.generateId();
    this.bones.set(id, { ...bone, id });
    return id;
  }

  /**
   * Gets a bone by ID
   */
  public getBone(id: ID): Bone | undefined {
    return this.bones.get(id);
  }

  /**
   * Removes a bone by ID
   */
  public removeBone(id: ID): void {
    this.bones.delete(id);
  }

  /**
   * Returns all bones
   */
  public getBones(): Bone[] {
    return Array.from(this.bones.values());
  }

  /**
   * Adds a new skeleton
   */
  public addSkeleton(skeleton: Omit<Skeleton, 'id'>): ID {
    const id = this.generateId();
    this.skeletons.set(id, { ...skeleton, id });
    return id;
  }

  /**
   * Gets a skeleton by ID
   */
  public getSkeleton(id: ID): Skeleton | undefined {
    return this.skeletons.get(id);
  }

  /**
   * Removes a skeleton by ID
   */
  public removeSkeleton(id: ID): void {
    this.skeletons.delete(id);
  }

  /**
   * Returns all skeletons
   */
  public getSkeletons(): Skeleton[] {
    return Array.from(this.skeletons.values());
  }

  /**
   * Adds an animation clip
   */
  public addAnimationClip(clip: Omit<AnimationClip, 'id'>): ID {
    const id = this.generateId();
    this.animationClips.set(id, { ...clip, id });
    return id;
  }

  /**
   * Gets an animation clip by ID
   */
  public getAnimationClip(id: ID): AnimationClip | undefined {
    return this.animationClips.get(id);
  }

  /**
   * Removes an animation clip by ID
   */
  public removeAnimationClip(id: ID): void {
    this.animationClips.delete(id);
  }

  /**
   * Returns all animation clips
   */
  public getAnimationClips(): AnimationClip[] {
    return Array.from(this.animationClips.values());
  }

  /**
   * Sets skin weights for a vertex
   */
  public setVertexSkinWeights(vertexId: ID, skinWeights: SkinWeight[]): void {
    const vertex = this.vertices.get(vertexId);
    if (!vertex) throw new Error('Vertex not found');
    (vertex as any).skinWeights = skinWeights;
  }

  /**
   * Gets skin weights for a vertex
   */
  public getVertexSkinWeights(vertexId: ID): SkinWeight[] | undefined {
    const vertex = this.vertices.get(vertexId);
    if (!vertex) return undefined;
    return (vertex as any).skinWeights;
  }

  /**
   * Returns all materials in the mesh
   */
  public getMaterials(): Material[] {
    return Array.from(this.materials.values());
  }

  /**
   * Gets a face by its ID.
   * @param id - The face ID.
   * @returns The face object, or undefined if not found.
   */
  public getFace(id: ID): Face | undefined {
    return this.faces.get(id);
  }

  /**
   * Creates a material from a preset.
   * @param preset - The material preset ('metal', 'glass', or 'plastic').
   * @param name - The name for the new material.
   * @returns The ID of the created material.
   */
  public addMaterialFromPreset(preset: 'metal' | 'glass' | 'plastic', name: string): ID {
    switch (preset) {
      case 'metal':
        return this.createPBRMaterial(name, {
          metalness: 1.0,
          roughness: 0.2
        });
      case 'glass':
        return this.createPBRMaterial(name, {
          metalness: 0.0,
          roughness: 0.0,
          opacity: 0.5,
          transparent: true
        });
      case 'plastic':
        return this.createPBRMaterial(name, {
          metalness: 0.0,
          roughness: 0.5
        });
      default:
        throw new Error(`Unknown material preset: ${preset}`);
    }
  }

  /**
   * Creates a new animation clip.
   * @param name - The name of the animation clip.
   * @param duration - The duration of the clip in seconds.
   * @returns The ID of the created animation clip.
   */
  public createAnimationClip(name: string, duration: number): ID {
    const id = this.generateId();
    this.animationClips.set(id, {
      id,
      name,
      duration,
      tracks: []
    });
    return id;
  }

  /**
   * Adds a keyframe to an animation track.
   * If the track does not exist, it will be created.
   * @param clipId - The animation clip ID.
   * @param targetId - The target bone or morph ID.
   * @param property - The property to animate ('position', 'rotation', or 'scale').
   * @param time - The time (in seconds) for the keyframe.
   * @param value - The value for the keyframe (e.g., position array).
   */
  public addKeyframeToTrack(
    clipId: ID,
    targetId: ID,
    property: 'position' | 'rotation' | 'scale',
    time: number,
    value: number[]
  ): void {
    const clip = this.animationClips.get(clipId);
    if (!clip) {
      throw new Error(`Animation clip ${clipId} not found`);
    }

    // Find or create track for this target and property
    let track = clip.tracks.find(
      t => t.targetId === targetId && t.property === property
    );

    if (!track) {
      track = {
        targetType: 'bone',
        targetId,
        property,
        keyframes: []
      };
      clip.tracks.push(track);
    }

    // Add keyframe
    track.keyframes.push({ time, value });
    
    // Sort keyframes by time
    track.keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * Paints skin weights for a set of vertices.
   * @param vertexIds - Array of vertex IDs to paint.
   * @param boneId - The bone ID to assign weights to.
   * @param weight - The weight value to assign (0.0 to 1.0).
   */
  public paintWeights(vertexIds: ID[], boneId: ID, weight: number): void {
    if (!this.bones.has(boneId)) {
      throw new Error(`Bone ${boneId} not found`);
    }

    vertexIds.forEach(vertexId => {
      if (!this.vertices.has(vertexId)) {
        throw new Error(`Vertex ${vertexId} not found`);
      }

      const currentWeights = this.getVertexSkinWeights(vertexId) || [];
      const existingWeightIndex = currentWeights.findIndex(w => w.boneId === boneId);

      if (existingWeightIndex >= 0) {
        currentWeights[existingWeightIndex].weight = weight;
      } else {
        currentWeights.push({ boneId, weight });
      }

      this.setVertexSkinWeights(vertexId, currentWeights);
    });
  }

  /**
   * Gets an edge by its vertex IDs.
   * @param vertexId1 - First vertex ID
   * @param vertexId2 - Second vertex ID
   * @returns The edge object, or undefined if not found
   */
  public getEdge(vertexId1: ID, vertexId2: ID): Edge | undefined {
    for (const edge of this.edges.values()) {
      if ((edge.vertexIds[0] === vertexId1 && edge.vertexIds[1] === vertexId2) ||
          (edge.vertexIds[0] === vertexId2 && edge.vertexIds[1] === vertexId1)) {
        return edge;
      }
    }
    return undefined;
  }

  /**
   * Creates a deep copy of the mesh.
   * @returns A new EditableMesh instance with copied data
   */
  public clone(): EditableMesh {
    const clone = new EditableMesh();
    clone.nextId = this.nextId;

    // Copy vertices
    this.vertices.forEach((vertex, id) => {
      clone.vertices.set(id, { ...vertex });
    });

    // Copy edges
    this.edges.forEach((edge, id) => {
      clone.edges.set(id, { ...edge });
    });

    // Copy faces
    this.faces.forEach((face, id) => {
      clone.faces.set(id, { ...face });
    });

    // Copy materials
    this.materials.forEach((material, id) => {
      clone.materials.set(id, { ...material });
    });

    // Copy UV maps
    this.uvMaps.forEach((uvMap, id) => {
      clone.uvMaps.set(id, { ...uvMap });
    });

    // Copy bones
    this.bones.forEach((bone, id) => {
      clone.bones.set(id, { ...bone });
    });

    // Copy skeletons
    this.skeletons.forEach((skeleton, id) => {
      clone.skeletons.set(id, { ...skeleton });
    });

    // Copy animation clips
    this.animationClips.forEach((clip, id) => {
      clone.animationClips.set(id, { ...clip });
    });

    return clone;
  }
} 