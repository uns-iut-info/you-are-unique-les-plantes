import './App.scss'
import SceneComponent from './3d/SceneComponent'
import { useState } from 'react'
import Ui from './ui/Ui'

import selectScene from './3d/SelectScene'
import boardScene from './3d/BoardScene'


function App() {

  const [currentScene, setCurrentScene] = useState(selectScene)

  return (
    <div className="App" onClick={() => {
      // setCurrentScene(boardScene)
    }}>
      <Ui />
      <SceneComponent
        antialias
        onSceneReady={currentScene.initScene}
        onRender={currentScene.onRender}
        id="my-canvas"
      />
    </div>
  )
}

export default App
