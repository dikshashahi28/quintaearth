// What every dashboard page needs: the signed-in member, their companies, and which company is open.
// A member of several companies switches with ?org=<id>; otherwise the first (by name) is open.
import { and, eq, ne } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { myCompanies } from '../db/queries/dashboard';
import type { SessionUser } from './auth';

export interface DashContext {
  user: SessionUser;
  companies: Awaited<ReturnType<typeof myCompanies>>;
  /** the open company, or null for members without one */
  company: Awaited<ReturnType<typeof myCompanies>>[number] | null;
  /** "?org=<id>" when the member has more than one company, so links keep the choice; else "" */
  orgQuery: string;
  /** unread enquiries for the open company plus those written to the member in person */
  newEnquiries: number;
  /** unread enquiries written to the member in person (people take enquiries too) */
  newPersonal: number;
  /** company replies to the member's own enquiries that they have not opened */
  newReplies: number;
}

export async function dashContext(user: SessionUser, url: URL): Promise<DashContext> {
  const companies = await myCompanies(user.id);
  const wanted = url.searchParams.get('org');
  const company = companies.find((c) => c.id === wanted) ?? companies[0] ?? null;
  const orgQuery = company && companies.length > 1 ? `?org=${company.id}` : '';
  // on a thread's own page that thread is being read (it marks itself read once shown), so the badge leaves it out
  const open = url.pathname.match(/^\/dashboard\/(enquiries|messages)\/([^/]+)\/?$/);
  const reading = (kind: string) => (open?.[1] === kind ? ne(schema.enquiries.id, open[2]) : undefined);
  const newPersonal = await db.$count(schema.enquiries, and(eq(schema.enquiries.toUserId, user.id), eq(schema.enquiries.companyUnread, true), reading('enquiries')));
  const newEnquiries = newPersonal + (company
    ? await db.$count(schema.enquiries, and(eq(schema.enquiries.organizationId, company.id), eq(schema.enquiries.companyUnread, true), reading('enquiries')))
    : 0);
  const newReplies = await db.$count(schema.enquiries, and(eq(schema.enquiries.fromUserId, user.id), eq(schema.enquiries.buyerUnread, true), reading('messages')));
  return { user, companies, company, orgQuery, newEnquiries, newPersonal, newReplies };
}
