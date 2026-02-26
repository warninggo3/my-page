// ── Three.js 3D 뷰어 ──────────────────────────────────────
function initPlayerViewer() {
  const container = document.getElementById('player-viewer');
  if (!container || typeof THREE === 'undefined') return;

  const w = container.clientWidth;
  const h = container.clientHeight;

  // 렌더러
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  container.appendChild(renderer.domElement);

  // 씬 & 카메라
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 1000);
  camera.position.set(0, 1.2, 3.5);

  // 조명
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 5, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-3, 2, -2);
  scene.add(fill);

  // OrbitControls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2.5;
  controls.enablePan = false;
  controls.minDistance = 1;
  controls.maxDistance = 8;
  controls.target.set(0, 0.8, 0);
  controls.update();

  // GLB 로드
  const loader = new THREE.GLTFLoader();
  loader.load(
    'hwang.glb',
    (gltf) => {
      // 로딩 메시지 제거
      const msg = container.querySelector('.player-viewer__loading');
      if (msg) msg.remove();

      const model = gltf.scene;

      // 바운딩박스 기준 중심·크기 맞춤
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale  = 2.0 / maxDim;

      model.scale.setScalar(scale);
      model.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale
      );

      scene.add(model);
      controls.target.set(0, (size.y * scale) * 0.4, 0);
      controls.update();
    },
    undefined,
    (err) => {
      console.error('GLB 로드 실패:', err);
      const msg = container.querySelector('.player-viewer__loading');
      if (msg) msg.textContent = '모델을 불러올 수 없습니다.';
    }
  );

  // 애니메이션 루프
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // 리사이즈 대응
  const ro = new ResizeObserver(() => {
    const nw = container.clientWidth;
    const nh = container.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });
  ro.observe(container);
}

// ── 구장 지도 ─────────────────────────────────────────────
const stadiums = [
  {
    name: '사직야구장',
    city: '부산',
    lat: 35.1938,
    lng: 129.0613,
    games: 4,
    matches: '롯데 vs 삼성 / 롯데 vs LG',
  },
  {
    name: '삼성 라이온즈 파크',
    city: '대구',
    lat: 35.8419,
    lng: 128.6817,
    games: 6,
    matches: '롯데 vs 삼성 / 삼성 vs 두산',
  },
  {
    name: '잠실야구장',
    city: '서울',
    lat: 37.5121,
    lng: 127.0719,
    games: 3,
    matches: '롯데 vs LG / 롯데 vs 두산',
  },
];

document.addEventListener('DOMContentLoaded', () => {
  initPlayerViewer();

  const map = L.map('map',{ zoomControl: true, scrollWheelZoom: false }).setView([36.5, 128.2], 6);

  // 밝은 타일 (흰 배경 테마에 맞춤)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  stadiums.forEach((s) => {
    const radius = 8000 + s.games * 3000;

    // 원형 마커
    L.circle([s.lat, s.lng], {
      color: '#E31C39',
      fillColor: '#E31C39',
      fillOpacity: 0.25,
      weight: 2,
      radius,
    }).addTo(map);

    // 팝업 마커
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background:#E31C39;color:#fff;font-weight:800;font-size:12px;
        padding:4px 8px;border-radius:6px;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,.5);
      ">${s.city} ${s.games}경기</div>`,
      iconAnchor: [40, 14],
    });

    L.marker([s.lat, s.lng], { icon })
      .addTo(map)
      .bindPopup(
        `<strong>${s.name}</strong><br>${s.city} · ${s.games}경기<br><small>${s.matches}</small>`,
        { closeButton: false }
      );
  });
});
