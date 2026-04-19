
# Query Resolver — Internal Support Ticket System

A professional, corporate-styled web application where employees can submit support queries and track their resolution status. Frontend-only for now, with mock data.

---

## Pages & Layout

### Global Layout
- **Top navbar** with company branding, search bar, notifications bell icon, and user avatar/profile dropdown
- Clean white background with subtle gray accents, sharp corners, and professional typography
- Corporate color palette: deep navy primary, neutral grays, green/amber/red status indicators

### 1. Dashboard (Home)
- **Summary cards**: Total Queries, Open, In Progress, Resolved (with icons and counts)
- **Recent Queries table**: Shows latest tickets with ID, subject, category, priority, status badge, and date
- **Quick filters**: Filter by status (Open / In Progress / Resolved / Closed)

### 2. Submit New Query
- Professional form with fields:
  - Subject (text input)
  - Category dropdown (IT Support, HR, Facilities, Finance, General)
  - Priority selector (Low, Medium, High, Critical)
  - Description (rich textarea)
  - Attachments placeholder (file upload UI)
- Form validation with clear error messages
- Success confirmation with generated ticket ID

### 3. My Queries
- Sortable, filterable table of all queries submitted by the user
- Columns: Ticket ID, Subject, Category, Priority, Status, Created Date, Last Updated
- Click a row to open query detail view
- Status badges with color coding (green=resolved, amber=in progress, red=critical, gray=closed)

### 4. Query Detail View
- Full ticket information display
- **Timeline/activity log** showing status changes and responses (mock data)
- Response/comment section at the bottom
- Status and priority indicators prominently displayed

### 5. Not Found (404)
- Already exists, will keep as-is

---

## Key UI Components
- Professional data tables with sorting and pagination
- Color-coded status badges and priority indicators
- Toast notifications for actions (submit, update)
- Responsive layout that works on desktop and tablet
- Breadcrumb navigation for context

## Data Approach
- All data will be stored in React state with realistic mock/sample tickets
- Ready to connect to a backend later when needed
