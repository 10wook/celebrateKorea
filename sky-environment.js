import * as THREE from "three";

const SKY_RADIUS = 90;
const CELESTIAL_DIST = 72;

export function getKstHourDecimal(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const map = Object.fromEntries(fmt.map((p) => [p.type, p.value]));
  return Number(map.hour) + Number(map.minute) / 60 + Number(map.second) / 3600;
}

function lerpColor(a, b, t) {
  return a.clone().lerp(b, t);
}

export function createSkyEnvironment(scene) {
  const starsPositions = new Float32Array(400 * 3);
  for (let i = 0; i < 400; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.92 + 0.02);
    starsPositions[i * 3] = SKY_RADIUS * Math.sin(phi) * Math.cos(theta);
    starsPositions[i * 3 + 1] = SKY_RADIUS * Math.cos(phi);
    starsPositions[i * 3 + 2] = SKY_RADIUS * Math.sin(phi) * Math.sin(theta);
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute("position", new THREE.BufferAttribute(starsPositions, 3));
  const starsMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.45,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
  });
  const stars = new THREE.Points(starsGeo, starsMat);
  scene.add(stars);

  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xfff0a0 })
  );
  scene.add(sunMesh);

  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xe6edf8 })
  );
  scene.add(moonMesh);

  const sunLight = new THREE.DirectionalLight(0xfff2d6, 1.1);
  sunLight.castShadow = false;
  scene.add(sunLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x8ec8ff, 0x3d7a47, 0.3);
  scene.add(hemi);

  const skyColors = {
    dayTop: new THREE.Color(0x3d9cf0),
    dayHorizon: new THREE.Color(0xb8e0f8),
    nightTop: new THREE.Color(0x060b1a),
    nightHorizon: new THREE.Color(0x142040),
    twilightTop: new THREE.Color(0x3a2858),
    twilightHorizon: new THREE.Color(0xff7a45),
  };

  const _sky = new THREE.Color();
  const _sunPos = new THREE.Vector3();
  let forceNight = null;

  function setForceNight(value) {
    forceNight = value;
  }

  function update(now = new Date(), elapsed = 0) {
    let hour = getKstHourDecimal(now);
    if (forceNight === true) hour = 2;
    else if (forceNight === false) hour = 12;

    const sunAngle = (hour / 24 - 0.25) * Math.PI * 2;
    const sunY = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle);

    _sunPos.set(sunX * CELESTIAL_DIST, sunY * CELESTIAL_DIST, 18);
    sunMesh.position.copy(_sunPos);
    moonMesh.position.set(-sunX * CELESTIAL_DIST, -sunY * CELESTIAL_DIST, -12);

    sunMesh.visible = sunY > -0.12;
    moonMesh.visible = sunY < 0.2;

    const dayAmount = THREE.MathUtils.smoothstep(sunY, -0.05, 0.45);
    const nightAmount = 1 - THREE.MathUtils.smoothstep(sunY, -0.4, 0.08);
    const twilight = Math.exp(-Math.pow(sunY / 0.22, 2)) * (1 - dayAmount * 0.6);

    let top = lerpColor(skyColors.nightTop, skyColors.dayTop, dayAmount);
    let horizon = lerpColor(skyColors.nightHorizon, skyColors.dayHorizon, dayAmount);
    if (twilight > 0.05) {
      top = lerpColor(top, skyColors.twilightTop, twilight * 0.85);
      horizon = lerpColor(horizon, skyColors.twilightHorizon, twilight);
    }
    _sky.copy(top).lerp(horizon, 0.35);
    scene.background = _sky.clone();
    if (scene.fog) {
      scene.fog.color.copy(horizon);
      scene.fog.near = 18 + dayAmount * 12;
      scene.fog.far = 55 + dayAmount * 35;
    }

    starsMat.opacity = nightAmount * (0.7 + Math.sin(elapsed * 1.2) * 0.05);
    sunLight.position.copy(_sunPos);
    sunLight.intensity = Math.max(0.04, sunY * 1.35 + 0.08);
    sunLight.color.setHSL(0.11 - twilight * 0.04, 0.75, 0.55 + dayAmount * 0.1);

    ambient.intensity = 0.12 + dayAmount * 0.42;
    ambient.color.setHSL(0.6, 0.2, 0.45 + dayAmount * 0.25);
    hemi.intensity = 0.15 + dayAmount * 0.35;
    hemi.color.setHex(dayAmount > 0.3 ? 0x8ec8ff : 0x1a2848);
    hemi.groundColor.setHex(dayAmount > 0.3 ? 0x3d7a47 : 0x0a1810);

    return { hour, dayAmount, nightAmount, sunY };
  }

  return { update, setForceNight, sunLight, ambient, hemi, stars };
}

export function createStadium(scene) {
  const grass = new THREE.Mesh(
    new THREE.CircleGeometry(45, 64),
    new THREE.MeshStandardMaterial({ color: 0x3f8f4a, roughness: 0.92, metalness: 0 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.01;
  scene.add(grass);

  const trackMat = new THREE.MeshStandardMaterial({ color: 0xc4563a, roughness: 0.88 });
  const track = new THREE.Mesh(new THREE.RingGeometry(14, 17.5, 64), trackMat);
  track.rotation.x = -Math.PI / 2;
  scene.add(track);

  const innerLine = new THREE.Mesh(
    new THREE.RingGeometry(13.8, 14, 64),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 })
  );
  innerLine.rotation.x = -Math.PI / 2;
  innerLine.position.y = 0.005;
  scene.add(innerLine);

  const outerLine = new THREE.Mesh(
    new THREE.RingGeometry(17.3, 17.5, 64),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 })
  );
  outerLine.rotation.x = -Math.PI / 2;
  outerLine.position.y = 0.005;
  scene.add(outerLine);

  const centerCircle = new THREE.Mesh(
    new THREE.RingGeometry(2.8, 3, 48),
    new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 })
  );
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.y = 0.006;
  scene.add(centerCircle);

  return { grass, track };
}
