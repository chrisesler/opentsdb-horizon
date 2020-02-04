import { Directive, ElementRef, AfterViewInit, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { UnitConverterService } from '../../../../core/services/unit-converter.service';

import * as d3 from "d3"; 

@Directive({
  selector: '[D3PieChart]'
})
export class D3PieChartDirective implements OnInit, OnChanges {

  @Input() options;
  @Input() size: any;

  private host;
  private svg;
  constructor(private element: ElementRef, private uConverter: UnitConverterService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.options && changes.options ||  changes.size && changes.size.currentValue ) {
      this.createChart();
    } 
  }
  createChart() {
    if ( ! this.size || !this.size.width || !this.options) {
      return;
    }
    const margin = {top:5,bottom:5,left:5,right:5};
    const width = this.size.width - margin.left - margin.right,
    height = this.size.height,
    chartSize = Math.min(width, height),
    radius = Math.min(width, height) / 2;
    const donutWidth = this.options.type === 'pie' ? radius : radius * 0.50;
    const legendItemHeight = 20;
    let maxLegendItemLen = 0;
    const self = this;

    const mousemove = function(d){
      tooltip.style("left", d3.event.offsetX + 10 + "px");
      tooltip.style("top", d3.event.offsetY + 10 + "px");
      let taghtml = '';
      for (const k in d.data.tooltipData ) {
        taghtml += '<p>' + k + ': ' +  d.data.tooltipData[k] + '</p>';
      }
      tooltip.html( d.data.label + '<p>Value: ' +  d3.format('.3s')(d.data.value) + '</p>' + taghtml);
    };
    const mouseover = function(d) { tooltip.style("display", "inline-block");}
    const mouseleave = function(d){
      tooltip.style("display", "none");
    };

    // Computes the angle of an arc, converting from radians to degrees.
    const angle = function(d) {
      var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
      return a > 90 ? a - 180 : a;
    }

    const dataset = this.options.data;
    this.host = d3.select(this.element.nativeElement);

    this.host.html("");
    const tooltip = this.host                               
                        .append('div')                                               
                        .attr('class', 'tooltip'); 

    var svg = this.host
            .append("svg")
            .attr("width", chartSize)
            .attr("height", chartSize);

    var donut = svg
            .append("g")
            .attr("transform", "translate(" + chartSize / 2 + "," + chartSize / 2 + ")");

    const arc = d3.arc()
                  .outerRadius(radius - 10)
                  .innerRadius(radius - donutWidth);

    const pie = d3.pie()
                  .sort(null)
                  .value(function(d:any) { return d.value; });

    var arcs = donut.selectAll("arc")
                    .data(pie(dataset))
                    .enter()
                    .append("g")
                    .attr("class", "arc");

    //draw arc paths
    let path = arcs.append("path")
                    .attr("fill", function(d, i) {
                    return d.data.color;
                    })
                    .attr("d", arc)
                    .each(function(d) { this._current - d; })
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave);

    dataset.forEach(function(d) {
      d.value = +d.value; 
      d.enabled = true;
      maxLegendItemLen = maxLegendItemLen < d.label.length ? d.label.length : maxLegendItemLen;
    });
    let total = d3.sum(dataset.map( d =>  (d.enabled) ? d.value : 0 ));
                  
    let labels;
    if ( this.options.legend.showPercentages ) {
      labels = arcs.append("text")
                      .attr("transform", function(d) {
                          const diff = d.endAngle - d.startAngle;
                          const rotate = diff > 0.4 ? '' : 'rotate(' + angle(d) + ')';
                          return "translate(" + arc.centroid(d) + ")" + rotate;
                      })
                      .attr("dy", ".30em")
                      .style("text-anchor", "middle")
                      .style("font-size", "0.9em")
                      .style('opacity', (d) => (d.endAngle - d.startAngle) * chartSize > 25 && d.data.enabled? 1 : 0)
                      .text(d => d3.format(".1%")(d.value/total))
                      .on("mouseover", mouseover)
                      .on("mousemove", mousemove)
                      .on("mouseleave", mouseleave);
    }
    const legendClickHandler = function(s:any, index) {
      const rect:any = d3.select(this.parentNode.childNodes[index]);
      let enabled = true; 
      const totalEnabled = d3.sum(dataset.map(function(d) { 
        return (d.enabled) ? 1 : 0; 
      }));

      if (rect.attr('class') === 'disabled') { 
        rect.attr('class', ''); 
      } else { 
        if (totalEnabled < 2) return; 
        rect.attr('class', 'disabled'); 
        enabled = false; 
      }

      pie.value(function(d:any) { 
        if (d.label === s.label) d.enabled = enabled; 
          return (d.enabled) ? d.value : 0; 
      });
      path = path.data(pie(dataset)); 
      total = d3.sum(dataset.map( d =>  (d.enabled) ? d.value : 0 ));
      path.transition() 
          .duration(0)  
          .attrTween('d', function(d) { 
            var interpolate = d3.interpolate(this._current, d); 
            this._current = interpolate(0); 
            return function(t) {
              return arc(interpolate(t));
            };
          });
      
      if ( self.options.legend.showPercentages ) {
        labels = labels.data(pie(dataset));
        labels
          .transition() 
          .duration(0)
          .style('opacity', (d) => (d.endAngle - d.startAngle) * chartSize > 25 && d.data.enabled? 1 : 0)
          .attr("transform", function(d) {
            const diff = d.endAngle - d.startAngle;
            const rotate = diff > 0.4 ? '' : 'rotate(' + angle(d) + ')';
            return "translate(" + arc.centroid(d) + ")" + rotate;
          })
          .text(d => d3.format(".1%")(d.value/total));
      }
    };

    const legend = d3.select(this.options.legendDiv);
    legend.html('');
    if ( this.options.legend.display ) {
      const legendg = legend
                            .append("svg")
                            .attr("width", (3+maxLegendItemLen) * 9 )
                            .attr("height", legendItemHeight*dataset.length)
                            .append("g")
                            .attr("class", "legend");
      
      legendg.selectAll('rect')
          .data(dataset)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d, i) => (i *  legendItemHeight))
          .attr("width", 10)
          .attr("height", 10)
          .style('stroke', (d:any) => d.color )
          .style("fill", (d:any) => d.color)
          .on('click', legendClickHandler);
      
      legendg.selectAll('text')
          .data(dataset)
          .enter()
          .append("text")
          .attr("x", 15)
          .attr("width", 10)
          .attr("height", 10)
          .attr("y", (d, i) => (i *  legendItemHeight + 10))
          .text((d:any)=> d.label)
          .on('click', legendClickHandler);
    }
  }
}
