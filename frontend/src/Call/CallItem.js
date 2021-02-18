
import React, { Component } from "react";
import {
  Table,
  Icon,
  Label
} from "semantic-ui-react";
import { connect } from "react-redux"
import { bindActionCreators } from 'redux'
import * as callActionCreators from "./call-actions"


function mapStateToProps(state, props) {
  return {
    shortName: props.shortName

	}
}

function mapDispatchToProps(dispatch) {
  return {
    callActions: bindActionCreators(callActionCreators, dispatch)
  }
}


class CallItem extends Component {
constructor(props) {
  super(props);
  this.hideStar = this.hideStar.bind(this);
  this.showStar = this.showStar.bind(this);
  this.addStar = this.addStar.bind(this);
  this.state = {
    starVisible: false,
    starClicked: false
  }
}
sourceString(call) {
    var srcString = "";
    if (call.srcList) {
        for (var src in call.srcList) {
          /*  srcNum = call.srcList[src].src;
            if (sources.hasOwnProperty(srcNum)) {
                srcString = srcString + sources[srcNum].codeName + ", ";
            }*/
        }
    }

    return srcString;
}

componentDidUpdate(){
  if (this.props.activeCall) {
    console.log("Active call mounted")
  }
}
addStar(e) {
 e.preventDefault();
 e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
 if (!this.state.starClicked) {
   
    this.props.callActions.addStar(this.props.call._id);
    this.setState({starClicked: true});
 }
}

hideStar() {
  this.setState({ starVisible: false })
}

showStar() {
  this.setState({ starVisible: true })
}

render() {
  const call = this.props.call;
  const time = new Date(call.time);
  var rowSelected={};
  let starButton;
  var starClickable = {};
  if (!this.state.starClicked) {
    starClickable = {link: true };
  }
  if (!call.star && this.state.starVisible) {
    starButton = <Icon name='star outline' />
  }

  if (call.star) {
    starButton = <Icon name='star' />
  }
  if (call.star && call.star > 1) {
    starButton = (<Icon.Group >
    <Icon {...starClickable} name='star' />
    <Label circular color='red' size='mini' floating>
      {call.star}
    </Label>
  </Icon.Group>)
  }

  if (this.props.activeCall) {
    rowSelected={positive: true,
      color: "blue",
       key: "blue",
        inverted: true
      } 
  }
  var talkgroup;
  if ((typeof this.props.talkgroups  == 'undefined') || (typeof this.props.talkgroups[call.talkgroupNum] == 'undefined')) {
      talkgroup = call.talkgroupNum;
  } else {
      talkgroup = this.props.talkgroups[call.talkgroupNum].description;
  }
  return (
    <Table.Row  onClick={(e) => this.props.onClick({call: call}, e)} {...rowSelected}>
    <Table.Cell>  {call.len} </Table.Cell>
    <Table.Cell> {talkgroup} </Table.Cell>
    <Table.Cell> {time.toLocaleTimeString()} </Table.Cell>
    <Table.Cell onMouseEnter={this.showStar} onMouseLeave={this.hideStar} onClick={this.addStar}>{starButton}</Table.Cell>
    </Table.Row>


  );
}
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(CallItem)

