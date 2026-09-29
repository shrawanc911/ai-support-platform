import { useState } from "react";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subject: string;
    description: string;
  }) => void | Promise<void>;
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTicketModalProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        subject: subject.trim(),
        description: description.trim(),
      });

      setSubject("");
      setDescription("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setSubject("");
    setDescription("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create Ticket
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Tell us what you need help with.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Subject */}
          <div>
            <label
              htmlFor="ticket-subject"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Subject
            </label>

            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is your issue about?"
              maxLength={500}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="ticket-description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={6}
              required
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="mt-1 text-right text-xs text-gray-400">
              {description.length} characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !subject.trim() ||
                !description.trim()
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
