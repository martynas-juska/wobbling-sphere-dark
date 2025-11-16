import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import wobbleVertexShadder from './shaders/wobble/vertex.glsl'
import wobbleFragmentShader from './shaders/wobble/fragment.glsl'

/**
 * ============================================
 * INITIALIZATION
 * ============================================
 */
const canvas = document.querySelector('canvas.webgl')
const heroContainer = document.querySelector('.webgl-hero')
const loaderEl = document.querySelector('.webgl-loader')
const progressBar = document.querySelector('.progress-bar')

if (!canvas) {
    throw new Error('Canvas element required')
}

/**
 * ============================================
 * DEVICE DETECTION
 * ============================================
 */
const screenWidth = window.innerWidth
const screenHeight = window.innerHeight
const totalPixels = screenWidth * screenHeight
const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
const cpuCores = navigator.hardwareConcurrency || 4
const deviceMemory = navigator.deviceMemory || 4

// Performance tier detection
let performanceTier = 'medium'

if (cpuCores >= 8 && deviceMemory >= 8) {
    performanceTier = 'ultra'
} else if (cpuCores >= 6 && deviceMemory >= 6) {
    performanceTier = 'high'
} else if (cpuCores >= 4 && deviceMemory >= 4) {
    performanceTier = 'medium'
} else {
    performanceTier = 'low'
}

// Boost tier for smaller resolutions
if (totalPixels <= 1920 * 1080 && performanceTier === 'medium') {
    performanceTier = 'high'
}

/**
 * ============================================
 * CONFIG
 * ============================================
 */
const performanceConfig = {
    ultra: {
        subdivisions: 75,
        pixelRatioMultiplier: 2.0,
        basePixelRatio: 2,
        antialias: true,
        enableEnvironment: true,
        enableShadows: true,
        normalShift: 0.006,
        chromaticAberration: 0.0015
    },
    high: {
        subdivisions: 65,
        pixelRatioMultiplier: 1.5,
        basePixelRatio: 2,
        antialias: true,
        enableEnvironment: true,
        enableShadows: true,
        normalShift: 0.007,
        chromaticAberration: 0.001
    },
    medium: {
        subdivisions: 55,
        pixelRatioMultiplier: 1.2,
        basePixelRatio: 2,
        antialias: true,
        enableEnvironment: true,
        enableShadows: true,
        normalShift: 0.008,
        chromaticAberration: 0.0008
    },
    low: {
        subdivisions: 45,
        pixelRatioMultiplier: 1.0,
        basePixelRatio: 2,
        antialias: true,
        enableEnvironment: true,
        enableShadows: false,
        normalShift: 0.009,
        chromaticAberration: 0.0005
    }
}

const config = performanceConfig[performanceTier]

/**
 * ============================================
 * SCENE SETUP
 * ============================================
 */
const scene = new THREE.Scene()

/**
 * ============================================
 * WOBBLE SHADER SETUP
 * ============================================
 */
const uniforms = {
    uTime: new THREE.Uniform(0),
    uPositionFrequency: new THREE.Uniform(0.233),
    uTimeFrequency: new THREE.Uniform(0.13),
    uStrength: new THREE.Uniform(0.492),
    uWarpPositionFrequency: new THREE.Uniform(0.4),
    uWarpTimeFrequency: new THREE.Uniform(0.3),
    uWarpStrength: new THREE.Uniform(1.8),
    uNormalShift: new THREE.Uniform(config.normalShift),
    uSmoothingFactor: new THREE.Uniform(0.6),
    uMouseInfluence: new THREE.Uniform(new THREE.Vector2(0, 0)),
    uChromaticAberration: new THREE.Uniform(config.chromaticAberration),
    uResolution: new THREE.Uniform(new THREE.Vector2(screenWidth, screenHeight))
}

const material = new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: wobbleVertexShadder,
    fragmentShader: wobbleFragmentShader,
    uniforms: uniforms,
    silent: true,
    metalness: 1,
    roughness: 0.38,
    color: '#68707A',
    transmission: 0,
    ior: 10,
    thickness: 0,
    transparent: false,
    wireframe: false,
    clearcoat: 0.08,
    clearcoatRoughness: 0.1,
    flatShading: false
})

const Depthmaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: wobbleVertexShadder,
    uniforms: uniforms,
    silent: true,
    depthPacking: THREE.RGBADepthPacking
})

/**
 * ============================================
 * GEOMETRY
 * ============================================
 */
let geometry = new THREE.IcosahedronGeometry(2.2, config.subdivisions)
geometry = mergeVertices(geometry)
geometry.computeTangents()

const wobble = new THREE.Mesh(geometry, material)
wobble.customDepthMaterial = Depthmaterial
wobble.receiveShadow = config.enableShadows
wobble.castShadow = config.enableShadows
wobble.visible = false
scene.add(wobble)

/**
 * ============================================
 * LIGHTS
 * ============================================
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 12)
directionalLight.castShadow = config.enableShadows
if (config.enableShadows) {
    directionalLight.shadow.mapSize.set(512, 512)
    directionalLight.shadow.camera.far = 15
    directionalLight.shadow.normalBias = 0.05
    directionalLight.shadow.bias = -0.0001
}
directionalLight.position.set(3, 4, -3)
scene.add(directionalLight)

const fillLight = new THREE.DirectionalLight('#4a7c9e', 6)
fillLight.position.set(-4, 2, 3)
scene.add(fillLight)

const rimLight = new THREE.DirectionalLight('#8bb8d8', 2)
rimLight.position.set(0, -1, -4)
scene.add(rimLight)

const ambientLight = new THREE.AmbientLight('#AAAAEE', 1.5)
scene.add(ambientLight)

/**
 * ============================================
 * SIZES
 * ============================================
 */
const container = heroContainer || document.body
const sizes = {
    width: container.clientWidth || window.innerWidth,
    height: container.clientHeight || window.innerHeight,
    basePixelRatio: Math.min(window.devicePixelRatio, config.basePixelRatio)
}

/**
 * ============================================
 * CAMERA
 * ============================================
 */
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)

const getCameraPosition = (width) => {
    if (width <= 350) return { x: 9, y: -2, z: -4.5 }
    if (width <= 450) return { x: 10, y: -2.3, z: -5 }
    if (width <= 550) return { x: 11, y: -2.5, z: -5.5 }
    if (width <= 700) return { x: 12.5, y: -3, z: -6 }
    return { x: 14, y: -3.5, z: -7 }
}

const cameraPos = getCameraPosition(sizes.width)
camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
scene.add(camera)

/**
 * ============================================
 * ORBIT CONTROLS
 * ============================================
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = hasTouch ? 0.08 : 0.05
controls.enabled = true
controls.enableZoom = true
controls.enablePan = false
controls.minDistance = 6
controls.maxDistance = 25
controls.autoRotate = false
controls.autoRotateSpeed = 0.5

if (hasTouch) {
    controls.rotateSpeed = 0.5
    controls.zoomSpeed = 0.8
}

/**
 * ============================================
 * RENDERER
 * ============================================
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: config.antialias,
    alpha: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    preserveDrawingBuffer: false
})

renderer.setClearAlpha(0)
renderer.shadowMap.enabled = config.enableShadows
renderer.shadowMap.type = config.enableShadows ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.8
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(sizes.basePixelRatio * config.pixelRatioMultiplier, 4))

/**
 * ============================================
 * ENVIRONMENT MAP
 * ============================================
 */
let pmremGenerator = null
let darkEnvMap = null

if (config.enableEnvironment) {
    pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    const darkEnvironmentScene = new THREE.Scene()
    darkEnvironmentScene.add(new THREE.PointLight('#1a3a52', 0.5).clone())
    darkEnvironmentScene.add(new THREE.PointLight('#0f1a28', 0.3).clone())
    darkEnvironmentScene.add(new THREE.PointLight('#2a4a5e', 0.4).clone())
    darkEnvironmentScene.add(new THREE.AmbientLight('#0a1520', 0.2))
    
    darkEnvMap = pmremGenerator.fromScene(darkEnvironmentScene).texture
    material.envMap = darkEnvMap
    material.envMapIntensity = 1.0
    material.needsUpdate = true

    // Clean up immediately
    darkEnvironmentScene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) object.material.dispose()
    })
    darkEnvironmentScene.clear()
}

/**
 * ============================================
 * SHADER PRECOMPILATION
 * ============================================
 */
wobble.visible = true
for (let i = 0; i < 30; i++) {
    wobble.rotation.y += 0.01
    uniforms.uTime.value = i * 0.016
    renderer.render(scene, camera)
}
wobble.rotation.set(0, 0, 0)
wobble.visible = false
uniforms.uTime.value = 0

/**
 * ============================================
 * LOADING ANIMATION
 * ============================================
 */
let progress = 0
let loaderInterval = null

const animateLoader = () => {
    loaderInterval = setInterval(() => {
        progress += 4
        if (progressBar) {
            progressBar.style.width = `${Math.min(progress, 100)}%`
        }
        if (progress >= 100) {
            clearInterval(loaderInterval)
            loaderInterval = null
            setTimeout(revealScene, 200)
        }
    }, 30)
}

const revealScene = () => {
    if (loaderEl) loaderEl.classList.add('loaded')
    if (canvas) canvas.classList.add('visible')
    
    wobble.visible = true
    wobble.scale.set(0.8, 0.8, 0.8)
    
    const duration = 1200
    const startTime = Date.now()
    
    const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const scale = 0.8 + (eased * 0.2)
        wobble.scale.set(scale, scale, scale)
        
        if (progress < 1) {
            requestAnimationFrame(animate)
        } else {
            wobble.scale.set(1, 1, 1)
            if (loaderEl) {
                setTimeout(() => loaderEl.classList.add('hidden'), 600)
            }
            window.dispatchEvent(new CustomEvent('wobbleSphereReady'))
        }
    }
    animate()
}

animateLoader()

/**
 * ============================================
 * VISIBILITY TRACKING
 * ============================================
 */
let isTabVisible = true
let isInViewport = true

const handleVisibilityChange = () => {
    isTabVisible = !document.hidden
}

const observerTarget = heroContainer || canvas

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        isInViewport = entry.isIntersecting
    })
}, {
    threshold: 0.1,
    rootMargin: '50px'
})

intersectionObserver.observe(observerTarget)
document.addEventListener('visibilitychange', handleVisibilityChange)

/**
 * ============================================
 * RESIZE HANDLER
 * ============================================
 */
const handleResize = () => {
    sizes.width = container.clientWidth || window.innerWidth
    sizes.height = container.clientHeight || window.innerHeight
    sizes.basePixelRatio = Math.min(window.devicePixelRatio, config.basePixelRatio)

    const cameraPos = getCameraPosition(sizes.width)
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    uniforms.uResolution.value.set(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(sizes.basePixelRatio * config.pixelRatioMultiplier, 4))
}

window.addEventListener('resize', handleResize)

/**
 * ============================================
 * ANIMATION LOOP
 * ============================================
 */
const clock = new THREE.Clock()
let animationId = null

const tick = () => {
    if (!isTabVisible || !isInViewport) {
        animationId = requestAnimationFrame(tick)
        return
    }

    uniforms.uTime.value = clock.getElapsedTime()
    controls.update()
    renderer.render(scene, camera)
    animationId = requestAnimationFrame(tick)
}

tick()

/**
 * ============================================
 * CLEANUP
 * ============================================
 */
const cleanup = () => {
    // Stop animations
    if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
    }
    if (loaderInterval) {
        clearInterval(loaderInterval)
        loaderInterval = null
    }

    // Remove listeners
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (intersectionObserver) intersectionObserver.disconnect()

    // Dispose geometry and materials
    if (wobble?.geometry) wobble.geometry.dispose()
    if (material) material.dispose()
    if (Depthmaterial) Depthmaterial.dispose()

    // Dispose environment
    if (pmremGenerator) pmremGenerator.dispose()
    if (darkEnvMap) darkEnvMap.dispose()

    // Dispose controls
    if (controls) controls.dispose()

    // Clean scene
    scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(mat => mat.dispose())
            } else {
                object.material.dispose()
            }
        }
    })
    
    while(scene.children.length > 0) {
        scene.remove(scene.children[0])
    }

    // Dispose renderer
    renderer.dispose()
    renderer.forceContextLoss()
}

window.addEventListener('beforeunload', cleanup)

// Monitor if canvas is removed from DOM
const canvasObserver = new MutationObserver((mutations) => {
    if (!document.body.contains(canvas)) {
        cleanup()
        canvasObserver.disconnect()
    }
})

canvasObserver.observe(document.body, {
    childList: true,
    subtree: true
})