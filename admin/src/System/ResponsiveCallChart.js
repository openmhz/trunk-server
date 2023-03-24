import React, { Component } from "react"
import CallChart from "./CallChart"
import { ParentSize } from "@visx/responsive";

const ResponsiveCallChart = (props) => {

  return (
    <ParentSize className="graph-container">
      {({ width: w, height: h }) => {
        return (
          <CallChart
            width={w}
            height={h}
            data={props.data}
          />
        );
      }}
    </ParentSize>
  )
}


export default ResponsiveCallChart
