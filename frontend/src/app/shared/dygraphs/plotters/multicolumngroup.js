/**
 * Multi-column Bar Chart plotter is adapted from http://dygraphs.com/tests/plotters.html
 * 
 * Modified to apply only to a supplied group of sets
 */

//var multiColumnGroupPlotter = (function() {
  // Multiple column bar chart
  var multiColumnGroupPlotter = function (e) {

    /*
    // BEGIN HEADER BLOCK
    // This first block can be copied to other plotters to capture the group 
    var g = e.dygraph;
    
    var group;
    var groupIdx = [];
    var sets = [];
    var allSets = e.allSeriesPoints;
    var minIdx = Infinity;
    var setName = e.setName;
    var setNames = g.getLabels().slice(1);
  
    var plotter = g.attr_("plotter", setName);
    var axis = g.attr_("axis", setName) ? g.attr_("axis",setName) : 'y';
  
  
  
    
    
    //var currGroup = g.attr_("group", setName);
    var currGroup = plotter.name;// + "-" +  axis;
  
    //console.log(currGroup, setName, g.attr_('axis',setName), g.attr_('axis'));
  
    
    for (var setIdx = 0; setIdx < allSets.length; setIdx++) {
      // get the name and group of the current setIdx
      setName = setNames[setIdx];
      var plotter = g.attr_("plotter", setName);
      var axis = g.attr_("axis", setName) ? g.attr_("axis",setName) : 'y';
      var group = plotter.name;// + "-" + axis;
  
      if (group === currGroup) {
        //save the indv index and the points
        groupIdx.push(setIdx);
        sets.push(allSets[setIdx]);
        
        // capturing the min indx helps to ensure we don't render the plotter
        // multiple times
        if (setIdx < minIdx) minIdx = setIdx;
      }
    }
  
    //console.log(group, groupIdx);
    
    // We'll employ the plotter only on the first of the group
    if (e.seriesIndex !== minIdx) return;
    // END HEADER BLOCK
   
    var ctx = e.drawingContext;
    var axis = g.attr_("axis", e.setName);
    var y_bottom = g.toDomYCoord(0, axis == "y2" ? 1 : 0);
  
    // Find the minimum separation between x-values.
    // This determines the bar width.
    var min_sep = Infinity;
    for (var j = 0; j < sets.length; j++) {
      var points = sets[j];
      for (var i = 1; i < points.length; i++) {
        var sep = points[i].canvasx - points[i - 1].canvasx;
        if (sep < min_sep) min_sep = sep;
      }
    }
    var bar_width = Math.floor(2.0 / 3 * min_sep);
  
    var fillColors = [];
    var strokeColors = g.getColors();
    for (var i = 0; i < groupIdx.length; i++) {
      fillColors.push(strokeColors[groupIdx[i]]);
    }
  
    for (var j = 0; j < sets.length; j++) {
      ctx.fillStyle = fillColors[j];
      ctx.strokeStyle = fillColors[j];
      console.log(sets[j], ctx.fillStyle, ctx.strokeStyle)
      for (var i = 0; i < sets[j].length; i++) {
        var p = sets[j][i];
        var center_x = p.canvasx;
        var x_left = center_x - (bar_width / 2) * (1 - j/(sets.length-1));
  
        ctx.fillRect(x_left, p.canvasy,
          bar_width/sets.length, y_bottom - p.canvasy);
  
        ctx.strokeRect(x_left, p.canvasy,
          bar_width/sets.length, y_bottom - p.canvasy);
      }
    }
    */
   var ctx = e.drawingContext;
   var points = e.points;
   var y_bottom = e.dygraph.toDomYCoord(0);

   ctx.fillStyle = e.color;

   // Find the minimum separation between x-values.
   // This determines the bar width.
   var min_sep = Infinity;
   for (var i = 1; i < points.length; i++) {
     var sep = points[i].canvasx - points[i - 1].canvasx;
     if (sep < min_sep) min_sep = sep;
   }
   var bar_width = Math.floor(2.0 / 3 * min_sep);

var bar_width = 10;
   // Do the actual plotting.
   for (var i = 0; i < points.length; i++) {
     var p = points[i];
     var center_x = p.canvasx;
     console.log(p , bar_width);


     ctx.fillRect(center_x - bar_width / 2, p.canvasy,
         bar_width, y_bottom - p.canvasy);

     ctx.strokeRect(center_x - bar_width / 2, p.canvasy,
         bar_width, y_bottom - p.canvasy);
   }
  }
  //return multiColumnGroupPlotter;
//})();
module.exports = multiColumnGroupPlotter;