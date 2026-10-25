// Source of public/projetos/brasa41/vendor/burger3d.js. Rebuild after editing:
// npx esbuild concepts/brasa41/burger3d.js --bundle --format=esm --minify --target=es2020 --outfile=public/projetos/brasa41/vendor/burger3d.js

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => 1 - Math.pow(1 - x, 3);

// Small deterministic value noise so every visit renders the same burger.
function hash(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let out = 0;
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++) {
    const wgt = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    out += wgt * hash(xi + dx, yi + dy, zi + dz);
  }
  return out * 2 - 1;
}

function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function speckle(ctx, w, h, n, colors, rMax) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.15 + hash(i, 1, 2) * 0.35;
    ctx.beginPath();
    ctx.arc(hash(i, 3, 4) * w, hash(i, 5, 6) * h, 0.5 + hash(i, 7, 8) * rMax, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Profile (radius, height) points from the base up to the crown, so LatheGeometry faces point outward.
function domeProfile() {
  const R = 1.08, H = 0.62, base = 0.1;
  const pts = [new THREE.Vector2(0.001, 0.0), new THREE.Vector2(R * 0.97, 0.0), new THREE.Vector2(R, 0.05)];
  for (let i = 28; i >= 0; i--) {
    const u = (i / 28) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R * Math.sin(u), base + H * Math.pow(Math.cos(u), 0.75)));
  }
  return pts;
}

function makeTopBun() {
  const g = new THREE.Group();
  const pts = domeProfile();
  const geo = new THREE.LatheGeometry(pts, 128);
  const map = canvasTexture(64, 512, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h); // v=1 (crown) is the top of the canvas
    gr.addColorStop(0, "#6e3109");
    gr.addColorStop(0.4, "#94460f");
    gr.addColorStop(0.7, "#a5561a");
    gr.addColorStop(0.85, "#c4772c");
    gr.addColorStop(0.92, "#e6b878");
    gr.addColorStop(1, "#f3d9a8");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h * 0.8, 260, ["#6d300a", "#a35416"], 1.6);
  });
  const mat = new THREE.MeshPhysicalMaterial({ map, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.32, sheen: 0.1, sheenColor: new THREE.Color("#ffcf8a") });
  const bun = new THREE.Mesh(geo, mat);
  bun.castShadow = true;
  g.add(bun);

  // Sesame seeds sit on the dome, aligned to its surface normal.
  const seedGeo = new THREE.SphereGeometry(1, 12, 8);
  seedGeo.scale(0.042, 0.014, 0.022);
  const seedMat = new THREE.MeshPhysicalMaterial({ color: "#f6e7c6", roughness: 0.5, sheen: 0.6 });
  const N = 70;
  const seeds = new THREE.InstancedMesh(seedGeo, seedMat, N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const R = 1.08, H = 0.62, base = 0.1;
  const prof = (u) => new THREE.Vector2(R * Math.sin(u), base + H * Math.pow(Math.cos(u), 0.75));
  for (let i = 0; i < N; i++) {
    const u = 0.12 + hash(i, 9, 1) * 0.95;
    const phi = hash(i, 2, 9) * Math.PI * 2;
    const p = prof(u), p2 = prof(u + 0.01);
    const tangent = new THREE.Vector2(p2.x - p.x, p2.y - p.y).normalize();
    const n2 = new THREE.Vector2(tangent.y, -tangent.x);
    const normal = new THREE.Vector3(n2.x * Math.cos(phi), n2.y, n2.x * Math.sin(phi)).normalize();
    if (normal.y < 0) normal.negate();
    const pos = new THREE.Vector3(p.x * Math.cos(phi), p.y + 0.004, p.x * Math.sin(phi));
    q.setFromUnitVectors(up, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(normal, hash(i, 4, 4) * Math.PI);
    m.compose(pos, spin.multiply(q), new THREE.Vector3(1, 1, 1));
    seeds.setMatrixAt(i, m);
  }
  seeds.castShadow = true;
  g.add(seeds);
  return g;
}

function makeBottomBun() {
  const pts = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.98, 0), new THREE.Vector2(1.05, 0.05),
    new THREE.Vector2(1.07, 0.15), new THREE.Vector2(1.03, 0.24), new THREE.Vector2(0.95, 0.27), new THREE.Vector2(0.001, 0.27),
  ];
  const geo = new THREE.LatheGeometry(pts, 128);
  const map = canvasTexture(64, 512, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, "#b8702e");
    gr.addColorStop(0.2, "#c98439");
    gr.addColorStop(0.45, "#d99a50");
    gr.addColorStop(0.66, "#e2ad68");
    gr.addColorStop(0.8, "#a85a1e"); // toasted face
    gr.addColorStop(1, "#8c4515");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 200, ["#8a4512", "#f3d39e"], 1.4);
  });
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map, roughness: 0.68, sheen: 0.15, sheenColor: new THREE.Color("#ffd49a") }));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function makePatty(seed) {
  const h = 0.2;
  const geo = new THREE.CylinderGeometry(1.06, 1.08, h, 128, 6);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = Math.hypot(v.x, v.z);
    const ang = Math.atan2(v.z, v.x);
    if (d > 0.5) {
      // Smashed edges: lacy and uneven
      const k = 1 + 0.06 * noise3(Math.cos(ang) * 3 + seed, v.y * 4, Math.sin(ang) * 3) + 0.03 * noise3(Math.cos(ang) * 9, seed, Math.sin(ang) * 9);
      v.x *= k; v.z *= k;
    }
    v.y += 0.018 * noise3(v.x * 4 + seed, v.z * 4, seed);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const draw = (ctx, w, hh) => {
    ctx.fillStyle = "#4b2511"; ctx.fillRect(0, 0, w, hh);
    for (let i = 0; i < 2200; i++) {
      const x = hash(i, seed, 1) * w, y = hash(i, seed, 2) * hh, r = 1 + hash(i, seed, 3) * 5;
      const dark = hash(i, seed, 4) > 0.45;
      ctx.fillStyle = dark ? "rgba(20,8,2,.55)" : "rgba(140,70,30,.45)";
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  };
  const map = canvasTexture(512, 512, draw);
  const bump = canvasTexture(512, 512, draw, false);
  map.wrapS = map.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  const capMat = new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: 2.2, roughness: 0.72, clearcoat: 0.3, clearcoatRoughness: 0.55 });
  const sideMap = map.clone(), sideBump = bump.clone();
  sideMap.repeat.set(8, 0.25); sideBump.repeat.set(8, 0.25);
  const sideMat = capMat.clone();
  sideMat.map = sideMap; sideMat.bumpMap = sideBump;
  const mesh = new THREE.Mesh(geo, [sideMat, capMat, capMat]);
  mesh.castShadow = mesh.receiveShadow = true;
  return { mesh, h };
}

function makeCheese(rot) {
  const geo = new THREE.PlaneGeometry(1.78, 1.78, 70, 70);
  geo.rotateX(-Math.PI / 2);
  geo.rotateY(rot);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    const d = Math.hypot(x, z);
    let y = 0;
    // Melted overhang: past the patty edge the slice bends down and hugs the side.
    if (d > 0.98) {
      const over = d - 0.98;
      y -= over * over * 2.2 + over * 0.35;
      const hug = (1.0 + Math.min(over, 0.12) * 0.6 + Math.max(0, over - 0.12) * 0.12) / d;
      x *= hug; z *= hug;
    }
    y += 0.006 * noise3(x * 5, z * 5, rot);
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: "#e8900a", roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.25, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function makeLettuce() {
  // Polar grid instead of CircleGeometry so the edge can ruffle.
  const rings = 14, segs = 220, verts = [], uvs = [], idx = [];
  for (let r = 0; r <= rings; r++) {
    const rho = r / rings;
    for (let s = 0; s <= segs; s++) {
      const th = (s / segs) * Math.PI * 2;
      const rr = rho * (1.16 + 0.07 * Math.sin(th * 9) + 0.04 * noise3(Math.cos(th) * 4, Math.sin(th) * 4, 3));
      const y = 0.06 * Math.sin(th * 17 + rho * 5) * rho ** 2.2 + 0.03 * noise3(Math.cos(th) * 6, rho * 3, Math.sin(th) * 6) * rho ** 2;
      verts.push(rr * Math.cos(th), y, rr * Math.sin(th));
      uvs.push(0.5 + 0.5 * rr * Math.cos(th) / 1.25, 0.5 + 0.5 * rr * Math.sin(th) / 1.25);
    }
  }
  for (let r = 0; r < rings; r++) for (let s = 0; s < segs; s++) {
    const a = r * (segs + 1) + s, b = a + segs + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const map = canvasTexture(512, 512, (ctx, w, h) => {
    const gr = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "#d9f5a8"); gr.addColorStop(0.55, "#8fd451"); gr.addColorStop(1, "#4f9a26");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(235,255,200,.5)"; ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(w / 2, h / 2);
      ctx.quadraticCurveTo(w / 2 + Math.cos(a + 0.2) * 120, h / 2 + Math.sin(a + 0.2) * 120, w / 2 + Math.cos(a) * 250, h / 2 + Math.sin(a) * 250);
      ctx.stroke();
    }
  });
  const mesh = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ map, roughness: 0.5, side: THREE.DoubleSide, sheen: 0.6, sheenColor: new THREE.Color("#c8ff8a") }));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function makeTomatoes() {
  const g = new THREE.Group();
  const map = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#a8140b"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d52a17"; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      ctx.fillStyle = "#f2553a";
      ctx.beginPath(); ctx.ellipse(w / 2 + Math.cos(a) * 52, h / 2 + Math.sin(a) * 52, 28, 18, a, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff0c2";
      for (let s = 0; s < 4; s++) { ctx.beginPath(); ctx.ellipse(w / 2 + Math.cos(a) * (40 + s * 7), h / 2 + Math.sin(a) * (40 + s * 7), 3, 2, a, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = "#ef6b4d"; ctx.beginPath(); ctx.arc(w / 2, h / 2, 14, 0, Math.PI * 2); ctx.fill();
  });
  const mat = new THREE.MeshPhysicalMaterial({ map, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const side = new THREE.MeshPhysicalMaterial({ color: "#b81d12", roughness: 0.3, clearcoat: 0.6 });
  [[-0.46, 0.08, 0.1], [0.48, -0.06, -0.12]].forEach(([x, z, r]) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.07, 64), [side, mat, mat]);
    t.position.set(x, 0.035, z); t.rotation.z = r * 0.3; t.rotation.x = r * 0.2;
    t.castShadow = t.receiveShadow = true;
    g.add(t);
  });
  return g;
}

// Layer groups top to bottom; `y` is each group's base height in the assembled burger.
function makeBurger() {
  const root = new THREE.Group();
  const bottom = makeBottomBun();
  const p1 = makePatty(1.3), c1 = makeCheese(Math.PI / 4), p2 = makePatty(4.7), c2 = makeCheese(0.2);
  const meat = new THREE.Group();
  p1.mesh.position.y = p1.h / 2; c1.position.y = p1.h + 0.005;
  p2.mesh.position.y = p1.h + 0.03 + p2.h / 2; meat.add(p1.mesh, c1, p2.mesh);
  const cheese = new THREE.Group(); cheese.add(c2);
  const tomato = makeTomatoes();
  const lettuce = makeLettuce();
  const top = makeTopBun();
  const stack = [
    { obj: top, y: 0.85 },
    { obj: lettuce, y: 0.81 },
    { obj: tomato, y: 0.725 },
    { obj: cheese, y: 0.715 },
    { obj: meat, y: 0.28 },
    { obj: bottom, y: 0 },
  ];
  stack.forEach((s) => { s.obj.position.y = s.y; root.add(s.obj); });
  return { root, stack };
}

function makeStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;
  const key = new THREE.DirectionalLight("#ffe2b8", 2.6);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -3;
  key.shadow.camera.right = key.shadow.camera.top = 3;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0006;
  const rim = new THREE.DirectionalLight("#ff5a1f", 3.2);
  rim.position.set(-4, 2.5, -3.5);
  const fill = new THREE.HemisphereLight("#ffd9a8", "#2a160c", 0.45);
  scene.add(key, rim, fill);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.ShadowMaterial({ opacity: 0.4 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  return { renderer, scene, camera, ground };
}

function fit(stage, el) {
  const w = el.clientWidth, h = el.clientHeight;
  stage.renderer.setSize(w, h, false);
  stage.camera.aspect = w / h;
  stage.camera.updateProjectionMatrix();
  return { w, h };
}

export function start({ heroEl, explodeEl, sectionEl, tags, caption, labels }) {
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("no webgl");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // hero
  const heroCanvas = document.createElement("canvas");
  heroEl.replaceChildren(heroCanvas);
  heroEl.classList.add("burger3d");
  const hero = makeStage(heroCanvas);
  const hb = makeBurger();
  hero.scene.add(hb.root);
  let heroSize = fit(hero, heroEl);

  // exploded view
  const expCanvas = document.createElement("canvas");
  explodeEl.prepend(expCanvas);
  const exp = makeStage(expCanvas);
  const eb = makeBurger();
  exp.scene.add(eb.root);
  let expSize = fit(exp, explodeEl);
  const SPREAD = [1.25, 0.82, 0.5, 0.22, -0.18, -0.62];

  addEventListener("resize", () => { heroSize = fit(hero, heroEl); expSize = fit(exp, explodeEl); });

  let px = 0, py = 0;
  addEventListener("pointermove", (e) => { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; }, { passive: true });

  const visible = { hero: true, exp: false };
  const io = new IntersectionObserver((es) => es.forEach((e) => { visible[e.target === heroEl ? "hero" : "exp"] = e.isIntersecting; }));
  io.observe(heroEl); io.observe(explodeEl);

  const v = new THREE.Vector3();
  let last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduce) t += dt;
    if (visible.hero) {
      const dist = heroSize.w < 500 ? 6.6 : 5.6;
      hero.camera.position.set(0, 2.3, dist);
      hero.camera.lookAt(0, 0.7, 0);
      hb.root.rotation.y = t * 0.35 + px * 0.6;
      hb.root.rotation.x = py * 0.15;
      hb.root.position.y = 0.08 + Math.sin(t * 1.4) * 0.05;
      hero.renderer.render(hero.scene, hero.camera);
    }
    if (visible.exp) {
      const r = sectionEl.getBoundingClientRect();
      const prog = clamp(-r.top / (sectionEl.offsetHeight - innerHeight));
      const k = ease(clamp(prog / 0.6));
      const aspect = expSize.w / expSize.h;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(15));
      const needH = 1.6 + 1.9 * k + 0.9, needW = 3.0;
      const dist = Math.max(needH / (2 * tanHalf), needW / (2 * tanHalf * aspect)) * 1.08;
      const lookY = 0.8 + 0.35 * k;
      exp.camera.position.set(0, lookY + dist * 0.25, dist);
      exp.camera.lookAt(0, lookY, 0);
      eb.root.rotation.y = -0.5 + prog * 1.4 + t * 0.05;
      eb.stack.forEach((s, i) => { s.obj.position.y = s.y + SPREAD[i] * k; });
      exp.ground.position.y = -0.01 + SPREAD[5] * k;
      exp.renderer.render(exp.scene, exp.camera);
      // pin the HTML labels to each layer's edge
      eb.stack.forEach((s, i) => {
        const tag = tags[i];
        const side = i % 2 ? 1 : -1;
        v.set(side * 1.2, s.obj.position.y + 0.12, 0).project(exp.camera);
        const sx = (v.x * 0.5 + 0.5) * expSize.w, sy = (-v.y * 0.5 + 0.5) * expSize.h;
        tag.style.top = `${sy - 18}px`;
        if (side < 0) { tag.style.right = `${expSize.w - sx + 30}px`; tag.style.left = "auto"; }
        else { tag.style.left = `${sx + 30}px`; tag.style.right = "auto"; }
        tag.style.opacity = String(clamp((k - i * 0.1) * 3));
      });
      const active = Math.min(labels.length - 1, Math.floor(clamp((prog - 0.05) / 0.85) * labels.length));
      caption.querySelector("b").textContent = labels[active].label;
      caption.querySelector("small").textContent = labels[active].note;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
