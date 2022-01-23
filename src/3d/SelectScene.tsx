import {
  Vector3,
  MeshBuilder,
  Mesh,
  Scene,
  StandardMaterial,
  Color3,
  Color4,
  AnimationGroup,
  ArcRotateCamera,
  Tools,
  DynamicTexture,
  PBRMaterial,
  Texture,
  HemisphericLight,
  Material,
  Engine,
} from '@babylonjs/core'
import '@babylonjs/loaders'
import { getClientRectFromMesh, loadObject } from '../utils'

let players: Mesh[]
let _scene: Scene
let character_meshes: Mesh[]
let canvas: any
let camera: ArcRotateCamera
let engine: Engine
let initialised = false

export const initScene = async (scene: Scene) => {
  _scene = scene
  // scene.clearColor = new Color4(0.5, 0.5, 1)
  scene.clearColor = new Color4(0, 0, 0, 0)

  canvas = scene.getEngine().getRenderingCanvas()
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  engine = new Engine(canvas, true)

  camera = new ArcRotateCamera('Camera', 0, 0, 5, new Vector3(25, 20, 0), scene)
  new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  new HemisphericLight('light', new Vector3(0, -1, 0), scene)

  const obj1 = await loadObject('assets/', 'scene.glb', scene)
  const obj2 = await loadObject('assets/', 'scene.glb', scene)
  const obj3 = await loadObject('assets/', 'scene.glb', scene)
  const obj4 = await loadObject('assets/', 'scene.glb', scene)

  character_meshes = [obj1[0], obj2[0], obj3[0], obj4[0]]
  players = [obj1[1], obj2[1], obj3[1], obj4[1]]

  let character_pos = 0
  for (let char of character_meshes) {
    char.position.x = character_pos
    character_pos += 6
  }

  for (let i in players) {
    // const mat = new PBRMaterial('mat-test-2', scene)
    // mat.albedoColor = new Color3(0.3, 0.3, 0.3)
    // mat.roughness = 0.5
    // mat.metallic = 0.2
    // character_meshes[i].material = mat

    const p = players[i]
    if (p && p.material) p.material.alpha = 1
  }

  const idle_animation: AnimationGroup | null =
    scene.getAnimationGroupByName('run')

  for (let char of character_meshes) {
    const anim = scene.getAnimationRatio()
    console.log(char)
  }

  console.log(idle_animation?.targetedAnimations)
  

  idle_animation?.start(
    true,
    1.0,
    idle_animation.from,
    idle_animation.to,
    false
  )

  const target = character_meshes[0].position.clone()
  target.x = character_meshes[0].position.x + character_meshes[3].position.x / 2
  target.y = target.y - 0.5

  camera.position.x = target.x
  camera.position.y = 3
  camera.position.z = -20

  camera.target = target

  for (let char of character_meshes) {
    char.lookAt(new Vector3(camera.position.x, 0, camera.position.z))
    char.rotate(new Vector3(0, 1, 0), Tools.ToRadians(180))
  }

  scene.executeWhenReady(() => {
    initialised = true
    console.log('initialised')
  })
}

let playerPoses: any = [null, null, null, null]

export const onRender = (scene: Scene) => {}

export function setPlayerColor(player: number, color: Color3) {
  const mat = new PBRMaterial('mat-test-2', _scene)
  mat.albedoColor = color
  mat.roughness = 0.5
  mat.metallic = 0.2
  players[player].material = mat
}

export function getPlayerScreenPos(player: number) {
  return new Promise((res) => {
    update()
    function update() {
      if (!initialised) setTimeout(update, 100)
      else {
        res(
          getClientRectFromMesh(
            engine,
            _scene,
            camera,
            character_meshes[player]
          )
        )
      }
    }
  })
}

export default {
  initScene,
  onRender,
  setPlayerColor,
  getPlayerScreenPos,
}
