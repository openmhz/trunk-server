import React, { Component } from "react";
import { Group } from '@vx/group';
import { GlyphCircle } from '@vx/glyph';
import { scaleLinear, scaleBand, scaleTime, scaleOrdinal } from '@vx/scale';
import { timeParse, timeFormat } from 'd3-time-format';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { Dimmer, Loader } from "semantic-ui-react";
import {
  LegendOrdinal

} from '@vx/legend';
class ErrorChart extends Component {
constructor(props) {
  super(props);
}

  render() {
    var errorData = this.props.data;
    if (!errorData) {
      return (
        <Loader size='large'>Loading</Loader>
      )
    }
    var data = [];
    const parseDate = timeParse("%Y%m%d");
    const format = timeFormat("%b %d");
    const formatDate = (date) => format(parseDate(date));

    // Define the graph dimensions and margins
    const width = this.props.width;
    const height = 500;
    const margin = { top: 20, bottom: 40, left: 40, right: 20 };

    // Then we'll create some bounds
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    // accessors
    const x = d => d.x;
    const y = d => d.y;



    // Compose together the scale and accessor functions to get point functions
    const dotColor = n => {
      var colores_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
      return colores_g[n % colores_g.length];
    }

    const compose = (scale, accessor) => (data) => scale(accessor(data));
    var zScale = scaleOrdinal({
      domain: errorData.legend,
      range: ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"]
    });
    var xScale, yScale, xPoint, yPoint;
    if (errorData) {
        // We'll use some mock data from `@vx/mock-data` for this.
       data = errorData.data;
        // scales
        xScale = scaleTime({
          range: [0, xMax],
          domain: [errorData.minDate, errorData.maxDate],
          tickFormat: () => (val) => formatDate(val)
        });
        yScale = scaleLinear({
          range: [yMax, 0],
          domain: [0, errorData.maxValue],
        });
        zScale = scaleOrdinal({
          domain: errorData.legend,
          range: ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"]
        });
        xPoint = compose(xScale, x);
        yPoint = compose(yScale, y);

    }

  return (
    <div style={{
      width: 900
    }}>
<svg width={width} height={height} style={{
  float: "left"
}}>
<Group left={margin.left} top={margin.top} >
<AxisBottom top={yMax} scale={xScale} numTicks={width > 520 ? 10 : 5} />
<AxisLeft scale={yScale} />
{data.map((band, i) => {
return (
    <Group key={`band-${i}`}>
    {band.data.map((point, j) => {
  return (
    <GlyphCircle
      className="dot"
      key={`point-${point.x}-${j}`}
      fill={dotColor(i)}
      left={xScale(x(point))}
      top={yScale(y(point))}
      size={6.0}
    />
  );
})}
</Group>
);
})}
</Group>
</svg>
<div
          style={{
            float: "right"
          }}
        >
          <LegendOrdinal
            scale={zScale}
            labelMargin="0 15px 0 0"
            onMouseOver={data => event => {
            console.log(
              `mouse over: ${data.text}`,
              `index: ${data.index}`,
            );
          }}
          />
        </div>
</div>



);
}


}
export default ErrorChart;
