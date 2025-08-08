import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
  isDeleting?: boolean;
  canDelete?: boolean;
  blockReason?: string;
  onPrerequisiteAction?: () => void;
  prerequisiteActionLabel?: string;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isDeleting = false,
  canDelete = true,
  blockReason,
  onPrerequisiteAction,
  prerequisiteActionLabel,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className={`h-6 w-6 ${canDelete ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <DialogTitle className={canDelete ? 'text-red-600' : 'text-amber-600'}>
                {title}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className={`border rounded-lg p-4 ${canDelete ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-sm ${canDelete ? 'text-red-800' : 'text-amber-800'}`}>
              <strong>Item to be deleted:</strong> {itemName}
            </p>
            {!canDelete && blockReason && (
              <p className="text-sm text-amber-800 mt-2">
                <strong>Reason:</strong> {blockReason}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          
          {canDelete ? (
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          ) : (
            onPrerequisiteAction && prerequisiteActionLabel && (
              <Button
                variant="default"
                onClick={() => {
                  onPrerequisiteAction();
                  onClose();
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {prerequisiteActionLabel}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
