export const projectSummaryPrompt = (project, tasks) => {

    return `
You are an experienced Technical Project Manager.

Analyze the following software project.

Project Name:
${project.name}

Description:
${project.description || "No description"}

Tasks:
${tasks}

Generate a professional project summary.

Include:

- Overall progress
- What's completed
- What's in progress
- Risks
- Recommendations
- Next steps

Return plain text only.
`;

};