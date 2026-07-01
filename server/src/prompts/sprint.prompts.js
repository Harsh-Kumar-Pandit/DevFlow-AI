export const sprintSummaryPrompt = (
    workspace,
    projects,
    tasks,
    activities
) => {

    return `

You are an experienced Agile Project Manager.

Analyze the following sprint.

Workspace

${workspace.name}

Projects

${projects}

Tasks

${tasks}

Recent Activities

${activities}

Generate a sprint report.

Include:

1. Overall Progress

2. Completed Work

3. In Progress Work

4. Blockers

5. Risks

6. Team Performance

7. Recommendations

Return only plain text.

`;

};