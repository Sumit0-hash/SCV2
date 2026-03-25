/*
  # AI Mock Test System Schema

  ## Overview
  This migration creates the complete database structure for the AI Mock Test feature.

  ## Tables Created

  ### 1. mock_tests
  Stores generated mock tests with questions and correct answers.
  - `id` (uuid, primary key) - Unique test identifier
  - `user_email` (text) - Email of the user who created the test
  - `job_profile` (text) - Target job profile for the test
  - `mcq_count` (integer) - Number of MCQ questions
  - `short_answer_count` (integer) - Number of short answer questions
  - `questions` (jsonb) - Array of question objects
  - `correct_answers` (jsonb) - Object mapping question IDs to correct answers
  - `status` (text) - Test status: 'generated', 'submitted', 'expired'
  - `created_at` (timestamptz) - Test creation timestamp
  - `expires_at` (timestamptz) - Test expiration timestamp (2 hours from creation)

  ### 2. mock_test_submissions
  Stores user submissions and evaluation results.
  - `id` (uuid, primary key) - Unique submission identifier
  - `test_id` (uuid, foreign key) - Reference to mock_tests
  - `user_email` (text) - Email of the user who submitted
  - `user_answers` (jsonb) - User's answers to all questions
  - `score` (integer) - Total score achieved
  - `total_questions` (integer) - Total number of questions
  - `accuracy_percentage` (numeric) - Accuracy as percentage
  - `mcq_correct` (integer) - Number of correct MCQ answers
  - `mcq_total` (integer) - Total MCQ questions
  - `short_answer_correct` (integer) - Number of correct short answers
  - `short_answer_total` (integer) - Total short answer questions
  - `evaluation_details` (jsonb) - Detailed breakdown per question
  - `submitted_at` (timestamptz) - Submission timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own tests and submissions
  - Authenticated users only

  ## Indexes
  - Indexes on user_email for fast lookups
  - Index on test_id for submission lookups
  - Index on created_at for sorting
*/

-- Create mock_tests table
CREATE TABLE IF NOT EXISTS mock_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  job_profile text NOT NULL,
  mcq_count integer NOT NULL DEFAULT 0,
  short_answer_count integer NOT NULL DEFAULT 0,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'generated',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '2 hours'),
  CONSTRAINT valid_mcq_count CHECK (mcq_count >= 0 AND mcq_count <= 50),
  CONSTRAINT valid_short_answer_count CHECK (short_answer_count >= 0 AND short_answer_count <= 50),
  CONSTRAINT valid_status CHECK (status IN ('generated', 'submitted', 'expired'))
);

-- Create mock_test_submissions table
CREATE TABLE IF NOT EXISTS mock_test_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL,
  accuracy_percentage numeric(5,2) NOT NULL DEFAULT 0,
  mcq_correct integer NOT NULL DEFAULT 0,
  mcq_total integer NOT NULL DEFAULT 0,
  short_answer_correct integer NOT NULL DEFAULT 0,
  short_answer_total integer NOT NULL DEFAULT 0,
  evaluation_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  submitted_at timestamptz DEFAULT now(),
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= total_questions),
  CONSTRAINT valid_accuracy CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mock_tests_user_email ON mock_tests(user_email);
CREATE INDEX IF NOT EXISTS idx_mock_tests_created_at ON mock_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mock_test_submissions_test_id ON mock_test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_submissions_user_email ON mock_test_submissions(user_email);
CREATE INDEX IF NOT EXISTS idx_mock_test_submissions_submitted_at ON mock_test_submissions(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_tests

-- Users can view their own tests
CREATE POLICY "Users can view own mock tests"
  ON mock_tests FOR SELECT
  TO authenticated
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can create their own tests
CREATE POLICY "Users can create own mock tests"
  ON mock_tests FOR INSERT
  TO authenticated
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can update their own tests
CREATE POLICY "Users can update own mock tests"
  ON mock_tests FOR UPDATE
  TO authenticated
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can delete their own tests
CREATE POLICY "Users can delete own mock tests"
  ON mock_tests FOR DELETE
  TO authenticated
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for mock_test_submissions

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON mock_test_submissions FOR SELECT
  TO authenticated
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can create their own submissions
CREATE POLICY "Users can create own submissions"
  ON mock_test_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can update their own submissions
CREATE POLICY "Users can update own submissions"
  ON mock_test_submissions FOR UPDATE
  TO authenticated
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Function to automatically expire old tests
CREATE OR REPLACE FUNCTION expire_old_mock_tests()
RETURNS void AS $$
BEGIN
  UPDATE mock_tests
  SET status = 'expired'
  WHERE status = 'generated'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
