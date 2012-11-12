TreeCurve = function(x, y, z)
{
  this.root = new TreeCurveNode(x, y, z);
}

TreeCurve.prototype.totalLength = function()
{
  return this.root.totalLength();
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
  this.children.push( new TreeCurveNode( x, y, z ) );
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
