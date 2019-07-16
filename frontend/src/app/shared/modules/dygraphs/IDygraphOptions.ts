// continue adding options
export interface DygraphOptionsAxis {
    valueFormatter?: any;
    labelFormatter?: any;
    tickFormat?: {
        unit?: string;
        precision?: number;
        unitDisplay?: boolean;
        max?: number;
    };
    valueRange?: number[];
    logscale?: boolean;
    drawAxis?: boolean;
    drawGrid?: boolean;
    independentTicks?: true;
    digitsAfterDecimal?: number;
    axisLabelWidth?: number;
}

export interface IDygraphOptions {
    title?: string;
    width?: number;
    height?: number;
    labels?: any;
    labelsUTC?: boolean;
    labelsDivWidth?: number; // width for label legend
    digitsAfterDecimal?: number;
    connectSeparatedPoints?: boolean;
    drawPoints?: boolean;
    dateWindow?: any[];
    isCustomZoomed?: boolean;
    file?: any;
    legend?: "follow" | "always" | "never" | "onmouseover";
    logscale?: boolean;
    stackedGraph: boolean;
    hightlightCircleSize?: number;
    highlightSeriesBackgroundAlpha?: number,
    strokeWidth?: number;
    strokeBorderWidth: number;
    axisLineWidth?: number;
    axisTickSize?: number;
    axisLineColor?: string;
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
    highlightCallback?: any;
    zoomCallback?: any;
    isZoomedIgnoreProgrammaticZoom?: boolean;
    drawCallback?: any;
    underlayCallback?: any;
    labelsKMB?: boolean;
    visibility?: boolean[];
    drawGrid?: boolean;
    gridLineColor?: string;
    plotter?: any[];
    interactionModel?: any;
    heatmap?: any;
    pointSize?: number;
    highlightCircleSize?: number;
    xAxisHeight?: number;
    xRangePad?: number;
}

