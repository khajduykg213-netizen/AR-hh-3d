import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let mesh, edgeHelper, vertexHelper;
let reticle, hitTestSource = null;
let showEdges = true;
let showVertices = true;

/* ===== Gesture ===== */
let isGesture = false;
let startDistance = 0;
let startScale = 1;
let startAngle = 0;
let startRotation = 0;

init();
animate();

/* ================= INIT ================= */
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f2f2);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 20);
  camera.position.set(0, 0.6, 1.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.3));

  document.getElementById("btn-ar").onclick = () => {
    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
    );
  };

  document.getElementById("shape").onchange = e => createShape(e.target.value);

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

  /* ===== Reticle ===== */
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.08, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.rotation.x = -Math.PI / 2;
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const controller = renderer.xr.getController(0);
  controller.addEventListener("select", placeObject);
  scene.add(controller);

  /* ===== Touch gesture ===== */
  renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
  renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
  renderer.domElement.addEventListener("touchend", () => isGesture = false);

  createShape("box");
}

/* ================= SHAPES ================= */
function createShape(type) {
  clearOld();

  let geometry;
  let formula = "";

  switch (type) {
    case "sphere":
      geometry = new THREE.SphereGeometry(0.18, 48, 48);
      formula = "Hình cầu<br>S = 4πr²<br>V = 4/3πr³";
      break;

    case "cylinder":
      geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 48);
      formula = "Hình trụ<br>S = 2πr(h+r)<br>V = πr²h";
      break;

    case "cone":
      geometry = new THREE.ConeGeometry(0.16, 0.3, 48);
      formula = "Hình nón<br>S = πr(r+l)<br>V = 1/3πr²h";
      break;

    case "prism":
      geometry = new THREE.CylinderGeometry(0.16, 0.16, 0.3, 3);
      formula = "Lăng trụ tam giác<br>V = Sđáy·h";
      break;

    case "pyramid":
      geometry = new THREE.ConeGeometry(0.18, 0.3, 4);
      formula = "Chóp tứ giác<br>V = 1/3Sđáy·h";
      break;

    default:
      geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      formula = "Lập phương<br>S = 6a²<br>V = a³";
  }

  document.getElementById("formula").innerHTML = formula;

  mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x2196f3, roughness: 0.3 })
  );
  scene.add(mesh);

  edgeHelper = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  );
  edgeHelper.visible = showEdges;
  scene.add(edgeHelper);

  const pts = [];
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    pts.push(new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, i));
  }

  vertexHelper = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.PointsMaterial({ color: 0xff0000, size: 0.01 })
  );
  vertexHelper.visible = showVertices;
  scene.add(vertexHelper);
}

function clearOld() {
  if (mesh) scene.remove(mesh);
  if (edgeHelper) scene.remove(edgeHelper);
  if (vertexHelper) scene.remove(vertexHelper);
}

/* ================= AR PLACE ================= */
function placeObject() {
  if (!reticle.visible || !mesh) return;
  mesh.position.setFromMatrixPosition(reticle.matrix);
  edgeHelper.position.copy(mesh.position);
  vertexHelper.position.copy(mesh.position);
}

/* ================= TOUCH ================= */
function onTouchStart(e) {
  if (e.touches.length === 2 && mesh) {
    isGesture = true;
    startDistance = getDistance(e.touches);
    startScale = mesh.scale.x;
    startAngle = getAngle(e.touches);
    startRotation = mesh.rotation.y;
  }
}

function onTouchMove(e) {
  if (!isGesture || e.touches.length !== 2 || !mesh) return;
  e.preventDefault();

  const dist = getDistance(e.touches);
  const angle = getAngle(e.touches);

  let scale = startScale * (dist / startDistance);
  scale = THREE.MathUtils.clamp(scale, 0.3, 3.0);

  mesh.scale.setScalar(scale);
  edgeHelper.scale.setScalar(scale);
  vertexHelper.scale.setScalar(scale);

  mesh.rotation.y = startRotation + (angle - startAngle);
  edgeHelper.rotation.y = mesh.rotation.y;
  vertexHelper.rotation.y = mesh.rotation.y;
}

function getDistance(t) {
  return Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
}

function getAngle(t) {
  return Math.atan2(t[1].pageY - t[0].pageY, t[1].pageX - t[0].pageX);
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
      } else reticle.visible = false;
    }
  }

  if (mesh) mesh.rotation.y += 0.005;
  renderer.render(scene, camera);
}
