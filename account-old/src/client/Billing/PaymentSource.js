import React, {Component} from 'react';
import { Header, Button, Segment, Form, Icon, Divider } from 'semantic-ui-react'
import {CardElement, injectStripe} from 'react-stripe-elements';

class PaymentSource extends Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.state = {name: this.props.name ? this.props.name : ""};
  }
  handleInputChange = (e, { name, value }) => this.setState({ [name]: value });
  async submit(ev) {
    console.log("here");
    this.props.stripe.createSource({type: 'card', owner: {
           name: this.state.name, email: this.props.email
         }}).then(({source}) => {
          this.props.onSubmit({sourceId: source.id })
          console.log('Received Stripe token:', source);
    });
    
  }

  render() {
    return (
      <div className="checkout">
      <Segment padded='very'>
        <Form>
        <Divider horizontal>
          <Header as='h3'>
            <Icon name='credit card outline' />
            Credit or Debit Card
          </Header>
        </Divider>
          <Form.Input fluid label='Name on card' placeholder='Name'  
                                   name="name"
                                   defaultValue={this.state.name}
                  onChange={this.handleInputChange}/>
          <Form.Field>
          <CardElement />
          </Form.Field>
          <Divider hidden />
          <Button  onClick={this.submit}>Submit</Button>
        </Form>
          <img src="../../resources/powered_by_stripe.png" />
        </Segment>
      </div>
    );
  }
}

export default injectStripe(PaymentSource);
