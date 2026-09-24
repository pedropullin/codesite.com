import * as THREE from "three";
import { extrudeRounded, extrudeShape, roundedRectPath, roundedRectShape } from "../geometry";
import { brushedSteel, chrome, lining, matteBlack, PALETTE } from "../materials";
import { canvasTexture, logoCanvas, remapCanvas, tintCanvas, type TextureQuality } from "../textures";

export type VaultBox = {
  group: THREE.Group;
  lidPivot: THREE.Group;
  contents: THREE.Group;
  logoMaterial: THREE.MeshPhysicalMaterial;
  dimensions: { width: number; depth: number; baseHeight: number; lidHeight: number };
  /** 0 = closed, 1 = fully open (~112°). */
  setOpen: (t: number) => void;
};

export function createVaultBox({
  quality = "high",
  width = 2.2,
  depth = 1.55,
  edition = "N° 001 / 250",
  withInsert = true,
  logoFacing = "front",
}: {
  quality?: TextureQuality;
  width?: number;
  depth?: number;
  edition?: string;
  withInsert?: boolean;
  /** Which side the lid logo reads upright from. */
  logoFacing?: "front" | "back";
} = {}): VaultBox {
  const W = width;
  const D = depth;
  const HB = 0.74 * (width / 2.2);
  const HL = 0.3 * (width / 2.2);
  const T = 0.07;
  const R = 0.075;
  const curve = quality === "low" ? 6 : quality === "medium" ? 10 : 16;
  const bevelSegs = quality === "low" ? 2 : 4;

  const group = new THREE.Group();
  group.name = "vault-box";

  const black = matteBlack({ quality });
  const liningMat = lining();
  const steel = brushedSteel({ quality });

  /* Base: walls (hollow ring) + floor ---------------------------------- */
  const wallShape = roundedRectShape(W - 0.024, D - 0.024, R - 0.012);
  wallShape.holes.push(roundedRectPath(W - T * 2, D - T * 2, Math.max(0.01, R - T * 0.7)));
  const walls = extrudeShape(wallShape, HB - 0.024, 0.012, { curveSegments: curve, bevelSegments: bevelSegs });
  walls.rotateX(-Math.PI / 2);
  walls.translate(0, HB / 2, 0);
  const wallsMesh = new THREE.Mesh(walls, [black, black, black]);
  group.add(wallsMesh);

  const floor = extrudeRounded(W - 0.02, D - 0.02, 0.06, R, 0.01, { curveSegments: curve });
  floor.rotateX(-Math.PI / 2);
  floor.translate(0, 0.03, 0);
  group.add(new THREE.Mesh(floor, black));

  // Interior lining: slightly lower than the wall top for a visible step.
  const liningShape = roundedRectShape(W - T * 2 - 0.002, D - T * 2 - 0.002, Math.max(0.01, R - T * 0.7));
  liningShape.holes.push(roundedRectPath(W - T * 2 - 0.05, D - T * 2 - 0.05, 0.02));
  const liningH = HB - 0.06 - 0.05;
  const liningGeo = extrudeShape(liningShape, liningH, 0, { curveSegments: curve });
  liningGeo.rotateX(-Math.PI / 2);
  liningGeo.translate(0, 0.06 + liningH / 2, 0);
  group.add(new THREE.Mesh(liningGeo, liningMat));
  const liningFloor = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRectShape(W - T * 2, D - T * 2, 0.02), curve),
    liningMat,
  );
  liningFloor.rotation.x = -Math.PI / 2;
  liningFloor.position.y = 0.062;
  group.add(liningFloor);

  // Precision line: thin chrome band just below the seam.
  const bandShape = roundedRectShape(W + 0.006, D + 0.006, R + 0.003);
  bandShape.holes.push(roundedRectPath(W - 0.03, D - 0.03, R - 0.015));
  const band = extrudeShape(bandShape, 0.009, 0, { curveSegments: curve });
  band.rotateX(-Math.PI / 2);
  band.translate(0, HB - 0.05, 0);
  group.add(new THREE.Mesh(band, chrome()));

  // Hinges at the back.
  const hingeGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.26, quality === "low" ? 12 : 24);
  hingeGeo.rotateZ(Math.PI / 2);
  for (const x of [-W * 0.3, W * 0.3]) {
    const h = new THREE.Mesh(hingeGeo, steel);
    h.position.set(x, HB + 0.004, -D / 2 - 0.012);
    group.add(h);
  }

  /* Lid ----------------------------------------------------------------- */
  const lidPivot = new THREE.Group();
  lidPivot.name = "lid-pivot";
  lidPivot.position.set(0, HB, -D / 2);
  group.add(lidPivot);

  const logoMask = logoCanvas({
    width: 1408,
    height: Math.round(1408 * (D / W)),
    lines: [
      { text: "VAULT", size: 0.15, weight: 500, tracking: 0.42, offsetY: -0.045 },
      { text: "ASSOCIATION", size: 0.052, weight: 500, tracking: 0.62, offsetY: 0.085 },
    ],
    frame: 0.075,
  });
  const logoBump = canvasTexture(logoMask);
  const logoRough = canvasTexture(remapCanvas(logoMask, 1, 0.42));
  const logoGlow = canvasTexture(logoCanvas({
    width: 704,
    height: Math.round(704 * (D / W)),
    lines: [
      { text: "VAULT", size: 0.15, weight: 500, tracking: 0.42, offsetY: -0.045 },
      { text: "ASSOCIATION", size: 0.052, weight: 500, tracking: 0.62, offsetY: 0.085 },
    ],
    frame: 0.075,
    blur: 2,
  }), THREE.SRGBColorSpace);

  if (logoFacing === "back") {
    for (const t of [logoBump, logoRough, logoGlow]) {
      t.center.set(0.5, 0.5);
      t.rotation = Math.PI;
    }
  }
  const logoMaterial = matteBlack({ quality });
  logoMaterial.name = "vault-logo";
  logoMaterial.bumpMap = logoBump;
  logoMaterial.bumpScale = -2.2;
  logoMaterial.roughnessMap = logoRough;
  logoMaterial.emissiveMap = logoGlow;
  logoMaterial.emissive = new THREE.Color("#d9dadd");
  logoMaterial.emissiveIntensity = 0;

  const undersideMask = logoCanvas({
    width: 1024,
    height: Math.round(1024 * (D / W)),
    lines: [
      { text: "CURATED FOR THE VAULT", size: 0.05, weight: 500, tracking: 0.5, offsetY: -0.03 },
      { text: `ARCHIVE — ${edition}`, size: 0.028, weight: 400, tracking: 0.5, offsetY: 0.05 },
    ],
  });
  const undersideMap = canvasTexture(tintCanvas(undersideMask, PALETTE.lining, "#b9bbbf"), THREE.SRGBColorSpace);
  const undersideMetal = canvasTexture(undersideMask);
  for (const t of [undersideMap, undersideMetal]) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
  }
  const underside = new THREE.MeshStandardMaterial({
    name: "lid-underside",
    map: undersideMap,
    metalness: 1,
    metalnessMap: undersideMetal,
    roughness: 0.75,
  });

  const lidGeo = extrudeRounded(W, D, HL, R, 0.03, { curveSegments: curve, bevelSegments: bevelSegs });
  lidGeo.rotateX(-Math.PI / 2);
  const lid = new THREE.Mesh(lidGeo, [underside, black, logoMaterial]);
  lid.name = "lid";
  lid.position.set(0, HL / 2 + 0.004, D / 2);
  lidPivot.add(lid);

  // Front clasp — part of the lid so it lifts with it.
  const claspMask = logoCanvas({
    width: 512,
    height: 200,
    lines: [{ text: edition.replace("N° ", ""), size: 0.26, weight: 500, tracking: 0.35 }],
  });
  const claspEngraved = brushedSteel({ quality });
  claspEngraved.bumpMap = canvasTexture(claspMask);
  claspEngraved.bumpScale = -1.4;
  const clasp = new THREE.Mesh(
    extrudeRounded(0.46, 0.18, 0.032, 0.035, 0.01, { curveSegments: curve }),
    [steel, steel, claspEngraved],
  );
  clasp.position.set(0, 0.03, D + 0.012);
  lidPivot.add(clasp);

  // Suede insert tray that lifts the contents towards the rim.
  const insertH = HB * 0.5;
  const insert = new THREE.Mesh(
    extrudeRounded(W - T * 2 - 0.06, D - T * 2 - 0.06, insertH, 0.03, 0.02, { curveSegments: curve }),
    liningMat,
  );
  insert.geometry.rotateX(-Math.PI / 2);
  insert.position.y = 0.06 + insertH / 2;
  insert.visible = withInsert;
  group.add(insert);

  /* Contents anchor (products float from here) ------------------------- */
  const contents = new THREE.Group();
  contents.name = "contents";
  contents.position.set(0, withInsert ? 0.06 + insertH : 0.12, 0);
  group.add(contents);

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  const setOpen = (t: number) => {
    const eased = t * t * (3 - 2 * t);
    lidPivot.rotation.x = -eased * THREE.MathUtils.degToRad(112);
  };

  return {
    group,
    lidPivot,
    contents,
    logoMaterial,
    dimensions: { width: W, depth: D, baseHeight: HB, lidHeight: HL },
    setOpen,
  };
}
