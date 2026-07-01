export const generateTaskDescriptionPrompt = (title) => {

    return `
You are an experienced Senior Software Project Manager.

Generate a professional task description.

Task Title:
${title}

Rules:

- Write 80-120 words.
- Explain the objective.
- Mention expected outcome.
- Mention implementation details if appropriate.
- Do NOT use markdown.
- Return only the description.
`;

};

export const suggestPriorityPrompt = (title, description) => {

    return `
You are an experienced Technical Project Manager.

Analyze the task.

Title:
${title}

Description:
${description}

Choose only one priority.

Options:
Low
Medium
High
Critical

Return ONLY one word.
`;

};

export const breakTaskPrompt = (task) => {

    return `
You are an expert Software Architect.

Break the following task into logical implementation subtasks.

Task:

${task}

Rules:

- Return 5 to 10 subtasks.
- Each subtask should be one line.
- No numbering.
- No markdown.
`;

};