import React, { Component }  from "react"
import ErrorChart from "./ErrorChart"
import { ParentSize } from "@visx/responsive";

class ResponsiveErrorChart extends Component {
  constructor(props) {
    super(props);
  }

	render() {
		return(
      <ParentSize className="graph-container">
              {({ width: w, height: h }) => {
                return (
                  <ErrorChart
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

export default ResponsiveErrorChart
