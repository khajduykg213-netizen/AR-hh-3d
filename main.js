import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js'

let scene, camera, renderer
let modelGroup, edgeHelper, vertexHelper
let autoRotate = true

init()
animate()

function init() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  document.body.appendChild(renderer.domElement)
  document.body.appendChild(ARButton.createButton(renderer))

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))
  const light = new THREE.DirectionalLight(0xffffff, 0.8)
  light.position.set(2, 3, 2)
  scene.add(light)

  document.getElementById('shape').onchange = e => createShape(e.target.value)
  document.getElementById('toggleEdge').onclick = () => edgeHelper.visible = !edgeHelper.visible
  document.getElementById('toggleVertex').onclick = () => vertexHelper.visible = !vertexHelper.visible
  document.getElementById('toggleRotate').onclick = toggleRotate

  createShape('box')
  window.addEventListener('resize', onResize)
}

function createShape(type) {
  if (modelGroup) scene.remove(modelGroup)
  modelGroup = new THREE.Group()

  let geometry
  switch (type) {
    case 'sphere': geometry = new THREE.SphereGeometry(0.15, 48, 48); break
    case 'cylinder': geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 48); break
    case 'cone': geometry = new THREE.ConeGeometry(0.12, 0.25, 48); break
    case 'prism': geometry = triangularPrism(); break
    case 'pyramid': geometry = squarePyramid(); break
    default: geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
  }

  colorize(geometry)

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true })
  )
  modelGroup.add(mesh)

  edgeHelper = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  )
  modelGroup.add(edgeHelper)

  vertexHelper = new THREE.Group()
  const pos = geometry.attributes.position
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  for (let i = 0; i < pos.count; i++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    dot.position.fromBufferAttribute(pos, i)
    vertexHelper.add(dot)

    const label = createLabel(labels[i])
    label.position.copy(dot.position).add(new THREE.Vector3(0, 0.03, 0))
    vertexHelper.add(label)
  }

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

/* ===== HÀM HÌNH HỌC ===== */

function triangularPrism() {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([
     0,0.15,0.1, -0.13,-0.15,0.1, 0.13,-0.15,0.1,
     0,0.15,-0.1, -0.13,-0.15,-0.1, 0.13,-0.15,-0.1
  ], 3))
  g.setIndex([0,1,2, 3,5,4, 0,2,5, 0,5,3, 0,3,4, 0,4,1, 1,4,5, 1,5,2])
  g.computeVertexNormals()
  return g
}

function squarePyramid() {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.15,0,0.15, 0.15,0,0.15, 0.15,0,-0.15, -0.15,0,-0.15, 0,0.25,0
  ], 3))
  g.setIndex([0,1,2, 0,2,3, 0,1,4, 1,2,4, 2,3,4, 3,0,4])
  g.computeVertexNormals()
  return g
}

function colorize(g) {
  const colors = []
  for (let i = 0; i < g.attributes.position.count; i++)
    colors.push(Math.random(), Math.random(), Math.random())
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
}

function createLabel(text) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(64,64,60,0,Math.PI*2)
  ctx.fill()
  ctx.fillStyle = 'black'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text,64,64)
  const t = new THREE.CanvasTexture(c)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t }))
  s.scale.set(0.08,0.08,0.08)
  return s
}
