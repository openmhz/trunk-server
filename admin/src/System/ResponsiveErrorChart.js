import ErrorChart from "./ErrorChart"
import { ParentSize } from "@visx/responsive";

const ResponsiveErrorChart = (props) => {

  return (
    <ParentSize className="graph-container">
      {({ width: w, height: h }) => {
        return (
          <ErrorChart
            width={w}
            height={h}
            data={props.data}
          />
        );
      }}
    </ParentSize>
  )
}

export default ResponsiveErrorChart
