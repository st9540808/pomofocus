'use strict';


import { logger } from '../lib/logger.js';

export class Timer {

    intervalId = null;
    intervalSeconds = 1000;
    isStarted = false;
    timerType = 'pomodoro';
    cycle = 0;

    constructor(currentTimeInput, startStopButton, pomodoroButton, shortBreakButton, longBreakButton, body, timerTypeLabel, taskInput) {

        this.currentTimeInput = currentTimeInput;

        this.startStopButton = startStopButton;
        this.pomodoroButton = pomodoroButton;
        this.shortBreakButton = shortBreakButton;
        this.longBreakButton = longBreakButton;
        this.body = body;
        this.timerTypeLabel = timerTypeLabel;
        this.taskInput = taskInput;


        this.startStopButton.addEventListener('click', this.check);

        this.pomodoroButton.addEventListener('click', this.pomodoro);
        this.shortBreakButton.addEventListener('click', this.shortBreak);
        this.longBreakButton.addEventListener('click', this.longBreak);
    }
    check = () => {
        const startStopSound = new Audio('../public/assets/sounds/Finger-snap.mp3');
        startStopSound.play();

        if (!this.isStarted) {
            this.start();
            this.isStarted = !this.isStarted;
        }
        else {
            this.stop();
            this.isStarted = !this.isStarted;
        }
    }

    start = () => {
        this.tik();
        this.intervalId = setInterval(this.tik, this.intervalSeconds);
        this.onStart();
    };


    stop = () => {
        clearInterval(this.intervalId);
        if (this.timeLeft > 0) {
            this.onStop();
        }
    };

    // cb function to be called every intervalSeconds
    tik = () => {
        if (this.timeLeft <= 0) {
            this.stop();
            this.onComplete();
        } else {
            this.timeLeft = this.timeLeft - 1;
            this.onTik();
        }
    }

    //getter to retrieve timeLeft value
    get timeLeft() {
        return this.getSeconds(this.currentTimeInput.value);
    }

    //setter to update timeLeft value
    set timeLeft(time) {
        this.currentTimeInput.value = this.renderTime(time);
    }



    // action(s) will be done when timer started
    onStart() {
        console.log('timer has been started');

        this.startStopButton.innerText = 'Stop';
        this.startStopButton.classList.remove('start');
        this.startStopButton.classList.add('stop');

        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

        logger
            .push({
                action: 'click start',
                startedAt: time,
                started: this.isStarted,
                typeOfTimer: this.timerType
            });
    }

    // action(s) will be done when timer tikking
    onTik() {
        console.log('timer tikking');

        if (this.timerType === 'pomodoro' && this.timeLeft == 5*60) {
            var tln = new Notification(this.timerType, {
                body: "5 minutes left",
            });
        }
    }

    // action(s) will be done when timer stopped
    onStop() {
        console.log('timer stopped')

        this.startStopButton.innerText = 'Start';
        this.startStopButton.classList.remove('stop')
        this.startStopButton.classList.add('start');

        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        logger
            .push({
                action: 'click stop',
                stoppedAt: time,
                started: this.isStarted,
                typeOfTimer: this.timerType

            });
    }


    // action(s) will be done when timer completed
    onComplete() {
        console.log('timer completed');

        // const completedSound = new Audio('../public/assets/sounds/Clock-ringing.mp3');
        // completedSound.play();
        if (this.timerType !== 'pomodoro') {
            this.pomodoro();
            this.onStop();
        }
        else {
            // things to do after pomodoro is finished
            recordFocusTime(this.currentTimeInput);
            ++this.cycle;
            if (this.cycle % 4 == 0) {
                var finished = new Notification(this.timerType, {
                    body: this.cycle.toString() + " pomodoro finished.\n" +
                    "Take a short break.",
                });
                this.shortBreak();
            } else {
                var finished = new Notification(this.timerType, {
                    body: "4 consecutive pomodoro finished.\n" +
                    "You have finished " + this.cycle.toString() + " pomodoros\n" +
                    "Take a long break.",
                })
                this.longBreak();
            }

            this.onStop();
            
            // start short break immediately
            this.check();
        }

        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

        logger
            .push({
                action: 'timer completed',
                completedAt: time,
                started: this.isStarted,
                typeOfTimer: this.timerType
            });
    }

    // push the focus time to google calendar
    recordFocusTime(minutes) {
        const now = new Date();
        const start = new Date(now.getTime() - minutes*60000); // x minutes before
        var event = {
            'summary': 'pomodoro focus time',
            'description': 'Attention span',
            'start': {
              'dateTime': start.toISOString(),
            //   'timeZone': 'America/Los_Angeles'
            },
            'end': {
              'dateTime': now.toISOString(),
            //   'timeZone': 'America/Los_Angeles'
            },
        };          
        
        gapi.client.calendar.events.insert({
            'calendarId': pomodoroCalendarId,
            'resource': event
        }).then(function (response) {
                // Handle the results here (response.result has the parsed body).
                console.log("Response", response);
            },
            function (err) { console.error("gapi.client.calendar.events.insert Execute error", err); }
        );
    }


    renderTime = (duration) => {
        //  minutes and seconds

        let mins = Math.floor((duration % 3600) / 60);
        let secs = Math.floor(duration % 60);

        //  "1:01"
        let strTime = "";

        strTime += (mins < 10 ? "0" : "")
        strTime += "" + mins + ":" + (secs < 10 ? "0" : "");
        strTime += "" + secs;
        return strTime;
    }

    getSeconds(str) {
        const srtArr = str.split(':');
        const seconds = parseInt(srtArr[0]) * 60 + parseInt(srtArr[1]);
        return seconds;
    }



    pomodoro = () => {
        this.stop();
        this.isStarted = false;
        this.timerType = 'pomodoro';

        this.body.classList.add("pomodoro");
        this.body.classList.remove('short-break');
        this.body.classList.remove('long-break');

        this.taskInput.classList.add('pomodoro');
        this.taskInput.classList.remove('short-break');
        this.taskInput.classList.remove('long-break');

        this.pomodoroButton.classList.add('pomodoro-btn');

        this.pomodoroButton.classList.remove('reset');

        this.shortBreakButton.classList.add('reset');
        this.longBreakButton.classList.add('reset');
        this.currentTimeInput.value = '25:00';
        this.timerTypeLabel.innerText = 'Time to work!';


        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

        logger
            .push({
                action: 'click on timer',
                stoppedAt: time,
                started: this.isStarted,
                typeOfTimer: this.timerType

            });
    }

    shortBreak = () => {
        this.stop();
        this.isStarted = false;

        this.timerType = 'shortBreak';

        this.body.classList.add('short-break');
        this.body.classList.remove('pomodoro');
        this.body.classList.remove('long-break');

        this.taskInput.classList.add('short-break');
        this.taskInput.classList.remove('pomodoro');
        this.taskInput.classList.remove('long-break');

        this.shortBreakButton.classList.add('short-break-btn');

        this.shortBreakButton.classList.remove('reset');

        this.pomodoroButton.classList.add('reset');
        this.longBreakButton.classList.add('reset');
        this.currentTimeInput.value = '5:00';
        this.timerTypeLabel.innerText = 'Time for a break';

        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

        logger
            .push({
                action: 'click on timer',
                stoppedAt: time,
                started: this.isStarted,
                typeOfTimer: this.timerType

            });

    }

    longBreak = () => {
        this.stop();
        this.isStarted = false;

        this.timerType = 'longBreak';

        this.body.classList.add('long-break');
        this.body.classList.remove('pomodoro');
        this.body.classList.remove('short-break');

        this.taskInput.classList.add('long-break');
        this.taskInput.classList.remove('pomodoro');
        this.taskInput.classList.remove('short-break');

        this.longBreakButton.classList.add('long-break-btn');

        this.longBreakButton.classList.remove('reset');

        this.pomodoroButton.classList.add('reset');
        this.shortBreakButton.classList.add('reset');
        this.currentTimeInput.value = '15:00';
        this.timerTypeLabel.innerText = 'Time for a break';

        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

        logger
            .push({
                action: 'click on timer',
                stoppedAt: time,
                started: this.isStarted,
                typeOfTimer: this.timerType

            });
    }
}