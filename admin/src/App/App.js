import React, { Component } from "react"
import NavigationContainer from "./NavigationContainer"
import { Routes, Route } from 'react-router-dom';

import Restricted from "./Restricted"

import About from "../Components/About"
import System from "../System/System"
import ListSystems from "../System/ListSystems"
import UpdateSystem from "../System/UpdateSystem"
import CreateSystem from "../System/CreateSystem"


const App = (params) => {
		const {store} = params;
		return (
			<div>
				<NavigationContainer />
				<Routes>
					<Route path="/about"  element={ <Restricted><About/></Restricted>} />
					<Route path="/system/:shortName" element={ <Restricted><System/></Restricted>} />
					<Route path="/update-system/:shortName" element={ <Restricted><UpdateSystem/></Restricted>} />
					<Route path="/create-system" element={ <Restricted><CreateSystem/></Restricted>}  />
					<Route path="/list-systems" element={ <Restricted><ListSystems/></Restricted>}  />
					<Route path="/" element={ <Restricted><ListSystems/></Restricted>} />
					<Route render={() => (<div>Miss</div>)} />
				</Routes>
			</div>
		)
		/*
		return (
			<div>
				<NavigationContainer />
				<Routes>
					<Route path="/about" element={<About />}   component={Restricted(About, store)} />
					<Route path="/system/:shortName" component={Restricted(SystemContainer, store)} />
					<Route path="/update-system/:shortName" component={Restricted(UpdateSystemContainer, store)} />
					<Route path="/create-system" component={Restricted(CreateSystemContainer, store)} />
					<Route path="/list-systems" component={Restricted(ListSystemsContainer, store)} />
					<Route path="/" component={Restricted(ListSystemsContainer, store)} />
					<Route render={() => (<div>Miss</div>)} />
				</Routes>
			</div>
		)*/
	
};

export default App
