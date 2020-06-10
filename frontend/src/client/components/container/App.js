import React, { Component }  from "react"
import '../../../styling/semantic.less'
class App extends Component {
  constructor(props) {
    super(props);
  }

	render() {
		return(
			<div>
				{this.props.children}
			</div>
		)
	}
}

export default App
