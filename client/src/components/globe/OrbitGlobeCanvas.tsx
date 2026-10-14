import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitObject, TrackingStation, ConjunctionEvent } from '../../types/index.js';
import { EarthShaderMaterial } from './EarthShader.js';
import { getCartesianPosition, generateOrbitPathPoints, latLonToVector3 } from '../../utils/orbitalPropagation.js';

interface OrbitGlobeProps {
  objects: OrbitObject[];
  stations?: TrackingStation[];
  conjunctions?: ConjunctionEvent[];
  selectedObject: OrbitObject | null;
  selectedStation?: TrackingStation | null;
  onSelectObject: (obj: OrbitObject | null) => void;
  onSelectStation?: (st: TrackingStation | null) => void;
  showSatellites?: boolean;
  showDebris?: boolean;
  showStations?: boolean;
  showConjunctions?: boolean;
  timeScale?: number;
  isPaused?: boolean;
  onObjectHover?: (obj: OrbitObject | null, mousePos: { x: number; y: number } | null) => void;
  onStationHover?: (st: TrackingStation | null, mousePos: { x: number; y: number } | null) => void;
}

export const OrbitGlobeCanvas: React.FC<OrbitGlobeProps> = ({
  objects,
  stations = [],
  conjunctions = [],
  selectedObject,
  selectedStation,
  onSelectObject,
  onSelectStation,
  showSatellites = true,
  showDebris = true,
  showStations = true,
  showConjunctions = true,
  timeScale = 1,
  isPaused = false,
  onObjectHover,
  onStationHover
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const simTimeRef = useRef<number>(Date.now());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Filtered objects
  const visibleObjects = useMemo(() => {
    return objects.filter((o) => {
      if (o.type === 'SATELLITE' && !showSatellites) return false;
      if (o.type === 'DEBRIS' && !showDebris) return false;
      return true;
    });
  }, [objects, showSatellites, showDebris]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3.6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Full 3D OrbitControls (Rotate, Drag/Pan Up-Down, Zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.minDistance = 1.2;
    controls.maxDistance = 18.0;
    controls.rotateSpeed = 0.8;
    controls.panSpeed = 0.9;
    controlsRef.current = controls;

    // 3. Subtle Starfield
    const starCount = 2200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 250 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xcccccc, size: 1.1, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 4. Earth Globe (Tactical Dark Shader)
    const earthGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const earthMat = new THREE.ShaderMaterial({
      vertexShader: EarthShaderMaterial.vertexShader,
      fragmentShader: EarthShaderMaterial.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(EarthShaderMaterial.uniforms)
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Subtle atmospheric rim
    const atmosGeo = new THREE.SphereGeometry(1.025, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.55 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.85, 0.47, 0.05, 1.0) * intensity * 0.55;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosphere);

    // 5. Ground Stations with Interactive Hit Targets
    const stationGroup = new THREE.Group();
    scene.add(stationGroup);

    stations.forEach((st) => {
      const [sx, sy, sz] = latLonToVector3(st.Latitude, st.Longitude, 1.002);
      const isStSelected = selectedStation?.Station_ID === st.Station_ID;

      // Visible Pin Marker
      const dotGeo = new THREE.SphereGeometry(isStSelected ? 0.022 : 0.016, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: isStSelected ? 0xdc2626 : 0xd97706 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(sx, sy, sz);
      dot.userData = { station: st, type: 'STATION' };

      // Surrounding Ring for high visibility
      const ringGeo = new THREE.RingGeometry(0.022, 0.03, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isStSelected ? 0xdc2626 : 0xd97706,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(sx * 1.003, sy * 1.003, sz * 1.003);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(sx, sy, sz).normalize());
      ring.userData = { station: st, type: 'STATION' };

      // Radar field cone
      const coneGeo = new THREE.ConeGeometry(0.08, 0.25, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: isStSelected ? 0xdc2626 : 0xd97706,
        transparent: true,
        opacity: 0.18,
        wireframe: true
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(sx * 1.12, sy * 1.12, sz * 1.12);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(sx, sy, sz).normalize());
      cone.userData = { station: st, type: 'STATION' };

      // Larger invisible Click Hit Target (easier to tap/click)
      const hitGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.set(sx, sy, sz);
      hitMesh.userData = { station: st, type: 'STATION' };

      stationGroup.add(dot);
      stationGroup.add(ring);
      stationGroup.add(cone);
      stationGroup.add(hitMesh);
    });

    // 6. Selected Orbit Line
    const pathMat = new THREE.LineBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.85, linewidth: 2 });
    let orbitLine: THREE.Line | null = null;

    // 7. Conjunction Lines Group
    const conjunctionGroup = new THREE.Group();
    scene.add(conjunctionGroup);

    // 8. GPU Instanced Points for Space Objects
    const maxObjects = 5000;
    const pointsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxObjects * 3);
    const colors = new Float32Array(maxObjects * 3);
    const sizes = new Float32Array(maxObjects);

    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pointsGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const pointsMat = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (290.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.08, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    });

    const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
    scene.add(pointsMesh);

    // Raycasting for object and station hover/click
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.055 };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      // 1. First test Ground Stations
      if (showStations && onStationHover) {
        const stationIntersects = raycaster.intersectObjects(stationGroup.children, true);
        if (stationIntersects.length > 0) {
          const hit = stationIntersects.find((i) => i.object.userData?.station);
          if (hit) {
            onStationHover(hit.object.userData.station, { x: e.clientX, y: e.clientY });
            if (onObjectHover) onObjectHover(null, null);
            return;
          }
        }
        onStationHover(null, null);
      }

      // 2. Test space objects
      if (onObjectHover) {
        const intersects = raycaster.intersectObject(pointsMesh);
        if (intersects.length > 0 && intersects[0].index !== undefined) {
          const idx = intersects[0].index;
          if (idx < visibleObjects.length) {
            onObjectHover(visibleObjects[idx], { x: e.clientX, y: e.clientY });
            return;
          }
        }
        onObjectHover(null, null);
      }
    };

    const onPointerClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      // 1. Check Ground Stations first
      if (showStations && onSelectStation) {
        const stationIntersects = raycaster.intersectObjects(stationGroup.children, true);
        if (stationIntersects.length > 0) {
          const hit = stationIntersects.find((i) => i.object.userData?.station);
          if (hit) {
            onSelectStation(hit.object.userData.station);
            return;
          }
        }
      }

      // 2. Check Space Objects
      const intersects = raycaster.intersectObject(pointsMesh);
      if (intersects.length > 0 && intersects[0].index !== undefined) {
        const idx = intersects[0].index;
        if (idx < visibleObjects.length) {
          onSelectObject(visibleObjects[idx]);
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onPointerClick);

    // Animation Loop
    let animId: number;
    let lastTimestamp = performance.now();

    const animate = (timestamp: number) => {
      animId = requestAnimationFrame(animate);

      const dt = (timestamp - lastTimestamp) / 1000.0;
      lastTimestamp = timestamp;

      if (!isPaused) {
        simTimeRef.current += dt * 1000.0 * timeScale;
      }

      controls.update();

      earth.rotation.y += 0.00025;
      atmosphere.rotation.y += 0.00025;
      stationGroup.rotation.y = earth.rotation.y;

      const currentSimTime = simTimeRef.current;
      const posAttr = pointsGeo.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = pointsGeo.getAttribute('color') as THREE.BufferAttribute;
      const sizeAttr = pointsGeo.getAttribute('size') as THREE.BufferAttribute;

      const posArr = posAttr.array as Float32Array;
      const colArr = colAttr.array as Float32Array;
      const sizeArr = sizeAttr.array as Float32Array;

      const activeCount = Math.min(visibleObjects.length, maxObjects);

      for (let i = 0; i < activeCount; i++) {
        const obj = visibleObjects[i];
        const p = getCartesianPosition(obj, currentSimTime);

        posArr[i * 3] = p.x;
        posArr[i * 3 + 1] = p.y;
        posArr[i * 3 + 2] = p.z;

        if (selectedObject && obj.id === selectedObject.id && obj.type === selectedObject.type) {
          colArr[i * 3] = 1.0;
          colArr[i * 3 + 1] = 1.0;
          colArr[i * 3 + 2] = 0.4;
          sizeArr[i] = 0.095;
        } else if (obj.type === 'SATELLITE') {
          colArr[i * 3] = 0.85;
          colArr[i * 3 + 1] = 0.47;
          colArr[i * 3 + 2] = 0.05;
          sizeArr[i] = 0.045;
        } else {
          colArr[i * 3] = 0.86;
          colArr[i * 3 + 1] = 0.15;
          colArr[i * 3 + 2] = 0.15;
          sizeArr[i] = obj.rcs_size_class === 'LARGE' ? 0.04 : 0.026;
        }
      }

      for (let i = activeCount; i < maxObjects; i++) {
        posArr[i * 3] = 0;
        posArr[i * 3 + 1] = 0;
        posArr[i * 3 + 2] = 0;
        sizeArr[i] = 0;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;

      // Draw orbit path for selected object
      if (selectedObject) {
        if (!orbitLine) {
          const pts = generateOrbitPathPoints(selectedObject).map((p) => new THREE.Vector3(p[0], p[1], p[2]));
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          orbitLine = new THREE.Line(lineGeo, pathMat);
          scene.add(orbitLine);
        }
      } else if (orbitLine) {
        scene.remove(orbitLine);
        orbitLine.geometry.dispose();
        orbitLine = null;
      }

      // Draw conjunction lines
      while (conjunctionGroup.children.length > 0) {
        const cChild = conjunctionGroup.children[0] as THREE.Line;
        conjunctionGroup.remove(cChild);
        cChild.geometry.dispose();
      }

      if (showConjunctions && conjunctions.length > 0) {
        conjunctions.slice(0, 15).forEach((c) => {
          const satObj = visibleObjects.find((o) => o.NORAD_ID === c.Sat_NORAD_ID);
          const debObj = visibleObjects.find((o) => o.NORAD_ID === c.Debris_NORAD_ID);
          if (satObj && debObj) {
            const p1 = getCartesianPosition(satObj, currentSimTime);
            const p2 = getCartesianPosition(debObj, currentSimTime);

            const linePts = [new THREE.Vector3(p1.x, p1.y, p1.z), new THREE.Vector3(p2.x, p2.y, p2.z)];
            const cGeo = new THREE.BufferGeometry().setFromPoints(linePts);
            const cMat = new THREE.LineBasicMaterial({
              color: 0xdc2626,
              transparent: true,
              opacity: 0.85
            });
            const cLine = new THREE.Line(cGeo, cMat);
            conjunctionGroup.add(cLine);
          }
        });
      }

      stationGroup.visible = showStations;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      controls.dispose();
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onPointerClick);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [visibleObjects, stations, conjunctions, showStations, showConjunctions, timeScale, isPaused, selectedObject, selectedStation]);

  // Smooth camera refocus on selected station
  useEffect(() => {
    if (selectedStation && cameraRef.current && controlsRef.current) {
      const [sx, sy, sz] = latLonToVector3(selectedStation.Latitude, selectedStation.Longitude, 1.0);
      const camPos = new THREE.Vector3(sx, sy, sz).normalize().multiplyScalar(2.3);
      cameraRef.current.position.set(camPos.x, camPos.y, camPos.z);
      controlsRef.current.target.set(0, 0, 0);
    }
  }, [selectedStation]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
      title="Left click: Rotate 3D • Right click / Touch Drag: Move/Pan Up-Down • Scroll: Zoom"
    />
  );
};
