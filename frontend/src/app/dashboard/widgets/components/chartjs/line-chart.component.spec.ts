import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {DebugElement} from "@angular/core";
import {By} from "@angular/platform-browser";

import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;
  let canvasEl: DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
    canvasEl = fixture.debugElement.query(By.css('canvas'));
  });
  

  it('verify chart size', (done) => {
    let options = {
                    "width" :"500px",
                    "height": "250px"
                  };
    component.options = options;
    component.data = [{ data:[ {x: 1513533630000,y: 20} , {x: 1513534630000,y: 30}, {x: 1513535630000,y: 30}] }];
    fixture.detectChanges();  
    setTimeout(()=> {
      expect(component.chart.width).toEqual(500);
      expect(component.chart.height).toEqual(250);
      done();
    },100);
  });

  it('verify threshold draw mode', () => {
    let options = {
          threshold : {
            draw:true,
            scaleId:"Y1"
          }
    };
    component.options = options;
    component.data = [{ data:[ {x: 1513533630000,y: 20} , {x: 1513534630000,y: 30}, {x: 1513535630000,y: 30}] }];
    fixture.detectChanges();  
    expect(component.chart.options.threshold).toEqual(options.threshold);
  });

  it('verify config update', () => {
    let options = {
          threshold : {
            draw:true,
            scaleId: "y-axis-0"
          }
    };
    component.options = options;
    component.data = [{ data:[ {x: 1513533630000,y: 20} , {x: 1513534630000,y: 30}, {x: 1513535630000,y: 30}] }];
    fixture.detectChanges();  
    expect(component.chart.options.threshold).toEqual(options.threshold);
    
    options = {
          threshold : {
            draw:false,
            scaleId: "y-axis-0"
          }
    };
    component.options = options;
    fixture.detectChanges();  
    expect(component.chart.options.threshold).toEqual(options.threshold);
  });

  
  it('verify data update', (done) => {
    let data = [
                  { 
                    label: "Series-1",
                    data:[ {x: 1513533630000,y: 20} , {x: 1513534630000,y: 30}, {x: 1513535630000,y: 30}] 
                  }
                ];
    component.data = data;
    fixture.detectChanges(); 
    setTimeout(()=> {
      expect(component.chart.data.datasets[0].data).toEqual(data[0].data);
      done();
    },100);
    data = [{ label: "Series-1",data:[ {x: 1513533630000,y: 40} , {x: 1513534630000,y: 50}, {x: 1513535630000,y: 60}] }];
    component.data = data;
    fixture.detectChanges();
    setTimeout(()=> {
      expect(component.chart.data.datasets[0].data).toEqual(data[0].data);
    },100);
  });
});
