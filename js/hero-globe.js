/**
 * Hero globe — simple dot sphere, desktop only.
 */
(function () {
    const DESKTOP_MQ = window.matchMedia('(min-width: 901px)');
    const LAND_MASK_SRC = 'assets/globe-land-mask.jpg';
    const GLOBE_RADIUS = 1.35;

    const canvas = document.getElementById('hero-globe-canvas');
    const container = document.getElementById('hero-globe-wrap');
    if (!canvas || !container) return;

    let renderer = null;
    let scene = null;
    let camera = null;
    let globe = null;
    let rafId = null;
    let resizeObserver = null;
    let themeObserver = null;
    let rotY = 0;
    let pointerTarget = { x: 0, y: 0 };
    let pointerCurrent = { x: 0, y: 0 };
    let hoverBlend = 0;
    let hoverTarget = 0;
    let lastTime = 0;
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function getColors() {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            line: dark ? 0xf5f0e8 : 0xc4622d,
            land: dark ? 0xf5f0e8 : 0xc4622d,
            ocean: dark ? 0x2a2725 : 0xe8e0d4,
            lineOpacity: dark ? 0.12 : 0.18,
            landOpacity: dark ? 0.7 : 0.82,
            oceanOpacity: dark ? 0.28 : 0.45
        };
    }

    function latLonToVec3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    function sparseLandFallback(radius) {
        const land = [];
        const count = 900;
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2;
            const r = Math.sqrt(Math.max(0, 1 - y * y));
            const theta = golden * i;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            const lat = Math.asin(y) * (180 / Math.PI);
            const lon = Math.atan2(z, x) * (180 / Math.PI);
            if (Math.abs(lat) < 70 && (Math.abs(lon) < 50 || Math.abs(lon) > 100)) {
                land.push(x * radius, y * radius, z * radius);
            }
        }
        return land;
    }

    function makePoints(flatPositions, color, opacity, size) {
        if (!flatPositions.length) return null;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(flatPositions, 3));
        return new THREE.Points(
            geo,
            new THREE.PointsMaterial({
                color,
                size,
                transparent: true,
                opacity,
                sizeAttenuation: true,
                depthWrite: false
            })
        );
    }

    function addSimpleGraticule(group, radius, colors) {
        const lineMat = new THREE.LineBasicMaterial({
            color: colors.line,
            transparent: true,
            opacity: colors.lineOpacity
        });
        for (let lat = -60; lat <= 60; lat += 30) {
            const pts = [];
            for (let lon = -180; lon <= 180; lon += 12) {
                pts.push(latLonToVec3(lat, lon, radius));
            }
            group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
        }
        for (let lon = -180; lon < 180; lon += 45) {
            const pts = [];
            for (let lat = -85; lat <= 85; lat += 12) {
                pts.push(latLonToVec3(lat, lon, radius));
            }
            group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
        }
    }

    function buildGlobe(radius, landPositions) {
        const group = new THREE.Group();
        const colors = getColors();

        const oceanMesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius * 0.998, 40, 40),
            new THREE.MeshPhongMaterial({
                color: colors.ocean,
                transparent: true,
                opacity: colors.oceanOpacity,
                shininess: 6
            })
        );
        group.add(oceanMesh);

        const landPts = makePoints(landPositions, colors.land, colors.landOpacity, 0.042);
        if (landPts) {
            landPts.name = 'landPoints';
            group.add(landPts);
        }

        addSimpleGraticule(group, radius * 1.002, colors);

        group.userData.oceanMesh = oceanMesh;
        group.userData.landPoints = landPts;
        return group;
    }

    function sampleLandFromImage(radius) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const w = 240;
                    const h = 120;
                    const off = document.createElement('canvas');
                    off.width = w;
                    off.height = h;
                    const ctx = off.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const data = ctx.getImageData(0, 0, w, h).data;
                    const land = [];
                    for (let y = 0; y < h; y += 1) {
                        for (let x = 0; x < w; x += 1) {
                            const i = (y * w + x) * 4;
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const lat = 90 - (y / (h - 1)) * 180;
                            const lon = (x / (w - 1)) * 360 - 180;
                            const isOcean = b > r + 16 && b > g + 8;
                            if (!isOcean && (x + y) % 3 === 0) {
                                const v = latLonToVec3(lat, lon, radius);
                                land.push(v.x, v.y, v.z);
                            }
                        }
                    }
                    resolve(land.length ? land : sparseLandFallback(radius));
                } catch {
                    resolve(sparseLandFallback(radius));
                }
            };
            img.onerror = () => resolve(sparseLandFallback(radius));
            img.src = LAND_MASK_SRC;
        });
    }

    function updateGlobeColors() {
        if (!globe) return;
        const colors = getColors();
        globe.traverse((obj) => {
            if (obj.isLine && obj.material) {
                obj.material.color.setHex(colors.line);
                obj.material.opacity = colors.lineOpacity;
            }
            if (obj.name === 'landPoints' && obj.material) {
                obj.material.color.setHex(colors.land);
                obj.material.opacity = colors.landOpacity;
            }
            if (obj === globe.userData.oceanMesh && obj.material) {
                obj.material.color.setHex(colors.ocean);
                obj.material.opacity = colors.oceanOpacity;
            }
        });
    }

    function resize() {
        if (!renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w < 8 || h < 8) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    function onPointerMove(e) {
        const rect = container.getBoundingClientRect();
        pointerTarget.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        pointerTarget.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    function onPointerLeave() {
        pointerTarget.x = 0;
        pointerTarget.y = 0;
        container.classList.remove('is-hovered');
        hoverTarget = 0;
    }

    function onPointerEnter() {
        container.classList.add('is-hovered');
        hoverTarget = 1;
    }

    function animate(now) {
        if (!globe || !renderer || !scene || !camera) return;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        hoverBlend += (hoverTarget - hoverBlend) * 0.06;
        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.05;
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.05;

        if (!reducedMotion) {
            rotY += dt * (0.22 + hoverBlend * 0.06);
            globe.rotation.y = rotY + pointerCurrent.x * 0.06;
            globe.rotation.x = pointerCurrent.y * 0.05;
        }

        renderer.render(scene, camera);
        rafId = requestAnimationFrame(animate);
    }

    function dispose() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        rotY = 0;
        hoverBlend = 0;
        hoverTarget = 0;
        pointerTarget.x = pointerTarget.y = 0;
        pointerCurrent.x = pointerCurrent.y = 0;
        container.classList.remove('is-ready', 'is-hovered');
        container.removeEventListener('mouseenter', onPointerEnter);
        container.removeEventListener('mouseleave', onPointerLeave);
        container.removeEventListener('mousemove', onPointerMove);
        resizeObserver?.disconnect();
        themeObserver?.disconnect();
        resizeObserver = null;
        themeObserver = null;
        if (globe) {
            globe.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
                    else obj.material.dispose();
                }
            });
        }
        globe = null;
        if (renderer) renderer.dispose();
        renderer = null;
        scene = null;
        camera = null;
    }

    function waitForThree(maxMs) {
        return new Promise((resolve, reject) => {
            if (typeof THREE !== 'undefined') return resolve();
            const start = Date.now();
            const tick = () => {
                if (typeof THREE !== 'undefined') resolve();
                else if (Date.now() - start > maxMs) reject(new Error('Three.js did not load'));
                else requestAnimationFrame(tick);
            };
            tick();
        });
    }

    async function init() {
        if (!DESKTOP_MQ.matches || renderer) return;
        try {
            await waitForThree(8000);
        } catch (err) {
            console.warn('[hero-globe]', err.message);
            return;
        }

        const land = sparseLandFallback(GLOBE_RADIUS);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(0, 0.22, 4.85);
        camera.lookAt(0, -0.12, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const key = new THREE.DirectionalLight(0xffffff, 0.75);
        key.position.set(4, 2, 6);
        scene.add(key);

        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);

        globe = buildGlobe(GLOBE_RADIUS, land);
        globe.position.y = -0.18;
        scene.add(globe);

        requestAnimationFrame(() => {
            resize();
            container.classList.add('is-ready');
            container.removeAttribute('aria-hidden');
        });

        container.addEventListener('mouseenter', onPointerEnter);
        container.addEventListener('mouseleave', onPointerLeave);
        container.addEventListener('mousemove', onPointerMove, { passive: true });

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        themeObserver = new MutationObserver(updateGlobeColors);
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        lastTime = performance.now();
        animate(lastTime);

        sampleLandFromImage(GLOBE_RADIUS).then((landData) => {
            if (!globe) return;
            const old = globe.userData.landPoints;
            if (old) {
                globe.remove(old);
                old.geometry?.dispose();
                old.material?.dispose();
            }
            const landPts = makePoints(landData, getColors().land, getColors().landOpacity, 0.042);
            if (landPts) {
                landPts.name = 'landPoints';
                globe.add(landPts);
                globe.userData.landPoints = landPts;
            }
        });
    }

    DESKTOP_MQ.addEventListener('change', (e) => {
        if (e.matches) init();
        else dispose();
    });

    function boot() {
        init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.addEventListener('load', () => {
        if (DESKTOP_MQ.matches && !container.classList.contains('is-ready')) init();
        else resize();
    });
})();
