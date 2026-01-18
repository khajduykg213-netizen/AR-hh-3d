import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js'

let scene, camera, renderer
let modelGroup = null
let edgeHelper = null
let vertexHelper = null
let autoRotate = true

init()
animate()

function init() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    30
  )

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  document.body.appendChild(renderer.domElement)

  document.body.appendChild(ARButton.createButton(renderer))

  // Ánh sáng chuẩn sư phạm
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))
  const light = new THREE.DirectionalLight(0xffffff, 0.8)
  light.position.set(2, 3, 2)
  scene.add(light)

  // UI
  document.getElementById('shape').onchange = e => createShape(e.target.value)
  document.getElementById('toggleEdge').onclick = toggleEdge
  document.getElementById('toggleVertex').onclick = toggleVertex
  document.getElementById('toggleRotate').onclick = toggleRotate

  createShape('box')

  window.addEventListener('resize', onResize)
}

function createShape(type) {
  if (modelGroup) scene.remove(modelGroup)

  modelGroup = new THREE.Group()

  let geometry

  switch (type) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.15, 48, 48)
      break

    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 48)
      break

    case 'cone':
      geometry = new THREE.ConeGeometry(0.12, 0.25, 48)
      break

    case 'prism':
      geometry = createTriangularPrism()
      break

    case 'pyramid':
      geometry = createSquarePyramid()
      break

    default:
      geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
  }

  // ===== MẶT – MỖI MẶT 1 MÀU =====
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.15,
  })

  const mesh = new THREE.Mesh(geometry, material)
  modelGroup.add(mesh)

  // ===== CẠNH =====
  edgeHelper = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  )
  modelGroup.add(edgeHelper)

  // ===== ĐỈNH (BÁM TUYỆT ĐỐI) =====
  const vertices = geometry.attributes.position
  const dots = []

  for (let i = 0; i < vertices.count; i++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    dot.position.fromBufferAttribute(vertices, i)
    dots.push(dot)
  }

  vertexHelper = new THREE.Group()
  dots.forEach(d => vertexHelper.add(d))
  modelGroup.add(vertexHelper)

  modelGroup.position.set(0, 0, -0.7)
  scene.add(modelGroup)
}

function animate() {
  renderer.setAnimationLoop(() => {
    if (modelGroup && autoRotate) {
      modelGroup.rotation.y += 0.006
      modelGroup.rotation.x += 0.003
    }
    renderer.render(scene, camera)
  })
}

function toggleEdge() {
  if (edgeHelper) edgeHelper.visible = !edgeHelper.visible
}

function toggleVertex() {
  if (vertexHelper) vertexHelper.visible = !vertexHelper.visible
}

function toggleRotate() {
  autoRotate = !autoRotate
  document.getElementById('toggleRotate').innerText =
    autoRotate ? 'Tắt xoay' : 'Bật xoay'
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

/* ===== HÌNH ĐẶC BIỆT ===== */

function createTriangularPrism() {
  const geometry = new THREE.BufferGeometry()

  const vertices = new Float32Array([
    0, 0.15, 0.1,
    -0.13, -0.15, 0.1,
    0.13, -0.15, 0.1,

    0, 0.15, -0.1,
    -0.13, -0.15, -0.1,
    0.13, -0.15, -0.1,
  ])

  const indices = [
    0,1,2, 3,5,4,
    0,2,5, 0,5,3,
    0,3,4, 0,4,1,
    1,4,5, 1,5,2
  ]

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  colorize(geometry)
  return geometry
}

function createSquarePyramid() {
  const geometry = new THREE.BufferGeometry()

  const vertices = new Float32Array([
    -0.15, 0, 0.15,
    0.15, 0, 0.15,
    0.15, 0, -0.15,
    -0.15, 0, -0.15,
    0, 0.25, 0
  ])

  const indices = [
    0,1,2, 0,2,3,
    0,1,4,
    1,2,4,
    2,3,4,
    3,0,4
  ]

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  colorize(geometry)
  return geometry
}

function colorize(geometry) {
  const colors = []
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    colors.push(Math.random(), Math.random(), Math.random())
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
}
