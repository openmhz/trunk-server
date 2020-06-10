import React from "react"
import { render } from "react-dom"
import { Provider } from "react-redux"
import { Switch, Route} from 'react-router-dom'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from "redux-thunk"
import {createLogger} from "redux-logger"
import { ConnectedRouter } from 'connected-react-router'
import { routerMiddleware } from 'connected-react-router'
import isNode from "detect-node"
import createRootReducer from './reducers'
import createHistory from 'history/createBrowserHistory'
import ReactGA from 'react-ga';

import App from "./components/container/App"
import About from "./components/pure/About"

// Main
import MainContainer from "./Main/MainContainer"

// System
import ListSystemsContainer from "./System/ListSystemsContainer"

// Call
import CallPlayerContainer from "./Call/CallPlayerContainer"

// Create a history of your choosing (we're using a browser history in this case)
const history = createHistory()

ReactGA.initialize('UA-45563211-1');
history.listen((location, action) => {
  ReactGA.pageview(location.pathname + location.search);
  console.log(location.pathname)
});

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
						<Route exact path="/" component={MainContainer} />
          <Route exact path="/systems" component={ListSystemsContainer} />
					<Route exact path="/system/:shortName" component={CallPlayerContainer} />
          </Switch>
        </App>
      </div>
    </ConnectedRouter>
	</Provider>
	, document.getElementById("app"))
