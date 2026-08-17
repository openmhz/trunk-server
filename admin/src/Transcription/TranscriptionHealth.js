import {
  Container,
  Header,
  Table,
  Icon,
  Message,
  Statistic,
  Segment,
  Label,
  Loader
} from "semantic-ui-react";
import { useGetTranscriptionStatsQuery } from "../features/api/apiSlice";

function formatAge(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 90) return `${seconds}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}

// ----------------------------------------------------
const TranscriptionHealth = () => {
  // Transcription is a background pipeline that fails softly by design - a
  // whisper outage leaves the site working perfectly and simply stops producing
  // transcripts. Polling keeps this screen honest while you watch it.
  const { data, isError, isLoading } = useGetTranscriptionStatsQuery(undefined, {
    pollingInterval: 15000,
  });

  if (isLoading) return <Container><Loader active inline="centered" /></Container>;
  if (isError || !data) {
    return (
      <Container>
        <Message negative content="Could not read transcription stats. Your admin session may have expired - try signing in again." />
      </Container>
    );
  }

  const { counts, oldestPendingAgeSec, stuckPending, lastDay, recentFailures, whisper } = data;

  // Two things actually mean "broken", and they are worth saying plainly rather
  // than leaving an operator to infer them from five numbers.
  const problems = [];
  if (!whisper.reachable) {
    problems.push(`The whisper service is unreachable (${whisper.error}). Nothing is being transcribed; calls are queueing and the rest of the site is unaffected.`);
  } else if (!whisper.warm) {
    problems.push("The whisper service is up but still loading its model.");
  }
  if (stuckPending > 0) {
    problems.push(`${stuckPending} call${stuckPending === 1 ? "" : "s"} aged past the cutoff without being transcribed. They will be retired to "expired" on the next sweep.`);
  }
  if (lastDay.realtimeFactor >= 0.9) {
    problems.push(`Whisper is spending ${lastDay.realtimeFactor}x realtime. Above 1.0 the queue grows faster than it drains during a busy net.`);
  }

  return (
    <Container>
      <Header as="h1">
        Transcription
        <Header.Subheader>
          Self-hosted Whisper. Transcripts are produced for every call and shown only to Supporters.
        </Header.Subheader>
      </Header>

      {problems.length > 0
        ? <Message negative icon="warning sign" header="Needs attention" list={problems} />
        : <Message positive icon="check circle" content="Transcription is keeping up." />}

      <Segment>
        <Statistic.Group widths="four" size="small">
          <Statistic color={counts.pending > 20 ? "orange" : undefined}>
            <Statistic.Value>{counts.pending}</Statistic.Value>
            <Statistic.Label>Waiting</Statistic.Label>
          </Statistic>
          <Statistic>
            <Statistic.Value>{formatAge(oldestPendingAgeSec)}</Statistic.Value>
            <Statistic.Label>Oldest waiting</Statistic.Label>
          </Statistic>
          <Statistic>
            <Statistic.Value>{lastDay.transcribed}</Statistic.Value>
            <Statistic.Label>Done, last 24h</Statistic.Label>
          </Statistic>
          <Statistic color={counts.failed > 0 ? "red" : undefined}>
            <Statistic.Value>{counts.failed}</Statistic.Value>
            <Statistic.Label>Failed</Statistic.Label>
          </Statistic>
        </Statistic.Group>
      </Segment>

      <Segment>
        <Header as="h3">Last 24 hours</Header>
        <Table basic="very" compact definition>
          <Table.Body>
            <Table.Row>
              <Table.Cell width={5}>Audio transcribed</Table.Cell>
              <Table.Cell>{lastDay.audioMinutes} minutes across {lastDay.transcribed} calls</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Came back empty</Table.Cell>
              <Table.Cell>
                {lastDay.noSpeech} of {lastDay.transcribed}
                <span style={{ color: "rgba(0,0,0,.5)" }}> — normal for short overs and squelch tails</span>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Average time per call</Table.Cell>
              <Table.Cell>{(lastDay.avgComputeMs / 1000).toFixed(1)}s</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Speed</Table.Cell>
              <Table.Cell>
                {lastDay.realtimeFactor}x realtime
                <span style={{ color: "rgba(0,0,0,.5)" }}> — below 1.0 means there is headroom</span>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Whisper</Table.Cell>
              <Table.Cell>
                {whisper.reachable
                  ? <span><Icon name="check circle" color="green" />{whisper.model}{whisper.warm ? " (warm)" : " (loading)"}</span>
                  : <span><Icon name="times circle" color="red" />unreachable — {whisper.error}</span>}
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>

      <Header as="h3">
        All calls in the archive
        <Header.Subheader>Calls are deleted after 30 days, and their transcripts with them.</Header.Subheader>
      </Header>
      <Label.Group size="large">
        <Label>Done<Label.Detail>{counts.done}</Label.Detail></Label>
        <Label>Waiting<Label.Detail>{counts.pending}</Label.Detail></Label>
        <Label>Too short to transcribe<Label.Detail>{counts.skipped}</Label.Detail></Label>
        <Label color={counts.failed ? "red" : undefined}>Failed<Label.Detail>{counts.failed}</Label.Detail></Label>
        <Label color={counts.expired ? "orange" : undefined}>Expired<Label.Detail>{counts.expired}</Label.Detail></Label>
      </Label.Group>

      {recentFailures.length > 0 &&
        <>
          <Header as="h3">Recent failures</Header>
          <Table celled compact>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>When</Table.HeaderCell>
                <Table.HeaderCell>System</Table.HeaderCell>
                <Table.HeaderCell>Length</Table.HeaderCell>
                <Table.HeaderCell>Attempts</Table.HeaderCell>
                <Table.HeaderCell>Reason</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {recentFailures.map((call) => (
                <Table.Row key={call._id} negative>
                  <Table.Cell>{new Date(call.time).toLocaleString()}</Table.Cell>
                  <Table.Cell>{call.shortName} / {call.talkgroupNum}</Table.Cell>
                  <Table.Cell>{Math.round(call.len)}s</Table.Cell>
                  <Table.Cell>{call.transcriptAttempts}</Table.Cell>
                  <Table.Cell>{call.transcriptError}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </>}
    </Container>
  );
};

export default TranscriptionHealth;
