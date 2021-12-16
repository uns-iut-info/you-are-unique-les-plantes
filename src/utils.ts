import {
  Mesh,
  Scene,
  Vector3,
  Matrix,
  SceneLoader,
  Camera,
} from '@babylonjs/core'

export function loadObject(source: string, name: string, scene: Scene) {
  return new Promise<any[]>((resolve) => {
    SceneLoader.ImportMesh('', source, name, scene, (newMeshes) => {
      resolve(newMeshes)
    })
  })
}

export function getClientRectFromMesh(engine: any, scene: Scene, camera: Camera, mesh: Mesh) {

  const pos = Vector3.Project(
    mesh.getAbsolutePosition(),
    Matrix.IdentityReadOnly,
    scene.getTransformMatrix(),
    camera.viewport.toGlobal(
      engine.getRenderWidth(),
      engine.getRenderHeight(),
    ),
  )

  return {
    top: pos.y,
    left: pos.x,
  }

}