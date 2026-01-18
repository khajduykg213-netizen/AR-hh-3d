import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let reticle, hitTestSource = null;
let solidMesh, edgeHelper, vertexHelper;
let showEdges = true;
let showVertices = true;

/* ===== Pinch ===== */
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

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.4));

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

  /* ===== UI ===== */
  document.getElementById("toggleEdge").onclick = () => {
    showEdges = !showEdges;
    if (edgeHelper) edgeHelper.visible = showEdges;
    document.getElementById("toggleEdge").innerText =
      showEdges ? "Ẩn cạnh" : "Hiện cạnh";
  };

  document.getElementById("toggleVertex").onclick = () => {
    showVertices = !showVertices;
    if (vertexHelper) vertexHelper.visible = showVertices;
    document.getElementById("toggleVertex").innerText =
      showVertices ? "Ẩn đỉnh" : "Hiện đỉnh";
  };

  createColoredBox();
}

/* ================= CREATE BOX (MỖI MẶT 1 MÀU) ================= */
function createColoredBox() {
  const geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);

  const materials = [
    new THREE.MeshStandardMaterial({ color: 0xff0000 }), // đỏ
    new THREE.MeshStandardMaterial({ color: 0x00ff00 }), // xanh lá
    new THREE.MeshStandardMaterial({ color: 0x0000ff }), // xanh dương
    new THREE.MeshStandardMaterial({ color: 0xffff00 }), // vàng
    new THREE.MeshStandardMaterial({ color: 0xff00ff }), // tím
    new THREE.MeshStandardMaterial({ color: 0x00ffff }), // cyan
  ];

  solidMesh = new THREE.Mesh(geometry, materials);
  solidMesh.visible = false;
  scene.add(solidMesh);

  /* ===== Edges ===== */
  edgeHelper = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  );
  edgeHelper.visible = showEdges;
  scene.add(edgeHelper);

  /* ===== Vertices ===== */
  const points = [];
  geometry.attributes.position.array.forEach((v, i) => {
    if (i % 3 === 0)
      points.push(
        new THREE.Vector3(
          geometry.attributes.position.array[i],
          geometry.attributes.position.array[i + 1],
          geometry.attributes.position.array[i + 2]
        )
      );
  });

  const vertexGeom = new THREE.BufferGeometry().setFromPoints(points);
  vertexHelper = new THREE.Points(
    vertexGeom,
    new THREE.PointsMaterial({ color: 0x000000, size: 0.01 })
  );
  vertexHelper.visible = showVertices;
  scene.add(vertexHelper);
}

/* ================= PLACE ================= */
function placeObject() {
  if (!reticle.visible) return;

  solidMesh.position.setFromMatrixPosition(reticle.matrix);
  edgeHelper.position.copy(solidMesh.position);
  vertexHelper.position.copy(solidMesh.position);

  solidMesh.visible = true;
  edgeHelper.visible = showEdges;
  vertexHelper.visible = showVertices;
}

/* ================= PINCH + ROTATE ================= */
function handlePinch(frame) {
  if (!solidMesh.visible) return;

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
    startScale = solidMesh.scale.x;
    startAngle = angle;
    startRotation = solidMesh.rotation.y;
    return;
  }

  let scale = startScale * (distance / startDistance);
  scale = THREE.MathUtils.clamp(scale, 0.08, 2.5);

  solidMesh.scale.setScalar(scale);
  edgeHelper.scale.setScalar(scale);
  vertexHelper.scale.setScalar(scale);

  solidMesh.rotation.y = startRotation + (angle - startAngle);
  edgeHelper.rotation.y = solidMesh.rotation.y;
  vertexHelper.rotation.y = solidMesh.rotation.y;
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
