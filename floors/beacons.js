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

d3.floorplan.beacons = function() {
	var colors = "RdYlBu",
	x = d3.scale.linear(),
	y = d3.scale.linear(),
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	id = "fp-beacons-" + new Date().valueOf(),
	name = "beacons";

	function beacons(g) {
		g.each(function(data) {
			if (!data) {
				return;
			}
			var g = d3.select(this);

			var vis = g.selectAll("g.beacons").data([0]);
			vis.enter().append("g").attr("class","beacons");
			
			if (this.__colors__ && this.__colors__ != colors) {
				vis.classed(this.__colors__, false);
			}
			vis.classed(colors, true);
			this.__colors__ = colors;
			
			var beacons = vis.selectAll("circle").data(Object.keys(data.beacons));
			var beaconsEnter = beacons.enter().append("circle").style("opacity", 1e-6);
		
			beacons.exit().transition().style("opacity", 1e-6).remove();
		
			beacons.attr("cx", function(d) { return x(data.beacons[d].x); })
				.attr("cy", function(d) { return y(data.beacons[d].y); })
				.attr("r", function(d) { return y(data.beacons[d].r); })
				.attr("class", "beacon");

			beaconsEnter.transition().style("opacity", 0.2);
		
			var beaconLabels = vis.selectAll("text").data(Object.keys(data.beacons));
			var beaconLabelsEnter = beaconLabels.enter()
				.append("text")
				.style("font-weight", "bold")
				.attr("text-anchor", "middle")
				.style("opacity",1e-6);

			beaconLabels.exit().transition().style("opacity",1e-6).remove();

			beaconLabels.attr("transform", function(d) {
				return "translate(" + x(data.beacons[d].x ) + "," +
					y(data.beacons[d].y - data.beacons[d].r * 0.66) + ")";
			})
				.text(function(d) { return d; });

			beaconLabelsEnter
				.transition()
				.style("opacity",0.2);
		});
	}
	
	beacons.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return beacons;
	};
	
	beacons.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return beacons;
	};
	
	beacons.colorSet = function(scaleName) {
		if (! arguments.length) return colors;
		colors = scaleName;
		return beacons;
	};
	
	beacons.colorMode = function(mode) {
		if (! arguments.length) return scaleType;
		scaleType = mode;
		return beacons;
	};
	
	beacons.customThresholds = function(vals) {
		if (! arguments.length) return customThresholds;
		customThresholds = vals;
		return beacons;
	};
	
	beacons.id = function() {
		return id;
	};
	
	beacons.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return beacons;
	};
	
	return beacons;
};
