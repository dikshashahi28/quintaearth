// The audit log: one row per identity-check step and per green-wording decision (who, what, result, when).
// Rows are only ever added; /admin/audit shows them. auditRow returns a statement for the caller's db.batch.
import { db, schema } from '../db/client';

export interface AuditEntry {
  organizationId: string | null;
  subjectType: 'organization' | 'listing' | 'identity_check' | 'profile';
  subjectId: string;
  actorUserId: string | null;
  action: string;
  result: 'pass' | 'fail' | 'info';
  detail?: string | null;
}

export const auditRow = (e: AuditEntry) => db.insert(schema.auditLog).values({ id: crypto.randomUUID(), ...e, detail: e.detail ?? null });

export async function audit(e: AuditEntry): Promise<void> {
  await auditRow(e);
}
