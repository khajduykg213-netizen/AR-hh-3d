import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let controller;
let reticle;
let currentMesh = null;
let edgeHelper = null;
let vertexHelper = null;

init();
animate();

/* ================= INIT ================= */
function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
  );

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2));

  /* ===== Reticle (vòng tròn đặt hình) ===== */
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.08, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.rotation.x = -Math.PI / 2;
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  /* ===== Controller ===== */
  controller = renderer.xr.getController(0);
  scene.add(controller);

  /* ===== Touch đặt hình ===== */
  renderer.domElement.addEventListener("touchstart", placeObject);

  /* ===== UI ===== */
  document.getElementById("shapeSelect").addEventListener("change", createShape);
  document.getElementById("toggleEdges").onclick = toggleEdges;
  document.getElementById("toggleVertices").onclick = toggleVertices;

  createShape();
}

/* ================= SHAPES ================= */
function createShape() {
  clearScene();

  const type = document.getElementById("shapeSelect").value;
  let geometry;

  if (type === "box") geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  if (type === "sphere") geometry = new THREE.SphereGeometry(0.1, 32, 32);
  if (type === "cylinder") geometry = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 32);
  if (type === "cone") geometry = new THREE.ConeGeometry(0.08, 0.18, 32);

  const material = new THREE.MeshStandardMaterial({
    color: 0x2196f3,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9
  });

  currentMesh = new THREE.Mesh(geometry, material);
  scene.add(currentMesh);

  updateFormula(type);
}

/* ================= PLACE ================= */
function placeObject() {
  if (!reticle.visible || !currentMesh) return;

  currentMesh.position.setFromMatrixPosition(reticle.matrix);

  if (edgeHelper) edgeHelper.position.copy(currentMesh.position);
  if (vertexHelper) vertexHelper.position.copy(currentMesh.position);
}

/* ================= HELPERS ================= */
function toggleEdges() {
  if (!currentMesh) return;

  if (edgeHelper) {
    scene.remove(edgeHelper);
    edgeHelper = null;
  } else {
    edgeHelper = new THREE.LineSegments(
      new THREE.EdgesGeometry(currentMesh.geometry),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    edgeHelper.position.copy(currentMesh.position);
    scene.add(edgeHelper);
  }
}

function toggleVertices() {
  if (!currentMesh) return;

  if (vertexHelper) {
    scene.remove(vertexHelper);
    vertexHelper = null;
  } else {
    const points = currentMesh.geometry.attributes.position;
    const dots = [];
    for (let i = 0; i < points.count; i++) {
      dots.push(new THREE.Vector3().fromBufferAttribute(points, i));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(dots);
    vertexHelper = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xff0000, size: 0.01 })
    );
    vertexHelper.position.copy(currentMesh.position);
    scene.add(vertexHelper);
  }
}

/* ================= FORMULA ================= */
function updateFormula(type) {
  const f = document.getElementById("formula");
  if (type === "box") f.innerHTML = "V = a³";
  if (type === "sphere") f.innerHTML = "V = 4/3 πr³";
  if (type === "cylinder") f.innerHTML = "V = πr²h";
  if (type === "cone") f.innerHTML = "V = 1/3 πr²h";
}

/* ================= CLEAN ================= */
function clearScene() {
  if (currentMesh) scene.remove(currentMesh);
  if (edgeHelper) scene.remove(edgeHelper);
  if (vertexHelper) scene.remove(vertexHelper);
  edgeHelper = null;
  vertexHelper = null;
}

/* ================= ANIMATE ================= */
function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const refSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!session.hitTestSourceRequested) {
      session.requestReferenceSpace("viewer").then(space => {
        session.requestHitTestSource({ space }).then(source => {
          session.hitTestSource = source;
        });
      });
      session.hitTestSourceRequested = true;
    }

    if (session.hitTestSource) {
      const hits = frame.getHitTestResults(session.hitTestSource);
      if (hits.length) {
        const pose = hits[0].getPose(refSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  if (currentMesh) currentMesh.rotation.y += 0.01;

  renderer.render(scene, camera);
}
