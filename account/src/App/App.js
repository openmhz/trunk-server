import React, { Component }  from "react"
import NavigationContainer from "./NavigationContainer"

class App extends Component {
	render() {
		return(
			<div>
				<NavigationContainer />
				{this.props.children}
			</div>
		)
	}
}

export default App
