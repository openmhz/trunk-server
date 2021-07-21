import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { Route, Switch } from 'react-router' // react-router v4/v5
import { ConnectedRouter } from 'connected-react-router'
import configureStore, { history } from './redux-router/configureStore'
import ReactGA from 'react-ga';


import 'semantic-ui-css/semantic.min.css'

// withTracker
import withTracker from './withTracker';

// Main
import MainContainer from "./Main/MainContainer"

// System
import ListSystemsContainer from "./System/ListSystemsContainer"

// Call
import CallPlayerContainer from "./Call/CallPlayerContainer"

import AboutComponent from "./About/AboutComponent"

ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS);

const store = configureStore(/* provide initial state if any */)

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}> { /* place ConnectedRouter under Provider */ }
      <> { /* your usual react-router v4/v5 routing */ }
        <Switch>
          <Route exact path="/" component={withTracker(MainContainer)} />
          <Route exact path="/systems" component={withTracker(ListSystemsContainer)} />
          <Route exact path="/system/:shortName" component={withTracker(CallPlayerContainer)} />
          <Route exact path="/about" component={withTracker(AboutComponent)} />
          <Route render={() => (<div>Miss</div>)} />
        </Switch>
      </>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
)