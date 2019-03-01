import { Directive, ElementRef, AfterViewInit, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';

import * as d3 from "d3";
import { fn } from '@angular/compiler/src/output/output_ast';

@Directive({
  selector: '[D3BarChart]'
})
export class D3BarChartDirective implements OnInit, OnChanges {

    @Input() options;
    @Input() size: any;
  
    private host;
    private svg;
    constructor(private element: ElementRef) { }
  
    ngOnInit() {
    }
  
    ngOnChanges(changes: SimpleChanges) {
      if (changes.options && changes.options ||  changes.size && changes.size.currentValue ) {
        this.createChart();
      } 
    }
    createChart() {
      if ( ! this.size || !this.size.width || !this.options ) {
        return;
      }
      const margin = {top:0,bottom:0,left:3,right:5};
      let yAxisWidth = 0, labelHeight = 0;
      const chartAreaHeight = this.size.height - margin.top - margin.bottom;
      
      let dataset = this.options.data;
      /*
      dataset = dataset.sort(function (a, b) {
        return d3.descending(a.value, b.value);
      });
      */
      const min = dataset.length ? d3.min(dataset, (d:any) => Number(d.value)) : 0;
      const max = dataset.length ? d3.max(dataset, (d:any) => Number(d.value)) : 0;
      const refValue = min >=0  ? Math.pow(10, Math.floor(Math.log10(max))) : 1;
      const formatter = d3.formatPrefix(".2s", refValue);

      const mousemove = function(d){
        tooltip.style("left", d3.event.offsetX + 10 + "px");
        tooltip.style("top", d3.event.offsetY + 10 + "px");
        let taghtml = '';
        for (const k in d.tooltipData ) {
          taghtml += '<p>' + k + ': ' +  d.tooltipData[k] + '</p>';
        }
        tooltip.html( d.label + '<p>Value: ' +  formatter(d.value) + '</p>' + taghtml);
      };
      const mouseover = function(d) { tooltip.style("display", "inline-block");}
      const mouseout = function(d){
        tooltip.style("display", "none");
      };

      
      this.host = d3.select(this.element.nativeElement);
      this.host.html('');
      const tooltip = this.host                               
                          .append('div')                                               
                          .attr('class', 'tooltip'); 
  

      const y = d3.scaleBand()
                  .rangeRound([0, chartAreaHeight])
                  .padding(0.1)
                  .domain(dataset.map(d => d.value));
  
      const barHeight = y.bandwidth();
      const yAxis = d3.axisLeft(y)
                    .tickSize(0)
                    .tickFormat( (d:any) => formatter(d));
      const svg = this.host
                      .append("svg")
                      .attr("width", this.size.width)
                      .attr("height", this.size.height);

      // rerendering causing issue as we clear the chart container. the svg container is not available to calculate the yaxis label width
      setTimeout( () => {
        // calculate the max label length and remove
        svg.append("text").attr("class", "axisLabel")
                        .text(formatter(max))
                        .each(function() { yAxisWidth = this.getBBox().width; labelHeight = Math.floor(this.getBBox().height); })
                        .remove();
        const fontSize = barHeight >= labelHeight ? '1em' :  barHeight*0.75 + 'px'; //y.bandwidth()  * 0.4 + "px";
        const chartAreawidth = this.size.width  - yAxisWidth - margin.left - margin.right;
        const x = d3.scaleLinear()
                    .range([0, chartAreawidth])
                    .domain([0, d3.max(dataset, (d:any) => parseInt(d.value))]);
        
        const g = svg  
                    .append("g")
                    .attr("transform", "translate(" + (margin.left + yAxisWidth + 3) + "," + margin.top + ")");
        
        // reduce the font-size when bar height is less than the fontsize
        g.append("g")
                    .attr("class", "yaxis")
                    .call(yAxis)
                    .selectAll("text")
                    .attr("class", "axisLabel")
                    .attr("font-size", fontSize);
        
        const bars = g.selectAll(".bar")
                      .data(dataset)
                      .enter()
                      .append("g");

        bars.append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.value))
            .attr("height", barHeight)
            .attr("x", 0)
            .attr("width", d => x(d.value))
            .style('stroke', (d:any) => d.color )
            .style("fill", (d:any) => d.color)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout);

        bars.append("text")
            .attr("class", "label")
            .attr("y",  d => y(d.value) + y.bandwidth()/2 )
            .attr("x", 0)
            .attr("font-size", fontSize)
            .attr("dy",".32em")
	          .attr("dx","0.25em")
            .text( ( d, i ) => d.label )
            .style('fill', (d:any) =>  { 
              const color = d3.rgb(d.color=== 'auto' ? '#000000' : d.color);
              return 'rgb('+ Math.floor(255- color.r) +','+ Math.floor(255- color.g) +','+ Math.floor(255-color.b) + ')' ;
            })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout);
      }, 0);
    }
  }
  