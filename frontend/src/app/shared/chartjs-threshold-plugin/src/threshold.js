'use strict';

var ThresholdLine = require('./element.thresholdline.js');

module.exports = function(Chart) {

	var chartHelpers = Chart.helpers;
	var ctx;
	var selection;
	var dragging = false;
	var editMode = false;
	var scaleId = "y-axis-0";
	var selectionBorder = 2;
	var maxLines;
	var lineConfig;
	var newCanvas;

	/**
     *
     * Initalizes the threshold configurations 
     * @param {Object} chart - chart instance
     */
	function initialize(chart) {
		var targetCanvas = chart.ctx.canvas;

		newCanvas = document.createElement('canvas');
		var parentDiv = targetCanvas.parentNode;
		parentDiv.appendChild(newCanvas);
		newCanvas.style.position = "absolute";
		newCanvas.style.left =   '0px';
		newCanvas.style.top =  '0px';
		newCanvas.style.zIndex = 1;
		setCursor(newCanvas, "pointer");
		setSize(chart);

		chart.threshold={
				elements:{},
				overlayCanvas:newCanvas,
				options: chartHelpers.configMerge(chart.options.threshold || {}),
				firstRun:false
			};
	}

	/**
     *
     * Sets the width and height of the canvas 
     * @param {Object} chart - chart instance
     */
	function setSize(chart) {
		var pixelRatio = chart.currentDevicePixelRatio || 1;
		newCanvas.width  = chart.width * pixelRatio;     
		newCanvas.height = chart.height * pixelRatio;
		newCanvas.getContext('2d').scale(pixelRatio, pixelRatio);
		newCanvas.style.height = chart.height + 'px';
		newCanvas.style.width = chart.width + 'px';
	}

	/**
     *
     * Updates the threshold configurations 
     * @param {Object} chart - chart instance
     */
	function updateConfig(chart) {
		maxLines = chart.options.threshold && chart.options.threshold.maxLines || Number.MAX_VALUE;
		editMode = chart.options.threshold && chart.options.threshold.draw || false;
		scaleId = chart.options.threshold && chart.options.threshold.scaleId || "y-axis-0";
		lineConfig = chart.options.threshold && chart.options.threshold.line ? chartHelpers.configMerge(Chart.Threshold.lineDefaults,chart.options.threshold.line) : Chart.Threshold.lineDefaults;
		ctx = editMode ? chart.threshold.overlayCanvas.getContext('2d') : chart.ctx;
		chart.threshold.overlayCanvas.style.display = editMode ? "block" : "none";
		selection = null;
	}

	/**
     *
     * Draws the threshold lines on the canvas 
     * @param {Object} ctx - canvas context. It can be either main/new canvas
     * @param {Array} elements - Array of threshold line elements
     */
	function draw(ctx, elements) {
		if ( editMode ) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		}
		for ( var i in elements ) {
			elements[i].draw(ctx);
		}
	}
	
	/**
     *
     * Sets the cursor on the element 
     * @param {Object} el - element the cursor has need to set
     * @param {String} v - cursor value
     */
	function setCursor(el,v) {
		el.style.cursor = v;
	}

	/**
     *
     * Sets the border on the selected threshold line
     * @param {Object} el - threshold element
     */
	function select(el) {
		clearSelection();
	    selection = el;
	    selection.setBorder(1);
	    dragging = true;
	}

	/**
     *
     * Unselects any previously selected threshold line 
     * @param {Object} el - threshold element
     */
	function clearSelection() {
		
		if (selection) {
			selection.setBorder(0);
		}
		
		selection = null;
		dragging = false;

	}

	function fireEvent(chart) {
		var evt = new CustomEvent("onThresholdSet", {"detail":chart.threshold.elements});
		chart.ctx.canvas.dispatchEvent(evt);	
	}

	return {

		id: 'threshold',

		afterInit: function(chart) {

			initialize(chart);

			/* handler to delete the selected threshold line */
			chart.threshold._winKeyDownEventHandler = function(e) {
				if (selection && e.keyCode == 8 ) {
					delete chart.threshold.elements[selection.id];
					clearSelection();
					draw(ctx,chart.threshold.elements);
				}				
			};

			/* 	handler to draw threshold line or 
				selects/unselects the line if the line is there in the area */
			chart.threshold._mouseDownEventHandler = function(e) {
			    var mx = e.offsetX;
			    var my = e.offsetY;
			    for (var i in chart.threshold.elements ) {
			      if (chart.threshold.elements[i].inRange(mx, my, selectionBorder)) {
				    select(chart.threshold.elements[i]);
			        draw(ctx,chart.threshold.elements);
			        return;
			      }
			    }

			    if (  editMode ) {
			    	if (selection) {
			    		// prevents drawing a new line if the selection is made already i.e unselects the line
			    		clearSelection();
			    	} else if ( Object.keys(chart.threshold.elements).length<maxLines ) {
			    		var id = 'line-'+ new Date().getTime();
				    	var options =	{ 
				    						id : id,
				    						scaleId : scaleId,
				    						value:chart.scales[scaleId].getValueForPixel(e.offsetY)
				    					};
						chart.threshold.elements[id] = new ThresholdLine(chart, chartHelpers.configMerge(Chart.Threshold.lineDefaults,options));
						fireEvent(chart);
					}
					draw(ctx,chart.threshold.elements);
			    }
  			};

			/* 	
				handler for dragging the selected line  or 
				sets the move cursor if the line is already there or 
				set the pointer if no line is drawn in that area
			*/
  			chart.threshold._mouseMoveEventHandler = function(e) {
				if (dragging){
					if (e.offsetY <= chart.chartArea.bottom && e.offsetY >= chart.chartArea.top) {
 						selection.value = chart.scales[selection.scaleId].getValueForPixel(e.offsetY) ; 
 						selection.update();
						draw(ctx,chart.threshold.elements);
					}
				} else {
			    	var mx = e.offsetX;
			    	var my = e.offsetY;
					for (var i in chart.threshold.elements ) {
				      if (chart.threshold.elements[i].inRange(mx, my,selectionBorder)) {
				        setCursor(chart.threshold.overlayCanvas, "move");
				        return;
				      }
				    }
				    setCursor(chart.threshold.overlayCanvas, "pointer");
				}
			};

			// fires a new event when new threshold line is set
			chart.threshold._mouseUpEventHandler = function(e) {
				if ( dragging ) {
					dragging = false;
        			fireEvent(chart);
        		}
			};

			chartHelpers.addEvent(document, 'keydown', chart.threshold._winKeyDownEventHandler);
			chartHelpers.addEvent(chart.threshold.overlayCanvas, 'mousedown', chart.threshold._mouseDownEventHandler);
			chartHelpers.addEvent(chart.threshold.overlayCanvas,'mousemove', chart.threshold._mouseMoveEventHandler);
			chartHelpers.addEvent(chart.threshold.overlayCanvas,'mouseup', chart.threshold._mouseUpEventHandler);
		},

		afterScaleUpdate: function(chart) {
			for ( var i in chart.threshold.elements ) {
				chart.threshold.elements[i].update();
			}
		},		

		afterUpdate: function(chart) {
			//unselects any previousely selected lines. this is required when we switch from edit mode
			clearSelection(); 
			updateConfig(chart);
			if ( chart.options.threshold && chart.options.threshold.thresholds && !chart.threshold.firstRun ) {
				var thresholds = chart.options.threshold.thresholds;
				var width = chart.chartArea.right - chart.chartArea.left;
				for (var i=0, len=thresholds.length; i<len; i++ ) {
					var id =  thresholds[i].id || 'line-'+ new Date().getTime();
					if ( !chart.threshold.elements[id] ) {
						thresholds[i].id = id;
						chart.threshold.elements[id] = new ThresholdLine(chart,chartHelpers.configMerge(lineConfig,thresholds[i]));
					}
				}
				chart.threshold.firstRun = true;
			}
		},

		afterDraw: function(chart) {
			/* draws the threshold lines */
			draw(ctx,chart.threshold.elements);
		},

		resize: function(chart) {
			setSize(chart);
		},

		destroy: function(chart) {
			chartHelpers.removeEvent(document, 'keydown', chart.threshold._winKeyDownEventHandler);
			chartHelpers.removeEvent(chart.threshold.overlayCanvas, 'mousedown', chart.threshold._mouseDownEventHandler);
			chartHelpers.removeEvent(chart.threshold.overlayCanvas,'mousemove', chart.threshold._mouseMoveEventHandler);
			chartHelpers.removeEvent(chart.threshold.overlayCanvas,'mouseup', chart.threshold._mouseUpEventHandler);
			delete chart.threshold;
		}

	};
};
