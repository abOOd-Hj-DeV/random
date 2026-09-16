import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  LayoutGrid,
  List,
  Plus,
  Sparkles,
  Wrench,
} from "lucide-react";
import { type Task, completeTask, dateLabel, today } from "./model";
import { useStore } from "./store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Modal,
  PageHeading,
  SearchInput,
  Stat,
  Table,
} from "./ui";
import { TaskForm } from "./forms";

export default function Operations({
  kind,
  property,
}: {
  kind: Task["kind"];
  property: string;
}) {
  const { data, update } = useStore();
  const [search, setSearch] = useState("");
  const [layout, setLayout] = useState("board");
  const [add, setAdd] = useState(false);
  const [detail, setDetail] = useState<Task | null>(null);
  const tasks = data.tasks.filter(
    (t) =>
      t.kind === kind &&
      (property === "all" ||
        data.rooms.find((r) => r.id === t.roomId)?.propertyId === property),
  );
  const filtered = tasks.filter((t) =>
    `${t.title} ${t.assignee} ${data.rooms.find((r) => r.id === t.roomId)?.number}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const maintenance = kind === "maintenance";
  const Icon = maintenance ? Wrench : Sparkles;
  const changeStatus = (task: Task, status: Task["status"]) =>
    update(
      (current) => completeTask(current, task.id, status),
      status === "done" ? "Task completed" : "Task status updated",
      task.title,
      "Operations",
    );
  return (
    <>
      <PageHeading
        eyebrow={
          maintenance
            ? "CARE THAT KEEPS THINGS RUNNING"
            : "A FRESH START, EVERY STAY"
        }
        title={maintenance ? "Maintenance" : "Housekeeping"}
        description={
          maintenance
            ? "From a quick fix to a little preventive care. Nothing falls through the cracks."
            : "Thoughtful room care. A beautifully prepared welcome."
        }
      >
        <Button variant="primary" onClick={() => setAdd(true)}>
          <Plus size={16} />
          {maintenance ? "New work order" : "Schedule cleaning"}
        </Button>
      </PageHeading>
      <div className="stats-grid three">
        <Stat
          title="To do"
          value={String(tasks.filter((t) => t.status === "todo").length)}
          caption="Ready for your team's attention"
          icon={Icon}
          accent="peach"
        />
        <Stat
          title="In progress"
          value={String(tasks.filter((t) => t.status === "in-progress").length)}
          caption="Good things are happening"
          icon={Clock3}
          accent="blue"
        />
        <Stat
          title="Completed"
          value={String(tasks.filter((t) => t.status === "done").length)}
          caption="A little better than before"
          icon={Check}
        />
      </div>
      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tasks, rooms or team members…"
        />
        <div className="segmented">
          <button
            aria-label="Board view"
            aria-pressed={layout === "board"}
            className={layout === "board" ? "active" : ""}
            onClick={() => setLayout("board")}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            aria-label="Task list view"
            aria-pressed={layout === "list"}
            className={layout === "list" ? "active" : ""}
            onClick={() => setLayout("list")}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      {layout === "board" ? (
        <div className="kanban">
          {(["todo", "in-progress", "done"] as const).map((status) => (
            <section key={status} className={`kanban-column kanban-${status}`}>
              <div className="kanban-heading">
                <h2>
                  <i />
                  {status === "todo"
                    ? "To do"
                    : status === "in-progress"
                      ? "In progress"
                      : "Completed"}
                  <span>
                    {filtered.filter((t) => t.status === status).length}
                  </span>
                </h2>
              </div>
              <div className="kanban-cards">
                {filtered
                  .filter((t) => t.status === status)
                  .map((task) => {
                    const room = data.rooms.find((r) => r.id === task.roomId)!;
                    return (
                      <article className="task-card" key={task.id}>
                        <div className="task-card-top">
                          <Badge value={task.priority} />
                          <button
                            className="task-open"
                            aria-label={`Open ${task.title}`}
                            onClick={() => setDetail(task)}
                          >
                            <ChevronRight size={17} />
                          </button>
                        </div>
                        <button
                          className="task-title"
                          onClick={() => setDetail(task)}
                        >
                          {task.title}
                        </button>
                        <p>
                          {
                            data.properties.find(
                              (p) => p.id === room.propertyId,
                            )?.name
                          }
                        </p>
                        <span className="room-chip">
                          Room {room.number} · {room.type}
                        </span>
                        {task.notes && (
                          <p className="task-description">{task.notes}</p>
                        )}
                        <div className="task-meta">
                          <span
                            className={
                              task.due < today() && status !== "done"
                                ? "overdue"
                                : ""
                            }
                          >
                            <CalendarDays size={13} />
                            {dateLabel(task.due, "MMM d")}
                          </span>
                          <span title={task.assignee}>
                            <Avatar name={task.assignee} index={2} />
                            {task.assignee.split(" ")[0]}
                          </span>
                        </div>
                        <Button
                          variant={
                            status === "in-progress" ? "primary" : "secondary"
                          }
                          onClick={() =>
                            changeStatus(
                              task,
                              status === "todo"
                                ? "in-progress"
                                : status === "in-progress"
                                  ? "done"
                                  : "todo",
                            )
                          }
                        >
                          {status === "todo"
                            ? "Start task"
                            : status === "in-progress"
                              ? "Mark complete"
                              : "Reopen task"}
                          {status === "in-progress" ? (
                            <Check size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </Button>
                      </article>
                    );
                  })}
                {!filtered.some((t) => t.status === status) && (
                  <div className="empty-lane">
                    No tasks here. A little breathing room.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          {filtered.length ? (
            <Table
              headings={[
                "Task",
                "Property / room",
                "Assigned to",
                "Due",
                "Priority",
                "Status",
                "",
              ]}
            >
              {filtered.map((task) => {
                const room = data.rooms.find((r) => r.id === task.roomId)!;
                return (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.title}</strong>
                    </td>
                    <td>
                      {
                        data.properties.find((p) => p.id === room.propertyId)
                          ?.name
                      }
                      <small>Room {room.number}</small>
                    </td>
                    <td>{task.assignee}</td>
                    <td>{dateLabel(task.due)}</td>
                    <td>
                      <Badge value={task.priority} />
                    </td>
                    <td>
                      <Badge value={task.status} />
                    </td>
                    <td>
                      <Button onClick={() => setDetail(task)}>Manage</Button>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : (
            <Empty title="No matching tasks" />
          )}
        </Card>
      )}
      {add && <TaskForm kind={kind} onClose={() => setAdd(false)} />}
      {detail && (
        <Modal
          title="Task details"
          description="Keep your team and room inventory in sync."
          onClose={() => setDetail(null)}
        >
          <form
            className="form-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                update(
                  (current) => {
                    if (!detail.title.trim())
                      throw new Error("Enter a task title.");
                    const next = {
                      ...current,
                      tasks: current.tasks.map((t) =>
                        t.id === detail.id ? detail : t,
                      ),
                    };
                    return completeTask(next, detail.id, detail.status);
                  },
                  "Task updated",
                  detail.title,
                  "Operations",
                )
              )
                setDetail(null);
            }}
          >
            <Field label="Task title">
              <input
                required
                value={detail.title}
                onChange={(e) =>
                  setDetail({ ...detail, title: e.target.value })
                }
              />
            </Field>
            <div className="form-grid">
              <Field label="Status">
                <select
                  value={detail.status}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      status: e.target.value as Task["status"],
                    })
                  }
                >
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Completed</option>
                </select>
              </Field>
              <Field label="Priority">
                <select
                  value={detail.priority}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      priority: e.target.value as Task["priority"],
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Assigned to">
                <select
                  value={detail.assignee}
                  onChange={(e) =>
                    setDetail({ ...detail, assignee: e.target.value })
                  }
                >
                  {[
                    "Unassigned",
                    "Alex Morgan",
                    "Sarah Davis",
                    "Chris Lee",
                    "Maria Garcia",
                  ].map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  required
                  value={detail.due}
                  onChange={(e) =>
                    setDetail({ ...detail, due: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Instructions">
              <textarea
                rows={4}
                value={detail.notes}
                onChange={(e) =>
                  setDetail({ ...detail, notes: e.target.value })
                }
              />
            </Field>
            <div className="modal-actions">
              <Button onClick={() => setDetail(null)}>Cancel</Button>
              <Button variant="primary" type="submit">
                Save task
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
