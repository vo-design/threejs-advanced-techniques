import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import GUI from "lil-gui"
import CANNON from "cannon"

/**
 * Debug
 */
const gui = new GUI({
    title: "Physics",
})
const debugObject = {}

debugObject.soundEnabled = false
gui.add(debugObject, "soundEnabled").name("Sound Enabled")

debugObject.createSphere = () => {
    createSphere(Math.random() * 0.5, {
        x: (Math.random() - 0.5) * 3,
        y: 3,
        z: (Math.random() - 0.5) * 3,
    })
}

debugObject.createBox = () => {
    createBox(Math.random(), Math.random(), Math.random(), {
        x: (Math.random() - 0.5) * 3,
        y: 3,
        z: (Math.random() - 0.5) * 3,
    })
}

debugObject.createCylinder = () => {
    createCylinder(
        Math.random() * 0.5 + 0.1, // Radius
        Math.random() * 1 + 0.5, // Height
        {
            x: (Math.random() - 0.5) * 3,
            y: 3,
            z: (Math.random() - 0.5) * 3,
        },
    )
}

debugObject.reset = () => {
    for (const object of objectsToUpdate) {
        // Remove body
        object.body.removeEventListener("collide", playHitSound)
        world.removeBody(object.body)

        // Remove mesh
        scene.remove(object.mesh)
    }

    objectsToUpdate.splice(0, objectsToUpdate.length)
}

gui.add(debugObject, "createSphere").name("Create Sphere")
gui.add(debugObject, "createBox").name("Create Box")
gui.add(debugObject, "createCylinder").name("Create Cylinder")
gui.add(debugObject, "reset").name("Reset all figures")

// Color palette that harmonizes with the floor
const colorPalette = [
    new THREE.Color("#E63946"), // Red
    new THREE.Color("#457B9D"), // Blue
    new THREE.Color("#1D3557"), // Dark Blue
    new THREE.Color("#F1FAEE"), // Off-white
    new THREE.Color("#A8DADC"), // Light Blue
    new THREE.Color("#FFB703"), // Yellow
    new THREE.Color("#FB8500"), // Orange
]

// Function to get a random color from the palette
const getRandomColor = () => {
    return colorPalette[Math.floor(Math.random() * colorPalette.length)]
}

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

/**
 * Sounds
 */
const hitSound = new Audio("/sounds/hit.mp3")

const playHitSound = (collision) => {
    if (!debugObject.soundEnabled) return

    const impactStrength = collision.contact.getImpactVelocityAlongNormal()

    if (impactStrength > 1.5) {
        hitSound.volume = Math.random()
        hitSound.currentTime = 0
        hitSound.play()
    }
}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    "/textures/environmentMaps/0/px.png",
    "/textures/environmentMaps/0/nx.png",
    "/textures/environmentMaps/0/py.png",
    "/textures/environmentMaps/0/ny.png",
    "/textures/environmentMaps/0/pz.png",
    "/textures/environmentMaps/0/nz.png",
])

/**
 * Physics
 */

//World
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, -9.82, 0)

//Material
const defaultMaterial = new CANNON.Material("default")
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.1,
    restitution: 0.7,
})
world.addContactMaterial(defaultContactMaterial)

//Floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.material = defaultMaterial
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
world.addBody(floorBody)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({
        color: "#777777",
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5,
    }),
)
floor.receiveShadow = true
floor.rotation.x = -Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = -7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = -7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Utils
 */
const objectsToUpdate = []

//Sphere
const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)
const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 32)

const createMaterial = () => {
    return new THREE.MeshStandardMaterial({
        color: getRandomColor(),
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5,
    })
}

const createSphere = (radius, position) => {
    // Three.js mesh
    const material = createMaterial()
    const mesh = new THREE.Mesh(sphereGeometry, material)
    mesh.castShadow = true
    mesh.scale.set(radius, radius, radius)
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Sphere(radius)

    const body = new CANNON.Body({
        mass: 1,
        shape: shape,
        material: defaultMaterial,
    })
    body.position.copy(position)
    body.addEventListener("collide", playHitSound)
    world.addBody(body)

    // Save in objects to update
    objectsToUpdate.push({
        mesh: mesh,
        body: body,
    })
}

const createBox = (width, height, depth, position) => {
    // Three.js mesh
    const material = createMaterial()
    const mesh = new THREE.Mesh(boxGeometry, material)
    mesh.scale.set(width, height, depth)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))

    const body = new CANNON.Body({
        mass: 1,
        shape: shape,
        material: defaultMaterial,
    })
    body.position.copy(position)
    body.addEventListener("collide", playHitSound)
    world.addBody(body)

    // Save in objects
    objectsToUpdate.push({ mesh, body })
}

const createCylinder = (radius, height, position) => {
    // Three.js mesh
    const material = createMaterial()
    const mesh = new THREE.Mesh(cylinderGeometry, material)
    mesh.castShadow = true
    mesh.scale.set(radius, height, radius)
    mesh.position.copy(position)
    scene.add(mesh)

    // For cylinder, use a box as a simpler approximation
    const shape = new CANNON.Box(new CANNON.Vec3(radius, height * 0.5, radius))

    const body = new CANNON.Body({
        mass: 1,
        shape: shape,
        material: defaultMaterial,
    })
    body.position.copy(position)
    body.addEventListener("collide", playHitSound)
    world.addBody(body)

    // Save in objects
    objectsToUpdate.push({ mesh, body })
}

createSphere(0.5, { x: 0, y: 3, z: 0 })

createBox(1, 1.5, 2, { x: 0, y: 3, z: 0 })

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    //Update physics world
    world.step(1 / 60, deltaTime, 3)

    for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
