import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getTicket } from "../services/ticketService";
import { getTicketMessages } from "../services/messageService";
import MessageBubble from "../components/MessageBubble";
import TicketHeader from "../components/TicketHeader";
import MessageComposer from "../components/MessageComposer";
import { createTicketMessage } from "../services/messageService";

import type { Ticket } from "../types/ticket";
import type { TicketMessage } from "../types/message";
import { analyzeTicket, streamAIJob } from "../services/ticketAIService";
import TicketAIAnalysis from "../components/tickets/TicketAIAnalysis";
import type { TicketAIAnalysis as TicketAIAnalysisData } from "../types/ticketAI";
import { useAuth } from "../context/AuthContext";
import AIAnalysisProgress from "../components/AIAnalysisProgress";
import AgentActionCard from "../components/ai/AgentActionCard";
import { getAgentActions } from "../services/agentActionService";
import type { AgentAction } from "../types/agentAction";

export default function TicketDetailPage() {
  const { organizationId, ticketId } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<TicketAIAnalysisData | null>(
    null,
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [aiStatus, setAIStatus] = useState<
    "idle" | "queued" | "processing" | "completed" | "failed"
  >("idle");
  const [aiProgress, setAIProgress] = useState("");
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    async function loadTicket() {
      try {
        setLoading(true);
        if (!ticketId) {
          return;
        }
        const [ticketResponse, messagesResponse, actions] = await Promise.all([
          getTicket(ticketId),
          getTicketMessages(ticketId),
          getAgentActions(),
        ]);

        setTicket(ticketResponse);
        setMessages(messagesResponse.items);
        setAgentActions(
          actions.filter((action) => action.ticket_id === ticketId),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [ticketId]);

  async function handleSendMessage(content: string) {
    if (!ticketId) {
      return;
    }

    const newMessage = await createTicketMessage(ticketId, {
      content,
    });

    setMessages((current) => [...current, newMessage]);
  }

  // async function handleAIAnalysis() {
  //   if (!ticketId) {
  //     return;
  //   }
  //   try {
  //     setAiLoading(true);
  //     setAiError(null);

  //     const result = await analyzeTicket(ticketId);

  //     setAiAnalysis(result);
  //   } catch (error) {
  //     setAiError(error instanceof Error ? error.message : "AI analysis failed");
  //   } finally {
  //     setAiLoading(false);
  //   }
  // }

  const handleAnalyze = async () => {
    if (!ticket) {
      return;
    }

    setAiError(null);

    setAIStatus("queued");

    setAIProgress("Creating AI analysis job...");

    try {
      const job = await analyzeTicket(ticket.id);

      setAIStatus("queued");

      setAIProgress("AI analysis queued...");

      await streamAIJob(ticket.id, job.id, (event) => {
        if (event.status === "PROCESSING") {
          setAIStatus("processing");
        }

        if (event.status === "COMPLETED") {
          setAIStatus("completed");
        }

        if (event.status === "FAILED") {
          setAIStatus("failed");
        }

        if (event.message) {
          setAIProgress(event.message);
        }

        if (event.type === "completed") {
          // loadAIAnalysis();
        }
      });
    } catch (error) {
      console.error("AI analysis failed:", error);

      setAIStatus("failed");

      setAIProgress("Unable to complete AI analysis.");

      setAiError("AI analysis connection failed.");
    }
  };

  if (loading) {
    return <p>Loading ticket...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!ticket) {
    return <p>Ticket not found.</p>;
  }

  return (
    <div>
      <Link
        to={
          organizationId
            ? `/organizations/${organizationId}/tickets`
            : "/tickets"
        }
      >
        ← Back to tickets
      </Link>

      <TicketHeader ticket={ticket} />
      {agentActions.map((action) => (
        <AgentActionCard
          key={action.id}
          action={action}
          onUpdated={(updated) => {
            setAgentActions((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            );
          }}
        />
      ))}
      {user && ["AGENT", "MANAGER", "ADMIN"].includes(user.role) && (
        <section className="ai-analysis-section">
          <button
            onClick={handleAnalyze}
            disabled={aiLoading}
            className="rounded-lg border px-4 py-2"
          >
            {aiLoading ? "Analyzing..." : "Analyze with AI"}
          </button>
          <AIAnalysisProgress status={aiStatus} message={aiProgress} />

          {aiError && <p className="text-red-500">{aiError}</p>}

          {aiAnalysis && <TicketAIAnalysis analysis={aiAnalysis} />}
        </section>
      )}

      <div className="ticket-detail-grid">
        <section className="conversation-section">
          <h2>Conversation</h2>

          <div className="conversation">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>

          <MessageComposer onSend={handleSendMessage} />
        </section>

        <aside className="ticket-sidebar">
          <h2>Ticket Details</h2>

          <div className="detail-item">
            <span>Status</span>
            <strong>{ticket.status}</strong>
          </div>

          <div className="detail-item">
            <span>Priority</span>
            <strong>{ticket.priority}</strong>
          </div>

          <div className="detail-item">
            <span>Customer</span>
            <strong>{ticket.customer_id.slice(0, 8)}</strong>
          </div>

          <div className="detail-item">
            <span>Created</span>
            <strong>{new Date(ticket.created_at).toLocaleDateString()}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
