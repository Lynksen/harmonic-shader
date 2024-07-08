import * as THREE from "three";
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
    color1: "#f8f6f3",
    color2: "#000",
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
  camera = new THREE.PerspectiveCamera(
    guiObject.cameraFov,
    canvas.offsetWidth / canvas.offsetHeight,
    0.1,
    1000
  );
  camera.position.z = 3.3;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas: canvas,
  });
  renderer.setSize(canvas.offsetHeight, canvas.offsetHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(new THREE.Color(guiObject.color1));

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

  const loader = new THREE.TextureLoader();
  const shText = loader.load("/sh03.png");
  // add object
  const vs = document.getElementById("vertexShader").textContent;
  const fs = document.getElementById("fragmentShader").textContent;

  const material = new CustomShaderMaterial({
    baseMaterial: THREE.MeshBasicMaterial,
    vertexShader: vs,
    fragmentShader: fs,
    silent: true, // Disables the default warning if true
    color: new THREE.Color(guiObject.color1),
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
    side: THREE.FrontSide,
  });
  const geometry = new THREE.SphereGeometry(2, 64, 64);

  const plane = new THREE.Mesh(geometry, material);
  plane.castShadow = false;
  // scale geometry to make it flat circle
  plane.scale.set(1, 1, 0.01);
  scene.add(plane);
  camera.lookAt(plane.position);

  // create donat geometry
  const donatGeometry = new THREE.TorusGeometry(2.5, 0.5, 16, 100);
  const donatMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(guiObject.color1),
    depthTest: false,
  });
  const donat = new THREE.Mesh(donatGeometry, donatMaterial);

  donat.position.set(0, 0, 0);
  scene.add(donat);

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
      camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
      camera.updateProjectionMatrix();
    },
    false
  );

  const render = () => {
    requestAnimationFrame(render);
    // update uniforms
    if (plane.material.uniforms)
      plane.material.uniforms.uTime.value += guiObject.timeSpeed;
    // log azimuthal angle and polar angle

    composer.render();
  };

  render();
});
