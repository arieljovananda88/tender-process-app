import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Send } from "lucide-react";
import { getAccessManagerContract } from "@/lib/contracts";
import { toast } from "react-toastify";
import { getTenderById } from "@/lib/api_the_graph";

interface RequestTenderAccessProps {
  tenderId: string;
  tenderOwner: string;
  tenderName: string;
}

export function RequestTenderAccess({ tenderId, tenderOwner, tenderName }: RequestTenderAccessProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestAccess = async () => {
    try {
      setIsRequesting(true);
      const contract = await getAccessManagerContract();
      const tender = await getTenderById(tenderId);
      
      const requestAccessTx = await contract.requestAccessTender(tenderId, tender.name, tender.startDate, tender.endDate, tenderOwner);
      await requestAccessTx.wait();
      
      toast.success("Access request sent successfully!");
    } catch (error: any) {
      console.error("Error requesting access:", error);
      toast.error(`Failed to request access: ${error.message}`);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg text-amber-800">Access Required</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          You don't have access to view the participants for this tender.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-amber-700">
            <p className="mb-2">
              <strong>Tender:</strong> {tenderName}
            </p>
            <p>
              To view participants, you need to request access from the tender owner.
            </p>
          </div>
          
          <Button 
            onClick={handleRequestAccess}
            disabled={isRequesting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isRequesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Request...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Request Access
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 