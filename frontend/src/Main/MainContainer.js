import { connect } from "react-redux"
import * as systemActions from "../System/system-actions"
import Main from "./Main"

function mapStateToProps(state) {
  return {
		system: state.system
	}
}



export default connect(
	mapStateToProps,
	systemActions
)(Main)
