import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";

document.addEventListener("DOMContentLoaded", () => {
  // create gui
  const gui = new GUI();
  // create URLSearchParams object
  const query = new URLSearchParams(window.location.search);
  const guiObject = {
    timeSpeed: 0.01,
    order: 2,
    degree: 4,
    lineWidth: 1.6,
    lineCount: 24,
    lineMultiplier: 15,
    color2: "#000",
    color1: "#f7f6f3",
    easing: "sineIn",
    cameraType: "PerspectiveCamera",
    //   query.get("camera") == "p" ? "PerspectiveCamera" : "OrthographicCamera",
  };
  let guiFov = null;
  // create basic scene
  let camera = null;
  const scene = new THREE.Scene();
  if (guiObject.cameraType === "OrthographicCamera") {
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
      -2 * aspect,
      2 * aspect,
      2,
      -2,
      0.1,
      1000
    );
  }
  if (guiObject.cameraType === "PerspectiveCamera") {
    camera = new THREE.PerspectiveCamera(
      51,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
  }
  camera.position.z = 5.16;
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  console.log("renderer", renderer.pixelRatio);
  renderer.setClearColor(new THREE.Color("#f8f6f3"));
  document.body.appendChild(renderer.domElement);

  // add orbit controls
  let controls = new OrbitControls(camera, renderer.domElement);
  // const controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 1.0;
  // set azimuthal angle and polar angle
  const defaultPolarAngle = 1.551244071072532;
  const defaultAzimuthalAngle = -0.5080632974865708;
  controls.polarAngle = defaultPolarAngle;
  controls.azimuthalAngle = defaultAzimuthalAngle;
  // controls.enabled = false;

  const loader = new THREE.TextureLoader();
  const shText = loader.load("/sh03.png");
  // add object
  const vs = document.getElementById("vertexShader").textContent;
  const fs = document.getElementById("fragmentShader").textContent;

  const material = new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: vs,
    fragmentShader: fs,
    silent: true, // Disables the default warning if true
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
    },
    flatShading: false,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0,
  });
  const geometry = new THREE.SphereGeometry(2, 64, 64);
  const plane = new THREE.Mesh(geometry, material);
  plane.castShadow = false;
  scene.add(plane);

  // add circlular outline for sphere
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(guiObject.color2),
    side: THREE.BackSide,
  });
  const outlineGeometry = new THREE.SphereGeometry(2, 64, 64);
  const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
  outline.scale.set(1.0075, 1.0075, 1.0075);
  scene.add(outline);

  // add light
  const ambientLight = new THREE.AmbientLight(0xf7f6f3, 3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xf7f6f3, 1.5);
  directionalLight.position.set(0, 0, 10);
  directionalLight.visible = true;
  scene.add(directionalLight);

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

  // raycasting
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // mouse move handling
  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        const { x, y } = intersects[0].point;
        plane.material.uniforms.uMouse.value = new THREE.Vector2(x, y);
      }
    },
    false
  );

  // add gui
  gui.add(guiObject, "timeSpeed", 0.001, 0.05).onChange((value) => {
    guiObject.timeSpeed = value;
    plane.material.uniforms.uTime.value = 0;
  });
  gui
    .add(guiObject, "order", 1, 10)
    .step(1)
    .onChange((value) => {
      plane.material.uniforms.uOrder.value = value;
    });
  gui.add(guiObject, "lineWidth", 0.001, 5).onChange((value) => {
    plane.material.uniforms.uLineWidth.value = value;
    outline.scale.set(1 + value * 0.006, 1 + value * 0.006, 1 + value * 0.006);
  });
  gui
    .add(guiObject, "degree", 1, 10)
    .step(1)
    .onChange((value) => {
      plane.material.uniforms.uDegree.value = value;
    });
  gui
    .add(guiObject, "lineCount", 1, 100)
    .step(1)
    .onChange((value) => {
      plane.material.uniforms.uLineCount.value = value;
    });
  // gui.add(guiObject, "lineMultiplier", 1, 100)
  //     .step(1)
  //     .onChange(value => {
  //         plane.material.uniforms.uLineMultiplier.value = value;
  //     });
  gui.addColor(guiObject, "color1").onChange((value) => {
    plane.material.uniforms.uColor1.value = new THREE.Color(value);
    renderer.setClearColor(new THREE.Color(value));
  });
  gui.addColor(guiObject, "color2").onChange((value) => {
    plane.material.uniforms.uColor2.value = new THREE.Color(value);
    outlineMaterial.color = new THREE.Color(value);
  });
  // toggle for directional light
  gui.add(directionalLight, "visible").name("Directional Light");
  // toggle for ambient light
  gui.add(ambientLight, "visible").name("Ambient Light");
  // intensity for ambient light
  gui.add(ambientLight, "intensity", 0, 10).name("Ambient Light Intensity");
  // add select with easing functions
  gui
    .add(guiObject, "easing", [
      "linear",
      "exponentialIn",
      "elasticIn",
      "cubicIn",
      "sineIn",
      "bounceOut",
    ])
    .onChange((value) => {
      let easing = 1;
      if (value === "linear") easing = 0;
      if (value === "cubicIn") easing = 1;
      if (value === "elasticIn") easing = 2;
      if (value === "exponentialIn") easing = 3;
      if (value === "sineIn") easing = 4;
      if (value === "bounceOut") easing = 5;

      plane.material.uniforms.uEasing.value = easing;
    });
  // roughness and metalness
  gui.add(material, "roughness", 0, 1).name("Roughness");
  gui.add(material, "metalness", 0, 1).name("Metalness");
  // camera type
  gui
    .add(guiObject, "cameraType", ["PerspectiveCamera", "OrthographicCamera"])
    .onChange((value) => {
      if (value === "PerspectiveCamera") {
        camera = new THREE.PerspectiveCamera(
          43,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 6;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        controls.dispose();
        controls = new OrbitControls(camera, renderer.domElement);
      } else {
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.OrthographicCamera(
          -2 * aspect,
          2 * aspect,
          2,
          -2,
          0.1,
          1000
        );
        camera.position.z = 6;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        controls.dispose();
        controls = new OrbitControls(camera, renderer.domElement);
      }
    });
  // camera fov
  if (camera instanceof THREE.PerspectiveCamera)
    guiFov = gui
      .add(camera, "fov", 0, 180)
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
    // console.log("azimuthal angle", controls.getAzimuthalAngle());
    // console.log("polar angle", controls.getPolarAngle());

    renderer.render(scene, camera);
  };

  render();
});
