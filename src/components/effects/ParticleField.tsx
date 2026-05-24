import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Lightweight Three.js orbiting particle field, fixed behind app content.
 * Two glowing orbs + a swirl of small points. Pointer parallax via GSAP-style
 * easing implemented inline to avoid an extra dependency surface.
 */
export function ParticleField() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (typeof window === "undefined") return;

    const width = () => mount.clientWidth;
    const height = () => mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width() / height(), 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Particle swirl
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const a = new THREE.Color("#3aa0c8");
    const b = new THREE.Color("#7cd6c1");
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = a.clone().lerp(b, Math.random());
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geom, mat);
    scene.add(points);

    // Glow orbs
    const orbGeom = new THREE.SphereGeometry(0.55, 32, 32);
    const orb1 = new THREE.Mesh(
      orbGeom,
      new THREE.MeshBasicMaterial({
        color: 0x4fb3d9,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      }),
    );
    const orb2 = new THREE.Mesh(
      orbGeom,
      new THREE.MeshBasicMaterial({
        color: 0x9b7cd6,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(orb1, orb2);

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
      target.y = (e.clientY / window.innerHeight - 0.5) * 0.6;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
      renderer.setSize(width(), height());
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;
      points.rotation.y += 0.0012;
      points.rotation.x = current.y * 0.4;
      points.rotation.z = current.x * 0.2;
      const t = frame * 0.01;
      orb1.position.set(Math.cos(t) * 4, Math.sin(t * 0.8) * 1.5, Math.sin(t) * 2);
      orb2.position.set(
        Math.cos(t * 0.7 + 2) * 3.5,
        Math.sin(t * 1.2 + 1) * 1.8,
        Math.cos(t * 0.5) * 2,
      );
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geom.dispose();
      mat.dispose();
      orbGeom.dispose();
      (orb1.material as THREE.Material).dispose();
      (orb2.material as THREE.Material).dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-70"
    />
  );
}
