import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Plus, X } from "lucide-react";
import { CreateDriverRequest, driverApi, ApiError } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface AddDriverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDriverAdded: () => void;
}

const AddDriverDialog: React.FC<AddDriverDialogProps> = ({
  isOpen,
  onClose,
  onDriverAdded
}) => {
  const [formData, setFormData] = useState<CreateDriverRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
    experience: 0,
    vehicle: {
      number: "",
      type: "truck",
      model: "",
      capacity: 0
    },
    certifications: [],
    documents: {
      license: "",
      insurance: "",
      registration: ""
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCertification, setNewCertification] = useState("");

  const handleInputChange = (field: string, value: string | number) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (keys.length === 2) {
      setFormData(prev => {
        if (keys[0] === 'vehicle') {
          return {
            ...prev,
            vehicle: {
              ...prev.vehicle,
              [keys[1]]: value
            }
          };
        } else if (keys[0] === 'documents') {
          return {
            ...prev,
            documents: {
              ...prev.documents,
              [keys[1]]: value
            }
          };
        }
        return prev;
      });
    }
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert !== certification)
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      licenseNumber: "",
      licenseExpiry: "",
      experience: 0,
      vehicle: {
        number: "",
        type: "truck",
        model: "",
        capacity: 0
      },
      certifications: [],
      documents: {
        license: "",
        insurance: "",
        registration: ""
      }
    });
    setError(null);
    setNewCertification("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await driverApi.createDriver(formData);
      onDriverAdded();
      resetForm();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
          <DialogDescription>
            Fill in the driver's information, vehicle details, and required documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-transport-primary">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-transport-primary">License Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="experience">Experience (Years) *</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-transport-primary">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicle.number}
                  onChange={(e) => handleInputChange('vehicle.number', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select
                  value={formData.vehicle.type}
                  onValueChange={(value) => handleInputChange('vehicle.type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="bike">Motorcycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleModel">Vehicle Model *</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicle.model}
                  onChange={(e) => handleInputChange('vehicle.model', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleCapacity">Vehicle Capacity (kg) *</Label>
                <Input
                  id="vehicleCapacity"
                  type="number"
                  min="1"
                  value={formData.vehicle.capacity}
                  onChange={(e) => handleInputChange('vehicle.capacity', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-transport-primary">Certifications</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add certification (e.g., Hazmat, CDL)"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" onClick={addCertification} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {cert}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeCertification(cert)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-transport-primary">Documents</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="licenseDocument">License Document URL *</Label>
                <Input
                  id="licenseDocument"
                  placeholder="https://example.com/license-document.pdf"
                  value={formData.documents.license}
                  onChange={(e) => handleInputChange('documents.license', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="insuranceDocument">Insurance Document URL *</Label>
                <Input
                  id="insuranceDocument"
                  placeholder="https://example.com/insurance-document.pdf"
                  value={formData.documents.insurance}
                  onChange={(e) => handleInputChange('documents.insurance', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="registrationDocument">Vehicle Registration Document URL *</Label>
                <Input
                  id="registrationDocument"
                  placeholder="https://example.com/registration-document.pdf"
                  value={formData.documents.registration}
                  onChange={(e) => handleInputChange('documents.registration', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Driver
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDriverDialog;
