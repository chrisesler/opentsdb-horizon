/**
 * This file is part of OpenTSDB.
 * Copyright (C) 2021  Yahoo.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    Component,
    HostBinding,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';

@Component({
    selector: 'app-admin-namespaces',
    templateUrl: './admin-namespaces.component.html',
    styleUrls: ['./admin-namespaces.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AdminNamespacesComponent implements OnInit {
    @HostBinding('class') classAttribute =
    'app-admin-section app-admin-config';

    // TEST sections links
    testSubLinks: any[] = [
        {
            label: 'Test Namespace 1',
            path: 'test-1',
        },
        {
            label: 'Test Namespace 2',
            path: 'test-2',
        },
        {
            label: 'Test Namespace 3',
            path: 'test-3',
        },
        {
            label: 'Test Namespace 4',
            path: 'test-4',
        },
        {
            label: 'Test Namespace 5',
            path: 'test-5',
        },
    ];

    constructor() {}

    ngOnInit() { /* do nothing */ }
}
