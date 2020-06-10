import { connect } from "react-redux"
import * as billingActions from "./billing-actions"
import Billing from "./Billing"

function mapStateToProps(state) {
  return {
        user: state.user,
		billing: state.billing
	}
}



export default connect(
	mapStateToProps,
	billingActions
)(Billing)
