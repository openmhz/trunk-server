import React, { Component } from "react";
import { Link, useNavigate } from 'react-router-dom'

import {
  Container,
  Header,
  Card,
  Icon,
  Menu,
  Divider,
  Table
} from "semantic-ui-react";
import NavBar from "../Common/NavBar"
import { useGetEventsQuery } from "../features/api/apiSlice";

// ----------------------------------------------------

const ListEvents = (props) => {

  const dateRange = (start, end) => {
    if (start.getYear() != end.getYear()) {
      return start.toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString() + " - " + end.toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + end.toLocaleTimeString();
    } else if (start.getMonth() != end.getMonth()) {
      return start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString() + " - " + end.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + end.toLocaleTimeString();

    } else if (start.getDay() != end.getDay()) {
      return start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString() + " - " + end.toLocaleDateString('en-us', { weekday: "short", day: "numeric" }) + " " + end.toLocaleTimeString();

    } else {
      return start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString() + " - " + end.toLocaleTimeString();

    }


  }

  const { data: events, isSuccess } = useGetEventsQuery();
  const navigate = useNavigate();
  //<Table.Cell>{event.shortNames.map( shortName => <Link to={"/system/"+shortName}>{shortName}</Link>  )}</Table.Cell>}
  return (
    <div>
      <NavBar />
      <Container >
        <Divider horizontal style={{ paddingTop: "5em", paddingBottom: "2em" }}><Header as="h1">Events<Icon name='rss' /></Header></Divider>
        <Table basic="very">
          <Table.Body>

            {isSuccess && events.map((event, index) =>
              <Table.Row key={index}>
                <Table.Cell><Link to={"/events/" + event._id}><Header as='h3'>{event.title}</Header></Link></Table.Cell>
                <Table.Cell>{event.description}</Table.Cell>
                <Table.Cell>{event.numCalls} Calls</Table.Cell>
                <Table.Cell>{dateRange(new Date(event.startTime), new Date(event.endTime))}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Container>
    </div>
  );
}


export default ListEvents;
