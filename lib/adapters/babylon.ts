import { EditableMesh } from '../mesh/EditableMesh';
import { Material, MaterialLayer, UVMap, Bone as MeshBone, Skeleton as MeshSkeleton, SkinWeight, AnimationClip as MeshAnimationClip } from '../mesh/types';
import * as BABYLON from '@babylonjs/core';

export interface BabylonGeometryOptions {
  includeUVs?: boolean;
  includeNormals?: boolean;
  includeColors?: boolean;
  uvMapId?: number;
  normalsMode?: 'face' | 'vertex';
}

export interface BabylonMaterialOptions {
  textureLoader?: BABYLON.Texture;
  defaultColor?: [number, number, number];
}

export function toBabylonMaterial(material: Material, options: BabylonMaterialOptions = {}): BABYLON.Material {
  const { textureLoader, defaultColor = [1, 1, 1] } = options;

  if (material.type === 'pbr') {
    const pbrMaterial = new BABYLON.PBRMaterial(material.name);
    pbrMaterial.albedoColor = new BABYLON.Color3(...(material.color || defaultColor));
    pbrMaterial.metallic = material.metalness ?? 0;
    pbrMaterial.roughness = material.roughness ?? 1;
    pbrMaterial.alpha = material.opacity ?? 1;
    pbrMaterial.transparencyMode = material.transparent ? BABYLON.Material.MATERIAL_ALPHABLEND : BABYLON.Material.MATERIAL_OPAQUE;

    // Load textures if provided
    if (material.map) pbrMaterial.albedoTexture = new BABYLON.Texture(material.map);
    if (material.normalMap) pbrMaterial.bumpTexture = new BABYLON.Texture(material.normalMap);
    if (material.roughnessMap) pbrMaterial.roughnessTexture = new BABYLON.Texture(material.roughnessMap);
    if (material.metalnessMap) pbrMaterial.metallicTexture = new BABYLON.Texture(material.metalnessMap);
    if (material.aoMap) pbrMaterial.ambientTexture = new BABYLON.Texture(material.aoMap);
    if (material.emissiveMap) pbrMaterial.emissiveTexture = new BABYLON.Texture(material.emissiveMap);

    // Handle material layers
    if (material.layers) {
      material.layers.forEach(layer => {
        switch (layer.type) {
          case 'diffuse':
            if (layer.texture) {
              pbrMaterial.albedoTexture = new BABYLON.Texture(layer.texture);
            }
            if (layer.color) {
              pbrMaterial.albedoColor = new BABYLON.Color3(...layer.color);
            }
            break;
          case 'normal':
            if (layer.texture) {
              pbrMaterial.bumpTexture = new BABYLON.Texture(layer.texture);
            }
            break;
          // Add other layer types as needed
        }
      });
    }

    return pbrMaterial;
  } else {
    const standardMaterial = new BABYLON.StandardMaterial(material.name);
    standardMaterial.diffuseColor = new BABYLON.Color3(...(material.color || defaultColor));
    standardMaterial.alpha = material.opacity ?? 1;
    standardMaterial.transparencyMode = material.transparent ? BABYLON.Material.MATERIAL_ALPHABLEND : BABYLON.Material.MATERIAL_OPAQUE;

    if (material.map) {
      standardMaterial.diffuseTexture = new BABYLON.Texture(material.map);
    }

    return standardMaterial;
  }
}

export function toBabylonMesh(mesh: EditableMesh, scene: BABYLON.Scene, options: BabylonGeometryOptions & BabylonMaterialOptions = {}): BABYLON.Mesh {
  const {
    includeUVs = true,
    includeNormals = true,
    includeColors = true,
    uvMapId,
    normalsMode = 'vertex'
  } = options;

  // Create vertex data
  const vertexData = new BABYLON.VertexData();
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];

  // Process vertices and faces
  for (const face of mesh.getFaces()) {
    const faceVertices = face.vertexIds.map(id => mesh.getVertex(id)!);
    const faceNormal = calculateFaceNormal(faceVertices);

    // Split quad into two triangles if necessary
    if (face.vertexIds.length === 4) {
      // First triangle
      addVertexData(face.vertexIds[0], face.vertexIds[1], face.vertexIds[2]);
      // Second triangle
      addVertexData(face.vertexIds[0], face.vertexIds[2], face.vertexIds[3]);
    } else {
      addVertexData(face.vertexIds[0], face.vertexIds[1], face.vertexIds[2]);
    }
  }

  // Set vertex data
  vertexData.positions = positions;
  vertexData.indices = indices;

  if (includeUVs && uvs.length > 0) {
    vertexData.uvs = uvs;
  }

  if (includeNormals && normals.length > 0) {
    vertexData.normals = normals;
  }

  if (includeColors && colors.length > 0) {
    vertexData.colors = colors;
  }

  // Create mesh
  const babylonMesh = new BABYLON.Mesh(mesh.name || 'mesh', scene);
  vertexData.applyToMesh(babylonMesh);

  // Apply materials
  const materials = Array.from(mesh.getMaterials()).map(material => toBabylonMaterial(material, options));
  if (materials.length === 1) {
    babylonMesh.material = materials[0];
  } else {
    // Create multi-material
    const multiMaterial = new BABYLON.MultiMaterial('multi', scene);
    multiMaterial.subMaterials = materials;
    babylonMesh.material = multiMaterial;
  }

  return babylonMesh;

  function addVertexData(v1: number, v2: number, v3: number) {
    const vertices = [mesh.getVertex(v1)!, mesh.getVertex(v2)!, mesh.getVertex(v3)!];
    const baseIndex = positions.length / 3;

    // Add positions
    vertices.forEach(vertex => {
      positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
    });

    // Add indices
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2);

    // Add UVs if available
    if (includeUVs && uvMapId !== undefined) {
      vertices.forEach(vertex => {
        const uv = mesh.getVertexUV(vertex.id, uvMapId);
        if (uv) {
          uvs.push(uv[0], uv[1]);
        } else {
          uvs.push(0, 0);
        }
      });
    }

    // Add normals
    if (includeNormals) {
      if (normalsMode === 'face') {
        // Use face normal for all vertices
        for (let i = 0; i < 3; i++) {
          normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
        }
      } else {
        // Use vertex normals (if available) or face normal
        vertices.forEach(vertex => {
          if (vertex.normal) {
            normals.push(vertex.normal.x, vertex.normal.y, vertex.normal.z);
          } else {
            normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
          }
        });
      }
    }

    // Add colors if available
    if (includeColors) {
      vertices.forEach(vertex => {
        if (vertex.color) {
          colors.push(...vertex.color);
        } else {
          colors.push(1, 1, 1);
        }
      });
    }
  }
}

function calculateFaceNormal(vertices: { position: { x: number; y: number; z: number } }[]): { x: number; y: number; z: number } {
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

  // Normalize
  const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length
  };
}

export function toBabylonSkinnedMesh(mesh: EditableMesh, scene: BABYLON.Scene, options: BabylonGeometryOptions & BabylonMaterialOptions = {}): BABYLON.Mesh {
  // Create mesh geometry
  const babylonMesh = toBabylonMesh(mesh, scene, options);

  // Collect bones and build hierarchy
  const meshBones = mesh.getBones();
  const boneMap = new Map<number, BABYLON.Bone>();
  meshBones.forEach(bone => {
    const parentBone = bone.parentId !== undefined ? boneMap.get(bone.parentId) : null;
    const babylonBone = new BABYLON.Bone(bone.name, null, parentBone, BABYLON.Matrix.Identity());
    // Set local transform (position, rotation, scale)
    babylonBone.setPositionFromLocal(new BABYLON.Vector3(...bone.position));
    babylonBone.setRotationQuaternion(BABYLON.Quaternion.FromArray(bone.rotation));
    babylonBone.setScale(new BABYLON.Vector3(...bone.scale));
    boneMap.set(bone.id, babylonBone);
  });
  // Build skeleton
  const bones = meshBones.map(bone => boneMap.get(bone.id)!);
  const skeleton = new BABYLON.Skeleton('skeleton', 'skeletonId', scene);
  bones.forEach(bone => skeleton.bones.push(bone));
  babylonMesh.skeleton = skeleton;

  // Skin indices and weights
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  for (const vertex of mesh.getVertices()) {
    const weights: SkinWeight[] = (vertex as any).skinWeights || [];
    for (let i = 0; i < 4; i++) {
      if (weights[i] && weights[i].boneId !== undefined && weights[i].weight !== undefined) {
        const boneIndex = meshBones.findIndex(b => b.id === weights[i].boneId);
        skinIndices.push(boneIndex >= 0 ? boneIndex : 0);
        skinWeights.push(weights[i].weight);
      } else {
        skinIndices.push(0);
        skinWeights.push(0);
      }
    }
  }
  if (skinIndices.length > 0 && skinWeights.length > 0) {
    babylonMesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, skinIndices, false, 4);
    babylonMesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, skinWeights, false, 4);
  }

  // Export animation clips
  (babylonMesh as any).animationClips = mesh.getAnimationClips().map(clip => toBabylonAnimationGroup(clip, meshBones, boneMap, scene));

  return babylonMesh;
}

function toBabylonAnimationGroup(clip: MeshAnimationClip, meshBones: MeshBone[], boneMap: Map<number, BABYLON.Bone>, scene: BABYLON.Scene): BABYLON.AnimationGroup {
  const group = new BABYLON.AnimationGroup(clip.name, scene);
  for (const track of clip.tracks) {
    if (track.targetType === 'bone') {
      const bone = meshBones.find(b => b.id === track.targetId);
      if (!bone) continue;
      const babylonBone = boneMap.get(bone.id);
      if (!babylonBone) continue;
      let property;
      switch (track.property) {
        case 'position': property = 'position'; break;
        case 'rotation': property = 'rotationQuaternion'; break;
        case 'scale': property = 'scaling'; break;
        default: property = track.property; break;
      }
      const animation = new BABYLON.Animation(
        `${babylonBone.name}_${property}`,
        property,
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      const keys = track.keyframes.map(kf => ({ frame: kf.time * 30, value: BABYLON.Vector3.FromArray(kf.value) }));
      animation.setKeys(keys);
      group.addTargetedAnimation(animation, babylonBone);
    }
  }
  return group;
}
