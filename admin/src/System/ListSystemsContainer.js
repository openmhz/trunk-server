import { connect } from "react-redux"
import * as systemActions from "./system-actions"
import ListSystems from "./ListSystems"

function mapStateToProps(state) {
  return {
		system: state.system
	}
}



export default connect(
	mapStateToProps,
	systemActions
)(ListSystems)
