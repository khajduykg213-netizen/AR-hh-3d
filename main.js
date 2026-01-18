import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let currentMesh;

init();
animate();

function init() {
  // ===== SCENE =====
  scene = new THREE.Scene();

  // ===== CAMERA =====
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    30
  );

  // ===== RENDERER =====
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // ===== AR BUTTON =====
  document.getElementById("btn-ar").onclick = () => {
    document.body.appendChild(
      ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"]
      })
    );
  };

  // ===== ÁNH SÁNG (CỰC KỲ QUAN TRỌNG) =====
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(2, 3, 1);
  scene.add(dirLight);

  // ===== CHỌN HÌNH =====
  document.getElementById("shape").addEventListener("change", (e) => {
    createShape(e.target.value);
  });

  // ===== HÌNH MẶC ĐỊNH =====
  createShape("box");

  window.addEventListener("resize", onResize);
}

// ==========================
// 🎯 TẠO HÌNH HỌC
// ==========================
function createShape(type) {
  if (currentMesh) scene.remove(currentMesh);

  let geometry;

  switch (type) {
    case "sphere":
      geometry = new THREE.SphereGeometry(0.15, 64, 64);
      break;

    case "cylinder":
      geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 48);
      break;

    case "cone":
      geometry = new THREE.ConeGeometry(0.12, 0.25, 48);
      break;

    default:
      geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  }

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x2196f3,
    roughness: 0.35,
    metalness: 0.1,
    clearcoat: 0.4
  });

  currentMesh = new THREE.Mesh(geometry, material);

  // ⭐ VỊ TRÍ CHUẨN: LUÔN NHÌN THẤY
  currentMesh.position.set(0, 0, -0.6);

  scene.add(currentMesh);
}

// ==========================
// 🔄 ANIMATION
// ==========================
function animate() {
  renderer.setAnimationLoop(() => {
    if (currentMesh) {
      currentMesh.rotation.y += 0.01;
      currentMesh.rotation.x += 0.005;
    }
    renderer.render(scene, camera);
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
