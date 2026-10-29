# Interactive Graphing & Data Visualization Lab — Architecture & Developer Guide

## 1. Overview
The **Interactive Graphing & Data Visualization Lab** is an integrated, multi-disciplinary graphing and scientific analysis module built directly into the CBT + Digital Classroom educational platform.

It is designed for any subject requiring curves, coordinates, charts, data visualization, or mathematical modeling (Mathematics, Physics, Chemistry, Biology, Geography, Economics, Statistics, Agriculture, etc.).

---

## 2. Core Architecture

### 2.1 Backend Structure
- **Database Tables**:
  - `saved_graphs`: Stores user-saved and classroom teaching graphs, configurations, parameters, and datasets.
  - `questions` (CBT) & `quiz_questions`: Extended with `question_type = 'GRAPH_INTERACTIVE'`, `graph_config`, and `graph_target`.
  - `responses` (CBT) & `quiz_responses`: Extended with `graph_answer` for student-plotted coordinates.
- **Subject Registry**:
  - `config/subjectProfiles.js` & `public/js/graph-subject-profiles.js`: Metadata definitions for all supported subjects, graph types, presets, and analysis tools.
- **Controller & Routes**:
  - `controllers/graphingController.js`: CRUD for saved graphs, subject profile retrieval, automated grading, and CSV export.
  - `routes/graphingRoutes.js`: Exposed at `/api/graphing` and `/api/classrooms/:classroomId/graphing`.

### 2.2 Frontend Engine (`public/js/graph-engine.js`)
- Standalone class `GraphEngine(container, options)`:
  - **Coordinate Space**: Dynamic bounds ($x_{min}, x_{max}, y_{min}, y_{max}$), smooth zoom and touch/mouse pan.
  - **Math Expressions**: Safe client-side parsing via `math.js` (No arbitrary `eval`).
  - **Parameter Sliders**: Real-time slider reactivity for $a, b, c, m, k, A, B, C, D$.
  - **Data Series**: Scatter plots, line curves, categorical bar charts, histograms, and linear regression best-fit lines ($y = mx + c$ with $R^2$).
  - **Analysis Tools**: Roots/Zeros, Extrema, Tangents ($dy/dx$), Definite Integrals ($\int_a^b$), and descriptive statistics ($\mu, \text{median}, \sigma$).
  - **Table of Values**: Auto-generated $(x, y)$ table with copy & export.
  - **Interactive Question Mode**: Allows students to click and plot answers on the coordinate plane.

---

## 3. How to Embed Graphs

### 3.1 In Lessons / Announcements
Tutors can embed an interactive graph into any lesson content using an iframe:
```html
<iframe src="/graphing-lab.html?embed=true&graphId=1" width="100%" height="450" frameborder="0"></iframe>
```

### 3.2 In CBT & Quizzes (`GRAPH_INTERACTIVE`)
Configure a CBT question with:
```json
{
  "question_type": "GRAPH_INTERACTIVE",
  "question_text": "Identify the point of intersection between the two curves.",
  "graph_config": {
    "xMin": -5,
    "xMax": 5,
    "yMin": -5,
    "yMax": 10,
    "functions": [
      { "expr": "x^2 - 4", "color": "#2563EB" },
      { "expr": "2*x - 1", "color": "#DC2626" }
    ]
  },
  "graph_target": {
    "interactionType": "select_point",
    "targetPoint": { "x": 3, "y": 5 },
    "tolerance": 0.2,
    "explanation": "Intersection occurs where x^2 - 4 = 2x - 1 => x = 3, y = 5."
  }
}
```

---

## 4. Extending with New Subjects & Tools

To add a new subject profile (e.g. **ASTRONOMY**):
1. Open `config/subjectProfiles.js` (server) and `public/js/graph-subject-profiles.js` (client).
2. Add your subject profile definition:
```javascript
ASTRONOMY: {
  id: 'ASTRONOMY',
  name: 'Astronomy & Astrophysics',
  icon: 'fa-user-astronaut',
  color: '#6366F1',
  defaultGraphType: 'scientific_data',
  supportedGraphTypes: [
    { id: 'scientific_data', name: 'Stellar Luminosity vs Temperature (H-R Diagram)', icon: 'fa-star' }
  ],
  defaultUnits: { x: 'K', y: 'L☉' },
  variableLabels: { x: 'Surface Temperature (T)', y: 'Luminosity (L)' },
  presets: [
    { name: 'Stefan-Boltzmann Law: L = 4πR²σT⁴', expr: 'sigma * 4 * pi * R^2 * x^4', params: { sigma: 5.67e-8, R: 6.96e8 } }
  ],
  analysisTools: [
    { id: 'best_fit', name: 'Log-Log Regression', icon: 'fa-arrow-trend-up' }
  ]
}
```
3. The Graphing Lab will automatically populate the new subject, its preset formulas, units, and specialized analysis tools across all dashboards!
