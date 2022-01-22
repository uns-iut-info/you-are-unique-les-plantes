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
  PointerEventTypes,
  FreeCamera,
  CubeTexture,
  KeyboardEventTypes,
  AbstractMesh,
  Ray,
  RayHelper,
} from '@babylonjs/core'
import '@babylonjs/loaders'
import { loadObject } from '../utils'

type Player = {
  mesh: Mesh
  material: StandardMaterial
  animations: AnimationGroup[]
}

type KeybordActionCode = 'KeyA' | 'KeyD' | 'KeyW' | 'Space'
const ACTIONS_CODES = ['KeyA', 'KeyD', 'KeyW', 'Space']

const PLAYER_SCALING = 0.4
const PLAYER_SPEED = 6
const GRAVITY = 4
const JUMP_HEIGHT = 3
const JUMP_SPEED = 6

let camera: ArcRotateCamera
let scene: Scene
let player1: Player
let player2: Player
let lastGroundedPos: number | null = null
let jumping = false
let keyBoardEvents = {
  KeyA: false, // LEFT
  KeyD: false, // RIGHT
  KeyW: false, // JUMP
  Space: false, // ATTACK
}

// Initialization of the scene
export const initScene = async (sc: Scene) => {
  // scene.clearColor = new Color4(0, 0, 0, 0)
  scene = sc
  const canvas = scene.getEngine().getRenderingCanvas()
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  camera = new ArcRotateCamera('Camera', 0, Math.PI / 2.1, 10, new Vector3(0, 3.3, 0), scene)
  camera.attachControl(canvas, true)

  new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  new HemisphericLight('light', new Vector3(0, -1, 0), scene)

  // Skybox
  const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, scene)
  const skyboxMaterial = new StandardMaterial('skyBox', scene)
  skyboxMaterial.backFaceCulling = false
  skyboxMaterial.reflectionTexture = new CubeTexture(
    'https://playground.babylonjs.com/textures/TropicalSunnyDay',
    scene
  )
  skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE
  skyboxMaterial.diffuseColor = new Color3(0, 0, 0)
  skyboxMaterial.specularColor = new Color3(0, 0, 0)
  skybox.material = skyboxMaterial

  // Environement
  createGround('main_ground', { width: 4, height: 0.4, depth: 16 })
  createGround('upper_ground_1', { width: 2, height: 0.4, depth: 3 }, new Vector3(0, 2.5, -3))
  createGround('upper_ground_2', { width: 2, height: 0.4, depth: 3 }, new Vector3(0, 2.5, 3))
  createGround('upper_ground_3', { width: 2, height: 0.4, depth: 3 }, new Vector3(0, 5, 0))

  // Player 1
  const player1_model = await loadObject('assets/', 'scene.glb', scene)
  player1 = {
    mesh: player1_model[0],
    material: player1_model[1].material,
    animations: [],
  }

  player1.animations = [...scene.animationGroups]
  scene.removeAnimationGroup(player1.animations[0])
  scene.removeAnimationGroup(player1.animations[1])
  player1.mesh.scaling = new Vector3(PLAYER_SCALING, PLAYER_SCALING, -PLAYER_SCALING)
  player1.mesh.position = new Vector3(0, 0.18, -4)
  player1.material.alpha = 1
  player1.mesh.ellipsoidOffset = new Vector3(0, 0.75, 0)
  player1.mesh.ellipsoid = new Vector3(0.3, 0.73, 0.3)

  // Player 2
  const player2_model = await loadObject('assets/', 'scene.glb', scene)
  player2 = {
    mesh: player2_model[0],
    material: player2_model[1].material,
    animations: [],
  }

  player2.animations = [...scene.animationGroups]
  scene.removeAnimationGroup(player2.animations[0])
  scene.removeAnimationGroup(player2.animations[1])
  player2.mesh.scaling = new Vector3(PLAYER_SCALING, PLAYER_SCALING, PLAYER_SCALING)
  player2.mesh.position = new Vector3(0, 0.18, 4)
  player2.material.alpha = 1
  player2.mesh.ellipsoidOffset = new Vector3(0, 0.75, 0)
  player2.mesh.ellipsoid = new Vector3(0.3, 0.73, 0.3)

  // keyboard events
  scene.onKeyboardObservable.add((kbInfo) => {
    const code = kbInfo.event.code
    if (ACTIONS_CODES.includes(code)) {
      const actionCode = code as KeybordActionCode

      const newKeyBoardEvents = { ...keyBoardEvents }
      newKeyBoardEvents[actionCode] = kbInfo.type === KeyboardEventTypes.KEYDOWN

      if (newKeyBoardEvents[actionCode] !== keyBoardEvents[actionCode]) {
        keyBoardEvents = newKeyBoardEvents
      }
    }
  })

  function createGround(
    name: string,
    dimensions: { width: number; height: number; depth: number },
    position?: Vector3
  ) {
    const box = MeshBuilder.CreateBox(name, dimensions)
    if (position) box.position = position
    const material = new StandardMaterial(name + '_texture', scene)
    const texture = new Texture('/assets/metal.jpg', scene)
    texture.uScale = dimensions.depth
    texture.vScale = dimensions.width
    material.ambientTexture = texture
    box.material = material
    box.checkCollisions = true
  }
}

export const onRender = () => {
  const delta = scene.getEngine().getDeltaTime() / 1000.0
  if (player1) {
    handlePlayer1Movement(delta)
  }
}

function handlePlayer1Movement(delta: number) {
  const movement = new Vector3(0, 0, 0)
  const keys = Object.keys(keyBoardEvents) as KeybordActionCode[]
  const run_anim = player1.animations[1]
  const speed = delta * PLAYER_SPEED
  const gravity = delta * GRAVITY
  const jump_speed = delta * JUMP_SPEED

  const grounded = isGrounded(player1.mesh)

  if (grounded) {
    lastGroundedPos = player1.mesh.position.y
  }

  for (const key of keys) {
    if (keyBoardEvents[key] === true) {
      switch (key) {
        case 'KeyA':
          movement.z = -speed
          player1.mesh.scaling = new Vector3(PLAYER_SCALING, PLAYER_SCALING, PLAYER_SCALING)
          if (!run_anim.isPlaying) {
            player1.animations[1].start(true, 1.0, run_anim.from, run_anim.to, false)
          }
          break
        case 'KeyD':
          movement.z = speed
          player1.mesh.scaling = new Vector3(PLAYER_SCALING, PLAYER_SCALING, -PLAYER_SCALING)
          if (!run_anim.isPlaying) {
            player1.animations[1].start(true, 1.0, run_anim.from, run_anim.to, false)
          }
          break
        case 'KeyW':
          if (grounded) {
            jumping = true
          }
          break
        case 'Space':
          break
      }
    }
  }

  if (!keyBoardEvents['KeyA'] && !keyBoardEvents['KeyD']) {
    run_anim.stop()
  }

  const height = player1.mesh.position.y
  if ((jumping && height > (lastGroundedPos ?? 0) + JUMP_HEIGHT) || isCeiling(player1.mesh)) {
    jumping = false
  }

  if (jumping) movement.y = movement.y + jump_speed
  else movement.y = movement.y - gravity

  player1.mesh.moveWithCollisions(movement)
}

function isGrounded(mesh: Mesh) {
  const raycastFloorPos = mesh.position.clone()
  raycastFloorPos.y = raycastFloorPos.y + 0.05
  const ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), 0.05)
  const pick = scene.pickWithRay(ray)
  return pick?.hit ? true : false
}

function isCeiling(mesh: Mesh) {
  const raycastFloorPos = mesh.position.clone()
  raycastFloorPos.y = raycastFloorPos.y + 1.5
  const ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), 0.05)
  const pick = scene.pickWithRay(ray)
  return pick?.hit ? true : false
}

export default {
  initScene,
  onRender,
}
