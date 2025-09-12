import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";

interface CSVParticipantImportProps {
  gameId: string;
  gameRoles: any[];
  onImportComplete: () => void;
}

interface ParsedParticipant {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  budget?: number;
  valid: boolean;
  errors: string[];
}

export default function CSVParticipantImport({ gameId, gameRoles, onImportComplete }: CSVParticipantImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedParticipant[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    const text = await file.text();
    parseCSV(text);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Expected headers: email, first_name, last_name, role, budget (optional)
    const requiredHeaders = ['email', 'first_name', 'last_name', 'role'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
      return;
    }

    const participants: ParsedParticipant[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const participant: ParsedParticipant = {
        email: '',
        first_name: '',
        last_name: '',
        role: '',
        budget: undefined,
        valid: true,
        errors: []
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'email':
            participant.email = value;
            if (!value.includes('@')) {
              participant.errors.push('Invalid email format');
              participant.valid = false;
            }
            break;
          case 'first_name':
            participant.first_name = value;
            if (!value) {
              participant.errors.push('First name is required');
              participant.valid = false;
            }
            break;
          case 'last_name':
            participant.last_name = value;
            break;
          case 'role':
            participant.role = value.toLowerCase();
            const validRoles = gameRoles.map(r => r.role);
            if (!validRoles.includes(participant.role)) {
              participant.errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
              participant.valid = false;
            }
            break;
          case 'budget':
            if (value) {
              participant.budget = Number(value);
              if (isNaN(participant.budget) || participant.budget < 0) {
                participant.errors.push('Budget must be a positive number');
                participant.valid = false;
              }
            }
            break;
        }
      });

      // Set default budget if not provided
      if (!participant.budget && participant.valid) {
        const roleData = gameRoles.find(r => r.role === participant.role);
        participant.budget = roleData?.default_budget || 0;
      }

      participants.push(participant);
    }

    setParsedData(participants);
    toast.success(`Parsed ${participants.length} participants (${participants.filter(p => p.valid).length} valid)`);
  };

  const handleImport = async () => {
    const validParticipants = parsedData.filter(p => p.valid);
    if (validParticipants.length === 0) {
      toast.error("No valid participants to import");
      return;
    }

    setImporting(true);
    let successCount = 0;

    try {
      for (const participant of validParticipants) {
        // Create demo user (in real app, would send invitation)
        const demoUserId = crypto.randomUUID();
        
        const { error: userError } = await supabase
          .from("users")
          .insert({
            id: demoUserId,
            first_name: participant.first_name,
            last_name: participant.last_name
          });

        if (!userError) {
          // Add participant
          const { error: participantError } = await supabase
            .from("participants")
            .insert({
              game_id: gameId,
              user_id: demoUserId,
              role: participant.role as "founder" | "angel" | "vc" | "organizer",
              initial_budget: participant.budget,
              current_cash: participant.budget
            });

          if (!participantError) {
            successCount++;
          }
        }
      }

      toast.success(`Successfully imported ${successCount} participants`);
      setIsOpen(false);
      setParsedData([]);
      onImportComplete();
    } catch (error) {
      toast.error("Failed to import participants");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Participants from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: email, first_name, last_name, role, budget (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                <p className="text-gray-700 mb-4">or click to browse</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </CardContent>
          </Card>

          {/* CSV Format Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Expected CSV Format</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                email,first_name,last_name,role,budget{'\n'}
                john@example.com,John,Doe,founder,10000{'\n'}
                jane@vc.com,Jane,Smith,vc,1000000{'\n'}
                angel@invest.com,Angel,Investor,angel,100000
              </pre>
            </CardContent>
          </Card>

          {/* Parsed Data Preview */}
          {parsedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Preview ({parsedData.filter(p => p.valid).length} valid, {parsedData.filter(p => !p.valid).length} invalid)</span>
                  <Button 
                    onClick={handleImport} 
                    disabled={importing || parsedData.filter(p => p.valid).length === 0}
                  >
                    {importing ? "Importing..." : `Import ${parsedData.filter(p => p.valid).length} Participants`}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((participant, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {participant.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>{participant.email}</TableCell>
                        <TableCell>{participant.first_name} {participant.last_name}</TableCell>
                        <TableCell className="capitalize">{participant.role}</TableCell>
                        <TableCell>${participant.budget?.toLocaleString()}</TableCell>
                        <TableCell>
                          {participant.errors.length > 0 && (
                            <div className="text-red-500 text-xs">
                              {participant.errors.join(', ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}