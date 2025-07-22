"use client"

import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { Building2, ChevronDown, ClipboardList, FileSearch, Package, Search, KeyRound, ScanEye} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { encryptPrivateKeyWithPassphrase, openDB } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { getPublicKeyStorageContract } from '@/lib/contracts';

export function DashboardSidebar() {
  const location = useLocation()
  const [tendersOpen, setTendersOpen] = React.useState(true)
  const [userRole, setUserRole] = useState<string>('');
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // Re-import Private Key state
  const [showReimportDialog, setShowReimportDialog] = React.useState(false);
  const [reimportPassphrase, setReimportPassphrase] = React.useState('');
  const [reimportPrivateKey, setReimportPrivateKey] = React.useState('');
  const [reimportLoading, setReimportLoading] = React.useState(false);
  const [reimportFileName, setReimportFileName] = React.useState('');
  const { address } = useAccount();

  const handleReimportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReimportFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReimportPrivateKey(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  const handleReimportPassphraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReimportPassphrase(e.target.value);
  };

  const checkUserRole = async () => {
    if (!address) {
      setIsLoadingRole(false);
      return;
    }
    
    try {
      const publicKeyStorageContract = await getPublicKeyStorageContract();
      const role = await publicKeyStorageContract.getRole(address);
      setUserRole(role);
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('');
    } finally {
      setIsLoadingRole(false);
    }
  };

  useEffect(() => {
    checkUserRole();
  }, [address]);

  const handleSaveReimportedKey = async () => {
    if (!reimportPassphrase) {
      toast.error('Please enter a passphrase');
      return;
    }
    if (!reimportPrivateKey) {
      toast.error('Please upload your private key file');
      return;
    }
    try {
      setReimportLoading(true);
      const encryptedResult = await encryptPrivateKeyWithPassphrase(reimportPrivateKey, reimportPassphrase);
      // Store encrypted key in IndexedDB
      const db = await openDB();
      const tx = db.transaction('encryptedKeys', 'readwrite');
      const store = tx.objectStore('encryptedKeys');
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          address,
          encryptedKey: btoa(String.fromCharCode(...encryptedResult.encryptedData)),
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      toast.success('Private key re-imported and stored successfully');
      setShowReimportDialog(false);
      setReimportPassphrase('');
      setReimportPrivateKey('');
      setReimportFileName('');
    } catch (error) {
      console.error('Error saving encrypted key:', error);
      toast.error('Failed to save encrypted key');
    } finally {
      setReimportLoading(false);
    }
  };

  const isActive = (path: string) => location.pathname === path

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Tender App</span>
                <span className="text-xs text-muted-foreground">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {!isLoadingRole && (
            <>
              {/* Show Tenders section only for non-organizers */}
              {userRole !== 'organizer' && (
                <Collapsible open={tendersOpen} onOpenChange={setTendersOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Package className="size-4" />
                        <span>Tenders</span>
                        <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive("/tenders/search")}>
                            <Link to="/tenders/search">
                              <Search className="size-4" />
                              <span>Search Tenders</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive("/tenders/registered")}>
                            <Link to="/tenders/registered">
                              <FileSearch className="size-4" />
                              <span>Registered Tenders</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Show My Tenders for organizers */}
              {userRole === 'organizer' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/my-tenders")}>
                    <Link to="/my-tenders">
                      <ClipboardList className="size-4" />
                      <span>My Tenders</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Show Access Requests for organizers */}
              {userRole === 'organizer' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/access-requests")}>
                    <Link to="/access-requests">
                      <ScanEye className="size-4" />
                      <span>Access Requests</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Show Re-import Private Key for all users */}
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full" onClick={() => setShowReimportDialog(true)}>
                  <KeyRound className="size-4" />
                  <span>Re-import Private Key</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="absolute bottom-0 left-0 right-0 p-4 h-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full">
              <ConnectButton />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Dialog open={showReimportDialog} onOpenChange={setShowReimportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Re-import Your Private Key</DialogTitle>
              <DialogDescription>
                Upload your private key file and set a passphrase to encrypt it for local storage. The private key will NOT be stored on the server, and will NOT be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="privateKeyFile">Private Key File</Label>
                <Input
                  id="privateKeyFile"
                  type="file"
                  accept=".json,.txt,.key"
                  onChange={handleReimportFileChange}
                />
                {reimportFileName && <div className="text-xs text-muted-foreground">Selected: {reimportFileName}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reimportPassphrase">Passphrase for Local Storage</Label>
                <Input
                  id="reimportPassphrase"
                  type="password"
                  placeholder="Enter passphrase"
                  value={reimportPassphrase}
                  onChange={handleReimportPassphraseChange}
                />
              </div>
              <Button
                onClick={handleSaveReimportedKey}
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={reimportLoading}
              >
                {reimportLoading ? 'Saving...' : 'Save Encrypted Key'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
