import Navigation from "./Navigation"
import { Routes, Route, Link } from 'react-router-dom';
import { Container, Header } from 'semantic-ui-react';

import {AdminRestricted, Restricted} from "./Restricted"

import About from "../Components/About"
import System from "../System/System"
import AllSystems from "../AllSystems/AllSystems"
import ListSystems from "../System/ListSystems"
import UpdateSystem from "../System/UpdateSystem"
import CreateSystem from "../System/CreateSystem"
import ActiveUsers from "../ActiveUsers/ActiveUsers"


const App = (params) => {
		return (
			<div>
				<Navigation/>
				<Routes>
					<Route path="/about"  element={ <Restricted><About/></Restricted>} />
					<Route path="/system/:shortName" element={ <Restricted><System/></Restricted>} />
					<Route path="/update-system/:shortName" element={ <Restricted><UpdateSystem/></Restricted>} />
					<Route path="/create-system" element={ <Restricted><CreateSystem/></Restricted>}  />
					<Route path="/list-systems" element={ <Restricted><ListSystems/></Restricted>}  />
					<Route path="/all-systems" element={ <AdminRestricted><AllSystems/></AdminRestricted>}  />
					<Route path="/active-users" element={ <AdminRestricted><ActiveUsers/></AdminRestricted>}  />
					<Route path="/" element={ <Restricted><ListSystems/></Restricted>} />
					<Route path="*" element={<Container text><Header as="h2">Page not found</Header><p>That page does not exist. <Link to="/list-systems">Back to your systems</Link></p></Container>} />
				</Routes>
			</div>
		)
};

export default App
