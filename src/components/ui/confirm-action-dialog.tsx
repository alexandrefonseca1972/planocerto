import { Button } from "@/components/ui/button";
import { AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface ConfirmActionDialogProps {
  title: string;
  msg: string;
  name: string;
  value: string;
  action: (p: FormData) => void;
  pending: boolean;
}

export function ConfirmActionDialog({ title, msg, name, value, action, pending }: ConfirmActionDialogProps) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{msg}</AlertDialogDescription>
      </AlertDialogHeader>
      <form action={action}>
        <input type="hidden" name={name} value={value} />
        <AlertDialogFooter>
          <AlertDialogCancel />
          <Button type="submit" variant="destructive" isLoading={pending}>
            <Trash2 className="h-4 w-4 mr-1" />Excluir
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}
