import { connect } from "react-redux"
import * as systemActions from "../System/system-actions"
import * as billingActions from "../Billing/billing-actions"
import UpdatePlans from "./UpdatePlans"
import { bindActionCreators } from 'redux'

function mapStateToProps(state) {
  return {
		system: state.system,
		user: state.user
	}
}



export default connect(
	mapStateToProps,
	systemActions
)(UpdatePlans)
