// The 17 UN Sustainable Development Goals, with the one-line reading the site has always carried.
// Official pages: sdgs.un.org (goal) and un.org/sustainabledevelopment (topic).
export interface Goal { n: number; title: string; line: string; un: string; topic: string }

export const goals: Goal[] = [
  { n: 1, title: "No Poverty", line: "No one left in want. Poverty ended in every form, in every place.", un: 'https://sdgs.un.org/goals/goal1', topic: 'https://www.un.org/sustainabledevelopment/poverty/' },
  { n: 2, title: "Zero Hunger", line: "Enough food, grown well. Hunger ended, and the fields kept living.", un: 'https://sdgs.un.org/goals/goal2', topic: 'https://www.un.org/sustainabledevelopment/hunger/' },
  { n: 3, title: "Good Health and Well-Being", line: "Health held for every age — lives that can last, and be well.", un: 'https://sdgs.un.org/goals/goal3', topic: 'https://www.un.org/sustainabledevelopment/health/' },
  { n: 4, title: "Quality Education", line: "Learning that is open, fair, and lasting — school as a right, not a privilege.", un: 'https://sdgs.un.org/goals/goal4', topic: 'https://www.un.org/sustainabledevelopment/education/' },
  { n: 5, title: "Gender Equality", line: "Women and girls standing in full measure. Equality made, not promised.", un: 'https://sdgs.un.org/goals/goal5', topic: 'https://www.un.org/sustainabledevelopment/gender-equality/' },
  { n: 6, title: "Clean Water and Sanitation", line: "Water that can be drunk, and sanitation that can be trusted — for everyone.", un: 'https://sdgs.un.org/goals/goal6', topic: 'https://www.un.org/sustainabledevelopment/water-and-sanitation/' },
  { n: 7, title: "Affordable and Clean Energy", line: "Power that is clean, steady, and within reach.", un: 'https://sdgs.un.org/goals/goal7', topic: 'https://www.un.org/sustainabledevelopment/energy/' },
  { n: 8, title: "Decent Work and Economic Growth", line: "Work worth doing, and growth that does not hollow the earth.", un: 'https://sdgs.un.org/goals/goal8', topic: 'https://www.un.org/sustainabledevelopment/economic-growth/' },
  { n: 9, title: "Industry, Innovation and Infrastructure", line: "Roads, industry, and new tools built to last — and to include.", un: 'https://sdgs.un.org/goals/goal9', topic: 'https://www.un.org/sustainabledevelopment/infrastructure-industrialization/' },
  { n: 10, title: "Reduced Inequalities", line: "The gap narrowed — within countries, and between them.", un: 'https://sdgs.un.org/goals/goal10', topic: 'https://www.un.org/sustainabledevelopment/inequality/' },
  { n: 11, title: "Sustainable Cities and Communities", line: "Cities that hold people safely, and can last.", un: 'https://sdgs.un.org/goals/goal11', topic: 'https://www.un.org/sustainabledevelopment/cities/' },
  { n: 12, title: "Responsible Consumption and Production", line: "Make and use with care. Less waste, more that can return.", un: 'https://sdgs.un.org/goals/goal12', topic: 'https://www.un.org/sustainabledevelopment/sustainable-consumption-production/' },
  { n: 13, title: "Climate Action", line: "The climate will not wait. Act now, and keep acting.", un: 'https://sdgs.un.org/goals/goal13', topic: 'https://www.un.org/sustainabledevelopment/climate-change/' },
  { n: 14, title: "Life Below Water", line: "The oceans kept, not spent. Life under the water held as commons.", un: 'https://sdgs.un.org/goals/goal14', topic: 'https://www.un.org/sustainabledevelopment/oceans/' },
  { n: 15, title: "Life on Land", line: "Forests, soil, and the wild kept whole. Desert turned back. The land restored.", un: 'https://sdgs.un.org/goals/goal15', topic: 'https://www.un.org/sustainabledevelopment/biodiversity/' },
  { n: 16, title: "Peace, Justice and Strong Institutions", line: "Peace you can walk in, justice you can reach, and institutions that answer.", un: 'https://sdgs.un.org/goals/goal16', topic: 'https://www.un.org/sustainabledevelopment/peace-justice/' },
  { n: 17, title: "Partnerships for the Goals", line: "None of this is done alone. The partnership has to be real.", un: 'https://sdgs.un.org/goals/goal17', topic: 'https://www.un.org/sustainabledevelopment/globalpartnerships/' },
];

/** Further reading listed under the goals. */
export const goalReading = [
  { href: 'https://sdgs.un.org/goals', label: "The 17 Goals — UN Department of Economic and Social Affairs" },
  { href: 'https://www.un.org/sustainabledevelopment/', label: "United Nations Sustainable Development" },
  { href: 'https://www.un.org/sustainabledevelopment/sustainable-development-goals/', label: "Take Action for the Sustainable Development Goals" },
  { href: 'https://sdgs.un.org/2030agenda', label: "Transforming our world: the 2030 Agenda for Sustainable Development" },
  { href: 'https://unstats.un.org/sdgs/indicators/indicators-list/', label: "Global indicator framework for the SDGs" },
  { href: 'https://unstats.un.org/sdgs/', label: "SDG Indicators — UN Statistics Division" },
  { href: 'https://unstats.un.org/sdgs/report/2025/', label: "The Sustainable Development Goals Report 2025" },
  { href: 'https://sdgs.un.org/gsdr', label: "Global Sustainable Development Report" },
];

export const goalByNumber = new Map(goals.map((g) => [g.n, g]));
