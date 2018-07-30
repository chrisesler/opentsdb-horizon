// continue adding options
export interface IDygraphOptions {
    width?: number;
    height?: number;
    labels?: any;
    labelsDivWidth?: number; // width for label legend
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
}
