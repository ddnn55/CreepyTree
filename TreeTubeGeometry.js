/**
 * @author WestLangley / https://github.com/WestLangley
 * @author zz85 / https://github.com/zz85
 * @author miningold / https://github.com/miningold
 *
 * Modified from the TorusKnotGeometry by @oosmoxiecode
 *
 * Creates a tube which extrudes along a 3d, branching curve
 *
 * Uses parallel transport frames as described in
 * http://www.cs.indiana.edu/pub/techreports/TR425.pdf
 */

THREE.TreeTubeGeometry = function( treeCurve, segments, radius, radiusSegments, closed, debug ) {

  THREE.Geometry.call( this );

  var path = treeCurve;
  
  this.path = path;
  this.segments = segments || 64;
  this.radius = radius || 1;
  this.radiusSegments = radiusSegments || 8;
  this.closed = false;

  if ( debug ) this.debug = new THREE.Object3D();

  var _this = this;

  var geometry = makeExtrudedGeometryForTree(treeCurve.root, {
    segmentDivisionSize: treeCurve.totalLength() / segments,
    radiusSegments: radiusSegments
  });

  this.vertices = geometry.vertices;
  this.faces = geometry.faces;

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
    var segmentGeometry = makeExtrudedGeometryForSegment(tree, child, options.segmentDivisionSize, options.radiusSegments);
    console.log('segmentGeometry unshifted', segmentGeometry);
    for(var f = 0; f < segmentGeometry.faces.length; f++)
    {
      segmentGeometry.faces[f].a += geometry.faces.length;
      segmentGeometry.faces[f].b += geometry.faces.length;
      segmentGeometry.faces[f].c += geometry.faces.length;
      if(segmentGeometry.faces[f] instanceof THREE.Face4)
        segmentGeometry.faces[f].d += geometry.faces.length;
    }

    geometry.vertices = geometry.vertices.concat(segmentGeometry.vertices);
    geometry.faces = geometry.faces.concat(segmentGeometry.faces);
    makeExtrudedGeometryForTree(child, {existingGeometry: geometry});
  }

  
  return geometry;
}

function makeExtrudedGeometryForSegment(nodeA, nodeB, segmentDivisionSize, radiusSegments)
{
  var geometry = { vertices: [], faces: [] };
  
  var segmentLength = nodeA.distanceTo(nodeB);
  //var segmentsFrames = treeCurve.mapSegments(function(edge) { return new THREE.TubeGeometry.FrenetFrames(edge.path, edge.segments, false) });
  console.log('length of segment', segmentLength);
  
  var aToB = nodeA.to(nodeB);
  var curveTangent = aToB.clone().normalize();
  var curveNormal = normalToVec3(curveTangent);
  var curveBinormal = (new THREE.Vector3()).cross(curveNormal, curveTangent).normalize();
  console.log('frenet', curveTangent, curveNormal, curveBinormal);
  
  numberOfDivisions = segmentLength / segmentDivisionSize;
  for(var d = 0; d < numberOfDivisions; d++)
  {
    var fraction = d / numberOfDivisions;
    var curvePos = aToB.clone().multiplyScalar(fraction);
    console.log('curvePos', curvePos);
    geometry.vertices = geometry.vertices.concat( makeCircleVertices(curvePos, curveNormal, curveBinormal, radiusSegments) );

    if(d > 0)
    {
      for(var f = 0; f < radiusSegments; f++)
      {
        var radiusIndexA = f;
	var radiusIndexB = (f+1) % radiusSegments;
        geometry.faces.push(new THREE.Face4(
	  (d - 1) * radiusSegments + radiusIndexA,
	  (d - 1) * radiusSegments + radiusIndexB,
	  d       * radiusSegments + radiusIndexB,
	  d       * radiusSegments + radiusIndexA
	));
      }
    }
  }
  return geometry;
}

function makeCircleVertices(center, basisX, basisY, radiusSegments)
{
  var vertices = [];
  for(var v = 0; v < radiusSegments; v++)
  {
    var angle = Math.PI * 2 * v / radiusSegments;
    var xVec = basisX.clone().multiplyScalar( Math.cos(angle) );
    var yVec = basisY.clone().multiplyScalar( Math.sin(angle) );
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
