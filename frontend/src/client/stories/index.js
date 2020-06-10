import React from 'react';
import { storiesOf } from '@storybook/react';
import { Button } from '@storybook/react/demo';
import SystemCard from '../System/SystemCard.js';
import 'semantic-ui-css/semantic.min.css'

storiesOf('Button', module)
  .add('with text', () => (
    <Button>Hello Button</Button>
  ))
  .add('with some emoji', () => (
    <Button><span role="img" aria-label="so cool">😀 😎 👍 💯</span></Button>
  ));   


  export const system = {active: false,
    callAvg: 1,
    city: "",
    clientCount: 1,
    country: "",
    description: "This is an awesome system",
    name: "Awesome Town",
    planType: 10,
    shortName: "awesome",
    screenName: "luke",
    state: "AL",
    systemType: "state"}

storiesOf('SystemCard', module).add("standard", () => { 
  return (<SystemCard system={system} key={system.shortName} onClick={(e) => this.props.changeUrl("/system/" + system.shortName)}/>)
     
});