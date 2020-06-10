import React, { Component }  from "react"

class Default extends Component {
  constructor(props) {
    super(props);
  }

	render() {
		return(
			<div>
				<h2>React-Passport-Redux-Example</h2>
				<p>Demonstration of PassportJS authentication in React w/ Redux. Use the links above to register a new user and login/logout. You will only be able to view the MyProfile page when you are logged in. Logging in will redirect you to MyProfile if you had clicked that link beforehand.</p>
				<p>I'll be doing my best to document code with useful comments so look for more detail there. Note: you should be able to implement the authentication functionality using less packages. I was working on another project before deciding to make this example repo so some bloat may have travelled over from that.</p>
				<p>In full, this repo demonstrates:</p>
				<ul>
					<li><strong>React</strong> for the view layer </li>
					<li><strong>PassportJS</strong> for authentication (using a Local Strategy)</li>
					<li><strong>Redux</strong> to handle our state</li>
					<li><strong>React Router</strong> for routing client-side</li>
					<li><strong>Express</strong> for handling server requests (REST and page requests)</li>
					<li><strong>MongoDB</strong> for our database, with <strong>Mongoose</strong> handling our schema</li>
					<li><strong>Webpack</strong> to bundle our client-side code</li>
					<li>Hot reloading using <strong>webpack-dev-middleware</strong> and <strong>webpack-hot-middleware</strong></li>
				</ul>
				<p>Shoutout to GitHub member <b>choonkending</b> whose <a href="https://github.com/choonkending/react-webpack-node" target="_blank">repo</a> was a big help. Pull requests and comments / issue reports are most welcome!</p>
			</div>
		)
	}
}

export default Default
