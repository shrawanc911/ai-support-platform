from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent.action_enums import (
    AgentActionStatus,
    AgentActionType,
)
from app.models.agent_action import AgentAction
from app.models.ticket import Ticket
from app.models.user import User, UserRole

class AgentActionService:

    async def create_action(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        ticket_id: UUID,
        requested_by_id: UUID,
        action_type: AgentActionType,
        payload: dict,
    ) -> AgentAction:

        ticket = await db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.organization_id == organization_id,
            )
        )

        if ticket is None:
            raise ValueError("Ticket not found")

        action = AgentAction(
            organization_id=organization_id,
            ticket_id=ticket_id,
            requested_by_id=requested_by_id,
            action_type=action_type,
            status=AgentActionStatus.PENDING,
            payload=payload,
        )

        db.add(action)
        await db.commit()
        await db.refresh(action)

        return action

    async def get_action(
        self,
        db: AsyncSession,
        *,
        organization_id: UUID,
        action_id: UUID,
    ) -> AgentAction | None:

        return await db.scalar(
            select(AgentAction).where(
                AgentAction.id == action_id,
                AgentAction.organization_id == organization_id,
            )
        )

    async def approve_action(
        self,
        db: AsyncSession,
        *,
        action: AgentAction,
        approver: User,
    ) -> AgentAction:

        if approver.role not in {
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        }:
            raise PermissionError(
                "You are not allowed to approve agent actions"
            )

        if action.status != AgentActionStatus.PENDING:
            raise ValueError(
                f"Action cannot be approved from {action.status}"
            )

        action.status = AgentActionStatus.APPROVED
        action.approved_by_id = approver.id
        action.approved_at = datetime.utcnow()

        await db.commit()
        await db.refresh(action)

        return action

    async def reject_action(
        self,
        db: AsyncSession,
        *,
        action: AgentAction,
        approver: User,
        reason: str,
    ) -> AgentAction:

        if approver.role not in {
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        }:
            raise PermissionError(
                "You are not allowed to reject agent actions"
            )

        if action.status != AgentActionStatus.PENDING:
            raise ValueError(
                f"Action cannot be rejected from {action.status}"
            )

        action.status = AgentActionStatus.REJECTED
        action.approved_by_id = approver.id
        action.approved_at = datetime.utcnow()
        action.error_message = reason

        await db.commit()
        await db.refresh(action)

        return action


    async def execute_action(
        self,
        db: AsyncSession,
        *,
        action: AgentAction,
    ) -> AgentAction:

        if action.status != AgentActionStatus.APPROVED:
            raise ValueError(
                "Only approved actions can be executed"
            )

        try:

            if action.action_type == AgentActionType.CHANGE_TICKET_STATUS:
                await self._change_ticket_status(
                    db=db,
                    action=action,
                )

            elif action.action_type == AgentActionType.ASSIGN_TICKET:
                await self._assign_ticket(
                    db=db,
                    action=action,
                )

            elif action.action_type == AgentActionType.ADD_INTERNAL_NOTE:
                await self._add_internal_note(
                    db=db,
                    action=action,
                )

            else:
                raise ValueError(
                    f"Unsupported action: {action.action_type}"
                )

            action.status = AgentActionStatus.EXECUTED
            action.executed_at = datetime.utcnow()
            action.error_message = None

            await db.commit()
            await db.refresh(action)

            return action

        except Exception as exc:

            await db.rollback()

            action.status = AgentActionStatus.FAILED
            action.error_message = str(exc)

            await db.commit()
            await db.refresh(action)

            return action

    async def _change_ticket_status(
        self,
        db: AsyncSession,
        *,
        action: AgentAction,
    ):
        ticket = await db.scalar(
            select(Ticket).where(
                Ticket.id == action.ticket_id,
                Ticket.organization_id == action.organization_id,
            )
        )

        if ticket is None:
            raise ValueError("Ticket not found")

        new_status = action.payload.get("status")

        if not new_status:
            raise ValueError(
                "Missing target status"
            )

        from app.services.ticket_workflow import TicketWorkflowService

        workflow = TicketWorkflowService()

        await workflow.change_status(
            db=db,
            ticket=ticket,
            new_status=new_status,
            actor_id=action.approved_by_id,
        )


    async def _assign_ticket(
        self,
        db: AsyncSession,
        *,
        action: AgentAction,
    ):
        ticket = await db.scalar(
            select(Ticket).where(
                Ticket.id == action.ticket_id,
                Ticket.organization_id == action.organization_id,
            )
        )

        if ticket is None:
            raise ValueError("Ticket not found")

        agent_id = action.payload.get("user_id")

        if not agent_id:
            raise ValueError(
                "Missing user_id"
            )

        agent = await db.scalar(
            select(User).where(
                User.id == agent_id,
                User.organization_id == action.organization_id,
                User.is_active.is_(True),
            )
        )

        if agent is None:
            raise ValueError(
                "Agent not found"
            )

        if agent.role not in {
            UserRole.AGENT,
            UserRole.MANAGER,
            UserRole.ADMIN,
        }:
            raise ValueError(
                "User cannot receive ticket assignments"
            )

        # IMPORTANT:
        # Use the existing ticket assignment field/service
        # from your project here.
        ticket.assigned_to_id = agent.id


    async def _add_internal_note(
        self,
        db: AsyncSession,
        *,
        action: AgentAction,
    ):
        from app.models.ticket_message import (
            TicketMessage,
            MessageSenderType,
        )

        content = action.payload.get("content")

        if not content:
            raise ValueError(
                "Missing note content"
            )

        message = TicketMessage(
            ticket_id=action.ticket_id,
            sender_id=action.approved_by_id,
            sender_type=MessageSenderType.SYSTEM,
            content=content,
        )

        db.add(message)
        await db.flush()