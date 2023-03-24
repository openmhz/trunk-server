import React, { Component } from "react";
import { Group } from '@visx/group';
import { curveStep} from '@visx/curve';
import { LinePath } from '@visx/shape';
import { scaleLinear, scaleBand, scaleTime } from '@visx/scale';
import { timeParse, timeFormat } from 'd3-time-format';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Dimmer, Loader } from "semantic-ui-react";


class CallChart extends Component {
constructor(props) {
  super(props);
}

  render() {
    var callData = this.props.data;
    if (!callData) {
      return (

        <Loader size='large'>Loading</Loader>

      )
    }
    var callTotals = [];
    var errorTotals = [];

    // Define the graph dimensions and margins
    const width = this.props.width;
    const height = 500;
    const margin = { top: 20, bottom: 40, left: 40, right: 20 };
    const parseDate = timeParse("%Y%m%d");
    const format = timeFormat("%b %d");
    const formatDate = (date) => format(parseDate(date));

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
    var xScale, yScale, xPoint, yPoint;
    if (callData) {
        // We'll use some mock data from `@vx/mock-data` for this.
       callTotals = callData.callTotals;
       errorTotals = callData.errorTotals;
        // scales
        xScale = scaleTime({
          range: [0, xMax],
          domain: [callData.minDate, callData.maxDate],
          tickFormat: () => (val) => formatDate(val)
        });
        yScale = scaleLinear({
          range: [yMax, 0],
          domain: [0, callData.maxValue],
        });
        xPoint = compose(xScale, x);
        yPoint = compose(yScale, y);
    }

  return (
<svg width={width} height={height}>
<Group left={margin.left} top={margin.top} >
<AxisBottom top={yMax} scale={xScale} numTicks={width > 520 ? 10 : 5} />
<AxisLeft scale={yScale} />
<LinePath
              data={callTotals}
              x={x}
              y={y}
              strokeWidth={2}
              curve={curveStep}
            />
            <LinePath
                          data={errorTotals}
                          x={x}
                          y={y}
                          strokeWidth={2}
                          stroke="red"
                          curve={curveStep}
                        />
  </Group>
</svg>
);
}


}
export default CallChart;
