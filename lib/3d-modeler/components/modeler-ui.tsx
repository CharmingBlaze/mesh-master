"use client"

import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Separator } from "../../../components/ui/separator";
import { Badge } from "../../../components/ui/badge";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { useModeler } from "../hooks/use-modeler";
import { ObjectType, TransformMode, EditMode } from "../core/types";

interface ModelerUIProps {
  className?: string;
}

export function ModelerUI({ className }: ModelerUIProps) {
  const modeler = useModeler();
  const [activeTab, setActiveTab] = useState("objects");
  const [newObjectType, setNewObjectType] = useState<ObjectType>("box");
  const [objectName, setObjectName] = useState("");

  const addObject = () => {
    if (objectName.trim()) {
      modeler.addObject(newObjectType, { name: objectName });
      setObjectName("");
    } else {
      modeler.addObject(newObjectType);
    }
  };

  const selectedObject = modeler.selectedObjectId
    ? modeler.objects.find((obj) => obj.id === modeler.selectedObjectId)
    : null;

  return (
    <div className={`modeler-ui ${className || ""}`}>
      <Card>
        <CardHeader>
          <CardTitle>3D Modeler</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="objects">Objects</TabsTrigger>
              <TabsTrigger value="transform">Transform</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="objects" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="object-type">Object Type</Label>
                <select
                  id="object-type"
                  value={newObjectType}
                  onChange={(e) => setNewObjectType(e.target.value as ObjectType)}
                  className="w-full p-2 border rounded"
                >
                  <option value="box">Box</option>
                  <option value="sphere">Sphere</option>
                  <option value="cylinder">Cylinder</option>
                  <option value="plane">Plane</option>
                  <option value="cone">Cone</option>
                  <option value="pyramid">Pyramid</option>
                  <option value="prism">Prism</option>
                  <option value="torus">Torus</option>
                  <option value="helix">Helix</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="object-name">Object Name</Label>
                <Input
                  id="object-name"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  placeholder="Enter object name..."
                />
              </div>

              <Button onClick={addObject} className="w-full">
                Add Object
              </Button>

              <Separator />

              <div className="space-y-2">
                <Label>Objects ({modeler.objects.length})</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {modeler.objects.map((obj) => (
                      <div
                        key={obj.id}
                        className={`p-2 border rounded cursor-pointer ${
                          modeler.selectedObjectId === obj.id
                            ? "bg-blue-100 border-blue-300"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => modeler.selectObject(obj.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{obj.name}</span>
                          <Badge variant="secondary">{obj.type}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Vertices: {obj.vertices.length} | Faces: {obj.faces.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {selectedObject && (
                <div className="space-y-2">
                  <Label>Selected Object</Label>
                  <div className="p-3 border rounded bg-gray-50">
                    <div className="text-sm font-medium">{selectedObject.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Type: {selectedObject.type}
                    </div>
                    <div className="text-xs text-gray-500">
                      Position: [{selectedObject.position.x.toFixed(2)}, {selectedObject.position.y.toFixed(2)}, {selectedObject.position.z.toFixed(2)}]
                    </div>
                    <div className="text-xs text-gray-500">
                      Rotation: [{selectedObject.rotation.x.toFixed(2)}, {selectedObject.rotation.y.toFixed(2)}, {selectedObject.rotation.z.toFixed(2)}]
                    </div>
                    <div className="text-xs text-gray-500">
                      Scale: [{selectedObject.scale.x.toFixed(2)}, {selectedObject.scale.y.toFixed(2)}, {selectedObject.scale.z.toFixed(2)}]
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transform" className="space-y-4">
              <div className="space-y-2">
                <Label>Transform Mode</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={modeler.transformMode === "translate" ? "default" : "outline"}
                    size="sm"
                    onClick={() => modeler.setTransformMode("translate")}
                  >
                    Move
                  </Button>
                  <Button
                    variant={modeler.transformMode === "rotate" ? "default" : "outline"}
                    size="sm"
                    onClick={() => modeler.setTransformMode("rotate")}
                  >
                    Rotate
                  </Button>
                  <Button
                    variant={modeler.transformMode === "scale" ? "default" : "outline"}
                    size="sm"
                    onClick={() => modeler.setTransformMode("scale")}
                  >
                    Scale
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Edit Mode</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={modeler.editMode === "object" ? "default" : "outline"}
                    size="sm"
                    onClick={() => modeler.setEditMode("object")}
                  >
                    Object
                  </Button>
                  <Button
                    variant={modeler.editMode === "vertex" ? "default" : "outline"}
                    size="sm"
                    onClick={() => modeler.setEditMode("vertex")}
                  >
                    Vertex
                  </Button>
                  <Button
                    variant={modeler.editMode === "edge" ? "default" : "outline"}
                    size="sm"
                    onClick={() => modeler.setEditMode("edge")}
                  >
                    Edge
                  </Button>
                  <Button
                    variant={modeler.editMode === "face" ? "default" : "outline"}
                    size="sm"
                    onClick={() => modeler.setEditMode("face")}
                  >
                    Face
                  </Button>
                </div>
              </div>

              {selectedObject && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={selectedObject.position.x.toFixed(2)}
                          onChange={(e) => {
                            const newPosition = { ...selectedObject.position };
                            newPosition.x = parseFloat(e.target.value) || 0;
                            modeler.updateObject(selectedObject.id, { position: newPosition });
                          }}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={selectedObject.position.y.toFixed(2)}
                          onChange={(e) => {
                            const newPosition = { ...selectedObject.position };
                            newPosition.y = parseFloat(e.target.value) || 0;
                            modeler.updateObject(selectedObject.id, { position: newPosition });
                          }}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Z</Label>
                        <Input
                          type="number"
                          value={selectedObject.position.z.toFixed(2)}
                          onChange={(e) => {
                            const newPosition = { ...selectedObject.position };
                            newPosition.z = parseFloat(e.target.value) || 0;
                            modeler.updateObject(selectedObject.id, { position: newPosition });
                          }}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rotation</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={selectedObject.rotation.x.toFixed(2)}
                          onChange={(e) => {
                            const newRotation = { ...selectedObject.rotation };
                            newRotation.x = parseFloat(e.target.value) || 0;
                            modeler.updateObject(selectedObject.id, { rotation: newRotation });
                          }}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={selectedObject.rotation.y.toFixed(2)}
                          onChange={(e) => {
                            const newRotation = { ...selectedObject.rotation };
                            newRotation.y = parseFloat(e.target.value) || 0;
                            modeler.updateObject(selectedObject.id, { rotation: newRotation });
                          }}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Z</Label>
                        <Input
                          type="number"
                          value={selectedObject.rotation.z.toFixed(2)}
                          onChange={(e) => {
                            const newRotation = { ...selectedObject.rotation };
                            newRotation.z = parseFloat(e.target.value) || 0;
                            modeler.updateObject(selectedObject.id, { rotation: newRotation });
                          }}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Scale</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={selectedObject.scale.x.toFixed(2)}
                          onChange={(e) => {
                            const newScale = { ...selectedObject.scale };
                            newScale.x = Math.max(0.01, parseFloat(e.target.value) || 1);
                            modeler.updateObject(selectedObject.id, { scale: newScale });
                          }}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={selectedObject.scale.y.toFixed(2)}
                          onChange={(e) => {
                            const newScale = { ...selectedObject.scale };
                            newScale.y = Math.max(0.01, parseFloat(e.target.value) || 1);
                            modeler.updateObject(selectedObject.id, { scale: newScale });
                          }}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Z</Label>
                        <Input
                          type="number"
                          value={selectedObject.scale.z.toFixed(2)}
                          onChange={(e) => {
                            const newScale = { ...selectedObject.scale };
                            newScale.z = Math.max(0.01, parseFloat(e.target.value) || 1);
                            modeler.updateObject(selectedObject.id, { scale: newScale });
                          }}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <div className="space-y-2">
                <Label>Material Properties</Label>
                {selectedObject && selectedObject.materials && selectedObject.materials.length > 0 ? (
                  <div className="space-y-2">
                    {selectedObject.materials.map((material, index) => (
                      <div key={material.id} className="p-3 border rounded">
                        <div className="text-sm font-medium">{material.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Color: {material.color}
                        </div>
                        {material.metalness !== undefined && (
                          <div className="text-xs text-gray-500">
                            Metalness: {material.metalness.toFixed(2)}
                          </div>
                        )}
                        {material.roughness !== undefined && (
                          <div className="text-xs text-gray-500">
                            Roughness: {material.roughness.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No materials assigned</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-2">
                <Label>Grid Settings</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="snap-to-grid"
                    checked={modeler.config.snapToGrid}
                    onCheckedChange={(checked) =>
                      modeler.updateConfig({ snapToGrid: checked })
                    }
                  />
                  <Label htmlFor="snap-to-grid">Snap to Grid</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Grid Size</Label>
                  <Input
                    type="number"
                    value={modeler.config.gridSize || 1}
                    onChange={(e) =>
                      modeler.updateConfig({ gridSize: parseFloat(e.target.value) || 1 })
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>History</Label>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => modeler.undo()}
                    disabled={modeler.history.past.length === 0}
                  >
                    Undo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => modeler.redo()}
                    disabled={modeler.history.future.length === 0}
                  >
                    Redo
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Past: {modeler.history.past.length} | Future: {modeler.history.future.length}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Scene</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => modeler.resetScene()}
                  className="w-full"
                >
                  Reset Scene
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
