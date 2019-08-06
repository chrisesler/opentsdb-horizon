import { Injectable } from '@angular/core';
import { UtilsService } from '../../core/services/utils.service';
import { DashboardConverterService } from '../../core/services/dashboard-converter.service';
import { environment } from '../../../environments/environment';


@Injectable()
export class DashboardService {

  version = 2;

  private dashboardProto: any = {
    settings: {
        time: {
          start: '1h',
          end: 'now',
          zone: 'local'
        },
        meta: {
            title: 'My Dashboard',
            description: '',
            labels: [],
            namespace: '',
            isPersonal: false,
        },
        tplVariables: []
    },
    widgets: [
    ]
  };

  private widgetPrototype = {
    gridPos: {
      x: 0, y: 0,
      h: 5, w: 12,
      xMd: 0, yMd: 0,
      wMd: 12, hMd: 5,
      xSm: 0, ySm: 0,
      wSm: 1, hSm: 1
    },
    settings: {
      title: 'my widget',
      component_type: 'PlaceholderWidgetComponent',
      data_source: 'yamas',
      visual: {},
        axes: {},
        legend: {},
        time: {
            downsample: {
                value: 'auto',
                aggregator: 'avg',
                customValue: '',
                customUnit: ''
            }
        }
    },
    queries: []
  };

  private widgetsConfig = {};

  constructor(private utils: UtilsService, private dbConverterService: DashboardConverterService) { }


  setWigetsConfig(conf) {
    this.widgetsConfig = {...conf};
  }

  getWidgetPrototype(type= '', widgets= []): any {
    const widget: any = JSON.parse(JSON.stringify(this.widgetPrototype));
    widget.id = this.utils.generateId(6, this.utils.getIDs(widgets));
    widget.settings.component_type = type;
    switch ( type ) {
        case 'LinechartWidgetComponent':
        case 'HeatmapWidgetComponent':
        case 'BarchartWidgetComponent':
        case 'StackedBarchartWidgetComponent':
        case 'DonutWidgetComponent':
        case 'TopnWidgetComponent':
        case 'DeveloperWidgetComponent':
        case 'BignumberWidgetComponent':
        case 'MarkdownWidgetComponent':
        case 'EventsWidgetComponent':
            break;
        default:
            widget.settings.component_type = 'PlaceholderWidgetComponent';
    }
    return widget;
  }

  getDashboardPrototype(): any {
    const dashboard: any = this.utils.deepClone(this.dashboardProto);
    const widget: any = this.utils.deepClone(this.getWidgetPrototype());
    dashboard.widgets.push(widget);
    return dashboard;
  }

  // help to put new widget on top.
  // set new position of first position down
  positionWidgetY(widgets: any, y) {
    const modWidgets = widgets;
    for (let i = 0; i < modWidgets.length; i++) {
      modWidgets[i].gridPos.y = modWidgets[i].gridPos.y + y;
      modWidgets[i].gridPos.yMd = modWidgets[i].gridPos.yMd + y;
    }
    return modWidgets;
  }

  getMetricsFromWidgets( widgets ) {
    const metrics = [];
    for ( let i = 0; i < widgets.length; i++ ) {
        const queries = widgets[i].queries;
        for ( let j = 0; j < queries.length; j++ ) {
            for ( let k = 0; k < queries[j].metrics.length; k++ ) {
                if ( !queries[j].metrics[k].expression ) {
                    metrics.push(queries[j].namespace + '.' + queries[j].metrics[k].name);
                }
            }
        }
    }
    return metrics;
  }

  filterMetrics(query) {
    query.metrics = query.metrics.filter(item => item.settings.visual.visible === true);
    return query;
  }

  overrideQueryFilters(query, filters, tags=[]) {
    for (let i = 0; i < filters.length; i++) {
      let tagExists = false;
      for (let j = 0; query.filters && j < query.filters.length; j++) {
        if (filters[i].tagk === query.filters[j].tagk && filters[i].filter && filters[i].filter.length) {
          query.filters[j].filter = filters[i].filter;
          tagExists = true;
        }
      }
      if ( !tagExists && tags.indexOf(filters[i].tagk) !== -1 ) {
        query.filters.push( { tagk: filters[i].tagk ,  filter: filters[i].filter} );
      }
    }
    return query;
  }

  // check if dashboard have any mertics
  havingDBMetrics(widgets: any[]): boolean {
    if (widgets.length === 0) { return false; }
    for (let i = 0; i < widgets.length; i++) {
      const widQueries = widgets[i].queries || [];
      for (let j = 0; j < widQueries.length; j++) {
        const metrics = widQueries[j].metrics || [];
        if (metrics.length > 0) {
          return true;
        }
      }
    }
  }

  // return all eligible widgets id and qid based on list of tplVariables
  // what widget has the tag defined or not
  checkEligibleWidgets(tplVariables: any, rawDbTags: any) {
    const eWidgets = {};
    for (let i = 0; i < tplVariables.length; i++) {
      const vartag = tplVariables[i];
      // if (vartag.filter.trim()  !== '') { // hmm it can be from something to nothing
      eWidgets[vartag.alias] = {};
      const ewid = {};
      for (const wid in rawDbTags) {
        if (rawDbTags.hasOwnProperty(wid)) {
          const eqid = {};
          for (const qid in rawDbTags[wid]) {
            if (rawDbTags[wid].hasOwnProperty(qid)) {
              if (rawDbTags[wid][qid].includes(vartag.tagk)) {
                eqid[qid] = true;
              }
            }
          }
          if (Object.keys(eqid).length > 0) {
            ewid[wid] = eqid;
          }
        }
      }
      eWidgets[vartag.alias] = ewid;
      // }
    }
    return eWidgets;
  }

  // return widget custom tag info if this widget is eligible
  applyWidgetDBFilter(widget: any, tplVariables: any, rawDbTags: any) {
   let isModify = false;
   const wid = widget.id.indexOf('__EDIT__') !== -1 ? widget.id.replace('__EDIT__', '') : widget.id;
   const eWidget = {};
    for (let i = 0; i < tplVariables.length; i++) {
      const vartag = tplVariables[i];
      if (rawDbTags[wid]) {
        const eqid = {};
        for (const qid in rawDbTags[wid]) {
          if (rawDbTags[wid].hasOwnProperty(qid)) {
            if (rawDbTags[wid][qid].includes(vartag.tagk)) {
              eqid[qid] = true;
            }
          }
        }
        if (Object.keys(eqid).length > 0) {
          eWidget[vartag.alias] = eqid;
        }
      }
    }
    // mcolo: abc: true, cdf: true --> for query id
    for (const alias of Object.keys(eWidget)) {
        const tplIdx = tplVariables.findIndex(tpl => tpl.alias === alias);
        const vartag = tplVariables[tplIdx];
        // when user set custom tag to empty, we need to requery to origin config
        if (vartag.filter === '') { isModify = true; continue; }
        for (let i = 0; i < widget.queries.length; i++) {
          const query = widget.queries[i];
          if (eWidget[alias].hasOwnProperty(query.id)) {
            // see if it has filter of this tag
            const fIdx = query.filters.findIndex(f => f.tagk === vartag.tagk);
            if (fIdx > -1) {
              const currFilter = query.filters[fIdx];
              // if they manually define this [alias] in customFilter then we don't
              // modify it since it's static mode
              if (!currFilter.customFilter || currFilter.customFilter.length === 0) {
                currFilter.filter = [];
                currFilter.dynamicFilter ?
                  currFilter.dynamicFilter.push('[' + alias + ']') : currFilter.dynamicFilter = ['[' + alias + ']'];
                isModify = true;
              }
            } else {
              const nfilter = {
                tagk: vartag.tagk,
                filter: [],
                groupBy: false,
                dynamicFilter: ['[' + alias + ']']
              };
              query.filters.push(nfilter);
              isModify = true;
            }
          }
        }
    }
    return isModify ? widget : undefined;
  }

  // to insert dynamicFilter or modify customFilter accordingly
  // @widget: widget to modify
  // @eWidget: object to hold this widget dashboard tag filter of eligible
  // @tplVariables: current list of db tag filters (in view or edit mode)
  applyTplVarToWidget(widget: any, eWidgets: any, tplVariables: any[]) {
    // for editing widget, we need to get the id out.
    const wid = widget.id.indexOf('__EDIT__') !== -1 ? widget.id.replace('__EDIT__', '') : widget.id;
    let isModify = false;
    for (const alias in eWidgets) {
      if (eWidgets[alias].hasOwnProperty(wid)) {
        const tplIdx = tplVariables.findIndex(tpl => tpl.alias === alias);
        const vartag = tplVariables[tplIdx];
        // when user set custom tag to empty, we need to requery to origin config
        if (vartag.filter === '') { isModify = true; continue; }
        for (let i = 0; i < widget.queries.length; i++) {
          const query = widget.queries[i];
          if (eWidgets[alias][wid].hasOwnProperty(query.id)) {
            const fIdx = query.filters.findIndex(f => f.tagk === vartag.tagk);
            if (fIdx > -1) {
              // check if it has this alias, if it does then leave it alone as static mode
              if ((query.filters[fIdx].customFilter && query.filters[fIdx].customFilter.length === 0)
                || !query.filters[fIdx].customFilter) {
                query.filters[fIdx].filter = [];
                query.filters[fIdx].dynamicFilter ? query.filters[fIdx].dynamicFilter.push('[' + alias + ']')
                  : query.filters[fIdx].dynamicFilter = ['[' + alias + ']'];
                isModify = true;
              } else {
                // they have static mode, but let it thru
                isModify = true;
              }
            } else {
              const nfilter = {
                tagk: vartag.tagk,
                filter: [],
                groupBy: false,
                dynamicFilter: ['[' + alias + ']']
              };
              query.filters.push(nfilter);
              isModify = true;
            }
          }
        }
      }
    }
    return isModify ? widget : undefined;
  }
  resolveTplVar(query: any, tplVariables: any[]) {
    for (let i = 0; i < query.filters.length; i++) {
      const qFilter = query.filters[i];
      // they do have custom filter mean static filter
      if (qFilter.customFilter && qFilter.customFilter.length > 0) {
        for (let j = 0; j < qFilter.customFilter.length; j++) {
          const alias = qFilter.customFilter[j].substring(1, qFilter.customFilter[j].length - 1);
          const tplIdx = tplVariables.findIndex(tpl => tpl.alias === alias);
          if (tplIdx > -1) {
            if (tplVariables[tplIdx].filter.trim() !== '' && qFilter.filter.indexOf(tplVariables[tplIdx].filter) === -1) {
              qFilter.filter.push(tplVariables[tplIdx].filter);
            }
          }
        }
      } else if (qFilter.dynamicFilter && qFilter.dynamicFilter.length > 0) {
        for (let j = 0; j < qFilter.dynamicFilter.length; j++) {
          const alias = qFilter.dynamicFilter[j].substring(1, qFilter.dynamicFilter[j].length - 1);
          const tplIdx = tplVariables.findIndex(tpl => tpl.alias === alias);
          if (tplIdx > -1) {
            if (tplVariables[tplIdx].filter !== '' && qFilter.filter.indexOf(tplVariables[tplIdx].filter) === -1) {
              qFilter.filter.push(tplVariables[tplIdx].filter);
            }
          }
        }
      }
    }
    // clean out empty filter
    query.filters = query.filters.filter(f => f.filter.length > 0);
    return query;
  }

  addGridterInfo(widgets: any[]) {
    for (let i = 0; i < widgets.length; i++) {
      const w = widgets[i];
      const gpos = widgets[i].gridPos;
      const gridResp = {
        xMd: gpos.x,
        yMd: gpos.y,
        wMd: gpos.w,
        hMd: gpos.h,
        xSm: gpos.x,
        ySm: gpos.y,
        wSm: 1,
        hSm: 1
      };
      widgets[i].gridPos = {...widgets[i].gridPos, ...gridResp};
    }
  }

  updateTimeFromURL(dbstate) {
    if (environment.url['time']) {
      var urlTime = environment.url['time'];
      if (!dbstate.content.settings.time)
        dbstate.content.settings.time = {};
      var dbTime = dbstate.content.settings.time;
      if (urlTime.start) dbTime.start = urlTime.start;
      if (urlTime.end) dbTime.end = urlTime.end;
      if (urlTime.zone) dbTime.zone = urlTime.zone;
    }
  }

  updateTplVariablesFromURL(dbstate) {
    if (environment.url['tags']) {
      var urlTags = environment.url['tags'];
      if (!dbstate.content.settings.tplVariables)
        dbstate.content.settings.tplVariables = [];
      var dbTags = dbstate.content.settings.tplVariables;
      for (var k in urlTags) {
        var found = false;

        // search for template variables using alias first
        for (var j in dbTags) {
          if (k === dbTags[j].alias) {
            dbTags[j].filter = urlTags[k];
            found = true;
            break;
          }
        }
        if (!found) {
          // try against tag keys
          for (var j in dbTags) {
            if (k === dbTags[j].tagk) {
              dbTags[j].filter = urlTags[k];
              found = true;
              break;
            }
          }
        }

        if (!found) {
          // dashboard does not have any template
          // variables matching the url param.
          // create one as a best effort
          var newTag = {
            tagk: k,
            alias: k,
            filter: urlTags[k] 
          };
          dbTags.push(newTag);
        }
      }
    }
  }

  getStorableFormatFromDBState(dbstate) {
    const widgets = this.utils.deepClone(dbstate.Widgets.widgets);
    for (let i = 0; i < widgets.length; i++) {
      widgets[i].gridPos.x = widgets[i].gridPos.xMd;
      widgets[i].gridPos.y = widgets[i].gridPos.yMd;
      delete widgets[i].gridPos.xMd;
      delete widgets[i].gridPos.yMd;
      delete widgets[i].gridPos.wMd;
      delete widgets[i].gridPos.hMd;
      delete widgets[i].gridPos.xSm;
      delete widgets[i].gridPos.ySm;
      delete widgets[i].gridPos.wSm;
      delete widgets[i].gridPos.hSm;
    }
    const dashboard = {
      version: this.dbConverterService.getDBCurrentVersion(),
      settings: dbstate.Settings,
      widgets: widgets
    };
    return dashboard;
  }
}
