import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js';

let scene, camera, renderer;
let geometryMesh;

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] })
  );

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // 🧊 HÌNH HỌC KHÔNG GIAN – HÌNH HỘP CHỮ NHẬT
  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const material = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    transparent: true,
    opacity: 0.85,
  });

  geometryMesh = new THREE.Mesh(geometry, material);
  geometryMesh.position.set(0, 0, -0.5);
  scene.add(geometryMesh);

  window.addEventListener('resize', onWindowResize);
}

function animate() {
  renderer.setAnimationLoop(() => {
    geometryMesh.rotation.y += 0.01;
    renderer.render(scene, camera);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
