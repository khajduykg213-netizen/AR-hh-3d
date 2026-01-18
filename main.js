import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let reticle, currentMesh, edgeHelper, vertexHelper;

let touchMode = null;
let startDistance = 0;
let startScale = 1;
let startAngle = 0;
let startRotation = 0;

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

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] }));

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2));

  /* ===== Reticle ===== */
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.08, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.rotation.x = -Math.PI / 2;
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  /* ===== Touch ===== */
  const dom = renderer.domElement;
  dom.addEventListener("touchstart", onTouchStart);
  dom.addEventListener("touchmove", onTouchMove);
  dom.addEventListener("touchend", () => (touchMode = null));

  /* ===== UI ===== */
  document.getElementById("shapeSelect").onchange = createShape;
  document.getElementById("toggleEdges").onclick = toggleEdges;
  document.getElementById("toggleVertices").onclick = toggleVertices;

  createShape();
}

/* ================= TOUCH ================= */
function onTouchStart(e) {
  if (!currentMesh) return;

  if (e.touches.length === 1) {
    placeObject();
  }

  if (e.touches.length === 2) {
    touchMode = "transform";

    startDistance = getDistance(e.touches);
    startAngle = getAngle(e.touches);

    startScale = currentMesh.scale.x;
    startRotation = currentMesh.rotation.y;
  }
}

function onTouchMove(e) {
  if (touchMode !== "transform" || e.touches.length !== 2) return;

  const newDistance = getDistance(e.touches);
  const newAngle = getAngle(e.touches);

  const scaleFactor = newDistance / startDistance;
  currentMesh.scale.setScalar(startScale * scaleFactor);

  currentMesh.rotation.y = startRotation + (newAngle - startAngle);
}

/* ================= HELPERS ================= */
function getDistance(t) {
  return Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
}

function getAngle(t) {
  return Math.atan2(t[1].pageY - t[0].pageY, t[1].pageX - t[0].pageX);
}

/* ================= SHAPE ================= */
function createShape() {
  clearScene();

  const type = document.getElementById("shapeSelect").value;
  let geometry;

  if (type === "box") geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  if (type === "sphere") geometry = new THREE.SphereGeometry(0.1, 32, 32);
  if (type === "cylinder") geometry = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 32);
  if (type === "cone") geometry = new THREE.ConeGeometry(0.08, 0.18, 32);

  currentMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x2196f3,
      metalness: 0.3,
      roughness: 0.4,
      opacity: 0.9,
      transparent: true
    })
  );

  scene.add(currentMesh);
  updateFormula(type);
}

/* ================= PLACE ================= */
function placeObject() {
  if (!reticle.visible || !currentMesh) return;
  currentMesh.position.setFromMatrixPosition(reticle.matrix);
}

/* ================= EDGES / VERTICES ================= */
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
    const pts = currentMesh.geometry.attributes.position;
    const arr = [];
    for (let i = 0; i < pts.count; i++)
      arr.push(new THREE.Vector3().fromBufferAttribute(pts, i));

    vertexHelper = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(arr),
      new THREE.PointsMaterial({ color: 0xff0000, size: 0.01 })
    );

    vertexHelper.position.copy(currentMesh.position);
    scene.add(vertexHelper);
  }
}

/* ================= FORMULA ================= */
function updateFormula(type) {
  const f = document.getElementById("formula");
  if (type === "box") f.innerHTML = "Hình lập phương: V = a³";
  if (type === "sphere") f.innerHTML = "Hình cầu: V = 4/3πr³";
  if (type === "cylinder") f.innerHTML = "Hình trụ: V = πr²h";
  if (type === "cone") f.innerHTML = "Hình nón: V = 1/3πr²h";
}

/* ================= CLEAN ================= */
function clearScene() {
  if (currentMesh) scene.remove(currentMesh);
  if (edgeHelper) scene.remove(edgeHelper);
  if (vertexHelper) scene.remove(vertexHelper);
  edgeHelper = vertexHelper = null;
}

/* ================= RENDER ================= */
function animate() {
  renderer.setAnimationLoop(render);
}

function render(_, frame) {
  if (frame) {
    const ref = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!session.hitTestSourceRequested) {
      session.requestReferenceSpace("viewer").then(space =>
        session.requestHitTestSource({ space }).then(src => (session.hitTestSource = src))
      );
      session.hitTestSourceRequested = true;
    }

    if (session.hitTestSource) {
      const hits = frame.getHitTestResults(session.hitTestSource);
      if (hits.length) {
        reticle.visible = true;
        reticle.matrix.fromArray(hits[0].getPose(ref).transform.matrix);
      } else reticle.visible = false;
    }
  }

  renderer.render(scene, camera);
}
