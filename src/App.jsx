import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./App.css";

function App() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    color: "#2563eb",
  });

  const [editingEvent, setEditingEvent] = useState(null);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    color: "#2563eb",
  });

  function loadEvents() {
    fetch("http://localhost/api/events")
      .then((response) => response.json())
      .then((data) => {
        const formattedEvents = data.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          backgroundColor: event.color,
          borderColor: event.color,
          extendedProps: {
            description: event.description,
          },
        }));

        setEvents(formattedEvents);
      });
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function getTimes() {
    const now = new Date();

    const start = new Date(now);
    start.setHours(now.getHours() + 1);
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    const formatTime = (date) => {
      return date.toTimeString().slice(0, 5);
    };

    return {
      startTime: formatTime(start),
      endTime: formatTime(end),
    };
  }

  function handleDateClick(info) {
    const defaultTimes = getTimes();
    setSelectedDate(info.dateStr);
    setForm({
      ...form,
      startTime: defaultTimes.startTime,
      endTime: defaultTimes.endTime,
    });
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleEditChange(e) {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  }

  function handleEventClick(info) {
    const event = info.event;

    const startDate = event.startStr.slice(0, 10);
    const startTime = event.startStr.slice(11, 16);
    const endTime = event.endStr ? event.endStr.slice(11, 16) : startTime;

    setEditingEvent(event);

    setEditForm({
      title: event.title,
      description: event.extendedProps.description || "",
      date: startDate,
      startTime: startTime,
      endTime: endTime,
      color: event.extendedProps.color || "#2563eb",
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const newEvent = {
      title: form.title,
      description: form.description,
      start: selectedDate + " " + form.startTime + ":00",
      end: selectedDate + " " + form.endTime + ":00",
      color: form.color,
    };

    fetch("http://localhost/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newEvent),
    })
      .then((response) => response.json())
      .then(() => {
        setForm({
          title: "",
          description: "",
          startTime: "10:00",
          endTime: "11:00",
          color: "#2563eb",
        });

        setSelectedDate("");
        loadEvents();
      });
  }

  function handleUpdate(e) {
    e.preventDefault();

    const updatedEvent = {
      title: editForm.title,
      description: editForm.description,
      start: editForm.date + " " + editForm.startTime + ":00",
      end: editForm.date + " " + editForm.endTime + ":00",
      color: editForm.color,
    };

    fetch("http://localhost/api/events/" + editingEvent.id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedEvent),
    })
      .then((response) => response.json())
      .then(() => {
        setEditingEvent(null);
        loadEvents();
      });
  }

  function handleDelete() {
    fetch("http://localhost/api/events/" + editingEvent.id, {
      method: "DELETE",
    }).then(() => {
      setEditingEvent(null);
      loadEvents();
    });
  }

  function closeEditPopup() {
    setEditingEvent(null);
  }

  return (
    <div className="app">
      <h1>My Calendar App</h1>

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          selectable={true}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
        />
      </div>

      {selectedDate && (
        <div className="form-container">
          <h2>Add event on {selectedDate}</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="title"
              placeholder="Event title"
              value={form.title}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
            />

            <div className="form-row">
              <label>
                Start:
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                />
              </label>

              <label>
                End:
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                />
              </label>

              <label>
                Color:
                <input
                  type="color"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                />
              </label>
            </div>

            <button type="submit">Add event</button>
          </form>
        </div>
      )}

      {editingEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Event</h2>

            <form onSubmit={handleUpdate}>
              <input
                type="text"
                name="title"
                placeholder="Event title"
                value={editForm.title}
                onChange={handleEditChange}
                required
              />

              <textarea
                name="description"
                placeholder="Description"
                value={editForm.description}
                onChange={handleEditChange}
              />

              <label>
                Date:
                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Start:
                <input
                  type="time"
                  name="startTime"
                  value={editForm.startTime}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                End:
                <input
                  type="time"
                  name="endTime"
                  value={editForm.endTime}
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Color:
                <input 
                  type="color"
                  name="color"
                  value={editForm.color}
                  onChange={handleEditChange}
                />
              </label>

              <div className="modal-buttons">
                <button type="submit">Save Changes</button>

                <button type="button" className="delete-button" onClick={handleDelete}>Delete</button>

                <button type="button" className="cancel-button" onClick={closeEditPopup}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;