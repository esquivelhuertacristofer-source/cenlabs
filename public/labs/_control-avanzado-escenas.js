import {THREE, group, box, cylinder, foot, mergeByMaterial, motor, lathe, tube} from './_proceso-piezas.js';
import {gray, channel} from './_control-avanzado-encoder.js';

function buildFrequencyBench({scene, mats, S}) {
  const hero = group(scene);
  const fixed = group(hero);
  const core = group(hero, 0, 1.25, 0);
  foot(fixed, mats, 4.3, 2.5);
  const indicators = [-.65, .65].map((x, index) => {
    box(fixed, .66, .14, .8, mats.paint, x, .05, 0);
    for (const side of [-1, 1]) cylinder(fixed, .035, 2.55, mats.steel, x + side * .23, 1.33, .04);
    box(fixed, .61, .12, .64, mats.paint, x, 2.64, 0);
    const guide = group(core, x, 0, -.06);
    lathe(guide, [[.11,-.87],[.19,-.87],[.24,-.75],[.24,-.42],[.19,-.36],[.11,-.36],[.11,-.87]], mats.steel);
    const moving = group(core, x, .45, .04);
    cylinder(moving, .071, 1.1, mats.steel, 0, -.57, -.10);
    box(moving, .54, .15, .31, index ? mats.paint : mats.copper);
    box(moving, .32, .035, .015, mats.glow, 0, 0, .17);
    return moving;
  });
  mergeByMaterial(fixed);
  return {hero, indicators, detail: [core, fixed], views: {assembly: hero}, floorY: -.29, S};
}
function buildServo({scene, mats, S}) {
  const hero = group(scene);
  const fixed = group(hero);
  const core = group(hero, 0, 1.45, 0);
  foot(fixed, mats, 4.6, 3);
  box(fixed, .8, 1.42, .68, mats.paint, 0, .67, -.8);
  const drive = motor(fixed, mats, .87, .42);
  drive.position.set(0, 1.45, -.76);
  drive.rotation.x = Math.PI / 2;
  const plate = cylinder(core, .81, .11, mats.dark, 0, 0, -.18);
  plate.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.80, .041, 10, 48), mats.steel);
  rim.position.z = -.105;
  core.add(rim);
  for (let i = -6; i <= 6; i++) {
    const angle = i * .18;
    const mark = group(core, -.69 * Math.sin(angle), .69 * Math.cos(angle), -.105);
    mark.rotation.z = angle;
    box(mark, .017, i % 3 === 0 ? .10 : .055, .009, mats.aluminum);
  }
  const pointer = group(core);
  const shaft = cylinder(pointer, .13, .61, mats.steel, 0, 0, -.21);
  shaft.rotation.x = Math.PI / 2;
  box(pointer, .055, .60, .042, mats.copper, 0, .32, .10);
  box(pointer, .11, .065, .045, mats.glow, 0, .61, .11);
  const controller = group(hero, -1.39, .64, -.13);
  box(controller, .86, 1.2, .66, mats.paint);
  box(controller, .70, .50, .035, mats.dark, 0, .19, .35);
  const meter = box(controller, .57, .066, .032, mats.glow, 0, .19, .38);
  for (let i = 0; i < 5; i++) box(controller, .60, .018, .021, mats.steel, 0, -.16 - i * .07, .35);
  tube(fixed, [[-1.39,.89,-.43],[-1.28,.57,-.66],[-.65,.42,-.82],[-.23,.76,-.84],[0,1.23,-.85]], .037, mats.copper);
  mergeByMaterial(fixed);
  return {hero, pointer, meter, detail: [core, controller], views: {assembly: hero}, floorY: -.29, S};
}

function buildCascade({scene, mats, S}) {
  const hero = group(scene);
  const fixed = group(hero);
  const bench = group(hero, 0, 1, 0);
  foot(fixed, mats, 5.1, 2.9);
  const pulleys = [-1.32, 1.32].map(x => {
    box(fixed, .27, 1.05, .40, mats.paint, x, .50, -.30);
    const pulley = group(bench, x, 0, .06);
    const drum = cylinder(pulley, .42, .34, mats.aluminum);
    drum.rotation.x = Math.PI / 2;
    box(pulley, .048, .31, .009, mats.copper, 0, .18, .176);
    return pulley;
  });
  for (const y of [-.432, .432]) box(bench, 2.64, .024, .35, mats.rubber, 0, y, .06);
  const drive = motor(fixed, mats, .70, .27);
  drive.position.set(-1.32, 1, -.71);
  drive.rotation.x = Math.PI / 2;
  const carriage = group(bench, -.5, .50, .06);
  box(carriage, .34, .11, .35, mats.copper);
  box(carriage, .22, .22, .26, mats.steel, 0, .15, 0);
  box(bench, .035, .13, .05, mats.glow, -.5 + .42 * 1.3, .59, .32);
  mergeByMaterial(fixed);
  return {hero, pulleys, carriage, detail: [bench], views: {assembly: hero}, floorY: -.29, S};
}

function buildNetwork({scene, mats, S}) {
  const hero = group(scene);
  const fixed = group(hero);
  const core = group(hero, 0, 1.05, 0);
  foot(fixed, mats, 5.3, 2.7);
  for (const [index, x] of [-1.5, 1.5].entries()) {
    box(core, .80, 1.38, .48, index ? mats.paint : mats.dark, x, .03, -.14);
    box(core, .67, .24, .06, mats.steel, x, .47, .13);
    for (let k = 0; k < 8; k++) {
      box(core, .06, .045, .052, mats.dark, x + (k - 3.5) * .08, -.48, .14);
      box(core, .045, .025, .025, mats.aluminum, x + (k - 3.5) * .08, .46, .17);
    }
    for (let row = 0; row < 5; row++) box(core, .48, .024, .016, mats.steel, x, .19 - row * .07, .11);
    box(fixed, 1.1, .22, .83, mats.paint, x, .10, -.14);
  }
  box(core, 2.2, .075, .09, mats.dark, 0, -.3, .14);
  const packet = box(core, .21, .08, .08, mats.glow, -1.10, -.3, .19);
  const failure = box(core, .16, .045, .026, mats.copper, 1.50, .52, .185);
  mergeByMaterial(fixed);
  return {hero, packet, failure, signalMaterials: [mats.aluminum, mats.glow, mats.copper], detail: [core], views: {assembly: hero}, floorY: -.29, S};
}

function buildTopology({scene, mats, S}) {
  const hero = group(scene);
  const fixed = group(hero);
  const core = group(hero, 0, 1.15, .12);
  foot(fixed, mats, 5.3, 3.2);
  box(fixed, 4.4, 2.2, .08, mats.paint, 0, 1.12, -.35);
  const points = [[-1.58,-.5], [-.51,-.5], [.58,.47], [1.56,.47]];
  const leds = points.map(([x,y], i) => {
    const width = i === 0 ? .46 : .68;
    box(core, width, i === 2 ? .39 : .74, .40, i === 0 ? mats.copper : mats.dark, x, y, -.13);
    for (let k = 0; k < 4; k++) box(core, .049, .035, .012, mats.aluminum, x + (k - 1.5) * .09, y - .08, .075);
    return box(core, .17, .05, .03, mats.glow, x, y + .06, .095);
  });
  box(core, .63, .055, .052, mats.copper, -1.045, -.5, .01);
  box(core, 1.09, .055, .052, mats.steel, .035, -.5, .01);
  box(core, .055, .97, .052, mats.steel, .58, -.015, .01);
  box(core, .98, .055, .052, mats.steel, 1.07, .47, .01);
  const program = box(core, .24, .055, .025, mats.glow, 1.56, .70, .095);
  mergeByMaterial(fixed);
  return {hero, topology: {leds, program}, detail: [core, fixed], views: {assembly: hero}, floorY: -.29, S};
}

function buildDrive({scene, mats, S}) {
  const hero = group(scene);
  const fixed = group(hero);
  const core = group(hero, .75, 1.26, .1);
  foot(fixed, mats, 4.8, 2.8);
  box(fixed, .9, 1.1, .7, mats.paint, .75, .57, -.68);
  const drive = motor(fixed, mats, .76, .30);
  drive.position.set(.75, 1.26, -.65);
  drive.rotation.x = Math.PI / 2;
  const rotor = group(core);
  const hub = cylinder(rotor, .22, .29, mats.aluminum);
  hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const blade = group(rotor);
    blade.rotation.z = i * Math.PI / 3;
    const vane = box(blade, .23, .63, .055, mats.steel, 0, .44, .01);
    vane.rotation.y = -.39;
  }
  const panel = group(hero, -1.31, 1.03, -.03);
  box(panel, .82, 1.55, .54, mats.dark);
  box(panel, .68, .18, .035, mats.paint, 0, .5, .28);
  for (let i = 0; i < 9; i++) box(panel, .54, .025, .015, mats.steel, 0, .22 - i * .058, .277);
  const limited = box(panel, .18, .055, .022, mats.copper, 0, .50, .309);
  mergeByMaterial(fixed);
  return {hero, fan: rotor, limited, detail: [core, panel], views: {assembly: hero}, floorY: -.29, S};
}

function buildEncoder({scene, mats, S}) {
  const hero = group(scene);
  const fixed = group(hero);
  const core = group(hero, -.30, 1.44, 0);
  foot(fixed, mats, 4.7, 2.8);
  box(fixed, .60, 1.34, .7, mats.paint, -.30, .68, -.5);
  const drive = motor(fixed, mats, .7, .31);
  drive.position.set(-.3, 1.44, -.58);
  drive.rotation.x = Math.PI / 2;
  const disc = group(core);
  const back = cylinder(disc, 1.02, .1, mats.steel, 0, 0, -.035);
  back.rotation.x = Math.PI / 2;
  const hub = cylinder(disc, .22, .22, mats.copper);
  hub.rotation.x = Math.PI / 2;
  const spacing = 2 * Math.PI / 64;
  const material = mats.aluminum.clone();
  material.color.setHex(0xffffff);
  const matrix = new THREE.Matrix4();
  for (let track = 0; track < 8; track++) {
    const inner = .28 + track * .085;
    const wedges = new THREE.InstancedMesh(new THREE.RingGeometry(inner, inner + .068, 2, 1, 0, spacing * .94), material, 64);
    wedges.position.z = .021;
    for (let sector = 0; sector < 64; sector++) {
      const bit = track < 6 ? (gray(sector) >>> track) & 1 : (channel(sector) >>> (track - 6)) & 1;
      wedges.setMatrixAt(sector, matrix.makeRotationZ(-(sector + 1) * spacing));
      wedges.setColorAt(sector, new THREE.Color(bit ? 0xe1bd78 : 0x244158));
    }
    disc.add(wedges);
  }
  box(core, 1.04, .11, .15, mats.paint, .74, 0, .17);
  box(fixed, .23, 1.42, .24, mats.paint, .89, .72, .16);
  const leds = [0, 1].map(i => box(core, .073, .034, .026, mats.glow, 1.04 + i * .11, 0, .257));
  mergeByMaterial(fixed);
  return {hero, encoder: disc, leds, detail: [core], views: {assembly: hero}, floorY: -.29, S};
}

function buildDiagnostics({scene, mats, S}, safety) {
  const hero = group(scene);
  const fixed = group(hero);
  const shaft = group(hero, 1.1, 1.23, .15);
  foot(fixed, mats, 5, 3);
  const drive = motor(fixed, mats, 1.04, .42);
  drive.position.set(.65, 1.23, .15);
  box(fixed, 1.85, .7, .9, mats.paint, .72, .54, .15);
  const rotor = group(shaft, .63);
  const flywheel = cylinder(rotor, .65, .27, mats.steel);
  flywheel.rotation.z = Math.PI / 2;
  for (let i = 0; i < 10; i++) {
    const spoke = group(rotor);
    spoke.rotation.x = i * Math.PI / 5;
    box(spoke, .032, .39, .076, i === 0 ? mats.copper : mats.dark, .143, .35, 0);
  }
  const instrument = group(hero, -1.29, 1.12, .45);
  box(instrument, 1.61, 1.46, .48, mats.paint);
  box(instrument, 1.41, 1.21, .08, mats.dark, 0, 0, .265);
  const red = mats.copper.clone();
  red.color.setHex(0xc23027);
  const LEDs = [];
  const contacts = [];
  if (safety) {
    const button = cylinder(instrument, .17, .18, red, 0, .35, .39);
    button.rotation.x = Math.PI / 2;
    for (const x of [-.34, .34]) {
      box(instrument, .45, .48, .13, mats.aluminum, x, -.15, .34);
      box(instrument, .11, .07, .06, mats.copper, x - .11, -.13, .45);
      box(instrument, .11, .07, .06, mats.copper, x + .11, -.13, .45);
      const arm = group(instrument, x - .11, -.13, .5);
      box(arm, .235, .035, .045, mats.steel, .106);
      contacts.push(arm);
      LEDs.push(box(instrument, .22, .038, .026, mats.glow, x, -.31, .423));
    }
    LEDs.push(box(instrument, .26, .041, .026, red, 0, -.48, .33));
  } else {
    box(shaft, .28, .21, .28, mats.copper, .39, .47, 0);
    tube(fixed, [[1.49,1.74,.15],[1.32,1.93,-.08],[.65,1.66,-.45],[-.74,1.37,-.36],[-1.29,1.66,.18]], .034, mats.copper);
    for (let i = 0; i < 10; i++) LEDs.push(box(instrument, .09, .12, .025, i < 7 ? mats.glow : red, -.54 + i * .12, -.2, .32));
    for (let i = 0; i < 9; i++) {
      const y = -.07 + i * i * .0063;
      box(instrument, .13, .022, .024, mats.aluminum, -.48 + i * .12, y, .32);
    }
  }
  mergeByMaterial(fixed);
  return {hero, diagnostics: {rotor, contacts, LEDs}, detail: [instrument, shaft], views: {assembly: hero}, floorY: -.29, S};
}

export function build(id, {scene, mats, S}) {
  if (id === 292) return buildFrequencyBench({scene, mats, S});
  if (id === 293) return buildServo({scene, mats, S});
  if (id === 294) return buildCascade({scene, mats, S});
  if (id === 295) return buildNetwork({scene, mats, S});
  if (id === 296) return buildTopology({scene, mats, S});
  if (id === 297) return buildDrive({scene, mats, S});
  if (id === 298) return buildEncoder({scene, mats, S});
  if (id === 299 || id === 300) return buildDiagnostics({scene, mats, S}, id === 299);
  const hero = group(scene);
  const fixed = group(hero);
  const core = group(hero, 0, 1.22, 0);
  foot(fixed, mats, 4.6, 3.3);
  const drive = motor(fixed, mats, .86, .39);
  drive.rotation.x = Math.PI / 2;
  drive.position.set(0, 1.22, -1.05);
  const rotor = group(core);
  const shaft = cylinder(rotor, .12, 1.45, mats.steel, 0, 0, .12);
  shaft.rotation.x = Math.PI / 2;
  const roller = cylinder(rotor, .54, .72, mats.aluminum, 0, 0, .28);
  roller.rotation.x = Math.PI / 2;
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI / 6;
    const mark = group(rotor, .46 * Math.cos(angle), .46 * Math.sin(angle), .645);
    mark.rotation.z = angle;
    box(mark, .105, .035, .009, index === 0 ? mats.copper : mats.dark);
  }
  const base = group(fixed);
  box(base, 1.65, .18, 1.75, mats.paint, 0, .12, -.42);
  box(base, .55, .88, .64, mats.paint, 0, .64, -.99);
  for (const x of [-.81, .81]) {
    box(base, .2, .96, .23, mats.paint, x, .54, .63);
    box(base, .46, .11, .41, mats.steel, x, .02, .63);
  }
  box(base, 1.84, .18, .25, mats.paint, 0, 1.12, .63);
  const bearing = cylinder(base, .24, .17, mats.steel, 0, 1.22, .77);
  bearing.rotation.x = Math.PI / 2;
  const signal = box(core, .68, .045, .025, mats.glow, 0, .83, .64);
  mergeByMaterial(fixed);
  return {hero, core, rotor, signal, detail: [core], views: {assembly: hero}, floorY: -.29, S};
}
export function update(visual, point) {
  if (visual.diagnostics) {
    const {rotor, contacts, LEDs} = visual.diagnostics;
    rotor.rotation.x = point.angle;
    if (contacts.length) {
      const closed = [point.k1, point.k2];
      contacts.forEach((arm, i) => {arm.rotation.z = closed[i] ? 0 : .62;});
      LEDs.forEach((led, i) => {led.visible = Boolean(i === 2 ? point.blocked : closed[i]);});
    } else {
      LEDs.forEach((led, i) => {led.visible = point.rms >= (i + 1) * .45;});
    }
    return;
  }
  if (visual.encoder) {
    visual.encoder.rotation.z = point.angle;
    visual.leds.forEach((led, i) => {led.visible = Boolean((point.channels >>> i) & 1);});
    return;
  }
  if (visual.fan) {
    visual.fan.rotation.z = point.angle;
    visual.limited.visible = Boolean(point.limited);
    return;
  }
  if (visual.topology) {
    const thresholds = [0, point.acquired, point.sent, point.sent];
    visual.topology.leds.forEach((led, i) => {led.visible = point.timeMs >= thresholds[i];});
    visual.topology.program.visible = point.timeMs >= point.consumed;
    return;
  }
  if (visual.packet) {
    const outbound = point.phase < 1.4;
    const inbound = point.phase >= 1.65 && point.phase < 3.05 && point.responseBytes > 0;
    visual.packet.visible = outbound || inbound;
    visual.packet.material = visual.signalMaterials[outbound ? 0 : point.status === 1 ? 1 : 2];
    if (outbound) visual.packet.position.x = -1.1 + 2.2 * point.phase / 1.4;
    if (inbound) visual.packet.position.x = 1.1 - 2.2 * (point.phase - 1.65) / 1.4;
    visual.failure.visible = point.status !== 1 && point.phase >= 1.4;
    return;
  }
  if (visual.carriage) {
    for (const pulley of visual.pulleys) pulley.rotation.z = -point.angle;
    visual.carriage.position.x = -.5 + .42 * point.angle;
    return;
  }
  if (visual.pointer) {
    visual.pointer.rotation.z = .9 * Math.tanh(point.angle / .03);
    visual.meter.scale.x = Math.max(.03, Math.tanh(Math.abs(point.angle) / .03));
    return;
  }
  if (visual.indicators) {
    visual.indicators[0].position.y = .43 + .26 * point.reference;
    visual.indicators[1].position.y = .43 + .26 * point.signal;
    return;
  }
  visual.rotor.rotation.z = point.angle;
  visual.signal.scale.x = Math.max(.005, point.voltage);
  visual.signal.position.x = .34 * (point.voltage - 1);
}
