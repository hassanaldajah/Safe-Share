import { useEffect, useRef } from "react";
import * as THREE from "three";

// Decorative 3D "vault" beside the hero text: a wireframe shell around a glowing core, two orbiting
// rings carrying small encrypted "packets", and a drifting particle field. Scrolling past the hero
// opens the vault (the shell turns, the rings widen, the camera moves in), so it follows Lenis' smooth
// scroll. It is purely visual (pointer-events: none), pauses when off screen or in a hidden tab, shows
// a single still frame for people who prefer reduced motion, and does nothing if WebGL is not available.
const TEAL = 0x2dd4bf;
const TEAL_DEEP = 0x14b8a6;

// Soft round glow drawn once into a canvas, used as a sprite texture behind the core
const glowTexture = () => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(45, 212, 191, 0.9)");
    g.addColorStop(0.35, "rgba(45, 212, 191, 0.25)");
    g.addColorStop(1, "rgba(45, 212, 191, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
};

const HeroScene3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the page still looks fine without the scene
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    let baseZ = 10;
    camera.position.set(0, 0, baseZ);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // Vault: outer and inner wireframe solids around a glowing core
    const vault = new THREE.Group();
    const outerGeo = track(new THREE.IcosahedronGeometry(1.9, 1));
    const outerMat = track(new THREE.MeshBasicMaterial({ color: TEAL, wireframe: true, transparent: true, opacity: 0.24 }));
    vault.add(new THREE.Mesh(outerGeo, outerMat));
    const innerGeo = track(new THREE.OctahedronGeometry(0.95, 0));
    const innerMat = track(new THREE.MeshBasicMaterial({ color: TEAL, wireframe: true, transparent: true, opacity: 0.6 }));
    const inner = new THREE.Mesh(innerGeo, innerMat);
    vault.add(inner);

    const coreGeo = track(new THREE.SphereGeometry(0.32, 24, 16));
    const coreMat = track(new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.85 }));
    const core = new THREE.Mesh(coreGeo, coreMat);
    vault.add(core);

    const haloTex = track(glowTexture());
    const haloMat = track(
      new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    const halo = new THREE.Sprite(haloMat);
    halo.scale.setScalar(3.2);
    vault.add(halo);
    scene.add(vault);

    // Orbiting rings, each carrying a few small packets that travel along it
    const RING_RADIUS = 2.9;
    const ringGeo = track(new THREE.TorusGeometry(RING_RADIUS, 0.012, 8, 200));
    const ringMat = track(new THREE.MeshBasicMaterial({ color: TEAL_DEEP, transparent: true, opacity: 0.55 }));
    const packetGeo = track(new THREE.BoxGeometry(0.09, 0.09, 0.09));
    const packetMat = track(new THREE.MeshBasicMaterial({ color: TEAL }));

    const makeRing = (packets: number) => {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      const carrier = new THREE.Group();
      for (let i = 0; i < packets; i++) {
        const a = (i / packets) * Math.PI * 2;
        const packet = new THREE.Mesh(packetGeo, packetMat);
        packet.position.set(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS, 0);
        carrier.add(packet);
      }
      ring.add(carrier);
      return { ring, carrier };
    };
    const ringA = makeRing(3);
    ringA.ring.rotation.x = Math.PI / 2.4;
    const ringB = makeRing(4);
    ringB.ring.rotation.set(Math.PI / 3, Math.PI / 4, 0);
    scene.add(ringA.ring, ringB.ring);

    // Particle field
    const small = window.innerWidth < 640;
    const count = small ? 220 : 520;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.4 + Math.random() * 4.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = track(new THREE.BufferGeometry());
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = track(new THREE.PointsMaterial({ color: TEAL, size: 0.035, transparent: true, opacity: 0.7, sizeAttenuation: true }));
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // Sizing
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      baseZ = w / h < 0.8 ? 13 : w / h > 1.6 ? 9 : 10; // pull back on tall boxes, closer on wide strips
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    // Pointer parallax (smoothed)
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;
    let opened = 0; // 0 at the top of the page, 1 once the hero has scrolled away

    const frame = () => {
      const t = clock.getElapsedTime();
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;
      const scrolled = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      opened += (scrolled - opened) * 0.08;

      vault.rotation.y = t * 0.18 + current.x * 0.35 + opened * Math.PI * 0.75;
      vault.rotation.x = t * 0.09 + current.y * 0.25 + opened * 0.4;
      inner.rotation.y = -t * 0.45;
      inner.rotation.z = t * 0.25;
      inner.scale.setScalar(1 + opened * 0.45);
      vault.scale.setScalar(1 + Math.sin(t * 1.4) * 0.03);
      core.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08 + opened * 0.5);
      haloMat.opacity = 0.75 + Math.sin(t * 2.2) * 0.15;

      ringA.ring.rotation.z = t * 0.12;
      ringB.ring.rotation.z = -t * 0.09;
      ringA.carrier.rotation.z = t * 0.5;
      ringB.carrier.rotation.z = -t * 0.38;
      ringA.ring.scale.setScalar(1 + opened * 0.3);
      ringB.ring.scale.setScalar(1.25 + opened * 0.45);

      points.rotation.y = t * 0.025 + opened * 0.6;
      points.rotation.x = t * 0.012;

      camera.position.x = current.x * 0.6;
      camera.position.y = -current.y * 0.4;
      camera.position.z = baseZ - opened * 2.2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    const loop = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      frame();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduceMotion) {
        frame();
        return;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    intersection.observe(mount);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" />;
};

export default HeroScene3D;
