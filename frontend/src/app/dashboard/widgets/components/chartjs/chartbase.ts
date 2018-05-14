import { Component, OnInit,  OnDestroy, DoCheck, ElementRef, Input, Output, KeyValueDiffer, KeyValueDiffers, EventEmitter } from '@angular/core';
export class ChartBase implements OnInit,  DoCheck {

	/** 
	 * component configurations
	 */
	@Input() widget: any;
	
	/** 
	 * chart options. changes the default chart behavior. refer the {@link http://www.chartjs.org/docs/latest/configuration/|documentation}  for supporting options.
	 * @example 
	 * <pre><code>
	 * {
	 *  animation: {..},
	 *  legend: {..},
	 *  layout: {..},
	 *  ..
	 * }
	 * </code></pre>
	 * @example <caption>Setting widht and height</caption>
	 * <pre><code>
	 * {
	 *   width: "800px",
	 *   height: "400px",
	 *   .. 
	 * }
	 * </code></pre>
	 * @example <caption>Setting Categories</caption>
	 * <pre><code>
	 * {
	 *   categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] ,
	 * }
	 * </code></pre>
	 */
	options:any={width:"100%",height:"100%"};
	
	/**
	 *
	 * an array of datasets. 
	 * data property of dataset can be of array of numbers, here the x axis is generally a category or
	 * an array of object containing x and y properties. some charts supports both the options and some are not. 
	 * refer the {@link http://www.chartjs.org/docs/latest/charts/line.html#data-structure|data structure} section of each chart type for more details.
	 * @example <caption>Dataset - Array of objects [{x,y},..] </caption>
	 * <pre><code>
	 * [
	 *  { 
	 *    label: "Series-1",
	 *    data:[ {x: 1513533630000,y: 20} , {x: 1513534630000,y: 30}, {x: 1513535630000,y: 30}] 
	 *  },
	 *  { 
	 *    label: "Series-2",
	 *    data:[ {x: 1513533630000,y: 20} , {x: 1513534630000,y: 30}, {x: 1513535630000,y: 30}] 
	 *  },
	 *  ..
	 * ]
	 * </code></pre>
	 * @example <caption>Dataset - Array of Numbers [ x1, x2, ..., xn ] </caption>
	 * <pre><code>
	 * [
	 *  { 
	 *    label: "Series-1",
	 *    data:[ 20 , 30, 33, 15 ,100] 
	 *  },
	 *  { 
	 *    label: "Series-2",
	 *    data:data:[ 22 , 10, 23, 5 ,35] 
	 *  },
	 *  ..
	 * ]
	 * </code></pre>
	 */
	data:any=[{ data:[ {x: 1513533630000,y: 20} , {x: 1513534630001,y: 10}, {x: 1513535630002,y: 30}] }];

	/**
	 * Outputs the threshold detail.
	 */
	@Output() public ThresholdSet:EventEmitter<any> = new EventEmitter();

	/** 
	 * chart type
	 * supported options are line,bar,box and grid 
	 */
	type:string = "line";

	/** 
	 * chartjs instance 
	 */
	chart:any;

	/** 
	 * sets the width of the chart 
	 * @ignore
	 */
	width:string = "800px";

	/** 
	 * sets the height of the chart 
	 * @ignore
	 */
	height:string = "400px";

	/** 
	 * default chart options 
	 * @ignore
	 */
	defaultOptions:object = {
        animation: {
            duration: 0,
        },
        hover: {
            animationDuration: 0,
        },
        legend: {
            display: false
        },
        responsive: true,
        responsiveAnimationDuration: 0,
		maintainAspectRatio:false
    };

    /**
     * @ignore
     */
    colors:any = ["#000000","#8B0000","#C71585","#006400"];

    /**
     * @ignore
     */
    _differ:any={};

    /**
     * @ignore
     */
    _meta:any = {};

	constructor(public element:ElementRef,  public differs: KeyValueDiffers) { 
		
	}

	ngOnInit() {

		this._differ.options = this.differs.find({}).create();
		this._differ.data = this.differs.find({}).create();
		this._differ.options.diff(this.options);
		this._differ.data.diff(this.data);

		this.render();
	}

	ngDoCheck() {

		let changes = this._differ.options.diff(this.options) ;
		if ( changes )  {
	    	this.chart.options = Object.assign(this.chart.options, this.options);
	    	this.chart.data.labels = this.options.categories || [];
	    	this.chart.update(0);
	    	console.log("options having new value...")
	    }
	    changes = this._differ['data'].diff(this.data) ;
	    if ( changes ) {
			console.log("data changed...", changes)
	    	this.chart.data.datasets.forEach((dataset) => {
        		dataset.data.pop();
    		});

    		this.updateDatasets(this.data);

   	    	this.data.forEach((dataset, i) => {
	    		this.chart.data.datasets[i] = dataset;
	    	});

		   	this.chart.update(0);
		} 
	}

	
	private render() {
	    let options = Object.assign(this.defaultOptions, this.options);
		this.updateDatasets(this.data);
		let ctx = this.element.nativeElement.querySelector('canvas').getContext('2d');
		if (this.chart) {
			this.chart.destroy();
		}
		this.chart  = new Chart(ctx, {
				        				type: this.type,
				        				options: options,
				        				data : { 
				        							labels : options.categories,
				        							datasets : this.data 
				        						}
			        				});
		let self = this;

		this.chart.canvas.addEventListener("onThresholdSet", function(e) {
			self.ThresholdSet.emit(e.detail);
		});
	}

	updateDatasets(datasets) {

		this._meta = {
						colors: this.colors.concat(),
						metricColors: {}
					};

		datasets.forEach((dataset, i) => {
			this.setColor(dataset);
		});

	}
	
	setSize(width, height) {
		this.width = width? width : this.width;
		this.height = height? height : this.height;	
		console.log("setSize",this.width, this.height)
	}

	setColor(dataset) {
		let metric = dataset.metric || dataset.label;
		let color;
		if ( this.type == 'line' || this.type == 'bar' ) {
			color = dataset.color || this._meta.metricColors[metric]? this.getRandomColor(this._meta.metricColors[metric]) : this.getColor();
			dataset.backgroundColor = color;
			dataset.borderColor = color;
		} else if ( this.type == 'pie' || this.type == 'doughnut') {
			let colors = dataset.color || this.getColors(dataset.data.length);
			dataset.backgroundColor = colors;
			dataset.boderColor = colors;
		}
		this._meta.metricColors[metric] = this._meta.metricColors[metric] || color;
	}

	getColor() {
		let color = this._meta.colors.shift() || this.getRandomColor(null);
		return color;
	}

	getColors(count) {
		let colors = [];
		for (let i=0; i<count; i++ ) {
			colors.push(this.getColor());
		}
		return colors;
	}
	
	getRandomColor(color) {
		let hue = this.getRandomInt(0, 360);

		if ( color ) { 
			
			var num = parseInt(color, 16);
    		var r = ( ( num >> 16 ) & 255 )/ 255;
    		var g = ( ( num >> 8 ) & 255 )/ 255;
    		var b = ( num & 255 ) / 255;

			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const diff = max - min;

	  		 hue =   min === max ? 0 : r === max ?  (((60 * (g - b)) / diff) + 360) % 360    
  								: g === max ?      ((60 * (b - r)) / diff) + 120
								:  ((60 * (r - g)) / diff) + 240;

		}
		return 'hsl(' + hue + ',' + this.getRandomInt(0, 100) + '%,' + this.getRandomInt(0, 90) + '%)';
	}

	getRandomInt(min, max) {
  		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

}