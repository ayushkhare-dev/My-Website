import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useTheme } from "../lib/theme";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export function ThreeHero({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (!supportsWebGL()) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const accent = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || (theme === "dark" ? "#6c5ce7" : "#1769df"));

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 6);
    scene.add(key);
    const point = new THREE.PointLight(accent, 8, 20, 2);
    point.position.set(-3, -1, 3);
    scene.add(point);
    const rim = new THREE.PointLight(0xffffff, 3, 20, 2);
    rim.position.set(2, -3, -4);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      metalness: 0.35,
      roughness: 0.25,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
    });
    const phoneGeo = new RoundedBoxGeometry(1.55, 3.1, 0.16, 6, 0.22);
    const phone = new THREE.Mesh(phoneGeo, bodyMat);
    phone.position.set(0.4, 0.1, 0);
    phone.rotation.set(0.15, -0.35, 0.08);
    group.add(phone);

    const screenMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0f,
      metalness: 0.1,
      roughness: 0.08,
      clearcoat: 1,
      emissive: accent,
      emissiveIntensity: 0.18,
    });
    const screen = new THREE.Mesh(new RoundedBoxGeometry(1.38, 2.9, 0.02, 6, 0.18), screenMat);
    screen.position.set(0.4, 0.1, 0.09);
    screen.rotation.copy(phone.rotation);
    group.add(screen);

    const metalMat = new THREE.MeshPhysicalMaterial({
      color: 0xd7d7d7,
      metalness: 0.9,
      roughness: 0.22,
      clearcoat: 0.4,
    });
    const earbud = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 6, 16), metalMat);
    earbud.position.set(-1.9, -1.1, 1.1);
    earbud.rotation.set(0.4, 0.3, 1.1);
    group.add(earbud);

    const rubberMat = new THREE.MeshPhysicalMaterial({
      color: 0x161616,
      metalness: 0.05,
      roughness: 0.75,
      clearcoat: 0.15,
    });
    const watch = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.15, 0.28, 5, 0.28), rubberMat);
    watch.position.set(1.85, -1.35, -0.6);
    watch.rotation.set(0.3, 0.5, -0.2);
    group.add(watch);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.6,
      ior: 1.4,
      clearcoat: 1,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.045, 32, 128), glassMat);
    ring.position.set(-0.4, 0.3, -2.4);
    ring.rotation.set(1.1, 0.3, 0);
    scene.add(ring);

    const sphereGeo = new THREE.SphereGeometry(1.9, 48, 48);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: accent,
      transmission: 0.95,
      thickness: 1.2,
      roughness: 0.15,
      ior: 1.2,
      transparent: true,
      opacity: 0.14,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(1.4, 1.6, -4);
    scene.add(sphere);

    let targetRX = 0;
    let targetRY = 0;
    let curRX = 0;
    let curRY = 0;
    let scrollT = 0;

    function onMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetRY = nx * 0.35;
      targetRX = ny * -0.22;
    }
    function onScroll() {
      scrollT = Math.min(1, window.scrollY / (window.innerHeight * 1.2));
    }
    if (!reduceMotion) {
      window.addEventListener("mousemove", onMove, { passive: true });
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    function onResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(mount);

    const clock = new THREE.Clock();
    function tick() {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const t = clock.getElapsedTime();

      curRX += (targetRX - curRX) * 0.06;
      curRY += (targetRY - curRY) * 0.06;

      group.rotation.x = curRX + Math.sin(t * 0.25) * 0.03;
      group.rotation.y = 0.1 + curRY + t * (reduceMotion ? 0 : 0.05) - scrollT * 1.6;
      group.position.y = Math.sin(t * 0.6) * 0.12 - scrollT * 0.8;

      earbud.position.y = -1.1 + Math.sin(t * 0.9 + 1) * 0.1;
      watch.position.y = -1.35 + Math.sin(t * 0.7 + 2) * 0.09;

      ring.rotation.z = t * 0.06;
      ring.position.y = 0.3 + Math.sin(t * 0.3) * 0.15 - scrollT * 0.4;

      sphere.position.y = 1.6 + Math.sin(t * 0.35) * 0.2;
      sphere.rotation.y = t * 0.04;

      camera.position.x = curRY * -0.6;
      camera.position.y = curRX * 0.6;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      [phoneGeo, screen.geometry, earbud.geometry, watch.geometry, ring.geometry, sphereGeo].forEach((g) => g.dispose());
      [bodyMat, screenMat, metalMat, rubberMat, glassMat, sphereMat].forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, [theme]);

  return <div ref={mountRef} className={className} aria-hidden />;
}
