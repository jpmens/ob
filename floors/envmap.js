//
//   Copyright 2012 David Ciarletta
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

d3.floorplan.envmap = function() {
	var colors = "RdYlBu",
	scaleType = "quantized",
	x = d3.scale.linear(),
	y = d3.scale.linear(),
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	format = d3.format(".4n"),
	id = "fp-envmap-" + new Date().valueOf(),
	name = "envmap";

	function envmap(g) {
		g.each(function(data) {
			if (! data || ! data.XDKs) return;
			var g = d3.select(this);
			
			if (! data.units) {
				data.units = "";
			} else if (data.units.charAt(0) != ' ') {
				data.units = " " + data.units;
			}

			var temperatures = [];
			var lights = [];
			var humidities = [];
			var keys =  Object.keys(data.XDKs);
			for (var o in keys) {
				var name = keys[o];
				var sensorDictionary = data.XDKs[name];
				temperatures.push(sensorDictionary['temperature']); 
				lights.push(sensorDictionary['light']); 
				humidities.push(sensorDictionary['humidity']); 
			}
			temperatures.sort(d3.ascending);
			lights.sort(d3.ascending);
			humidities.sort(d3.ascending);
			var colorScale;
			var thresholds; 
			switch (scaleType) {
			  case "quantile": {
				colorScale = d3.scale.quantile()
							.range([1,2,3,4,5,6])
							.domain(temperatures);
				thresholds = colorScale.quantiles();
				break;
			  }
			  case "quantized": {
				colorScale = d3.scale.quantize()
							.range([1,2,3,4,5,6])
							.domain([temperatures[0],temperatures[temperatures.length-1]]);
				var incr = (colorScale.domain()[1] - colorScale.domain()[0]) 
							/ 6;
				thresholds = [incr, 2*incr, 3*incr, 4*incr, 5*incr];
				break;
			  } 
			  case "normal": {
				var mean = d3.mean(temperatures);
				var sigma = Math.sqrt(d3.sum(temperatures, 
						function(v) {return Math.pow(v-mean,2);})
						/temperatures.length);
				colorScale = d3.scale.quantile()
							.range([1,2,3,4,5,6])
							.domain([mean-6*sigma,mean-2*sigma,
							         mean-sigma,mean,mean+sigma,
							         mean+2*sigma,mean+6*sigma]);
				thresholds = colorScale.quantiles();
				break;
			  } 
			  default: { // custom
				if (! customThresholds) customThresholds = thresholds;
				var domain = customThresholds;
				domain.push(domain[domain.length-1]);
				domain.unshift(domain[0]);
				colorScale = d3.scale.quantile()
							.range([1,2,3,4,5,6])
							.domain(domain);
				customThresholds = thresholds = colorScale.quantiles();
				break;
			  }
			}
			var lightMean = d3.mean(lights);
			var lightSigma = Math.sqrt(d3.sum(lights, 
					function(v) {return Math.pow(v-lightMean,2);})
					/lights.length);
			lightScale = d3.scale.quantile()
						.range([1,2,3,4,5,6])
						.domain([lightMean-6*lightSigma,lightMean-2*lightSigma,
							 lightMean-lightSigma,lightMean,lightMean+lightSigma,
							 lightMean+2*lightSigma,lightMean+6*lightSigma]);
			lightThresholds = lightScale.quantiles();
			
			// setup container for visualization
			var vis = g.selectAll("g.envmap").data([0]);
			vis.enter().append("g").attr("class","envmap");
			
			if (this.__colors__ && this.__colors__ != colors) {
				vis.classed(this.__colors__, false);
			}
			vis.classed(colors, true);
			this.__colors__ = colors;
				
			var cells = vis.selectAll("rect").data(Object.keys(data.XDKs));
			cellsEnter = cells.enter().append("rect").style("opacity", 1e-6);
			
			cells.exit().transition().style("opacity", 1e-6).remove();
			
			cellsEnter.append("title");
			
			cells.attr("x", function(d) { return x(data.XDKs[d].x); })
			.attr("y", function(d) { return y(data.XDKs[d].y); })
			.attr("height", Math.abs(y(data.binSize) - y(0)))
			.attr("width", Math.abs(x(data.binSize) - x(0)))
			.attr("class", function(d) { return "d6-"+colorScale(data.XDKs[d].temperature); })
				.select("title")
		  		.text(function(d) { 
		  			return d + ": " + format(data.XDKs[d].temperature) + data.units; 
		  		});
			
			cellsEnter.transition().style("opacity", 0.6);

			var circles = vis.selectAll("circle").data(Object.keys(data.XDKs));
			circlesEnter = circles.enter().append("circle").style("opacity", 1e-6);
			
			circles.exit().transition().style("opacity", 1e-6).remove();
			
			circlesEnter.append("title");
			
			circles.attr("cx", function(d) { return x(data.XDKs[d].x + data.binSize / 2); })
				.attr("cy", function(d) { return y(data.XDKs[d].y + data.binSize / 2); })
				.attr("r", function(d) { return lightScale(data.XDKs[d].light); })
				.attr("class", "lights")
				.select("title")
		  		.text(function(d) { return d + ": " + format(data.XDKs[d].light);});
			
			circlesEnter.transition().style("opacity", 0.6);
		});
	}
	
	envmap.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return envmap;
	};
	
	envmap.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return envmap;
	};
	
	envmap.colorSet = function(scaleName) {
		if (! arguments.length) return colors;
		colors = scaleName;
		return envmap;
	};
	
	envmap.colorMode = function(mode) {
		if (! arguments.length) return scaleType;
		scaleType = mode;
		return envmap;
	};
	
	envmap.customThresholds = function(vals) {
		if (! arguments.length) return customThresholds;
		customThresholds = vals;
		return envmap;
	};
	
	envmap.id = function() {
		return id;
	};
	
	envmap.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return envmap;
	};
	
	return envmap;
};
