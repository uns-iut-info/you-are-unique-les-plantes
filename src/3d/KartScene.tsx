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
  Quaternion,
  Nullable,
  FreeCamera,
  AmmoJSPlugin,
  PhysicsImpostor,
  Axis,
  FollowCamera,
  DirectionalLight,
  Space,
  Vector4,
  SolidParticleSystem,
  ActionManager,
  ExecuteCodeAction,


} from '@babylonjs/core'
import '@babylonjs/loaders'
import { loadObject } from '../utils'

let pivot: Mesh
let engine: Engine
let canvas: Nullable<HTMLCanvasElement>


export const initScene = async (scene: Scene) => {
  // let scene = new Scene(engine)
  engine = scene.getEngine()

  canvas = engine.getRenderingCanvas()
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  // camera
  let camera = new ArcRotateCamera("camera1", 0, 0, 20, new Vector3(0, 0, 0), scene)
  camera.setPosition(new Vector3(40, 14, 0))
  // camera.attachControl(canvas, true)

  // lights
  let light1 = new DirectionalLight("light1", new Vector3(1, 2, 0), scene)
  let light2 = new HemisphericLight("light2", new Vector3(0, 1, 0), scene)
  light2.intensity = 0.75

  /***************************Car*********************************************/

  /*-----------------------Car Body------------------------------------------*/

  //Car Body Material 
  let bodyMaterial = new StandardMaterial("body_mat", scene)
  bodyMaterial.diffuseColor = new Color3(1.0, 0.25, 0.25)
  bodyMaterial.backFaceCulling = false

  //Array of points for trapezium side of car.
  // let side = [
  //   new Vector3(-6.5, 1.5, -2),
  //   new Vector3(2.5, 1.5, -2),
  //   new Vector3(3.5, 0.5, -2),
  //   new Vector3(-9.5, 0.5, -2)
  // ]

  // side.push(side[0])	//close trapezium

  // //Array of points for the extrusion path
  // let extrudePath = [new Vector3(0, 0, 0), new Vector3(0, 0, 4)]

  // //Create body and apply material
  // let carBody = MeshBuilder.ExtrudeShape("body", { shape: side, path: extrudePath, cap: Mesh.CAP_ALL }, scene)
  // carBody.material = bodyMaterial
  let carBody = MeshBuilder.CreateBox("box", {height: 1.5, width: 10, depth: 5})
  carBody.material = bodyMaterial
  camera.parent = carBody
  /*-----------------------End Car Body------------------------------------------*/

  /*-----------------------Wheel------------------------------------------*/

  //Wheel Material 
  let wheelMaterial = new StandardMaterial("wheel_mat", scene)
  let wheelTexture = new Texture("http://i.imgur.com/ZUWbT6L.png", scene)
  wheelMaterial.diffuseTexture = wheelTexture

  //Set color for wheel tread as black
  let faceColors = []
  // faceColors[1] = new Color3(0, 0, 0)
  faceColors[1] = new Color4(0, 0, 0, 1)

  //set texture for flat face of wheel 
  let faceUV = []
  faceUV[0] = new Vector4(0, 0, 1, 1)
  faceUV[2] = new Vector4(0, 0, 1, 1)

  //create wheel front inside and apply material
  let wheelFI = MeshBuilder.CreateCylinder("wheelFI", { diameter: 3, height: 1, tessellation: 24, faceColors: faceColors, faceUV: faceUV }, scene)
  wheelFI.material = wheelMaterial

  //rotate wheel so tread in xz plane  
  wheelFI.rotate(Axis.X, Math.PI / 2, Space.WORLD)
  /*-----------------------End Wheel------------------------------------------*/

  /*-------------------Pivots for Front Wheels-----------------------------------*/
  let pivotFI = new Mesh("pivotFI", scene)
  pivotFI.parent = carBody
  pivotFI.position = new Vector3(-3, 0, -2)

  let pivotFO = new Mesh("pivotFO", scene)
  pivotFO.parent = carBody
  pivotFO.position = new Vector3(-3, 0, 2)
  /*----------------End Pivots for Front Wheels--------------------------------*/

  /*------------Create other Wheels as Instances, Parent and Position----------*/

  
  // Arriere Droite
  let wheelRO = wheelFI.createInstance("RO")
  wheelRO.parent = carBody
  wheelRO.position = new Vector3(3, 0, 2.5)

  // Arriere Gauche
  let wheelRI = wheelFI.createInstance("RI")
  wheelRI.parent = carBody
  wheelRI.position = new Vector3(3, 0, -2.5)

  // Avant Droite
  let wheelFO = wheelFI.createInstance("FO")
  wheelFO.parent = pivotFO
  wheelFO.position = new Vector3(0, 0, .5)

  // Avant Gauche
  wheelFI.parent = pivotFI
  wheelFI.position = new Vector3(0, 0, -.5)


  const obj = await loadObject('assets/', 'charDriving.glb', scene)

  let character_mesh: Mesh = obj[0]
  let character_texture_mesh: Mesh = obj[1]
  character_mesh.scaling = new Vector3(.02, .02, .02)

  const char_animation: AnimationGroup | null = scene.getAnimationGroupByName('mixamo.com')
  if (char_animation) {
    char_animation.start(true, 1.0, char_animation.from, char_animation.to, false)
    char_animation.speedRatio = 50
  }
  
  character_mesh.rotate(Axis.Y, Math.PI / 2, Space.WORLD)

  /*------------End Create other Wheels as Instances, Parent and Position----------*/

  /*---------------------Create Car Centre of Rotation-----------------------------*/
  pivot = new Mesh("pivot", scene) //current centre of rotation
  pivot.position.z = 50
  carBody.parent = pivot
  carBody.position = new Vector3(0, 0, -50)

  character_mesh.parent = carBody
  character_texture_mesh.parent = carBody

  /*---------------------End Create Car Centre of Rotation-------------------------*/


  /*************************** End Car *********************************************/

  /*****************************Add Ground********************************************/
  let groundSize = 400

  let ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene)
  let groundMaterial = new StandardMaterial("ground", scene)
  groundMaterial.diffuseColor = new Color3(0.75, 1, 0.25)
  ground.material = groundMaterial
  ground.position.y = -1.5
  /*****************************End Add Ground********************************************/

  /*****************************Particles to Show Movement********************************************/
  let box = MeshBuilder.CreateBox("box", {}, scene)
  box.position = new Vector3(20, 0, 10)


  let boxesSPS = new SolidParticleSystem("boxes", scene, { updatable: false })

  //function to position of grey boxes
  let set_boxes = function (particle: any, i: any, s: any) {
    particle.position = new Vector3(-200 + Math.random() * 400, 0, -200 + Math.random() * 400)
  }

  //add 400 boxes
  boxesSPS.addShape(box, 400, { positionFunction: set_boxes })
  let boxes = boxesSPS.buildMesh() // mesh of boxes
  boxes.material = new StandardMaterial("", scene)
  boxes.material.alpha = 0.25
  /*****************************Particles to Show Movement********************************************/



  /****************************Key Controls************************************************/

  let map: any = {} //object for multiple key presses
  scene.actionManager = new ActionManager(scene)
  scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, function (evt) {
    map[evt.sourceEvent.code] = true
  }))
  scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, function (evt) {
    map[evt.sourceEvent.code] = false
  }))

  /****************************End Key Controls************************************************/


  /****************************letiables************************************************/

  let theta = 0
  let deltaTheta = 0
  let D = 0 //distance translated per second
  let R = 50 //turning radius, initial set at pivot z value
  let NR //Next turning radius on wheel turn
  let A = 4 // axel length
  let L = 4 //distance between wheel pivots
  let r = 1.5 // wheel radius
  let psi, psiRI, psiRO, psiFI, psiFO //wheel rotations  
  let phi //rotation of car when turning 

  let F // frames per second	

  /****************************End letiables************************************************/



  /****************************Animation******************************************************/

  scene.registerAfterRender(function () {
    F = engine.getFps()

    if (map["KeyW"] && D < 50) D += 1
    if (map["KeyS"] && D > -50) D -= 1
    if (D > 0.15) D -= 0.15
    // else D = 0
    
    let distance = D / F
    psi = D / (r * F)

    if (map["KeyA"] && -Math.PI / 6 < theta) {
      // deltaTheta = -Math.PI / 252
      // theta += deltaTheta
      deltaTheta = -0.08
      theta = deltaTheta
    }

    if (map["KeyD"] && theta < Math.PI / 6) {
      // deltaTheta = Math.PI / 252
      // theta += deltaTheta
      deltaTheta = 0.08
      theta = deltaTheta
    }

    if (!map["KeyA"] && !map["KeyD"]) {
      // deltaTheta = Math.PI / 252
      // theta += deltaTheta
      deltaTheta = 0
      theta = deltaTheta
    }

    pivotFI.rotation.y = deltaTheta
    pivotFO.rotation.y = deltaTheta
    if (Math.abs(theta) > 0.00000001) {
      NR = A / 2 + L / Math.tan(theta)
    }
    else {
      theta = 0
      NR = 0
    }
    pivot.translate(Axis.Z, NR - R, Space.LOCAL)
    carBody.translate(Axis.Z, R - NR, Space.LOCAL)
    R = NR

    if (D !== 0) {
      phi = D / (R * F)
      
      if (Math.abs(theta) > 0) {
        pivot.rotate(Axis.Y, phi, Space.WORLD)
        psiRI = D / (r * F)
        psiRO = D * (R + A) / (r * F)
        psiFI = D * Math.sqrt(R * R + L * L) / (r * F)
        psiFO = D * Math.sqrt((R + A) * (R + A) + L * L) / (r * F)

        wheelFI.rotate(Axis.Y, psiFI, Space.LOCAL)
        wheelFO.rotate(Axis.Y, psiFO, Space.LOCAL)
        wheelRI.rotate(Axis.Y, psiRI, Space.LOCAL)
        wheelRO.rotate(Axis.Y, psiRO, Space.LOCAL)
      }
      else {
        pivot.translate(Axis.X, -distance, Space.LOCAL)
        wheelFI.rotate(Axis.Y, psi, Space.LOCAL)
        wheelFO.rotate(Axis.Y, psi, Space.LOCAL)
        wheelRI.rotate(Axis.Y, psi, Space.LOCAL)
        wheelRO.rotate(Axis.Y, psi, Space.LOCAL)
      }
    }
    
  })

  /****************************End Animation************************************************/

  return scene
}

window.addEventListener('resize', function () {
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
})

export const onRender = (scene: Scene) => {

}


export default {
  initScene,
  onRender,
}
