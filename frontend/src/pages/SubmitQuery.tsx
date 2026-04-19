import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@/context/QueryContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QueryCategory, QueryPriority, Attachment } from "@/types/query";
import { Upload, X, FileText, Image, File } from "lucide-react";

const categories: QueryCategory[] = ["IT Support", "HR", "Facilities", "Finance", "General"];
const priorities: QueryPriority[] = ["low", "medium", "high", "critical"];

// Helper to get file icon
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  return File;
};

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function SubmitQuery() {
  const { addQuery } = useQueries();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    subject: "",
    category: "" as QueryCategory | "",
    priority: "" as QueryPriority | "",
    description: "",
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.subject.trim()) e.subject = "Subject is required";
    else if (form.subject.length > 200) e.subject = "Subject must be under 200 characters";
    if (!form.category) e.category = "Category is required";
    if (!form.priority) e.priority = "Priority is required";
    if (!form.description.trim()) e.description = "Description is required";
    else if (form.description.length > 2000) e.description = "Description must be under 2000 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    setAttachedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Convert files to Attachment objects
    const attachments: Attachment[] = attachedFiles.map((file, index) => ({
      id: `att-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: "#", // In a real app, this would be uploaded to a server
      uploadedAt: new Date().toISOString(),
    }));

    const id = addQuery({
      subject: form.subject.trim(),
      category: form.category as QueryCategory,
      priority: form.priority as QueryPriority,
      description: form.description.trim(),
      status: "open",
      submittedBy: "Current User",
    }, attachments);

    toast({ title: "Query Submitted", description: `Ticket ${id} has been created successfully.` });
    navigate(`/queries/${id}`);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submit New Query</h1>
          <p className="text-muted-foreground text-sm">Create a new support ticket for your issue</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Query Details</CardTitle>
            <CardDescription>Fill in the information below to submit your request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  maxLength={200}
                />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as QueryCategory }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as QueryPriority }))}>
                    <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => <SelectItem key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.priority && <p className="text-xs text-destructive">{errors.priority}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your issue..."
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={2000}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Attachments (optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt,.log"
                />
                <div
                  className="border-2 border-dashed rounded-md p-6 text-center text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Drag & drop files or click to browse</p>
                  <p className="text-xs mt-1">Max 10MB per file</p>
                </div>

                {/* File List */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachedFiles.map((file, index) => {
                      const FileIcon = getFileIcon(file.type);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <FileIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancel</Button>
                <Button type="submit">Submit Query</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
