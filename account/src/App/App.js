import React, { Component } from "react"
import Navigation from "./Navigation"
import { Routes, Route } from 'react-router-dom';

import Restricted from "./Restricted"

import Login from "../User/Login"
import Register from "../User/Register"
import Profile from "../User/Profile"
import ConfirmEmail from "../User/ConfirmEmail"
import WaitConfirmEmail from "../User/WaitConfirmEmail"
import SentConfirmEmail from "../User/SentConfirmEmail"
import SendResetPassword from "../User/SendResetPassword"
import ResetPassword from "../User/ResetPassword"
import Terms from "../User/Terms"

const App = (params) => {
	const { store } = params;
	return (
		<div>
			<Navigation />
			<Routes>
				<Route exact path="/" element={<Restricted><Profile /></Restricted>} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/wait-confirm-email" element={<WaitConfirmEmail />} />
				<Route path="/sent-confirm-email" element={<SentConfirmEmail />} />
				<Route path="/send-reset-password" element={<SendResetPassword />} />
				<Route path="/reset-password/:userId/:token" element={<ResetPassword />} />
				<Route path="/confirm-email/:userId/:token" element={<ConfirmEmail />} />
				<Route path="/terms" element={<Restricted><Terms /></Restricted>} />
				<Route path="/profile" element={<Restricted><Profile /></Restricted>} />
				<Route render={() => (<div>Miss</div>)} />
			</Routes>
		</div>
	)
};

export default App
