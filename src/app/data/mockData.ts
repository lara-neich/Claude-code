import type { Study } from "./types"

export const mockStudy: Study = {
  name: "Oracle Cloud Console Navigation Redesign - Usability Study",
  participantFilter: "Cloud infrastructure managers, DevOps engineers",
  goals: [
    { id: "g1", text: "Evaluate the effectiveness of the new navigation structure for daily cloud management tasks", checked: true },
    { id: "g2", text: "Understand how users discover and access less frequently used services", checked: false },
    { id: "g3", text: "Assess the impact of dashboard customization on user productivity", checked: false },
    { id: "g4", text: "Identify pain points in the current service switcher workflow", checked: true },
  ],
  learningObjectives: [
    { id: "lo1", text: "Determine if persistent navigation improves task completion rates across console sections", checked: true },
    { id: "lo2", text: "Understand user mental models for organizing cloud services and resources", checked: false },
    { id: "lo3", text: "Evaluate whether breadcrumb navigation reduces disorientation in deep page hierarchies", checked: true },
    { id: "lo4", text: "Assess the role of dashboard widgets in surfacing actionable information", checked: false },
    { id: "lo5", text: "Identify which navigation patterns best support multi-service workflows", checked: false },
    { id: "lo6", text: "Measure the learnability of the new console layout for first-time users", checked: true },
  ],
  nextSteps: [
    { id: "ns1", text: "Redesign service switcher with improved visual hierarchy and search functionality", checked: false },
    { id: "ns2", text: "Implement persistent sidebar navigation prototype for A/B testing", checked: true },
    { id: "ns3", text: "Create customizable dashboard widget system with drag-and-drop support", checked: false },
    { id: "ns4", text: "Conduct follow-up study focused on breadcrumb navigation in nested resource views", checked: false },
  ],
  keyLearnings: [
    {
      id: "kl1",
      title: "Users expect persistent navigation across all console sections",
      confidence: 87,
      tags: ["Navigation", "Visual hierarchy"],
      why: [
        "7 out of 8 participants expressed frustration when the sidebar collapsed during service transitions",
        "Users frequently referenced the navigation menu as their primary orientation tool within the console",
        "Participants who had experience with AWS and Azure expected consistent left-nav patterns",
      ],
      achievedObjectives: [
        "Determine if persistent navigation improves task completion rates across console sections",
        "Identify which navigation patterns best support multi-service workflows",
      ],
      followUpQuestions: [
        "How does persistent navigation affect performance on lower-bandwidth connections?",
        "Should the navigation collapse automatically on smaller viewport sizes?",
      ],
      confidenceOverTime: [
        { interview: "Interview 1", confidence: 45 },
        { interview: "Interview 2", confidence: 55 },
        { interview: "Interview 3", confidence: 68 },
        { interview: "Interview 4", confidence: 72 },
        { interview: "Interview 5", confidence: 80 },
        { interview: "Interview 6", confidence: 87 },
      ],
      quotes: [
        {
          id: "q1",
          text: "Every time I switch between Compute and Networking, I lose my place. The nav just disappears and I have to figure out where I am again.",
          participantName: "Sarah Chen",
          transcriptId: "T-001",
          timestamp: "12:34",
        },
        {
          id: "q2",
          text: "I need that sidebar to always be there. It's like a map - without it, I'm just clicking around hoping I find the right page.",
          participantName: "Marcus Johnson",
          transcriptId: "T-002",
          timestamp: "08:15",
        },
        {
          id: "q3",
          text: "In AWS, the navigation stays put. I can always see where I am in the hierarchy. That's what I expect here too.",
          participantName: "Priya Patel",
          transcriptId: "T-003",
          timestamp: "22:47",
        },
      ],
    },
    {
      id: "kl2",
      title: "Dashboard customization is critical for daily workflows",
      confidence: 74,
      tags: ["Dashboard", "Customization"],
      why: [
        "6 out of 8 participants said the default dashboard did not show the metrics most relevant to their role",
        "DevOps engineers and infrastructure managers need completely different dashboard views",
        "Participants spent an average of 3 minutes looking for key metrics that could have been on a personalized dashboard",
      ],
      achievedObjectives: [
        "Assess the role of dashboard widgets in surfacing actionable information",
      ],
      followUpQuestions: [
        "What are the top 5 widgets each persona would add to their dashboard?",
        "Should dashboard layouts be shareable across team members?",
        "How do users feel about AI-suggested dashboard configurations?",
      ],
      confidenceOverTime: [
        { interview: "Interview 1", confidence: 30 },
        { interview: "Interview 2", confidence: 42 },
        { interview: "Interview 3", confidence: 55 },
        { interview: "Interview 4", confidence: 65 },
        { interview: "Interview 5", confidence: 74 },
      ],
      quotes: [
        {
          id: "q4",
          text: "The first thing I do every morning is check my instance health and cost alerts. Why isn't that front and center?",
          participantName: "David Kim",
          transcriptId: "T-004",
          timestamp: "05:22",
        },
        {
          id: "q5",
          text: "I've been asking for customizable dashboards for two years. Every team has different KPIs - one size doesn't fit all.",
          participantName: "Sarah Chen",
          transcriptId: "T-001",
          timestamp: "31:08",
        },
      ],
    },
    {
      id: "kl3",
      title: "Service switcher needs better visual hierarchy",
      confidence: 65,
      tags: ["Navigation", "Search"],
      why: [
        "5 out of 8 participants struggled to find specific services in the service switcher dropdown",
        "The flat list presentation made it difficult to distinguish between service categories",
        "Participants with 10+ services actively managed preferred using search but found it unreliable",
      ],
      achievedObjectives: [
        "Understand user mental models for organizing cloud services and resources",
        "Identify which navigation patterns best support multi-service workflows",
      ],
      followUpQuestions: [
        "Would a categorized service switcher with sections improve discoverability?",
        "How should recently used services be surfaced in the switcher?",
      ],
      confidenceOverTime: [
        { interview: "Interview 1", confidence: 25 },
        { interview: "Interview 2", confidence: 40 },
        { interview: "Interview 3", confidence: 50 },
        { interview: "Interview 4", confidence: 58 },
        { interview: "Interview 5", confidence: 65 },
      ],
      quotes: [
        {
          id: "q6",
          text: "There's like 40 services in this dropdown and they're all the same size text. I can never find Database quickly.",
          participantName: "Marcus Johnson",
          transcriptId: "T-002",
          timestamp: "15:33",
        },
        {
          id: "q7",
          text: "I tried searching for 'block storage' but it's listed as 'Block Volumes'. The search should handle synonyms.",
          participantName: "Priya Patel",
          transcriptId: "T-003",
          timestamp: "09:41",
        },
        {
          id: "q8",
          text: "Why can't I pin my most-used services to the top? I only use about 5 of these regularly.",
          participantName: "David Kim",
          transcriptId: "T-004",
          timestamp: "18:55",
        },
      ],
    },
    {
      id: "kl4",
      title: "Breadcrumb navigation reduces cognitive load in deep hierarchies",
      confidence: 82,
      tags: ["Navigation", "Visual hierarchy"],
      why: [
        "Participants navigating 3+ levels deep relied heavily on breadcrumbs to understand their location",
        "Tasks completed 40% faster when breadcrumbs were visible compared to hidden",
        "Users reported feeling less anxious about getting lost when breadcrumbs showed the full path",
      ],
      achievedObjectives: [
        "Evaluate whether breadcrumb navigation reduces disorientation in deep page hierarchies",
        "Measure the learnability of the new console layout for first-time users",
      ],
      followUpQuestions: [
        "Should breadcrumbs be interactive (clickable) at every level?",
        "How should breadcrumbs behave when the path is very long (5+ levels)?",
      ],
      confidenceOverTime: [
        { interview: "Interview 1", confidence: 50 },
        { interview: "Interview 2", confidence: 60 },
        { interview: "Interview 3", confidence: 70 },
        { interview: "Interview 4", confidence: 75 },
        { interview: "Interview 5", confidence: 78 },
        { interview: "Interview 6", confidence: 82 },
      ],
      quotes: [
        {
          id: "q9",
          text: "Oh, I can see I'm in Networking > VCN > Subnet > Security List. That's really helpful. Without that trail I'd have no idea how deep I am.",
          participantName: "Sarah Chen",
          transcriptId: "T-001",
          timestamp: "44:12",
        },
        {
          id: "q10",
          text: "The breadcrumbs are like a safety net. I know I can always click back to where I was without using the browser back button.",
          participantName: "Marcus Johnson",
          transcriptId: "T-002",
          timestamp: "27:09",
        },
      ],
    },
  ],
}
