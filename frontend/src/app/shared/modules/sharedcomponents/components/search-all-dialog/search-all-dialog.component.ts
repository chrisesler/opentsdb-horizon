import { Component, Inject, OnInit, OnDestroy, HostBinding, EventEmitter, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, DialogPosition, MatSort, MatTableDataSource } from '@angular/material';

import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { Observable } from 'rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'search-all-dialog',
    templateUrl: './search-all-dialog.component.html',
    styleUrls: ['./search-all-dialog.component.scss']
})
export class SearchAllDialogComponent implements OnInit, OnDestroy {

    @HostBinding('class.search-all-dialog') private _hostClass = true;

    // utility to get the total result count
    // ? Might go away: we should get a total result count from REAL result array
    get filterTotalResultCount(): any {
        let count = 0;
        for (const filter of this.fakeFilters) {
            count = count + filter.count;
        }
        console.log('FILTER COUNT', count);
        return count;
    }

    /** Local variables */

    // Search query string
    // tslint:disable-next-line:no-inferrable-types
    searchQuery: string = '';

    // Selected search context
    // tslint:disable-next-line:no-inferrable-types
    searchContext: string = 'dashboard';

    // options for the search context dropdown menu in the search field
    fakeSearchContextOptions: Array<any> = [
        {
            label: 'Dashboards',
            value: 'dashboard'
        },
        {
            label: 'Namespaces',
            value: 'namespace'
        },
        {
            label: 'Metrics',
            value: 'metric'
        },
        {
            label: 'Users',
            value: 'user'
        }
    ];

    // TODO: replace with real result array
    fakeResultColumns: String[] = [
        'dashboardName',
        'owner',
        'lastViewed'
    ];
    fakeSearchResults: Array<any> = [
        {
            dashboardName: 'Some dashboard title',
            owner: 'Hill Nguyen',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Hill Nguyen',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Arun Gupta',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Zack Burgess',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Zack Burgess',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Chris Esler',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Jazmin Orozco',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Jay Torres',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Chris Esler',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Hill Nguyen',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        },
        {
            dashboardName: 'Some dashboard title',
            owner: 'Arun Gupta',
            lastViewed: '02/24/18 2:18PM',
            tags: ['Host', 'Colo']
        }
    ];
    /* OLD RESULTS
    fakeSearchResults: Array<any> = [
        {
            groupLabel: 'jorozco',
            results: [
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                }
            ]
        },
        {
            groupLabel: 'cturansky',
            results: [
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                }
            ]
        },
        {
            groupLabel: 'msandoval',
            results: [
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                },
                {
                    label: 'some title goes here',
                    link: ''
                }
            ]
        }
    ];*/

    // AutoSuggest
    // TODO: Replace this with empty array that gets filled out by result from service call
    fakeQuerySuggestions: Array<any> = [
        {
            label: 'suggestion label 1'
        },
        {
            label: 'suggestion label 2'
        },
        {
            label: 'suggestion label 3'
        },
        {
            label: 'suggestion label 4'
        },
        {
            label: 'suggestion label 5'
        },
        {
            label: 'suggestion label 6'
        },
        {
            label: 'suggestion label 7'
        },
        {
            label: 'suggestion label 8'
        },
        {
            label: 'suggestion label 9'
        },
        {
            label: 'suggestion label 10'
        }
    ];

    // Selected filter
    // ? Might change: maybe more than one filter applied
    currentFilter: any = { label: 'All' };

    // TODO: replace with real array of possible filter keys
    fakeFilters: Array<any> = [
        {
            label: 'UserIDs',
            count: 34
        },
        {
            label: 'Metrics',
            count: 56
        },
        {
            label: 'Host',
            count: 34
        },
        {
            label: 'Colo',
            count: 34
        },
        {
            label: '_application',
            count: 34
        }
    ];

    // TODO: will remove. This is purely for temp content in right column links
    fakeShortcuts: Array<any> = [
        {
            label: 'title of link',
            url: '/#/dashboard/abcd'
        },
        {
            label: 'title of link',
            url: '/#/dashboard/abcd'
        },
        {
            label: 'title of link',
            url: '/#/dashboard/abcd'
        },
        {
            label: 'title of link',
            url: '/#/dashboard/abcd'
        },
        {
            label: 'title of link',
            url: '/#/dashboard/abcd'
        }
    ];

    /** Form Group */
    searchFormGroup: FormGroup;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.createForm();
    }

    ngOnDestroy() {
    }

    // setup form values
    createForm() {
        this.searchFormGroup = this.fb.group({
           searchQuery: new FormControl(this.searchQuery),
           searchContext: new FormControl(this.searchContext)
        });
    }

    // selects a filter
    // ? Might change: this could change to a toggle since there might be more than one filter applied
    selectFilter(filter: any) {
        this.currentFilter = filter;
    }

    /** AUTO SUGGESTION */

    /**
     * * If user hits enter, the input is valid and that option must exist in the list
     */
    queryKeydown(event: any) {
        this.searchQuery = this.searchFormGroup.get('searchQuery').value;
    }
    /**
     * * Event fired when an autocomplete option is selected
     */
    querySuggestOptionSelected(event: any) {
        this.searchQuery = event.option.value;
    }

}
