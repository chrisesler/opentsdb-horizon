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
import { TestBed } from '@angular/core/testing';

import {
    ALERTS_TESTING_SERVICES_IMPORTS
} from '../alerts-testing.utils';

import { AlertConverterService } from './alert-converter.service';

describe('AlertConverterService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: ALERTS_TESTING_SERVICES_IMPORTS,
        providers: [AlertConverterService]
    }));

    it('should be created', () => {
        const service: AlertConverterService = TestBed.inject(
            AlertConverterService,
        );
        expect(service).toBeTruthy();
    });
});
