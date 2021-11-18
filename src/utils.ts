import {
  Scene,
  SceneLoader,
} from '@babylonjs/core'

export function loadObject(source: string, name: string, scene: Scene) {
  return new Promise<any[]>((resolve) => {
    SceneLoader.ImportMesh('', source, name, scene, (newMeshes) => {
      resolve(newMeshes)
    })
  })
}

