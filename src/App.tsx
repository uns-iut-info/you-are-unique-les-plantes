import './App.css'
import {
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Mesh,
} from '@babylonjs/core'
import SceneComponent from 'babylonjs-hook'

let box: Mesh

const onSceneReady = (scene: any) => {
  const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene)
  camera.setTarget(Vector3.Zero())

  const canvas = scene.getEngine().getRenderingCanvas()
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  camera.attachControl(canvas, true)

  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  light.intensity = 0.7

  box = MeshBuilder.CreateBox('box', { size: 2 }, scene)
  box.position.y = 1

  MeshBuilder.CreateGround('ground', { width: 6, height: 6 }, scene)
}

const onRender = (scene: any) => {
  if (box !== undefined) {
    const deltaTimeInMillis = scene.getEngine().getDeltaTime()
    const rpm = 10
    
    box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000)
  }
}

function App() {
  return (
    <div>
      <SceneComponent
        antialias
        onSceneReady={onSceneReady}
        onRender={onRender}
        id="my-canvas"
      />
    </div>
  )
}

export default App
