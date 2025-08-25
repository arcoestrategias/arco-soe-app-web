import { FileDocument } from "@/shared/types/fileDocument";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface DocumentPanelProps {
  documents: FileDocument[];
  onAddDocument?: (file: File) => void;
  onRemoveDocument?: (id: string) => void;
  onPreviewDocument?: (doc: FileDocument) => void;
  readOnly?: boolean;
}

export function DocumentPanel({
  documents,
  onAddDocument,
  onRemoveDocument,
  onPreviewDocument,
  readOnly,
}: DocumentPanelProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onAddDocument) {
      onAddDocument(file);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            <span>Upload document</span>
            <input type="file" onChange={handleFileChange} hidden />
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="truncate">
                <p className="font-medium truncate">{doc.name}</p>
                <p className="text-sm text-muted-foreground">
                  {doc.size && <span>{(doc.size / 1024).toFixed(2)} KB</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {onPreviewDocument && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreviewDocument(doc)}
                  >
                    Preview
                  </Button>
                )}
                {!readOnly && onRemoveDocument && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveDocument(doc.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
