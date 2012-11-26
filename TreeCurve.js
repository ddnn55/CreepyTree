var RANDOM_SEGMENT_COMPONENT_MAX = 20.0;
var RANDOM_SEGMENT_COMPONENT_MIN = 3.0;

TreeCurve = function()
{
  //this.root = new TreeCurveNode(x, y, z);
}

TreeCurve.random = function(segments)
{
  var curve = new TreeCurve();
  curve.root = new TreeCurveNode(0.0, 0.0, 0.0);
  curve.root.addRandomTree(segments);
  return curve;
}

TreeCurve.loadTree = function(url, curveCallback)
{
  $.getJSON(url)
    .success(function(data) {
      var nodes = [];
      // nodes by id
      for(var nodeIndex in data) {
        var node = data[nodeIndex];
	node.parents = [];
        nodes[node.id] = node;
      }
      // parents
      for(var nodeIndex in data) {
        var node = data[nodeIndex];
        for(var childIdIndex in node.children)
	{
	  var childId = node.children[childIdIndex];
	  nodes[childId].parents.push(node.id);
	}
      }
      // find root
      var noParents = [];
      for(var nodeIndex in nodes) {
        var node = nodes[nodeIndex];
	if(node.parents.length == 0)
	  noParents.push(node);
      }
      console.log('Found ', noParents.length, ' root node(s).', noParents);
      if(noParents.length != 1)
        console.error('TreeMesh Error: There should be exactly', 1, 'root node in ', url, 'but there are', noParents.length);
      else
      {
        var curve = new TreeCurve();
	var fileNodeToTreeCurveTree = function(node)
	{
	  //console.log('JSON node', node);
          var newNode = new TreeCurveNode(node.pos[0], node.pos[1], node.pos[2]);
          for(var c = 0; c < node.children.length; c++)
	  {
            var child = nodes[node.children[c]];
	    newNode.children.push(fileNodeToTreeCurveTree(child));
	  }
	  return newNode;
	}
	curve.root = fileNodeToTreeCurveTree(noParents[0]);

        console.log('loaded curve:', curve);
	curveCallback(curve);
      }
    })
    .error(function(data) {
      console.log('.error', data);
    });
}

TreeCurve.prototype.totalLength = function()
{
  return this.root.totalLength();
}

TreeCurve.prototype.maxDepth = function()
{
  return this.root.maxDepth();
}

TreeCurveNode = function(x, y, z)
{
  this.x = x;
  this.y = y;
  this.z = z;

  this.children = [];
}

TreeCurveNode.prototype.addChild = function(x, y, z)
{
  var newNode = new TreeCurveNode( x, y, z );
  this.children.push( newNode );
  return this.children[this.children.length-1];
}

TreeCurveNode.prototype.addRandomTree = function(segments, depth)
{
  depth = depth || 0;

  var branches = Math.ceil(Math.min(segments, (Math.random() * 4)));
  if(branches == 0)
    return;

  segments -= branches;
  var segmentBudgetPerChild = Math.floor(segments / branches);
  
  for(var b = 0; b < branches; b++)
  {
    var dx = 2 * (Math.random() - 0.5) * (RANDOM_SEGMENT_COMPONENT_MAX - RANDOM_SEGMENT_COMPONENT_MIN);
    var dy = 2 * (Math.random() - 0.5) * (RANDOM_SEGMENT_COMPONENT_MAX - RANDOM_SEGMENT_COMPONENT_MIN);
    var dz = 2 * (Math.random() - 0.5) * (RANDOM_SEGMENT_COMPONENT_MAX - RANDOM_SEGMENT_COMPONENT_MIN);
    this.addChild(this.x + dx, this.y + dy, this.z + dz).addRandomTree(segmentBudgetPerChild, depth+1);
  }
}

TreeCurveNode.prototype.to = function(other)
{
  return new THREE.Vector3( other.x - this.x, other.y - this.y, other.z - this.z );
}

TreeCurveNode.prototype.distanceTo = function(other)
{
  var dx = this.x - other.x;
  var dy = this.y - other.y;
  var dz = this.z - other.z;
  return Math.sqrt( dx * dx + dy * dy + dz * dz );
}

TreeCurveNode.prototype.totalLength = function()
{
  var _this = this;
  return this.children
    .map(function(child) { return _this.distanceTo(child) + child.totalLength() })
    .reduce(function(a, b) { return a+b }, 0.0);
}

TreeCurveNode.prototype.maxDepth = function()
{
  var _this = this;
  return this.children
    .map(function(child) { return _this.distanceTo(child) + child.maxDepth() })
    .reduce(function(a, b) { return Math.max(a, b) }, 0.0);
}
