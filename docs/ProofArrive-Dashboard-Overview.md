# ProofArrive Dashboard — How It Works

_Admin Guide — a step-by-step walkthrough for operations managers, dispatchers, and administrators using the ProofArrive web dashboard to monitor vehicles, manage trips, and oversee distribution centers in real time._

🖥️ **Platform:** Web browser &nbsp;·&nbsp; 👥 **Audience:** Operations & admins &nbsp;·&nbsp; 📖 **Reading time:** ~10 minutes

---

## Overview

The **ProofArrive Dashboard** is the web-based control room for the ProofArrive system. While field staff use the mobile app to scan vehicles at distribution centers, managers and administrators use the dashboard to **see the whole operation at a glance** — which vehicles are moving, which centers are busy, which trips are running late, and who is doing what.

Every piece of data you see here comes directly from the scans performed in the field. The dashboard aggregates those scans into **live KPIs**, **trip timelines**, **fleet status**, and **center queues**, so decisions can be made with trustworthy, up-to-the-minute information.

> ℹ️ **One system, two interfaces**
> The mobile app creates the data (scans, timestamps, GPS proofs). The dashboard makes sense of it — filtering, grouping, charting, and exposing the controls that keep the fleet running.

**What problem does it solve?** It replaces spreadsheets, status meetings, and phone calls with a single live view of the entire operation, where every number is traceable back to a real, timestamped event.

---

## Who It's For

The dashboard is built for three kinds of users:

- **Operations managers** — watch KPIs, spot bottlenecks, and keep trips flowing.
- **Dispatchers** — assign vehicles to centers, review timelines, and follow active trips.
- **Administrators** — manage users, regenerate vehicle QR codes, and configure centers and groups.

All three share the same interface — what each person can actually *do* depends on their role. See [Roles & Permissions](#roles--permissions) for the full breakdown.

---

## Logging In

The dashboard runs in any modern web browser. When you open it for the first time, you land on a public welcome page and must sign in before you can access any operational data.

> ⚠️ **Your login credentials**
> Use your **Malambi credentials** to sign in — the same username and password you use for the ProofArrive mobile app and other Malambi systems. If you don't have an account yet, contact your system administrator.

1. Open the dashboard URL in your browser.
2. Click **Sign In** on the landing page.
3. Enter your **username** and **password**.
4. Click **Sign In** to enter the app.

Once signed in, the dashboard remembers you in your browser. It refreshes your session automatically in the background, so you rarely need to re-enter your password. Use the **Logout** button at the bottom of the sidebar whenever you want to end the session — especially on shared computers.

> ✎ **Security details**
> Access is controlled with short-lived JWT tokens. Expired sessions are refreshed silently, and all traffic between the dashboard and the ProofArrive API is sent over HTTPS.

---

## Dashboard Layout

Once signed in, every page shares the same three-part layout:

- **Left sidebar** — navigation between pages, plus your profile card and a logout button at the bottom. It can be collapsed to icons only for more screen space.
- **Top bar** — page title, global filters (where applicable), and your currently selected context.
- **Main content** — the page you're on: charts, tables, cards, or detail views.

```text
  SEE THE WHOLE PICTURE                       TAKE INFORMED ACTION
          │                                             │
          ▼                                             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │1. Sign In│─▶│2. Monitor│─▶│3. Drill  │─▶│  4. Act  │─▶│5. Report │─▶│6. Repeat │
  │ Open in  │  │Live KPIs,│  │  In      │  │ Assign,  │  │ Filter,  │  │Continuous│
  │ browser  │  │  charts  │  │ Trip /   │  │  manage, │  │  export, │  │visibility│
  │          │  │          │  │ vehicle  │  │regenerate│  │   share  │  │          │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

The sidebar is grouped into sections so related pages are easy to find:

| Section | Pages |
| --- | --- |
| **Main** | Dashboard, Trips, Vehicles, Available Vehicles, Centers |
| **People** | Users |
| **Configuration** | Settings |

---

## Dashboard

The **Dashboard** is the page you land on after signing in. It's designed to answer the question *"what's happening right now?"* in a single glance.

At the top you'll find live **KPI cards**:

- **Trips started** in the selected period
- **Trips completed** and overall **completion rate**
- **Vehicles in queue** — loading or unloading right now
- **Vehicles in transit** between centers

Below the KPIs, charts and tables break the numbers down:

- A **trips over time** area chart showing trends across the selected range.
- A **queue activity** view per center, so you can see where the pressure is.
- An **active trips** list with each trip's current phase.
- A **quick links** panel for jumping to Vehicles, Trips, Centers, and Settings.

Everything on this page respects the **date range** (today, last 7 days, this month) and optional **center** or **vehicle** filters at the top. Change a filter and every card, chart, and table updates together.

---

## Trips

The **Trips** page is the heart of the operation. Every vehicle movement recorded by the mobile app shows up here as a trip, with a full, auditable history.

From the trips table you can:

- **Search** by plate number, center name, or trip ID.
- **Filter** by status (ongoing or completed), purpose (pickup or delivery), and creation date.
- **Sort** by most recent, longest running, or any other column.
- **Click a trip** to open its detail view.

The **trip detail** view is where the full story lives. It shows:

- Origin and destination centers
- The vehicle and who scanned it at each step
- The current phase (loading, in transit, arrived, etc.)
- A chronological **event timeline** — every scan, every state change, every timestamp, every location

> ✓ **Use the timeline for audits**
> If a customer asks "when did the truck actually leave?" or "how long was it loading?" — the trip timeline has the answer, captured automatically and verified by GPS at the moment it happened.

---

## Vehicles

The **Vehicles** page is your full fleet view. Each vehicle is listed with its plate number, current status, last known center, and last activity timestamp.

Status counts at the top give you a quick summary:

- **Waiting**, **Loading**, **Unloading**, **Ready to Exit**
- **In Transit**, **Arrived**, **Completed**
- **Available**, **Active**, **Idle**

From a vehicle row, admins and managers can:

- **View or regenerate the QR code** used for scanning in the field (see [Vehicle QR Codes](#vehicle-qr-codes)).
- **See the trip history** for that specific vehicle.
- **Update the status** manually in rare cases where a scan was missed.

---

## Available Vehicles

The **Available Vehicles** page is a dispatcher's best friend. It shows only the vehicles that are currently **free and ready to be assigned**, in a grid view designed for quick, bulk action.

- Select one or many vehicles using checkboxes.
- Pick the target **center** from a dropdown.
- Confirm — the vehicles are assigned and the mobile app at that center will see them appear.

This is the page to use when you need to quickly reposition vehicles before a busy shift or to balance load between centers.

---

## Centers

The **Centers** page lists every distribution or processing facility connected to ProofArrive. For each center, you can see:

- Its **name** and location
- How many vehicles are currently **loading** or **unloading**
- How many are **waiting in queue**
- A quick **queue summary** to spot overloaded or idle centers

Use this page when you need a facility-level view — for example, to understand whether congestion is cluster-wide or limited to a single site.

---

## Users

The **Users** page lists everyone who has a ProofArrive account — field staff, dispatchers, managers, and admins. For each user you can see:

- Their **name** and **username**
- Their **role** (admin, manager, or standard user)
- Their assigned **center**, if any
- When they **last logged in**

You can search and sort the list, which makes it easy to audit account activity, identify inactive users, or find the right person to follow up with.

---

## Settings

The **Settings** page is where you manage your account and — if you're an admin or manager — configure parts of the system itself.

Every user can:

- View their **profile details** (name, username, role, assigned center).
- Switch between **light and dark mode**.
- **Log out** of the dashboard.

Admins and managers additionally get:

- **Vehicle group management** — create, rename, or re-scope vehicle groups used for bulk operations.
- Access to operational configuration not exposed to standard users.

---

## Roles & Permissions

ProofArrive uses three roles. Every account has exactly one. The role controls which actions appear in the interface — if you can't see a button, it's usually because your role doesn't have permission to use it.

| Capability | Admin | Manager | User |
| --- | :---: | :---: | :---: |
| View dashboard, trips, vehicles, centers | ✓ | ✓ | ✓ |
| Open trip timelines & history | ✓ | ✓ | ✓ |
| Search & filter the Users list | ✓ | ✓ | ✓ |
| Assign vehicles to centers (bulk) | ✓ | ✓ | — |
| Generate / regenerate vehicle QR codes | ✓ | ✓ | — |
| Manage vehicle groups | ✓ | ✓ | — |
| Manually update a vehicle's status | ✓ | ✓ | — |

> ✎ **One account, both apps**
> The same account works on the dashboard and the mobile app. A dispatcher can sit at the dashboard in the morning, then switch to the mobile app in the afternoon when they're out on the floor — no second login needed.

---

## Vehicle QR Codes

Every vehicle in ProofArrive has a unique **QR code**. That code is what the mobile app scans in the field to identify the vehicle and attach every event to the right trip.

From the Vehicles page, admins and managers can:

1. Open a vehicle.
2. Click **View QR Code** to display it on screen for printing or reading.
3. Click **Regenerate** to issue a new code — the old one stops working immediately.

> ⚠️ **Regenerate with care**
> Regenerating a QR code is the right move if a sticker is lost, damaged, or compromised. But once you regenerate, the old sticker becomes useless — make sure you can print and apply the new one before the next trip.

---

## Worked Example

Let's follow a single day on the dashboard to see how the pieces come together:

> It's 8:15 AM. **Sophie**, an operations manager, opens the dashboard on her laptop and signs in with her Malambi credentials. The KPI cards tell her there are already **12 trips in progress**, **3 vehicles loading**, and a completion rate of **94%** for the last 7 days. The trend chart shows today is tracking a bit above average.
>
> She clicks the **Centers** page and notices **Warehouse B** has 6 vehicles in its unloading queue — twice what's normal for that hour. She opens the **Available Vehicles** page, selects four free trucks, and assigns them to **Warehouse C** instead to relieve pressure on B.
>
> At 10:40, a customer calls asking about a shipment. Sophie jumps to **Trips**, searches the plate number, and opens the trip. The timeline shows the truck left Warehouse A at 07:12, passed through transit, arrived at Warehouse B at 10:05, and started unloading 8 minutes later. She reads the times straight back to the customer — no guesswork, no phone calls to the warehouse.
>
> Later, a dispatcher reports a damaged QR sticker on one of the trucks. Sophie opens the **Vehicles** page, finds the vehicle, clicks **Regenerate QR Code**, prints the new code from her desk, and messages the dispatcher. Two minutes later, the truck is scannable again.
>
> By the end of the shift, Sophie has never left her chair to find out what's happening in the field — and every decision she made is backed by data she can point to.

---

## Vehicle Statuses

Vehicles in ProofArrive move through a well-defined set of states. The dashboard shows them with coloured badges so the current situation is obvious at a glance.

| Status | What It Means |
| --- | --- |
| **Waiting** | Arrived at a center, not yet being worked on. |
| **Loading** | Currently being loaded with cargo at a center. |
| **Unloading** | Currently being unloaded at a center. |
| **Ready to Exit** | Work complete, cleared to leave the center. |
| **In Transit** | On the road between two centers. |
| **Arrived** | Reached its destination center, scan confirmed. |
| **Completed** | Trip fully finished — loaded, driven, delivered. |
| **Available** | Free and ready to be assigned to a new trip. |
| **Active** | Currently part of an ongoing trip (any step). |
| **Idle** | No recent activity — may need attention. |

---

## Glossary

| Term | What It Means |
| --- | --- |
| **Dashboard** | The web app described in this guide — the control room for ProofArrive. |
| **Mobile app** | The companion phone app used by field staff to scan vehicles at centers. |
| **Trip** | A single vehicle journey between centers, with a full event timeline. |
| **Center** | A warehouse or distribution facility connected to ProofArrive. |
| **KPI** | A top-line metric shown as a card on the dashboard (trips, queue size, completion rate). |
| **Queue** | Vehicles currently waiting, loading, or unloading at a given center. |
| **QR code** | The unique sticker on each vehicle that the mobile app scans to identify it. |
| **Vehicle group** | A named collection of vehicles used for bulk operations and filtering. |
| **Role** | The permission level of an account: admin, manager, or standard user. |
| **Malambi credentials** | The single sign-on username and password used across Malambi systems, including ProofArrive. |

---

## Summary

The ProofArrive dashboard turns scans in the field into answers on a screen:

- **See** every trip, vehicle, and center at a glance.
- **Drill in** to a full timeline whenever a question comes up.
- **Act** on the data — assign vehicles, manage QR codes, update statuses.
- **Trust** the numbers, because each one is tied to a real, timestamped, GPS-verified scan.

Fast for managers. Transparent for teams. Auditable for everyone.

---

**ProofArrive Dashboard** — proof of arrival, every trip, every time.

© Malambi · Admin Guide v1.0
