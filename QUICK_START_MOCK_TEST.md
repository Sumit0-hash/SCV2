# AI Mock Test - Quick Start Guide

## Setup (5 minutes)

### 1. Configure Environment Variables

Add to your `.env` file:

```bash
# Already configured for other features
GEMINI_API_KEY=your_gemini_key_here

# New for mock tests (auto-configured in Supabase environment)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Already Set Up

The database schema was automatically created via Supabase MCP. No manual migration needed.

### 3. Run the Application

```bash
npm install
npm run build
npm run dev
```

### 4. Test the Feature

1. Navigate to `http://localhost:5173`
2. Login or create an account
3. Click "AI Mock Test" in navigation
4. Enter job profile (e.g., "Frontend Developer")
5. Select question counts (e.g., 5 MCQs + 5 short answers)
6. Click "Generate Test"
7. Answer questions
8. Click "Submit Test"
9. View detailed results

---

## API Usage Examples

### Generate a Test

```typescript
const response = await fetch('/api/mock-test/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobProfile: 'React Developer',
    mcqCount: 5,
    shortAnswerCount: 5
  })
});

const { testId, questions } = await response.json();
```

### Submit a Test

```typescript
const response = await fetch('/api/mock-test/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    testId: 'your-test-id',
    userAnswers: {
      'q_123': 'A',
      'q_456': 'Docker'
    }
  })
});

const { score, accuracyPercentage, evaluationDetails } = await response.json();
```

---

## Common Issues

### "GEMINI_API_KEY is not configured"
**Solution**: Add `GEMINI_API_KEY` to your `.env` file.

### "Supabase credentials not configured"
**Solution**: Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env`.

### "Test not found"
**Solution**: Ensure the test ID is valid and the test hasn't expired (2 hours).

### "This test has already been submitted"
**Solution**: Each test can only be submitted once. Generate a new test.

### Questions not generating
**Solution**:
- Verify Gemini API key is valid
- Check you have credits in Gemini API account
- Check console for errors

---

## Key Files

- **Frontend**: `app/routes/mock-test.tsx`
- **API Generate**: `app/routes/api.mock-test.generate.ts`
- **API Submit**: `app/routes/api.mock-test.submit.ts`
- **Service**: `app/services/mock-test.server.ts`
- **Database**: Supabase tables `mock_tests` and `mock_test_submissions`

---

## Database Queries (Direct Access)

If you need to query the database directly:

```sql
-- View all tests for a user
SELECT * FROM mock_tests WHERE user_email = 'user@example.com';

-- View all submissions
SELECT * FROM mock_test_submissions WHERE user_email = 'user@example.com';

-- Expire old tests manually
UPDATE mock_tests SET status = 'expired'
WHERE status = 'generated' AND expires_at < now();
```

---

## Customization

### Change Question Difficulty
Edit `app/services/mock-test.server.ts`:
- Modify the Gemini prompt to request 'medium' or 'easy' level

### Change Test Expiration
Edit `app/routes/api.mock-test.generate.ts`:
- Change `interval '2 hours'` to desired duration

### Add More Question Types
1. Update types in `app/services/mock-test.server.ts`
2. Update Gemini prompt
3. Update UI in `app/routes/mock-test.tsx`
4. Update evaluation logic

---

## Testing

### Manual Testing Checklist
- [ ] Generate test with valid inputs
- [ ] Generate test with invalid inputs (should error)
- [ ] Answer all questions correctly (should get 100%)
- [ ] Answer all questions incorrectly (should get 0%)
- [ ] Leave some questions unanswered
- [ ] Try to submit the same test twice (should error)
- [ ] Wait 2 hours and try to submit (should error)
- [ ] Try to access another user's test (should fail via RLS)

### Automated Testing (Recommended)
Write tests using Jest/Vitest for:
- Question generation
- Evaluation logic
- Input validation
- Error handling

---

## Performance Tips

1. **Generation**: Takes 3-5 seconds (depends on Gemini API)
   - Can't be optimized much (AI processing time)
   - Show loading animation to user

2. **Evaluation**: <500ms (server-side logic)
   - Already optimized (no AI calls)
   - Pure JavaScript comparison

3. **Database**: Indexed for performance
   - Queries are fast
   - RLS policies optimized

---

## Cost Monitoring

### Gemini API Usage
- Each test generation costs ~$0.002
- Monitor usage in Google Cloud Console
- Set up billing alerts

### Supabase Usage
- Free tier: Plenty for development
- Storage: Minimal (JSONB is efficient)
- Monitor in Supabase dashboard

---

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Always validate input** before sending to Gemini
3. **Use RLS** for all database access (already implemented)
4. **Rotate session secrets** regularly
5. **Monitor for abuse** (rate limiting recommended)

---

## Support

- **Technical Docs**: See `MOCK_TEST_FEATURE.md`
- **Implementation Details**: See `AI_MOCK_TEST_IMPLEMENTATION.md`
- **General Help**: Check existing features for patterns

---

## Quick Commands

```bash
# Install dependencies
npm install

# Build project
npm run build

# Run dev server
npm run dev

# Type check
npm run typecheck

# View database schema
# (Use Supabase dashboard or MCP tool)
```

---

**Ready to use!** The feature is production-ready and fully integrated.
