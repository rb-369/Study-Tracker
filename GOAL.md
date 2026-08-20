OG goal:
Create a proper mobile responsive AI powered study tracker which will track my study sessions with subject, topic. It will tell me proper analytics of my studies and tell me if i am improving or not it will also have a in between thoughts recorder like i can note my thoughts and time of that thoughts and approx duration of that thought while that session was going on. This will help user understand properly the acutal time he/she is studying and then give proper ai powered analysis on it and tips to focus properly and reduce thoughts while studying and reach the flowstate and increase their deep work capacity while studying and overall improve their focus and complete thier syllabus, suggest them recommended study sessions. I am also thinking of adding features like user will upload thier syllabus and then our app creates a recommended sudy sessions for them but dont add it for now we will do it later

Schema:
A study session will have subject, topic, time(starting time, ending time(user will end it like a user did a 1hr study session and started at 10pm so end time will be 11pm here)), thoughts, thought title, thought time. And some more better things which i dont have idea right now. This will help our app to get proper analytics for users, showing them their proper flow state and all 

Improved goal:(is this good or the og is better?)
# StudyFlow — AI-Powered Study Tracker

## 1. Vision
A mobile-responsive study tracker that logs study sessions by subject and topic, captures stray thoughts *during* a session so the app can tell **actual focused time** apart from raw clock time, and uses AI to show whether the user is improving, why focus breaks happen, and how to extend deep work and reach flow state more consistently.

## 2. Core Features

### 2.1 Study Session Tracking
- Log a session with **subject** + **topic**
- Manual start / end (e.g. start 10:00 PM → end 11:00 PM = 1 hr session), duration auto-calculated
- Session states: `active`, `completed`, `abandoned`

### 2.2 In-Session Thought Log ("Mind Pings")
- While a session is running, the user can quickly note a thought with: **title**, optional longer detail, **timestamp**, and **approximate duration**
- A session can have multiple thoughts
- Purpose: separate *gross session time* (clock time) from *net focused time* (clock time minus time spent on stray thoughts)

### 2.3 Analytics Dashboard
- Net focus time vs. gross session time (Focus Ratio)
- Trend graphs (daily / weekly / monthly): is study time and focus improving, declining, or flat
- Subject- and topic-wise time breakdown
- Thought patterns: when distractions happen most, average thought duration, thoughts per hour
- Streaks and consistency tracking

### 2.4 AI-Powered Insights & Coaching
- Analysis of whether the user is actually improving, and in which areas
- Personalized tips to reduce distracting thoughts and extend focus streaks
- Guidance on reaching and sustaining flow state
- Deep work capacity tracking over time
- Recommended session structure (length, topic sequencing, break timing) based on the user's *own* historical focus data
- Recommended next session — based on past performance only for now (see Section 3)

### 2.5 Mobile-Responsive UI
- Fully usable on phone, tablet, and desktop
- One-handed "Start Session" and "Log a Thought" actions, since thoughts need to be captured quickly without breaking focus further

## 3. Explicitly Out of Scope (For a Later Phase)
- **Syllabus upload → AI-generated recommended study plan.** Noted for the future; not part of this build.

## 4. Data Schema (Draft)

Core entities: `Subject`, `StudySession`, `Thought`, and an optional `DailyStat` for fast analytics.

### Subject
| Field | Type | Notes |
|---|---|---|
| id | string | |
| userId | string | |
| name | string | e.g. "Physics" |

### StudySession
| Field | Type | Notes |
|---|---|---|
| id | string | |
| userId | string | |
| subjectId | string | FK → Subject |
| topic | string | free text |
| startTime | datetime | |
| endTime | datetime \| null | null while session is still active |
| grossDuration | computed | `endTime - startTime` |
| netFocusDuration | computed | `grossDuration - sum(thought.approxDuration)` |
| status | enum | `active` / `completed` / `abandoned` |
| sessionNote | string, optional | free-form reflection after ending the session |
| focusScore | computed, 0–100 | derived metric, see Section 5 |

### Thought
| Field | Type | Notes |
|---|---|---|
| id | string | |
| sessionId | string | FK → StudySession |
| title | string | short label, e.g. "Lunch craving" |
| detail | string, optional | longer note |
| timestamp | datetime | when it occurred during the session |
| approxDuration | number (minutes) | user's own estimate |

### DailyStat (optional — precomputed rollups for faster charts)
| Field | Type | Notes |
|---|---|---|
| date | date | |
| totalGrossMinutes | number | |
| totalNetMinutes | number | |
| avgFocusScore | number | |
| sessionCount | number | |

## 5. Key Metrics to Compute
- **Focus Ratio** = `netFocusDuration / grossDuration`
- **Trend**: focus ratio and net study time over rolling 7/30-day windows (improving / declining / flat)
- **Distraction pattern**: most common thought titles, typical time-of-day, average thought duration, thoughts per hour of study
- **Deep work streaks**: longest stretch within a session with zero logged thoughts
- **Subject-wise allocation**: time spent per subject/topic over time

## 6. Open Questions to Resolve Before/During Build
- Should focusScore start as a simple formula (e.g. Focus Ratio × consistency factor) and get refined with AI later, or be AI-derived from day one?
- Do we want a reminder/notification if a session is left running too long?
- Single-user local storage for now, or accounts + cloud sync from the start?

## 7. Roadmap
- **Phase 1**: Core session tracking + thought log + analytics dashboard (this doc)
- **Phase 2**: AI-powered analysis, focus tips, flow-state coaching
- **Phase 3**: Syllabus upload → AI-recommended study session plans