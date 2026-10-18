import { Lead, TeamMember, LeadActivity, MemberActivityMistake, DailyTask } from '@/types/crm';

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'usr-tauhid',
    full_name: 'Tauhid',
    username: 'tauhid',
    password: 'Tauhid#Admin786',
    email: 'tauhid@masteradsinjection.io',
    phone: '+8801700000001',
    role: 'team_leader',
    is_deputy: false,
    is_active: true,
    on_leave: false,
    consecutive_approvals: 0,
    is_trusted_hunter: true,
    points: 0,
    rank: 1,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-mustafizur',
    full_name: 'Mustafizur',
    username: 'mustafizur',
    password: 'Mustafiz#Ads91',
    email: 'mustafizur@masteradsinjection.io',
    phone: '+8801700000002',
    role: 'outreach_specialist',
    is_deputy: false,
    is_active: true,
    on_leave: false,
    consecutive_approvals: 0,
    is_trusted_hunter: true,
    points: 0,
    rank: 2,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-sunny',
    full_name: 'Sunny',
    username: 'sunny',
    password: 'Sunny#Ads55',
    email: 'sunny@masteradsinjection.io',
    phone: '+8801700000006',
    role: 'outreach_specialist',
    is_deputy: false,
    is_active: true,
    on_leave: false,
    consecutive_approvals: 0,
    is_trusted_hunter: true,
    points: 0,
    rank: 3,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-sakib',
    full_name: 'Sakib',
    username: 'sakib',
    password: 'Sakib#Ads73',
    email: 'sakib@masteradsinjection.io',
    phone: '+8801700000004',
    role: 'outreach_specialist',
    is_deputy: false,
    is_active: true,
    on_leave: false,
    consecutive_approvals: 0,
    is_trusted_hunter: true,
    points: 0,
    rank: 4,
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-tahmeed',
    full_name: 'Tahmeed',
    username: 'tahmeed',
    password: 'Tahmeed#Ads82',
    email: 'tahmeed@masteradsinjection.io',
    phone: '+8801700000003',
    role: 'outreach_specialist',
    is_deputy: false,
    is_active: true,
    on_leave: false,
    consecutive_approvals: 0,
    is_trusted_hunter: false,
    points: 0,
    rank: 5,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-alauddin',
    full_name: 'Alauddin',
    username: 'alauddin',
    password: 'Alauddin#Ads64',
    email: 'alauddin@masteradsinjection.io',
    phone: '+8801700000005',
    role: 'outreach_specialist',
    is_deputy: false,
    is_active: true,
    on_leave: false,
    consecutive_approvals: 0,
    is_trusted_hunter: false,
    points: 0,
    rank: 6,
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-imam',
    full_name: 'Imam',
    username: 'imam',
    password: 'Imam#Ads46',
    email: 'imam@masteradsinjection.io',
    phone: '+8801700000007',
    role: 'outreach_specialist',
    is_deputy: false,
    is_active: true,
    on_leave: false,
    consecutive_approvals: 0,
    is_trusted_hunter: false,
    points: 0,
    rank: 7,
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-jahid',
    full_name: 'Jahid',
    username: 'jahid',
    password: 'Jahid#Ads37',
    email: 'jahid@masteradsinjection.io',
    phone: '+8801700000008',
    role: 'outreach_specialist',
    is_deputy: false,
    is_active: true,
    on_leave: false,
    consecutive_approvals: 0,
    is_trusted_hunter: false,
    points: 0,
    rank: 8,
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_ACTIVITIES: LeadActivity[] = [];

export const INITIAL_MISTAKES: MemberActivityMistake[] = [];

export const INITIAL_DAILY_TASKS: DailyTask[] = [];
