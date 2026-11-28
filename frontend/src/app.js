

import { Routes ,Route, useLocation } from 'react-router-dom';
import ErrorBoundary from "./Common/ErrorBoundary";
import { usePageTracking } from "./tracking";

import 'semantic-ui-css/semantic.min.css'

// Main
import Main from "./Main/Main"

// System
import ListSystems from "./System/ListSystems"

// Call
import Calls from "./Call/Calls"

import AboutComponent from "./About/AboutComponent"
import Terms from "./About/Terms"

// Event
import ListEvents from "./Event/ListEvents"
import ViewEvent from "./Event/ViewEvent"


const App = () => {
usePageTracking();
const { pathname } = useLocation();

return (
      // keyed by path so navigating away from a crashed page recovers
      <ErrorBoundary key={pathname}>
        <Routes>
          <Route exact path="/" element={<Main/>} />
          <Route exact path="/systems" element={<ListSystems/>} />
          <Route exact path="/system/:shortName" element={<Calls/>} />
          <Route exact path="/events" element={<ListEvents/>} />
          <Route exact path="/events/:id" element={<ViewEvent/>} />
          <Route exact path="/about" element={<AboutComponent/>} />
          <Route exact path="/terms" element={<Terms/>} />
        </Routes>
      </ErrorBoundary>
)
}

export default App;