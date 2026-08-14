import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import { Provider } from 'react-redux'
import setupStore from './redux-router/configureStore'

import App from "./app"

// Printed first thing on load so it is obvious which build is actually running
// in the browser. Diagnosing the player cost several rounds to stale bundles
// being reported as current, which is invisible without a marker like this.
console.log("[build] hamrecorder frontend BUILD-STAMP-15");

const store = setupStore(/* provide initial state if any */)

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App store={store}/>
    </BrowserRouter>
  </Provider>
)