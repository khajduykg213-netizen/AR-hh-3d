import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer;
let mesh, edges;
let controls;

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
    20
  );
  camera.position.set(0, 0.3, 1);

  // ===== RENDERER =====
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // ===== ORBIT (XOAY 360° TRÊN MÁY TÍNH) =====
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = false;

  // ===== ÁNH SÁNG (RẤT QUAN TRỌNG – KHÔNG CÓ SẼ KHÔNG THẤY HÌNH) =====
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(2, 3, 1);
  scene.add(dirLight);

  // ===== TẠO HÌNH MẶC ĐỊNH =====
  createShape("box");

  // ===== NÚT AR CHUẨN WEBXR (KHÔNG onclick) =====
  const arButton = ARButton.createButton(renderer);
  document.body.appendChild(arButton);

  window.addEventListener("resize", onResize);
}

function createShape(type) {
  if (mesh) scene.remove(mesh);
  if (edges) scene.remove(edges);

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
      geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  }

  // ===== VẬT LIỆU ĐẸP – DỄ NHÌN TRONG LỚP HỌC =====
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x2196f3,
    roughness: 0.35,
    metalness: 0.1,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, -0.6); // ⭐ RẤT QUAN TRỌNG
  scene.add(mesh);

  // ===== HIỂN THỊ CẠNH =====
  edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  );
  edges.position.copy(mesh.position);
  scene.add(edges);
}

function animate() {
  renderer.setAnimationLoop(() => {
    if (mesh) {
      mesh.rotation.y += 0.005;
      edges.rotation.y += 0.005;
    }
    controls.update();
    renderer.render(scene, camera);
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
