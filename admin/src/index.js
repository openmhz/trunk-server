import React from 'react';
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import setupStore from './redux-router/configureStore'
import 'semantic-ui-css/semantic.min.css'
import App from "./App/App"


const store = setupStore(/* provide initial state if any */)



const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
)

