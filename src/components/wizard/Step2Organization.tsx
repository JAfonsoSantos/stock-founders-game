import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface Step2Props {
  formData: {
    organizerName: string;
    organizerCompany: string;
    eventWebsite: string;
    teamMembers: Array<{
      email: string;
      name: string;
      role: string;
    }>;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const Step2Organization = React.memo(function Step2Organization({ formData, setFormData }: Step2Props) {
  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { email: "", name: "", role: "" }]
    }));
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-700">Organização</h2>
        <p className="text-gray-600">Informações sobre a organização e equipa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="organizerName" className="text-gray-600">Nome do Organizador *</Label>
          <Input
            id="organizerName"
            value={formData.organizerName}
            onChange={(e) => setFormData(prev => ({ ...prev, organizerName: e.target.value }))}
            placeholder="Seu nome"
            className="placeholder:text-gray-400 border-gray-300 focus:border-gray-400 text-gray-500"
          />
        </div>
        <div>
          <Label htmlFor="organizerCompany" className="text-gray-600">Empresa/Organização</Label>
          <Input
            id="organizerCompany"
            value={formData.organizerCompany}
            onChange={(e) => setFormData(prev => ({ ...prev, organizerCompany: e.target.value }))}
            placeholder="Nome da empresa"
            className="placeholder:text-gray-400 border-gray-300 focus:border-gray-400 text-gray-500"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="eventWebsite" className="text-gray-600">Website do Evento</Label>
        <Input
          id="eventWebsite"
          value={formData.eventWebsite}
          onChange={(e) => setFormData(prev => ({ ...prev, eventWebsite: e.target.value }))}
          placeholder="https://..."
          className="placeholder:text-gray-400 border-gray-300 focus:border-gray-400 text-gray-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-gray-600">Membros da Equipa</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Membro
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.teamMembers.map((member, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg bg-white">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Email"
                  value={member.email}
                  onChange={(e) => {
                    const newMembers = [...formData.teamMembers];
                    newMembers[index].email = e.target.value;
                    setFormData(prev => ({ ...prev, teamMembers: newMembers }));
                  }}
                  className="placeholder:text-gray-400 border-gray-300 focus:border-gray-400 text-gray-500"
                />
                <Input
                  placeholder="Nome"
                  value={member.name}
                  onChange={(e) => {
                    const newMembers = [...formData.teamMembers];
                    newMembers[index].name = e.target.value;
                    setFormData(prev => ({ ...prev, teamMembers: newMembers }));
                  }}
                  className="placeholder:text-gray-400 border-gray-300 focus:border-gray-400 text-gray-500"
                />
                <Input
                  placeholder="Cargo"
                  value={member.role}
                  onChange={(e) => {
                    const newMembers = [...formData.teamMembers];
                    newMembers[index].role = e.target.value;
                    setFormData(prev => ({ ...prev, teamMembers: newMembers }));
                  }}
                  className="placeholder:text-gray-400 border-gray-300 focus:border-gray-400 text-gray-500"
                />
              </div>
              {index > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeTeamMember(index)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});