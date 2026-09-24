import * as THREE from "three";

/**
 * Builds a studio lighting environment (softboxes + strip lights) as a PMREM
 * environment map. No HDR download needed — reflections look like a
 * photographic product studio.
 */
export function createStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  variant: "dark" | "light" = "dark",
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(variant === "dark" ? "#050505" : "#8d8d90");

  const box = new THREE.BoxGeometry(1, 1, 1);
  const panel = (
    intensity: number,
    size: [number, number, number],
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
  ) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity) });
    const mesh = new THREE.Mesh(box, m);
    mesh.scale.set(...size);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    scene.add(mesh);
  };

  const dark = variant === "dark";
  // Large overhead softbox.
  panel(dark ? 2.4 : 5, [9, 0.1, 6], [0, 9, 0]);
  // Key light, left-front.
  panel(dark ? 5 : 9, [0.1, 5, 3], [-7, 3, 3], [0, Math.PI / 8, 0]);
  // Rim strip, right-back — gives metal edges their highlight line.
  panel(dark ? 8 : 10, [0.1, 7, 0.8], [7, 3, -3], [0, -Math.PI / 5, 0]);
  // Vertical strips front-left / front-right: long reflections on metal.
  panel(dark ? 2.5 : 7, [0.5, 6, 0.1], [-4, 3, 7], [0, Math.PI / 6, 0]);
  panel(dark ? 1.5 : 5, [0.5, 6, 0.1], [4.5, 3, 6.5], [0, -Math.PI / 6, 0]);
  // Thin back strip for silhouettes.
  panel(dark ? 3.5 : 5, [8, 0.6, 0.1], [0, 4, -8]);
  // Soft front fill.
  panel(dark ? 0.7 : 2.2, [6, 3, 0.1], [0, 1.5, 9]);
  // Floor bounce.
  panel(dark ? 0.15 : 1.4, [16, 0.1, 16], [0, -4, 0]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.035).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.material) (m.material as THREE.Material).dispose();
  });
  box.dispose();
  return env;
}
