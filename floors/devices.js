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

d3.floorplan.devices = function() {
	var colors = "RdYlBu",
	x = d3.scale.linear(),
	y = d3.scale.linear(),
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	id = "fp-devices-" + new Date().valueOf(),
	name = "devices";

	function devices(g) {
		g.each(function(data) {
			if (!data) {
				return;
			}
			var g = d3.select(this);

			var vis = g.selectAll("g.devices").data([0]);
			vis.enter().append("g").attr("class","devices");
			
			if (this.__colors__ && this.__colors__ != colors) {
				vis.classed(this.__colors__, false);
			}
			vis.classed(colors, true);
			this.__colors__ = colors;
			
			var devices = vis.selectAll("circle").data(Object.keys(data.devices));
			var devicesEnter = devices.enter().append("circle").style("opacity", 1e-6);
		
			devices.exit().transition().style("opacity", 1e-6).remove();
		
			devices.attr("cx", function(d) {
							var region = data.regions[data.devices[d].region];
							var n = 2;
							var keys = Object.keys(data.devices);
							for (var o in keys) {
								if (keys[o] == d) {
									break;
								}
								if (data.devices[keys[o]].region == data.devices[d].region) {
									n+=2;
								}
							}
							return x(region.x - region.r + n);
							})
				.attr("cy", function(d) { return y(data.regions[data.devices[d].region].y); })
				.attr("r", function(d) { return y(1); })
				.attr("class", "device");

			devicesEnter.transition().style("opacity", 0.6);

			var deviceLabels = vis.selectAll("text").data(Object.keys(data.devices));
			var deviceLabelsEnter = deviceLabels.enter()
				.append("text")
				.style("font-weight", "bold")
				.attr("text-anchor", "middle")
				.style("opacity",1e-6);

			deviceLabels.exit().transition().style("opacity",1e-6).remove();

			deviceLabels.attr("transform", function(d) {
									var region = data.regions[data.devices[d].region];
									var n = 2;
									var keys = Object.keys(data.devices);
									for (var o in keys) {
										if (keys[o] == d) {
											break;
										}
										if (data.devices[keys[o]].region == data.devices[d].region) {
											n+=2;
										}
									}
									return "translate(" +
										x(region.x - region.r + n) + "," +
										y(data.regions[data.devices[d].region].y) + ")";
									})
				.text(function(d) { return d; });

			deviceLabelsEnter
				.transition()
				.style("opacity",0.6);
		});
	}
	
	devices.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return devices;
	};
	
	devices.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return devices;
	};
	
	devices.colorSet = function(scaleName) {
		if (! arguments.length) return colors;
		colors = scaleName;
		return devices;
	};
	
	devices.colorMode = function(mode) {
		if (! arguments.length) return scaleType;
		scaleType = mode;
		return devices;
	};
	
	devices.customThresholds = function(vals) {
		if (! arguments.length) return customThresholds;
		customThresholds = vals;
		return devices;
	};
	
	devices.id = function() {
		return id;
	};
	
	devices.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return devices;
	};
	
	return devices;
};
