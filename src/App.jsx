import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./App.css";

function App() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    color: "#2563eb",
  });

  const [editingEvent, setEditingEvent] = useState(null);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    color: "#2563eb",
  });

  function loadEvents() {
    fetch(`${API_URL}/api/events`)
      .then((response) => response.json())
      .then((data) => {
        const formattedEvents = data.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          backgroundColor: event.color || "#2563eb",
          borderColor: event.color || "#2563eb",
          extendedProps: {
            description: event.description,
            color: event.color || "#2563eb",
          },
        }));

        setEvents(formattedEvents);
      });
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
  }

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

  function buildDateTime(date, time) {
    return `${date} ${time}:00`;
  }

  function isInvalidInterval(startDate, startTime, endDate, endTime) {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);

    return end <= start;
  }

  function hasOverlap(newStart, newEnd, ignoredEventId = null) {
    const newStartDate = new Date(newStart.replace(" ", "T"));
    const newEndDate = new Date(newEnd.replace(" ", "T"));

    return events.some((event) => {
      if (ignoredEventId && String(event.id) === String(ignoredEventId)) {
        return false;
      }

      const existingStart = new Date(event.start);
      const existingEnd = new Date(event.end || event.start);

      return newStartDate < existingEnd && newEndDate > existingStart;
    });
  }

  function handleDateClick(info) {
    const defaultTimes = getTimes();

    setSelectedDate(info.dateStr);

    setForm({
      ...form,
      startDate: info.dateStr,
      endDate: info.dateStr,
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

    const endDate = event.endStr ? event.endStr.slice(0, 10) : startDate;
    const endTime = event.endStr ? event.endStr.slice(11, 16) : startTime;

    setEditingEvent(event);

    setEditForm({
      title: event.title,
      description: event.extendedProps.description || "",
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
      color: event.extendedProps.color || "#2563eb",
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const startDate = form.startDate || selectedDate || getTodayDate();
    const endDate = form.endDate || startDate;

    if (isInvalidInterval(startDate, form.startTime, endDate, form.endTime)) {
      alert("Invalid interval. End date/time must be after start date/time.");
      return;
    }

    const newEvent = {
      title: form.title,
      description: form.description,
      start: buildDateTime(startDate, form.startTime),
      end: buildDateTime(endDate, form.endTime),
      color: form.color,
    };

    if (hasOverlap(newEvent.start, newEvent.end)) {
      const continueAdding = confirm(
        "This event overlaps with another event. Do you still want to add it?"
      );

      if (!continueAdding) {
        return;
      }
    }

    fetch(`${API_URL}/api/events`, {
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
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          color: "#2563eb",
        });

        setSelectedDate("");
        loadEvents();
      });
  }

  function handleUpdate(e) {
    e.preventDefault();

    const startDate = editForm.startDate || getTodayDate();
    const endDate = editForm.endDate || startDate;

    if (
      isInvalidInterval(
        startDate,
        editForm.startTime,
        endDate,
        editForm.endTime
      )
    ) {
      alert("Invalid interval. End date/time must be after start date/time.");
      return;
    }

    const updatedEvent = {
      title: editForm.title,
      description: editForm.description,
      start: buildDateTime(startDate, editForm.startTime),
      end: buildDateTime(endDate, editForm.endTime),
      color: editForm.color,
    };

    if (hasOverlap(updatedEvent.start, updatedEvent.end, editingEvent.id)) {
      const continueUpdating = confirm(
        "This event overlaps with another event. Do you still want to save it?"
      );

      if (!continueUpdating) {
        return;
      }
    }

    fetch(`${API_URL}/api/events/${editingEvent.id}`, {
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
    fetch(`${API_URL}/api/events/${editingEvent.id}`, {
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
          <h2>Add event</h2>

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
                Start date:
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </label>

              <label>
                End date:
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Start time:
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                End time:
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  required
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

              <div className="form-row">
                <label>
                  Start date:
                  <input
                    type="date"
                    name="startDate"
                    value={editForm.startDate}
                    onChange={handleEditChange}
                  />
                </label>

                <label>
                  End date:
                  <input
                    type="date"
                    name="endDate"
                    value={editForm.endDate}
                    onChange={handleEditChange}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Start time:
                  <input
                    type="time"
                    name="startTime"
                    value={editForm.startTime}
                    onChange={handleEditChange}
                    required
                  />
                </label>

                <label>
                  End time:
                  <input
                    type="time"
                    name="endTime"
                    value={editForm.endTime}
                    onChange={handleEditChange}
                    required
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
              </div>

              <div className="modal-buttons">
                <button type="submit">Save Changes</button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={handleDelete}
                >
                  Delete
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeEditPopup}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;