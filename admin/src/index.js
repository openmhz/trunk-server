import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { Route, Switch } from 'react-router' // react-router v4/v5
import { ConnectedRouter } from 'connected-react-router'
import configureStore, { history } from './redux-router/configureStore'
import 'semantic-ui-css/semantic.min.css'
import App from "./App/App"
import Restricted from "./App/Restricted"

import About from "./Components/About"
import SystemContainer from "./System/SystemContainer"
import ListSystemsContainer from "./System/ListSystemsContainer"
import UpdateSystemContainer from "./System/UpdateSystemContainer"
import CreateSystemContainer from "./System/CreateSystemContainer"

const store = configureStore(/* provide initial state if any */)


ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}> { /* place ConnectedRouter under Provider */ }
      <> 
      <App>
        <Switch>
          <Route path="/about" component={Restricted(About, store)} />
          <Route path="/system/:shortName" component={Restricted(SystemContainer, store)} />
          <Route path="/update-system/:shortName" component={Restricted(UpdateSystemContainer, store)} />
					<Route path="/create-system" component={Restricted(CreateSystemContainer, store)} />
          <Route path="/list-systems" component={Restricted(ListSystemsContainer,store)} />
          <Route path="/" component={Restricted(ListSystemsContainer, store)} />
          <Route render={() => (<div>Miss</div>)} />
        </Switch>
        </App>
      </>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
)

