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

d3.floorplan.positions = function() {
	var colors = "RdYlBu",
	x = d3.scale.linear(),
	y = d3.scale.linear(),
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	id = "fp-positions-" + new Date().valueOf(),
	name = "positions";

	function positions(g) {
		g.each(function(data) {
			if (!data) {
				return;
			}
			var g = d3.select(this);

			var vis = g.selectAll("g.positions").data([0]);
			vis.enter().append("g").attr("class","positions");
			
			if (this.__colors__ && this.__colors__ != colors) {
				vis.classed(this.__colors__, false);
			}
			vis.classed(colors, true);
			this.__colors__ = colors;
			
			var positions = vis.selectAll("circle").data(Object.keys(data.positions));
			var positionsEnter = positions.enter().append("circle").style("opacity", 1e-6);
		
			positions.exit().transition().style("opacity", 1e-6).remove();
		
			positions.attr("cx", function(d) { return y(data.positions[d].x); })
				.attr("cy", function(d) { return y(data.positions[d].y); })
				.attr("r", function(d) { return y(2.5); })
				.attr("class", "position");

			positionsEnter.transition().style("opacity", 0.6);

			var positionLabels = vis.selectAll("text").data(Object.keys(data.positions));
			var positionLabelsEnter = positionLabels.enter()
				.append("text")
				.style("font-weight", "bold")
				.attr("text-anchor", "middle")
				.style("opacity",1e-6);

			positionLabels.exit().transition().style("opacity",1e-6).remove();

			positionLabels.attr("transform", function(d) {
									return "translate(" +
										x(data.positions[d].x) + "," +
										y(data.positions[d].y) + ")";
									})
				.text(function(d) { return d; });

			positionLabelsEnter
				.transition()
				.style("opacity",0.6);
		});
	}
	
	positions.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return positions;
	};
	
	positions.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return positions;
	};
	
	positions.colorSet = function(scaleName) {
		if (! arguments.length) return colors;
		colors = scaleName;
		return positions;
	};
	
	positions.colorMode = function(mode) {
		if (! arguments.length) return scaleType;
		scaleType = mode;
		return positions;
	};
	
	positions.customThresholds = function(vals) {
		if (! arguments.length) return customThresholds;
		customThresholds = vals;
		return positions;
	};
	
	positions.id = function() {
		return id;
	};
	
	positions.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return positions;
	};
	
	return positions;
};
