import { APP_DESCRIPTION, APP_NAME } from '@/constants';

export const siteConfig = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og.png',
  links: {
    twitter: 'https://twitter.com/builderweb',
    github: 'https://github.com/builderweb',
  },
};

export type SiteConfig = typeof siteConfig;
