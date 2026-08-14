

import { Routes ,Route } from 'react-router-dom';
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

import ActivityChart from './Call/BetterActivityChart';

import RequireListener from "./Common/RequireListener"


const App = () => {
usePageTracking();

return (
        <Routes>
          <Route exact path="/" element={<Main/>} />
          <Route exact path="/systems" element={<ListSystems/>} />
          {/* Call content is gated by the backend. Without this wrapper the
              page renders empty for signed-out visitors, which reads as broken
              rather than as needing an account. */}
          <Route exact path="/system/:shortName" element={<RequireListener><Calls/></RequireListener>} />
          <Route exact path="/about" element={<AboutComponent/>} />
          <Route exact path="/test" element={<ActivityChart/>} />
          <Route exact path="/terms" element={<Terms/>} />
        </Routes>
)
}

export default App;