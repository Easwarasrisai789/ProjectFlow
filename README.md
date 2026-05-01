# ProjectFlow — Role-Based Project Management

A Firebase + React project management app with strict Admin/Member role separation.

---

## Roles & Permissions

### 🔑 Admin
- Create, edit, delete **projects**
- Add and remove **team members** from projects
- Create, edit, delete **tasks** with assigned member and **due dates**
- Set task priority (Low / Medium / High / Critical)
- Drag-and-drop tasks across Kanban columns
- View all tasks and projects

### 👤 Member
- View projects they've been assigned to
- See their assigned tasks ordered by due date
- **Advance task status only**: To Do → In Progress → Done
- Cannot create or delete tasks
- Cannot manage team membership

---

## Task Status Flow

```
Admin creates task with due date → assigns to member
                ↓
         [To Do] ──► member clicks "▶ Start" ──► [In Progress]
                                                        ↓
                                         member clicks "✓ Done" ──► [Done]
```

Admin can set any status at any time via the task edit modal or kanban drag-drop.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Firebase setup
- Create a Firebase project at https://console.firebase.google.com
- Enable **Authentication** → Email/Password
- Enable **Firestore Database**
- Update `src/services/firebase.js` with your config

### 3. Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Firestore indexes
```bash
firebase deploy --only firestore:indexes
```

### 5. Run
```bash
npm start
```

---

## Firestore Rules Summary

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| `users` | Owner only | Any signed-in | Owner or Admin | — |
| `projects` | **Admin only** | Project members | Admin or Owner | Admin or Owner |
| `tasks` | **Admin only** | Project members | Admin (all fields) / Member (status only, own tasks) | **Admin only** |

---

## Key Flows

### Admin creates a project
1. Go to **Projects** → click **+ New Project**
2. Enter name and description
3. Open project → **Team** panel → search users → **+ Add**

### Admin creates a task
1. Open a project → click **+ Add Task**
2. Fill title, description, priority, **assign to a member**, set **due date**
3. Task appears in **To Do** column on the Kanban board

### Member updates task status
1. Member sees their assigned tasks in **My Tasks** (sorted by due date)
2. Click **▶ Start** to move to In Progress
3. Click **✓ Done** to mark complete
4. Or navigate to the project and use the buttons on each task card

### Timeline view
- In any project, click **📅 Timeline** to see all tasks sorted by due date with status and overdue indicators.

---

## Tech Stack

- **React** with React Router v6
- **Firebase** (Auth + Firestore)
- **react-hot-toast** for notifications
- **date-fns** for date formatting
