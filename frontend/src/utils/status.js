import { t } from "../i18n";

export function isOverdue(loan) {
  if (!loan) return false;
  if (loan.status !== "OPEN") return false;
  if (loan.returned_at) return false;
  const due = new Date(loan.due_at);
  return due < new Date();
}

export function loanStatusLabel(loan) {
  if (isOverdue(loan)) return t("loan.status.OVERDUE");
  return t(`loan.status.${loan.status}`) || loan.status;
}

export function dressStatusLabel(status) {
  return t(`dress.status.${status}`) || status;
}
