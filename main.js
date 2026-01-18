import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let reticle;
let currentMesh, edgeHelper, vertexHelper;
let hitTestSource = null;
let hitTestRequested = false;

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // AR Button
  document.getElementById("btn-ar").onclick = () => {
    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
    );
  };

  // Ánh sáng
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(1, 2, 1);
  scene.add(dir);

  // Reticle (vòng tròn báo mặt bàn)
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.visible = false;
  scene.add(reticle);

  // Chạm màn hình để đặt hình
  renderer.domElement.addEventListener("click", () => {
    if (reticle.visible && currentMesh) {
      currentMesh.position.setFromMatrixPosition(reticle.matrix);
      edgeHelper.position.copy(currentMesh.position);
      vertexHelper.position.copy(currentMesh.position);
    }
  });

  // Chọn hình
  document.getElementById("shape").onchange = (e) => createShape(e.target.value);

  // Bật / tắt cạnh – đỉnh
  document.getElementById("toggle-edge").onclick = () => {
    if (edgeHelper) edgeHelper.visible = !edgeHelper.visible;
  };

  document.getElementById("toggle-vertex").onclick = () => {
    if (vertexHelper) vertexHelper.visible = !vertexHelper.visible;
  };

  createShape("box");
}

// =======================
// TẠO HÌNH
// =======================
function createShape(type) {
  if (currentMesh) scene.remove(currentMesh);
  if (edgeHelper) scene.remove(edgeHelper);
  if (vertexHelper) scene.remove(vertexHelper);

  let geometry, formula, name;

  switch (type) {
    case "sphere":
      geometry = new THREE.SphereGeometry(0.15, 48, 48);
      name = "Hình cầu";
      formula = "V = 4/3 πR³";
      break;

    case "cylinder":
      geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 32);
      name = "Hình trụ";
      formula = "V = πR²h";
      break;

    case "cone":
      geometry = new THREE.ConeGeometry(0.12, 0.25, 32);
      name = "Hình nón";
      formula = "V = 1/3 πR²h";
      break;

    default:
      geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      name = "Hình hộp chữ nhật";
      formula = "V = a·b·c";
  }

  document.getElementById("info").innerHTML =
    `<b>${name}</b><br>Công thức: ${formula}`;

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x2196f3,
    roughness: 0.3,
    metalness: 0.1,
    clearcoat: 0.4
  });

  currentMesh = new THREE.Mesh(geometry, material);
  currentMesh.position.set(0, 0, -0.6);
  scene.add(currentMesh);

  // Cạnh
  edgeHelper = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  );
  edgeHelper.position.copy(currentMesh.position);
  scene.add(edgeHelper);

  // Đỉnh
  vertexHelper = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xff0000, size: 0.02 })
  );
  vertexHelper.position.copy(currentMesh.position);
  scene.add(vertexHelper);
}

// =======================
// ANIMATION + HIT TEST
// =======================
function animate() {
  renderer.setAnimationLoop((timestamp, frame) => {
    if (frame) {
      const refSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      if (!hitTestRequested) {
        session.requestReferenceSpace("viewer").then((space) => {
          session.requestHitTestSource({ space }).then((source) => {
            hitTestSource = source;
          });
        });
        hitTestRequested = true;
      }

      if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          reticle.visible = true;
          reticle.matrix.fromArray(hit.getPose(refSpace).transform.matrix);
        } else {
          reticle.visible = false;
        }
      }
    }

    renderer.render(scene, camera);
  });
}
