import React from "react";
import { Group } from '@visx/group';
import { curveStep} from '@visx/curve';
import { LinePath } from '@visx/shape';
import { scaleLinear, scaleTime } from '@visx/scale';
import { timeParse, timeFormat } from 'd3-time-format';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Loader } from "semantic-ui-react";
import {
  Header
} from "semantic-ui-react";

function ActivityChart(props) {

    if (!props.data) {
        return (
          <Loader size='large'>Loading</Loader>
        )
      }

        var callTotals = [];

    
        const now = new Date();
        var maxDate = now;
        var minDate = now;
        var minValue = 0;
        var maxValue = 0;
        var MS_PER_MINUTE = 60000;

          for (let j = 0; j < props.data.length; j++) {
            let spotsBack = j;//statistic.callTotals.length - j;
            let time = new Date(now - spotsBack * 15 * MS_PER_MINUTE);
            if (time < minDate) minDate = time;
            if (props.data[j] > maxValue)
              maxValue = props.data[j];
            callTotals.push({ y: props.data[j], x: time });
          }


    



  // Define the graph dimensions and margins
  const width = 500; //props.width;
  const height = 250;
  const margin = { top: 20, bottom: 40, left: 40, right: 20 };
  const parseDate = timeParse("%Y%m%d");
  const format = timeFormat("%b %d");
  const formatDate = (date) => format(parseDate(date));
  const parseTime = timeParse('%Y-%m-%dT%H:%M:%S.%LZ');

  // Then we'll create some bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  var xScale, yScale;

      // We'll use some mock data from `@vx/mock-data` for this.
      // scales
      xScale = scaleTime({
        range: [0, xMax],
        domain: [minDate, maxDate],
        tickFormat: () => (val) => formatDate(val)
      });
      yScale = scaleLinear({
        range: [yMax, 0],
        domain: [0, maxValue],
      });
  
      const handleClick = (event) => {
        console.log('You clicked on:', event);
      };
    // accessors
    const x = d => xScale(d.x);
    const y = d => yScale(d.y);
  return (
    <div style={{float: 'left'}}>
    <Header as='h3'>{props.tg}</Header>
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        <AxisBottom top={yMax} scale={xScale} numTicks={width > 520 ? 10 : 5} />
        <AxisLeft scale={yScale} />
        <LinePath
          data={callTotals}
          x={x}
          y={y}
          onClick={handleClick}
          strokeWidth={2}
          stroke="blue"
          curve={curveStep}
        />
      </Group>
      </svg>
    </div>
  );
}

export default ActivityChart;


