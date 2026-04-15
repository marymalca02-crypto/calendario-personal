import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "calendario-personal-v3";

const REGIMEN_OPTIONS = [
  { label: "14x7", work: 14, rest: 7 },
  { label: "5x2", work: 5, rest: 2 },
  { label: "21x7", work: 21, rest: 7 },
  { label: "9x5", work: 9, rest: 5 },
  { label: "10x10", work: 10, rest: 10 },
  { label: "Otro", work: null, rest: null },
];

const COLOR_OPTIONS = [
  "#ec4899",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#e11d48",
  "#14b8a6",
];

const defaultData = {
  people: [
    {
      id: crypto.randomUUID(),
      name: "María Torres",
      color: "#ec4899",
      regimenType: "14x7",
      workDays: 14,
      restDays: 7,
      startDate: "2026-04-01",
      notes: "Supervisor de campo.",
    },
    {
      id: crypto.randomUUID(),
      name: "Luis Rojas",
      color: "#3b82f6",
      regimenType: "21x7",
      workDays: 21,
      restDays: 7,
      startDate: "2026-04-04",
      notes: "Frente norte.",
    },
    {
      id: crypto.randomUUID(),
      name: "Ana Díaz",
      color: "#22c55e",
      regimenType: "5x2",
      workDays: 5,
      restDays: 2,
      startDate: "2026-04-07",
      notes: "Apoyo documental.",
    },
  ],
  holidays: ["2026-04-23", "2026-04-30"],
  blockedDays: ["2026-04-18", "2026-04-24"],
};

function getDefaultForm() {
  return {
    id: null,
    name: "",
    color: COLOR_OPTIONS[0],
    regimenType: "14x7",
    workDays: 14,
    restDays: 7,
    startDate: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function differenceInDays(a, b) {
  const ms = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcA - utcB) / ms);
}

function toISO(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function getDayStatus(person, targetDate) {
  const start = new Date(`${person.startDate}T00:00:00`);
  const diff = differenceInDays(targetDate, start);
  if (diff < 0) return "none";
  const cycle = person.workDays + person.restDays;
  const position = diff % cycle;
  return position < person.workDays ? "work" : "rest";
}

function buildRange(viewMode, currentDate) {
  if (viewMode === "day") return [new Date(currentDate)];

  if (viewMode === "week") {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const last = new Date(year, month + 1, 0);
  return Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1));
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatMonthTitle(date) {
  return new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;
    const parsed = JSON.parse(stored);
    return {
      people: Array.isArray(parsed.people) ? parsed.people : defaultData.people,
      holidays: Array.isArray(parsed.holidays) ? parsed.holidays : defaultData.holidays,
      blockedDays: Array.isArray(parsed.blockedDays) ? parsed.blockedDays : defaultData.blockedDays,
    };
  } catch {
    return defaultData;
  }
}

function PersonModal({
  isOpen,
  onClose,
  onSave,
  form,
  setForm,
  isEditing,
}) {
  if (!isOpen) return null;

  const handleRegimenChange = (value) => {
    const regimen = REGIMEN_OPTIONS.find((r) => r.label === value);
    if (!regimen) return;

    setForm((prev) => ({
      ...prev,
      regimenType: value,
      workDays: regimen.work ?? prev.workDays,
      restDays: regimen.rest ?? prev.restDays,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 p-3 md:flex md:items-center md:justify-center md:p-4">
      <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-4 shadow-2xl md:p-6 max-h-[92vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {isEditing ? "Editar persona" : "Agregar persona"}
            </h2>
            <p className="text-sm text-slate-500">
              Completa los datos del personal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
          >
            Cerrar
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              placeholder="Ejemplo: Juan Pérez"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Régimen
            </label>
            <select
              value={form.regimenType}
              onChange={(e) => handleRegimenChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            >
              {REGIMEN_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Días de trabajo
            </label>
            <input
              type="number"
              min="1"
              value={form.workDays}
              disabled={form.regimenType !== "Otro"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  workDays: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Días de descanso
            </label>
            <input
              type="number"
              min="1"
              value={form.restDays}
              disabled={form.regimenType !== "Otro"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  restDays: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none disabled:bg-slate-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Notas / observaciones
            </label>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              placeholder="Ejemplo: frente asignado, cambio manual, observaciones"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Color
            </label>
            <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 p-4">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  className={`h-10 w-10 rounded-full border-4 ${
                    form.color === color ? "border-slate-900" : "border-white"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {isEditing ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initialData = useMemo(() => loadData(), []);
  const [people, setPeople] = useState(initialData.people);
  const [holidays] = useState(initialData.holidays);
  const [blockedDays] = useState(initialData.blockedDays);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week");
  const [searchText, setSearchText] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(getDefaultForm());

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ people, holidays, blockedDays })
    );
  }, [people, holidays, blockedDays]);

  const days = useMemo(() => buildRange(viewMode, currentDate), [viewMode, currentDate]);

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const matchName = person.name.toLowerCase().includes(searchText.toLowerCase());
      const matchPerson = selectedPerson === "all" || person.id === selectedPerson;
      return matchName && matchPerson;
    });
  }, [people, searchText, selectedPerson]);

  const todayAssignments = useMemo(() => {
    return filteredPeople.filter((person) => getDayStatus(person, currentDate) === "work");
  }, [filteredPeople, currentDate]);

  const holidaySet = useMemo(() => new Set(holidays), [holidays]);
  const blockedSet = useMemo(() => new Set(blockedDays), [blockedDays]);

  const openCreateModal = () => {
    setForm(getDefaultForm());
    setIsModalOpen(true);
  };

  const openEditModal = (person) => {
    setForm({ ...person });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(getDefaultForm());
  };

  const savePerson = () => {
    if (!form.name.trim()) {
      alert("Ingresa un nombre.");
      return;
    }

    if (!form.startDate) {
      alert("Ingresa la fecha de inicio.");
      return;
    }

    if (!form.workDays || !form.restDays) {
      alert("Ingresa un régimen válido.");
      return;
    }

    if (form.id) {
      setPeople((prev) =>
        prev.map((person) => (person.id === form.id ? form : person))
      );
    } else {
      setPeople((prev) => [
        ...prev,
        {
          ...form,
          id: crypto.randomUUID(),
        },
      ]);
    }

    closeModal();
  };

  const deletePerson = (id) => {
    const confirmed = window.confirm("¿Eliminar esta persona?");
    if (!confirmed) return;

    setPeople((prev) => prev.filter((person) => person.id !== id));
    if (selectedPerson === id) {
      setSelectedPerson("all");
    }
  };

  const moveRange = (direction) => {
    if (viewMode === "day") {
      setCurrentDate((prev) => addDays(prev, direction));
      return;
    }
    if (viewMode === "week") {
      setCurrentDate((prev) => addDays(prev, direction * 7));
      return;
    }
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      people,
      holidays,
      blockedDays,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "calendario-personal.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <PersonModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={savePerson}
        form={form}
        setForm={setForm}
        isEditing={Boolean(form.id)}
      />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Calendario de Personal
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Búsqueda, filtros, notas, exportación y vistas por periodo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                {[
                  { key: "month", label: "Mensual" },
                  { key: "week", label: "Semanal" },
                  { key: "day", label: "Día" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setViewMode(option.key)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      viewMode === option.key
                        ? "bg-slate-900 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                onClick={exportData}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                Exportar
              </button>

              <button
                onClick={openCreateModal}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                + Agregar persona
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Búsqueda y filtro</h2>
              </div>

              <div className="space-y-3">
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar por nombre"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />

                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                >
                  <option value="all">Todo el personal</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Personal</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {filteredPeople.length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredPeople.map((person) => (
                  <div key={person.id} className="rounded-2xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-1 h-4 w-4 rounded-full"
                          style={{ backgroundColor: person.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{person.name}</p>
                          <p className="text-xs text-slate-500">
                            {person.regimenType} · Inicio {person.startDate}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {person.notes || "Sin observaciones."}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(person)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deletePerson(person.id)}
                          className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs text-rose-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Leyenda</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-10 rounded-lg bg-slate-700" />
                  <span>Trabajo</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-10 rounded-lg border border-dashed border-slate-300 bg-slate-100" />
                  <span>Descanso</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-4 w-10 items-center justify-center rounded-lg bg-amber-100 text-[10px] text-amber-700">
                    F
                  </div>
                  <span>Feriado</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-4 w-10 items-center justify-center rounded-lg bg-rose-100 text-[10px] text-rose-700">
                    B
                  </div>
                  <span>Bloqueo / cambio manual</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Resumen del día</h2>
              <p className="mt-1 text-sm text-slate-500">
                Personal programado para{" "}
                {new Intl.DateTimeFormat("es-PE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(currentDate)}
                .
              </p>

              <div className="mt-4 space-y-2">
                {todayAssignments.length > 0 ? (
                  todayAssignments.map((person) => (
                    <div key={person.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3.5 w-3.5 rounded-full"
                            style={{ backgroundColor: person.color }}
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {person.name}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{person.regimenType}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {person.notes || "Sin observaciones."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    No hay personal programado.
                  </div>
                )}
              </div>
            </div>
          </aside>

          <section className="rounded-3xl bg-white shadow-sm">
  <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-lg font-semibold capitalize text-slate-900">
        {formatMonthTitle(currentDate)}
      </h2>
      <p className="text-sm text-slate-500">
        Vista {viewMode === "month" ? "mensual" : viewMode === "week" ? "semanal" : "diaria"}
      </p>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => moveRange(-1)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
      >
        {"<"}
      </button>
      <button
        onClick={() => setCurrentDate(new Date())}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
      >
        Hoy
      </button>
      <button
        onClick={() => moveRange(1)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
      >
        {">"}
      </button>
    </div>
  </div>

  {viewMode === "week" && (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[1100px]"
            style={{ gridTemplateColumns: `240px repeat(${days.length}, minmax(70px, 1fr))` }}
          >
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Personal
            </div>

            {days.map((day) => {
              const iso = toISO(day);
              return (
                <div
                  key={iso}
                  className="border-b border-l border-slate-100 bg-slate-50 px-2 py-3 text-center text-xs font-semibold text-slate-500"
                >
                  <div>{formatDateLabel(day)}</div>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    {holidaySet.has(iso) && (
                      <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-700">
                        F
                      </span>
                    )}
                    {blockedSet.has(iso) && (
                      <span className="rounded bg-rose-100 px-1 text-[10px] text-rose-700">
                        B
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredPeople.map((person) => (
              <React.Fragment key={person.id}>
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: person.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{person.name}</p>
                    <p className="text-xs text-slate-500">{person.regimenType}</p>
                  </div>
                </div>

                {days.map((day) => {
                  const iso = toISO(day);
                  const status = getDayStatus(person, day);

                  return (
                    <div
                      key={`${person.id}-${iso}`}
                      className="border-b border-l border-slate-100 p-2"
                    >
                      <div
                        className={`relative h-11 rounded-xl ${
                          status === "rest"
                            ? "border border-dashed border-slate-300 bg-slate-100"
                            : ""
                        }`}
                        style={{
                          backgroundColor:
                            status === "work"
                              ? person.color
                              : status === "none"
                              ? "#f8fafc"
                              : undefined,
                          opacity: status === "work" ? 0.9 : 1,
                        }}
                      >
                        {holidaySet.has(iso) && (
                          <div className="absolute left-1 top-1 rounded bg-amber-100 px-1 text-[10px] text-amber-700">
                            F
                          </div>
                        )}
                        {blockedSet.has(iso) && (
                          <div className="absolute right-1 top-1 rounded bg-rose-100 px-1 text-[10px] text-rose-700">
                            B
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {days.map((day) => {
          const iso = toISO(day);
          const working = filteredPeople.filter((person) => getDayStatus(person, day) === "work");
          const resting = filteredPeople.filter((person) => getDayStatus(person, day) === "rest");

          return (
            <div key={iso} className="rounded-2xl border border-slate-200 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatDateLabel(day)}</p>
                  <p className="text-xs text-slate-500">
                    {working.length} trabajando · {resting.length} descansando
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {working.map((person) => (
                  <div
                    key={`${person.id}-${iso}-work`}
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ backgroundColor: `${person.color}22` }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">{person.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">Trabajo</span>
                  </div>
                ))}

                {resting.map((person) => (
                  <div
                    key={`${person.id}-${iso}-rest`}
                    className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">{person.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">Descanso</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}

  {viewMode === "day" && (
    <div className="p-4 md:p-5">
      <div className="mb-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-base font-semibold text-slate-900">
          {new Intl.DateTimeFormat("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(currentDate)}
        </p>
      </div>

      <div className="space-y-3">
        {filteredPeople.map((person) => {
          const status = getDayStatus(person, currentDate);
          return (
            <div
              key={person.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: person.color }}
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">{person.name}</p>
                  <p className="text-xs text-slate-500">{person.regimenType}</p>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  status === "work"
                    ? "bg-slate-800 text-white"
                    : status === "rest"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-slate-50 text-slate-400"
                }`}
              >
                {status === "work"
                  ? "Trabajo"
                  : status === "rest"
                  ? "Descanso"
                  : "Sin programación"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {viewMode === "month" && (
    <div className="p-4 md:p-5">
      <div className="space-y-3">
        {days.map((day) => {
          const iso = toISO(day);
          const working = filteredPeople.filter((person) => getDayStatus(person, day) === "work");
          const resting = filteredPeople.filter((person) => getDayStatus(person, day) === "rest");

          return (
            <div key={iso} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatDateLabel(day)}</p>
                  <p className="text-xs text-slate-500">
                    {working.length} trabajando · {resting.length} descansando
                  </p>
                </div>

                <div className="flex gap-1">
                  {holidaySet.has(iso) && (
                    <span className="rounded bg-amber-100 px-2 py-1 text-[10px] text-amber-700">
                      Feriado
                    </span>
                  )}
                  {blockedSet.has(iso) && (
                    <span className="rounded bg-rose-100 px-2 py-1 text-[10px] text-rose-700">
                      Bloqueo
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {working.map((person) => (
                  <div
                    key={`${person.id}-${iso}-work`}
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ backgroundColor: `${person.color}22` }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">{person.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">Trabajo</span>
                  </div>
                ))}

                {resting.map((person) => (
                  <div
                    key={`${person.id}-${iso}-rest`}
                    className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">{person.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">Descanso</span>
                  </div>
                ))}

                {working.length === 0 && resting.length === 0 && (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    Sin programación.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}
</section>
        </div>
      </div>
    </div>
  );
}