import React, { Component } from "react";

import {
  Container,
  Divider,
  Checkbox,
  Button,
  Header,
  Table, Form
} from "semantic-ui-react";
// ----------------------------------------------------


function planPrice(planType) {
  switch(planType) {
    case freePlanValue:
    return freePlanPrice;
    case proPlanValue:
    return proPlanPrice;
  }
}


class ListPlans extends Component {
 

 
 
  constructor(props) {
    super(props);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    var plans = {};
    var prices = {};
    var total = 0;

    this.props.systems.forEach(system => {
      plans[system.shortName] = system.planType;
      prices[system.shortName] = planPrice(system.planType);
      total += planPrice(system.planType);
    });
    this.state = { plans: plans, prices: prices, total: total };
  }


  handleCancel() {
    var obj = {}
    this.props.systems.forEach(system => {
      obj[system.shortName] = system.planType;
    });
    this.setState({ plans: obj });
  }
  handleUpdate() {
    this.props.onUpdate(this.state.plans);
  }

  componentDidMount() {
  }

  handleInputChange(e, { name, value }) {
    var plans = this.state.plans;
    var prices = this.state.prices;
    var total = 0;
    plans[name] = value;
    prices[name] = planPrice(value);
    for (var system in prices) {
      total += prices[system];
    }
    this.setState({ plans: plans, prices: prices, total: total });
  }
  //https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
  //https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {

    return (
      <div>
        <Table definition>
          <Table.Header>
            
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell textAlign='center'>Free</Table.HeaderCell>
              <Table.HeaderCell textAlign='center'>Pro</Table.HeaderCell>
              <Table.HeaderCell textAlign='center'>Monthly Price</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <tbody>
          {this.props.systems.map((system) =>

            <Table.Row key={system.shortName}>
              <Table.Cell>
                <Header as='h4'>
                  <Header.Content>
                    {system.name}
                    <Header.Subheader>{system.shortName}</Header.Subheader>
                  </Header.Content>

                </Header>
              </Table.Cell>
              <Table.Cell textAlign='center'>
                <Checkbox
                  radio
                  value={0}
                  name={system.shortName}
                  checked={this.state.plans[system.shortName] === 0}
                  onChange={this.handleInputChange}
                />
              </Table.Cell>
              <Table.Cell textAlign='center'>
                <Checkbox
                  radio
                  value={10}
                  name={system.shortName}
                  checked={this.state.plans[system.shortName] === 10}
                  onChange={this.handleInputChange}
                />
              </Table.Cell>
              <Table.Cell textAlign='center'>${this.state.prices[system.shortName]}</Table.Cell>
            </Table.Row>

          )}
            <Table.Row key="total">
             <Table.Cell></Table.Cell>
             <Table.Cell></Table.Cell>
             <Table.Cell textAlign='right'>Estimated Monthly Total:</Table.Cell>
             <Table.Cell textAlign='center'>${this.state.total}</Table.Cell>
            </Table.Row>
            </tbody>
        </Table>
        <Button.Group floated="right">
          <Button content='Cancel' onClick={this.handleCancel} />
          <Button content='Update' onClick={this.handleUpdate} primary />
        </Button.Group>
      </div>
    );
  }
}

export default ListPlans;