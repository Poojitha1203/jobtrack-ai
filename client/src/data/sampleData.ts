import type { Application } from '../types/application.ts';
import type { Interview } from '../types/interview.ts';
import { addDays } from '../lib/date.ts';

// TEMPORARY sample data so the dashboard can be designed before the database exists.
// Dates are relative to "now", so the dashboard always looks current.
// Phase 4 replaces this file with real data from Supabase.

const now = new Date();

const daysAgo = (days: number) => addDays(now, -days).toISOString();

const at = (daysAhead: number, hour: number, minute = 0) => {
  const date = addDays(now, daysAhead);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const sampleApplications: Application[] = [
  { id: 'a1', jobTitle: 'Frontend Developer', company: 'Lumen Labs', location: 'Bengaluru', workMode: 'hybrid', status: 'interview', appliedAt: daysAgo(1) },
  { id: 'a2', jobTitle: 'React Developer', company: 'Northwind Digital', location: 'Remote', workMode: 'remote', status: 'applied', appliedAt: daysAgo(0) },
  { id: 'a22', jobTitle: 'Frontend Engineer II', company: 'Lattice Works', location: 'Remote', workMode: 'remote', status: 'applied', appliedAt: daysAgo(0) },
  { id: 'a3', jobTitle: 'Software Engineer I', company: 'Cobalt Systems', location: 'Hyderabad', workMode: 'onsite', status: 'assessment', appliedAt: daysAgo(3) },
  { id: 'a4', jobTitle: 'Full Stack Developer', company: 'Brightpath', location: 'Pune', workMode: 'hybrid', status: 'applied', appliedAt: daysAgo(4) },
  { id: 'a5', jobTitle: 'UI Engineer', company: 'Pixelcraft', location: 'Remote', workMode: 'remote', status: 'rejected', appliedAt: daysAgo(6) },
  { id: 'a6', jobTitle: 'Junior Web Developer', company: 'Harbor Health', location: 'Chennai', workMode: 'onsite', status: 'applied', appliedAt: daysAgo(8) },
  { id: 'a7', jobTitle: 'Frontend Engineer', company: 'Quantive', location: 'Bengaluru', workMode: 'hybrid', status: 'interview', appliedAt: daysAgo(9) },
  { id: 'a8', jobTitle: 'Node.js Developer', company: 'Stackwise', location: 'Remote', workMode: 'remote', status: 'rejected', appliedAt: daysAgo(11) },
  { id: 'a9', jobTitle: 'Software Developer', company: 'Orbit Retail', location: 'Mumbai', workMode: 'hybrid', status: 'applied', appliedAt: daysAgo(13) },
  { id: 'a10', jobTitle: 'React Native Developer', company: 'Fieldnote', location: 'Remote', workMode: 'remote', status: 'assessment', appliedAt: daysAgo(15) },
  { id: 'a11', jobTitle: 'Associate Engineer', company: 'Meridian Bank', location: 'Hyderabad', workMode: 'onsite', status: 'rejected', appliedAt: daysAgo(17) },
  { id: 'a12', jobTitle: 'Frontend Developer', company: 'Greenleaf', location: 'Bengaluru', workMode: 'hybrid', status: 'offer', appliedAt: daysAgo(20) },
  { id: 'a13', jobTitle: 'JavaScript Developer', company: 'Tidewater', location: 'Remote', workMode: 'remote', status: 'applied', appliedAt: daysAgo(22) },
  { id: 'a14', jobTitle: 'Web Developer', company: 'Saffron Media', location: 'Delhi', workMode: 'onsite', status: 'rejected', appliedAt: daysAgo(25) },
  { id: 'a15', jobTitle: 'Software Engineer', company: 'Vertex Cloud', location: 'Bengaluru', workMode: 'hybrid', status: 'interview', appliedAt: daysAgo(27) },
  { id: 'a16', jobTitle: 'Graduate Engineer', company: 'Atlas Mobility', location: 'Pune', workMode: 'onsite', status: 'applied', appliedAt: daysAgo(31) },
  { id: 'a17', jobTitle: 'Frontend Intern', company: 'Kite Analytics', location: 'Remote', workMode: 'remote', status: 'rejected', appliedAt: daysAgo(34) },
  { id: 'a18', jobTitle: 'MERN Stack Developer', company: 'Copperline', location: 'Chennai', workMode: 'hybrid', status: 'applied', appliedAt: daysAgo(38) },
  { id: 'a19', jobTitle: 'Software Engineer', company: 'Nimbus Pay', location: 'Bengaluru', workMode: 'hybrid', status: 'offer', appliedAt: daysAgo(43) },
  { id: 'a20', jobTitle: 'React Developer', company: 'Bluebird Travel', location: 'Remote', workMode: 'remote', status: 'rejected', appliedAt: daysAgo(47) },
  { id: 'a21', jobTitle: 'Frontend Developer', company: 'Arcadia Games', location: 'Hyderabad', workMode: 'onsite', status: 'assessment', appliedAt: daysAgo(52) },
  { id: 'w1', jobTitle: 'Senior Frontend Engineer', company: 'Polaris AI', location: 'Remote', workMode: 'remote', status: 'wishlist', appliedAt: null },
  { id: 'w2', jobTitle: 'Developer Advocate', company: 'Openfield', location: 'Bengaluru', workMode: 'hybrid', status: 'wishlist', appliedAt: null },
];

export const sampleInterviews: Interview[] = [
  { id: 'i1', applicationId: 'a1', company: 'Lumen Labs', jobTitle: 'Frontend Developer', round: 'Technical round 1', type: 'video', scheduledAt: at(1, 11) },
  { id: 'i2', applicationId: 'a7', company: 'Quantive', jobTitle: 'Frontend Engineer', round: 'HR screening', type: 'phone', scheduledAt: at(3, 15, 30) },
  { id: 'i3', applicationId: 'a15', company: 'Vertex Cloud', jobTitle: 'Software Engineer', round: 'System design', type: 'onsite', scheduledAt: at(6, 10) },
];
