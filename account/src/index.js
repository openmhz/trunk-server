import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { Route, Switch } from 'react-router' // react-router v4/v5
import { ConnectedRouter } from 'connected-react-router'
import configureStore, { history } from './redux-router/configureStore'
import 'semantic-ui-css/semantic.min.css'
import App from "./App/App"
import Restricted from "./App/Restricted"

import LoginContainer from "./User/LoginContainer"
import RegisterContainer from "./User/RegisterContainer"
import ProfileContainer from "./User/ProfileContainer"
import ConfirmEmailContainer from "./User/ConfirmEmailContainer"
import WaitConfirmEmailContainer from "./User/WaitConfirmEmailContainer"
import SentConfirmEmailContainer from "./User/SentConfirmEmailContainer"
import SendResetPasswordContainer from "./User/SendResetPasswordContainer"
import ResetPasswordContainer from "./User/ResetPasswordContainer"
import TermsContainer from "./User/TermsContainer"

const store = configureStore(/* provide initial state if any */)

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}> { /* place ConnectedRouter under Provider */ }
      <> 
      <App>
        <Switch>
        <Route path="/login" component={LoginContainer} />
        <Route path="/register" component={RegisterContainer} />
        <Route path="/wait-confirm-email" component={WaitConfirmEmailContainer} />
					<Route path="/sent-confirm-email" component={SentConfirmEmailContainer} />
					<Route path="/send-reset-password" component={SendResetPasswordContainer} />
					<Route path="/reset-password/:userId/:token" component={ResetPasswordContainer} />
					<Route path="/confirm-email/:userId/:token" component={ConfirmEmailContainer} />
					<Route path="/terms" component={Restricted(TermsContainer, store)} />
          <Route path="/profile" component={Restricted(ProfileContainer, store)} />
          <Route render={() => (<div>Miss</div>)} />
        </Switch>
        </App>
      </>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
)