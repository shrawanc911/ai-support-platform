from app.ai.agent.tools import (
    AgentTool,
    GetCustomerTool,
    GetOrderTool,
    GetSubscriptionTool,
    SearchKnowledgeTool,
    SearchTicketHistoryTool,
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
                "name": tool.name,
                "description": tool.description,
            }
            for tool in self._tools.values()
        ]