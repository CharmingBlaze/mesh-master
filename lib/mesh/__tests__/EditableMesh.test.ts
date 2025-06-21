import { EditableMesh } from '../EditableMesh';
import { Vector3 } from '../types';

describe('EditableMesh', () => {
  let mesh: EditableMesh;

  beforeEach(() => {
    mesh = new EditableMesh();
  });

  describe('Vertex Operations', () => {
    it('should add and retrieve vertices', () => {
      const pos: Vector3 = { x: 1, y: 2, z: 3 };
      const id = mesh.addVertex(pos);
      const vertex = mesh.getVertex(id);
      
      expect(vertex).toBeDefined();
      expect(vertex?.position).toEqual(pos);
    });

    it('should remove vertices', () => {
      const id = mesh.addVertex({ x: 0, y: 0, z: 0 });
      mesh.removeVertex(id);
      expect(mesh.getVertex(id)).toBeUndefined();
    });
  });

  describe('Face Operations', () => {
    it('should create faces from vertices', () => {
      const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
      const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
      const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
      
      const faceId = mesh.addFace([v1, v2, v3]);
      const face = mesh.getFace(faceId);
      
      expect(face).toBeDefined();
      expect(face?.vertexIds).toEqual([v1, v2, v3]);
    });

    it('should create edges when creating faces', () => {
      const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
      const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
      const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
      
      const faceId = mesh.addFace([v1, v2, v3]);
      const face = mesh.getFace(faceId);
      
      expect(face?.edgeIds.length).toBe(3);
    });
  });

  describe('Material Operations', () => {
    it('should create and assign materials', () => {
      const materialId = mesh.addMaterialFromPreset('metal', 'Test Metal');
      const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
      const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
      const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 });
      
      const faceId = mesh.addFace([v1, v2, v3]);
      mesh.assignMaterial(faceId, materialId);
      
      const face = mesh.getFace(faceId);
      expect(face?.materialId).toBe(materialId);
    });
  });

  describe('Animation Operations', () => {
    it('should create and manage animation clips', () => {
      const clipId = mesh.createAnimationClip('Test', 2.0);
      const boneId = mesh.addBone({
        name: 'TestBone',
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1],
        children: []
      });

      mesh.addKeyframeToTrack(clipId, boneId, 'position', 0, [0, 0, 0]);
      mesh.addKeyframeToTrack(clipId, boneId, 'position', 1, [0, 1, 0]);

      const clip = mesh.getAnimationClips().find(c => c.id === clipId);
      expect(clip).toBeDefined();
      expect(clip?.tracks.length).toBe(1);
      expect(clip?.tracks[0].keyframes.length).toBe(2);
    });
  });

  describe('Weight Painting', () => {
    it('should assign skin weights to vertices', () => {
      const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
      const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
      const boneId = mesh.addBone({
        name: 'TestBone',
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1],
        children: []
      });

      mesh.paintWeights([v1, v2], boneId, 0.8);
      
      const weights1 = mesh.getVertexSkinWeights(v1);
      const weights2 = mesh.getVertexSkinWeights(v2);
      
      expect(weights1).toBeDefined();
      expect(weights2).toBeDefined();
      expect(weights1?.[0].weight).toBe(0.8);
      expect(weights2?.[0].weight).toBe(0.8);
    });
  });
}); 