import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient, private utilsService: UtilsService) { }

  private testDashboard: any = {
    id: 'abcdfg',
    settings: {
      time: {
        start: '1h',
        end: 'now',
        zone: 'local'
      },
      meta: {
        title: 'Untitled Dashboard',
        description: '',
        labels: [],
        namespace: '',
        isPersonal: false,
      },
      variables: {
        disabled: false,
        tplVariables: [
          { key: 'colo',
            alias: '',
            values: 'bf2,bf1, gq1, sg3  ',
            enabled: true,
            type: 'literal'
          },
          {
            key: 'variable1',
            alias: 'variable_1',
            values: 'rotation, system',
            enabled: false,
            type: 'literal'
          }
        ]
      }
    },
    widgets: [
        {
            id: 'bigNum1',
            gridPos: { x: 0, y: 0, w: 4, h: 4 },
            settings: {
              title: 'SNMP Max Latency',
              component_type: 'BignumberWidgetComponent',
              data_source: 'yamas'
            },
            query: {
                settings: {
                    time: {
                        overrideRelativeTime: '',
                        shiftTime: '',
                        downsample: {
                            value: '1m',
                            aggregator: 'sum',
                            customValue: '',
                            customUnit: ''
                        }
                    },
                    axes: {}
                },
                groups: [
                  {
                    id: 'gaga',
                    title: 'group 2',
                    visual: {},
                    queries: [
                    {
                      metric: 'SNMP-Net.intercolo.avg_latency',
                      filters: [
                        {
                          type: 'wildcard',
                          tagk: 'host',
                          filter: '*',
                          groupBy: true
                        }
                      ],
                      aggregator: 'zimsum',
                      explicitTags: false,
                      rate: false,
                      rateOptions: {
                        counter: false,
                        resetValue: 1
                      },
                      settings: {
                          visual: {
                              aggregator: 'sum'
                          }
                      }
                    },
                    {
                      metric: 'SNMP-Net.intercolo.min_latency',
                      filters: [
                        {
                          type: 'wildcard',
                          tagk: 'host',
                          filter: '*',
                          groupBy: true
                        }
                      ],
                      aggregator: 'zimsum',
                      explicitTags: false,
                      rate: false,
                      rateOptions: {
                        counter: false,
                        resetValue: 1
                      },
                      settings: {
                          visual: {
                              aggregator: 'sum'
                          }
                      }
                    }
                    ]
                  }
                ]
            }
          },
          {
            id: 'bigNum2',
            gridPos: { x: 4, y: 0, w: 4, h: 4 },
            settings: {
              title: 'SNMP Min Latency',
              component_type: 'BignumberWidgetComponent',
              data_source: 'yamas'
            },
            query: {
                settings: {
                    time: {
                        overrideRelativeTime: '',
                        shiftTime: '',
                        downsample: {
                            value: '1m',
                            aggregator: 'sum',
                            customValue: '',
                            customUnit: ''
                        }
                    }
                },
                groups: [
                  {
                    id: 'gaga',
                    title: 'group 2',
                    visual: {},
                    queries: [
                      {
                        metric: 'SNMP-Net.intercolo.min_latency',
                        filters: [
                          {
                            type: 'wildcard',
                            tagk: 'host',
                            filter: '*',
                            groupBy: true
                          }
                        ],
                        aggregator: 'zimsum',
                        explicitTags: false,
                        rate: false,
                        rateOptions: {
                          counter: false,
                          resetValue: 1
                        },
                        settings: {
                            visual: {
                                aggregator: 'sum'
                            }
                        }
                      }
                    ]
                  }
                ]
            }
          },
          {
            id: 'bigNum3',
            gridPos: { x: 8, y: 0, w: 4, h: 4 },
            settings: {
              title: 'SNMP Avg Latency',
              component_type: 'BignumberWidgetComponent',
              data_source: 'yamas'
            },
            query: {
                settings: {
                    time: {
                        overrideRelativeTime: '',
                        shiftTime: '',
                        downsample: {
                            value: '1m',
                            aggregator: 'sum',
                            customValue: '',
                            customUnit: ''
                        }
                    }
                },
                groups: [
                  {
                    id: 'gaga',
                    title: 'group 2',
                    visual: {},
                    queries: [
                      {
                        metric: 'SNMP-Net.intercolo.avg_latency',
                        filters: [
                          {
                            type: 'wildcard',
                            tagk: 'host',
                            filter: '*',
                            groupBy: true
                          }
                        ],
                        aggregator: 'zimsum',
                        explicitTags: false,
                        rate: false,
                        rateOptions: {
                          counter: false,
                          resetValue: 1
                        },
                        settings: {
                            visual: {
                                aggregator: 'sum'
                            }
                        }
                      }
                    ]
                  }
                ]
            }
          },
          {
            id: 'abcd',
            gridPos: { x: 0, y: 4, w: 12, h: 5 },
            settings: {
              title: 'my widget title',
              component_type: 'LinechartWidgetComponent',
              data_source: 'yamas',
              description: 'test desc',
            },
            query: {
              settings: {
                time: {
                    overrideRelativeTime: '',
                    shiftTime: '',
                    downsample: {
                        value: '1m',
                        aggregator: 'sum',
                        customValue: '',
                        customUnit: ''
                    }
                },
                visual: {},
                legend: {
                    display: true,
                    format: 'table',
                    position: 'right'
                },
                axes: {
                    y1: {},
                    y2: {}
                }
              },
              groups: [
                {
                  id: 'gaga',
                  title: 'group 2',
                  settings: {
                    visual: {
                      visible: true
                    }
                  },
                  queries: [
                    {
                      metric: 'SNMP-Net.intercolo.avg_latency',
                      filters: [
                        {
                          type: 'wildcard',
                          tagk: 'host',
                          filter: '*',
                          groupBy: true
                        }
                      ],
                      aggregator: 'zimsum',
                      explicitTags: false,
                      rate: false,
                      rateOptions: {
                        counter: false,
                        resetValue: 1
                      },
                      settings: {
                        visual: {
                            color: "#FF0000",
                            type: 'line',
                            label: "yahoo",
                            visible: true
                        }
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            id: 'cdft',
            gridPos: { x: 6, y: 5, w: 6, h: 5 },
            settings: {
              title: 'my widget second title',
              component_type: 'LinechartWidgetComponent',
              data_source: 'yamas'
            },
            query: {
              settings: {
                time: {
                    overrideRelativeTime: '',
                    shiftTime: '',
                    downsample: {
                        value: '1m',
                        aggregator: 'sum',
                        customValue: '',
                        customUnit: ''
                    }
                },
                visual: {},
                axes: {
                    y1: {},
                    y2: {}
                },
                legend: {}
              },
              groups: [
                {
                  id: 'werd',
                  title: 'group 2',
                  settings: {
                    visual: {
                      visible: true
                    }
                  },
                  queries: [
                    {
                      metric: 'SNMP-Net.intercolo.avg_latency',
                      filters: [
                        {
                          type: 'wildcard',
                          tagk: 'host',
                          filter: '*',
                          groupBy: false
                        }
                      ],
                      aggregator: 'zimsum',
                      explicitTags: false,
                      rate: false,
                      rateOptions: {
                        counter: false,
                        resetValue: 1
                      },
                      settings: {
                        visual: {
                            color: "#000000",
                            type: 'line',
                            label: "yahoo",
                            visible: true
                        },
                      }
                    }
                  ]
                }
              ]
            }
          },
      {
        id: 'multigroup',
        gridPos: { x: 0, y: 11, w: 6, h: 5 },
        settings: {
          title: 'my widget third title',
          component_type: 'LinechartWidgetComponent',
          data_source: 'yamas'
        },
        query: {
          settings: {
            time: {
                overrideRelativeTime: '',
                shiftTime: '',
                downsample: {
                    value: '1m',
                    aggregator: 'sum',
                    customValue: '',
                    customUnit: ''
                }
            },
            visual: {},
            axes: {
                y1: {},
                y2: {}
            },
            legend: {}
          },
          groups: [
            {
              id: 'multi1',
              title: 'group 1',
              settings: {
                visual: {
                  visible: true
                }
              },
              queries: [
                {
                  metric: 'SNMP-Net.intercolo.max_latency',
                  filters: [
                    {
                      type: 'wildcard',
                      tagk: 'host',
                      filter: '*',
                      groupBy: true
                    }
                  ],
                  aggregator: 'zimsum',
                  explicitTags: false,
                  rate: false,
                  rateOptions: {
                    counter: false,
                    resetValue: 1
                  },
                  settings: {
                    visual: {
                        color: "#000000",
                        type: 'line',
                        label: "yahoo",
                        visible: true
                    },
                  }
                }
              ]
            },
            {
              id: 'multi2',
              title: 'group 2',
              settings: {
                visual: {
                  visible: true
                }
              },
              queries: [
                {
                  metric: 'SNMP-Net.intercolo.ploss',
                  filters: [
                    {
                      type: 'wildcard',
                      tagk: 'host',
                      filter: '*',
                      groupBy: true
                    }
                  ],
                  aggregator: 'zimsum',
                  explicitTags: false,
                  rate: false,
                  rateOptions: {
                    counter: false,
                    resetValue: 1
                  },
                  settings: {
                    visual: {
                        color: "#0000FF ",
                        type: 'line',
                        label: "yahoo",
                        visible: true
                    },
                  }
                }
              ]
            }
          ]
        }
      },
      {
        id: 'bar',
        gridPos: { x: 6, y: 11, w: 6, h: 5 },
        settings: {
          title: 'Flickr CPU Speed',
          component_type: 'BarchartWidgetComponent',
          data_source: 'yamas',
        },
        query: {
          settings: {
            time: {
                overrideRelativeTime: '',
                shiftTime: '',
                downsample: {
                    value: '1m',
                    aggregator: 'sum',
                    customValue: '',
                    customUnit: ''
                }
            },
            visual: {}
          },
          groups: [
            {
                id: 'abc',
                title: 'group 1',
                settings: {
                visual: {},
                },
                queries: [
                    {
                        aggregator: 'zimsum',
                        explicitTags:false,
                        downsample: '1m-avg-nan',
                        metric:'Flickr.WWW-BOTS.cpu_speed',
                        rate: false,
                        rateOptions : {
                            counter: false,
                            resetValue: 1
                        },
                        counter: false,
                        resetValue: 1,
                        settings: {
                            visual: {
                                color: "#FF0000",
                                aggregator: "sum",
                                visible: true,
                                stackLabel: "WWW-BOTS"
                            }
                        }
                    },
                    {
                        aggregator: 'zimsum',
                        downsample: '1m-avg-nan',
                        explicitTags:false,
                        metric:'Flickr.UPLOAD.cpu_speed',
                        rate: false,
                        rateOptions : {
                            counter: false,
                            resetValue: 1
                        },
                        counter: false,
                        resetValue: 1,
                        settings: {
                            visual: {
                                color: "#FFA500",
                                aggregator: "sum",
                                visible: true,
                                stackLabel: "UPLOAD"
                            }
                        }
                    },
                    {
                        aggregator: 'zimsum',
                        downsample: '1m-avg-nan',
                        explicitTags:false,
                        metric:'Flickr.ZOOKEEPER.cpu_speed',
                        rate: false,
                        rateOptions : {
                            counter: false,
                            resetValue: 1
                        },
                        counter: false,
                        resetValue: 1,
                        settings: {
                            visual: {
                                color: "#FFFF00",
                                aggregator: "sum",
                                visible: true,
                                stackLabel: "ZOOKEEPER"
                            }
                        }
                    },
                    {
                        aggregator: 'zimsum',
                        downsample: '1m-avg-nan',
                        explicitTags:false,
                        metric:'Flickr.TWEM-VIEWCOUNT.cpu_speed',
                        rate: false,
                        rateOptions : {
                            counter: false,
                            resetValue: 1
                        },
                        counter: false,
                        resetValue: 1,
                        settings: {
                            visual: {
                                color: "#008000",
                                aggregator: "sum",
                                visible: true,
                                stackLabel: "TWEM"
                            }
                        }
                    },
                    {
                        aggregator: 'zimsum',
                        downsample: '1m-avg-nan',
                        explicitTags:false,
                        metric:'Flickr.STORM-General.cpu_speed',
                        rate: false,
                        rateOptions : {
                            counter: false,
                            resetValue: 1
                        },
                        counter: false,
                        resetValue: 1,
                        settings: {
                            visual: {
                                color: "#0000FF",
                                aggregator: "sum",
                                visible: true,
                                stackLabel: "STORM"
                            }
                        }
                    }
                ]
            }
          ]
        }
      },
      {
        id: 'sbar',
        gridPos: { x: 0, y: 11, w: 6, h: 5 },
        settings: {
          title: 'Flickr Application - CPU Speed by colo',
          component_type: 'StackedBarchartWidgetComponent',
          data_source: 'yamas'
        },
        query: {
          settings: {
            time: {
                overrideRelativeTime: '',
                shiftTime: '',
                downsample: {
                    value: '1m',
                    aggregator: 'sum',
                    customValue: '',
                    customUnit: ''
                }
              },
              axes : {
              },
              visual: {
                  type: 'vertical',
                  stacks: [
                      {
                        id: 1,
                        label: 'Stack-1',
                        color: '#FF0000'
                      },
                      {
                        id: 2,
                        label: 'Stack-2',
                        color: '#FFA500'
                      },
                      {
                        id: 3,
                        label: 'Stack-3',
                        color: '#FFFF00'
                      },
                      {
                        id: 4,
                        label: 'Stack-4',
                        color: '#008000'
                      },
                      {
                        id: 5,
                        label: 'Stack-5',
                        color: '#0000FF'
                      }
                  ]
              }
          },
          groups: [
            {
              id: 'ALL-COLO',
              title: 'ALL COLO',
              settings: {
                visual: {
                    visible: true
                },
                tempUI: {
                    selected: false
                }
              },
              queries: [
                {
                    aggregator: 'zimsum',
                    explicitTags:false,
                    downsample: '1m-avg-nan',
                    metric:'Flickr.WWW-BOTS.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true  ,
                            stack: 1
                        }
                    }
                },
                {
                    aggregator: 'zimsum',
                    downsample: '1m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.UPLOAD.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 2
                        }
                    }
                },
                {
                    aggregator: 'zimsum',
                    downsample: '1m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.ZOOKEEPER.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 3
                        }
                    }
                },
                {
                    aggregator: 'zimsum',
                    downsample: '1m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.TWEM-VIEWCOUNT.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 4
                        }
                    }
                },
                {
                    aggregator: 'zimsum',
                    downsample: '1m-avg-nan',
                    explicitTags: false,
                    metric: 'Flickr.STORM-General.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 5
                        }
                    }
                }
              ]
            },
            {
                id: 'BF1',
                title: 'BF1',
                settings: {
                    visual: {
                        visible: true
                    },
                    tempUI: {
                        selected: false
                    }
                },
                queries: [
                  {
                      aggregator: 'zimsum',
                      explicitTags:false,
                      downsample: '1m-avg-nan',
                      metric:'Flickr.WWW-BOTS.cpu_speed',
                      rate: false,
                      rateOptions : {
                          counter: false,
                          resetValue: 1
                      },
                      counter: false,
                      resetValue: 1,
                      tags: { colo: "bf1"},
                      settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 1
                        }
                      }
                  },
                  {
                      aggregator: 'zimsum',
                      downsample: '1m-avg-nan',
                      explicitTags:false,
                      metric:'Flickr.UPLOAD.cpu_speed',
                      rate: false,
                      rateOptions : {
                          counter: false,
                          resetValue: 1
                      },
                      counter: false,
                      resetValue: 1,
                      tags: { colo: "bf1"},
                      settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 2
                        }
                      }
                  },
                  {
                      aggregator: 'zimsum',
                      downsample: '1m-avg-nan',
                      explicitTags:false,
                      metric:'Flickr.ZOOKEEPER.cpu_speed',
                      rate: false,
                      rateOptions : {
                          counter: false,
                          resetValue: 1
                      },
                      counter: false,
                      resetValue: 1,
                      tags: { colo: "bf1"},
                      settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 3
                        }
                      }
                  },
                  {
                      aggregator: 'zimsum',
                      downsample: '1m-avg-nan',
                      explicitTags:false,
                      metric:'Flickr.TWEM-VIEWCOUNT.cpu_speed',
                      rate: false,
                      rateOptions : {
                          counter: false,
                          resetValue: 1
                      },
                      counter: false,
                      resetValue: 1,
                      tags: { colo: "bf1"},
                      settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 4
                        }
                      }
                  },
                  {
                      aggregator: 'zimsum',
                      downsample: '1m-avg-nan',
                      explicitTags:false,
                      metric:'Flickr.STORM-General.cpu_speed',
                      rate: false,
                      rateOptions : {
                          counter: false,
                          resetValue: 1
                      },
                      counter: false,
                      resetValue: 1,
                      tags: { colo: "bf1"},
                      settings: {
                        visual: {
                            aggregator: "sum",
                            visible: true,
                            stack: 5
                        }
                      }
                  }
                ]
            }
          ]
        }
      },
      {
        id: 'donut',
        gridPos: { x: 6, y: 16, w: 6, h: 5 },
        settings: {
          title: 'Flickr CPU Speed',
          component_type: 'DonutWidgetComponent',
          data_source: 'yamas'
        },
        query: {
          settings: {
            time: {
                overrideRelativeTime: '',
                shiftTime: '',
                downsample: {
                    value: '1m',
                    aggregator: 'sum',
                    customValue: '',
                    customUnit: ''
                }
            },
            visual: {},
            legend: {
                display: true,
                position: 'right',
                showPercentages: true
            }
          },
          groups: [
            {
              id: 'ALL-COLO',
              title: 'group 1',
              settings: {
                visual: {},
              },
              queries: [
                {
                    aggregator: 'zimsum',
                    explicitTags:false,
                    downsample: '1m-avg-nan',
                    metric:'Flickr.WWW-BOTS.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            color: "#FF0000",
                            aggregator: "avg",
                            visible: true,
                            stackLabel: "WWW-BOTS"
                        }
                    }
                },
                {
                    aggregator: 'zimsum',
                    downsample: '1m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.UPLOAD.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            color: "#FFA500",
                            aggregator: "avg",
                            visible: true,
                            stackLabel: "UPLOAD"
                        }
                    }
                },
                {
                    aggregator: 'zimsum',
                    downsample: '1m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.ZOOKEEPER.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            color: "#FFFF00",
                            aggregator: "avg",
                            visible: true,
                            stackLabel: "ZOOKEEPER"
                        }
                    }
                },
                {
                    aggregator: 'zimsum',
                    downsample: '1m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.TWEM-VIEWCOUNT.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            color: "#008000",
                            aggregator: "avg",
                            visible: true,
                            stackLabel: "TWEM"
                        }
                    }
                },
                {
                    aggregator: 'zimsum',
                    downsample: '1m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.STORM-General.cpu_speed',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                    settings: {
                        visual: {
                            color: "#0000FF",
                            aggregator: "avg",
                            visible: true,
                            stackLabel: "STORM"
                        }
                    }
                }
              ]
            }
        ]
        }
      }
    ]
  };

  getDashoard(id: string): Observable<any> {
    // modify widget to support responsive, drag and drop, resize before return
    this.utilsService.modifyWidgets(this.testDashboard);
    return Observable.of(this.testDashboard);
  }

  /* to handle error  with more info */
  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // a client-side or network error occured
      console.log('An error occured:', error.error.message);
    } else {
      // the backend returned unsuccessful response code
      // the response body may contain clues of what went wrong
      console.error(
        `backend return code ${error.status}, ` +
        `body was: ${error.error}`
      );
    }
    return throwError(
      'Something bad happened; please try again later.'
    );
  }
  /* will refactor later */
  getYamasData(query: any): Observable<any> {
    const headers = new HttpHeaders(
      { 'Content-Type': 'application/json' });
      //'/tsdb/queryData'
    let apiUrl = environment.tsdb_host + '/api/query/graph';
    return this.http.post(apiUrl, query, { headers, withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }
  /* post to search for metric */
  searchMetrics(queryObj: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post('/search/msearch', queryObj, { headers, withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

    getNamespaces(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        return this.http.post('/search/namespaces', queryObj, { headers, withCredentials: true })
          .pipe(
            catchError(this.handleError)
          );
    }
}
