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

  options.treeDepth = treeCurve.maxDepth();
  options.startingDepth = 0.0;
  options.segmentDivisionSize = treeCurve.totalLength() / this.segments;
  options.radiusSegments = this.radiusSegments;
  options.existingGeometry = { vertices: [], faces: [] };

  var geometry = makeExtrudedGeometryForTree(treeCurve.root, options);
  /*{
    segmentDivisionSize: treeCurve.totalLength() / this.segments,
    radiusSegments: this.radiusSegments
  });*/

  this.vertices = geometry.vertices;
  this.faces = geometry.faces;
  //this.faceVertexUvs[1] = geometry.treeDepths;

  this.computeCentroids();
  this.computeFaceNormals();
  this.computeVertexNormals();

};

function makeExtrudedGeometryForTree(tree, options)
{
  var geometry = options.existingGeometry || { vertices: [], faces: [] };

  for(var c = 0; c < tree.children.length; c++)
  {
    var child = tree.children[c];
    var segmentGeometry = makeExtrudedGeometryForSegment(tree, child, options.segmentDivisionSize, options.radiusSegments, options.radius, options.startingDepth + tree.distanceTo(child));
    for(var f = 0; f < segmentGeometry.faces.length; f++)
    {
      segmentGeometry.faces[f].a += geometry.vertices.length;
      segmentGeometry.faces[f].b += geometry.vertices.length;
      segmentGeometry.faces[f].c += geometry.vertices.length;
      if(segmentGeometry.faces[f] instanceof THREE.Face4)
        segmentGeometry.faces[f].d += geometry.vertices.length;
    }
    
    geometry.vertices = geometry.vertices.concat(segmentGeometry.vertices);
    geometry.faces = geometry.faces.concat(segmentGeometry.faces);
    options.existingGeometry = geometry;
    makeExtrudedGeometryForTree(child, options);
  }

  
  return geometry;
}

function makeExtrudedGeometryForSegment(nodeA, nodeB, segmentDivisionSize, radiusSegments, radius, startingDepth)
{
  var geometry = { vertices: [], faces: [], treeDepths: [] };
  
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
    geometry.vertices = geometry.vertices.concat( makeCircleVertices(curvePos, curveNormal, curveBinormal, radiusSegments, radius) );

    if(d > 0)
    {
      var previousFraction = (d-1) / numberOfDivisions;
      for(var f = 0; f < radiusSegments; f++)
      {
        var radiusIndexA = f;
	var radiusIndexB = (f+1) % radiusSegments;
        geometry.faces.push(new THREE.Face4(
	  d       * radiusSegments + radiusIndexA,
	  d       * radiusSegments + radiusIndexB,
	  (d - 1) * radiusSegments + radiusIndexB,
	  (d - 1) * radiusSegments + radiusIndexA
	));
	geometry.treeDepths.push([
	  new THREE.UV(startingDepth + previousFraction * segmentLength, 0.0),
	  new THREE.UV(startingDepth + fraction         * segmentLength, 0.0),
	  new THREE.UV(startingDepth + fraction         * segmentLength, 0.0),
	  new THREE.UV(startingDepth + previousFraction * segmentLength, 0.0)
	]);
      }
    }
  }
  return geometry;
}

function makeCircleVertices(center, basisX, basisY, radiusSegments, radius)
{
  var vertices = [];
  for(var v = 0; v < radiusSegments; v++)
  {
    var angle = Math.PI * 2 * v / radiusSegments;
    var xVec = basisX.clone().multiplyScalar( radius * Math.cos(angle) );
    var yVec = basisY.clone().multiplyScalar( radius * Math.sin(angle) );
    var fromCenter = (new THREE.Vector3()).add(xVec, yVec);
    vertices.push( center.clone().addSelf(fromCenter) );
  }
  return vertices;
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
