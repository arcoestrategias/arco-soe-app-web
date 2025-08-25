import { useState } from "react";
import { Note } from "@/shared/types/note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface NotesPanelProps {
  notes: Note[];
  onAdd?: (content: string) => void;
  onUpdate?: (id: string, content: string) => void;
  readOnly?: boolean;
}

export function NotesPanel({
  notes,
  onAdd,
  onUpdate,
  readOnly,
}: NotesPanelProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const handleAdd = () => {
    if (newContent.trim() && onAdd) {
      onAdd(newContent.trim());
      setNewContent("");
    }
  };

  const handleUpdate = (id: string) => {
    if (editedContent.trim() && onUpdate) {
      onUpdate(id, editedContent.trim());
      setEditingNoteId(null);
      setEditedContent("");
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="space-y-2">
          <Textarea
            placeholder="Write a note..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <Button size="sm" onClick={handleAdd}>
            Add Note
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="p-3 border rounded-md">
            {editingNoteId === note.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
                <Button size="sm" onClick={() => handleUpdate(note.id)}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm whitespace-pre-line">{note.content}</p>
                <div className="text-xs text-muted-foreground">
                  By {note.createdBy} •{" "}
                  {new Date(note.createdAt).toLocaleString()}
                </div>
                {!readOnly && onUpdate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingNoteId(note.id);
                      setEditedContent(note.content);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
