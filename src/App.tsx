import './App.scss'
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
  PBRMaterial
} from '@babylonjs/core'
import SceneComponent from 'babylonjs-hook'
import '@babylonjs/loaders'
import { loadObject } from './utils'

// Global data
const railLength = 20

let points: Vector3[] = [
  new Vector3(0 * railLength, 0, 1 * railLength),
  new Vector3(0 * railLength, 0, 2 * railLength),
  new Vector3(1 * railLength, 0, 3 * railLength),
  new Vector3(2 * railLength, 0, 3 * railLength),
  new Vector3(3 * railLength, 0, 2 * railLength),
  new Vector3(3 * railLength, 0, 1 * railLength),
  new Vector3(2 * railLength, 0, 0 * railLength),
  new Vector3(1 * railLength, 0, 0 * railLength),
]
let currentPoint = 0

let character_mesh: Mesh
let character_texture_mesh: Mesh
// let current_animation = 'idle'
let camera: ArcRotateCamera

// Initialization of the scene
const initScene = async (scene: Scene) => {
  scene.clearColor = new Color4(0.5, 0.5, 1)

  const canvas = scene.getEngine().getRenderingCanvas()
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  camera = new ArcRotateCamera( 'Camera', (3 * Math.PI) / 2, Math.PI / 2.5, 5, new Vector3(25, 20, 0), scene)

  // camera.attachControl(canvas, true)

  MeshBuilder.CreateLines('lines', { points: points }, scene)
  MeshBuilder.CreateLines('lines', { points: [points[7], points[0]] }, scene)


  const obj = await loadObject('assets/', 'scene.glb', scene)

  character_mesh = obj[0]
  character_texture_mesh = obj[1]

  const mat1 = new PBRMaterial('mat-test-2', scene)
  mat1.emissiveColor = new Color3(1, 0.1, 0.1)
  mat1.metallic = 0.0
  mat1.roughness = 0    
  mat1.subSurface.isRefractionEnabled = true

  // character_mesh.position.y = 0
  character_texture_mesh.material = mat1

  // const idle_animation: AnimationGroup | null = scene.getAnimationGroupByName('Root|mixamo.com|Layer0.001')
  const run_animation: AnimationGroup | null = scene.getAnimationGroupByName('Root|mixamo.com|Layer0.001.001')
  if (run_animation) {
    run_animation.start(true, 1.0, run_animation.from, run_animation.to, false)
  }

  for (let i in points) {
    const point = MeshBuilder.CreateCylinder( 'point', { diameter: 5, height: 0.4, hasRings: true }, scene)
    const p2 = MeshBuilder.CreateCylinder( 'point', { diameter: 4.2, height: 0.41 }, scene)
    point.addChild(p2)
    point.position = points[i]

    const textureGround = new DynamicTexture( 'dynamic texture', { width: 256, height: 256 }, scene, false)
    const materialGround = new StandardMaterial('Mat', scene)
    materialGround.diffuseTexture = textureGround
    materialGround.emissiveColor = Color3.White()
    p2.material = materialGround

    const font = 'bold 120px monospace'
    var textureContext = textureGround.getContext()
    textureContext.textAlign = 'center'
    const text = (+i + 1).toString()
    const posX = 256 / 2
    const posY = (256 + 70) / 2

    textureGround.drawText(text, posX, posY, font, 'black', 'white', true, true)
    textureGround.update()
  }
}

let speed = 0.5
let nbPoints = points.length

const onRender = (scene: Scene) => {
  if (!character_mesh) return

  const deltaTimeInMillis = scene.getEngine().getDeltaTime()
  const s = speed * deltaTimeInMillis

  const current = Math.floor(currentPoint)
  const next = current == nbPoints - 1 ? 0 : current + 1
  const diff = currentPoint - current
  const position = Vector3.Zero()

  position.x = points[current].x + (points[next].x - points[current].x) * diff
  position.y = points[current].y + (points[next].y - points[current].y) * diff
  position.z = points[current].z + (points[next].z - points[current].z) * diff
  character_mesh.position = position
  character_texture_mesh.position = position

  currentPoint = currentPoint + s * 0.001

  if (currentPoint >= nbPoints) currentPoint = 0
  

  character_mesh.lookAt(points[next])
  character_mesh.rotate(new Vector3(0, 1, 0), Tools.ToRadians(180))
  camera.target = character_mesh.position

  const marge = [20, 40]

  const newPos = camera.position.clone()
  if(camera.position.x > character_mesh.position.x + marge[1]) {
    newPos.x = character_mesh.position.x + marge[1]
  } 

  if(camera.position.z > character_mesh.position.z + marge[1]) {
    newPos.z = character_mesh.position.z + marge[1]
  }

  if (camera.position.x < character_mesh.position.x +marge[0]) {
    newPos.x = character_mesh.position.x + marge[0]
  }
  if (camera.position.x < character_mesh.position.z +marge[0]) {
    newPos.z = character_mesh.position.z + marge[0]
  }
  camera.position = newPos

}

function App() {
  return (
    <div className="App">
      <SceneComponent
        antialias
        onSceneReady={initScene}
        onRender={onRender}
        id="my-canvas"
      />
    </div>
  )
}

export default App
