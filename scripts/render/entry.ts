import * as THREE from "three";
import { createStudioEnvironment } from "../../src/three/studio";
import { shots, type Shot } from "./shots";

/* Browser-side renderer used by scripts/render/render.mjs */

let renderer: THREE.WebGLRenderer;
const envs: Partial<Record<"dark" | "light", THREE.Texture>> = {};

function init() {
  const canvas = document.getElementById("c") as HTMLCanvasElement;
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  envs.dark = createStudioEnvironment(renderer, "dark");
  envs.light = createStudioEnvironment(renderer, "light");
}

function dirFrom(azimuthDeg: number, elevationDeg: number) {
  const az = THREE.MathUtils.degToRad(azimuthDeg);
  const el = THREE.MathUtils.degToRad(elevationDeg);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
}

/** Seamless studio sweep: floor curving up into a back wall (faces +Z). */
function cyclorama(radius: number, width: number) {
  const prof: [number, number][] = [[radius * 12, 0], [radius * 4, 0], [0, 0]];
  for (let i = 1; i <= 32; i++) {
    const a = (i / 32) * (Math.PI / 2);
    prof.push([-Math.sin(a) * radius, radius * (1 - Math.cos(a))]);
  }
  prof.push([-radius, radius * 10]);
  const cols = 24;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < prof.length; i++)
    for (let j = 0; j <= cols; j++) pos.push(-width / 2 + (width * j) / cols, prof[i][1], prof[i][0]);
  for (let i = 0; i < prof.length - 1; i++)
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j;
      const b = a + 1;
      const c = a + cols + 1;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function render(shotKey: string) {
  const shot = shots.find((s) => s.key === shotKey) as Shot;
  if (!shot) throw new Error(`Unknown shot ${shotKey}`);
  const ss = shot.ss ?? 2;
  const W = shot.width * ss;
  const H = shot.height * ss;
  renderer.setSize(W, H, false);
  renderer.toneMappingExposure = shot.exposure ?? 1;

  const scene = new THREE.Scene();
  const envName = shot.env ?? "light";
  scene.environment = envs[envName]!;
  scene.environmentIntensity = shot.envIntensity ?? 1;
  const transparent = shot.background == null;
  scene.background = transparent ? null : new THREE.Color(shot.background!);
  renderer.setClearColor(0x000000, 0);

  const object = shot.build();
  scene.add(object);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const sphere = box.getBoundingSphere(new THREE.Sphere());

  // Floor: shadow catcher (transparent) or a seamless curved cyclorama.
  const floorGeo = transparent ? new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2) : cyclorama(sphere.radius * 2.4, sphere.radius * 30);
  const floorMat = transparent
    ? new THREE.ShadowMaterial({ opacity: shot.shadow ?? 0.34 })
    : new THREE.MeshStandardMaterial({ color: shot.floorColor ?? shot.background!, roughness: 0.82 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = box.min.y;
  if (!transparent) {
    const az = THREE.MathUtils.degToRad(shot.camera.azimuth);
    floor.rotation.y = az;
    const back = new THREE.Vector3(Math.sin(az), 0, Math.cos(az)).multiplyScalar(-sphere.radius * 1.6);
    floor.position.x = sphere.center.x + back.x;
    floor.position.z = sphere.center.z + back.z;
    // Soft pool of light on the backdrop behind the subject.
    const pool = new THREE.SpotLight("#ffffff", shot.backdropGlow ?? 60, 0, 0.55, 1, 1.4);
    pool.position.copy(sphere.center).add(new THREE.Vector3(Math.sin(az), 0, Math.cos(az)).multiplyScalar(sphere.radius * 3)).setY(box.min.y + sphere.radius * 5);
    pool.target.position.copy(sphere.center).add(back.clone().multiplyScalar(1.6)).setY(box.min.y + sphere.radius * 0.6);
    scene.add(pool, pool.target);
  }
  floor.receiveShadow = true;
  if (shot.floor !== false) scene.add(floor);

  // Lights: key (soft, angled) + overhead (very soft, contact grounding)
  const keyCfg = shot.keyLight ?? { azimuth: -35, elevation: 55, intensity: 1.6 };
  const key = new THREE.DirectionalLight("#ffffff", keyCfg.intensity);
  key.position.copy(sphere.center).add(dirFrom(keyCfg.azimuth, keyCfg.elevation).multiplyScalar(sphere.radius * 6));
  key.target.position.copy(sphere.center);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = shot.shadowSoftness ?? 16;
  key.shadow.blurSamples = 25;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  const sc = key.shadow.camera as THREE.OrthographicCamera;
  const ext = sphere.radius * 1.8;
  sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext;
  sc.near = 0.1; sc.far = sphere.radius * 14;
  scene.add(key, key.target);

  const top = new THREE.DirectionalLight("#ffffff", shot.topLight ?? 0.5);
  top.position.copy(sphere.center).add(new THREE.Vector3(0.05, 1, 0.1).multiplyScalar(sphere.radius * 6));
  top.target.position.copy(sphere.center);
  top.castShadow = true;
  top.shadow.mapSize.set(1024, 1024);
  top.shadow.radius = 40;
  top.shadow.blurSamples = 25;
  top.shadow.bias = -0.0004;
  const tc = top.shadow.camera as THREE.OrthographicCamera;
  tc.left = -ext; tc.right = ext; tc.top = ext; tc.bottom = -ext;
  tc.near = 0.1; tc.far = sphere.radius * 14;
  scene.add(top, top.target);

  if (shot.rimLight) {
    const rim = new THREE.DirectionalLight("#ffffff", shot.rimLight);
    rim.position.copy(sphere.center).add(dirFrom(150, 25).multiplyScalar(sphere.radius * 6));
    rim.target.position.copy(sphere.center);
    scene.add(rim, rim.target);
  }

  // Camera: auto-framed around the bounding sphere.
  const cam = shot.camera;
  const fov = cam.fov ?? 28;
  const camera = new THREE.PerspectiveCamera(fov, W / H, 0.05, 200);
  const vHalf = THREE.MathUtils.degToRad(fov / 2);
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  const fitHalf = Math.min(vHalf, hHalf);
  const distance = (sphere.radius / Math.sin(fitHalf)) * (cam.distance ?? 1);
  const target = sphere.center.clone().add(new THREE.Vector3(...(cam.targetOffset ?? [0, 0, 0])).multiplyScalar(sphere.radius));
  camera.position.copy(target).add(dirFrom(cam.azimuth, cam.elevation).multiplyScalar(distance));
  camera.lookAt(target);
  if (cam.roll) camera.rotateZ(THREE.MathUtils.degToRad(cam.roll));

  renderer.render(scene, camera);

  let dataUrl: string;
  if (!transparent && (shot.vignette || shot.grain)) {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(renderer.domElement, 0, 0);
    if (shot.vignette) {
      const g = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${shot.vignette})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (shot.grain) {
      const img = ctx.getImageData(0, 0, W, H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * shot.grain * 255;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      ctx.putImageData(img, 0, 0);
    }
    dataUrl = c.toDataURL("image/png");
  } else {
    dataUrl = renderer.domElement.toDataURL("image/png");
  }

  // Cleanup
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
  });
  floorMat.dispose();
  key.shadow.map?.dispose();
  top.shadow.map?.dispose();

  return { dataUrl, width: shot.width, height: shot.height, transparent };
}

declare global {
  interface Window {
    VAULT_RENDER: {
      init: () => void;
      keys: () => string[];
      render: typeof render;
    };
  }
}

window.VAULT_RENDER = {
  init,
  keys: () => shots.map((s) => s.key),
  render,
};
