// One place for every outward link and contact detail the pages share.
export const site = {
  name: 'QuintaEarth',
  email: 'quintaearth@gmail.com',
  whatsapp: 'https://chat.whatsapp.com/DLLpwsKL4Qf8C6aM5AvDWi?s=cl&p=a&mlu=4&ilr=4',
  socials: [
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/company/quintaearth/' },
    { label: 'YouTube', icon: 'youtube', href: 'https://www.youtube.com/@QuintaEarth' },
    { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/quintaearth_' },
    { label: 'Telegram', icon: 'telegram', href: 'https://t.me/quintaearth' },
    { label: 'X', icon: 'x', href: 'https://x.com/QuintaEarth' },
  ],
  description:
    'QuintaEarth is one hub for everyone who works in, studies or cares about sustainability, green tech and clean tech.',
  ogImage: 'assets/youtube-banner-2560.jpg',
} as const;

/** Header links that can be marked as the current section. */
export type NavKey = 'about' | 'industries' | 'insights' | 'press' | 'volunteer' | 'contact';

// Google Apps Script web apps that store form submissions in Diksha's sheets.
// They are the same endpoints the pre-revamp site posted to.
export const formEndpoints = {
  partner: 'https://script.google.com/macros/s/AKfycbx1fOHhkENMi3VJcNw_gVMLmV-8-9xCbkrbaEOjyuVarkQe3BBAo29e_yPdX6pH-AAZIg/exec',
  collaborators: 'https://script.google.com/macros/s/AKfycbzVSYYebvaOsIywQZPGv3zZzss27e-gBWhEGo_C4CcIa64M0PuitidLuzOEx6U42nqlnA/exec',
  volunteer: 'https://script.google.com/macros/s/AKfycbwQiYb8LIs9O9SUxOqTUdd8Dt8-mucSdoH1yQ2cwvNM_xHMzwrCQRagvKLof9KrqIrU/exec',
  reviews: 'https://script.google.com/macros/s/AKfycbwCjFfLWgIh-yJZWAukdAX6lUnHCO2qqCMzoPr14EIH2q1zfk7sP1dqGznSaCNPzt0Z/exec',
} as const;
