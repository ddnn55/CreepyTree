CreepyTreeMaterial = function ( parameters ) {

	THREE.Material.call( this, parameters );

	this.shading = THREE.FlatShading;

	this.wireframe = false;
	this.wireframeLinewidth = 1;

	this.setValues( parameters );


	var shaders = THREE.ShaderLib[ 'normal' ];
	this.uniforms = THREE.UniformsUtils.clone( shaders.uniforms );
	this.vertexShader = shaders.vertexShader;
	this.fragmentShader = shaders.fragmentShader;

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
