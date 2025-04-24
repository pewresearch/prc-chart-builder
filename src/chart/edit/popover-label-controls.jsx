// TODO: this is a WIP, not yet functional
// eventually create a popover that allows users to edit the labels of the chart
// when a user clicks on a node in the chart,
// the popover will appear with the current labels and tooltips
// the user can then edit the labels and tooltips and click save to update the chart
// the popover will have a button to reset the labels and tooltips to the default values
// might have to adjust how we handle this on a chart by chart basis

const renderPopover = (nodeData) => {
	const dataToReplace = chartData.find((obj) => {
		// find the object in chartData where the x value matches the x value of the nodeData
		// and obj[category] matches y value of the nodeData
		return obj.x === nodeData.x && obj[nodeData.category] === nodeData.y;
	});
	// get the index of the object in chartData
	// update the object in chartData with the new data
	const updatedData = {
		...dataToReplace,
		__labels: {
			...dataToReplace.__labels,
			[nodeData.category]: 'A New Label',
		},
	};
	// update the chartData array with the updated object
	const index = chartData.indexOf(dataToReplace);
	const updatedChartData = [
		...chartData.slice(0, index),
		updatedData,
		...chartData.slice(index + 1),
	];
	// set the updated chartData in the attributes
	setAttributes({
		chartData: updatedChartData,
	});
};
