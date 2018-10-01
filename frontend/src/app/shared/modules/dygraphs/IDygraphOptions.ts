// continue adding options
export interface DygraphOptionsAxis {
    valueFormatter?: any;
    labelFormatter?: any;
    tickFormat?: {
        unit?: string;
        precision?: string;
        unitDisplay?: boolean;
    };
    valueRange?: number[];
    logscale?: boolean;
    drawAxis?: boolean;
    drawGrid?: boolean;
    independentTicks?: true;
}

export interface IDygraphOptions {
    width?: number;
    height?: number;
    labels?: any;
    labelsUTC?: boolean;
    labelsDivWidth?: number; // width for label legend
    digitsAfterDecimal?: number;
    connectSeparatedPoints?: boolean;
    drawPoints?: boolean;
    file?: any;
    legend?: "follow" | "always" | "never" | "onmouseover";
    logscale?: boolean;
    stackedGraph: boolean;
    hightlightCircleSize?: number;
    strokeWidth?: number;
    strokeBorderWidth: number;
    highlightSeriesOpts?: any;
    axes?: {
        x?: DygraphOptionsAxis;
        y?: DygraphOptionsAxis;
        y2?: DygraphOptionsAxis;
    };
    xlabel?: string;
    ylabel?: string;
    y2label?: string;
    plugins?: any;
    thresholds?: any[];
    series?: any;
    labelsDiv?: any;
    legendFormatter?: any;
}

