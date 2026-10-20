import { useEffect, useRef } from "react";
import * as THREE from "three";

// Decorative 3D scene behind the hero: a wireframe "vault" with two orbiting rings and a drifting
// particle field. It is purely visual (pointer-events: none), pauses when off screen or in a hidden
// tab, renders a single still frame for people who prefer reduced motion, and does nothing if
// WebGL is not available.
const TEAL = 0x2dd4bf;
const TEAL_DEEP = 0x14b8a6;

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
    camera.position.set(0, 0, 9);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // Vault: outer and inner wireframe solids
    const vault = new THREE.Group();
    const outerGeo = track(new THREE.IcosahedronGeometry(1.9, 1));
    const outerMat = track(new THREE.MeshBasicMaterial({ color: TEAL, wireframe: true, transparent: true, opacity: 0.22 }));
    vault.add(new THREE.Mesh(outerGeo, outerMat));
    const innerGeo = track(new THREE.OctahedronGeometry(0.95, 0));
    const innerMat = track(new THREE.MeshBasicMaterial({ color: TEAL, wireframe: true, transparent: true, opacity: 0.55 }));
    const inner = new THREE.Mesh(innerGeo, innerMat);
    vault.add(inner);
    scene.add(vault);

    // Orbiting rings
    const ringGeo = track(new THREE.TorusGeometry(2.9, 0.012, 8, 200));
    const ringMat = track(new THREE.MeshBasicMaterial({ color: TEAL_DEEP, transparent: true, opacity: 0.55 }));
    const ringA = new THREE.Mesh(ringGeo, ringMat);
    ringA.rotation.x = Math.PI / 2.4;
    const ringB = new THREE.Mesh(ringGeo, ringMat);
    ringB.rotation.set(Math.PI / 3, Math.PI / 4, 0);
    ringB.scale.setScalar(1.25);
    scene.add(ringA, ringB);

    // Particle field
    const small = window.innerWidth < 640;
    const count = small ? 260 : 620;
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
      camera.position.z = w / h < 0.8 ? 14 : 11; // pull back on tall (phone) screens
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

    const frame = () => {
      const t = clock.getElapsedTime();
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      vault.rotation.y = t * 0.18 + current.x * 0.35;
      vault.rotation.x = t * 0.09 + current.y * 0.25;
      inner.rotation.y = -t * 0.45;
      inner.rotation.z = t * 0.25;
      ringA.rotation.z = t * 0.12;
      ringB.rotation.z = -t * 0.09;
      points.rotation.y = t * 0.025;
      points.rotation.x = t * 0.012;
      const pulse = 1 + Math.sin(t * 1.4) * 0.03;
      vault.scale.setScalar(pulse);

      camera.position.x = current.x * 0.6;
      camera.position.y = -current.y * 0.4;
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

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-70" />;
};

export default HeroScene3D;
