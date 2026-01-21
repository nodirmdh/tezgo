const severityRank = { P3: 1, P2: 2, P1: 3 };

const normalizeEventPayload = (payload) => {
  if (!payload) return null;
  if (typeof payload === "object") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return { raw: payload };
  }
};

const toMs = (value) => {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
};

const minutesBetween = (startMs, endMs) => {
  if (!startMs || !endMs) return null;
  return Math.round((endMs - startMs) / 60000);
};

const getEventTime = (events, types) => {
  const set = new Set(types);
  const match = events.find((event) => set.has(event.type));
  return match?.created_at ? toMs(match.created_at) : null;
};

export const deriveProblems = ({ entityType, entity, events = [], nowMs, config }) => {
  if (entityType !== "order") {
    return {
      problems: [],
      overallSeverity: "P3",
      primaryProblem: null
    };
  }

  const sortedEvents = [...events].map((event) => ({
    ...event,
    payload: normalizeEventPayload(event.payload)
  }))
    .sort((a, b) => toMs(a.created_at || 0) - toMs(b.created_at || 0));

  const createdAt = getEventTime(sortedEvents, ["created"]) ?? toMs(entity.created_at);
  const courierSearchStart = getEventTime(sortedEvents, ["courier_search_started"]);
  const courierAssigned = getEventTime(sortedEvents, ["courier_assigned"]);
  const cookingStart =
    getEventTime(sortedEvents, [
      "accepted",
      "accepted_by_outlet",
      "accepted_by_restaurant",
      "cooking_started"
    ]) ?? toMs(entity.accepted_at);
  const readyAt = getEventTime(sortedEvents, ["ready", "ready_for_pickup"]) ?? toMs(entity.ready_at);
  const pickedUpAt =
    getEventTime(sortedEvents, ["picked_up", "out_for_delivery"]) ??
    toMs(entity.picked_up_at);
  const deliveredAt = getEventTime(sortedEvents, ["delivered"]) ?? toMs(entity.delivered_at);

  const now = nowMs ?? Date.now();
  const problems = [];

  if (
    courierSearchStart &&
    !courierAssigned &&
    (minutesBetween(courierSearchStart, now) ?? 0) > config.courier_search_sla_minutes
  ) {
    problems.push({
      key: "COURIER_SEARCH_DELAYED",
      severity: "P1",
      title: "Courier search delayed",
      details: `> ${config.courier_search_sla_minutes} min`,
      entityType: "order",
      entityId: entity.id,
      createdAtDerived: new Date(now).toISOString()
    });
  }
  if (
    cookingStart &&
    !readyAt &&
    (minutesBetween(cookingStart, now) ?? 0) > config.cooking_sla_minutes
  ) {
    problems.push({
      key: "COOKING_DELAYED",
      severity: "P2",
      title: "Cooking delayed",
      details: `> ${config.cooking_sla_minutes} min`,
      entityType: "order",
      entityId: entity.id,
      createdAtDerived: new Date(now).toISOString()
    });
  }
  if (
    readyAt &&
    !pickedUpAt &&
    (minutesBetween(readyAt, now) ?? 0) > config.pickup_after_ready_sla_minutes
  ) {
    problems.push({
      key: "READY_WAITING_PICKUP",
      severity: "P1",
      title: "Ready, waiting pickup",
      details: `> ${config.pickup_after_ready_sla_minutes} min`,
      entityType: "order",
      entityId: entity.id,
      createdAtDerived: new Date(now).toISOString()
    });
  }
  if (
    pickedUpAt &&
    !deliveredAt &&
    (minutesBetween(pickedUpAt, now) ?? 0) > config.delivery_sla_minutes
  ) {
    problems.push({
      key: "DELIVERY_DELAYED",
      severity: "P2",
      title: "Delivery delayed",
      details: `> ${config.delivery_sla_minutes} min`,
      entityType: "order",
      entityId: entity.id,
      createdAtDerived: new Date(now).toISOString()
    });
  }

  problems.push({
    key: "HIGH_CANCEL_RISK",
    severity: "P3",
    title: "Cancel risk",
    details: "TODO: not enough data",
    entityType: "order",
    entityId: entity.id,
    createdAtDerived: createdAt ? new Date(createdAt).toISOString() : new Date(now).toISOString(),
    isTodo: true
  });

  const cancelEvent = sortedEvents.find((event) => event.type === "cancelled");
  if (cancelEvent) {
    const reason = cancelEvent.payload?.reason ? `Reason: ${cancelEvent.payload.reason}` : null;
    const cancelledAt = cancelEvent.created_at ? toMs(cancelEvent.created_at) : null;
    problems.push({
      key: "CANCELLED",
      severity: "P3",
      title: "Order cancelled",
      details: reason,
      entityType: "order",
      entityId: entity.id,
      createdAtDerived: new Date(cancelledAt ?? now).toISOString()
    });
  }

  const sortedProblems = problems
    .filter((problem) => !problem.isTodo)
    .sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));
  const primaryProblem = sortedProblems[0] || null;
  const overallSeverity = primaryProblem ? primaryProblem.severity : "none";

  return {
    problems: sortedProblems,
    overallSeverity,
    primaryProblem
  };
};
