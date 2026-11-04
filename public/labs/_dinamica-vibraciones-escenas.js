import {THREE, group, box, cylinder, foot, mergeByMaterial, motor} from './_proceso-piezas.js';
import {cantileverShape} from './_dinamica-vibraciones.js';

function spring(parent, mats, x, y, z, length, radius) {
  const body = group(parent, x, y, z);
  const points = Array.from({length: 97}, (_, index) => {
    const u = index / 96;
    return new THREE.Vector3(radius * Math.cos(u * 16 * Math.PI), length * u, radius * Math.sin(u * 16 * Math.PI));
  });
  body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, .028, 6, false), mats.copper));
  return body;
}

function slidingBench(hero, fixed, mats, id) {
  const frame = group(fixed);
  box(frame, .3, 2.6, .32, mats.paint, -1.75, 1.4);
  box(frame, .3, 2.6, .32, mats.paint, 1.75, 1.4);
  box(frame, 3.8, .24, .4, mats.paint, 0, 2.72);
  for (const x of [-.72, .72]) cylinder(frame, .042, 2.35, mats.steel, x, 1.4, .15);
  const load = group(hero, 0, 1.25, .16);
  box(load, 1.65, .32, .83, mats.steel);
  box(load, 1.35, .22, .58, mats.paint, 0, .21);
  const coil = spring(hero, mats, -.40, 1.25, .2, 1.36, .13);
  const damper = cylinder(frame, .095, .69, mats.aluminum, .4, 2.18, .2);
  const stem = cylinder(hero, .043, 1.36, mats.steel, .4, 1.91, .2);
  const secondary = group(hero, 0, .42, .15);
  let eccentric;
  let absorberSpring;
  if (id === 274) {
    box(secondary, .64, .19, .61, mats.copper);
    absorberSpring = spring(secondary, mats, 0, .12, 0, .55, .1);
  } else if (id === 272) {
    box(secondary, 2.5, .18, 1.17, mats.paint);
    eccentric = group(hero, 0, .64, .78);
    cylinder(eccentric, .29, .14, mats.steel).rotation.x = Math.PI / 2;
    cylinder(eccentric, .105, .17, mats.copper, 0, .15, .078).rotation.x = Math.PI / 2;
  }
  return {detail: [load, coil, stem, damper, secondary, ...(eccentric ? [eccentric] : [])], update(p) {
    const deflection = (id === 274 ? .30 : .62) * Math.tanh(p.x);
    load.position.y = 1.25 + deflection;
    coil.position.y = load.position.y;
    coil.scale.y = (1.36 - deflection) / 1.36;
    stem.position.y = 1.91 + deflection / 2;
    stem.scale.y = coil.scale.y;
    secondary.position.y = .42 + .23 * Math.tanh(p.y);
    if (absorberSpring) absorberSpring.scale.y = (load.position.y - .16 - secondary.position.y - .12) / .55;
    if (eccentric) eccentric.rotation.z = p.theta;
  }};
}

function isolationBench(hero, fixed, mats) {
  const platform = group(hero, 0, .95);
  box(platform, 3.38, .21, 1.7, mats.paint);
  const drive = motor(platform, 1.65, .48);
  drive.position.set(.32, .64, 0);
  box(platform, .82, 1.18, .92, mats.aluminum, -1.03, .64);
  box(platform, .56, .81, .055, mats.dark, -1.03, .72, .49);
  box(platform, .29, .047, .028, mats.glow, -1.03, .88, .53);
  const springs = [];
  for (const x of [-1.24, 1.24]) for (const z of [-.58, .58]) {
    cylinder(fixed, .26, .14, mats.steel, x, .36, z);
    springs.push(spring(hero, mats, x, .43, z, .415, .145));
    cylinder(platform, .23, .09, mats.steel, x, -.105, z);
  }
  return {detail: [platform, ...springs], update(p) {
    const displacement = .24 * Math.tanh(p.x) - .009 * p.m2;
    platform.position.y = .95 + displacement;
    springs.forEach(coil => {coil.scale.y = (.415 + displacement) / .415;});
  }};
}

function rotatingBench(hero, fixed, mats, id) {
  const assembly = group(hero, .19, 1.28);
  const shaft = group(assembly);
  const rod = cylinder(shaft, .105, 3.06, mats.steel);
  rod.rotation.z = Math.PI / 2;
  for (const x of [-1.55, 1.55]) {
    box(fixed, .26, 1.22, .75, mats.paint, x, .69);
    const support = cylinder(fixed, id === 278 ? .64 : .38, .32, mats.steel, x, 1.28);
    support.rotation.z = Math.PI / 2;
    if (id === 278) {
      const liner = new THREE.Mesh(new THREE.TorusGeometry(.34, .072, 10, 36), mats.copper);
      liner.rotation.y = Math.PI / 2;
      liner.position.set(x + .17, 1.28, 0);
      fixed.add(liner);
    }
  }
  const moving = [];
  let flywheel;
  if (id === 275) {
    for (let i = 0; i < 4; i++) {
      const x = -.96 + i * .64;
      const crank = group(assembly, x);
      const web = cylinder(crank, .23, .14, mats.steel, -.14);
      web.rotation.z = Math.PI / 2;
      box(crank, .14, .41, .17, mats.copper, -.07, .18);
      const rodLink = box(assembly, .082, .75, .102, mats.steel, x);
      const piston = cylinder(assembly, .151, .22, mats.aluminum, x);
      const sleeve = group(fixed, x + .19, 2.26, -.15);
      for (const side of [-1, 1]) box(sleeve, .037, .59, .32, mats.paint, side * .19);
      moving.push({crank, piston, rodLink});
    }
  } else {
    for (const x of id === 273 ? [-.51, .64] : [0]) {
      const rotor = group(shaft, x);
      const wheel = cylinder(rotor, id === 278 ? .24 : .69, .26, mats.steel);
      wheel.rotation.z = Math.PI / 2;
      if (id === 280) flywheel = rotor;
      for (let i = 0; i < 9; i++) {
        const spoke = group(rotor);
        spoke.rotation.x = i * Math.PI * 2 / 9;
        box(spoke, .04, id === 278 ? .09 : .38, .075, i ? mats.dark : mats.copper, .14, id === 278 ? .14 : .35);
      }
    }
  }
  return {detail: [assembly], update(p) {
    shaft.rotation.x = p.theta;
    if (flywheel) flywheel.scale.x = .65 + .55 * p.inertia;
    if (id === 273 || id === 278) {
      shaft.position.y = .22 * p.y;
      shaft.position.z = .22 * p.x;
    }
    moving.forEach(({crank, piston, rodLink}, i) => {
      const angle = p.theta + [0, Math.PI, Math.PI + p.phase, p.phase][i];
      crank.rotation.x = angle;
      const pinY = .22 * Math.cos(angle);
      const pinZ = .22 * Math.sin(angle);
      const rodLength = .22 / .3;
      const wristY = pinY + Math.sqrt(rodLength ** 2 - pinZ ** 2);
      piston.position.y = wristY + .07;
      rodLink.position.y = (wristY + pinY) / 2;
      rodLink.position.z = pinZ / 2;
      rodLink.rotation.x = Math.atan2(-pinZ, wristY - pinY);
      rodLink.scale.y = rodLength / .75;
    });
  }};
}

function modalBench(hero, fixed, mats) {
  box(fixed, .54, 1.44, .85, mats.paint, -1.67, .83);
  box(fixed, .52, .34, .81, mats.steel, -1.67, 1.65);
  const beam = group(hero, -1.44, 1.56);
  const segments = Array.from({length: 28}, (_, i) => box(beam, .13, .085, .28, i % 4 ? mats.steel : mats.copper, i * .115));
  const probe = box(beam, .16, .11, .17, mats.glow, 0, .13, .012);
  return {detail: [beam], update(p) {
    const beta = p.beta;
    const length = 2 + p.m2;
    for (const [i, segment] of segments.entries()) {
      const s = (i + .5) / segments.length;
      const displacement = u => .25 * p.y * cantileverShape(beta, u);
      segment.position.set(length * s, displacement(s), 0);
      segment.rotation.z = Math.atan2(displacement(s + .005) - displacement(s - .005), .01 * length);
      segment.scale.x = length / (segments.length * .115);
    }
    const s = .86;
    probe.position.x = length * s;
    probe.position.y = .125 + .25 * p.y * cantileverShape(beta, s);
  }};
}

function impactBench(hero, fixed, mats) {
  for (const x of [-.51, .51]) cylinder(fixed, .063, 2.62, mats.steel, x, 1.5);
  box(fixed, 1.55, .16, .74, mats.paint, 0, 2.88);
  box(fixed, 1.46, .23, .88, mats.steel, 0, .22);
  const hammer = group(hero, 0, .49, .08);
  cylinder(hammer, .29, .31, mats.copper);
  box(hammer, 1.06, .12, .24, mats.aluminum, 0, .19);
  const scale = group(hero, .87, .48, .22);
  box(scale, .19, 1.67, .1, mats.paint, 0, .76);
  for (let i = 0; i <= 14; i++) box(scale, i % 5 === 0 ? .15 : .095, .013, .012, mats.steel, .013, .091 * i, .054);
  const rebound = box(scale, .24, .025, .037, mats.glow, 0, 0, .094);
  box(fixed, .68, .47, .56, mats.dark, -1.15, .5, .33);
  box(fixed, .48, .073, .036, mats.glow, -1.15, .59, .63);
  return {detail: [hammer, scale], update(p) {
    hammer.position.y = .49 + .91 * p.y;
    rebound.position.y = .91 * p.reference;
  }};
}

export function vibrationScene(id, {scene, mats}) {
  const hero = group(scene);
  const fixed = group(hero);
  foot(fixed, mats, 5, 3);
  const rig = id === 277 ? modalBench(hero, fixed, mats) : id === 279 ? impactBench(hero, fixed, mats)
    : id === 276 ? isolationBench(hero, fixed, mats)
    : [273, 275, 278, 280].includes(id) ? rotatingBench(hero, fixed, mats, id) : slidingBench(hero, fixed, mats, id);
  mergeByMaterial(fixed);
  return {hero, ...rig, views: {assembly: hero}, floorY: -.29};
}
