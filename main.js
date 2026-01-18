import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let reticle, hitTestSource = null;
let currentMesh = null;

let controller1, controller2;
let isPinching = false;
let startDistance = 0;
let startScale = 1;
let startRotation = 0;
let startAngle = 0;

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

  /* ===== Reticle ===== */
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.08, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.rotation.x = -Math.PI / 2;
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  /* ===== Controllers ===== */
  controller1 = renderer.xr.getController(0);
  controller2 = renderer.xr.getController(1);

  controller1.addEventListener("select", onSelect);
  scene.add(controller1);
  scene.add(controller2);

  createShape();
}

/* ================= CREATE SHAPE ================= */
function createShape() {
  if (currentMesh) scene.remove(currentMesh);

  const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const material = new THREE.MeshStandardMaterial({
    color: 0x2196f3,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9
  });

  currentMesh = new THREE.Mesh(geometry, material);
  scene.add(currentMesh);
}

/* ================= TAP TO PLACE ================= */
function onSelect() {
  if (!reticle.visible || !currentMesh) return;
  currentMesh.position.setFromMatrixPosition(reticle.matrix);
}

/* ================= PINCH & ROTATE ================= */
function handlePinch(frame) {
  const inputSources = renderer.xr.getSession().inputSources;
  if (inputSources.length < 2 || !currentMesh) return;

  const p1 = inputSources[0].targetRaySpace;
  const p2 = inputSources[1].targetRaySpace;

  if (!p1 || !p2) return;

  const pose1 = frame.getPose(p1, renderer.xr.getReferenceSpace());
  const pose2 = frame.getPose(p2, renderer.xr.getReferenceSpace());

  if (!pose1 || !pose2) return;

  const v1 = new THREE.Vector3().fromArray(pose1.transform.position);
  const v2 = new THREE.Vector3().fromArray(pose2.transform.position);

  const distance = v1.distanceTo(v2);
  const angle = Math.atan2(v2.z - v1.z, v2.x - v1.x);

  if (!isPinching) {
    isPinching = true;
    startDistance = distance;
    startScale = currentMesh.scale.x;
    startAngle = angle;
    startRotation = currentMesh.rotation.y;
  } else {
    const scaleFactor = distance / startDistance;
    currentMesh.scale.setScalar(startScale * scaleFactor);
    currentMesh.rotation.y = startRotation + (angle - startAngle);
  }
}

/* ================= RENDER LOOP ================= */
function animate() {
  renderer.setAnimationLoop(render);
}

function render(_, frame) {
  const session = renderer.xr.getSession();
  if (frame && session) {
    const refSpace = renderer.xr.getReferenceSpace();

    if (!hitTestSource) {
      session.requestReferenceSpace("viewer").then(space => {
        session.requestHitTestSource({ space }).then(src => {
          hitTestSource = src;
        });
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
