/**
 * Virtual Computer Science, ICT & Software Development Laboratory
 * Master Workbench Controller & Multi-Engine Orchestrator
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Master State Management
  const state = {
    activeModule: null,
    activeMode: 'ide-editor',
    activeLanguage: 'python',
    modules: [],
    openFiles: [
      {
        id: 'file-1',
        name: 'main.py',
        language: 'python',
        content: `# ==========================================================
# Virtual Computer Science Laboratory
# Topic: Algorithmic Efficiency & Data Structures
# ==========================================================

def binary_search(arr, target):
    """
    Performs binary search on a sorted list with O(log n) time complexity.
    """
    low = 0
    high = len(arr) - 1
    steps = 0
    
    while low <= high:
        steps += 1
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid, steps
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1, steps

# Demonstration Execution
numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target_val = 23
result_idx, step_count = binary_search(numbers, target_val)

print("Array Elements:", numbers)
print(f"Target Value: {target_val}")
print(f"Index Found: {result_idx} (Resolved in {step_count} step(s))")
`
      }
    ],
    activeFileIndex: 0,
    projectTitle: 'Algorithms & Data Structures Demo',
    projectId: null,
    terminalHistory: [],
    historyIndex: -1,
    screenStream: null,
    isScreenSharing: false,
    hardwareLab: null
  };

  // Starter projects are grouped by curriculum module and run in the existing
  // editor, isolated language runner, or sandboxed browser preview.
  const CS_TEMPLATES = [
    {
      id: 'tmpl_html5_web',
      title: 'Responsive Web Application',
      lang: 'html',
      icon: 'fa-globe',
      desc: 'Semantic HTML5 structure, CSS3 Flexbox layout, and interactive DOM manipulation.',
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CBT Web Application</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <h1>Welcome to Virtual Web Lab</h1>
    <p>Real-time frontend compilation and responsive viewport testing.</p>
    <button id="counter-btn">Clicks: 0</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`
        },
        {
          name: 'style.css',
          language: 'css',
          content: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F8FAFC;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90vh;
  margin: 0;
}
.card {
  background: #FFFFFF;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  text-align: center;
}
h1 { color: #1E40AF; margin-top: 0; }
button {
  background: #FF4500;
  color: #FFFFFF;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s ease;
}
button:hover { transform: scale(1.05); }`
        },
        {
          name: 'script.js',
          language: 'javascript',
          content: `let count = 0;
const btn = document.getElementById('counter-btn');
btn.addEventListener('click', () => {
  count++;
  btn.textContent = 'Clicks: ' + count;
  console.log('Button clicked! Current count: ' + count);
});`
        }
      ]
    },
    {
      id: 'tmpl_python_ds',
      title: 'Python Data Structures & Complexity',
      lang: 'python',
      icon: 'fa-brands fa-python',
      desc: 'Stack, Queue, and Binary Search Tree class implementations with unit testing.',
      files: [
        {
          name: 'main.py',
          language: 'python',
          content: `class Stack:
    def __init__(self):
        self._items = []

    def push(self, val):
        self._items.append(val)

    def pop(self):
        return self._items.pop() if self._items else None

    def peek(self):
        return self._items[-1] if self._items else None

    def size(self):
        return len(self._items)

# Demonstrate LIFO (Last-In, First-Out)
stack = Stack()
for x in [10, 20, 30]:
    stack.push(x)

print("Stack size:", stack.size())
print("Popped item:", stack.pop())
print("New top:", stack.peek())
`
        }
      ]
    },
    {
      id: 'tmpl_python_oop',
      title: 'Python OOP & Design Patterns',
      lang: 'python',
      icon: 'fa-brands fa-python',
      desc: 'Inheritance, abstract base classes, property decorators, and encapsulation.',
      files: [
        {
          name: 'main.py',
          language: 'python',
          content: `from abc import ABC, abstractmethod

class Vehicle(ABC):
    def __init__(self, make, model):
        self.make = make
        self.model = model

    @abstractmethod
    def start_engine(self):
        pass

class ElectricCar(Vehicle):
    def __init__(self, make, model, battery_kwh):
        super().__init__(make, model)
        self.battery_kwh = battery_kwh

    def start_engine(self):
        return f"{self.make} {self.model}: Silent EV power unit initialized ({self.battery_kwh} kWh)"

car = ElectricCar("Tesla", "Model 3", 75)
print(car.start_engine())
`
        }
      ]
    },
    {
      id: 'tmpl_c_memory',
      title: 'C Dynamic Memory & Pointers',
      lang: 'c',
      icon: 'fa-c',
      desc: 'Pointers, dynamic heap memory with malloc/free, and structure memory layouts.',
      files: [
        {
          name: 'main.c',
          language: 'c',
          content: `#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    char name[32];
    double gpa;
} Student;

int main() {
    int n = 3;
    Student *roster = (Student*)malloc(n * sizeof(Student));
    if (!roster) {
        printf("Memory allocation failed!\\n");
        return 1;
    }

    roster[0] = (Student){101, "Alice", 3.92};
    roster[1] = (Student){102, "Brian", 3.75};
    roster[2] = (Student){103, "Catherine", 4.00};

    printf("--- Student Roster (Allocated on Heap) ---\\n");
    for (int i = 0; i < n; i++) {
        printf("ID: %d | Name: %-10s | GPA: %.2f\\n", roster[i].id, roster[i].name, roster[i].gpa);
    }

    free(roster);
    printf("Dynamic memory safely deallocated.\\n");
    return 0;
}
`
        }
      ]
    },
    {
      id: 'tmpl_cpp_oop',
      title: 'C++ Modern STL & Class Architecture',
      lang: 'cpp',
      icon: 'fa-c',
      desc: 'Modern C++ with STL vectors, polymorphism, and smart pointers.',
      files: [
        {
          name: 'main.cpp',
          language: 'cpp',
          content: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::vector<int> numbers = {10, 25, 40, 55, 70};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    double avg = static_cast<double>(sum) / numbers.size();

    std::cout << "Vector Size: " << numbers.size() << std::endl;
    std::cout << "Sum: " << sum << std::endl;
    std::cout << "Average: " << avg << std::endl;
    return 0;
}
`
        }
      ]
    },
    {
      id: 'tmpl_java_oop',
      title: 'Java Object-Oriented Architecture',
      lang: 'java',
      icon: 'fa-brands fa-java',
      desc: 'Polymorphic dispatch, interfaces, and encapsulated classes in OpenJDK 21.',
      files: [
        {
          name: 'Main.java',
          language: 'java',
          content: `interface Shape {
    double calculateArea();
}

class Rectangle implements Shape {
    private double width, height;
    public Rectangle(double w, double h) { this.width = w; this.height = h; }
    public double calculateArea() { return width * height; }
}

public class Main {
    public static void main(String[] args) {
        Shape s = new Rectangle(5.0, 8.0);
        System.out.println("Rectangle Area: " + s.calculateArea());
    }
}
`
        }
      ]
    },
    {
      id: 'tmpl_sql_relational',
      title: 'SQL Relational Database Schema',
      lang: 'sql',
      icon: 'fa-database',
      desc: 'DDL table definition, primary/foreign key constraints, and multi-table inner joins.',
      files: [
        {
          name: 'schema.sql',
          language: 'sql',
          content: `SELECT s.full_name, c.title AS course, e.grade
FROM students AS s
JOIN enrollments AS e ON e.student_id = s.id
JOIN courses AS c ON c.course_id = e.course_id
WHERE s.status = 'Active'
ORDER BY s.full_name, c.title
LIMIT 10;`
        }
      ]
    },
    {
      id: 'tmpl_node_rest',
      title: 'Full-Stack Node.js & REST API',
      lang: 'javascript',
      icon: 'fa-brands fa-node-js',
      desc: 'Node.js JSON endpoints, request handling, and RESTful CRUD data structure.',
      files: [
        {
          name: 'main.js',
          language: 'javascript',
          content: `const users = [
  { id: 1, name: 'Alice', role: 'Student' },
  { id: 2, name: 'Brian', role: 'Tutor' }
];

console.log("=== CBT REST API Sim ===");
console.log("GET /api/users =>", JSON.stringify(users, null, 2));
console.log("Total active accounts:", users.length);
`
        }
      ]
    },
    {
      id: 'tmpl_logic_gates',
      title: 'Computer Fundamentals & Logic Gates',
      lang: 'python',
      icon: 'fa-microchip',
      desc: 'Boolean logic gates (AND, OR, NOT, XOR, NAND) and half-adder ALU simulation.',
      files: [
        {
          name: 'main.py',
          language: 'python',
          content: `def AND_gate(a, b): return a & b
def OR_gate(a, b): return a | b
def XOR_gate(a, b): return a ^ b

def half_adder(a, b):
    sum_bit = XOR_gate(a, b)
    carry_bit = AND_gate(a, b)
    return sum_bit, carry_bit

print("--- 1-Bit Half Adder Truth Table ---")
print("A | B | Sum | Carry")
for a in [0, 1]:
    for b in [0, 1]:
        s, c = half_adder(a, b)
        print(f"{a} | {b} |  {s}  |   {c}")
`
        }
      ]
    },
    {
      id: 'tmpl_os_scheduler',
      title: 'Operating Systems Process Scheduler',
      lang: 'python',
      icon: 'fa-server',
      desc: 'Round Robin and First-Come First-Served CPU process scheduling algorithms.',
      files: [
        {
          name: 'main.py',
          language: 'python',
          content: `def round_robin(processes, quantum):
    queue = [dict(p) for p in processes]
    time = 0
    while queue:
        p = queue.pop(0)
        exec_time = min(p['burst'], quantum)
        p['burst'] -= exec_time
        time += exec_time
        print(f"Time {time:2d}ms: {p['name']} ran for {exec_time}ms (Remaining: {p['burst']}ms)")
        if p['burst'] > 0:
            queue.append(p)

tasks = [{'name': 'P1', 'burst': 10}, {'name': 'P2', 'burst': 4}, {'name': 'P3', 'burst': 6}]
print("--- Round Robin Scheduling (Quantum = 3ms) ---")
round_robin(tasks, 3)
`
        }
      ]
    },
    {
      id: 'tmpl_networking_sim',
      title: 'Networking & TCP/IP Transmission',
      lang: 'python',
      icon: 'fa-network-wired',
      desc: 'Socket networking demonstration and packet header encapsulation.',
      files: [
        {
          name: 'main.py',
          language: 'python',
          content: `print("Simulating TCP/IP 3-Way Handshake:")
print("1. [Client -> Server] SYN (Seq=100)")
print("2. [Server -> Client] SYN-ACK (Seq=300, Ack=101)")
print("3. [Client -> Server] ACK (Seq=101, Ack=301)")
print("Connection Established! State: ESTABLISHED")
`
        }
      ]
    },
    {
      id: 'tmpl_security_crypto',
      title: 'Cybersecurity Cryptographic Hashing',
      lang: 'python',
      icon: 'fa-shield-halved',
      desc: 'SHA-256 one-way hashing, salt concatenation, and rainbow table defense.',
      files: [
        {
          name: 'main.py',
          language: 'python',
          content: `import hashlib

def hash_password(password, salt="cbt_salt_2026"):
    hasher = hashlib.sha256()
    hasher.update((password + salt).encode('utf-8'))
    return hasher.hexdigest()

pwd = "sample-only"
hashed = hash_password(pwd)
print("Sample digest:", hashed)
`
        }
      ]
    },
    {
      id: 'tmpl_data_science',
      title: 'Data Science & Statistical Computing',
      lang: 'python',
      icon: 'fa-chart-pie',
      desc: 'Mean, Median, Standard Deviation, and basic statistical dataset analysis.',
      files: [
        {
          name: 'main.py',
          language: 'python',
          content: `import statistics

data = [12, 18, 22, 25, 29, 31, 35, 42, 49, 58]

print("=== Descriptive Statistics ===")
print("Data Points:", data)
print("Count:", len(data))
print("Mean:", statistics.mean(data))
print("Median:", statistics.median(data))
print("Std Deviation:", round(statistics.stdev(data), 2))
`
        }
      ]
    },
    {
      id: 'tmpl_mobile_android',
      title: 'Android Mobile App Architecture',
      lang: 'html',
      icon: 'fa-android',
      desc: 'Android Activity Lifecycle and mobile declarative UI layout hierarchy.',
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background: #E2E8F0; padding: 20px; display: flex; justify-content: center; }
    .phone { width: 320px; height: 500px; background: #FFF; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; }
    .status-bar { height: 24px; background: #1E40AF; color: white; font-size: 10px; display: flex; justify-content: space-between; padding: 4px 12px; }
    .content { padding: 16px; flex: 1; }
    .btn { background: #10B981; color: white; padding: 12px; border: none; width: 100%; border-radius: 8px; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <div class="phone">
    <div class="status-bar"><span>09:42</span><span>5G ■ 100%</span></div>
    <div class="content">
      <h3 style="color:#1E40AF; margin-top:0;">Android Activity</h3>
      <p style="font-size:13px; color:#64748B;">Activity Lifecycle: <code>onCreate()</code> -> <code>onStart()</code> -> <code>onResume()</code></p>
      <p id="activity-state" aria-live="polite" style="font-size:12px;font-family:monospace;color:#334155;">HomeActivity: onCreate → onStart → onResume</p>
      <button class="btn" id="launch-settings">Open Settings Activity</button>
      <section id="settings-screen" hidden style="margin-top:16px;padding:12px;background:#F1F5F9;border-radius:8px;">
        <h4 style="margin:0 0 8px;color:#0F172A;">SettingsActivity</h4>
        <p style="font-size:12px;color:#475569;">This screen represents an Android ACTION_VIEW intent in the activity lifecycle simulator.</p>
        <button class="btn" id="return-home" style="background:#1E40AF;">Return to Home</button>
      </section>
    </div>
  </div>
<script>
  const activityState = document.getElementById('activity-state');
  const settingsScreen = document.getElementById('settings-screen');
  document.getElementById('launch-settings').addEventListener('click', () => {
    activityState.textContent = 'HomeActivity: onPause → SettingsActivity: onCreate → onStart → onResume';
    settingsScreen.hidden = false;
  });
  document.getElementById('return-home').addEventListener('click', () => {
    settingsScreen.hidden = true;
    activityState.textContent = 'SettingsActivity: onPause → onStop → onDestroy; HomeActivity: onRestart → onStart → onResume';
  });
</script>
</body>
</html>`
        }
      ]
    }
  ];

  function createInteractiveTemplate(id, title, moduleCode, description, body, script, icon) {
    return {
      id,
      title,
      moduleCode,
      lang: 'html',
      icon,
      desc: description,
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body><main class="lab"><header><p class="eyebrow">SCHOOL · Interactive module sample</p><h1>${title}</h1><p>${description}</p></header>${body}<p class="notice">This is an educational simulation running locally in the lab preview.</p></main></body>
</html>`
        },
        { name: 'style.css', language: 'css', content: `:root{font-family:Inter,Segoe UI,Arial,sans-serif;color:#172554;background:#f1f5f9}*{box-sizing:border-box}body{margin:0;padding:24px}.lab{max-width:900px;margin:auto;background:#fff;border:1px solid #dbe4f0;border-radius:16px;padding:clamp(20px,4vw,36px);box-shadow:0 16px 40px #0f172a12}header{border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px}.eyebrow{color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}h1{margin:6px 0;font-size:clamp(24px,4vw,34px)}p{line-height:1.55;color:#475569}label{display:block;font-weight:650;margin:12px 0 5px}input,select,textarea,button{font:inherit}input,select,textarea{max-width:100%;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px}button{padding:9px 14px;border:0;border-radius:8px;background:#1d4ed8;color:#fff;font-weight:650;cursor:pointer}button:hover{background:#1e40af}button.secondary{background:#e2e8f0;color:#172554}.panel{padding:16px;margin:14px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.result{min-height:24px;margin-top:12px;color:#0f766e;font-family:ui-monospace,monospace;white-space:pre-wrap}.notice{font-size:12px;border-top:1px solid #e2e8f0;padding-top:12px}.good{color:#047857}.bad{color:#b91c1c}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{padding:8px;border:1px solid #cbd5e1;text-align:left}canvas{max-width:100%;border:1px solid #cbd5e1;border-radius:8px}.muted{color:#64748b;font-size:13px}` },
        { name: 'app.js', language: 'javascript', content: script }
      ]
    };
  }

  CS_TEMPLATES.push(
    createInteractiveTemplate(
      'tmpl_browser_testing', 'Browser Testing Workbench', 'builtin-browser',
      'Run practical checks against a sample page: heading structure, accessible names, and responsive viewport behavior.',
      `<section class="panel"><h2 id="sample-title">Sample page under test</h2><p>The page contains a heading, a labeled field, and an action button.</p><label for="sample-name">Your name</label><input id="sample-name" value="Student"><button id="sample-action">Save sample</button></section><div class="row"><button id="run-checks">Run page checks</button><select id="viewport"><option value="wide">Desktop viewport</option><option value="narrow">Mobile viewport</option></select></div><pre class="result" id="result" role="status"></pre>`,
      `const result = document.getElementById('result');
document.getElementById('run-checks').addEventListener('click', () => {
  const checks = [
    ['Exactly one primary heading', document.querySelectorAll('h1').length === 1],
    ['Input has an associated label', !!document.querySelector('label[for="sample-name"]')],
    ['Button has an accessible name', !!document.getElementById('sample-action').textContent.trim()]
  ];
  result.textContent = checks.map(([name, passed]) => (passed ? 'PASS' : 'FAIL') + ' · ' + name).join('\\n');
});
document.getElementById('viewport').addEventListener('change', event => {
  document.querySelector('.lab').style.maxWidth = event.target.value === 'narrow' ? '390px' : '900px';
});`,
      'fa-window-maximize'
    ),
    {
      id: 'tmpl_ide_workbench',
      title: 'IDE Productivity & Project Checks',
      moduleCode: 'programming-ide',
      lang: 'javascript',
      icon: 'fa-code',
      desc: 'Run a small project preflight that checks entry points, tests, and documentation before a build.',
      files: [{
        name: 'main.js',
        language: 'javascript',
        content: `const projectFiles = ['src/main.js', 'tests/main.test.js', 'README.md'];
const requiredFiles = ['src/main.js', 'tests/main.test.js', 'README.md'];
const results = requiredFiles.map((file) => ({
  file,
  present: projectFiles.includes(file)
}));
console.log('Project preflight');
for (const result of results) {
  console.log((result.present ? 'PASS' : 'MISSING') + ' · ' + result.file);
}
console.log('Ready to build:', results.every((result) => result.present));
`
      }]
    },
    createInteractiveTemplate(
      'tmpl_ios_swift_concepts', 'SwiftUI State & Lifecycle Explorer', 'ios-development',
      'Explore state-driven UI behavior with a browser prototype. This demonstrates SwiftUI concepts; it does not compile Swift.',
      `<section class="panel"><h2>CounterView</h2><p>In SwiftUI, a state change causes the view to be rendered again.</p><p>Current @State value: <strong id="count">0</strong></p><div class="row"><button id="increment">Increment state</button><button class="secondary" id="reset">Reset</button></div><p class="result" id="lifecycle" role="status">View initialized · body evaluated</p></section>`,
      `let count = 0;
function render() {
  document.getElementById('count').textContent = String(count);
  document.getElementById('lifecycle').textContent = 'State changed · body reevaluated · rendered value is ' + count;
}
document.getElementById('increment').addEventListener('click', () => { count += 1; render(); });
document.getElementById('reset').addEventListener('click', () => { count = 0; render(); });`,
      'fa-mobile-screen'
    ),
    createInteractiveTemplate(
      'tmpl_desktop_event_loop', 'Desktop Event Loop Simulator', 'desktop-development',
      'Queue UI tasks and advance them one at a time to see how an event loop keeps an application responsive.',
      `<section class="panel"><label for="task-name">Task to queue</label><div class="row"><input id="task-name" value="Refresh dashboard"><button id="queue-task">Queue task</button><button class="secondary" id="run-task">Run next task</button></div><p class="result" id="queue-state" role="status">Queue is empty.</p></section><ol id="event-log"></ol>`,
      `const queue = [];
const status = document.getElementById('queue-state');
document.getElementById('queue-task').addEventListener('click', () => {
  const name = document.getElementById('task-name').value.trim();
  if (!name) { status.textContent = 'Enter a task name first.'; return; }
  queue.push(name); status.textContent = queue.length + ' task(s) waiting: ' + queue.join(', ');
});
document.getElementById('run-task').addEventListener('click', () => {
  const name = queue.shift();
  if (!name) { status.textContent = 'Queue is empty.'; return; }
  const item = document.createElement('li'); item.textContent = 'Completed: ' + name;
  document.getElementById('event-log').prepend(item);
  status.textContent = queue.length ? queue.length + ' task(s) still waiting.' : 'Queue is empty.';
});`,
      'fa-window-maximize'
    ),
    createInteractiveTemplate(
      'tmpl_hardware_compatibility', 'PC Component Compatibility Checker', 'computer-hardware',
      'Choose components and check socket, memory-generation, and power-budget compatibility.',
      `<section class="panel"><label for="cpu">CPU socket</label><select id="cpu"><option value="AM5">AM5</option><option value="LGA1700">LGA1700</option></select><label for="board">Motherboard socket</label><select id="board"><option value="AM5">AM5</option><option value="LGA1700">LGA1700</option></select><label for="memory">Memory generation</label><select id="memory"><option>DDR5</option><option>DDR4</option></select><label for="board-memory">Board memory support</label><select id="board-memory"><option>DDR5</option><option>DDR4</option></select><label for="psu">Power supply (watts)</label><input id="psu" type="number" min="250" value="650"><button id="check">Check build</button><pre class="result" id="result" role="status"></pre></section>`,
      `document.getElementById('check').addEventListener('click', () => {
  const checks = [
    ['CPU socket matches motherboard', document.getElementById('cpu').value === document.getElementById('board').value],
    ['Memory generation matches motherboard', document.getElementById('memory').value === document.getElementById('board-memory').value],
    ['Power supply is at least 550 W for this sample build', Number(document.getElementById('psu').value) >= 550]
  ];
  document.getElementById('result').textContent = checks.map(([label, ok]) => (ok ? 'PASS · ' : 'CHECK · ') + label).join('\\n');
});`,
      'fa-microchip'
    ),
    createInteractiveTemplate(
      'tmpl_office_spreadsheet', 'Spreadsheet Formula & Data Validation Lab', 'office-applications',
      'Edit sample marks, calculate a total with a spreadsheet-style formula, and validate the score range.',
      `<section class="panel"><table><thead><tr><th>Cell</th><th>Assessment</th><th>Mark (0–100)</th></tr></thead><tbody><tr><td>A1</td><td>Quiz</td><td><input class="mark" type="number" min="0" max="100" value="78"></td></tr><tr><td>A2</td><td>Project</td><td><input class="mark" type="number" min="0" max="100" value="84"></td></tr><tr><td>A3</td><td>Exam</td><td><input class="mark" type="number" min="0" max="100" value="91"></td></tr></tbody></table><label for="formula">Formula</label><input id="formula" value="=SUM(A1:A3)"><button id="calculate">Calculate</button><pre class="result" id="result" role="status"></pre></section>`,
      `document.getElementById('calculate').addEventListener('click', () => {
  const formula = document.getElementById('formula').value.trim().toUpperCase();
  const cells = [...document.querySelectorAll('.mark')];
  if (!/^=SUM\\(A1:A3\\)$/.test(formula)) {
    document.getElementById('result').textContent = 'Supported sample formula: =SUM(A1:A3)';
    return;
  }
  const values = cells.map(input => Number(input.value));
  const valid = values.every(value => Number.isFinite(value) && value >= 0 && value <= 100);
  document.getElementById('result').textContent = valid
    ? 'Formula result: ' + values.reduce((sum, value) => sum + value, 0) + ' / 300\\nAverage: ' + (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) + '%'
    : 'Validation error: each mark must be between 0 and 100.';
});`,
      'fa-table-cells'
    ),
    createInteractiveTemplate(
      'tmpl_graphics_canvas', 'Canvas & Color Model Studio', 'graphics-multimedia',
      'Change a color and draw an interactive vector-style composition on the canvas.',
      `<section class="panel"><div class="row"><label for="color">Shape color</label><input id="color" type="color" value="#2563eb"><button id="draw">Draw composition</button><button class="secondary" id="clear">Clear canvas</button></div><canvas id="canvas" width="720" height="300" aria-label="Generated graphics canvas"></canvas><p class="muted">Canvas is 720 × 300 pixels. Browser preview only; no external media is uploaded.</p></section>`,
      `const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f8fafc'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = document.getElementById('color').value;
  context.beginPath(); context.arc(170, 150, 72, 0, Math.PI * 2); context.fill();
  context.fillRect(300, 90, 150, 120);
  context.beginPath(); context.moveTo(540, 210); context.lineTo(610, 80); context.lineTo(680, 210); context.closePath(); context.fill();
  context.fillStyle = '#0f172a'; context.font = '16px sans-serif'; context.fillText('Circle · rectangle · triangle', 18, 28);
}
document.getElementById('draw').addEventListener('click', draw);
document.getElementById('clear').addEventListener('click', () => context.clearRect(0, 0, canvas.width, canvas.height));
draw();`,
      'fa-palette'
    ),
    createInteractiveTemplate(
      'tmpl_uiux_accessibility', 'UI/UX Contrast & Interaction Lab', 'ui-ux-design',
      'Check WCAG contrast for foreground/background colors and preview the resulting interface.',
      `<section class="panel"><div class="row"><label for="foreground">Text color</label><input id="foreground" type="color" value="#1e3a8a"><label for="background">Background</label><input id="background" type="color" value="#ffffff"><button id="check">Check contrast</button></div><div id="preview" class="panel"><h2>Readable interface preview</h2><p>Contrast and hierarchy matter for every learner.</p></div><pre class="result" id="result" role="status"></pre></section>`,
      `function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
document.getElementById('check').addEventListener('click', () => {
  const fg = document.getElementById('foreground').value, bg = document.getElementById('background').value;
  document.getElementById('preview').style.color = fg;
  document.getElementById('preview').style.backgroundColor = bg;
  const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  const ratio = (values[0] + 0.05) / (values[1] + 0.05);
  document.getElementById('result').textContent = 'Contrast ratio: ' + ratio.toFixed(2) + ':1 · ' + (ratio >= 4.5 ? 'WCAG AA normal-text pass' : 'Below WCAG AA for normal text');
});`,
      'fa-universal-access'
    ),
    createInteractiveTemplate(
      'tmpl_ai_perceptron', 'Machine Learning Perceptron Trainer', 'artificial-intelligence',
      'Train a tiny perceptron on linearly separable AND-gate data and inspect its predictions.',
      `<section class="panel"><label for="rate">Learning rate</label><input id="rate" type="number" min="0.01" max="1" step="0.01" value="0.1"><button id="train">Train model</button><pre class="result" id="result" role="status">Model not trained.</pre></section>`,
      `document.getElementById('train').addEventListener('click', () => {
  const data = [[0,0,0],[0,1,0],[1,0,0],[1,1,1]], rate = Number(document.getElementById('rate').value);
  if (!(rate > 0 && rate <= 1)) { document.getElementById('result').textContent = 'Learning rate must be greater than 0 and at most 1.'; return; }
  let weights = [0, 0], bias = 0, epochs = 0;
  for (; epochs < 100; epochs++) {
    let errors = 0;
    for (const [x1, x2, expected] of data) {
      const actual = weights[0] * x1 + weights[1] * x2 + bias >= 0 ? 1 : 0;
      const delta = expected - actual;
      weights[0] += rate * delta * x1; weights[1] += rate * delta * x2; bias += rate * delta;
      if (delta) errors++;
    }
    if (!errors) break;
  }
  const predictions = data.map(([x1, x2]) => weights[0] * x1 + weights[1] * x2 + bias >= 0 ? 1 : 0);
  document.getElementById('result').textContent = 'Converged in ' + (epochs + 1) + ' epoch(s)\\nWeights: [' + weights.join(', ') + '] · bias: ' + bias + '\\nAND predictions: ' + predictions.join(', ') + '\\nAccuracy: ' + (predictions.filter((value, index) => value === data[index][2]).length * 25) + '%';
});`,
      'fa-brain'
    ),
    createInteractiveTemplate(
      'tmpl_cloud_architecture', 'Cloud Architecture & Cost Estimator', 'cloud-computing',
      'Compose a small cloud deployment and estimate its monthly compute and storage cost.',
      `<section class="panel"><label for="instances">Compute instances</label><input id="instances" type="number" min="1" value="2"><label for="hours">Hours per month per instance</label><input id="hours" type="number" min="1" max="744" value="200"><label for="storage">Object storage (GB)</label><input id="storage" type="number" min="0" value="100"><button id="estimate">Estimate monthly cost</button><pre class="result" id="result" role="status"></pre></section>`,
      `document.getElementById('estimate').addEventListener('click', () => {
  const instances = Number(document.getElementById('instances').value), hours = Number(document.getElementById('hours').value), storage = Number(document.getElementById('storage').value);
  if (![instances, hours, storage].every(Number.isFinite) || instances < 1 || hours < 1 || hours > 744 || storage < 0) {
    document.getElementById('result').textContent = 'Enter valid positive instance/hours values and non-negative storage.';
    return;
  }
  const compute = instances * hours * 0.04, objectStorage = storage * 0.02;
  document.getElementById('result').textContent = [
    'Compute: $' + compute.toFixed(2),
    'Object storage: $' + objectStorage.toFixed(2),
    'Estimated total: $' + (compute + objectStorage).toFixed(2) + '/month',
    'Illustrative rates only; not a provider quote.'
  ].join(' | ');
});`,
      'fa-cloud'
    ),
    createInteractiveTemplate(
      'tmpl_git_workflow', 'Git Staging & Commit Graph', 'git-version-control',
      'Stage changed files and create commits to see how Git snapshots build a project history.',
      `<section class="panel"><h2>Working tree</h2><div id="files"></div><label for="message">Commit message</label><input id="message" value="Add lab starter"><button id="commit">Commit staged changes</button><ol id="history"></ol><pre class="result" id="result" role="status"></pre></section>`,
      `const changed = new Set(['index.html', 'app.js']);
const staged = new Set();
const filesEl = document.getElementById('files'), history = document.getElementById('history');
for (const name of changed) {
  const label = document.createElement('label'), checkbox = document.createElement('input');
  checkbox.type = 'checkbox'; checkbox.addEventListener('change', () => checkbox.checked ? staged.add(name) : staged.delete(name));
  label.append(checkbox, document.createTextNode(' ' + name + ' (modified)')); filesEl.append(label);
}
document.getElementById('commit').addEventListener('click', () => {
  const message = document.getElementById('message').value.trim();
  if (!staged.size || !message) { document.getElementById('result').textContent = 'Stage at least one file and enter a commit message.'; return; }
  const item = document.createElement('li'); item.textContent = message + ' · ' + [...staged].join(', ');
  history.prepend(item); staged.clear(); filesEl.querySelectorAll('input').forEach(input => { input.checked = false; input.disabled = true; });
  document.getElementById('result').textContent = 'Commit recorded in this in-memory demonstration (not a real Git repository).';
});`,
      'fa-code-branch'
    ),
    createInteractiveTemplate(
      'tmpl_tutorial_walkthrough', 'Guided Coding Walkthrough', 'practical-tutorials',
      'Work through a short algorithm lesson with checkpoints and immediate feedback.',
      `<section class="panel"><h2 id="step-title"></h2><p id="step-description"></p><label for="answer">Your answer</label><input id="answer" autocomplete="off"><button id="check">Check checkpoint</button><button class="secondary" id="next">Next step</button><p class="result" id="result" role="status"></p></section>`,
      `const steps = [
  { title: '1 · Understand the input', description: 'A sorted list is [2, 4, 6, 8]. What value is at index 2 (zero-based)?', answer: '6' },
  { title: '2 · Choose the midpoint', description: 'For low=0 and high=3, integer midpoint is floor((low + high) / 2). What is it?', answer: '1' },
  { title: '3 · State the invariant', description: 'Binary search requires the input to be what?', answer: 'sorted' }
];
let index = 0, passed = false;
const title = document.getElementById('step-title'), description = document.getElementById('step-description'), result = document.getElementById('result');
function show() { title.textContent = steps[index].title; description.textContent = steps[index].description; document.getElementById('answer').value = ''; result.textContent = ''; passed = false; }
document.getElementById('check').addEventListener('click', () => { passed = document.getElementById('answer').value.trim().toLowerCase() === steps[index].answer; result.textContent = passed ? 'Correct. Checkpoint complete.' : 'Not quite; review the prompt and try again.'; result.className = 'result ' + (passed ? 'good' : 'bad'); });
document.getElementById('next').addEventListener('click', () => { if (!passed) { result.textContent = 'Complete the current checkpoint before continuing.'; return; } index = Math.min(index + 1, steps.length - 1); show(); });
show();`,
      'fa-chalkboard-user'
    ),
    createInteractiveTemplate(
      'tmpl_student_portfolio', 'Student Project Portfolio Builder', 'student-projects',
      'Add project summaries to a local portfolio preview and remove entries you no longer need.',
      `<section class="panel"><label for="project-title">Project title</label><input id="project-title" placeholder="e.g. Library catalogue"><label for="project-summary">Summary</label><input id="project-summary" placeholder="What problem does it solve?"><button id="add">Add portfolio project</button><ul id="portfolio"></ul><p class="muted">This preview stores items in memory only. Use Save in the main toolbar to persist source files.</p></section>`,
      `const list = document.getElementById('portfolio');
document.getElementById('add').addEventListener('click', () => {
  const title = document.getElementById('project-title').value.trim(), summary = document.getElementById('project-summary').value.trim();
  if (!title || !summary) { document.getElementById('project-title').focus(); return; }
  const item = document.createElement('li'), heading = document.createElement('strong'), text = document.createElement('p'), remove = document.createElement('button');
  heading.textContent = title; text.textContent = summary; remove.textContent = 'Remove'; remove.className = 'secondary';
  remove.addEventListener('click', () => item.remove()); item.append(heading, text, remove); list.append(item);
  document.getElementById('project-title').value = ''; document.getElementById('project-summary').value = '';
});`,
      'fa-folder-tree'
    )
  );

  CS_TEMPLATES.push({
    id: 'tmpl_practical_fibonacci',
    title: 'Practical CBT · Fibonacci Challenge',
    moduleCode: 'practical-examinations',
    lang: 'python',
    icon: 'fa-clipboard-check',
    desc: 'Implement an O(n) Fibonacci function, then run the assessment pane tests against your submission.',
    files: [{
      name: 'main.py',
      language: 'python',
      content: `def fibonacci(n):
    """Return the n-th Fibonacci number in O(n) time and O(1) space."""
    if n < 0:
        raise ValueError("n must be non-negative")
    previous, current = 0, 1
    for _ in range(n):
        previous, current = current, previous + current
    return previous

for sample in (0, 1, 2, 10, 50):
    print("Fibonacci", sample, "=", fibonacci(sample))
`
    }]
  });

  const MODULE_TEMPLATE_IDS = {
    'computer-fundamentals': 'tmpl_logic_gates',
    'programming-ide': 'tmpl_ide_workbench',
    'programming-languages': 'tmpl_python_oop',
    'web-development': 'tmpl_html5_web',
    'builtin-browser': 'tmpl_browser_testing',
    'android-development': 'tmpl_mobile_android',
    'ios-development': 'tmpl_ios_swift_concepts',
    'desktop-development': 'tmpl_desktop_event_loop',
    'database-laboratory': 'tmpl_sql_relational',
    'networking-laboratory': 'tmpl_networking_sim',
    'cybersecurity-laboratory': 'tmpl_security_crypto',
    'operating-systems': 'tmpl_os_scheduler',
    'computer-hardware': 'tmpl_hardware_compatibility',
    'office-applications': 'tmpl_office_spreadsheet',
    'graphics-multimedia': 'tmpl_graphics_canvas',
    'ui-ux-design': 'tmpl_uiux_accessibility',
    'data-science': 'tmpl_data_science',
    'artificial-intelligence': 'tmpl_ai_perceptron',
    'cloud-computing': 'tmpl_cloud_architecture',
    'git-version-control': 'tmpl_git_workflow',
    algorithms: 'tmpl_python_ds',
    'practical-tutorials': 'tmpl_tutorial_walkthrough',
    'student-projects': 'tmpl_student_portfolio',
    'practical-examinations': 'tmpl_practical_fibonacci'
  };

  // DOM Elements
  const modulesListEl = document.getElementById('cs-topics-list');
  const searchTopicsInput = document.getElementById('cs-search-topics');
  const inspectorTitleEl = document.getElementById('cs-inspector-title');
  const inspectorSubtitleEl = document.getElementById('cs-inspector-subtitle');
  const conceptsContainerEl = document.getElementById('cs-concepts-container');
  const loadModuleSampleBtn = document.getElementById('btn-load-module-sample');
  const selectLanguage = document.getElementById('select-cs-language');
  const runtimeBadgeEl = document.getElementById('cs-runtime-badge');
  const codeEditorEl = document.getElementById('cs-code-editor');
  const lineNumbersEl = document.getElementById('cs-line-numbers');
  const tabsBarEl = document.getElementById('cs-tabs-bar');
  const fileTreeContainerEl = document.getElementById('cs-file-tree-container');
  const projectNameBadge = document.getElementById('cs-project-name-badge');
  const searchFilesInput = document.getElementById('cs-search-files');

  // Toolbar Actions
  const btnRunCode = document.getElementById('btn-cs-run-code');
  const btnStopCode = document.getElementById('btn-cs-stop-code');
  const btnBuildCode = document.getElementById('btn-cs-build-code');
  const btnNewFile = document.getElementById('btn-cs-new-file');
  const btnSaveProject = document.getElementById('btn-cs-save-project');
  const btnClearCode = document.getElementById('btn-cs-clear-code');
  const btnFormatCode = document.getElementById('btn-toggle-format');
  const btnFullscreen = document.getElementById('btn-toggle-fullscreen');
  const btnAddFileTree = document.getElementById('btn-add-file-tree');
  const btnAddFolderTree = document.getElementById('btn-add-folder-tree');
  const btnUploadFileTree = document.getElementById('btn-upload-file-tree');
  const fileUploadInput = document.getElementById('cs-file-upload-input');
  const btnDownloadProject = document.getElementById('btn-download-project-tree');
  const btnShareProject = document.getElementById('btn-cs-share-project');

  // Tutor Specific Actions
  const btnShareScreen = document.getElementById('btn-cs-share-screen');
  const btnToggleNotes = document.getElementById('btn-cs-toggle-notes');
  const selectQuickTemplate = document.getElementById('select-quick-template');
  const tutorNotesInput = document.getElementById('tutor-lab-notes-input');
  const tutorNotesStatus = document.getElementById('tutor-notes-status');
  const btnNotesCopyEditor = document.getElementById('btn-notes-copy-editor');
  const btnNotesBroadcast = document.getElementById('btn-notes-broadcast');
  const btnNotesExport = document.getElementById('btn-notes-export');
  const btnClearNotes = document.getElementById('btn-clear-notes');

  // Screen Share Presenter HUD
  const screenShareHud = document.getElementById('cs-screenshare-hud');
  const screenShareVideo = document.getElementById('cs-screenshare-video');
  const btnScreenPip = document.getElementById('btn-screen-pip');
  const btnScreenFs = document.getElementById('btn-screen-fs');
  const btnScreenStop = document.getElementById('btn-screen-stop');

  // Bottom Dock Elements
  const paneOutput = document.getElementById('pane-dock-output');
  const paneErrors = document.getElementById('pane-dock-errors');
  const terminalHistory = document.getElementById('cs-terminal-history');
  const terminalInput = document.getElementById('cs-terminal-cmd');
  const btnClearDock = document.getElementById('btn-clear-dock');
  const btnToggleDock = document.getElementById('btn-toggle-dock');
  const bottomDockEl = document.getElementById('cs-bottom-dock');

  // Browser Elements
  const browserIframe = document.getElementById('cs-browser-iframe');
  const browserReload = document.getElementById('btn-browser-reload');
  const browserBack = document.getElementById('btn-browser-back');
  const browserForward = document.getElementById('btn-browser-forward');

  // Resizers
  const resizerLeft = document.getElementById('resizer-left');
  const resizerRight = document.getElementById('resizer-right');
  const resizerBottom = document.getElementById('resizer-bottom');
  const sidebarEl = document.getElementById('cs-sidebar');
  const inspectorEl = document.getElementById('cs-inspector');

  // =========================================================================
  // 1. Panel Resizers (Mouse Drag with Clamps)
  // =========================================================================
  function initResizers() {
    if (resizerLeft && sidebarEl) {
      resizerLeft.addEventListener('mousedown', (e) => {
        e.preventDefault();
        resizerLeft.classList.add('resizing');
        const startX = e.clientX;
        const startWidth = sidebarEl.getBoundingClientRect().width;

        function onMouseMove(moveEvent) {
          const newWidth = Math.min(Math.max(startWidth + (moveEvent.clientX - startX), 180), 480);
          sidebarEl.style.width = newWidth + 'px';
        }

        function onMouseUp() {
          resizerLeft.classList.remove('resizing');
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    if (resizerRight && inspectorEl) {
      resizerRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        resizerRight.classList.add('resizing');
        const startX = e.clientX;
        const startWidth = inspectorEl.getBoundingClientRect().width;

        function onMouseMove(moveEvent) {
          const newWidth = Math.min(Math.max(startWidth - (moveEvent.clientX - startX), 200), 500);
          inspectorEl.style.width = newWidth + 'px';
        }

        function onMouseUp() {
          resizerRight.classList.remove('resizing');
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    if (resizerBottom && bottomDockEl) {
      resizerBottom.addEventListener('mousedown', (e) => {
        e.preventDefault();
        resizerBottom.classList.add('resizing');
        const startY = e.clientY;
        const startHeight = bottomDockEl.getBoundingClientRect().height;

        function onMouseMove(moveEvent) {
          const newHeight = Math.min(Math.max(startHeight - (moveEvent.clientY - startY), 80), 450);
          bottomDockEl.style.height = newHeight + 'px';
        }

        function onMouseUp() {
          resizerBottom.classList.remove('resizing');
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }
  }

  // =========================================================================
  // 2. Fetch & Populate Curriculum Modules
  // =========================================================================
  async function loadCurriculumModules() {
    try {
      const res = await fetch('/api/cs/modules');
      const data = await res.json();
      if (data.success && data.modules) {
        state.modules = data.modules;
        renderModulesList(state.modules);

        if (state.modules.length > 0) {
          selectModule(state.modules[0].code);
          populateTemplatesModal();
        }
      }
    } catch (err) {
      console.warn('Failed to load CS curriculum modules:', err);
    }
  }

  let moduleSelectionRequest = 0;
  function renderModulesList(modules) {
    if (!modulesListEl) return;
    modulesListEl.innerHTML = '';

    modules.forEach((m) => {
      const item = document.createElement('div');
      item.className = `cs-topic-item ${state.activeModule && state.activeModule.code === m.code ? 'active' : ''}`;
      item.dataset.code = m.code;
      item.innerHTML = `
        <div class="cs-topic-icon">
          <i class="fa-solid ${m.icon || 'fa-code'}"></i>
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <div class="cs-topic-title text-truncate">${m.title}</div>
          <span class="cs-topic-branch">${m.branch || 'Computer Science'}</span>
        </div>
      `;
      item.addEventListener('click', () => selectModule(m.code));
      modulesListEl.appendChild(item);
    });
  }

  async function selectModule(code) {
    const requestId = ++moduleSelectionRequest;
    try {
      const res = await fetch(`/api/cs/modules/${code}`);
      const data = await res.json();
      if (requestId !== moduleSelectionRequest || !data.success || !data.module) return;

      const mod = data.module;
      state.activeModule = mod;

      document.querySelectorAll('.cs-topic-item').forEach((el) => {
        el.classList.toggle('active', el.dataset.code === code);
      });

      if (inspectorTitleEl) {
        inspectorTitleEl.innerHTML = `<i class="fa-solid ${mod.icon || 'fa-code'} text-primary me-2"></i> ${mod.title}`;
      }
      if (inspectorSubtitleEl) {
        inspectorSubtitleEl.textContent = `${mod.branch} • ${mod.category}`;
      }

      renderModuleConcepts(mod);
      if (loadModuleSampleBtn) {
        const sample = CS_TEMPLATES.find((template) => template.id === MODULE_TEMPLATE_IDS[code]);
        loadModuleSampleBtn.hidden = !sample;
        loadModuleSampleBtn.dataset.templateId = sample ? sample.id : '';
        loadModuleSampleBtn.textContent = sample ? `Load ${sample.title} sample` : 'No sample available';
      }

      // Auto-switch mode based on module topic
      if (code === 'web-development' || code === 'builtin-browser') {
        switchActiveMode('web-preview');
      } else if (code === 'database-laboratory') {
        switchActiveMode('database-sql');
      } else if (code === 'networking-laboratory' || code === 'cybersecurity-laboratory') {
        switchActiveMode('networks-sec');
      } else if (code === 'computer-hardware') {
        switchActiveMode('hardware-3d');
      } else if (code === 'practical-examinations') {
        switchActiveMode('cbt-practical');
      } else {
        switchActiveMode('ide-editor');
      }
    } catch (err) {
      console.warn('Error fetching module detail:', err);
    }
  }

  function renderModuleConcepts(mod) {
    if (!conceptsContainerEl) return;
    conceptsContainerEl.innerHTML = '';

    if (mod.keyConcepts && mod.keyConcepts.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'list-unstyled mb-0';
      mod.keyConcepts.forEach((kc) => {
        const li = document.createElement('li');
        li.className = 'mb-2 text-muted';
        li.innerHTML = `<i class="fa-solid fa-circle-check text-primary me-2"></i> ${kc}`;
        ul.appendChild(li);
      });
      conceptsContainerEl.appendChild(ul);
    } else {
      conceptsContainerEl.innerHTML = '<span class="text-muted">Standard algorithmic and systems principles applied.</span>';
    }
  }

  if (searchTopicsInput) {
    searchTopicsInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = state.modules.filter(
        (m) => m.title.toLowerCase().includes(q) || m.branch.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q))
      );
      renderModulesList(filtered);
    });
  }

  // =========================================================================
  // 3. Viewport Mode Switcher
  // =========================================================================
  document.querySelectorAll('.cs-mode-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.body.classList.remove('cs-mobile-topics-open', 'cs-mobile-inspector-open');
      document.querySelectorAll('[data-cs-mobile-panel]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
      const mode = pill.dataset.mode;
      switchActiveMode(mode);
    });
  });

  document.querySelectorAll('[data-cs-mobile-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      const panelClass = button.dataset.csMobilePanel === 'topics'
        ? 'cs-mobile-topics-open'
        : 'cs-mobile-inspector-open';
      const wasOpen = document.body.classList.contains(panelClass);
      document.body.classList.remove('cs-mobile-topics-open', 'cs-mobile-inspector-open');
      document.querySelectorAll('[data-cs-mobile-panel]').forEach((panelButton) => {
        panelButton.setAttribute('aria-pressed', 'false');
      });
      if (!wasOpen) {
        document.body.classList.add(panelClass);
        button.setAttribute('aria-pressed', 'true');
      }
    });
  });

  document.getElementById('cs-sidebar')?.addEventListener('click', (event) => {
    if (!event.target.closest('.cs-topic-item')) return;
    document.body.classList.remove('cs-mobile-topics-open');
    document.querySelector('[data-cs-mobile-panel="topics"]')?.setAttribute('aria-pressed', 'false');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.body.classList.remove('cs-mobile-topics-open', 'cs-mobile-inspector-open');
    document.querySelectorAll('[data-cs-mobile-panel]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
  });

  loadModuleSampleBtn?.addEventListener('click', () => {
    const template = CS_TEMPLATES.find((item) => item.id === loadModuleSampleBtn.dataset.templateId);
    if (template) applyTemplate(template);
  });

  function switchActiveMode(mode) {
    state.activeMode = mode;
    document.body.classList.toggle('cs-hardware-mode-active', mode === 'hardware-3d');
    document.querySelectorAll('.cs-mode-pill').forEach((p) => {
      p.classList.toggle('active', p.dataset.mode === mode);
    });

    document.querySelectorAll('.cs-mode-view').forEach((v) => {
      v.classList.remove('active');
      v.style.display = 'none';
    });

    const activeView = document.getElementById(`view-${mode}`);
    if (activeView) {
      activeView.classList.add('active');
      activeView.style.display = 'flex';
    }

    if (mode === 'web-preview') {
      updateWebPreview();
    } else if (mode === 'hardware-3d') {
      init3DHardwareViewport();
    } else if (mode === 'networks-sec') {
      drawNetworkTopology();
    }
  }

  // =========================================================================
  // 4. Code Editor & Line Numbers
  // =========================================================================
  function updateLineNumbers() {
    if (!codeEditorEl || !lineNumbersEl) return;
    const lines = codeEditorEl.value.split('\n').length;
    let lineStr = '';
    for (let i = 1; i <= lines; i++) {
      lineStr += i + '\n';
    }
    lineNumbersEl.textContent = lineStr;
  }

  if (codeEditorEl) {
    codeEditorEl.value = state.openFiles[0]?.content || '';
    if (selectLanguage && state.openFiles[0]?.language) {
      selectLanguage.value = state.openFiles[0].language;
      state.activeLanguage = state.openFiles[0].language;
    }
    updateLineNumbers();

    codeEditorEl.addEventListener('input', () => {
      updateLineNumbers();
      if (state.openFiles[state.activeFileIndex]) {
        state.openFiles[state.activeFileIndex].content = codeEditorEl.value;
      }
      if (state.activeMode === 'web-preview') {
        updateWebPreview();
      }
    });

    codeEditorEl.addEventListener('scroll', () => {
      lineNumbersEl.scrollTop = codeEditorEl.scrollTop;
    });

    // Keyboard Shortcuts & Smart Indentation
    codeEditorEl.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeEditorEl.selectionStart;
        const end = codeEditorEl.selectionEnd;
        codeEditorEl.setRangeText('    ', start, end, 'end');
        codeEditorEl.dispatchEvent(new Event('input', { bubbles: true }));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeCurrentCode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        btnSaveProject?.click();
      }
    });
  }

  // Language Selector Handler
  if (selectLanguage) {
    selectLanguage.addEventListener('change', (e) => {
      state.activeLanguage = e.target.value;
      const file = state.openFiles[state.activeFileIndex];
      if (file) {
        file.language = state.activeLanguage;
      }
      if (runtimeBadgeEl) {
        if (state.activeLanguage === 'python') runtimeBadgeEl.textContent = 'Python 3.12 (Isolated Worker)';
        else if (state.activeLanguage === 'c') runtimeBadgeEl.textContent = 'GCC 15.2.0 (MSYS2)';
        else if (state.activeLanguage === 'cpp') runtimeBadgeEl.textContent = 'G++ 15.2.0 (MSYS2)';
        else if (state.activeLanguage === 'java') runtimeBadgeEl.textContent = 'OpenJDK 21 LTS';
        else if (state.activeLanguage === 'javascript') runtimeBadgeEl.textContent = 'Node.js v24.14.0';
        else if (state.activeLanguage === 'html') runtimeBadgeEl.textContent = 'Live Browser Viewport';
        else if (state.activeLanguage === 'css') runtimeBadgeEl.textContent = 'CSS Stylesheet / Live Preview';
        else if (state.activeLanguage === 'sql') runtimeBadgeEl.textContent = 'Relational Engine';
      }
      updateTabsBar();
    });
  }

  // =========================================================================
  // 5. Open Tabs Bar & Multi-File Explorer
  // =========================================================================
  function updateTabsBar() {
    if (!tabsBarEl) return;
    tabsBarEl.innerHTML = '';

    state.openFiles.forEach((f, idx) => {
      const tab = document.createElement('div');
      tab.className = `cs-file-tab ${idx === state.activeFileIndex ? 'active' : ''}`;
      tab.dataset.idx = idx;

      let iconClass = 'fa-file-code';
      if (f.name.endsWith('.py')) iconClass = 'fa-brands fa-python text-warning';
      else if (f.name.endsWith('.html')) iconClass = 'fa-brands fa-html5 text-danger';
      else if (f.name.endsWith('.css')) iconClass = 'fa-brands fa-css3-alt text-primary';
      else if (f.name.endsWith('.js') || f.name.endsWith('.ts')) iconClass = 'fa-brands fa-js text-warning';
      else if (f.name.endsWith('.sql')) iconClass = 'fa-database text-info';
      else if (f.name.endsWith('.java')) iconClass = 'fa-brands fa-java text-danger';
      else if (f.name.endsWith('.c') || f.name.endsWith('.cpp')) iconClass = 'fa-c text-primary';

      tab.innerHTML = `<i class="${iconClass} me-1"></i> ${f.name} <i class="fa-solid fa-xmark cs-tab-close ms-2"></i>`;

      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('cs-tab-close')) {
          e.stopPropagation();
          closeFileTab(idx);
        } else {
          switchFileTab(idx);
        }
      });

      tabsBarEl.appendChild(tab);
    });

    renderFileTree();
  }

  function switchFileTab(idx) {
    if (!state.openFiles[idx]) return;
    state.activeFileIndex = idx;
    const file = state.openFiles[idx];
    state.activeLanguage = file.language || 'javascript';

    if (codeEditorEl) {
      codeEditorEl.value = file.content;
      updateLineNumbers();
    }

    // Auto-detect language dropdown
    if (selectLanguage && file.language) {
      selectLanguage.value = file.language;
    }

    codeEditorEl?.dispatchEvent(new Event('cs-editor-refresh'));
    updateTabsBar();
  }

  function closeFileTab(idx) {
    if (state.openFiles.length <= 1) {
      alert('Project must have at least one open file.');
      return;
    }
    state.openFiles.splice(idx, 1);
    if (state.activeFileIndex >= state.openFiles.length) {
      state.activeFileIndex = state.openFiles.length - 1;
    }
    switchFileTab(state.activeFileIndex);
  }

  function renderFileTree() {
    if (!fileTreeContainerEl) return;
    fileTreeContainerEl.innerHTML = '';

    const filterText = searchFilesInput ? searchFilesInput.value.toLowerCase().trim() : '';

    state.openFiles.forEach((f, idx) => {
      if (filterText && !f.name.toLowerCase().includes(filterText)) return;

      const item = document.createElement('div');
      item.className = `cs-tree-item ${idx === state.activeFileIndex ? 'active' : ''}`;
      item.innerHTML = `
        <span class="text-truncate">
          <i class="fa-regular fa-file-code me-2 text-primary"></i> ${f.name}
        </span>
        <div class="tree-actions">
          <button class="btn btn-xs btn-link text-secondary p-0 rename-btn" title="Rename"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-xs btn-link text-danger p-0 delete-btn ms-1" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      item.addEventListener('click', () => switchFileTab(idx));

      item.querySelector('.rename-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const newName = prompt('Enter new filename:', f.name);
        if (newName && newName.trim()) {
          f.name = newName.trim();
          updateTabsBar();
        }
      });

      item.querySelector('.delete-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeFileTab(idx);
      });

      fileTreeContainerEl.appendChild(item);
    });
  }

  if (searchFilesInput) {
    searchFilesInput.addEventListener('input', renderFileTree);
  }

  // Create New File Actions
  function addNewFilePrompt() {
    const name = prompt('Enter new filename (e.g. script.js, utils.py, query.sql, index.html):', 'new_file.py');
    if (!name || !name.trim()) return;

    const clean = name.trim();
    let lang = 'python';
    if (clean.endsWith('.js')) lang = 'javascript';
    else if (clean.endsWith('.html')) lang = 'html';
    else if (clean.endsWith('.css')) lang = 'css';
    else if (clean.endsWith('.sql')) lang = 'sql';
    else if (clean.endsWith('.c')) lang = 'c';
    else if (clean.endsWith('.cpp')) lang = 'cpp';
    else if (clean.endsWith('.java')) lang = 'java';

    state.openFiles.push({
      id: 'file-' + Date.now(),
      name: clean,
      language: lang,
      content: `// Source file: ${clean}\n`
    });
    switchFileTab(state.openFiles.length - 1);
  }

  btnNewFile?.addEventListener('click', addNewFilePrompt);
  btnAddFileTree?.addEventListener('click', addNewFilePrompt);

  // Add Folder Action
  btnAddFolderTree?.addEventListener('click', () => {
    const folderName = prompt('Enter new folder name (e.g. src, models, tests):', 'src');
    if (folderName && folderName.trim()) {
      const clean = folderName.trim();
      state.openFiles.push({
        id: 'file-' + Date.now(),
        name: `${clean}/index.js`,
        language: 'javascript',
        content: `// Module entry point for ${clean}\n`
      });
      switchFileTab(state.openFiles.length - 1);
    }
  });

  // Upload Local File
  btnUploadFileTree?.addEventListener('click', () => fileUploadInput?.click());
  fileUploadInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = loadEvent.target.result;
      state.openFiles.push({
        id: 'file-' + Date.now(),
        name: file.name,
        language: state.activeLanguage,
        content: typeof content === 'string' ? content : ''
      });
      switchFileTab(state.openFiles.length - 1);
      fileUploadInput.value = '';
    };
    reader.readAsText(file);
  });

  // Download Project as JSON Bundle
  btnDownloadProject?.addEventListener('click', downloadProjectBundle);
  btnShareProject?.addEventListener('click', downloadProjectBundle);

  function downloadProjectBundle() {
    const bundle = {
      projectTitle: state.projectTitle,
      exportedAt: new Date().toISOString(),
      platform: 'CBT Virtual Computer Science & Software Laboratory',
      files: state.openFiles
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Clear Code
  btnClearCode?.addEventListener('click', () => {
    if (confirm('Clear current editor contents?')) {
      if (codeEditorEl) codeEditorEl.value = '';
      if (state.openFiles[state.activeFileIndex]) {
        state.openFiles[state.activeFileIndex].content = '';
      }
      updateLineNumbers();
    }
  });

  // Format Code Beautifier
  btnFormatCode?.addEventListener('click', () => {
    const file = state.openFiles[state.activeFileIndex];
    if (!file || !codeEditorEl) return;

    let text = codeEditorEl.value;
    const lines = text.split('\n').map((l) => l.trimEnd());
    codeEditorEl.value = lines.join('\n');
    file.content = codeEditorEl.value;
    updateLineNumbers();
    alert('Code formatted successfully.');
  });

  // Fullscreen Toggle
  btnFullscreen?.addEventListener('click', () => {
    document.body.classList.toggle('fullscreen');
  });

  // =========================================================================
  // 6. Sandboxed Execution Engine (Real Isolated Worker)
  // =========================================================================
  btnRunCode?.addEventListener('click', executeCurrentCode);
  btnBuildCode?.addEventListener('click', executeCurrentCode);

  let isRunning = false;

  async function executeCurrentCode() {
    if (isRunning) return;
    const file = state.openFiles[state.activeFileIndex];
    if (!file) return;

    isRunning = true;
    if (btnRunCode) {
      btnRunCode.disabled = true;
      btnRunCode.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
    }

    switchDockTab('output');
    if (paneOutput) {
      paneOutput.innerHTML = '<span class="text-info"><i class="fa-solid fa-gear fa-spin"></i> Dispatching code to isolated worker sandbox...</span>';
    }
    if (paneErrors) {
      paneErrors.textContent = 'Diagnostics: Analyzing syntax and compilation bounds...';
    }

    try {
      if (file.name.endsWith('.html') || file.name.endsWith('.css') || file.language === 'html') {
        updateWebPreview();
        switchActiveMode('web-preview');
        if (paneOutput) {
          paneOutput.innerHTML = '<span class="text-success"><i class="fa-solid fa-check me-1"></i> HTML5 Application compiled into Live Sandboxed Browser Viewport.</span>';
        }
        return;
      }

      const res = await fetch('/api/cs/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: file.language || state.activeLanguage,
          files: state.openFiles,
          mainFile: file.name
        })
      });

      const data = await res.json();

      if (data.success) {
        if (paneOutput) {
          paneOutput.innerHTML = `${escapeHtml(data.stdout || '')}
<span class="text-success">--------------------------------------------------
Process exited with code ${data.exitCode}. Execution time: ${data.executionTimeMs}ms. Runtime: ${data.runtime || 'Sandbox'}.</span>`;
        }
        if (paneErrors) {
          paneErrors.innerHTML = '<span class="text-success">Compilation & Diagnostics: Clean. No errors detected.</span>';
        }
      } else {
        if (paneOutput) {
          paneOutput.innerHTML = `${escapeHtml(data.stdout || '')}
<span class="text-danger">--------------------------------------------------
Process exited with error code ${data.exitCode} (${data.executionTimeMs}ms).</span>`;
        }
        if (paneErrors) {
          paneErrors.innerHTML = `<span class="text-danger">${escapeHtml(data.stderr || 'Execution failed')}</span>`;
          switchDockTab('errors');
        }
      }
    } catch (err) {
      if (paneOutput) {
        paneOutput.innerHTML = `<span class="text-danger">Communication error with execution sandbox: ${escapeHtml(err.message)}</span>`;
      }
    } finally {
      isRunning = false;
      if (btnRunCode) {
        btnRunCode.disabled = false;
        btnRunCode.innerHTML = '<i class="fa-solid fa-play"></i> Run';
      }
    }
  }

  btnStopCode?.addEventListener('click', () => {
    if (isRunning) {
      isRunning = false;
      if (paneOutput) {
        paneOutput.innerHTML += '\n<span class="text-warning">[Execution cancelled by user]</span>';
      }
      if (btnRunCode) {
        btnRunCode.disabled = false;
        btnRunCode.innerHTML = '<i class="fa-solid fa-play"></i> Run';
      }
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 7. Built-in Web Browser Preview
  // =========================================================================
  function updateWebPreview() {
    if (!browserIframe) return;
    const htmlFile = state.openFiles.find((f) => f.name.endsWith('.html')) || state.openFiles[0];
    const cssFile = state.openFiles.find((f) => f.name.endsWith('.css'));
    const jsFiles = state.openFiles.filter((f) => f.name.endsWith('.js'));

    let doc = htmlFile ? htmlFile.content : '<h1>No HTML Source Found</h1>';

    const consoleInterceptor = `
      <script>
        (function() {
          const _log = console.log;
          const _err = console.error;
          console.log = function(...args) {
            _log.apply(console, args);
            window.parent.postMessage({ type: 'CS_LAB_BROWSER_LOG', level: 'info', msg: args.join(' ') }, '*');
          };
          console.error = function(...args) {
            _err.apply(console, args);
            window.parent.postMessage({ type: 'CS_LAB_BROWSER_LOG', level: 'error', msg: args.join(' ') }, '*');
          };
        })();
      </script>
    `;

    doc = doc.replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '');
    doc = doc.replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');
    const injectedHead = `${consoleInterceptor}${cssFile ? `<style>${cssFile.content}</style>` : ''}`;
    if (/<head(?:\s[^>]*)?>/i.test(doc)) {
      doc = doc.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}${injectedHead}`);
    } else {
      doc = `<!doctype html><html><head>${injectedHead}</head><body>${doc}</body></html>`;
    }
    const injectedScripts = jsFiles.map((file) => `<script>${file.content.replace(/<\/script/gi, '<\\/script')}</script>`).join('');
    if (/<\/body>/i.test(doc)) doc = doc.replace(/<\/body>/i, (bodyClose) => `${injectedScripts}${bodyClose}`);
    else doc += injectedScripts;

    browserIframe.srcdoc = doc;
  }

  browserReload?.addEventListener('click', updateWebPreview);

  document.querySelectorAll('.btn-vp-switch').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-vp-switch').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (browserIframe) {
        browserIframe.className = `cs-browser-frame ${btn.dataset.vp}`;
      }
    });
  });

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'CS_LAB_BROWSER_LOG') {
      const line = document.createElement('div');
      line.className = e.data.level === 'error' ? 'text-danger small' : 'text-info small';
      line.textContent = `[Browser Console] ${e.data.msg}`;
      terminalHistory?.appendChild(line);
    }
  });

  // =========================================================================
  // 8. Bottom Dock Tabs & Interactive Terminal
  // =========================================================================
  function switchDockTab(tab) {
    document.querySelectorAll('#csDockTabs [data-dock-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.dockTab === tab);
    });
    if (paneOutput) paneOutput.style.display = tab === 'output' ? 'block' : 'none';
    const paneConsole = document.getElementById('pane-dock-console');
    if (paneConsole) paneConsole.style.display = tab === 'console' ? 'block' : 'none';
    if (paneErrors) paneErrors.style.display = tab === 'errors' ? 'block' : 'none';
  }

  document.querySelectorAll('#csDockTabs [data-dock-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchDockTab(btn.dataset.dockTab));
  });

  btnClearDock?.addEventListener('click', () => {
    if (paneOutput) paneOutput.innerHTML = '<span class="text-muted">// Ready.</span>';
    if (terminalHistory) terminalHistory.innerHTML = '';
    if (paneErrors) paneErrors.innerHTML = '<span class="text-muted">No errors.</span>';
  });

  btnToggleDock?.addEventListener('click', () => {
    if (!bottomDockEl) return;
    const isCollapsed = bottomDockEl.style.height === '32px';
    bottomDockEl.style.height = isCollapsed ? '200px' : '32px';
    btnToggleDock.innerHTML = isCollapsed ? '<i class="fa-solid fa-chevron-down"></i>' : '<i class="fa-solid fa-chevron-up"></i>';
  });

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = terminalInput.value.trim();
        if (!cmd) return;
        terminalInput.value = '';

        state.terminalHistory.push(cmd);
        state.historyIndex = state.terminalHistory.length;

        const cmdLine = document.createElement('div');
        cmdLine.innerHTML = `<span class="text-success">$</span> ${escapeHtml(cmd)}`;
        terminalHistory.appendChild(cmdLine);

        const out = document.createElement('div');
        out.className = 'text-muted mb-1 small';

        const parts = cmd.split(' ');
        const main = parts[0].toLowerCase();

        if (main === 'ls' || main === 'dir') {
          out.textContent = state.openFiles.map((f) => f.name).join('   ');
        } else if (main === 'cat' && parts[1]) {
          const target = state.openFiles.find((f) => f.name === parts[1]);
          out.textContent = target ? target.content : `cat: ${parts[1]}: No such file`;
        } else if (main === 'python' && parts[1] === '--version') {
          out.textContent = 'Python 3.12.12 (Isolated Worker Runtime)';
        } else if (main === 'gcc' && parts[1] === '--version') {
          out.textContent = 'gcc (Rev8, Built by MSYS2 project) 15.2.0';
        } else if (main === 'node' && (parts[1] === '-v' || parts[1] === '--version')) {
          out.textContent = 'v24.14.0';
        } else if (main === 'java' && (parts[1] === '-version' || parts[1] === '--version')) {
          out.textContent = 'openjdk version "21.0.12.1" 2026-08-18 LTS';
        } else if (main === 'run' || main === 'execute') {
          executeCurrentCode();
          out.textContent = 'Executing current project file...';
        } else if (main === 'clear' || main === 'cls') {
          terminalHistory.innerHTML = '';
          return;
        } else if (main === 'whoami') {
          out.textContent = 'cbt-student (isolated-sandbox)';
        } else if (main === 'pwd') {
          out.textContent = '/home/student/workspace/' + state.projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
        } else if (main === 'date') {
          out.textContent = new Date().toUTCString();
        } else if (main === 'help') {
          out.textContent = 'Commands: ls, cat <file>, run, clear, whoami, pwd, date, python --version, gcc --version, node -v, java -version';
        } else {
          out.textContent = `Command executed: ${cmd} (exit status: 0)`;
        }

        terminalHistory.appendChild(out);
        terminalHistory.scrollTop = terminalHistory.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          terminalInput.value = state.terminalHistory[state.historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        if (state.historyIndex < state.terminalHistory.length - 1) {
          state.historyIndex++;
          terminalInput.value = state.terminalHistory[state.historyIndex] || '';
        } else {
          state.historyIndex = state.terminalHistory.length;
          terminalInput.value = '';
        }
      }
    });
  }

  // =========================================================================
  // 9. Relational Database & SQL Laboratory
  // =========================================================================
  const btnExecuteSql = document.getElementById('btn-execute-sql');
  const sqlInputEl = document.getElementById('cs-sql-input');
  const sqlResultTable = document.getElementById('cs-sql-result-table');

  btnExecuteSql?.addEventListener('click', async () => {
    const q = sqlInputEl ? sqlInputEl.value.trim() : '';
    if (!q) return;

    try {
      const res = await fetch('/api/cs/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'sql', files: [{ name: 'query.sql', language: 'sql', content: q }] })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (sqlResultTable) {
          sqlResultTable.textContent = data.stderr || data.error || 'SQL execution failed.';
          sqlResultTable.className = 'text-danger small font-monospace';
        }
        return;
      }

      if (sqlResultTable) {
        const result = JSON.parse(data.stdout);
        const message = document.createElement('p');
        message.className = 'text-muted mb-2';
        message.textContent = `${result.message} ${result.rowCount} row(s) returned.`;
        sqlResultTable.replaceChildren(message);
        if (result.columns.length) {
          const table = document.createElement('table');
          table.className = 'table table-sm table-striped table-bordered mb-0';
          const thead = table.createTHead();
          const heading = thead.insertRow();
          result.columns.forEach((column) => {
            const cell = document.createElement('th');
            cell.scope = 'col';
            cell.textContent = column;
            heading.appendChild(cell);
          });
          const tbody = table.createTBody();
          result.rows.forEach((row) => {
            const tr = tbody.insertRow();
            row.forEach((value) => {
              tr.insertCell().textContent = value === null ? 'NULL' : String(value);
            });
          });
          sqlResultTable.appendChild(table);
        }
        sqlResultTable.className = 'table-responsive small';
      }
    } catch (err) {
      if (sqlResultTable) {
        sqlResultTable.textContent = `SQL execution failed: ${err.message}`;
        sqlResultTable.className = 'text-danger small font-monospace';
      }
    }
  });

  // =========================================================================
  // 10. Networks & Cybersecurity Lab
  // =========================================================================
  function drawNetworkTopology(packetX = null, packetLost = false) {
    const nCanvas = document.getElementById('canvas-network-topology');
    if (!nCanvas) return;
    const nctx = nCanvas.getContext('2d');
    const nw = nCanvas.width;
    const nh = nCanvas.height;

    nctx.fillStyle = '#F8FAFC';
    nctx.fillRect(0, 0, nw, nh);

    const nodes = [
      { name: 'PC-A (192.168.1.10)', x: 70, y: 130, color: '#1E40AF', icon: '💻' },
      { name: 'Switch-1', x: 200, y: 130, color: '#10B981', icon: '🔀' },
      { name: 'Router-GW (192.168.1.1)', x: 330, y: 130, color: '#F59E0B', icon: '🌐' },
      { name: 'Web Server (10.0.0.50)', x: 440, y: 130, color: '#EF4444', icon: '🖥️' }
    ];

    nctx.strokeStyle = '#94A3B8';
    nctx.lineWidth = 3;
    for (let i = 0; i < nodes.length - 1; i++) {
      nctx.beginPath();
      nctx.moveTo(nodes[i].x, nodes[i].y);
      nctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
      nctx.stroke();
    }

    nodes.forEach((n) => {
      nctx.fillStyle = '#FFFFFF';
      nctx.strokeStyle = n.color;
      nctx.lineWidth = 2;
      nctx.beginPath();
      nctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
      nctx.fill();
      nctx.stroke();

      nctx.font = '16px sans-serif';
      nctx.textAlign = 'center';
      nctx.fillText(n.icon, n.x, n.y + 6);

      nctx.font = 'bold 10px Inter, sans-serif';
      nctx.fillStyle = '#0F172A';
      nctx.fillText(n.name, n.x, n.y + 36);
    });

    if (Number.isFinite(packetX)) {
      nctx.beginPath();
      nctx.arc(packetX, 130, 8, 0, Math.PI * 2);
      nctx.fillStyle = packetLost ? '#dc2626' : '#7c3aed';
      nctx.shadowColor = nctx.fillStyle;
      nctx.shadowBlur = 12;
      nctx.fill();
      nctx.shadowBlur = 0;
    }
  }

  const pingButton = document.getElementById('btn-net-ping');
  const pingOutput = document.getElementById('cs-ping-result');
  const latencyControl = document.getElementById('cs-net-latency');
  const lossControl = document.getElementById('cs-net-loss');
  const latencyLabel = document.getElementById('cs-net-latency-value');
  const lossLabel = document.getElementById('cs-net-loss-value');
  latencyControl?.addEventListener('input', () => {
    if (latencyLabel) latencyLabel.textContent = `${latencyControl.value} ms`;
  });
  lossControl?.addEventListener('input', () => {
    if (lossLabel) lossLabel.textContent = `${lossControl.value}%`;
  });

  function animatePingPacket(lost) {
    return new Promise((resolve) => {
      const startedAt = performance.now();
      const duration = 620;
      function frame(now) {
        const progress = Math.min(1, (now - startedAt) / duration);
        const tripProgress = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        drawNetworkTopology(70 + tripProgress * 370, lost && progress > 0.42);
        if (progress < 1) requestAnimationFrame(frame);
        else {
          drawNetworkTopology();
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  pingButton?.addEventListener('click', async () => {
    if (!pingOutput || pingButton.disabled) return;
    pingButton.disabled = true;
    const latency = Number(latencyControl?.value || 24);
    const lossRate = Number(lossControl?.value || 0);
    const results = [];
    pingOutput.textContent = 'Starting four echo requests…';
    for (let sequence = 1; sequence <= 4; sequence += 1) {
      const lost = Math.random() * 100 < lossRate;
      await animatePingPacket(lost);
      if (lost) results.push(`Request timed out (icmp_seq=${sequence})`);
      else results.push(`64 bytes from 10.0.0.50: icmp_seq=${sequence} ttl=64 time=${latency * 2 + Math.round(Math.random() * 8)} ms`);
      pingOutput.textContent = results.join('\n');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const received = results.filter((line) => line.startsWith('64 bytes')).length;
    const times = results.map((line) => line.match(/time=(\d+)/)).filter(Boolean).map((match) => Number(match[1]));
    const average = times.length ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : null;
    pingOutput.textContent += `\n--- Simulation summary ---\n4 packets transmitted, ${received} received, ${((4 - received) / 4 * 100).toFixed(0)}% loss${average == null ? '' : `, avg RTT ${average} ms`}`;
    pingButton.disabled = false;
  });

  const entropyInput = document.getElementById('cs-entropy-input');
  if (entropyInput) {
    entropyInput.addEventListener('input', (e) => {
      const pwd = e.target.value;
      const readout = document.getElementById('cs-entropy-readout');
      const bar = document.getElementById('bar-entropy-meter');
      if (!pwd) {
        if (bar) bar.style.width = '0%';
        if (readout) readout.textContent = 'Enter a sample password. This is a rough search-space estimate, not a password audit.';
        return;
      }
      const len = pwd.length;
      let pool = 0;
      if (/[a-z]/.test(pwd)) pool += 26;
      if (/[A-Z]/.test(pwd)) pool += 26;
      if (/[0-9]/.test(pwd)) pool += 10;
      if (/[^a-zA-Z0-9]/.test(pwd)) pool += 33;
      const entropy = pool > 0 ? (len * Math.log2(pool)).toFixed(1) : 0;

      const repeatedPenalty = /(.)\1{2,}/.test(pwd) ? 18 : 0;
      const sequencePenalty = /(?:1234|abcd|qwerty|password)/i.test(pwd) ? 20 : 0;
      const estimate = Math.max(0, Number(entropy) - repeatedPenalty - sequencePenalty);
      if (bar) {
        bar.style.width = `${Math.min(100, estimate)}%`;
        bar.className = estimate > 60 ? 'progress-bar bg-success' : estimate > 40 ? 'progress-bar bg-warning' : 'progress-bar bg-danger';
      }
      if (readout) {
        readout.textContent = `Estimated search space: ${estimate.toFixed(1)} bits${repeatedPenalty || sequencePenalty ? ' (repeated or common sequence penalty applied)' : ''}. Keep passwords unique and use a password manager.`;
      }
    });
  }

  const hashInput = document.getElementById('cs-hash-input');
  const hashOutput = document.getElementById('cs-hash-output');
  hashInput?.addEventListener('input', () => {
    if (hashOutput && typeof window.sha256Hex === 'function') hashOutput.value = window.sha256Hex(hashInput.value);
  });

  // =========================================================================
  // 11. Three.js 3D Computer Hardware Assembly
  // =========================================================================
  function init3DHardwareViewport() {
    if (state.hardwareLab) return;
    if (typeof window.HardwareLabEngine !== 'undefined') {
      state.hardwareLab = window.HardwareLabEngine.create('cs-3d-canvas-container');
      return;
    }
    const status = document.getElementById('hardware-stage-status');
    if (status) status.textContent = 'The 3D hardware engine did not load. Reload the lab and check the browser console for errors.';
  }

  // =========================================================================
  // 12. CBT Practical Question Grader
  // =========================================================================
  document.getElementById('btn-submit-cbt-q1')?.addEventListener('click', async () => {
    const code = document.getElementById('cbt-q1-code')?.value;
    const resultEl = document.getElementById('cbt-q1-result');
    const submitButton = document.getElementById('btn-submit-cbt-q1');
    if (!code || !code.trim() || !resultEl) return;
    submitButton.disabled = true;
    resultEl.textContent = 'Running your submission against six test cases in the isolated Python sandbox...';

    try {
      const testHarness = `
import json as _cs_json
_cs_cases = [(0, 0), (1, 1), (2, 1), (10, 55), (50, 12586269025), (100, 354224848179261915075)]
_cs_failures = []
for _cs_n, _cs_expected in _cs_cases:
    try:
        _cs_actual = fibonacci(_cs_n)
        if _cs_actual != _cs_expected:
            _cs_failures.append({"input": _cs_n, "expected": str(_cs_expected), "actual": str(_cs_actual)})
    except Exception as _cs_error:
        _cs_failures.append({"input": _cs_n, "error": str(_cs_error)})
print("CS_LAB_TEST_RESULTS=" + _cs_json.dumps({"passed": len(_cs_cases) - len(_cs_failures), "total": len(_cs_cases), "failures": _cs_failures}))
`;
      const res = await fetch('/api/cs/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          files: [{ name: 'main.py', language: 'python', content: `${code}\n${testHarness}` }],
          mainFile: 'main.py'
        })
      });
      const data = await res.json();
      const match = typeof data.stdout === 'string' && data.stdout.match(/CS_LAB_TEST_RESULTS=(\{[^\r\n]+\})/);
      if (!res.ok || !data.success || !match) {
        const error = data.stderr || data.error || 'The submission did not produce valid test results.';
        resultEl.className = 'alert alert-danger py-2 mb-0';
        resultEl.textContent = `Execution failed${data.timedOut ? ' (time limit exceeded)' : ''}: ${error}`;
        return;
      }
      const testResult = JSON.parse(match[1]);
      const score = Math.round((testResult.passed / testResult.total) * 100);
      resultEl.className = `alert ${score === 100 ? 'alert-success' : 'alert-warning'} py-2 mb-0`;
      resultEl.textContent = `${testResult.passed}/${testResult.total} tests passed · Score ${score}/100` +
        (testResult.failures.length ? ` · Failures: ${testResult.failures.map((failure) => `n=${failure.input}: ${failure.error || `expected ${failure.expected}, got ${failure.actual}`}`).join('; ')}` : '');
    } catch (err) {
      resultEl.className = 'alert alert-danger py-2 mb-0';
      resultEl.textContent = `Assessment request failed: ${err.message}`;
    } finally {
      submitButton.disabled = false;
    }
  });

  // =========================================================================
  // 13. Save Project to Repository
  // =========================================================================
  btnSaveProject?.addEventListener('click', async () => {
    const title = prompt('Enter a project title:', state.projectTitle);
    if (!title || !title.trim()) return;

    state.projectTitle = title.trim();
    if (projectNameBadge) projectNameBadge.textContent = state.projectTitle;

    try {
      const res = await fetch('/api/cs/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: state.projectId,
          title: state.projectTitle,
          module_code: state.activeModule ? state.activeModule.code : 'programming-ide',
          project_type: state.activeLanguage,
          files: state.openFiles,
          environment_config: { runtime: state.activeLanguage }
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.project_id) state.projectId = data.project_id;
        alert('Project saved successfully to CBT repository!');
      } else {
        alert(data.error || 'Failed to save project.');
      }
    } catch (err) {
      alert('Network error saving project.');
    }
  });

  // =========================================================================
  // 14. Bulletproof Template Application & Modal Management
  // =========================================================================
  function applyTemplate(tmpl) {
    if (!tmpl || !tmpl.files || !tmpl.files.length) return;

    // 1. Safely hide modal and clear lingering backdrops
    const modalEl = document.getElementById('modal-cs-templates');
    if (modalEl) {
      try {
        const inst = bootstrap.Modal.getOrCreateInstance(modalEl);
        inst.hide();
      } catch (_) {}
      setTimeout(() => {
        document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
      }, 150);
    }

    // 2. Load template files into workspace
    state.openFiles = tmpl.files.map((f, i) => ({
      ...f,
      id: 'file-' + (i + 1),
      language: f.language || tmpl.lang
    }));
    state.activeFileIndex = 0;
    state.projectTitle = tmpl.title;
    state.activeLanguage = tmpl.lang;
    state.projectId = null;
    if (tmpl.id === 'tmpl_practical_fibonacci') {
      const assessmentEditor = document.getElementById('cbt-q1-code');
      if (assessmentEditor) assessmentEditor.value = tmpl.files[0].content;
    }

    if (projectNameBadge) projectNameBadge.textContent = tmpl.title;
    if (selectLanguage) selectLanguage.value = tmpl.lang;
    if (tmpl.lang === 'sql' && sqlInputEl) sqlInputEl.value = tmpl.files[0].content;

    const moduleCode = tmpl.moduleCode || Object.keys(MODULE_TEMPLATE_IDS).find((code) => MODULE_TEMPLATE_IDS[code] === tmpl.id);
    const moduleItem = state.modules.find((item) => item.code === moduleCode);
    if (moduleItem) {
      state.activeModule = moduleItem;
      if (inspectorTitleEl) inspectorTitleEl.innerHTML = `<i class="fa-solid ${moduleItem.icon || 'fa-code'} text-primary me-2"></i> ${moduleItem.title}`;
      if (inspectorSubtitleEl) inspectorSubtitleEl.textContent = `${moduleItem.branch} • ${moduleItem.category}`;
      renderModuleConcepts(moduleItem);
      document.querySelectorAll('.cs-topic-item').forEach((el) => el.classList.toggle('active', el.dataset.code === moduleItem.code));
    }

    switchFileTab(0);

    // 3. Auto-switch mode based on template type
    if (tmpl.id === 'tmpl_practical_fibonacci') {
      switchActiveMode('cbt-practical');
    } else if (tmpl.lang === 'html') {
      switchActiveMode('web-preview');
    } else if (tmpl.lang === 'sql') {
      switchActiveMode('database-sql');
    } else {
      switchActiveMode('ide-editor');
    }

    // Notify dock
    if (paneOutput) {
      paneOutput.innerHTML = `<span class="text-success"><i class="fa-solid fa-check-circle me-1"></i> Loaded "${tmpl.title}" template with ${tmpl.files.length} source file(s). Ready to edit and run!</span>`;
    }
  }

  function populateTemplatesModal() {
    const grid = document.getElementById('cs-templates-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CS_TEMPLATES.forEach((tmpl) => {
      const moduleCode = tmpl.moduleCode || Object.keys(MODULE_TEMPLATE_IDS).find((code) => MODULE_TEMPLATE_IDS[code] === tmpl.id);
      const moduleTitle = state.modules.find((item) => item.code === moduleCode)?.title || 'Programming tools';
      const col = document.createElement('div');
      col.className = 'col-md-4 col-sm-6';
      col.innerHTML = `
        <div class="card h-100 border shadow-sm cs-template-card" data-id="${tmpl.id}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="p-2 rounded bg-primary-subtle text-primary">
                <i class="fa-solid ${tmpl.icon}"></i>
              </div>
              <div class="overflow-hidden">
                <h6 class="card-title fw-bold mb-0 text-truncate" title="${tmpl.title}">${tmpl.title}</h6>
                <small class="text-muted">${moduleTitle}</small>
              </div>
            </div>
            <p class="card-text small text-muted mb-3 flex-grow-1">${tmpl.desc}</p>
            <button class="btn btn-sm btn-primary w-100 btn-apply-tmpl" data-id="${tmpl.id}">
              <i class="fa-solid fa-play me-1"></i> Launch Template
            </button>
          </div>
        </div>
      `;

      // Allow clicking the card or the button
      col.querySelector('.cs-template-card').addEventListener('click', () => applyTemplate(tmpl));
      grid.appendChild(col);
    });
  }

  if (selectQuickTemplate) {
    selectQuickTemplate.innerHTML = '<option value="">-- Quick Template --</option>';
    CS_TEMPLATES.forEach((tmpl) => {
      const option = document.createElement('option');
      option.value = tmpl.id;
      option.textContent = tmpl.title;
      selectQuickTemplate.appendChild(option);
    });
  }

  // Quick template select dropdown in top navbar
  selectQuickTemplate?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    const tmpl = CS_TEMPLATES.find((t) => t.id === val);
    if (tmpl) {
      applyTemplate(tmpl);
      e.target.value = '';
    }
  });

  // Saved Projects Modal Population
  const modalProjects = document.getElementById('modal-cs-projects');
  modalProjects?.addEventListener('show.bs.modal', async () => {
    const listEl = document.getElementById('cs-saved-projects-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="text-center text-muted py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i> Loading saved projects...</div>';

    try {
      const res = await fetch('/api/cs/projects');
      const data = await res.json();
      if (!data.success || !data.projects || data.projects.length === 0) {
        listEl.innerHTML = '<div class="text-center text-muted py-3">No saved projects found. Click "Save" in the top bar to create one.</div>';
        return;
      }

      listEl.innerHTML = '';
      data.projects.forEach((proj) => {
        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.innerHTML = `
          <div>
            <h6 class="mb-1 fw-bold text-primary">${escapeHtml(proj.title)}</h6>
            <small class="text-muted">${proj.module_code} • ${new Date(proj.updated_at).toLocaleString()}</small>
          </div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-primary load-proj-btn"><i class="fa-solid fa-folder-open me-1"></i> Open</button>
            <button class="btn btn-outline-danger del-proj-btn"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;

        item.querySelector('.load-proj-btn').addEventListener('click', async () => {
          const detailRes = await fetch(`/api/cs/projects/${proj.id}`);
          const detailData = await detailRes.json();
          if (detailData.success && detailData.project) {
            state.projectId = detailData.project.id;
            state.projectTitle = detailData.project.title;
            if (projectNameBadge) projectNameBadge.textContent = state.projectTitle;
            if (Array.isArray(detailData.project.files) && detailData.project.files.length > 0) {
              state.openFiles = detailData.project.files;
              switchFileTab(0);
            }
            bootstrap.Modal.getOrCreateInstance(modalProjects)?.hide();
            setTimeout(() => {
              document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
              document.body.classList.remove('modal-open');
            }, 150);
          }
        });

        item.querySelector('.del-proj-btn').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Delete project "${proj.title}"?`)) {
            await fetch(`/api/cs/projects/${proj.id}`, { method: 'DELETE' });
            item.remove();
          }
        });

        listEl.appendChild(item);
      });
    } catch (err) {
      listEl.innerHTML = '<div class="alert alert-danger py-2">Failed to load projects.</div>';
    }
  });

  // =========================================================================
  // 15. Tutor Lab Notes & Live Instruction Blackboard
  // =========================================================================
  const STORAGE_NOTES_KEY = 'cs_lab_tutor_notes';

  // Load persisted notes
  if (tutorNotesInput) {
    const savedNotes = localStorage.getItem(STORAGE_NOTES_KEY);
    if (savedNotes) {
      tutorNotesInput.value = savedNotes;
    }

    tutorNotesInput.addEventListener('input', () => {
      localStorage.setItem(STORAGE_NOTES_KEY, tutorNotesInput.value);
      if (tutorNotesStatus) {
        tutorNotesStatus.innerHTML = `<i class="fa-solid fa-check text-success me-1"></i> Auto-saved at ${new Date().toLocaleTimeString()}`;
      }
    });
  }

  // Toggle Notes Tab from Top Bar
  btnToggleNotes?.addEventListener('click', () => {
    const notesTabBtn = document.getElementById('tab-cs-notes-btn');
    if (notesTabBtn) {
      const tab = new bootstrap.Tab(notesTabBtn);
      tab.show();
      tutorNotesInput?.focus();
    }
  });

  // Insert Notes into Code Editor
  btnNotesCopyEditor?.addEventListener('click', () => {
    if (!tutorNotesInput || !tutorNotesInput.value.trim()) {
      alert('Please write some notes first.');
      return;
    }
    const noteText = tutorNotesInput.value.trim();
    const commentPrefix = state.activeLanguage === 'python' ? '# ' : '// ';
    const formattedComment = noteText.split('\n').map((l) => commentPrefix + l).join('\n');
    if (codeEditorEl) {
      codeEditorEl.value += `${codeEditorEl.value ? '\n' : ''}${formattedComment}\n`;
      codeEditorEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  btnNotesBroadcast?.addEventListener('click', async () => {
    const note = tutorNotesInput?.value.trim();
    if (!note) {
      if (tutorNotesStatus) tutorNotesStatus.textContent = 'Write a note before sending it to the class.';
      return;
    }
    if (!window.CBTLabLive) {
      if (tutorNotesStatus) tutorNotesStatus.textContent = 'Live classroom messaging is unavailable.';
      return;
    }
    if (tutorNotesStatus) tutorNotesStatus.textContent = 'Sending note to the classroom…';
    const result = await window.CBTLabLive.broadcast(note);
    if (tutorNotesStatus) tutorNotesStatus.textContent = result.ok
      ? 'Live note delivered to the connected classroom.'
      : `Could not send live note: ${result.error}`;
  });

  // Export Notes as Markdown file
  btnNotesExport?.addEventListener('click', () => {
    if (!tutorNotesInput || !tutorNotesInput.value.trim()) {
      alert('Notes are empty.');
      return;
    }
    const blob = new Blob([tutorNotesInput.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CS_Lab_Notes_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Clear Notes
  btnClearNotes?.addEventListener('click', () => {
    if (confirm('Clear all tutor lab notes?')) {
      if (tutorNotesInput) tutorNotesInput.value = '';
      localStorage.removeItem(STORAGE_NOTES_KEY);
      if (tutorNotesStatus) {
        tutorNotesStatus.innerHTML = '<span class="text-muted">Cleared</span>';
      }
    }
  });

  // Quick Note Stencils
  document.querySelectorAll('.btn-note-stencil').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.stencil;
      let text = '';
      if (type === 'agenda') {
        text = `## Lab Session Objectives & Agenda\n1. Review Time Complexity: O(1) vs O(log n) vs O(n)\n2. Implement Binary Search recursive algorithm\n3. Conduct unit testing across edge cases\n4. Submit solutions for auto-grading\n\n`;
      } else if (type === 'pseudocode') {
        text = `ALGORITHM BinarySearch(A[0..N-1], target):\n  low <- 0\n  high <- N - 1\n  WHILE low <= high DO\n    mid <- (low + high) / 2\n    IF A[mid] == target THEN RETURN mid\n    ELSE IF A[mid] < target THEN low <- mid + 1\n    ELSE high <- mid - 1\n  RETURN -1\n\n`;
      } else if (type === 'task') {
        text = `### Challenge Practice Exercise:\nModify the search algorithm to return the FIRST occurrence of the target in a list that contains duplicate elements.\nConstraint: Must remain strictly O(log n) time complexity.\n\n`;
      } else if (type === 'bigo') {
        text = `### Asymptotic Complexity Reference:\n- Constant: O(1) -> Array lookup by index\n- Logarithmic: O(log n) -> Binary search, balanced BST\n- Linear: O(n) -> Linear scan, counting sort\n- Linearithmic: O(n log n) -> Merge Sort, Quick Sort (avg)\n- Quadratic: O(n^2) -> Bubble Sort, Nested loops\n\n`;
      }
      if (tutorNotesInput) {
        tutorNotesInput.value += text;
        localStorage.setItem(STORAGE_NOTES_KEY, tutorNotesInput.value);
        if (tutorNotesStatus) {
          tutorNotesStatus.innerHTML = `<i class="fa-solid fa-check text-success me-1"></i> Stencil inserted`;
        }
      }
    });
  });

  // =========================================================================
  // 16. Tutor Live Screen Sharing Engine (Screen / Window / Tab)
  // =========================================================================
  btnShareScreen?.addEventListener('click', toggleScreenSharing);
  btnScreenStop?.addEventListener('click', stopScreenSharing);

  async function toggleScreenSharing() {
    if (state.isScreenSharing) {
      stopScreenSharing();
    } else {
      await startScreenSharing();
    }
  }

  async function startScreenSharing() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('Screen sharing is not supported in this browser environment. Please use modern Chrome, Edge, or Firefox.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      state.screenStream = stream;
      state.isScreenSharing = true;

      // Update button state
      if (btnShareScreen) {
        btnShareScreen.classList.remove('btn-danger');
        btnShareScreen.classList.add('btn-warning');
        btnShareScreen.innerHTML = '<i class="fa-solid fa-stop me-1"></i> Stop Sharing';
      }

      // Display floating presenter HUD
      if (screenShareHud && screenShareVideo) {
        screenShareVideo.srcObject = stream;
        screenShareHud.style.display = 'flex';
      }

      // Handle user stopping share via native browser UI bar
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing();
      };

      // Notify bottom dock
      if (paneOutput) {
        paneOutput.innerHTML += '\n<span class="text-success"><i class="fa-solid fa-display me-1"></i> [Tutor Screen Sharing Active] Live screen/window broadcast initiated.</span>';
      }
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        alert('Failed to start screen share: ' + err.message);
      }
      state.isScreenSharing = false;
    }
  }

  function stopScreenSharing() {
    if (state.screenStream) {
      state.screenStream.getTracks().forEach((track) => track.stop());
      state.screenStream = null;
    }
    state.isScreenSharing = false;

    if (btnShareScreen) {
      btnShareScreen.classList.remove('btn-warning');
      btnShareScreen.classList.add('btn-danger');
      btnShareScreen.innerHTML = '<i class="fa-solid fa-display me-1"></i> Share Screen';
    }

    if (screenShareHud) {
      screenShareHud.style.display = 'none';
    }
    if (screenShareVideo) {
      screenShareVideo.srcObject = null;
    }

    if (paneOutput) {
      paneOutput.innerHTML += '\n<span class="text-muted"><i class="fa-solid fa-circle-stop me-1"></i> Screen sharing session ended.</span>';
    }
  }

  // Picture in Picture for Screen Share
  btnScreenPip?.addEventListener('click', async () => {
    if (screenShareVideo && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await screenShareVideo.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('PiP error:', err);
      }
    }
  });

  // Fullscreen for Screen Share
  btnScreenFs?.addEventListener('click', () => {
    if (screenShareVideo) {
      if (screenShareVideo.requestFullscreen) screenShareVideo.requestFullscreen();
      else if (screenShareVideo.webkitRequestFullscreen) screenShareVideo.webkitRequestFullscreen();
    }
  });

  // =========================================================================
  // Initialize Workbench
  // =========================================================================
  initResizers();
  loadCurriculumModules();
  populateTemplatesModal();
  updateTabsBar();
});
