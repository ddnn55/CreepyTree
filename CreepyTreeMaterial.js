CreepyTreeMaterial = function ( parameters ) {

  THREE.Material.call( this, parameters );

  this.shading = THREE.FlatShading;

  this.wireframe = false;
  this.wireframeLinewidth = 1;

  this.setValues( parameters );


  var shaders = THREE.ShaderLib[ 'normal' ];
  this.uniforms = THREE.UniformsUtils.clone( shaders.uniforms );
  this.vertexShader = shaders.vertexShader;
  this.fragmentShader = [

    "uniform float opacity;",
    "varying vec3 vNormal;",

    "void main() {",

      //"gl_FragColor = vec4( 0.5 * normalize( vNormal ) + 0.5, opacity );",

      "float z = normalize( vNormal ).z;",
      "float x = normalize( vNormal ).x;",
      "float value = float(z > 0.3);",
      
      "gl_FragColor = vec4( value, value, value, opacity );",

    "}"

  ].join("\n");

};

CreepyTreeMaterial.prototype = Object.create( THREE.Material.prototype );

CreepyTreeMaterial.prototype.clone = function () {

  var material = new THREE.MeshNormalMaterial();

  THREE.Material.prototype.clone.call( this, material );

  material.shading = this.shading;

  material.wireframe = this.wireframe;
  material.wireframeLinewidth = this.wireframeLinewidth;

  return material;

};
