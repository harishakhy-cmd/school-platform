'use strict';

const examAttemptModel = require('../models/examAttemptModel');

async function askAssistant(req, res, next) {
  try {
    const studentReg = req.session.registrationNumber;

    // Security check: Check if student has an active CBT exam in progress
    if (studentReg) {
      const inProgressExam = await examAttemptModel.findInProgressOtherExam(studentReg, -1);
      if (inProgressExam) {
        return res.status(403).json({
          error: 'AI Learning Assistant is strictly disabled during active examinations to maintain academic integrity.',
          code: 'AI_DISABLED_DURING_EXAM'
        });
      }
    }

    const { prompt, topic, action } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const cleanPrompt = prompt.trim();
    const currentTopic = topic ? topic.trim() : 'General Academic Studies';

    // Structured educational AI responses for common learning patterns
    let responseText = '';

    if (action === 'summarize') {
      responseText = `### 📚 Summary: ${currentTopic}\n\n**Core Concepts:**\n- ${cleanPrompt}\n\n**Key Takeaways:**\n1. Review the primary definitions and foundational axioms.\n2. Apply the theoretical principles to sample problem sets.\n3. Verify your understanding using self-assessment quizzes.`;
    } else if (action === 'practice_questions') {
      responseText = `### 🎯 Practice Questions for: ${currentTopic}\n\n1. **Concept Verification**: Explain in your own words the significance of *${cleanPrompt}*.\n2. **Applied Problem**: How would you apply this principle to solve a practical scenario in ${currentTopic}?\n3. **Critical Analysis**: Contrast this method with alternative approaches discussed in your classroom lessons.`;
    } else {
      responseText = `### 💡 Academic Explanation: ${currentTopic}\n\n**Concept Overview:**\nRegarding *"${cleanPrompt}"*, this is a fundamental topic in ${currentTopic}.\n\n**Detailed Breakdown:**\n- **Definition**: The structured framework describing this phenomenon or process.\n- **Methodology**: Follow the step-by-step approach established in your course lessons.\n- **Practical Application**: This concept is widely tested in academic assessments and applied in technical problem solving.\n\n*Tip: Feel free to ask follow-up questions or request additional practice exercises!*`;
    }

    return res.json({
      ok: true,
      response: responseText,
      topic: currentTopic
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  askAssistant
};
