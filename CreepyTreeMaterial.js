CreepyTreeMaterial = function ( parameters ) {

  THREE.ShaderMaterial.call( this, parameters );

  this.shading = THREE.FlatShading;

  this.wireframe = false;
  this.wireframeLinewidth = 1;

  this.setValues( parameters );


  var shaders = THREE.ShaderLib[ 'normal' ];
  this.uniforms = THREE.UniformsUtils.clone( shaders.uniforms );
  this.uniforms.growth = { type: 'f', value: '0.5' };
  this.vertexShader = [

    "varying vec3 vNormal;",
    //"attribute vec2 uv2;",
    "varying float treeDepth;",

    "void main() {",

      "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
      "vNormal = normalMatrix * normal;",

      "gl_Position = projectionMatrix * mvPosition;",
      "treeDepth = uv2.x;",

    "}"

  ].join("\n");
  
  this.fragmentShader = [

    "uniform float opacity;",
    "uniform float growth;",
    "varying vec3 vNormal;",
    "varying float treeDepth;",

    "void main() {",
       
      // normal viz
      //"gl_FragColor = vec4( 0.5 * normalize( vNormal ) + 0.5, opacity );",

      // screen ortho cel shading
      "float z = normalize( vNormal ).z;",
      "float x = normalize( vNormal ).x;",
      "float value = float(z > 0.3);",
      //"gl_FragColor = vec4( value, value, value, opacity );",

      // visualize treeDepth
      "gl_FragColor = vec4( treeDepth, treeDepth, treeDepth, float(treeDepth < growth) );",

    "}"

  ].join("\n");

};

CreepyTreeMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );

CreepyTreeMaterial.prototype.clone = function () {

  var material = new THREE.MeshNormalMaterial();

  THREE.Material.prototype.clone.call( this, material );

  material.shading = this.shading;

  material.wireframe = this.wireframe;
  material.wireframeLinewidth = this.wireframeLinewidth;

  return material;

};
