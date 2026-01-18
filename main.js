import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let cube, reticle;
let hitTestSource = null;
let placed = false;

init();
animate();

function init() {
  // ===== Scene =====
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0); // 👉 THẤY HÌNH KHI CHƯA BẬT AR

  // ===== Camera =====
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 20);
  camera.position.set(0, 0.5, 1.5);

  // ===== Renderer =====
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // ===== Light =====
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));

  // ===== HÌNH LẬP PHƯƠNG – MỖI MẶT 1 MÀU =====
  const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0xff0000 }), // đỏ
    new THREE.MeshStandardMaterial({ color: 0x00ff00 }), // xanh lá
    new THREE.MeshStandardMaterial({ color: 0x0000ff }), // xanh dương
    new THREE.MeshStandardMaterial({ color: 0xffff00 }), // vàng
    new THREE.MeshStandardMaterial({ color: 0xff00ff }), // tím
    new THREE.MeshStandardMaterial({ color: 0x00ffff })  // cyan
  ];

  cube = new THREE.Mesh(geometry, materials);
  cube.position.set(0, 0, 0);
  scene.add(cube); // 👉 LUÔN THẤY KHI CHƯA BẬT AR

  // ===== Reticle (vòng tròn xanh) =====
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.09, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.rotation.x = -Math.PI / 2;
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // ===== Nút AR =====
  document.getElementById("btn-ar").onclick = () => {
    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
    );
  };

  // ===== Chạm để đặt hình =====
  const controller = renderer.xr.getController(0);
  controller.addEventListener("select", () => {
    if (reticle.visible) {
      cube.position.setFromMatrixPosition(reticle.matrix);
      placed = true;
    }
  });
  scene.add(controller);

  window.addEventListener("resize", onResize);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(_, frame) {
  const session = renderer.xr.getSession();

  if (frame && session) {
    const refSpace = renderer.xr.getReferenceSpace();

    if (!hitTestSource) {
      session.requestReferenceSpace("viewer").then(space => {
        session.requestHitTestSource({ space }).then(source => {
          hitTestSource = source;
        });
      });
    }

    if (hitTestSource) {
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length > 0) {
        reticle.visible = true;
        reticle.matrix.fromArray(
          hits[0].getPose(refSpace).transform.matrix
        );
      } else {
        reticle.visible = false;
      }
    }
  }

  // 👉 Xoay nhẹ để dễ quan sát
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
