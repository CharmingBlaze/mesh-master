import type { Vector3 } from "../core/types";

export function addVector3(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
}

export function subtractVector3(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
}

export function multiplyVector3(v: Vector3, scalar: number): Vector3 {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
    z: v.z * scalar
  };
}

export function normalizeVector3(v: Vector3): Vector3 {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length
  };
}

export function dotProduct(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function crossProduct(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function lerp(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  };
}

// Transform utilities for coordinate space conversions
export function worldToLocal(
  worldPos: Vector3,
  objectPos: Vector3,
  objectRotation: Vector3,
  objectScale: Vector3,
): Vector3 {
  // Simple implementation - subtract object position and apply inverse scale
  const localPos = subtractVector3(worldPos, objectPos);
  return {
    x: localPos.x / objectScale.x,
    y: localPos.y / objectScale.y,
    z: localPos.z / objectScale.z
  };
}

export function localToWorld(
  localPos: Vector3,
  objectPos: Vector3,
  objectRotation: Vector3,
  objectScale: Vector3,
): Vector3 {
  // Simple implementation - apply scale and add object position
  const scaledPos: Vector3 = {
    x: localPos.x * objectScale.x,
    y: localPos.y * objectScale.y,
    z: localPos.z * objectScale.z
  };
  return addVector3(scaledPos, objectPos);
}
