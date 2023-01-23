import React from 'react';
import { createRoot } from 'react-dom/client';
import { Routes ,Route } from 'react-router-dom';
import { BrowserRouter } from "react-router-dom";
import { Provider } from 'react-redux'
import configureStore, { history } from './redux-router/configureStore'

import 'semantic-ui-css/semantic.min.css'

// withTracker
//import withTracker from './withTracker';

// Main
import Main from "./Main/Main"

// System
import ListSystems from "./System/ListSystems"

// Call
import Calls from "./Call/Calls"

import AboutComponent from "./About/AboutComponent"

// Event

import ListEvents from "./Event/ListEvents"
import ViewEvent from "./Event/ViewEvent"

const store = configureStore(/* provide initial state if any */)

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
  <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Main/>} />
          <Route exact path="/systems" element={<ListSystems/>} />
          <Route exact path="/system/:shortName" element={<Calls/>} />
          <Route exact path="/events" element={<ListEvents/>} />
          <Route exact path="/events/:id" element={<ViewEvent/>} />
          <Route exact path="/about" element={<AboutComponent/>} />

        </Routes>
        </BrowserRouter>
  </Provider>
)