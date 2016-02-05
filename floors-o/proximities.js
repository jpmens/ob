//
//   Copyright 2016 Christoph Krey
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

d3.floorplan.proximities = function() {
	var colors = "RdYlBu",
	x = d3.scale.linear(),
	y = d3.scale.linear(),
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	id = "fp-proximities-" + new Date().valueOf(),
	name = "proximities";

	function proximities(g) {
		g.each(function(data) {
			if (!data) {
				return;
			}
			var g = d3.select(this);

			var vis = g.selectAll("g.proximities").data([0]);
			vis.enter().append("g").attr("class","proximities");
			
			if (this.__colors__ && this.__colors__ != colors) {
				vis.classed(this.__colors__, false);
			}
			vis.classed(colors, true);
			this.__colors__ = colors;
			
			var proximities = vis.selectAll("circle").data(Object.keys(data.devices));
			var proximitiesEnter = proximities.enter().append("circle").style("opacity", 1e-6);
		
			proximities.exit().transition().style("opacity", 1e-6).remove();
		
			proximities.attr("cx", function(d) {
							var beacon = data.beacons[data.devices[d].beacon];
							var n = 3;
							var keys = Object.keys(data.devices);
							for (var o in keys) {
								if (keys[o] == d) {
									break;
								}
								if (data.devices[keys[o]].beacon == data.devices[d].beacon) {
									n+=3;
								}
							}
							return x(beacon.x - beacon.r + n);
							})
				.attr("cy", function(d) { return y(data.beacons[data.devices[d].beacon].y); })
				.attr("r", function(d) { return y(1); })
				.attr("class", "proximity");

			proximitiesEnter.transition().style("opacity", 0.6);

			var proximityLabels = vis.selectAll("text").data(Object.keys(data.devices));
			var proximityLabelsEnter = proximityLabels.enter()
				.append("text")
				.style("font-weight", "bold")
				.attr("text-anchor", "middle")
				.style("opacity",1e-6);

			proximityLabels.exit().transition().style("opacity",1e-6).remove();

			proximityLabels.attr("transform", function(d) {
									var beacon = data.beacons[data.devices[d].beacon];
									var n = 3;
									var keys = Object.keys(data.devices);
									for (var o in keys) {
										if (keys[o] == d) {
											break;
										}
										if (data.devices[keys[o]].beacon == data.devices[d].beacon) {
											n+=3;
										}
									}
									return "translate(" +
										x(beacon.x - beacon.r + n) + "," +
										y(data.beacons[data.devices[d].beacon].y) + ")";
									})
				.text(function(d) { return d; });

			proximityLabelsEnter
				.transition()
				.style("opacity",0.6);
		});
	}
	
	proximities.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return proximities;
	};
	
	proximities.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return proximities;
	};
	
	proximities.colorSet = function(scaleName) {
		if (! arguments.length) return colors;
		colors = scaleName;
		return proximities;
	};
	
	proximities.colorMode = function(mode) {
		if (! arguments.length) return scaleType;
		scaleType = mode;
		return proximities;
	};
	
	proximities.customThresholds = function(vals) {
		if (! arguments.length) return customThresholds;
		customThresholds = vals;
		return proximities;
	};
	
	proximities.id = function() {
		return id;
	};
	
	proximities.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return proximities;
	};
	
	return proximities;
};
