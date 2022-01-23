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
  Quaternion,
  FreeCamera,
  AmmoJSPlugin,
  PhysicsImpostor,
  SceneLoader,
  VertexBuffer,
  FollowCamera,
  Engine,
  Nullable,
} from '@babylonjs/core'
import '@babylonjs/loaders'

let canvas = document.getElementById(
  'renderCanvas'
) as Nullable<HTMLCanvasElement>

let engine: Engine = null
let sceneToRender = null
let createDefaultEngine = function () {
  return new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
  })
}
let vehicle,
  scene,
  chassisMesh,
  redMaterial,
  blueMaterial,
  greenMaterial,
  blackMaterial
let wheelMeshes = []
let actions = {
  accelerate: false,
  brake: false,
  right: false,
  left: false,
}

let keysActions = {
  KeyW: 'acceleration',
  KeyS: 'braking',
  KeyA: 'left',
  KeyD: 'right',
}

let vehicleReady = false

let ZERO_QUATERNION = new Quaternion()

let chassisWidth = 1.8
let chassisHeight = 0.6
let chassisLength = 4
let massVehicle = 200

let wheelAxisPositionBack = -1
let wheelRadiusBack = 0.4
let wheelWidthBack = 0.3
let wheelHalfTrackBack = 1
let wheelAxisHeightBack = 0.4

let wheelAxisFrontPosition = 1.0
let wheelHalfTrackFront = 1
let wheelAxisHeightFront = 0.4
let wheelRadiusFront = 0.4
let wheelWidthFront = 0.3

let friction = 5
let suspensionStiffness = 10
let suspensionDamping = 0.3
let suspensionCompression = 4.4
let suspensionRestLength = 0.6
let rollInfluence = 0.0

let steeringIncrement = 0.01
let steeringClamp = 0.2
let maxEngineForce = 500
let maxBreakingForce = 10
let incEngine = 10.0

let FRONT_LEFT = 0
let FRONT_RIGHT = 1
let BACK_LEFT = 2
let BACK_RIGHT = 3

let wheelDirectionCS0
let wheelAxleCS

export const initScene = async (scene: Scene) => {
  // Setup basic scene
  scene = new Scene(engine)
  var camera = new BABYLON.FreeCamera(
    'camera1',
    new BABYLON.Vector3(0, 5, -10),
    scene
  )
  camera.setTarget(BABYLON.Vector3.Zero())
  camera.attachControl(canvas, true)
  var light = new BABYLON.HemisphericLight(
    'light1',
    new BABYLON.Vector3(0, 1, 0),
    scene
  )
  light.intensity = 0.7

  redMaterial = new BABYLON.StandardMaterial('RedMaterial', scene)
  redMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.5)
  redMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.4, 0.5)

  blueMaterial = new BABYLON.StandardMaterial('RedMaterial', scene)
  blueMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.8)
  blueMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.8)

  greenMaterial = new BABYLON.StandardMaterial('RedMaterial', scene)
  greenMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.8, 0.5)
  greenMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.8, 0.5)

  blackMaterial = new BABYLON.StandardMaterial('RedMaterial', scene)
  blackMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1)
  blackMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1)
  // Enable physics
  scene.enablePhysics(
    new BABYLON.Vector3(0, -10, 0),
    new BABYLON.AmmoJSPlugin()
  )

  wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0)
  wheelAxleCS = new Ammo.btVector3(-1, 0, 0)

  var ground = BABYLON.Mesh.CreateGround('ground', 460, 460, 2, scene)
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(
    ground,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 0.5, restitution: 0.7 },
    scene
  )
  ground.material = new BABYLON.GridMaterial('groundMaterial', scene)

  createBox(
    new BABYLON.Vector3(4, 1, 12),
    new BABYLON.Vector3(0, 0, 25),
    new BABYLON.Vector3(-Math.PI / 8, 0, 0),
    0
  )
  createBox(
    new BABYLON.Vector3(4, 1, 12),
    new BABYLON.Vector3(25, 0, 0),
    new BABYLON.Vector3(-Math.PI / 8, Math.PI / 2, 0),
    0
  )
  createBox(
    new BABYLON.Vector3(4, 1, 12),
    new BABYLON.Vector3(0, 0, -25),
    new BABYLON.Vector3(Math.PI / 8, 0, 0),
    0
  )
  createBox(
    new BABYLON.Vector3(4, 1, 12),
    new BABYLON.Vector3(-25, 0, 0),
    new BABYLON.Vector3(Math.PI / 8, Math.PI / 2, 0),
    0
  )

  let s = new BABYLON.Vector3()
  let p = new BABYLON.Vector3()
  let r = new BABYLON.Vector3()
  for (let i = 0; i < 20; i++) {
    let m = Math.random() * 300 - 150 + 5
    let m3 = Math.random() * 300 - 150 + 5
    let m2 = Math.random() * 10
    s.set(m2, m2, m2)
    p.set(m3, 0, m)
    r.set(m, m, m)
    createBox(s, p, r, 0)
  }

  for (let i = 0; i < 30; i++) {
    let m = Math.random() * 300 - 150 + 5
    let m3 = Math.random() * 300 - 150 + 5
    let m2 = Math.random() * 3
    s.set(m2, m2, m2)
    p.set(m3, 0, m)
    r.set(m, m, m)
    createBox(s, p, r, 5)
  }

  loadTriangleMesh()

  createVehicle(new BABYLON.Vector3(0, 4, -20), ZERO_QUATERNION)

  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)

  scene.registerBeforeRender(function () {
    var dt = engine.getDeltaTime().toFixed() / 1000

    if (vehicleReady) {
      var speed = vehicle.getCurrentSpeedKmHour()
      var maxSteerVal = 0.2
      breakingForce = 0
      engineForce = 0

      if (actions.acceleration) {
        if (speed < -1) {
          breakingForce = maxBreakingForce
        } else {
          engineForce = maxEngineForce
        }
      } else if (actions.braking) {
        if (speed > 1) {
          breakingForce = maxBreakingForce
        } else {
          engineForce = -maxEngineForce
        }
      }

      if (actions.right) {
        if (vehicleSteering < steeringClamp) {
          vehicleSteering += steeringIncrement
        }
      } else if (actions.left) {
        if (vehicleSteering > -steeringClamp) {
          vehicleSteering -= steeringIncrement
        }
      } else {
        vehicleSteering = 0
      }

      vehicle.applyEngineForce(engineForce, FRONT_LEFT)
      vehicle.applyEngineForce(engineForce, FRONT_RIGHT)

      vehicle.setBrake(breakingForce / 2, FRONT_LEFT)
      vehicle.setBrake(breakingForce / 2, FRONT_RIGHT)
      vehicle.setBrake(breakingForce, BACK_LEFT)
      vehicle.setBrake(breakingForce, BACK_RIGHT)

      vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT)
      vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT)

      var tm, p, q, i
      var n = vehicle.getNumWheels()
      for (i = 0; i < n; i++) {
        vehicle.updateWheelTransform(i, true)
        tm = vehicle.getWheelTransformWS(i)
        p = tm.getOrigin()
        q = tm.getRotation()
        wheelMeshes[i].position.set(p.x(), p.y(), p.z())
        wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w())
        wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI / 2)
      }

      tm = vehicle.getChassisWorldTransform()
      p = tm.getOrigin()
      q = tm.getRotation()
      chassisMesh.position.set(p.x(), p.y(), p.z())
      chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w())
      chassisMesh.rotate(BABYLON.Axis.X, Math.PI)
    }
  })

  return scene
}

export const onRender = (scene: Scene) => {}

export default {
  initScene,
  onRender,
}
