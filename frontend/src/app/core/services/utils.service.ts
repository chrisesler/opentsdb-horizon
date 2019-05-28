import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  // random generate 6 random chars
  generateId(len: number = 6, excludes = []) {
    const start = 3;
    let id = '';
    while ( id.length === 0 ) {
        id = Math.random().toString(36).substring(start, len + start);
        id = excludes.includes(id) ? '' : id;
    }
    return id;
  }

  convertPatternTSDBCompat(searchPattern) {
    searchPattern = searchPattern.replace(/\s+/g, ".*");
    if ((searchPattern).search(/^\s*\.\*/) === -1) {
        searchPattern = '.*' + searchPattern;
    }
    if ((searchPattern).search(/\.\*\s*$/) === -1) {
        searchPattern = searchPattern + '.*'
    }
    return searchPattern.toLowerCase();
}

  modifyWidgets(dashboard: any) {
    // add extra info item behaviors
    for (let i = 0; i < dashboard.widgets.length; i++) {
      const wd: any = dashboard.widgets[i];
      //wd.id = this.utils.generateId(); // we set it manually to test
      const mod = { 'xMd': wd.gridPos.x, 'yMd': wd.gridPos.y, 'dragAndDrop': true, 'resizable': true };
      wd.gridPos = { ...wd.gridPos, ...mod };
    }
    //return dashboard;
  }

  getWidgetQueryStatistics(queries) {
      let metricsVisibleLen = 0;
      let metricsVisibleAutoColorLen = 0;
      const metricsVisibleAutoColorIds = [];
      for ( let i = 0; i < queries.length; i++ ) {
          const qid = queries[i].id;
          for ( let j = 0; j < queries[i].metrics.length; j++ ) {
            const mid = queries[i].metrics[j].id;
            if ( queries[i].metrics[j].settings.visual.visible === true) {
                metricsVisibleLen++;
                if ( queries[i].metrics[j].settings.visual.color === 'auto' || !queries[i].metrics[j].settings.visual.color ) {
                    metricsVisibleAutoColorLen++;
                    metricsVisibleAutoColorIds.push(qid + '-' + mid);
                }
            }

          }
      }
    return {
            nVisibleMetrics: metricsVisibleLen,
            nVisibleAutoColors: metricsVisibleAutoColorLen,
            mVisibleAutoColorIds: metricsVisibleAutoColorIds
        };
  }

  getWidgetMetricDefaultLabel(queries, qIndex, mIndex: number) {
      let m = 0;
      let e = 0;
      for ( let i = 0; i < queries[qIndex].metrics.length; i++ ) {
        const isExpression = queries[qIndex].metrics[i].expression !== undefined;
        if ( !isExpression ) {
            m++;
        } else {
            e++;
        }
        if ( i == mIndex ) { // mIndex is string here
            break;
        }
      }
      let label = queries.length > 1 ? 'Q' + (parseInt(qIndex, 10) + 1) + ':' : '';
      label += queries[qIndex].metrics[mIndex].expression ? 'e' + e : 'm' + m;
      return label;
  }

  // searches an array of objects for a specify key value and
  // returns the matched object
  getObjectByKey(objs, key, value ) {
    for (let i = 0; i < objs.length; i++ ) {
        if ( objs[i][key] === value ) {
            return objs[i];
        }
    }
  }

  // ex: Revenue for {{tag.colo}} and {{tag.hostgroup}} -> Revenue for BF1 and WestCoastCluster
  tagMacro(metric: any, inputString: string): string {
    const regExp = /{{([^}}]+)}}/g; // get chars between {{}}
    const matches = inputString.match(regExp);
    if (matches) {
      let tagValues = new Array<string>();
      let captureGroupToValueMap = {};
      for (let i = 0; i < matches.length; i++) {
        const captureGroup = matches[i];
        const captureGroupSplit = captureGroup.split('.');
        if (captureGroupSplit.length === 1) {
          return inputString;
        }
        const keyword = captureGroupSplit[0].substring(2).toLowerCase().trim();
        const tagKey = captureGroupSplit[1].substring(0, captureGroupSplit[1].length - 2).toLowerCase().trim();
        captureGroupToValueMap[captureGroup] = captureGroup;

        // get tag values
        if (keyword === 'tag' && tagKey) {
          for (const [key, value] of Object.entries(metric['tags'])) {
            if (key.toLowerCase() === tagKey) {
              captureGroupToValueMap[captureGroup] = value;
            }
          }
        }

        // set tag values in string
        for (const [_captureGroup, tagValue] of Object.entries(captureGroupToValueMap)) {
          inputString = inputString.replace(_captureGroup, tagValue.toString());
        }
      }
    }
    return inputString;
  }


  getArrayAggregate( aggregate, arr ) {
    switch ( aggregate.toLowerCase() ) {
        case 'sum':
            return arr.reduce((a, b) => !isNaN(b) ? a + b : a, 0);
        case 'avg':
            return arr.reduce((a, b) => !isNaN(b) ? a + b : a, 0) / arr.length;
        case 'min':
            return arr.reduce((a, b) => b !== null && !isNaN(b) && a > b ?  b : a, Infinity);
        case 'max':
            return arr.reduce((a, b) => b !== null && !isNaN(b) && a < b ?  b : a, -Infinity);
        default:
            return null;
    }
  }

    getColors(color= null, n= 1) {
        const colors = [];
        let hue;
        if ( color ) {
            const r = parseInt(color.substring(1, 3), 16);
            const g = parseInt(color.substring(3, 5), 16);
            const b = parseInt(color.substring(5, 7), 16);
            hue = this.rgbToHsv(r, g, b)[0];
        } else {
            hue = 0;
        }

        // saturation & value/brightness ranges
        const srange = [ 0.9, 0.2], vrange = [ 0.9, 0.2];

        // no. of colors on light to bright (sBand) and no. of bright to dark (vBand)
        const sBand = Math.ceil(n * 1 ), vBand = Math.floor(n * 0);
        const sStep = (srange[1] - srange[0]) / sBand;
        const vStep = (vrange[0] - vrange[1]) / vBand;

        // if random color set SV to 0.8
        let s = color ? srange[0] - sStep : 1;
        let v = color ?  vrange[0] : 0.9;
        const hueOffset = 1 / (6 * Math.ceil ( n / 6 ) );
        for ( let i = 0; i < n;  i++ ) {
            if ( color ) {
                // get the shades
                if ( i < sBand) {
                    s = s + sStep;
                } else {
                    v = v - vStep;
                }
            } else {
                // random colors
                hue = i % 6 === 0 ? Math.floor(i/6) * hueOffset : hue + 1/6;
            }
            colors.push(this.rgbToHex(this.hsvToRGB(hue, s, v)));
        }
        return n === 1 ? colors[0] : colors;
    }

    hsvToRGB(h, s, v) {
        let r, g, b;

        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }

        return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
    }

    rgbToHex(rgb) {
        const color = '#' + rgb.map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
        return color;
    }

    rgbToHsv(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) {
          h = 0;
        } else {
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        return [ h, s, v ];
    }

    arrayUnique(items) {
        items = items.filter((elem, pos, arr) => {
            return arr.indexOf(elem) === pos;
        });
        return items;
    }

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // utility to measure a string's rendered width
    calculateTextWidth(text, fontSize, fontFace) {

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = fontSize + 'px ' + fontFace;

        const textWidth = context.measureText(text).width;
        canvas.remove();

        return textWidth;
    }
}
