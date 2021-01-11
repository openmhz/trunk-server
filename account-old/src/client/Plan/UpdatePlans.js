import React, { Component } from "react";
import {
  Container,
  Divider,
  Modal,
  Button,
  Segment,
  Icon,
  Link,
  Header, Form, List} from "semantic-ui-react";
import ListPlans from "./ListPlans"


function planName(planType) {
  switch(planType) {
    case freePlanValue:
    return "Free";
    case proPlanValue:
    return "Pro";
  }
}

// ----------------------------------------------------
class UpdatePlans extends Component {
  constructor(props) {
    super(props);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.findPlanChanges = this.findPlanChanges.bind(this);
  }

  state = { modalOpen: false, updatedPlans: {}, changes: [] }

  showModal =  () => this.setState({ modalOpen: true })
  closeModal = () => this.setState({ modalOpen: false })

  findPlanChanges(plans) {
    var changes = [];
    const systems = this.props.system.items;
    systems.forEach(system => {
      const newPlan = plans[system.shortName];
      if (newPlan != system.planType) {
        changes.push( system.name + " - " + planName(newPlan));
      }
    });
    return changes;
  }


  handleOk(){
    this.props.updatePlan(this.state.updatedPlans);
    this.closeModal();
  }

  handleCancel() {
    this.setState({updatedPlans: {}});
    this.closeModal();
  }

  handleUpdate(plans) {
    const changes = this.findPlanChanges(plans);

    if (Array.isArray(changes) && changes.length) {
      var result = Object.keys(plans).map(function(key) {
        return {shortName: key, planType: plans[key]};
      });
      this.setState({updatedPlans: result, changes: changes});
      this.showModal()

    
    }

  }
 
  componentDidMount() {
  		this.props.fetchSystems();
  	}

//https://stackoverflow.com/questions/36559661/how-can-i-dispatch-from-child-components-in-react-redux
//https://stackoverflow.com/questions/42597602/react-onclick-pass-event-with-parameter
  render() {
    const systems = this.props.system.items;
    const billingDefined = this.props.user.billing;
    return (
      <div>
        <Container text>
        <Modal size="tiny" open={this.state.modalOpen} onClose={this.closeModal}>
          <Modal.Header>Update Plans</Modal.Header>
          <Modal.Content>

            <Header as='h4'>The following changes will be made:</Header>
            <List as='ul'>
            {this.state.changes.map((change) =>
              <List.Item as='li' content={change}/>
            )}
            </List>
          </Modal.Content>
          <Modal.Actions>
          <Button onClick={this.handleCancel} >
            Cancel
          </Button>
          <Button onClick={this.handleOk} primary>
            OK
          </Button>
          </Modal.Actions>
        </Modal>
          <Form>
          <Header as="h1">System Plans</Header>

            <Divider />
            {billingDefined? (
           <ListPlans systems={systems} onUpdate={this.handleUpdate} key={systems.length}/>
            ) : (
              <Segment>
              <Header icon>
                <Icon name='credit card outline' />
                You need to add a Payment Method before you can upgrade a Plan
              </Header>
              <Button primary
              to='/billing'>Add Payment Method</Button>
            </Segment>
            )}
          </Form>
        </Container>
      </div>
    );
  }
}

export default UpdatePlans;
