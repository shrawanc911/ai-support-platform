from app.ai.agent.tools import (
    AgentTool,
    GetCustomerTool,
    GetOrderTool,
    GetSubscriptionTool,
    SearchKnowledgeTool,
    SearchTicketHistoryTool,
    ChangeTicketStatusTool,
)


class AgentToolRegistry:
    def __init__(self):
        self._tools: dict[str, AgentTool] = {
            tool.name: tool
            for tool in [
                SearchKnowledgeTool(),
                SearchTicketHistoryTool(),
                GetCustomerTool(),
                GetOrderTool(),
                GetSubscriptionTool(),
                ChangeTicketStatusTool()
            ]
        }

    def get(self, name: str) -> AgentTool:
        tool = self._tools.get(name)

        if not tool:
            raise ValueError(
                f"Unknown agent tool: {name}"
            )

        return tool

    def definitions(self) -> list[dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "search_knowledge",
                    "description": (
                        "Search the organization's knowledge base "
                        "for policies, procedures, product information "
                        "and support documentation."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": (
                                    "The information to search for."
                                ),
                            }
                        },
                        "required": ["query"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_ticket_history",
                    "description": (
                        "Retrieve previous messages from the current "
                        "support ticket."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {},
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_customer",
                    "description": (
                        "Retrieve basic information about a customer."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_order",
                    "description": (
                        "Retrieve order information when an order "
                        "ID is available."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "order_id": {
                                "type": "string",
                                "description": "UUID of the order.",
                            },
                            "order_number": {
                                "type": "string",
                                "description": "Customer-facing order number.",
                            },
                        },
                        "required": ["customer_id"],
                    }
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_subscription",
                    "description": (
                        "Retrieve subscription information "
                        "for the current customer."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "subscription_id": {
                                "type": "string",
                                "description": (
                                    "UUID of the subscription."
                                ),
                            },
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "change_ticket_status",
                    "description": (
                        "Propose a ticket status change. "
                        "The action requires human approval before execution."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": [
                                    "OPEN",
                                    "AI_ANALYZING",
                                    "ASSIGNED",
                                    "IN_PROGRESS",
                                    "WAITING_FOR_CUSTOMER",
                                    "RESOLVED",
                                    "CLOSED",
                                ],
                            }
                        },
                        "required": ["status"],
                    },
                },
            }
        ]