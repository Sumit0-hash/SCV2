import { requireUser } from "~/services/auth.server";
import { evaluateTest } from "~/services/mock-test.server";
import { mcp__supabase__execute_sql, mcp__supabase__query_sql } from "~/lib/supabase-mcp.server";

export async function loader() {
  return Response.json(
    { message: "This endpoint handles POST requests only." },
    { status: 405 }
  );
}

export async function action({ request }: { request: Request }) {
  const userEmail = await requireUser(request);

  try {
    const body = await request.json();
    const { testId, userAnswers } = body;

    if (!testId || typeof testId !== "string") {
      return Response.json(
        { error: "testId is required and must be a string." },
        { status: 400 }
      );
    }

    if (!userAnswers || typeof userAnswers !== "object") {
      return Response.json(
        { error: "userAnswers is required and must be an object." },
        { status: 400 }
      );
    }

    const testQuery = `
      SELECT id, user_email, questions, correct_answers, status, expires_at
      FROM mock_tests
      WHERE id = '${testId.replace(/'/g, "''")}'
    `;

    const testResult = await mcp__supabase__query_sql(testQuery);

    if (!testResult || testResult.length === 0) {
      return Response.json({ error: "Test not found." }, { status: 404 });
    }

    const test = testResult[0];

    if (test.user_email !== userEmail) {
      return Response.json(
        { error: "You do not have permission to submit this test." },
        { status: 403 }
      );
    }

    if (test.status === "submitted") {
      return Response.json(
        { error: "This test has already been submitted." },
        { status: 400 }
      );
    }

    if (test.status === "expired" || new Date(test.expires_at) < new Date()) {
      return Response.json(
        { error: "This test has expired." },
        { status: 400 }
      );
    }

    const existingSubmissionQuery = `
      SELECT id FROM mock_test_submissions WHERE test_id = '${testId.replace(/'/g, "''")}'
    `;

    const existingSubmissionResult = await mcp__supabase__query_sql(
      existingSubmissionQuery
    );

    if (existingSubmissionResult && existingSubmissionResult.length > 0) {
      return Response.json(
        { error: "This test has already been submitted." },
        { status: 400 }
      );
    }

    const questions = test.questions;
    const correctAnswers = test.correct_answers;

    const evaluation = evaluateTest(questions, correctAnswers, userAnswers);

    const updateTestQuery = `
      UPDATE mock_tests
      SET status = 'submitted'
      WHERE id = '${testId.replace(/'/g, "''")}'
    `;

    await mcp__supabase__execute_sql(updateTestQuery);

    const submissionId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();

    const insertSubmissionQuery = `
      INSERT INTO mock_test_submissions (
        id,
        test_id,
        user_email,
        user_answers,
        score,
        total_questions,
        accuracy_percentage,
        mcq_correct,
        mcq_total,
        short_answer_correct,
        short_answer_total,
        evaluation_details,
        submitted_at
      ) VALUES (
        '${submissionId}',
        '${testId.replace(/'/g, "''")}',
        '${userEmail.replace(/'/g, "''")}',
        '${JSON.stringify(userAnswers).replace(/'/g, "''")}'::jsonb,
        ${evaluation.score},
        ${evaluation.totalQuestions},
        ${evaluation.accuracyPercentage},
        ${evaluation.mcqCorrect},
        ${evaluation.mcqTotal},
        ${evaluation.shortAnswerCorrect},
        ${evaluation.shortAnswerTotal},
        '${JSON.stringify(evaluation.evaluationDetails).replace(/'/g, "''")}'::jsonb,
        '${submittedAt}'
      )
    `;

    await mcp__supabase__execute_sql(insertSubmissionQuery);

    const submission = {
      id: submissionId,
      test_id: testId,
      score: evaluation.score,
      total_questions: evaluation.totalQuestions,
      accuracy_percentage: evaluation.accuracyPercentage,
      mcq_correct: evaluation.mcqCorrect,
      mcq_total: evaluation.mcqTotal,
      short_answer_correct: evaluation.shortAnswerCorrect,
      short_answer_total: evaluation.shortAnswerTotal,
      evaluation_details: evaluation.evaluationDetails,
      submitted_at: submittedAt
    };

    return Response.json({
      submissionId: submission.id,
      testId: submission.test_id,
      score: submission.score,
      totalQuestions: submission.total_questions,
      accuracyPercentage: submission.accuracy_percentage,
      mcqCorrect: submission.mcq_correct,
      mcqTotal: submission.mcq_total,
      shortAnswerCorrect: submission.short_answer_correct,
      shortAnswerTotal: submission.short_answer_total,
      evaluationDetails: submission.evaluation_details,
      submittedAt: submission.submitted_at,
    });
  } catch (error: any) {
    console.error("Mock test submission error:", error);
    return Response.json(
      { error: error?.message || "Failed to submit mock test." },
      { status: 500 }
    );
  }
}
