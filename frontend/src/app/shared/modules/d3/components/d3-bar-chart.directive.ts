import { Directive, ElementRef, AfterViewInit, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { UnitConverterService } from '../../../../core/services/unit-converter.service';


import * as d3 from "d3";

@Directive({
  selector: '[D3BarChart]'
})
export class D3BarChartDirective implements OnInit, OnChanges {

    @Input() options;
    @Input() size: any;
  
    private host;
    private svg;
    constructor(private element: ElementRef, private unitService: UnitConverterService ) { }
  
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
      let dataset = this.options.data;
      const margin = {top:0,bottom:0,left:3,right:5};
      const minBarHeight = 15;
      let chartHeight = minBarHeight * dataset.length;
      let yAxisWidth = 0, labelHeight = 0;
      chartHeight = chartHeight > this.size.height || !this.size.height ? chartHeight  : this.size.height - 7; // -7 avoids the scrollbar
      const chartAreaHeight = chartHeight - margin.top - margin.bottom;

      const min = dataset.length ? d3.min(dataset, (d:any) => Number(d.value)) : 0;
      const max = dataset.length ? d3.max(dataset, (d:any) => Number(d.value)) : 0;
      // const refValue = min >=0  ? Math.pow(10, Math.floor(Math.log10(max))) : 1;
      // const formatter = d3.formatPrefix(".2s", refValue);
      const unitOptions = this.options.format;
      const dunit = this.unitService.getNormalizedUnit(max, unitOptions);
      const self = this;
      const mousemove = function(d){
        const containerPos = self.element.nativeElement.parentNode.parentNode.getBoundingClientRect();
        tooltip.style("left", d3.event.x - containerPos.x  + "px");
        tooltip.style("top", d3.event.y  - containerPos.y  + 30 + "px");
        let taghtml = '';
        for (const k in d.tooltipData ) {
          taghtml += '<p>' + k + ': ' +  d.tooltipData[k] + '</p>';
        }
        tooltip.html( d.label + '<p>Value: ' +  self.unitService.convert(d.value, unitOptions.unit, dunit, unitOptions )   + '</p>' + taghtml);
      };
      const mouseover = function(d) { tooltip.style("display", "inline-block");}
      const mouseout = function(d){
        tooltip.style("display", "none");
      };

      this.host = d3.select(this.element.nativeElement);
      this.host.html('');
      const tooltip = d3.select(this.element.nativeElement.parentNode.parentNode).select('.tooltip');


      const y = d3.scaleBand()
                  .rangeRound([0, chartAreaHeight])
                  .paddingInner(0.1)
                  .domain(dataset.map((d, i) => i));

      const barHeight = y.bandwidth();
      const yAxis = d3.axisLeft(y)
                    .tickSize(0)
                    .tickFormat( (d, i) => self.unitService.convert(dataset[i].value, unitOptions.unit, dunit, unitOptions ));

      const svg = this.host
                      .append("svg")
                      .attr("width", this.size.width)
                      .attr("height", chartHeight);

      // rerendering causing issue as we clear the chart container. the svg container is not available to calculate the yaxis label width
      setTimeout( () => {
        // calculate the max label length and remove
        svg.append("text").attr("class", "axisLabel")
                        .text(self.unitService.convert(max, unitOptions.unit, dunit, unitOptions ))
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
            .attr("y", (d,i) => y(i))
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
            .attr("y",  (d,i) => y(i) + y.bandwidth()/2 )
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
      }, 100);
    }
  }
  