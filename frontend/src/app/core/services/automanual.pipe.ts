import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'formatAutoManualFilter' })
export class FormatAutoManualFilterPipe implements PipeTransform {
    constructor(private domSanitizer: DomSanitizer) {}
    transform(values: string[], tplVars: any[]): SafeHtml {
        const regexVars = /^!?\[.*\]$/;
        let retVals = [];
        for (let i = 0; i < values.length; i++) {
            let val = values[i];
            if (regexVars.test(val)) {
                const idx = tplVars.findIndex(f => f.mode === 'auto' && '[' + f.alias + ']' === val)
                if (idx > -1) {
                    retVals.push('<span style="background: green;padding: 4px; color: green;">' + val + '</span>');
                } else {
                    retVals.push('<span style="background: gray; padding: 4px; color: red;">' + val + '</span>');
                }
            } else {
                retVals.push(val);
            }
        }
        const htmlStr = retVals.join(', ');
        return this.domSanitizer.bypassSecurityTrustHtml(htmlStr);
    }
}
