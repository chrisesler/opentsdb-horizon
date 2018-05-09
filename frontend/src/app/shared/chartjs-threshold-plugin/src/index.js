var Chart = require('chart.js');

Chart = typeof(Chart) === 'function' ? Chart : window.Chart;

Chart.Threshold = Chart.Threshold || {};

Chart.Threshold.defaults = {
	editMode: false,
	maxLines: Number.MAX_VALUE,
	thresholds : []
};

Chart.Threshold.lineDefaults = {
	borderColor: '#000000',
	borderWidth: 1,
	borderDash: [],
	borderDashOffset: 0
};

var thresholdPlugin = require('./threshold.js')(Chart);

module.exports = thresholdPlugin;

Chart.pluginService.register(thresholdPlugin);