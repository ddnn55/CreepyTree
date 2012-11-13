var RANDOM_SEGMENT_COMPONENT_MAX = 20.0;
var RANDOM_SEGMENT_COMPONENT_MIN = 3.0;

TreeCurve = function(x, y, z)
{
  this.root = new TreeCurveNode(x, y, z);
}

TreeCurve.random = function(segments)
{
  var curve = new TreeCurve(0.0, 0.0, 0.0);
  curve.root.addRandomTree(segments);
  return curve;
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
  
  
  if(depth > 10)
  {
    console.log('budget', segmentBudgetPerChild);
    //return; // hack. why does this happen
  }
  
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
