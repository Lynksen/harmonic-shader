import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

document.addEventListener("DOMContentLoaded", () => {
    // create gui
    const gui = new GUI();
    // create URLSearchParams object
    const guiObject = {
        timeSpeed: 0.01,
        order: 2,
        degree: 4,
        lineWidth: 1.9,
        lineCount: 24,
        lineMultiplier: 15,
        color2: "#000",
        color1: "transparent",
        easing: "linear",
        cameraType: "PerspectiveCamera",
        radius: 1.2,
        rotation: Math.PI / 2,
        offsetX: 0,
        offsetY: 0,
    };
    // create basic scene
    let camera = null;
    const scene = new THREE.Scene();
    if (guiObject.cameraType === "OrthographicCamera") {
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.OrthographicCamera(-2 * aspect, 2 * aspect, 2, -2, 0.1, 1000);
    }
    if (guiObject.cameraType === "PerspectiveCamera") {
        camera = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, 0.1, 1000);
    }
    const canvas = document.querySelector("#canvas");
    camera.position.z = 7.16;
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: canvas,
    });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(new THREE.Color("transparent"));

    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    const fxaaPass = new ShaderPass(FXAAShader);
    const outputPass = new OutputPass();
    const composer = new EffectComposer(renderer);
    composer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const pixelRatio = window.devicePixelRatio;
    fxaaPass.material.uniforms["resolution"].value.x =
        1 / (renderer.domElement.offsetWidth * pixelRatio);
    fxaaPass.material.uniforms["resolution"].value.y =
        1 / (renderer.domElement.offsetHeight * pixelRatio);

    fxaaPass.renderToScreen = true;
    composer.addPass(renderPass);
    composer.addPass(fxaaPass);
    composer.addPass(outputPass);

    // add orbit controls
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;

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
    // controls.enabled = false;

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
    // add circlular outline for sphere
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(guiObject.color2),
        side: THREE.BackSide,
    });
    const outlineGeometry = new THREE.SphereGeometry(2, 64, 64);
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outline.scale.set(1.0075, 1.0075, 1.0075);
    // scene.add(outline);

    // resize handling
    window.addEventListener(
        "resize",
        () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            // update uniforms
            plane.material.uniforms.uResolution.value = new THREE.Vector2(
                window.innerWidth,
                window.innerHeight
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
                camera.aspect = window.innerWidth / window.innerHeight;
            }
            camera.updateProjectionMatrix();
        },
        false
    );

    // add gui
    gui.add(guiObject, "timeSpeed", 0.001, 0.05).onChange(value => {
        guiObject.timeSpeed = value;
        plane.material.uniforms.uTime.value = 0;
    });
    gui.add(guiObject, "order", 1, 10)
        .step(1)
        .onChange(value => {
            plane.material.uniforms.uOrder.value = value;
        });
    gui.add(guiObject, "lineWidth", 0.001, 5).onChange(value => {
        plane.material.uniforms.uLineWidth.value = value;
        outline.scale.set(1 + value * 0.006, 1 + value * 0.006, 1 + value * 0.006);
    });
    gui.add(guiObject, "degree", 1, 10)
        .step(1)
        .onChange(value => {
            plane.material.uniforms.uDegree.value = value;
        });
    gui.add(guiObject, "lineCount", 1, 100)
        .step(1)
        .onChange(value => {
            plane.material.uniforms.uLineCount.value = value;
        });
    gui.addColor(guiObject, "color1").onChange(value => {
        plane.material.uniforms.uColor1.value = new THREE.Color(value);
    });
    gui.addColor(guiObject, "color2").onChange(value => {
        plane.material.uniforms.uColor2.value = new THREE.Color(value);
        outlineMaterial.color = new THREE.Color(value);
    });
    // add select with easing functions
    gui.add(guiObject, "easing", ["linear", "sineIn"]).onChange(value => {
        let easing = 1;
        if (value === "linear") easing = 0;
        if (value === "sineIn") easing = 4;

        plane.material.uniforms.uEasing.value = easing;
    });
    gui.add(guiObject, "radius", 0.1, 5).onChange(value => {
        plane.material.uniforms.uRadius.value = value;
    });
    gui.add(guiObject, "rotation", 0, Math.PI * 2).onChange(value => {
        plane.material.uniforms.uRotation.value = value;
    });
    gui.add(guiObject, "offsetX", 0, 100)
        .step(0.01)
        .onChange(value => {
            plane.material.uniforms.uOffsetX.value = value;
        });
    gui.add(guiObject, "offsetY", -100, 100).onChange(value => {
        plane.material.uniforms.uOffsetY.value = value;
    });
    // camera type
    gui.add(guiObject, "cameraType", ["PerspectiveCamera", "OrthographicCamera"]).onChange(
        value => {
            if (value === "PerspectiveCamera") {
                camera = new THREE.PerspectiveCamera(
                    53,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000
                );
                camera.position.z = 6;
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                controls.dispose();
                controls = new OrbitControls(camera, renderer.domElement);
                renderPass.camera = camera;
            } else {
                const aspect = window.innerWidth / window.innerHeight;
                camera = new THREE.OrthographicCamera(-2 * aspect, 2 * aspect, 2, -2, 0.1, 1000);
                camera.position.z = 6;
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                controls.dispose();
                controls = new OrbitControls(camera, renderer.domElement);
                renderPass.camera = camera;
            }
        }
    );
    // camera fov
    if (camera instanceof THREE.PerspectiveCamera)
        gui.add(camera, "fov", 0, 180)
            .name("Camera FOV")
            .onChange(() => {
                camera.updateProjectionMatrix();
            });

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
