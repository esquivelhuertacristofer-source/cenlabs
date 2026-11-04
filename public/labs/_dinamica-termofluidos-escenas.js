import {THREE, group, box, cylinder, foot, mergeByMaterial, motor} from './_proceso-piezas.js';

function tube(parent, material, coords, radius = .075) {
  const path = new THREE.CatmullRomCurve3(coords.map(p => new THREE.Vector3(...p)));
  parent.add(new THREE.Mesh(new THREE.TubeGeometry(path, 48, radius, 9, false), material));
  return path;
}

function stream(parent, mats, path, count, speed, warm = false) {
  const dots = Array.from({length: count}, () => cylinder(parent, .046, .075, warm ? mats.copper : mats.glow));
  return value => dots.forEach((dot, i) => dot.position.copy(path.getPointAt(((i / count + speed * value) % 1 + 1) % 1)));
}

function clearWall(color) {
  return new THREE.MeshStandardMaterial({color, transparent: true, opacity: .37, roughness: .34, metalness: .18, depthWrite: false});
}

function exchanger(hero, fixed, mats, id) {
  const bank = group(hero);
  const motions = [];
  if (id === 282) {
    box(bank, .43, 1.5, 1.6, mats.copper, -1.43, 1.14);
    const strips = [];
    const geometry = new THREE.BoxGeometry(.136, .055, 1.4);
    for (let x = 0; x < 20; x++) {
      const material = mats.aluminum.clone();
      const strip = group(bank);
      for (let i = 0; i < 7; i++) {
        const fin = new THREE.Mesh(geometry.clone(), material);
        fin.position.set(-1.15 + x * .136, .62 + i * .17, 0);
        fin.castShadow = fin.receiveShadow = true;
        strip.add(fin);
      }
      mergeByMaterial(strip);
      strips.push(material);
    }
    geometry.dispose();
    const probe = box(bank, .027, .12, .079, mats.glow, 0, 1.71, .62);
    const hot = new THREE.Color(0xff672d);
    const cold = new THREE.Color(0x65cfff);
    return {detail: [bank], update(p) {
      const k = Math.sqrt(2 * p.b / (p.a * .003)) * .085;
      for (const [i, material] of strips.entries()) material.color.copy(cold).lerp(hot, Math.cosh(k * (1 - i / 19)) / Math.cosh(k));
      probe.position.x = -1.15 + 2.584 * p.x;
    }};
  }
  for (const x of [-1.55, 1.55]) {
    box(bank, .24, 1.26, 1.62, mats.paint, x, 1.1);
    for (const y of [.62, 1.58]) for (const z of [-.64, .64]) {
      const bolt = cylinder(bank, .06, .08, mats.steel, x + Math.sign(x) * .15, y, z, 6);
      bolt.rotation.z = Math.PI / 2;
    }
  }
  const hotTube = clearWall(0xe9944e);
  const coldTube = clearWall(0x71c7ed);
  for (let i = 0; i < 6; i++) {
    const y = .72 + i * .16;
    const z = i % 2 === 0 ? .24 : -.24;
    const warm = i % 2 === 0;
    const path = tube(bank, warm ? hotTube : coldTube, [[-1.7,y,z],[-1.1,y,z],[0,y,z],[1.1,y,z],[1.7,y,z]], .064);
    tube(fixed, warm ? mats.copper : mats.dark, [[-1.72,y,z],[-1.97,y + .1,z],[-2,y + .37,z]], .046);
    motions.push(stream(hero, mats, path, 6, warm ? 1 : -1, warm));
  }
  return {detail: [bank], update(p) { motions.forEach(move => move(p.x)); }};
}

function processLoop(hero, fixed, mats, id) {
  const core = group(hero);
  const warm = mats.copper;
  const node = [[-1.45,.77,.55],[-1.26,1.77,-.55],[1.22,1.77,-.55],[1.52,.77,.55]];
  const lamps = [];
  for (const [i, [x,y,z]] of node.entries()) {
    const unit = group(core, x, y, z);
    const isBoiler = id === 283 && i === 1;
    const isTurbine = id === 283 && i === 2;
    const isValve = id === 284 && i === 2;
    if (isBoiler) {
      cylinder(unit, .4, .96, mats.paint, 0, .12, 0);
      for (const y of [-.22,.02,.29,.54]) cylinder(unit, .419, .042, mats.steel, 0, y, 0);
      tube(unit, warm, [[-.31,-.25,.31],[-.2,-.13,.38],[.25,-.02,.38],[.28,.17,.39],[-.25,.32,.39],[-.28,.51,.29]], .051);
    } else if (isTurbine) {
      cylinder(unit, .414, .51, mats.paint).rotation.x = Math.PI / 2;
      cylinder(unit, .346, .064, mats.steel, 0, 0, .284).rotation.x = Math.PI / 2;
      for (let j = 0; j < 9; j++) {
        const blade = group(unit, 0, 0, .324);
        blade.rotation.z = j * 2 * Math.PI / 9;
        box(blade, .054, .19, .064, warm, .024, .205).rotation.z = .46;
      }
    } else if (isValve) {
      cylinder(unit, .15, .81, warm).rotation.z = Math.PI / 2;
      cylinder(unit, .27, .34, mats.steel, 0, .06);
      cylinder(unit, .086, .22, warm, 0, .3);
      box(unit, .49, .053, .094, mats.paint, 0, .412);
    } else if (i === 1 || i === 3) {
      box(unit, .87, .64, .71, mats.paint);
      for (let j = 0; j < 8; j++) box(unit, .043, .48, .105, i === 1 ? warm : mats.steel, -.31 + j * .087, 0, .401);
    } else {
      box(unit, .87, .64, .71, mats.paint);
      const cap = cylinder(unit, .33, .19, mats.steel, 0, 0, .42);
      cap.rotation.x = Math.PI / 2;
      box(unit, .24, .033, .035, warm, 0, 0, .53);
    }
    lamps.push(box(unit, .26, .047, .03, mats.glow, 0, -.28, .535));
  }
  const pipes = node.map((start, i) => {
    const end = node[(i + 1) % node.length];
    return tube(core, (i === 1 || (id === 284 && i === 2)) ? warm : mats.steel,
      [start, [start[0], start[1] + .36, start[2]], [(start[0]+end[0])/2, (start[1]+end[1])/2 + .4, (start[2]+end[2])/2], [end[0], end[1] + .36, end[2]], end], .067);
  });
  const motions = pipes.map((path,i) => stream(hero, mats, path, 4, 2, i === 1));
  return {detail: [core], update(p) {
    const index = Math.min(3, Math.floor(p.x * 4));
    lamps.forEach((lamp, i) => {lamp.visible = i === index;});
    motions.forEach(move => move(p.x));
  }};
}

function wheelBench(hero, fixed, mats, id) {
  const panel = group(hero, .26, 1.31, .16);
  const rotor = group(panel);
  const hub = cylinder(rotor, id === 285 ? .63 : .7, .2, mats.steel);
  hub.rotation.x = Math.PI / 2;
  const base = motor(fixed, mats, .91, .34);
  base.rotation.x = Math.PI / 2;
  base.position.set(.26, 1.31, -.7);
  box(fixed, 1.8, .75, .9, mats.paint, .28, .53, -.18);
  for (let i = 0; i < 15; i++) {
    const vane = group(rotor);
    vane.rotation.z = 2 * Math.PI * i / 15;
    if (id === 285) {
      box(vane, .09, .49, .14, mats.copper, .08, .31, .19).rotation.z = -.34;
    } else {
      for (const side of [-1, 1]) {
        const bucket = cylinder(vane, .135, .11, mats.copper, .66, side * .057, .13, 10);
        bucket.rotation.x = side * .43;
      }
    }
  }
  const path = tube(fixed, id === 285 ? clearWall(0x66c8dd) : clearWall(0x62dff3), id === 285
    ? [[-2,.45,.18],[-1.2,.45,.18],[-.6,.8,.18],[.26,1.31,.18],[.4,1.95,.18],[1.3,2.25,.18],[1.9,2.25,.18]]
    : [[-2,1.93,.16],[-1.65,1.93,.16],[-.8,1.93,.16],[-.2,1.93,.16]], id === 285 ? .14 : .065);
  const dots = stream(hero, mats, path, 12, 2.5);
  return {detail: [panel], update(p) {rotor.rotation.z = p.theta; dots(p.x);}};
}

function ductBench(hero, fixed, mats, id) {
  const core = group(hero);
  const first = -1.85;
  const length = 3.7;
  const y = 1.22;
  for (const x of [-1.65, 1.65]) box(fixed, .24, 1, .72, mats.paint, x, .64);
  const inner = mats.copper;
  const slices = [];
  const probes = [];
  const stages = [];
  const coolers = [];
  const count = 32;
  if (id === 288) {
    for (let i = 0; i < 4; i++) {
      const x = first + .47 + .92 * i;
      const stage = group(core, x, y);
      stages.push(stage);
      box(stage, .69, .82, .76, mats.paint);
      const flywheel = cylinder(stage, .28, .12, mats.steel, 0, 0, .46);
      flywheel.rotation.x = Math.PI / 2;
      const probe = group(stage, 0, 0, .55);
      box(probe, .072, .23, .037, mats.copper, 0, .13);
      probes.push(probe);
      if (i === 3) continue;
      const cooler = group(core, x + .46, y, -.49);
      coolers.push(cooler);
      box(cooler, .21, .67, .23, mats.paint);
      for (let j = 0; j < 6; j++) box(cooler, .28, .034, .38, mats.aluminum, 0, -.23 + .09 * j, 0);
    }
  } else {
    for (let i = 0; i < count; i++) {
      const x = first + length * (i + .5) / count;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.40, .038, 8, 30, Math.PI * 1.48), i % 4 === 0 ? inner : mats.steel);
      ring.position.set(x,y,0);
      ring.rotation.y = Math.PI / 2;
      ring.rotation.x = .38;
      core.add(ring);
      slices.push(ring);
    }
    if (id === 289) {
      const pipe = cylinder(core, .17, length, inner, 0, y);
      pipe.rotation.z = Math.PI / 2;
    }
  }
  const shockMat = mats.copper.clone();
  shockMat.color.setHex(0xff391e);
  const shock = new THREE.Mesh(new THREE.TorusGeometry(.41, .045, 9, 30), shockMat);
  shock.rotation.y = Math.PI / 2;
  shock.position.y = y;
  shock.visible = false;
  core.add(shock);
  const tracer = cylinder(core, .075, .12, mats.glow, 0, y, .16);
  tracer.rotation.z = Math.PI / 2;
  return {detail: [core], update(p) {
    tracer.position.x = first + length * p.x;
    if (id === 288) {
      const spacing = length / p.b;
      stages.forEach((stage, i) => {
        stage.visible = i < p.b;
        stage.position.x = first + (i + .5) * spacing;
        probes[i].rotation.z = p.theta * (i + 1);
      });
      coolers.forEach((cooler, i) => {
        cooler.visible = i < p.b - 1;
        cooler.position.x = first + (i + 1) * spacing;
      });
    }
    slices.forEach((ring, i) => {
      const u = (i + .5) / count;
      const area = u <= .4 ? 1 + ((.4 - u) / .4) ** 2 : 1 + (p.a - 1) * ((u - .4) / .6) ** 2;
      const radius = id === 290 ? .69 * Math.sqrt(area) : id === 289 ? .44 + .91 * p.y : .74;
      ring.scale.setScalar(radius);
    });
    shock.visible = id === 290 && p.y >= 0;
    shock.position.x = first + length * p.y;
    if (shock.visible) shock.scale.setScalar(.69 * Math.sqrt(1 + (p.a - 1) * ((p.y - .4) / .6) ** 2));
  }};
}

function pressureBench(hero, fixed, mats) {
  const bank = group(hero);
  const coordinates = [[-2.05,.77,.36],[-1.5,.77,.36],[.8,.77,.36],[1.61,.85,.36],[1.78,1.2,.36],[1.78,1.59,.36]];
  const flow = tube(bank, clearWall(0x75cde7), coordinates, .15);
  const tracers = Array.from({length: 15}, (_, i) => cylinder(hero, .023, .071, i % 3 === 1 ? mats.glow : mats.aluminum));
  const needles = [];
  for (const x of [-1.22, 0, 1.21]) {
    cylinder(bank, .045, .77, mats.copper, x, 1.15, .36);
    const dial = group(bank, x, 1.68, .36);
    cylinder(dial, .268, .15, mats.steel).rotation.x = Math.PI / 2;
    cylinder(dial, .22, .03, mats.dark, 0, 0, .091).rotation.x = Math.PI / 2;
    for (let i = -3; i <= 3; i++) {
      const tick = group(dial, 0, 0, .111);
      tick.rotation.z = i * .66;
      box(tick, .015, .037, .011, mats.aluminum, 0, .179);
    }
    const needle = group(dial, 0, 0, .124);
    box(needle, .027, .162, .011, mats.copper, 0, .061);
    needles.push(needle);
  }
  for (const x of [-1.63, 1.1]) box(fixed, .28, .57, .46, mats.paint, x, .45, .36);
  return {detail: [bank], update(p) {
    needles.forEach((needle, i) => {needle.rotation.z = 2 - 4 * Math.max(0, 12 - i * p.m3 / 2) / 12;});
    const mixing = Math.max(0, Math.min(1, (p.m1 - 2300) / 1700));
    tracers.forEach((tracer, i) => {
      const lane = i % 3 - 1;
      const speed = 1 - .39 * Math.abs(lane) * (1 - mixing);
      const u = (i / tracers.length + p.x * speed) % 1;
      tracer.position.copy(flow.getPointAt(u));
      tracer.position.z += .075 * lane + .037 * mixing * Math.sin(37 * u + i);
      tracer.position.y += .037 * mixing * Math.cos(41 * u - i);
      tracer.rotation.z = Math.PI / 2;
    });
  }};
}

export function thermalScene(id, {scene, mats}) {
  const hero = group(scene);
  const fixed = group(hero);
  foot(fixed, mats, 5, 3);
  const rig = id <= 282 ? exchanger(hero, fixed, mats, id) : id <= 284 ? processLoop(hero, fixed, mats, id)
    : id === 285 || id === 287 ? wheelBench(hero, fixed, mats, id)
      : id === 286 ? pressureBench(hero, fixed, mats) : ductBench(hero, fixed, mats, id);
  mergeByMaterial(fixed);
  return {hero, ...rig, views: {assembly: hero}, floorY: -.29};
}
