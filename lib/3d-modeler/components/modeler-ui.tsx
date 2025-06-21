"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Box,
  SpaceIcon as Sphere,
  Cylinder,
  Square,
  Triangle,
  Move,
  RotateCw,
  Scale,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Undo,
  Redo,
  Layers,
  Circle,
} from "lucide-react"
import { useModeler } from "./modeler-provider"
import type { ObjectType, TransformMode, EditMode } from "../core/types"

interface ModelerUIProps {
  className?: string
  showObjectList?: boolean
  showProperties?: boolean
  showPrimitiveCreator?: boolean
}

export function ModelerUI({
  className = "",
  showObjectList = true,
  showProperties = true,
  showPrimitiveCreator = true,
}: ModelerUIProps) {
  const modeler = useModeler()
  const [activeTab, setActiveTab] = useState("create")
  const [isCreating, setIsCreating] = useState(false)

  console.log("ModelerUI render - objects count:", modeler.objects.length)
  console.log("ModelerUI render - modeler state:", {
    objectsCount: modeler.objects.length,
    selectedObjectId: modeler.selectedObjectId,
    error: modeler.error,
  })

  const selectedObject = modeler.objects.find((obj) => obj.id === modeler.selectedObjectId)

  const handleAddPrimitive = async (type: ObjectType) => {
    console.log("=== STARTING PRIMITIVE CREATION ===")
    console.log("UI: Button clicked for type:", type)
    console.log("UI: Current objects count:", modeler.objects.length)
    console.log("UI: Modeler object:", modeler)

    setIsCreating(true)

    try {
      console.log("UI: Calling modeler.addObject...")

      // Test if the function exists
      if (typeof modeler.addObject !== "function") {
        console.error("UI: modeler.addObject is not a function!", typeof modeler.addObject)
        return
      }

      await modeler.addObject(type)
      console.log("UI: addObject completed")
      console.log("UI: New objects count:", modeler.objects.length)
    } catch (error) {
      console.error("UI: Error in handleAddPrimitive:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleTransformModeChange = (mode: TransformMode) => {
    modeler.setTransformMode(mode)
  }

  const handleEditModeChange = (mode: EditMode) => {
    modeler.setEditMode(mode)
  }

  const handleObjectSelect = (id: string) => {
    modeler.selectObject(id)
  }

  const handleObjectDelete = (id: string) => {
    modeler.removeObject(id)
  }

  const handleObjectDuplicate = (id: string) => {
    modeler.duplicateObject(id)
  }

  const handleObjectToggleVisibility = (id: string) => {
    const object = modeler.objects.find((obj) => obj.id === id)
    if (object) {
      modeler.updateObject(id, { visible: !object.visible })
    }
  }

  const handlePropertyChange = (property: string, value: any) => {
    if (selectedObject) {
      modeler.updateObject(selectedObject.id, { [property]: value })
    }
  }

  // Test function to add a simple object directly
  const handleTestAdd = () => {
    console.log("=== TEST ADD ===")
    const testObject = {
      id: crypto.randomUUID(),
      name: "Test Cube",
      type: "box" as ObjectType,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: "#ff0000",
      wireframe: false,
      visible: true,
      vertices: [
        { id: crypto.randomUUID(), position: { x: -0.5, y: -0.5, z: -0.5 }, selected: false },
        { id: crypto.randomUUID(), position: { x: 0.5, y: -0.5, z: -0.5 }, selected: false },
        { id: crypto.randomUUID(), position: { x: 0.5, y: 0.5, z: -0.5 }, selected: false },
        { id: crypto.randomUUID(), position: { x: -0.5, y: 0.5, z: -0.5 }, selected: false },
        { id: crypto.randomUUID(), position: { x: -0.5, y: -0.5, z: 0.5 }, selected: false },
        { id: crypto.randomUUID(), position: { x: 0.5, y: -0.5, z: 0.5 }, selected: false },
        { id: crypto.randomUUID(), position: { x: 0.5, y: 0.5, z: 0.5 }, selected: false },
        { id: crypto.randomUUID(), position: { x: -0.5, y: 0.5, z: 0.5 }, selected: false },
      ],
      edges: [],
      faces: [],
    }

    console.log("Test object:", testObject)
    modeler.addCustomObject(testObject)
  }

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">3D Modeler</h2>
        <p className="text-sm text-muted-foreground">Create and edit 3D objects</p>
        <div className="text-xs text-muted-foreground mt-1">
          Objects: {modeler.objects.length} | Selected: {modeler.selectedObjectId || "None"}
        </div>
      </div>

      {/* Error Display */}
      {modeler.error && (
        <div className="p-4 bg-destructive/10 border-b">
          <p className="text-sm text-destructive">{modeler.error}</p>
        </div>
      )}

      {/* Debug Section */}
      <div className="p-4 border-b bg-muted/50">
        <div className="text-xs space-y-1">
          <div>Objects in store: {modeler.objects.length}</div>
          <div>Store functions available: {Object.keys(modeler).join(", ")}</div>
          <Button size="sm" onClick={handleTestAdd} className="mt-2">
            Test Add Simple Object
          </Button>
        </div>
      </div>

      {/* Transform Mode Toolbar */}
      <div className="p-4 border-b">
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium">Transform Mode</Label>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={modeler.transformMode === "translate" ? "default" : "outline"}
              onClick={() => handleTransformModeChange("translate")}
              className="flex-1"
            >
              <Move className="w-4 h-4 mr-1" />
              Move
            </Button>
            <Button
              size="sm"
              variant={modeler.transformMode === "rotate" ? "default" : "outline"}
              onClick={() => handleTransformModeChange("rotate")}
              className="flex-1"
            >
              <RotateCw className="w-4 h-4 mr-1" />
              Rotate
            </Button>
            <Button
              size="sm"
              variant={modeler.transformMode === "scale" ? "default" : "outline"}
              onClick={() => handleTransformModeChange("scale")}
              className="flex-1"
            >
              <Scale className="w-4 h-4 mr-1" />
              Scale
            </Button>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium">Edit Mode</Label>
          <div className="grid grid-cols-2 gap-1">
            {(["object", "vertex", "edge", "face"] as EditMode[]).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={modeler.editMode === mode ? "default" : "outline"}
                onClick={() => handleEditModeChange(mode)}
                className="text-xs"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={modeler.undo}
            disabled={modeler.history.past.length === 0}
            className="flex-1"
          >
            <Undo className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={modeler.redo}
            disabled={modeler.history.future.length === 0}
            className="flex-1"
          >
            <Redo className="w-4 h-4 mr-1" />
            Redo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="objects">Objects</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="flex-1 p-4 space-y-4">
            {showPrimitiveCreator && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Add Primitives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("box")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <Box className="w-4 h-4" />
                      <span className="text-xs">Cube</span>
                      {isCreating && <span className="text-xs">Creating...</span>}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("sphere")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <Sphere className="w-4 h-4" />
                      <span className="text-xs">Sphere</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("cylinder")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <Cylinder className="w-4 h-4" />
                      <span className="text-xs">Cylinder</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("plane")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <Square className="w-4 h-4" />
                      <span className="text-xs">Plane</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("cone")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <Triangle className="w-4 h-4" />
                      <span className="text-xs">Cone</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("pyramid")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <Triangle className="w-4 h-4" />
                      <span className="text-xs">Pyramid</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("prism")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <Box className="w-4 h-4" />
                      <span className="text-xs">Prism</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("torus")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <Circle className="w-4 h-4" />
                      <span className="text-xs">Torus</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAddPrimitive("helix")}
                      disabled={isCreating}
                      className="h-12 flex flex-col gap-1"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span className="text-xs">Helix</span>
                    </Button>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    Debug: Click buttons above to create primitives. Check console for detailed logs.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Objects Tab */}
          <TabsContent value="objects" className="flex-1 p-4">
            {showObjectList && (
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Scene Objects ({modeler.objects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    {modeler.objects.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <p className="text-sm">No objects in scene</p>
                        <p className="text-xs">Add primitives to get started</p>
                        <p className="text-xs mt-2">Check console for debug info</p>
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {modeler.objects.map((object) => (
                          <div
                            key={object.id}
                            className={`p-2 rounded border cursor-pointer transition-colors ${
                              object.id === modeler.selectedObjectId ? "bg-primary/10 border-primary" : "hover:bg-muted"
                            }`}
                            onClick={() => handleObjectSelect(object.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex-shrink-0">
                                  {object.type === "box" && <Box className="w-4 h-4" />}
                                  {object.type === "sphere" && <Sphere className="w-4 h-4" />}
                                  {object.type === "cylinder" && <Cylinder className="w-4 h-4" />}
                                  {object.type === "plane" && <Square className="w-4 h-4" />}
                                  {object.type === "cone" && <Triangle className="w-4 h-4" />}
                                  {object.type === "pyramid" && <Triangle className="w-4 h-4" />}
                                  {object.type === "prism" && <Box className="w-4 h-4" />}
                                  {object.type === "torus" && <Circle className="w-4 h-4" />}
                                  {object.type === "helix" && <RotateCw className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{object.name}</p>
                                  <div className="flex gap-1 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {object.type}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {object.vertices.length}v
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleObjectToggleVisibility(object.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  {object.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleObjectDuplicate(object.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleObjectDelete(object.id)
                                  }}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="flex-1 p-4">
            {showProperties && (
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedObject ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {/* Basic Properties */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Name</Label>
                          <Input
                            value={selectedObject.name}
                            onChange={(e) => handlePropertyChange("name", e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <Separator />

                        {/* Transform */}
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">Transform</Label>

                          {/* Position */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Position</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">X</Label>
                                <Input
                                  type="number"
                                  value={selectedObject.position.x.toFixed(2)}
                                  onChange={(e) =>
                                    handlePropertyChange("position", {
                                      ...selectedObject.position,
                                      x: Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Y</Label>
                                <Input
                                  type="number"
                                  value={selectedObject.position.y.toFixed(2)}
                                  onChange={(e) =>
                                    handlePropertyChange("position", {
                                      ...selectedObject.position,
                                      y: Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Z</Label>
                                <Input
                                  type="number"
                                  value={selectedObject.position.z.toFixed(2)}
                                  onChange={(e) =>
                                    handlePropertyChange("position", {
                                      ...selectedObject.position,
                                      z: Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Scale */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Scale</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">X</Label>
                                <Input
                                  type="number"
                                  value={selectedObject.scale.x.toFixed(2)}
                                  onChange={(e) =>
                                    handlePropertyChange("scale", {
                                      ...selectedObject.scale,
                                      x: Math.max(0.01, Number.parseFloat(e.target.value) || 1),
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Y</Label>
                                <Input
                                  type="number"
                                  value={selectedObject.scale.y.toFixed(2)}
                                  onChange={(e) =>
                                    handlePropertyChange("scale", {
                                      ...selectedObject.scale,
                                      y: Math.max(0.01, Number.parseFloat(e.target.value) || 1),
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Z</Label>
                                <Input
                                  type="number"
                                  value={selectedObject.scale.z.toFixed(2)}
                                  onChange={(e) =>
                                    handlePropertyChange("scale", {
                                      ...selectedObject.scale,
                                      z: Math.max(0.01, Number.parseFloat(e.target.value) || 1),
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Material */}
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">Material</Label>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Color</Label>
                            <Input
                              type="color"
                              value={selectedObject.color}
                              onChange={(e) => handlePropertyChange("color", e.target.value)}
                              className="h-8"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Wireframe</Label>
                            <Switch
                              checked={selectedObject.wireframe}
                              onCheckedChange={(checked) => handlePropertyChange("wireframe", checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Visible</Label>
                            <Switch
                              checked={selectedObject.visible}
                              onCheckedChange={(checked) => handlePropertyChange("visible", checked)}
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Geometry Info */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Geometry</Label>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-medium">{selectedObject.vertices.length}</div>
                              <div className="text-muted-foreground">Vertices</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-medium">{selectedObject.edges.length}</div>
                              <div className="text-muted-foreground">Edges</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-medium">{selectedObject.faces.length}</div>
                              <div className="text-muted-foreground">Faces</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p className="text-sm">No object selected</p>
                      <p className="text-xs">Select an object to edit properties</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
