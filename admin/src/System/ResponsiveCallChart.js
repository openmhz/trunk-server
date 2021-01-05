import React, { Component }  from "react"
import CallChart from "./CallChart"
import { ParentSize } from "@vx/responsive";

class ResponsiveCallChart extends Component {
  constructor(props) {
    super(props);
  }

	render() {
		return(
      <ParentSize className="graph-container">
              {({ width: w, height: h }) => {
                return (
                  <CallChart
                    width={w}
                    height={h}
                    data={this.props.data}
                  />
                );
              }}
      </ParentSize>
		)
	}
}

export default ResponsiveCallChart
