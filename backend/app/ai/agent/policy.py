from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent.policy_enums import ActionDecision, ActionRisk
from app.ai.agent.policy_schemas import PolicyDecision
from app.core.authorization import can_access_ticket
from app.models.ticket import Ticket
from app.models.user import User, UserRole


class AgentActionPolicy:
    """
    Central policy engine for AI-generated actions.

    The LLM proposes an action.
    This class decides whether the backend permits it.
    """

    async def evaluate(
        self,
        db: AsyncSession,
        *,
        user: User,
        ticket: Ticket,
        action_type: str,
        payload: dict,
    ) -> PolicyDecision:

        # 1. Tenant + ticket authorization
        if not can_access_ticket(user, ticket):
            return PolicyDecision(
                decision=ActionDecision.DENY,
                risk=ActionRisk.HIGH,
                reason="User is not authorized to access this ticket.",
            )

        # 2. Customers cannot perform agent actions
        if user.role == UserRole.CUSTOMER:
            return PolicyDecision(
                decision=ActionDecision.DENY,
                risk=ActionRisk.HIGH,
                reason="Customers cannot perform agent actions.",
            )

        # 3. Validate supported actions
        allowed_actions = {
            "ADD_INTERNAL_NOTE",
            "ASSIGN_TICKET",
            "CHANGE_TICKET_STATUS",
        }

        if action_type not in allowed_actions:
            return PolicyDecision(
                decision=ActionDecision.DENY,
                risk=ActionRisk.HIGH,
                reason="Action type is not allowed.",
            )

        # 4. Action-specific policies
        if action_type == "ADD_INTERNAL_NOTE":
            return await self._evaluate_internal_note(
                user=user,
                ticket=ticket,
                payload=payload,
            )

        if action_type == "ASSIGN_TICKET":
            return await self._evaluate_assignment(
                user=user,
                ticket=ticket,
                payload=payload,
            )

        if action_type == "CHANGE_TICKET_STATUS":
            return await self._evaluate_status_change(
                user=user,
                ticket=ticket,
                payload=payload,
            )

        return PolicyDecision(
            decision=ActionDecision.DENY,
            risk=ActionRisk.HIGH,
            reason="No policy exists for this action.",
        )

    async def _evaluate_internal_note(
        self,
        *,
        user: User,
        ticket: Ticket,
        payload: dict,
    ) -> PolicyDecision:

        content = payload.get("content")

        if not isinstance(content, str) or not content.strip():
            return PolicyDecision(
                decision=ActionDecision.DENY,
                risk=ActionRisk.LOW,
                reason="Internal note content is required.",
            )

        if len(content) > 5000:
            return PolicyDecision(
                decision=ActionDecision.DENY,
                risk=ActionRisk.LOW,
                reason="Internal note is too long.",
            )

        return PolicyDecision(
            decision=ActionDecision.REQUIRE_APPROVAL,
            risk=ActionRisk.LOW,
            reason="AI-generated internal notes require human approval.",
        )

    async def _evaluate_assignment(
        self,
        *,
        user: User,
        ticket: Ticket,
        payload: dict,
    ) -> PolicyDecision:

        assignee_id = payload.get("assignee_id")

        if not assignee_id:
            return PolicyDecision(
                decision=ActionDecision.DENY,
                risk=ActionRisk.MEDIUM,
                reason="Assignee is required.",
            )

        if user.role not in {
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        }:
            return PolicyDecision(
                decision=ActionDecision.DENY,
                risk=ActionRisk.MEDIUM,
                reason="User cannot assign tickets.",
            )

        return PolicyDecision(
            decision=ActionDecision.REQUIRE_APPROVAL,
            risk=ActionRisk.MEDIUM,
            reason="Ticket assignment requires human approval.",
        )

    async def _evaluate_status_change(
        self,
        *,
        user: User,
        ticket: Ticket,
        payload: dict,
    ) -> PolicyDecision:

        new_status = payload.get("status")

        if not new_status:
            return PolicyDecision(
                decision=ActionDecision.DENY,
                risk=ActionRisk.HIGH,
                reason="Target ticket status is required.",
            )

        return PolicyDecision(
            decision=ActionDecision.REQUIRE_APPROVAL,
            risk=ActionRisk.HIGH,
            reason="Changing ticket status requires human approval.",
        )


agent_action_policy = AgentActionPolicy()