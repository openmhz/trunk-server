import { useState } from "react";
import {
  Container,
  Header,
  Table,
  Icon,
  Input,
  Checkbox,
  Label,
  Menu,
  Message,
  Segment,
  Loader
} from "semantic-ui-react";
import { useGetLoginEventsQuery } from "../features/api/apiSlice";

// Failure reasons come from the account service's login controller. Anything
// unrecognised is shown as-is rather than swallowed.
const REASON_TEXT = {
  "ok": "Signed in",
  "no such account": "No such account",
  "bad password": "Wrong password",
  "disabled": "Account disabled",
  "unconfirmed email": "Email not confirmed",
};

function formatPlace(event) {
  const place = [event.city, event.region, event.country].filter(Boolean).join(", ");
  return place || "Unknown";
}

// ----------------------------------------------------
const LoginActivity = () => {
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState({ q: "", onlyFailures: false, page: 1 });

  const { data, isFetching, isError } = useGetLoginEventsQuery(query);

  const runSearch = () => setQuery((q) => ({ ...q, q: searchText, page: 1 }));

  const events = data && data.events ? data.events : [];
  const suspects = data && data.suspects ? data.suspects : [];

  return (
    <Container>
      <Header as="h1">
        Login Activity
        <Header.Subheader>
          Every sign-in attempt, successful or not. Kept for 90 days, then deleted automatically.
        </Header.Subheader>
      </Header>

      {suspects.length > 0 &&
        <Segment color="red">
          <Header as="h3">
            <Icon name="warning sign" />
            Repeated failures in the last 24 hours
          </Header>
          <Table basic="very" compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>IP address</Table.HeaderCell>
                <Table.HeaderCell>Location</Table.HeaderCell>
                <Table.HeaderCell textAlign="center">Failures</Table.HeaderCell>
                <Table.HeaderCell textAlign="center">Addresses tried</Table.HeaderCell>
                <Table.HeaderCell>Last attempt</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {suspects.map((s) => (
                <Table.Row key={s.ip}>
                  <Table.Cell>
                    {/* Clicking the address filters the table below to it. */}
                    <a href="#activity" onClick={() => { setSearchText(s.ip); setQuery({ q: s.ip, onlyFailures: true, page: 1 }); }}>
                      {s.ip}
                    </a>
                  </Table.Cell>
                  <Table.Cell>{formatPlace(s)}</Table.Cell>
                  <Table.Cell textAlign="center"><Label circular color="red">{s.failures}</Label></Table.Cell>
                  <Table.Cell textAlign="center">{s.accountCount}</Table.Cell>
                  <Table.Cell>{new Date(s.lastAt).toLocaleString()}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>}

      <Menu secondary stackable id="activity">
        <Menu.Item>
          <Input
            icon={<Icon name="search" link onClick={runSearch} />}
            placeholder="Callsign, email, IP or city"
            value={searchText}
            onChange={(e, { value }) => setSearchText(value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
          />
        </Menu.Item>
        <Menu.Item>
          <Checkbox
            toggle
            label="Failures only"
            checked={query.onlyFailures}
            onChange={(e, { checked }) => setQuery((q) => ({ ...q, onlyFailures: checked, page: 1 }))}
          />
        </Menu.Item>
        <Menu.Item position="right">
          {isFetching && <Loader active inline size="small" />}
        </Menu.Item>
      </Menu>

      {isError && <Message negative content="Could not load login activity. Your admin session may have expired - try signing in again." />}

      <Table celled compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>When</Table.HeaderCell>
            <Table.HeaderCell>Callsign</Table.HeaderCell>
            <Table.HeaderCell>Email tried</Table.HeaderCell>
            <Table.HeaderCell>Result</Table.HeaderCell>
            <Table.HeaderCell>IP address</Table.HeaderCell>
            <Table.HeaderCell>Location</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {events.length === 0 && !isFetching &&
            <Table.Row>
              <Table.Cell colSpan="6" textAlign="center">Nothing recorded yet.</Table.Cell>
            </Table.Row>}
          {events.map((event) => (
            <Table.Row key={event._id} negative={!event.success}>
              <Table.Cell>{new Date(event.createdAt).toLocaleString()}</Table.Cell>
              <Table.Cell>{(event.callsign || "").toUpperCase() || "—"}</Table.Cell>
              <Table.Cell>{event.email}</Table.Cell>
              <Table.Cell>
                {event.success
                  ? <span><Icon name="check circle" color="green" />Signed in</span>
                  : <span><Icon name="times circle" color="red" />{REASON_TEXT[event.reason] || event.reason}</span>}
              </Table.Cell>
              <Table.Cell>{event.ip}</Table.Cell>
              <Table.Cell>{formatPlace(event)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {data && data.pages > 1 &&
        <Menu pagination>
          <Menu.Item as="a" icon disabled={query.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>
            <Icon name="chevron left" />
          </Menu.Item>
          <Menu.Item>Page {data.page} of {data.pages}</Menu.Item>
          <Menu.Item as="a" icon disabled={query.page >= data.pages} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>
            <Icon name="chevron right" />
          </Menu.Item>
        </Menu>}
    </Container>
  );
};

export default LoginActivity;
