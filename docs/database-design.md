                       ┌────────────────────┐
                       │   organizations     │
                       ├────────────────────┤
                       │ id PK              │
                       │ name                │
                       │ slug                │
                       │ created_at          │
                       └─────────┬──────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    │ 1                       │ 1
                    │                         │
                    │ *                       │ *
          ┌─────────▼──────────┐    ┌────────▼──────────┐
          │       users        │    │      tickets      │
          ├────────────────────┤    ├───────────────────┤
          │ id PK              │    │ id PK             │
          │ organization_id FK │    │ organization_id FK│
          │ email              │    │ customer_id FK    │
          │ name               │    │ subject           │
          │ role               │    │ description       │
          └─────────┬──────────┘    │ status            │
                    │               │ priority          │
                    │               └────────┬──────────┘
                    │                        │
                    │                        │ 1
                    │                        │
                    │                        │ *
                    │               ┌────────▼──────────┐
                    └──────────────►│ ticket_messages   │
                                    ├────────────────────┤
                                    │ id PK              │
                                    │ ticket_id FK       │
                                    │ sender_id FK       │
                                    │ content            │
                                    └────────────────────┘