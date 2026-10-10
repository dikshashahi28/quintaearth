// Every form posts to one of these. Grouped by area: actions.profile.update, actions.company.invite ...
import { account } from './account';
import { company } from './company';
import { enquiries } from './enquiries';
import { identity } from './identity';
import { listings } from './listings';
import { profile } from './profile';

export const server = { account, profile, company, listings, enquiries, identity };
