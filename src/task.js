'use strict';

import { logger } from "../lib/logger.js";

export class Task {

  tasks = [];
  newtask = {
    text: undefined,
    completed: false
  }


  constructor(input) {
    this.inputEl = input;
    this.newtask.text = input.value;

    this.inputEl.addEventListener('keyup', this.addTaskHandler);
  }

  render = () => {
    const liEl = document.createElement('li');
    const spanEl = document.createElement('span');
    const iEl = document.createElement('i');
    iEl.classList.add('fas');
    iEl.classList.add('fa-trash-alt');
    spanEl.appendChild(iEl);

    liEl.appendChild(spanEl);
    const iCheck = document.createElement('i');
    iCheck.classList.add('fas');
    iCheck.classList.add('fa-check-circle');

    liEl.appendChild(iCheck);
    liEl.innerHTML += ` ${this.newtask.text}`;
    liEl.addEventListener('click', this.toggleHandler);

    return liEl;
  }




  addTaskHandler = (event) => {

    if (event.keyCode !== 13) return;
    this.newtask.text = event.target.value;

    this.tasks.push(this.newtask);
    debugger;
    const liEl = this.render();
    document.querySelector('#task-root').firstElementChild.appendChild(liEl);
    event.target.value = '';
    event.target.focus();

    logger.push(
      {
        action: 'add task',
        task: this.newtask.text,
        event
      }
    )
  }


  toggleHandler = (event) => {
    if (event.target.parentElement.nodeName === 'SPAN') {

      const li = event.target.parentElement.parentElement;
      const ul = li.parentElement;
      ul.removeChild(li);

      logger.push({
        action: 'delete task',
        event

      })
    }
    if (event.target.nodeName !== 'I') {
      return
    }
    const task = event.target.parentElement;
    task.classList.toggle('completed');

    logger.push({
      action: 'toggle task',
      task: task.innerText,
      event
    })
  }
}