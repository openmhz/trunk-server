import React from "react"
import { render } from "react-dom"
import { Provider } from "react-redux"
import { Switch, Route} from 'react-router-dom'
import { applyMiddleware,  createStore } from 'redux'
import { routerMiddleware } from 'connected-react-router'
import { ConnectedRouter } from 'connected-react-router'
import thunk from "redux-thunk"
import {createLogger} from "redux-logger"
import isNode from "detect-node"
import createRootReducer from './reducers'
import { createBrowserHistory } from 'history'

import About from "./components/pure/About"
import App from "./components/container/App"
import NavigationContainer from "./components/container/NavigationContainer"
import Restricted from "./components/container/Restricted"

// System
import SystemContainer from "./System/SystemContainer"
import EditSystemContainer from "./System/EditSystemContainer"
import CreateSystemContainer from "./System/CreateSystemContainer"
import ListSystemsContainer from "./System/ListSystemsContainer"


// Create a history of your choosing (we're using a browser history in this case)
export const history = createBrowserHistory()

// Build the middleware for intercepting and dispatching navigation actions
const historyMiddleware = routerMiddleware(history)

let middleware = [
	thunk,
  historyMiddleware
]

// only add Redux-Logger on the client-side because it causes problems server-side.
if (!isNode) {
	middleware.push(createLogger())
}


// Add the reducer to your store on the `router` key
// Also apply our middleware for navigatin
const store = createStore(
  createRootReducer(history), // root reducer with router state
  applyMiddleware(thunk,
		historyMiddleware, createLogger())
)

/*
<Route path="/system/:shortName" component={Restricted(SystemContainer, store)} />
<Route path="/update-system/:shortName" component={Restricted(EditSystemContainer, store)} />
<Route path="/create-system" component={Restricted(CreateSystemContainer, store)} />
<Route path="/list-systems" component={Restricted(ListSystemsContainer, store)} />

<Route path="/system/:shortName" component={Restricted(SystemContainer, store)} />
<Route path="/update-system/:shortName" component={EditSystemContainer} />
<Route path="/create-system" component={CreateSystemContainer} />
<Route path="/list-systems" component={ListSystemsContainer} />
*/
render(
	<Provider store={store}>
    <ConnectedRouter history={history}>
      <div>
        <App>
          <Switch>
						<Route path="/about" component={About} />
          <Route exact path="/" component={Restricted(ListSystemsContainer, store)} />
					{/* -- System -- */}
					<Route path="/system/:shortName" component={Restricted(SystemContainer, store)} />
					<Route path="/update-system/:shortName" component={Restricted(EditSystemContainer, store)} />
					<Route path="/create-system" component={Restricted(CreateSystemContainer, store)} />
					<Route path="/list-systems" component={Restricted(ListSystemsContainer, store)} />
				</Switch>
        </App>
      </div>
    </ConnectedRouter>
	</Provider>
	, document.getElementById("app"))
