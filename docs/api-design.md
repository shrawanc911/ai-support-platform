# API Design

## Organizations

### POST /organizations

Create an organization.

### GET /organizations/{organization_id}

Retrieve an organization.

---

## Users

### POST /users

Create a user.

### GET /users/{user_id}

Retrieve a user.

---

## Tickets

### POST /tickets

Create a support ticket.

### GET /tickets

List tickets.

Supported filters:

- organization_id
- status
- priority
- page
- limit

### GET /tickets/{ticket_id}

Retrieve a specific ticket.

### PATCH /tickets/{ticket_id}

Update ticket status or priority.