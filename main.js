import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let reticle, hitTestSource = null;
let mesh = null;

let isPinching = false;
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

  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
  );

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.3));

  /* ===== Reticle ===== */
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.08, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.rotation.x = -Math.PI / 2;
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  /* ===== Controller ===== */
  const controller = renderer.xr.getController(0);
  controller.addEventListener("select", placeObject);
  scene.add(controller);

  createMesh();
}

/* ================= CREATE OBJECT ================= */
function createMesh() {
  const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const material = new THREE.MeshStandardMaterial({
    color: 0x1e88e5,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.95,
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  scene.add(mesh);
}

/* ================= PLACE ================= */
function placeObject() {
  if (!reticle.visible || !mesh) return;
  mesh.position.setFromMatrixPosition(reticle.matrix);
  mesh.visible = true;
}

/* ================= PINCH + ROTATE ================= */
function handlePinch(frame) {
  if (!mesh || !mesh.visible) return;

  const session = renderer.xr.getSession();
  if (!session) return;

  const sources = session.inputSources.filter(s => s.targetRaySpace);
  if (sources.length < 2) {
    isPinching = false;
    return;
  }

  const refSpace = renderer.xr.getReferenceSpace();
  const pose1 = frame.getPose(sources[0].targetRaySpace, refSpace);
  const pose2 = frame.getPose(sources[1].targetRaySpace, refSpace);
  if (!pose1 || !pose2) return;

  const p1 = new THREE.Vector3().fromArray(pose1.transform.position);
  const p2 = new THREE.Vector3().fromArray(pose2.transform.position);

  const distance = p1.distanceTo(p2);
  const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

  if (!isPinching) {
    isPinching = true;
    startDistance = distance;
    startScale = mesh.scale.x;
    startAngle = angle;
    startRotation = mesh.rotation.y;
    return;
  }

  /* ===== SCALE (AN TOÀN) ===== */
  let scale = startScale * (distance / startDistance);
  scale = THREE.MathUtils.clamp(scale, 0.05, 2.5);
  mesh.scale.setScalar(scale);

  /* ===== ROTATE ===== */
  mesh.rotation.y = startRotation + (angle - startAngle);
}

/* ================= LOOP ================= */
function animate() {
  renderer.setAnimationLoop(render);
}

function render(_, frame) {
  const session = renderer.xr.getSession();
  if (frame && session) {
    const refSpace = renderer.xr.getReferenceSpace();

    if (!hitTestSource) {
      session.requestReferenceSpace("viewer").then(space => {
        session.requestHitTestSource({ space }).then(src => hitTestSource = src);
      });
    }

    if (hitTestSource) {
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length > 0) {
        reticle.visible = true;
        reticle.matrix.fromArray(hits[0].getPose(refSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }

    handlePinch(frame);
  } else {
    isPinching = false;
  }

  renderer.render(scene, camera);
}
