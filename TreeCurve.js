TreeCurve = function(x, y, z)
{
  this.root = new TreeCurveNode(x, y, z);
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

TreeCurveNode.prototype.distanceTo = function(other)
{
  var dx = this.x - other.x;
  var dy = this.y - other.y;
  var dz = this.z - other.z;
  return Math.sqrt( dx * dx + dy * dy + dz * dz );
}
