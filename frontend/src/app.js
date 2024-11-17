

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

// Event
import ListEvents from "./Event/ListEvents"
import ViewEvent from "./Event/ViewEvent"
import ActivityChart from './Call/BetterActivityChart';


const App = () => {
usePageTracking();

return (
        <Routes>
          <Route exact path="/" element={<Main/>} />
          <Route exact path="/systems" element={<ListSystems/>} />
          <Route exact path="/system/:shortName" element={<Calls/>} />
          <Route exact path="/events" element={<ListEvents/>} />
          <Route exact path="/events/:id" element={<ViewEvent/>} />
          <Route exact path="/about" element={<AboutComponent/>} />
          <Route exact path="/test" element={<ActivityChart/>} />
          <Route exact path="/terms" element={<Terms/>} />
        </Routes>
)
}

export default App;