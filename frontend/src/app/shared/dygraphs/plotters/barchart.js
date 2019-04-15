var barChartPlotter = function(e) {
    var ctx = e.drawingContext;
    var points = e.points;
    var y_bottom = e.dygraph.toDomYCoord(0);

    ctx.fillStyle = e.color;

    // find the minimum separation between x-values
    // to determine bar width
    var min_sep = Infinity;
    for (var i = 1; i < points.length; i++) {
        var sep = points[i].canvasx - points[i - 1].canvasx;
        if (sep < min_sep) min_sep = sep;
    }
    var bar_width = Math.floor(2.0 / 3 * min_sep);

    // now do plotting
    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var center_x = p.canvasx;

        ctx.fillRect(center_x - bar_width / 2, p.canvasy,
                    bar_width, y_bottom - p.canvasy);
        
        ctx.fillRect(center_x - bar_width / 2, p.canvasy,
                    bar_width, y_bottom - p.canvasy);                   
    }
}

module.exports = barChartPlotter;