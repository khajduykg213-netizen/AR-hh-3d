import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js";

let scene, camera, renderer;
let mesh, edgeHelper, vertexHelper;
let reticle, hitTestSource = null;
let showEdges = true;
let showVertices = true;

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

  createShape("box");
}

/* ================= CREATE SHAPES ================= */
function createShape(type) {
  clearOld();

  let geometry;
  let formula = "";

  switch (type) {
    case "sphere":
      geometry = new THREE.SphereGeometry(0.18, 48, 48);
      formula = `
      <b>Hình cầu</b><br>
      S = 4πr²<br>
      V = 4/3 πr³`;
      break;

    case "cylinder":
      geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 48);
      formula = `
      <b>Hình trụ</b><br>
      S = 2πr(h + r)<br>
      V = πr²h`;
      break;

    case "cone":
      geometry = new THREE.ConeGeometry(0.16, 0.3, 48);
      formula = `
      <b>Hình nón</b><br>
      S = πr(r + l)<br>
      V = 1/3 πr²h`;
      break;

    default:
      geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      formula = `
      <b>Hình lập phương</b><br>
      S = 6a²<br>
      V = a³`;
  }

  document.getElementById("formula").innerHTML = formula;

  /* ===== Material nhiều màu ===== */
  const material = new THREE.MeshStandardMaterial({
    color: 0x2196f3,
    roughness: 0.3,
    metalness: 0.1
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  /* ===== Edges ===== */
  edgeHelper = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  );
  edgeHelper.visible = showEdges;
  scene.add(edgeHelper);

  /* ===== Vertices ===== */
  const points = [];
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    points.push(
      new THREE.Vector3().fromBufferAttribute(
        geometry.attributes.position, i
      )
    );
  }

  vertexHelper = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(points),
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

/* ================= PLACE AR ================= */
function placeObject() {
  if (!reticle.visible || !mesh) return;

  mesh.position.setFromMatrixPosition(reticle.matrix);
  edgeHelper.position.copy(mesh.position);
  vertexHelper.position.copy(mesh.position);
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
  }

  if (mesh) mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
