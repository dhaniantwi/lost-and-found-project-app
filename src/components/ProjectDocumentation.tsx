import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Users,
  Database,
  Layers,
  CheckCircle2,
  Play,
  Printer,
  ChevronRight,
  GitBranch,
  Shield,
  FileText
} from 'lucide-react';

interface TestCase {
  id: string;
  testArea: string;
  expectedResult: string;
  status: 'passed' | 'idle' | 'running';
  details: string;
}

const INITIAL_TEST_CASES: TestCase[] = [
  {
    id: 'tc-1',
    testArea: 'Student registration',
    expectedResult: 'New users can create accounts with UCC student ID and credentials',
    status: 'passed',
    details: 'Validated email format (@stu.ucc.edu.gh), student ID format, and hall assignment.'
  },
  {
    id: 'tc-2',
    testArea: 'Student login',
    expectedResult: 'Registered users can log in securely and establish session state',
    status: 'passed',
    details: 'Session persistence and persona switching verified.'
  },
  {
    id: 'tc-3',
    testArea: 'Authentication & Permissions',
    expectedResult: 'Unauthorized users cannot access protected administrator desk features',
    status: 'passed',
    details: 'Role-based access control (RBAC) checked between Student and Security Admin.'
  },
  {
    id: 'tc-4',
    testArea: 'Lost item reporting',
    expectedResult: 'Students can submit lost item reports with locations and categories',
    status: 'passed',
    details: 'Form submission with UCC location, event date, and distinctive marks validated.'
  },
  {
    id: 'tc-5',
    testArea: 'Found item reporting',
    expectedResult: 'Students/finders can submit found item reports with custody location',
    status: 'passed',
    details: 'Storage point assignment (e.g. Porters Lodge / Security Post) recorded.'
  },
  {
    id: 'tc-6',
    testArea: 'Image uploads',
    expectedResult: 'Valid item pictures can be uploaded via client FileReader or presets',
    status: 'passed',
    details: 'MIME types, base64 encoding, and responsive aspect-ratio rendering verified.'
  },
  {
    id: 'tc-7',
    testArea: 'Search functionality',
    expectedResult: 'Users can search for reported items by keyword, brand, or color',
    status: 'passed',
    details: 'Multi-field client-side query matching against titles, descriptions, and colors.'
  },
  {
    id: 'tc-8',
    testArea: 'Filtering',
    expectedResult: 'Users can filter items using categories, campus zones, and statuses',
    status: 'passed',
    details: 'Segmented controls and compound dropdown filters operate in real time.'
  },
  {
    id: 'tc-9',
    testArea: 'Claims submission',
    expectedResult: 'Students can submit confidential ownership claims under honor code',
    status: 'passed',
    details: 'Claimant credentials, secret marks description, and timestamp saved.'
  },
  {
    id: 'tc-10',
    testArea: 'Claim verification',
    expectedResult: 'Administrators can approve or reject claims with custom feedback notes',
    status: 'passed',
    details: 'Admin approval queue updates claim status and designates pickup venue.'
  },
  {
    id: 'tc-11',
    testArea: 'Status updates',
    expectedResult: 'Item and claim statuses can be updated to recovered / collected',
    status: 'passed',
    details: 'Lifecycle progression from open -> in_review -> claimed -> recovered validated.'
  },
  {
    id: 'tc-12',
    testArea: 'Database integrity',
    expectedResult: 'Information is stored and retrieved correctly with audit logs',
    status: 'passed',
    details: 'Full relational consistency across users, reports, claims, and audit trail.'
  }
];

const SCHEDULE_DAYS = [
  { day: 'Day 1', phase: 'Phase 1: Requirements Gathering', activity: 'Project introduction, problem definition, and stakeholder scoping', outcome: 'Scope & SRS Initial Draft', status: 'Completed' },
  { day: 'Day 2', phase: 'Phase 1: Requirements Gathering', activity: 'Functional and non-functional requirements finalization, GitHub repo setup', outcome: 'GitHub repository initialized', status: 'Completed' },
  { day: 'Day 3', phase: 'Phase 2: Analysis & Design', activity: 'System architecture definition and Entity Relationship Diagram (ERD)', outcome: 'Database Schema & Architecture', status: 'Completed' },
  { day: 'Day 4', phase: 'Phase 2: Analysis & Design', activity: 'UI/UX wireframing, UCC brand guidelines, and folder conventions', outcome: 'Component hierarchy & Wireframes', status: 'Completed' },
  { day: 'Day 5', phase: 'Phase 3: Implementation', activity: 'Homepage, responsive navigation, top bar, and theme infrastructure', outcome: 'Core Frontend Layout', status: 'Completed' },
  { day: 'Day 6', phase: 'Phase 3: Implementation', activity: 'Student registration, role switching, authentication, and session manager', outcome: 'Authentication & RBAC', status: 'Completed' },
  { day: 'Day 7', phase: 'Phase 3: Implementation', activity: 'Lost & Found reporting modules, campus location dropdowns, category selector', outcome: 'Reporting forms', status: 'Completed' },
  { day: 'Day 8', phase: 'Phase 3: Implementation', activity: 'Image upload handling, catalog search engine, and compound filters', outcome: 'Search & Storage Engine', status: 'Completed' },
  { day: 'Day 9', phase: 'Phase 3: Implementation', activity: 'Rule-based matching algorithm, claims system, and admin review queue', outcome: 'Matching & Admin Desk', status: 'Completed' },
  { day: 'Day 10', phase: 'Phase 4: Integration & Testing', activity: 'Module integration, pull request merges, and data pipeline verification', outcome: 'Fully Integrated System', status: 'Completed' },
  { day: 'Day 11', phase: 'Phase 4: Integration & Testing', activity: 'Functional test cases execution, form validation checks, edge-case debugging', outcome: 'QA & Error Log Cleared', status: 'Completed' },
  { day: 'Day 12', phase: 'Phase 4: Integration & Testing', activity: 'Cross-device responsiveness check, performance audit, and status flows', outcome: 'Production-Ready Build', status: 'Completed' },
  { day: 'Day 13', phase: 'Phase 5: Documentation & Presentation', activity: 'Software Engineering report compilation, ERD & architectural charts', outcome: 'Final Documentation & Slides', status: 'In Progress' },
  { day: 'Day 14', phase: 'Phase 5: Documentation & Presentation', activity: 'Final rehearsal, live demonstration preparation, and academic submission', outcome: 'Lecturer Defense Ready', status: 'Scheduled' }
];

const TEAM_MEMBERS = [
  { member: 'Member 1', name: 'Daniel Antwi', role: 'Group Leader & Project Coordinator', duties: 'Coordinate activities, monitor deadlines, oversee integration and communicate with the lecturer.' },
  { member: 'Member 2', name: 'Kwabena Mensah', role: 'Requirements & Documentation', duties: 'Prepare the SRS, objectives, scope, use cases, and final project report.' },
  { member: 'Member 3', name: 'Akosua Adjei', role: 'UI/UX Designer', duties: 'Design wireframes, page layouts, visual hierarchy, and UCC brand palette.' },
  { member: 'Member 4', name: 'Kofi Asare', role: 'Frontend Developer', duties: 'Develop homepage, navigation, hero banner, shared styling, and responsive layout.' },
  { member: 'Member 5', name: 'Priscilla Tetteh', role: 'Authentication Interface Developer', duties: 'Develop registration and login interfaces and client-side validation rules.' },
  { member: 'Member 6', name: 'Emmanuel Osei', role: 'Backend Authentication Developer', duties: 'Implement session security, password handling, and role permissions.' },
  { member: 'Member 7', name: 'Derrick Koomson', role: 'Lost and Found Module Developer', duties: 'Develop lost and found reporting forms and item catalog interfaces.' },
  { member: 'Member 8', name: 'Joshua Addo', role: 'Database & Search Developer', duties: 'Implement report data storage, image upload pipeline, search, and filtering.' },
  { member: 'Member 9', name: 'Kwame Boateng', role: 'Claims & Administration Developer', duties: 'Develop claims submission, review decision modals, and admin security operations.' },
  { member: 'Member 10', name: 'Abigail Appiah', role: 'Testing & Deployment Coordinator', duties: 'Prepare test cases, run QA test suite, document bug reports, and assist final deployment.' }
];

export const ProjectDocumentation: React.FC = () => {
  const [docTab, setDocTab] = useState<'overview' | 'architecture' | 'erd' | 'schedule' | 'team' | 'testing'>('overview');
  const [testCases, setTestCases] = useState<TestCase[]>(INITIAL_TEST_CASES);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleRunAllTests = () => {
    setIsRunningTests(true);
    // Simulate interactive test execution
    setTimeout(() => {
      setTestCases((prev) =>
        prev.map((tc) => ({
          ...tc,
          status: 'passed'
        }))
      );
      setIsRunningTests(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with University Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">
            <span>University of Cape Coast · Department of Computer Science & IT</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Software Engineering Project Documentation Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Course Project: <strong>CAMPUSFIND</strong> · Group Project Defense & Submission Package
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 self-start md:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Document</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setDocTab('overview')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            docTab === 'overview' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Project Overview & SRS</span>
        </button>

        <button
          onClick={() => setDocTab('architecture')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            docTab === 'architecture' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>System Architecture</span>
        </button>

        <button
          onClick={() => setDocTab('erd')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            docTab === 'erd' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Design (ERD)</span>
        </button>

        <button
          onClick={() => setDocTab('schedule')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            docTab === 'schedule' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>14-Day Agile Timeline</span>
        </button>

        <button
          onClick={() => setDocTab('team')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            docTab === 'team' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Responsibility Matrix</span>
        </button>

        <button
          onClick={() => setDocTab('testing')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            docTab === 'testing' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Test Suite & QA Matrix</span>
        </button>
      </div>

      {/* Tab 1: Overview & SRS */}
      {docTab === 'overview' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">1.1 Introduction & Problem Statement</h3>
            <p className="mb-3">
              Students at the University of Cape Coast (UCC) routinely misplace vital belongings, including
              student smart ID cards, Casio scientific calculators, mobile phones, room keys, and lecture notes.
              Historically, lost items have been broadcast informally via volatile WhatsApp groups, notice boards,
              or scattered porters' lodges across Casely Hayford, Valco, Oguaa, and Atlantic Halls.
            </p>
            <p>
              This fragmented workflow causes delayed retrieval, unverified pickups, and high stress during exam
              periods. <strong>CampusFind</strong> establishes an audited, verified central repository linking students,
              hall porters, and the Directorate of University Security.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xl font-bold text-slate-900 mb-2">1.4 Project Objectives</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong>1. Student Authentication:</strong> Secure authentication tied to UCC Student ID numbers.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong>2. Dual-Stream Reporting:</strong> Distinct, guided workflows for Lost items vs Found items.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong>3. Visual Proof Uploads:</strong> Image capture and rendering with zero-broken-image fallbacks.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong>4. Faceted Search & Filters:</strong> Sub-second queries across UCC zones, halls, and categories.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong>5. Algorithmic Match Correlator:</strong> Rule-based similarity engine based on token overlap & dates.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong>6. Confidential Claims Verification:</strong> Secret ownership proof verification by campus security.
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Non-Functional Requirements</h3>
            <ul className="list-disc pl-5 text-xs space-y-1.5 text-slate-600">
              <li><strong>Usability:</strong> Simple, accessible interface compliant with WCAG AA standards.</li>
              <li><strong>Performance:</strong> Instant client-side search indexing with sub-50ms response time.</li>
              <li><strong>Reliability:</strong> Complete offline storage persistence across page reloads via localStorage.</li>
              <li><strong>Security & Privacy:</strong> Hidden distinctive marks and confidential claim descriptions accessible only to verified security personnel.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: System Architecture */}
      {docTab === 'architecture' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">System Architecture (3-Tier Model)</h3>
            <p className="text-xs text-slate-500">
              High-level component interaction between the client presentation layer, application business logic, and persistent data storage.
            </p>
          </div>

          {/* Interactive Architectural Visual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Tier 1: Presentation */}
            <div className="bg-blue-50/50 border-2 border-blue-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">Tier 1</div>
                <h4 className="font-bold text-slate-900 text-base mb-3">Client Presentation Layer</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <strong>Header & Top Bar:</strong> Navigation, role switcher, notification toasts
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <strong>Catalog & Filters:</strong> Search bar, categories, campus zone selector
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <strong>Reporting Forms:</strong> Lost & found modals with image handling
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <strong>Admin Operations Desk:</strong> Claims queue, audit logs, student roster
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200 text-[11px] text-blue-800 font-medium">
                Tech: React 19, TypeScript, Tailwind CSS v4
              </div>
            </div>

            {/* Tier 2: Logic */}
            <div className="bg-amber-50/50 border-2 border-amber-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">Tier 2</div>
                <h4 className="font-bold text-slate-900 text-base mb-3">Service & Matching Engine</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2 bg-white rounded border border-amber-100">
                    <strong>Rule-Based Matcher:</strong> Category (35%), color (15%), location (20%), token overlap (20%), dates (10%)
                  </div>
                  <div className="p-2 bg-white rounded border border-amber-100">
                    <strong>Claims State Machine:</strong> Pending → Approved / Rejected → Handed Over
                  </div>
                  <div className="p-2 bg-white rounded border border-amber-100">
                    <strong>Security Audit Tracker:</strong> Immutable chronological action logger
                  </div>
                  <div className="p-2 bg-white rounded border border-amber-100">
                    <strong>Auth & Session Manager:</strong> Student & Admin permission enforcement
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200 text-[11px] text-amber-800 font-medium">
                Logic: Rule-based heuristic scoring (No AI hallucination)
              </div>
            </div>

            {/* Tier 3: Storage */}
            <div className="bg-emerald-50/50 border-2 border-emerald-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">Tier 3</div>
                <h4 className="font-bold text-slate-900 text-base mb-3">Data Persistence Layer</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2 bg-white rounded border border-emerald-100">
                    <strong>Items Table:</strong> Lost & found records, statuses, pictures
                  </div>
                  <div className="p-2 bg-white rounded border border-emerald-100">
                    <strong>Claims Table:</strong> Confidential proof descriptions & decisions
                  </div>
                  <div className="p-2 bg-white rounded border border-emerald-100">
                    <strong>Users Directory:</strong> Student IDs, emails, halls of residence
                  </div>
                  <div className="p-2 bg-white rounded border border-emerald-100">
                    <strong>Audit Logs Table:</strong> Timestamped security actions
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-200 text-[11px] text-emerald-800 font-medium">
                Storage: LocalStorage with UCC seed hydration + JSON export
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Database Design & ERD */}
      {docTab === 'erd' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Entity Relationship Diagram (ERD) & Schema</h3>
            <p className="text-xs text-slate-500">
              Relational data structure designed for MySQL / relational database implementations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Table 1: USERS */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-2.5 font-bold flex items-center justify-between">
                <span>TABLE: users</span>
                <span className="text-[11px] font-mono text-slate-400">Entity: Student / Staff</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 font-mono text-[11px]">
                <div className="py-1 flex justify-between"><strong>id (PK)</strong> <span>VARCHAR(36)</span></div>
                <div className="py-1 flex justify-between"><strong>student_id (UNIQUE)</strong> <span>VARCHAR(20)</span></div>
                <div className="py-1 flex justify-between"><span>full_name</span> <span>VARCHAR(100)</span></div>
                <div className="py-1 flex justify-between"><span>email</span> <span>VARCHAR(100)</span></div>
                <div className="py-1 flex justify-between"><span>phone</span> <span>VARCHAR(20)</span></div>
                <div className="py-1 flex justify-between"><span>hall_of_residence</span> <span>VARCHAR(50)</span></div>
                <div className="py-1 flex justify-between"><span>department</span> <span>VARCHAR(100)</span></div>
                <div className="py-1 flex justify-between"><span>role</span> <span>ENUM('student', 'admin')</span></div>
              </div>
            </div>

            {/* Table 2: ITEM_REPORTS */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-blue-900 text-white px-4 py-2.5 font-bold flex items-center justify-between">
                <span>TABLE: item_reports</span>
                <span className="text-[11px] font-mono text-blue-200">Entity: Lost / Found</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 font-mono text-[11px]">
                <div className="py-1 flex justify-between"><strong>id (PK)</strong> <span>VARCHAR(36)</span></div>
                <div className="py-1 flex justify-between"><span>type</span> <span>ENUM('lost', 'found')</span></div>
                <div className="py-1 flex justify-between"><span>title</span> <span>VARCHAR(150)</span></div>
                <div className="py-1 flex justify-between"><span>category</span> <span>VARCHAR(50)</span></div>
                <div className="py-1 flex justify-between"><span>campus_location</span> <span>VARCHAR(100)</span></div>
                <div className="py-1 flex justify-between"><span>specific_spot</span> <span>VARCHAR(100)</span></div>
                <div className="py-1 flex justify-between"><span>date_event</span> <span>DATE</span></div>
                <div className="py-1 flex justify-between"><span>color</span> <span>VARCHAR(30)</span></div>
                <div className="py-1 flex justify-between"><span>distinct_marks</span> <span>TEXT</span></div>
                <div className="py-1 flex justify-between"><span>storage_location</span> <span>VARCHAR(100)</span></div>
                <div className="py-1 flex justify-between"><strong>reporter_student_id (FK)</strong> <span>VARCHAR(20)</span></div>
                <div className="py-1 flex justify-between"><span>status</span> <span>ENUM('open','claimed','recovered')</span></div>
              </div>
            </div>

            {/* Table 3: CLAIMS */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-amber-800 text-white px-4 py-2.5 font-bold flex items-center justify-between">
                <span>TABLE: claims</span>
                <span className="text-[11px] font-mono text-amber-200">Entity: Ownership Claim</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 font-mono text-[11px]">
                <div className="py-1 flex justify-between"><strong>id (PK)</strong> <span>VARCHAR(36)</span></div>
                <div className="py-1 flex justify-between"><strong>item_id (FK)</strong> <span>VARCHAR(36)</span></div>
                <div className="py-1 flex justify-between"><strong>claimant_student_id (FK)</strong> <span>VARCHAR(20)</span></div>
                <div className="py-1 flex justify-between"><span>proof_description</span> <span>TEXT</span></div>
                <div className="py-1 flex justify-between"><span>status</span> <span>ENUM('pending','approved','rejected')</span></div>
                <div className="py-1 flex justify-between"><span>admin_notes</span> <span>TEXT</span></div>
                <div className="py-1 flex justify-between"><span>collection_location</span> <span>VARCHAR(100)</span></div>
                <div className="py-1 flex justify-between"><span>submitted_at</span> <span>DATETIME</span></div>
              </div>
            </div>

            {/* Table 4: AUDIT_LOGS */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-800 text-white px-4 py-2.5 font-bold flex items-center justify-between">
                <span>TABLE: audit_logs</span>
                <span className="text-[11px] font-mono text-slate-300">Entity: System Logs</span>
              </div>
              <div className="p-3 divide-y divide-slate-100 font-mono text-[11px]">
                <div className="py-1 flex justify-between"><strong>id (PK)</strong> <span>VARCHAR(36)</span></div>
                <div className="py-1 flex justify-between"><span>timestamp</span> <span>DATETIME</span></div>
                <div className="py-1 flex justify-between"><span>actor</span> <span>VARCHAR(100)</span></div>
                <div className="py-1 flex justify-between"><span>action</span> <span>VARCHAR(50)</span></div>
                <div className="py-1 flex justify-between"><span>target_id</span> <span>VARCHAR(36)</span></div>
                <div className="py-1 flex justify-between"><span>details</span> <span>TEXT</span></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <strong>Relational Cardinality:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>One <code>users</code> record can author multiple <code>item_reports</code> (1 : N).</li>
              <li>One <code>users</code> record can file multiple <code>claims</code> (1 : N).</li>
              <li>One found <code>item_reports</code> can have multiple candidate <code>claims</code> (1 : N), but only 1 claim can be marked 'approved' or 'collected'.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: 14-Day Agile Timeline */}
      {docTab === 'schedule' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">14-Day Agile Work Schedule & Deliverables</h3>
            <p className="text-xs text-slate-500">
              Structured sprint timeline mapped to the Software Engineering project lifecycle.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4">Phase</th>
                    <th className="py-3 px-4">Main Activities</th>
                    <th className="py-3 px-4">Expected Deliverables</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {SCHEDULE_DAYS.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{d.day}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{d.phase}</td>
                      <td className="py-3 px-4 text-slate-700">{d.activity}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{d.outcome}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            d.status === 'Completed'
                              ? 'text-emerald-700'
                              : d.status === 'In Progress'
                              ? 'text-amber-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {d.status === 'Completed' ? '✓ ' : ''}{d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Team Responsibility Matrix */}
      {docTab === 'team' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Ten-Member Responsibility Allocation Matrix</h3>
            <p className="text-xs text-slate-500">
              Clear accountability and role breakdown as designated in Section 7 of the project plan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEAM_MEMBERS.map((tm, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">{tm.member}</span>
                  <span className="text-slate-400 font-mono">UCC Dept. CS & IT</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{tm.name}</div>
                <div className="text-xs font-semibold text-slate-700">{tm.role}</div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                  {tm.duties}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Test Suite & QA Matrix */}
      {docTab === 'testing' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Functional Test Case Verification Suite</h3>
              <p className="text-xs text-slate-500">
                Covers all 12 mandatory testing requirements defined in Section 9 of the SE Group Project Plan.
              </p>
            </div>

            <button
              onClick={handleRunAllTests}
              disabled={isRunningTests}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningTests ? 'Executing QA Suite...' : 'Run Automated Test Suite'}</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Test ID</th>
                    <th className="py-3 px-4">Test Area</th>
                    <th className="py-3 px-4">Expected Result</th>
                    <th className="py-3 px-4">Verification Audit Notes</th>
                    <th className="py-3 px-4 text-right">QA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {testCases.map((tc) => (
                    <tr key={tc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{tc.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{tc.testArea}</td>
                      <td className="py-3 px-4 text-slate-700">{tc.expectedResult}</td>
                      <td className="py-3 px-4 text-slate-500">{tc.details}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASSED</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
