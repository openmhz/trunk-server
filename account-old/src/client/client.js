import React from "react"
import { render } from "react-dom"
import { Provider } from "react-redux"
import { Switch, Route} from 'react-router-dom'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from "redux-thunk"
import {createLogger} from "redux-logger"
//import { ConnectedRouter, routerReducer, routerMiddleware, push } from 'react-router-redux'
import { routerMiddleware } from 'connected-react-router'
import { ConnectedRouter } from 'connected-react-router'
import isNode from "detect-node"
//import rootReducer from "./reducers"
import createRootReducer from './reducers'
import { createHashHistory } from 'history'
import createHistory from 'history/createBrowserHistory'

import App from "./components/container/App"
import LoginContainer from "./User/LoginContainer"
import RegisterContainer from "./User/RegisterContainer"
import ProfileContainer from "./User/ProfileContainer"
import BillingContainer from "./Billing/BillingContainer"
import Default from "./components/pure/Default"
import NavigationContainer from "./components/container/NavigationContainer"
import ConfirmEmailContainer from "./User/ConfirmEmailContainer"
import WaitConfirmEmailContainer from "./User/WaitConfirmEmailContainer"
import SentConfirmEmailContainer from "./User/SentConfirmEmailContainer"
import SendResetPasswordContainer from "./User/SendResetPasswordContainer"
import ResetPasswordContainer from "./User/ResetPasswordContainer"
import Restricted from "./components/container/Restricted"
import TermsContainer from "./User/TermsContainer"
import UpdatePlans from "./Plan/UpdatePlansContainer"

// Create a history of your choosing (we're using a browser history in this case)
const history = createHistory()

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
// Also apply our middleware for navigating
const store = createStore(
  createRootReducer(history),
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

          <Route exact path="/" component={Restricted(ProfileContainer, store)} />
        <Route path="/login" component={LoginContainer} />
          <Route path="/register" component={RegisterContainer} />
					<Route path="/wait-confirm-email" component={WaitConfirmEmailContainer} />
					<Route path="/sent-confirm-email" component={SentConfirmEmailContainer} />
					<Route path="/send-reset-password" component={SendResetPasswordContainer} />
					<Route path="/reset-password/:userId/:token" component={ResetPasswordContainer} />
					<Route path="/confirm-email/:userId/:token" component={ConfirmEmailContainer} />
					<Route path="/terms" component={Restricted(TermsContainer, store)} />

          <Route path="/billing" component={Restricted(BillingContainer, store)} />
          <Route path="/profile" component={Restricted(ProfileContainer, store)} />
          <Route path="/update-plans" component={Restricted(UpdatePlans, store)} />
				</Switch>
        </App>
      </div>
    </ConnectedRouter>
	</Provider>
	, document.getElementById("app"))
