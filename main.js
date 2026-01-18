import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer;
let currentMesh, edgeHelper;
let controls;

init();
animate();

function init() {
  // ===== SCENE =====
  scene = new THREE.Scene();

  // ===== CAMERA (ĐẶT ĐƠN GIẢN – CHẮC CHẮN THẤY) =====
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    50
  );
  camera.position.set(0, 0, 1.5);

  // ===== RENDERER =====
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // ===== CONTROLS (XOAY 360°) =====
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // 🔴 BẮT BUỘC: camera nhìn đúng tâm
  controls.target.set(0, 0, 0);
  controls.update();

  // ===== ÁNH SÁNG (ĐỦ – KHÔNG QUÁ PHỨC TẠP) =====
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 2, 2);
  scene.add(light);

  // ===== NÚT AR =====
  document.getElementById("btn-ar").onclick = () => {
    document.body.appendChild(ARButton.createButton(renderer));
  };

  document.getElementById("shape").onchange = (e) => {
    createShape(e.target.value);
  };

  // ===== HÌNH MẶC ĐỊNH (CHẮC CHẮN THẤY) =====
  createShape("box");

  window.addEventListener("resize", onResize);
}

function createShape(type) {
  if (currentMesh) scene.remove(currentMesh);
  if (edgeHelper) scene.remove(edgeHelper);

  let geometry;
  switch (type) {
    case "sphere":
      geometry = new THREE.SphereGeometry(0.25, 32, 32);
      break;
    case "cylinder":
      geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 32);
      break;
    case "cone":
      geometry = new THREE.ConeGeometry(0.25, 0.4, 32);
      break;
    default:
      geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0x2196f3,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95
  });

  currentMesh = new THREE.Mesh(geometry, material);
  currentMesh.position.set(0, 0, 0);
  scene.add(currentMesh);

  // ===== HIỂN THỊ CẠNH =====
  edgeHelper = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  );
  scene.add(edgeHelper);
}

function animate() {
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
