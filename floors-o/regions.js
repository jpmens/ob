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

d3.floorplan.regions = function() {
	var colors = "RdYlBu",
	x = d3.scale.linear(),
	y = d3.scale.linear(),
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	id = "fp-regions-" + new Date().valueOf(),
	name = "regions";

	function regions(g) {
		g.each(function(data) {
			if (!data) {
				return;
			}
			var g = d3.select(this);

			var vis = g.selectAll("g.regions").data([0]);
			vis.enter().append("g").attr("class","regions");
			
			if (this.__colors__ && this.__colors__ != colors) {
				vis.classed(this.__colors__, false);
			}
			vis.classed(colors, true);
			this.__colors__ = colors;
			
			var regions = vis.selectAll("circle").data(Object.keys(data.regions));
			var regionsEnter = regions.enter().append("circle").style("opacity", 1e-6);
		
			regions.exit().transition().style("opacity", 1e-6).remove();
		
			regions.attr("cx", function(d) { return x(data.regions[d].x); })
				.attr("cy", function(d) { return y(data.regions[d].y); })
				.attr("r", function(d) { return y(data.regions[d].r); })
				.attr("class", "region");

			regionsEnter.transition().style("opacity", 0.2);
		
			// regionLabels
			var regionLabels = vis.selectAll("text").data(Object.keys(data.regions));
			var regionLabelsEnter = regionLabels.enter()
				.append("text")
				.style("font-weight", "bold")
				.attr("text-anchor", "middle")
				.style("opacity",1e-6);

			regionLabels.exit().transition().style("opacity",1e-6).remove();

			regionLabels.attr("transform", function(d) {
				return "translate(" + x(data.regions[d].x ) + "," +
					y(data.regions[d].y - data.regions[d].r * 0.66) + ")";
			 })
				.text(function(d) { return d; });

			regionLabelsEnter
				.transition()
				.style("opacity",0.2);
		});
	}
    
	regions.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return regions;
	};
	
	regions.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return regions;
	};
	
	regions.colorSet = function(scaleName) {
		if (! arguments.length) return colors;
		colors = scaleName;
		return regions;
	};
	
	regions.colorMode = function(mode) {
		if (! arguments.length) return scaleType;
		scaleType = mode;
		return regions;
	};
	
	regions.customThresholds = function(vals) {
		if (! arguments.length) return customThresholds;
		customThresholds = vals;
		return regions;
	};
	
	regions.id = function() {
		return id;
	};
	
	regions.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return regions;
	};
	
	return regions;
};
