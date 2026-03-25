import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('/auth', 'routes/auth.tsx'),
  route('/logout', 'routes/logout.tsx'),
  route('/resume-intelligence-suite', 'routes/upload.tsx'),
  route('/interview-qa-generator', 'routes/interview.tsx'),
  route('/jobs', 'routes/jobs.tsx'),
  route('/mock-test', 'routes/mock-test.tsx'),
  route('/upload', 'routes/legacy-upload.tsx'),
  route('/interview', 'routes/legacy-interview.tsx'),
  route('/resume/:id', 'routes/resume.tsx'),
  route('/wipe', 'routes/wipe.tsx'),
  route('/api/generate-questions', 'routes/api.generate-questions.ts'),
  route('/api/career-roadmap', 'routes/api.career-roadmap.ts'),
  route('/api/resume-analysis', 'routes/api.resume-analysis.ts'),
  route('/api/mock-test/generate', 'routes/api.mock-test.generate.ts'),
  route('/api/mock-test/submit', 'routes/api.mock-test.submit.ts'),
] satisfies RouteConfig;
