type TrainingHistoryRow = {
  id: number;
  traineeId: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  renewedFromId?: number | null;
  certificate?: { expiryDate?: Date | string | null } | null;
  training?: { name?: string | null } | null;
};

type EmployeeRow = {
  id: number;
  givenName?: string | null;
  surname?: string | null;
  name?: string | null;
  position?: string | null;
};

type ComplianceInput = {
  employees: EmployeeRow[];
  trainingHistory: TrainingHistoryRow[];
  now?: Date;
};

type ComplianceResult = {
  totalPersonnel: number;
  compliantCount: number;
  compliancePercentage: number;
};

const REQUIRED_TRAININGS = {
  superintendent: "Installation Inspector",
  refueler: "Product Inspector",
  refueller: "Product Inspector",
} as const;

const DEFENSIVE_DRIVING = "Defensive Driving Training";

function normalizePosition(position?: string | null) {
  return (position ?? "").toLowerCase().trim();
}

function isTrainingManager(position?: string | null) {
  return normalizePosition(position) === "trainingmanager";
}

function getEmployeeName(employee: EmployeeRow) {
  const fullName = `${employee.givenName ?? ""} ${employee.surname ?? ""}`.trim();
  if (fullName) return fullName;
  if (employee.name) return employee.name;
  return `Employee ${employee.id}`;
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateCompliance(input: ComplianceInput): ComplianceResult {
  const now = input.now ?? new Date();
  const employees = input.employees.filter((emp) => !isTrainingManager(emp.position));
  const excludedEmployeeIds = new Set(
    input.employees.filter((emp) => isTrainingManager(emp.position)).map((emp) => emp.id),
  );
  const relevantHistory = input.trainingHistory.filter(
    (th) => !excludedEmployeeIds.has(th.traineeId),
  );

  const renewedIds = new Set<number>();

  for (const th of relevantHistory) {
    if (th.renewedFromId) {
      renewedIds.add(th.renewedFromId);
    }
  }

  const historiesByEmployee = new Map<number, TrainingHistoryRow[]>();
  for (const th of relevantHistory) {
    if (!historiesByEmployee.has(th.traineeId)) {
      historiesByEmployee.set(th.traineeId, []);
    }
    historiesByEmployee.get(th.traineeId)!.push(th);
  }

  const getTrainingRows = (employeeId: number, trainingName: string) => {
    const histories = historiesByEmployee.get(employeeId) ?? [];
    return histories.filter(
      (th) =>
        th.training?.name === trainingName &&
        th.status === "APPROVED" &&
        !!th.certificate?.expiryDate,
    );
  };

  const hasValidTraining = (employeeId: number, trainingName: string) => {
    const histories = getTrainingRows(employeeId, trainingName).filter(
      (th) => !renewedIds.has(th.id),
    );

    for (const th of histories) {
      const expiry = toDate(th.certificate?.expiryDate);
      if (expiry && expiry >= now) return true;
    }

    return false;
  };

  const hasEverReceivedTraining = (employeeId: number, trainingName: string) =>
    getTrainingRows(employeeId, trainingName).length > 0;

  let compliantCount = 0;

  for (const emp of employees) {
    const position = normalizePosition(emp.position);
    const required: string[] = [];

    if (position in REQUIRED_TRAININGS) {
      required.push(REQUIRED_TRAININGS[position as keyof typeof REQUIRED_TRAININGS]);
    }

    if (hasEverReceivedTraining(emp.id, DEFENSIVE_DRIVING)) {
      required.push(DEFENSIVE_DRIVING);
    }

    const missing = required.filter((trainingName) => !hasValidTraining(emp.id, trainingName));
    const isCompliant = missing.length === 0;

    if (!isCompliant) {
      console.log(
        `[Compliance] Non-compliant: ${getEmployeeName(emp)} - missing: ${missing.join(", ")}`,
      );
    }

    if (isCompliant) compliantCount += 1;
  }

  const totalPersonnel = employees.length;
  const compliancePercentage =
    totalPersonnel === 0 ? 0 : Math.round((compliantCount / totalPersonnel) * 100);

  return { totalPersonnel, compliantCount, compliancePercentage };
}
