import React from 'react';
import { CircularProgress } from '@mui/material';
import './Popup.css';
import SplitButton from '../../assets/Components/Dropdownbutton';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ButtonAppBar from '../../assets/Components/TopBar';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Stack } from '@mui/material';
import { GOOGLE_API_KEY, OPEN_AI_KEY } from '../../secrets/secrets.beta';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
const datejs = require('datejs');

const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: OPEN_AI_KEY,
});

function process_api_return(api_output) {
  try {
    const trim = api_output.trim();
    const firstLine = trim.split('\n')[0];
    const API_results = firstLine.split(',');
    console.log(API_results);
    if (API_results.length != 3) {
      return [Date.parse('today').at('12:00PM'), Date.parse('today').at('1PM')];
    }
    let start_time;
    let end_time;
    if (API_results[1] === 'NA') {
      start_time = '12:00PM';
    } else {
      start_time = API_results[1];
    }

    if (API_results[2] === 'NA') {
      end_time = '';
    } else {
      end_time = API_results[2];
    }
    console.log(start_time);
    console.log(end_time);

    if (
      API_results[0].toLowerCase().includes('today') ||
      API_results[0].includes('/')
    ) {
      console.log('Case 1');
      let start_date = Date.parse(API_results[0]).at(start_time);
      let end_date;
      if (end_time === '') {
        end_date = Date.parse(API_results[0]).at(start_time).addHours(1);
      } else {
        end_date = Date.parse(API_results[0]).at(end_time);
      }

      return [start_date, end_date];
    } else if (API_results[0].includes('th')) {
      console.log('Case 2');
      let start_date = Date.parse(API_results[0]).at(start_time);
      let addMonth = false;
      if (start_date < Date.parse('now')) {
        start_date = start_date.addMonths(1);
        addMonth = true;
      }
      let end_date;
      if (end_time === '') {
        end_date = Date.parse(API_results[0]).at(start_time).addHours(1);
      } else {
        end_date = Date.parse(API_results[0]).at(end_time);
        if (addMonth) {
          end_date = end_date.addMonths(1);
        }
      }

      return [start_date, end_date];
    } else if (API_results[0].includes('+')) {
      console.log('Case 3');
      let split = API_results[0].split('+');
      if (Date.parse(split[0]) < Date.parse('now')) {
        split[1] = parseInt(split[1]) + 1;
        console.log(split[1]);
      }

      let start_date = Date.parse(split[0]).addWeeks(split[1]).at(start_time);
      let end_date;
      if (end_time === '') {
        end_date = Date.parse(split[0])
          .addWeeks(split[1])
          .at(start_time)
          .addHours(1);
      } else {
        end_date = Date.parse(split[0]).addWeeks(split[1]).at(end_time);
      }
      return [start_date, end_date];
    } else {
      console.log('Case 4');
      let start_date = Date.parse('today').at(start_time);
      let end_date;
      if (end_time === '') {
        end_date = Date.parse('today').at(start_time).addHours(1);
      } else {
        end_date = Date.parse('today').at(end_time);
      }

      return [start_date, end_date];
    }
  } catch {
    console.log('Case 5');
    return [Date.parse('today').at('12:00PM'), Date.parse('today').at('1PM')];
  }
}

const openai = new OpenAIApi(configuration);
const context =
  "Take this text as input and return the meeting dates and times listed in the text. For example:\nHi Prof., Would love to chat today. Can I get the zoom link? I can hop on around 4:15. Thanks, Arjun->Today+0,4:15PM,NA\nCan we meet at 4 tomorrow?->Today+1,4:00PM,NA\nCan we meet at 5 on December 25th?->12/25,5:00PM,NA\nCan we meet at 5 on 13/5?->5/13,5:00PM,NA\nCan we meet two days from now?->Today+2,NA,NA\nWe are meeting in eleven days.->Today+11,NA,NA\nWe are meeting in 11 days at 5 in the morning. Shouldn't last more than 3 hours->Today+11,5:00AM,8:00AM\nWe are meeting tomorrow->Today+1,NA,NA\nLet's meet no later than 6PM in four days->Today+4,6:00PM,NA\nLet's meet three weeks from today at 11 in the morning->Today+21,11:00AM,NA\nLet's meet a week from today and party at 11 at night->Today+7,11:00PM,NA\nLet's meet tonight at 8PM->Today+0,8:00PM,NA\nLet's meet tomorrow morning at 6. Should last two hours.->Today+1,6:00AM,8:00AM\nCan we meet Monday?->Monday+0,NA,NA\nCan we meet on the 13th?->13th,NA,NA\nCan we meet on the 15th at 1PM. Clear your calendar for five hours.->15th,1PM,6PM\nCan we meet January 1st->1/01,NA,NA\nCan we meet on Friday->Friday+0,NA,NA\nSee you in three days in the morning at 6. Expect to be with me for three hours->Today+3,6:00AM,9:00AM\nLet's meet two Friday's from now->Friday+1,NA,NA\nLet's meet Thursday the 15th->15th,NA,NA\nLet's meet next next Monday->Monday+1,NA,NA\nLet's meet in a week at 6pm->Today+7,6:00PM,NA\nLet's meet in two weeks at 6am->Today+14,6:00AM,NA\nThis Monday at 5PM->Monday+0,5:00PM,NA\nNext Monday->Monday+0,NA,NA\nA week from Monday at 3PM->Monday+1,3:00PM,NA\nHey John, can you help me five weeks from Wednesday?->Wednesday+5,NA,NA\nNext next next Monday at 3PM for 3 hours->Monday+2,3:00PM,6:00PM\nWe will have an info session next Thursday March the 15th at 3PM->3/15,3:00PM,NA\nWe will have an info session next Thursday May the 15th at 5->5/15,5:00PM,NA\nWe will have a test a week after tomorrow from 5 to 8.->Today+8,5:00PM,8:00PM\nHi all, we will have a test a week after yesterday in the morning starting at 6. It will last 2 hours.->Today+6,6:00AM,8:00AM\nHi all - I realized that I changed the canvas but never sent an announcement: my section time will be permanently changed to 4:30-5:30pm on Sunday (still in the Quincy JCR) due to a recurring conflict. Sorry for any inconvenience! (By the way, the plan for tomorrow's section is to spend half the time reviewing lecture material, and half hopefully seeing some cool dark magic measure theory problems that I like. Hope to see you there!)->Sunday+0,4:30PM,5:30PM\n";

let theme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#ffb74d',
    },
    secondary: {
      main: '#2196f3',
    },
  },
});

const Popup = () => {
  const [screen, setScreen] = React.useState(2);
  const [start, setStart] = React.useState(null);
  const [end, setEnd] = React.useState(null);
  const [title, setTitle] = React.useState(null);
  const [on_gcal, setOnGcal] = React.useState(false);
  const [writtenPrompt, setWrittenPrompt] = React.useState(null);

  if (!on_gcal) {
    chrome.tabs.query(
      { active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
      function (tabs) {
        console.log(tabs[0].url);
        console.log(tabs[0].url.includes('mail.google.com/mail'));
        if (tabs[0].url.includes('mail.google.com/mail')) {
          setOnGcal(true);
        }
      }
    );
  }

  const gcal_api_insert = async (token) => {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: title,
          end: {
            dateTime: end,
          },
          start: {
            dateTime: start,
          },
        }),
      }
    );

    let data = await response.json();
    return data;
  };
  async function parseText(text) {
    let response = await openai.createCompletion({
      model: 'text-davinci-002',
      prompt: context + text + '->',
      temperature: 0,
      max_tokens: 20,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    let date_time_info = response.data.choices[0].text;
    console.log(date_time_info);
    let [start_date, end_date] = process_api_return(date_time_info);
    console.log(start_date);
    console.log(end_date);
    setStart(start_date);
    setEnd(end_date);
  }
  async function popup1() {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(
        activeTab.id,
        { message: 'queryPageText' },
        async function (response) {
          if (response === undefined) {
            setScreen(8);
          }
          let text = response.text;
          await parseText(text);
          setScreen(3);
        }
      );
    });
  }

  async function popup2() {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(
        activeTab.id,
        { message: 'queryHighlightedText' },
        async function (response) {
          console.log(response);
          if (response === undefined) {
            setScreen(8);
          }
          let text = response.text;
          await parseText(text);
          setScreen(3);
        }
      );
    });
  }

  if (screen === 1) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          verticalAlign: 'middle',
          backgroundColor: theme.palette.primary.main,
          height: 260,
        }}
      >
        <div style={{ paddingTop: 85 }}>
          <ThemeProvider theme={theme}>
            <CircularProgress size={80} color="secondary" />
          </ThemeProvider>
        </div>
      </div>
    );
  } else if (screen === 2) {
    return (
      <div
        style={{
          verticalAlign: 'middle',
          backgroundColor: theme.palette.primary.main,
          height: 260,
        }}
      >
        <ThemeProvider theme={theme}>
          <ButtonAppBar />
        </ThemeProvider>
        <div
          style={{ display: ' flex', justifyContent: 'center', paddingTop: 30 }}
        >
          <img
            src={require('../../assets/img/logo.svg')}
            style={{ height: 130, width: 'auto' }}
          />
        </div>
        <div
          style={{ display: 'flex', paddingTop: 0, justifyContent: 'center' }}
        >
          <ThemeProvider theme={theme}>
            <SplitButton
              setRequested={setScreen}
              handler1={popup1}
              handler2={popup2}
              options={
                on_gcal
                  ? [
                      'Schedule Selected',
                      'Schedule With Words',
                      'Magically Schedule',
                    ]
                  : ['Schedule Selected', 'Schedule With Words']
              }
              color="secondary"
            />
          </ThemeProvider>
        </div>
      </div>
    );
  } else if (screen === 3) {
    return (
      <div
        style={{
          verticalAlign: 'middle',
          backgroundColor: theme.palette.primary.main,
          height: 260,
        }}
      >
        <ThemeProvider theme={theme}>
          <ButtonAppBar />
        </ThemeProvider>

        <div
          style={{ display: ' flex', justifyContent: 'center', paddingTop: 10 }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2}>
              <DateTimePicker
                renderInput={(params) => <TextField {...params} />}
                label="Start time"
                value={start}
                onChange={(newValue) => {
                  setStart(newValue);
                }}
              />
              <DateTimePicker
                renderInput={(params) => <TextField {...params} />}
                label="End time"
                value={end}
                onChange={(newValue) => {
                  setEnd(newValue);
                }}
              />
            </Stack>
          </LocalizationProvider>
        </div>

        <div
          style={{ display: 'flex', paddingTop: 15, justifyContent: 'center' }}
        >
          <Stack direction="row" spacing={2}>
            <ThemeProvider theme={theme}>
              <Button
                variant="contained"
                onClick={() => {
                  setScreen(4);
                }}
                color="success"
              >
                <CheckIcon />
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setStart(null);
                  setEnd(null);
                  setScreen(2);
                }}
                color="error"
              >
                <CloseIcon />
              </Button>
            </ThemeProvider>
          </Stack>
        </div>
      </div>
    );
  } else if (screen === 4) {
    return (
      <div
        style={{
          verticalAlign: 'middle',
          backgroundColor: theme.palette.primary.main,
          height: 260,
        }}
      >
        <ThemeProvider theme={theme}>
          <ButtonAppBar />
        </ThemeProvider>

        <div
          style={{ display: ' flex', justifyContent: 'center', paddingTop: 10 }}
        >
          <TextField
            fullWidth
            label="Title Your Event"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div
          style={{ display: 'flex', paddingTop: 70, justifyContent: 'center' }}
        >
          <Stack direction="row" spacing={3}>
            <ThemeProvider theme={theme}>
              <Button
                variant="contained"
                onClick={() => {
                  chrome.identity.getAuthToken(
                    { interactive: true },
                    async function (token) {
                      setScreen(1);
                      let result = await gcal_api_insert(token);
                      console.log(result);
                      setEnd(null);
                      setStart(null);
                      setTitle(null);
                      if (result.status === 'confirmed') {
                        setScreen(6);
                      } else {
                        setScreen(7);
                      }
                    }
                  );
                }}
                color="success"
                sx={{ height: 50, width: 130 }}
              >
                Schedule Event
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setStart(null);
                  setEnd(null);
                  setTitle(null);
                  setScreen(2);
                }}
                color="error"
                sx={{ height: 50, width: 130 }}
              >
                Cancel Scheduling
              </Button>
            </ThemeProvider>
          </Stack>
        </div>
      </div>
    );
  } else if (screen === 5) {
    return (
      <div
        style={{
          verticalAlign: 'middle',
          backgroundColor: theme.palette.primary.main,
          height: 260,
        }}
      >
        <ThemeProvider theme={theme}>
          <ButtonAppBar />
        </ThemeProvider>

        <div
          style={{ display: ' flex', justifyContent: 'center', paddingTop: 10 }}
        >
          <TextField
            sx={{ width: 300 }}
            label="Describe your event"
            value={writtenPrompt}
            onChange={(event) => setWrittenPrompt(event.target.value)}
            multiline
            rows={3}
            variant="filled"
          />
        </div>

        <div
          style={{ display: 'flex', paddingTop: 30, justifyContent: 'center' }}
        >
          <Stack direction="row" spacing={3}>
            <ThemeProvider theme={theme}>
              <Button
                variant="contained"
                onClick={async () => {
                  setScreen(1);
                  await parseText(writtenPrompt);
                  setScreen(3);
                }}
                color="success"
                sx={{ height: 50, width: 130 }}
              >
                Parse Info
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setStart(null);
                  setEnd(null);
                  setTitle(null);
                  setScreen(2);
                }}
                color="error"
                sx={{ height: 50, width: 130 }}
              >
                Cancel Scheduling
              </Button>
            </ThemeProvider>
          </Stack>
        </div>
      </div>
    );
  } else if (screen === 6) {
    return (
      <div
        style={{
          verticalAlign: 'middle',
          backgroundColor: theme.palette.primary.main,
          height: 260,
        }}
      >
        <div style={{ paddingTop: 70 }}>
          <Alert
            action={
              <Button color="inherit" size="small" onClick={() => setScreen(2)}>
                Schedule More!
              </Button>
            }
          >
            <AlertTitle>Success</AlertTitle>
            Your event was succesfully added to your calendar!
          </Alert>
        </div>
      </div>
    );
  } else if (screen === 7) {
    return (
      <div
        style={{
          verticalAlign: 'middle',
          backgroundColor: theme.palette.primary.main,
          height: 260,
        }}
      >
        <div style={{ paddingTop: 70 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => setScreen(2)}>
                Try Again
              </Button>
            }
          >
            <AlertTitle>Oops</AlertTitle>
            We're sorry, but something went wrong. Your event was not scheduled.
          </Alert>
        </div>
      </div>
    );
  } else if (screen === 8) {
    return (
      <div
        style={{
          verticalAlign: 'middle',
          backgroundColor: theme.palette.primary.main,
          height: 260,
        }}
      >
        <div style={{ paddingTop: 70 }}>
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  chrome.tabs.reload();
                  setScreen(2);
                }}
              >
                Refresh
              </Button>
            }
          >
            <AlertTitle>Oops</AlertTitle>
            Please refresh your tab. Your tab was open before extension
            installation and as such we can't parse it.
          </Alert>
        </div>
      </div>
    );
  }
};

export default Popup;
