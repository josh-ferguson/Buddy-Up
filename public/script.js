const openMatch = document.getElementById("matchName");
const matchContainer = document.getElementById("matchModalContainer");
const closeMatch = document.getElementById("matchCloseMe");

openMatch.addEventListener("click", () => {
  matchContainer.classList.add("show");
});

closeMatch.addEventListener("click", () => {
  matchContainer.classList.remove("show");
});


const open = document.getElementById("sendMessageButton");
const headingOpen = document.getElementById("messageHeading");
const modalContainer = document.getElementById("messageModalContainer");
const close = document.getElementById("messageCloseMe");

open.addEventListener("click", () => {
  modalContainer.classList.add("show");
});

headingOpen.addEventListener("click", () => {
  modalContainer.classList.add("show");
});

close.addEventListener("click", () => {
  modalContainer.classList.remove("show");
});


const openReminders = document.getElementById("remindersHeading");
const remindersContainer = document.getElementById("remindersModalContainer");
const closeReminders = document.getElementById("remindersCloseMe");

openReminders.addEventListener("click", () => {
  remindersContainer.classList.add("show");
});

closeReminders.addEventListener("click", () => {
  remindersContainer.classList.remove("show");
});


const openNotes = document.getElementById("notesHeading");
const notesContainer = document.getElementById("notesModalContainer");
const closeNotes = document.getElementById("notesCloseMe");

openNotes.addEventListener("click", () => {
  notesContainer.classList.add("show");
});

closeNotes.addEventListener("click", () => {
  notesContainer.classList.remove("show");
});


const openFiles = document.getElementById("filesHeading");
const filesContainer = document.getElementById("filesModalContainer");
const closeFiles = document.getElementById("filesCloseMe");

openFiles.addEventListener("click", () => {
  filesContainer.classList.add("show");
});

closeFiles.addEventListener("click", () => {
  filesContainer.classList.remove("show");
});


const openCalendar = document.getElementById("calendarHeading");
const openCalendarIcon = document.getElementById("calendarIcon");
const calendarContainer = document.getElementById("calendarModalContainer");
const closeCalendar = document.getElementById("calendarCloseMe");

openCalendar.addEventListener("click", () => {
  calendarContainer.classList.add("show");
});

openCalendarIcon.addEventListener("click", () => {
  calendarContainer.classList.add("show");
});

closeCalendar.addEventListener("click", () => {
  calendarContainer.classList.remove("show");
});






document.addEventListener('DOMContentLoaded', function() {

  let yearC = document.getElementById("yearC").textContent;
  let monthC = document.getElementById("monthC").textContent;
  let dayC = document.getElementById("dayC").textContent;
  let bodyC = document.getElementById("bodyC").textContent;
  let calendarDatas = document.getElementById("calendarDatas").childNodes;

  let node, list, arrValue;
  list = [];

  for (node = document.getElementById('calendarDatas').firstChild;
        node;
        node = node.nextSibling) {
        if (node.nodeType == 1 && node.tagName == 'LI') {
            list.push(node.innerHTML);
        }
      }

  let date = []
  for (var i = 0; i < list.length; i+=4) {
    date.push({
      start: list[i] + "-" + ("0" + list[i+1]).slice(-2) + "-" + ("0" + list[i+2]).slice(-2),
      title: list[i+3]
    })
  }

  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    initialDate: '2021-09-07',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: date
    });

  calendar.render();

});
