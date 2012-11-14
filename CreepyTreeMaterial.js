CreepyTreeMaterial = function ( parameters ) {

  THREE.ShaderMaterial.call( this, parameters );

  this.shading = THREE.FlatShading;

  this.wireframe = false;
  this.wireframeLinewidth = 1;

  this.setValues( parameters );


  var shaders = THREE.ShaderLib[ 'normal' ];
  this.uniforms = THREE.UniformsUtils.clone( shaders.uniforms );
  this.uniforms.growth = { type: 'f', value: parameters.growth };
  this.vertexShader = [

    "varying vec3 vNormal;",
    "varying float treeDepth;",
    "varying float screenZ;",
    "uniform float radius;",
    "uniform float growth;",

    "void main() {",
      "treeDepth = uv2.x;",

      //"vec3 extrudedPosition = position + 10.0 * growth * vec3(1.0, 0.0, 0.0);",
      "vec3 extrudedPosition = position + 10.0 * growth * normal;",
      "vec4 mvPosition = modelViewMatrix * vec4( extrudedPosition, 1.0 );",

      // outputs
      "gl_Position = projectionMatrix * mvPosition;",
      "screenZ = gl_Position.z / gl_Position.w;",

    "}"

  ].join("\n");
  
  this.fragmentShader = [

    "uniform float opacity;",
    "uniform float growth;",
    
    "varying vec3 vNormal;",
    "varying float treeDepth;",
    "varying float screenZ;",

    "void main() {",
      
      // discard if haven't grown here yet
      "if(treeDepth > growth) discard;",

      // visualize screenZ
      //"float color = screenZ * 0.002;",
      "float color = screenZ * 0.2;",
      "gl_FragColor = vec4( color, color, color, float(treeDepth < growth) );",

      // visualize treeDepth
      //"gl_FragColor = vec4( treeDepth, treeDepth, treeDepth, float(treeDepth < growth) );",

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
