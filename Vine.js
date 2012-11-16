var container, stats, gui;

var camera, scene, celPostProcessScene, renderer, splineCamera, cameraHelper, cameraEye;
var vineOptions;

var text, plane;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var binormal = new THREE.Vector3();
var normal = new THREE.Vector3();


var pipeSpline = new THREE.SplineCurve3([
    new THREE.Vector3(0, 10, -10), new THREE.Vector3(10, 0, -10), new THREE.Vector3(20, 0, 0), new THREE.Vector3(30, 0, 10), new THREE.Vector3(30, 0, 20), new THREE.Vector3(20, 0, 30), new THREE.Vector3(10, 0, 30), new THREE.Vector3(0, 0, 30), new THREE.Vector3(-10, 10, 30), new THREE.Vector3(-10, 20, 30), new THREE.Vector3(0, 30, 30), new THREE.Vector3(10, 30, 30), new THREE.Vector3(20, 30, 15), new THREE.Vector3(10, 30, 10), new THREE.Vector3(0, 30, 10), new THREE.Vector3(-10, 20, 10), new THREE.Vector3(-10, 10, 10), new THREE.Vector3(0, 0, 10), new THREE.Vector3(10, -10, 10), new THREE.Vector3(20, -15, 10), new THREE.Vector3(30, -15, 10), new THREE.Vector3(40, -15, 10), new THREE.Vector3(50, -15, 10), new THREE.Vector3(60, 0, 10), new THREE.Vector3(70, 0, 0), new THREE.Vector3(80, 0, 0), new THREE.Vector3(90, 0, 0), new THREE.Vector3(100, 0, 0)]);

var sampleClosedSpline = new THREE.ClosedSplineCurve3([
  new THREE.Vector3(0, -40, -40),
  new THREE.Vector3(0, 40, -40),
  new THREE.Vector3(0, 140, -40),
  new THREE.Vector3(0, 40, 40),
  new THREE.Vector3(0, -40, 40),
]);

var treeCurve = new TreeCurve(0.0, 0.0, 0.0);
treeCurve.root.addChild(10.0, 10.0, 10.0).addChild(20.0, -30.0, 40.0).addChild(0.0, 0.0, 30.0);
treeCurve.root.children[0].addChild(-30.0, 30.0, 0.0);
treeCurve.root.addChild(-30.0, 30.0, 30.0);
treeCurve.root.addChild(30.0, -30.0, 30.0);

treeCurve = TreeCurve.random(100);

// Keep a dictionary of Curve instances
var splines = {
  TreeCurve: treeCurve,
  GrannyKnot: new THREE.Curves.GrannyKnot(),
  HeartCurve: new THREE.Curves.HeartCurve(3.5),
  VivianiCurve: new THREE.Curves.VivianiCurve(70),
  KnotCurve: new THREE.Curves.KnotCurve(),
  HelixCurve: new THREE.Curves.HelixCurve(),
  TrefoilKnot: new THREE.Curves.TrefoilKnot(),
  TorusKnot: new THREE.Curves.TorusKnot(20),
  CinquefoilKnot: new THREE.Curves.CinquefoilKnot(20),
  TrefoilPolynomialKnot: new THREE.Curves.TrefoilPolynomialKnot(14),
  FigureEightPolynomialKnot: new THREE.Curves.FigureEightPolynomialKnot(),
  DecoratedTorusKnot4a: new THREE.Curves.DecoratedTorusKnot4a(),
  DecoratedTorusKnot4b: new THREE.Curves.DecoratedTorusKnot4b(),
  DecoratedTorusKnot5a: new THREE.Curves.DecoratedTorusKnot5a(),
  DecoratedTorusKnot5c: new THREE.Curves.DecoratedTorusKnot5c(),
  PipeSpline: pipeSpline,
  SampleClosedSpline: sampleClosedSpline
};




extrudePath = new THREE.Curves.TrefoilKnot();

var closed2 = true;
var debug = true;
var parent;
var tube, tubeMesh, treeMaterial;
var animation = false, lookAhead = false;
var scale;
var showCameraHelper = false;

function addTube(options) {
  if (tubeMesh)
  {
    parent.remove(tubeMesh);
  }

  tube = new THREE.TreeTubeGeometry(treeCurve, options);
  
  treeMaterial = new CreepyTreeMaterial({
    opacity: 1.0,
    transparent: true,
    growth: options.growth,
    radius: options.radius
  });
  
  normalMaterial = new THREE.MeshNormalMaterial({
    opacity: 1.0
  });

  addGeometry(tube, treeMaterial);
}

function addGeometry( geometry, material ) {
  tubeMesh = new THREE.Mesh( geometry, material );
  parent.add( tubeMesh );

  console.log(tubeMesh);
}

function animateCamera( toggle ) {

  if ( toggle ) {

    animation = animation === false;

  }

  lookAhead = document.getElementById('lookAhead').checked;

  showCameraHelper = document.getElementById('cameraHelper').checked;

  cameraHelper.visible = showCameraHelper;
  cameraEye.visible = showCameraHelper;
}


init();
animate();

function init() {

  container = document.createElement('div');
  document.body.appendChild(container);

  var info = document.createElement('div');
  info.style.position = 'absolute';
  info.style.top = '10px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  //info.innerHTML = 'Spline Extrusion Examples by <a href="http://www.lab4games.net/zz85/blog">zz85</a><br/>Select spline:';

  //info.innerHTML += dropdown;

  //info.innerHTML += '<br/>Scale: <select id="scale" onchange="setScale()"><option>1</option><option>2</option><option selected>4</option><option>6</option><option>10</option></select>';


  container.appendChild(info);

  //

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
  camera.position.set(0, 50, 500);

  scene = new THREE.Scene();

  var light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  parent = new THREE.Object3D();
  parent.position.y = 100;
  scene.add( parent );

  splineCamera = new THREE.PerspectiveCamera(84, window.innerWidth / window.innerHeight, 0.01, 1000);
  parent.add(splineCamera);

  cameraHelper = new THREE.CameraHelper(splineCamera);
  scene.add(cameraHelper);

  zTexture = new THREE.WebGLRenderTarget(
    window.innerWidth, window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      //format: THREE.LuminanceFormat,
      //format: THREE.AlphaFormat, // OS X bugs for these two!
      format: THREE.RGBFormat,
      type: THREE.FloatType
    }
  );


  celPostProcessScene = new THREE.Scene();
  var celPostProcessMaterial = new THREE.ShaderMaterial( {
    uniforms: {
      zBuffer: { type: "t", value: zTexture },
      screenWidth:  { type: "f", value: zTexture.width },
      screenHeight: { type: "f", value: zTexture.height }
    },
    vertexShader: [
      "varying vec2 screenCoord;",
      "void main() {",
        "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
        "gl_Position = projectionMatrix * mvPosition;",
        "screenCoord = uv;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D zBuffer;",
      "uniform float screenWidth;",
      "uniform float screenHeight;",
      "varying vec2 screenCoord;",

      "vec2 screenToPixel(vec2 screen) {",
        "return vec2(screen.x * screenWidth, screen.y * screenHeight);",
      "}",
      
      "vec2 pixelToScreen(vec2 pixel) {",
        "return vec2(pixel.x / screenWidth, pixel.y / screenHeight);",
      "}",
      
      "void main() {",
        "vec2 pixelCoord = screenToPixel(screenCoord);",
        "float pixelValue = texture2D(zBuffer, screenCoord).r;",

        "vec2 eastPixelCoord = pixelCoord + vec2(2.0, 0.0);",
        "vec2 northPixelCoord = pixelCoord + vec2(0.0, 2.0);",

        "float eastValue = texture2D(zBuffer, pixelToScreen(eastPixelCoord)).r;",
        "float northValue = texture2D(zBuffer, pixelToScreen(northPixelCoord)).r;",

        "float eastDiff =  1000000.0 * (pixelValue - eastValue);",
        "float northDiff = 1000000.0 * (pixelValue - northValue);",

        "float totalDiff = pow(eastDiff, 2.0) + pow(northDiff, 2.0);",
        "float color = 1.0 - pow(totalDiff, 1.0);",
        

        "gl_FragColor = vec4(color, color, color, 1.0);",
      "}"
    ].join("\n"),
    depthWrite: false
  });
  var celPostProcessGeometry = new THREE.PlaneGeometry(1.0, 1.0, 1, 1);
  var celPostProcessMesh = new THREE.Mesh(celPostProcessGeometry, celPostProcessMaterial);
  celPostProcessMesh.position.x = 0.5;
  celPostProcessMesh.position.y = 0.5;
  celPostProcessScene.add(celPostProcessMesh);
  celPostProcessCamera = new THREE.OrthographicCamera(0.0, 1.0, 1.0, 0.0, -1.0, 1.0);

  //addTube();

  // Debug point

  cameraEye = new THREE.Mesh( new THREE.SphereGeometry( 5 ), new THREE.MeshBasicMaterial( { color: 0xdddddd } ) );
  parent.add(cameraEye);

  cameraHelper.visible = showCameraHelper;
  cameraEye.visible = showCameraHelper;

  //

  renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0xFFFFFF } );
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );

  renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  renderer.domElement.addEventListener( 'touchstart', onDocumentTouchStart, false );
  renderer.domElement.addEventListener( 'touchmove', onDocumentTouchMove, false );

  //

  window.addEventListener( 'resize', onWindowResize, false );

  addDatGui();
}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function onDocumentMouseDown(event) {

  event.preventDefault();

  renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
  renderer.domElement.addEventListener( 'mouseout', onDocumentMouseOut, false );

  mouseXOnMouseDown = event.clientX - windowHalfX;
  targetRotationOnMouseDown = targetRotation;

}

function onDocumentMouseMove(event) {

  mouseX = event.clientX - windowHalfX;

  targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;

}

function onDocumentMouseUp(event) {

  renderer.domElement.removeEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  renderer.domElement.removeEventListener( 'mouseout', onDocumentMouseOut, false );

}

function onDocumentMouseOut(event) {

  renderer.domElement.removeEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  renderer.domElement.removeEventListener( 'mouseout', onDocumentMouseOut, false );

}

function onDocumentTouchStart(event) {

  if (event.touches.length == 1) {

    event.preventDefault();

    mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
    targetRotationOnMouseDown = targetRotation;

  }

}

function onDocumentTouchMove(event) {

  if (event.touches.length == 1) {

    event.preventDefault();

    mouseX = event.touches[ 0 ].pageX - windowHalfX;
    targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;

  }

}

//

function animate() {

  requestAnimationFrame(animate);

  render();
  stats.update();

}

function render() {

  parent.rotation.y += ( targetRotation - parent.rotation.y ) * 0.05;

  if(vineOptions.debugScene)
  {
    renderer.render( scene, camera );
  }
  else 
  {
    renderer.render( scene, camera, zTexture, true );
    renderer.render( celPostProcessScene, celPostProcessCamera );
  }
}



function addDatGui()
{
  var VineOptions = function() {
    var _this = this;
    this.radius = 1;
    this.radiusSegments = 64;
    this.segments = 100;
    this.growth = 1.0;
    this.scale = 5.0;
    this.debugNormals = function() {
      _this.debugScene = true;
      tubeMesh.material = normalMaterial;
    };
    this.celShade = function() {
      _this.debugScene = false;
      tubeMesh.material = treeMaterial;
    };
    this.grow = function() {
      _this.growth = 0.0;
      _this.animateGrowth = true;
    }
  };
  
  function update() {
    vineOptions.radiusSegments = Math.ceil(vineOptions.radiusSegments);
    addTube(vineOptions);
    tubeMesh.scale.set(vineOptions.scale, vineOptions.scale, vineOptions.scale);
  }
  
  vineOptions = new VineOptions();
  gui = new dat.GUI();
  var viewFolder = gui.addFolder('View');
  viewFolder.add(vineOptions, 'scale', 1.0, 10.0).onChange(function(scale) {
    tubeMesh.scale.set( scale, scale, scale );
  });
  viewFolder.add(vineOptions, 'debugNormals', false);
  viewFolder.add(vineOptions, 'celShade', true);

  var meshFolder = gui.addFolder('Mesh');
  meshFolder.add(vineOptions, 'radius', 0.5, 10.0).onChange(function(radius) {
    tubeMesh.material.uniforms['radius'] = { type: "f", value: radius };
  });
  meshFolder.add(vineOptions, 'radiusSegments', 3, 64).onFinishChange(update);
  meshFolder.add(vineOptions, 'segments', 10, 500).onFinishChange(update);
  meshFolder.add(vineOptions, 'growth', 0.0, 1.0).onChange(function(growth) {
    tubeMesh.material.uniforms['growth'] = { type: "f", value: growth };
  });
  
  viewFolder.open();
  meshFolder.open();

  update();
}

