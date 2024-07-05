import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector("#canvas");
    const guiObject = {
        timeSpeed: 0.0042,
        order: 2,
        degree: 4,
        lineWidth: 1,
        lineCount: 23,
        lineMultiplier: 15,
        color2: "#000",
        color1: "#f8f6f3",
        easing: "linear",
        cameraType: "PerspectiveCamera",
        radius: 0.8,
        rotation: Math.PI / 2,
        offsetX: 0,
        offsetY: -79.4,
        enableMouse: 0,
        cameraFov: 63,
    };
    // create basic scene
    let camera = null;
    const scene = new THREE.Scene();
    if (guiObject.cameraType === "OrthographicCamera") {
        const aspect = canvas.offsetWidth / canvas.offsetHeight;
        camera = new THREE.OrthographicCamera(-2 * aspect, 2 * aspect, 2, -2, 0.1, 1000);
    }
    if (guiObject.cameraType === "PerspectiveCamera") {
        camera = new THREE.PerspectiveCamera(
            guiObject.cameraFov,
            canvas.offsetWidth / canvas.offsetHeight,
            0.1,
            1000
        );
    }
    camera.position.z = 3.16;
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: canvas,
    });
    renderer.setSize(canvas.offsetHeight, canvas.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(new THREE.Color("transparent"));

    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    const fxaaPass = new ShaderPass(FXAAShader);
    const outputPass = new OutputPass();
    const composer = new EffectComposer(renderer);
    composer.setSize(canvas.offsetHeight, canvas.offsetHeight);

    const pixelRatio = window.devicePixelRatio;
    fxaaPass.material.uniforms["resolution"].value.x =
        1 / (renderer.domElement.offsetHeight * pixelRatio);
    fxaaPass.material.uniforms["resolution"].value.y =
        1 / (renderer.domElement.offsetHeight * pixelRatio);

    fxaaPass.renderToScreen = true;
    composer.addPass(renderPass);
    composer.addPass(fxaaPass);
    composer.addPass(outputPass);

    // add orbit controls
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.enableRotate = false;

    const setPolar = 1.5653380737681526;
    const setAzimuth = 0.002202166870058767;
    const orig = [
        controls.minPolarAngle,
        controls.maxPolarAngle,
        controls.minAzimuthAngle,
        controls.maxAzimuthAngle,
    ];

    controls.minPolarAngle = setPolar;
    controls.maxPolarAngle = setPolar;
    controls.minAzimuthAngle = setAzimuth;
    controls.maxAzimuthAngle = setAzimuth;
    controls.update();

    controls.minPolarAngle = orig[0];
    controls.maxPolarAngle = orig[1];
    controls.minAzimuthAngle = orig[2];
    controls.maxAzimuthAngle = orig[3];
    controls.update();
    controls.enabled = false;

    const loader = new THREE.TextureLoader();
    const shText = loader.load("/sh03.png");
    // add object
    const vs = document.getElementById("vertexShader").textContent;
    const fs = document.getElementById("fragmentShader").textContent;

    const material = new CustomShaderMaterial({
        baseMaterial: THREE.MeshBasicMaterial,
        vertexShader: vs,
        fragmentShader: fs,
        transparent: true,
        silent: true, // Disables the default warning if true
        color: new THREE.Color("transparent"),
        uniforms: {
            uTime: new THREE.Uniform(0),
            uResolution: new THREE.Uniform(
                new THREE.Vector2(window.innerWidth, window.innerHeight)
            ),
            uMouse: new THREE.Uniform(new THREE.Vector2(0, 0)),
            uTexture: new THREE.Uniform(shText),
            uOrder: new THREE.Uniform(guiObject.order),
            uDegree: new THREE.Uniform(guiObject.degree),
            uLineWidth: new THREE.Uniform(guiObject.lineWidth),
            uLineCount: new THREE.Uniform(guiObject.lineCount),
            uLineMultiplier: new THREE.Uniform(guiObject.lineMultiplier),
            uColor1: new THREE.Uniform(new THREE.Color(guiObject.color1)),
            uColor2: new THREE.Uniform(new THREE.Color(guiObject.color2)),
            uEasing: new THREE.Uniform(guiObject.easing),
            uRotation: new THREE.Uniform(guiObject.rotation),
            uRadius: new THREE.Uniform(guiObject.radius),
            uOffsetX: new THREE.Uniform(guiObject.offsetX),
            uOffsetY: new THREE.Uniform(guiObject.offsetY),
            uEnableMouse: new THREE.Uniform(guiObject.enableMouse),
        },
        side: THREE.DoubleSide,
    });
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const plane = new THREE.Mesh(geometry, material);
    plane.castShadow = false;
    // scale geometry to make it flat circle
    plane.scale.set(1, 1, 0.01);
    scene.add(plane);
    camera.lookAt(plane.position);

    // resize handling
    window.addEventListener(
        "resize",
        () => {
            renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);
            // update uniforms
            plane.material.uniforms.uResolution.value = new THREE.Vector2(
                canvas.offsetWidth,
                canvas.offsetHeight
            );
            if (camera instanceof THREE.OrthographicCamera) {
                // set aspect ratio for orthographic camera
                const aspect = window.innerWidth / window.innerHeight;
                camera.left = -2 * aspect;
                camera.right = 2 * aspect;
                camera.top = 2;
                camera.bottom = -2;
            }
            if (camera instanceof THREE.PerspectiveCamera) {
                camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
            }
            camera.updateProjectionMatrix();
        },
        false
    );

    const mouseVec = new THREE.Vector2();
    const basePos = 0;

    const cursorElem = document.querySelector("#cursor");

    // handle mouse move
    window.addEventListener(
        "mousemove",
        event => {
            const x = event.clientX;
            const y = event.clientY;
            const rect = canvas.getBoundingClientRect();
            const x1 = ((x - rect.left) / rect.width) * 2 - 1;
            const y1 = -((y - rect.top) / rect.height) * 2 + 1;

            if (cursorElem) {
                cursorElem.style.left = `${x}px`;
                cursorElem.style.top = `${y}px`;
            }

            mouseVec.x = THREE.MathUtils.lerp(x1, basePos, 0.002);
            mouseVec.y = THREE.MathUtils.lerp(y1, basePos, 0.002);
        },
        false
    );

    // return mouse to center rafer mouse leave
    const force = () => {
        const rafPos = mouseVec;
        rafPos.x = THREE.MathUtils.lerp(rafPos.x, basePos, 0.001);
        rafPos.y = THREE.MathUtils.lerp(rafPos.y, basePos, 0.001);

        plane.material.uniforms.uMouse.value = rafPos;
        window.requestAnimationFrame(force);
    };
    window.requestAnimationFrame(force);

    const render = () => {
        requestAnimationFrame(render);
        // update controls
        controls.update();
        // update uniforms
        plane.material.uniforms.uTime.value += guiObject.timeSpeed;
        // log azimuthal angle and polar angle

        composer.render();
    };

    render();
});
