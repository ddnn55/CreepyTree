/**
 * Creates a tube which extrudes along a 3d, branching curve
 *
 */

THREE.TreeTubeGeometry = function( treeCurve, options ) {

  options = options || {};

  THREE.Geometry.call( this );

  var path = treeCurve;
  
  this.path = path;
  this.segments = options.segments || 64;
  this.radius = options.radius || 1;
  this.radiusSegments = options.radiusSegments || 8;
  this.closed = false;

  if ( debug ) this.debug = new THREE.Object3D();

  var _this = this;

  options.maxDepth = treeCurve.maxDepth();
  options.segmentDivisionSize = treeCurve.totalLength() / this.segments;
  options.radiusSegments = this.radiusSegments;
  options.existingGeometry = { vertices: [], normals: [], faces: [], treeDepths: [] };

  var geometry = makeExtrudedGeometryForTree(treeCurve.root, options, 0.0);

  /*{
    segmentDivisionSize: treeCurve.totalLength() / this.segments,
    radiusSegments: this.radiusSegments
  });*/

  this.vertices = geometry.vertices;
  this.normals = geometry.normals;
  this.faces = geometry.faces;
  this.faceVertexUvs[0] = geometry.treeDepths;
  this.faceVertexUvs[1] = geometry.treeDepths;

  this.computeCentroids();
  //this.computeFaceNormals();
  //this.computeVertexNormals();

};

function makeExtrudedGeometryForTree(tree, options, startingDepth)
{
  var geometry = options.existingGeometry || { vertices: [], normals: [], faces: [], treeDepths: [] };

  for(var c = 0; c < tree.children.length; c++)
  {
    var child = tree.children[c];
    var segmentGeometry = makeExtrudedGeometryForSegment(tree, child, options.segmentDivisionSize, options.radiusSegments, options.radius, startingDepth, options.maxDepth);
    for(var f = 0; f < segmentGeometry.faces.length; f++)
    {
      segmentGeometry.faces[f].a += geometry.vertices.length;
      segmentGeometry.faces[f].b += geometry.vertices.length;
      segmentGeometry.faces[f].c += geometry.vertices.length;
      if(segmentGeometry.faces[f] instanceof THREE.Face4)
        segmentGeometry.faces[f].d += geometry.vertices.length;
    }
    
    geometry.vertices = geometry.vertices.concat(segmentGeometry.vertices);
    geometry.normals = geometry.normals.concat(segmentGeometry.normals);
    geometry.faces = geometry.faces.concat(segmentGeometry.faces);
    geometry.treeDepths = geometry.treeDepths.concat(segmentGeometry.treeDepths);
    
    options.existingGeometry = geometry;

    makeExtrudedGeometryForTree(child, options, startingDepth + tree.distanceTo(child));
  }
  
  return geometry;
}

function makeExtrudedGeometryForSegment(nodeA, nodeB, segmentDivisionSize, radiusSegments, radius, startingDepth, maxDepth)
{

  var geometry = { vertices: [], normals: [], faces: [], treeDepths: [] };
  
  var segmentLength = nodeA.distanceTo(nodeB);
 
  var aToB = nodeA.to(nodeB);
  var curveTangent = aToB.clone().normalize();
  var curveNormal = normalToVec3(curveTangent);
  var curveBinormal = (new THREE.Vector3()).cross(curveNormal, curveTangent).normalize();
  
  var numberOfDivisions = Math.ceil(segmentLength / segmentDivisionSize);
  for(var d = 0; d <= numberOfDivisions; d++)
  {
    var fraction = d / numberOfDivisions;
    var curvePos = aToB.clone().multiplyScalar(fraction).addSelf(nodeA);
    var circleGeometry = makeCircleGeometry(curvePos, curveNormal, curveBinormal, radiusSegments, radius)
    geometry.vertices = geometry.vertices.concat( circleGeometry.vertices );
    geometry.normals  = geometry.normals.concat(  circleGeometry.normals );

    if(d > 0)
    {
      var previousFraction = (d-1) / numberOfDivisions;
      for(var f = 0; f < radiusSegments; f++)
      {
        var radiusIndexA = f;
	var radiusIndexB = (f+1) % radiusSegments;
	var v1 = d       * radiusSegments + radiusIndexA;
	var v2 = d       * radiusSegments + radiusIndexB;
	var v3 = (d - 1) * radiusSegments + radiusIndexB;
	var v4 = (d - 1) * radiusSegments + radiusIndexA;
        geometry.faces.push(new THREE.Face4(
	  v1, v2, v3, v4,
	  //[geometry.normals[v1], geometry.normals[v2], geometry.normals[v3], geometry.normals[v4]]
	  geometry.normals[v1].clone().addSelf( geometry.normals[v2] ).addSelf( geometry.normals[v3] ).addSelf( geometry.normals[v4] ).multiplyScalar( 0.25 )
	));

        var previousDepth = startingDepth + previousFraction * segmentLength;
	var currentDepth =  startingDepth + fraction         * segmentLength;
	var previousDepthFraction = previousDepth / maxDepth;
	var currentDepthFraction = currentDepth / maxDepth;
	geometry.treeDepths.push([
	  new THREE.UV(currentDepthFraction, 0.0),
	  new THREE.UV(currentDepthFraction, 0.0),
	  new THREE.UV(previousDepthFraction, 0.0),
	  new THREE.UV(previousDepthFraction, 0.0)
	]);
      }
    }
  }
  return geometry;
}

function makeCircleGeometry(center, basisX, basisY, radiusSegments, radius)
{
  var vertices = [];
  var normals = [];
  for(var v = 0; v < radiusSegments; v++)
  {
    var angle = Math.PI * 2 * v / radiusSegments;
    var xVec = basisX.clone().multiplyScalar( Math.cos(angle) );
    var yVec = basisY.clone().multiplyScalar( Math.sin(angle) );
    var fromCenter = (new THREE.Vector3()).add(xVec, yVec);
    //vertices.push( center );
    vertices.push( center.clone().addSelf(fromCenter) );
    normals.push( fromCenter );
  }
  return {vertices:vertices, normals:normals};
}

function normalToVec3(vec) {
  var normal = new THREE.Vector3();
  var smallest = Number.MAX_VALUE;
  var tx = Math.abs( vec.x );
  var ty = Math.abs( vec.y );
  var tz = Math.abs( vec.z );

  if ( tx <= smallest ) {
    smallest = tx;
    normal.set( 1, 0, 0 );
  }

  if ( ty <= smallest ) {
    smallest = ty;
    normal.set( 0, 1, 0 );
  }

  if ( tz <= smallest ) {
    normal.set( 0, 0, 1 );
  }

  var intermediateVec = (new THREE.Vector3()).cross( vec, normal ).normalize();

  normal.cross( vec, intermediateVec );

  return normal;
}

THREE.TreeTubeGeometry.prototype = Object.create( THREE.Geometry.prototype );


// For computing of Frenet frames, exposing the tangents, normals and binormals the spline
THREE.TreeTubeGeometry.FrenetFrames = function(path, segments, closed) {

  var 
    tangent = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    binormal = new THREE.Vector3(),

    tangents = [],
    normals = [],
    binormals = [],

    vec = new THREE.Vector3(),
    mat = new THREE.Matrix4(),

    numpoints = segments + 1,
    theta,
    epsilon = 0.0001,
    smallest,

    tx, ty, tz,
    i, u, v;


  // expose internals
  this.tangents = tangents;
  this.normals = normals;
  this.binormals = binormals;

  // compute the tangent vectors for each segment on the path

  for ( i = 0; i < numpoints; i++ ) {

    u = i / ( numpoints - 1 );

    tangents[ i ] = path.getTangentAt( u );
    tangents[ i ].normalize();

  }

  initialNormal3();

  function initialNormal1(lastBinormal) {
    // fixed start binormal. Has dangers of 0 vectors
    normals[ 0 ] = new THREE.Vector3();
    binormals[ 0 ] = new THREE.Vector3();
    if (lastBinormal===undefined) lastBinormal = new THREE.Vector3( 0, 0, 1 );
    normals[ 0 ].cross( lastBinormal, tangents[ 0 ] ).normalize();
    binormals[ 0 ].cross( tangents[ 0 ], normals[ 0 ] ).normalize();
  }

  function initialNormal2() {

    // This uses the Frenet-Serret formula for deriving binormal
    var t2 = path.getTangentAt( epsilon );

    normals[ 0 ] = new THREE.Vector3().sub( t2, tangents[ 0 ] ).normalize();
    binormals[ 0 ] = new THREE.Vector3().cross( tangents[ 0 ], normals[ 0 ] );

    normals[ 0 ].cross( binormals[ 0 ], tangents[ 0 ] ).normalize(); // last binormal x tangent
    binormals[ 0 ].cross( tangents[ 0 ], normals[ 0 ] ).normalize();

  }

  function initialNormal3() {
    // select an initial normal vector perpenicular to the first tangent vector,
    // and in the direction of the smallest tangent xyz component

    normals[ 0 ] = new THREE.Vector3();
    binormals[ 0 ] = new THREE.Vector3();
    smallest = Number.MAX_VALUE;
    tx = Math.abs( tangents[ 0 ].x );
    ty = Math.abs( tangents[ 0 ].y );
    tz = Math.abs( tangents[ 0 ].z );

    if ( tx <= smallest ) {
      smallest = tx;
      normal.set( 1, 0, 0 );
    }

    if ( ty <= smallest ) {
      smallest = ty;
      normal.set( 0, 1, 0 );
    }

    if ( tz <= smallest ) {
      normal.set( 0, 0, 1 );
    }

    vec.cross( tangents[ 0 ], normal ).normalize();

    normals[ 0 ].cross( tangents[ 0 ], vec );
    binormals[ 0 ].cross( tangents[ 0 ], normals[ 0 ] );
  }


  // compute the slowly-varying normal and binormal vectors for each segment on the path

  for ( i = 1; i < numpoints; i++ ) {

    normals[ i ] = normals[ i-1 ].clone();

    binormals[ i ] = binormals[ i-1 ].clone();

    vec.cross( tangents[ i-1 ], tangents[ i ] );

    if ( vec.length() > epsilon ) {

      vec.normalize();

      theta = Math.acos( tangents[ i-1 ].dot( tangents[ i ] ) );

      mat.makeRotationAxis( vec, theta ).multiplyVector3( normals[ i ] );

    }

    binormals[ i ].cross( tangents[ i ], normals[ i ] );

  }

};
