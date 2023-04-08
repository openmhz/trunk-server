import React from "react";
import { Group } from '@visx/group';
import { curveStep} from '@visx/curve';
import { LinePath } from '@visx/shape';
import { scaleLinear, scaleTime } from '@visx/scale';
import { timeParse, timeFormat } from 'd3-time-format';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Loader } from "semantic-ui-react";

const CallChart = (props) => {

  var callData = props.data;
  if (!callData) {
    return (
      <Loader size='large'>Loading</Loader>
    )
  }

  var callTotals = callData.callTotals;
  var errorTotals = callData.errorTotals;

  // Define the graph dimensions and margins
  const width = props.width;
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

  var xScale, yScale;
  if (callData) {
      // We'll use some mock data from `@vx/mock-data` for this.
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
  }

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
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
export default CallChart;
