# SafeSphere emergency alert website

## Experience
- Build a single responsive SafeSphere control room with a frosted-glass navigation bar, dark navy environment, red emergency accents, restrained motion, and professional Hinglish copy.
- Use a dashboard-first layout: live status, alert controls, severity summaries, acknowledgement progress, location coverage, interactive trends, and alert history.
- Clearly mark every demo event as “Simulated” and keep the presentation honest about external services.

## Functional flows
- Let an admin create simulated alerts with severity, location, message, and audience; update dashboard counts, charts, acknowledgements, and history immediately.
- Support acknowledge, resolve, filter, and search interactions inside the website.
- Add an Admin Studio for editing “Made by Ankur”, Ankush, two additional member names, roles, project details, About AWS copy, and selected website content.
- Save alerts and admin edits in the current browser so they survive refreshes; include safe demo defaults and a reset option.

## Content
- Explain AWS cloud computing, Lambda, DynamoDB, API Gateway, and Cognito in simple Hinglish.
- Label the AWS diagram as a proposed architecture and explicitly state that it is not an active integration.
- Keep all user-facing content in simple, polished Hinglish for a hackathon presentation.

## Technical details
- Implement on the existing TanStack Start page with React state, local browser persistence, Recharts, and Lucide icons; no API or notification integration.
- Define all visual colors, fonts, surfaces, and effects as semantic tokens in the global design system.
- Add route-specific metadata, accessibility labels, keyboard-friendly controls, mobile layouts, and reduced-motion handling.
- Add focused tests for the requested persistence and simulated-alert rules, then verify the live dashboard on desktop and mobile.
