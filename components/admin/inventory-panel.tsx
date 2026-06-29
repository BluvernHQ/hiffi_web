"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { InventoryClaimsTable } from "@/components/admin/inventory-claims-table"
import { InventoryTable } from "@/components/admin/inventory-table"
import { InventoryUploadPanel } from "@/components/admin/inventory-upload-panel"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type InventoryTab = "browse" | "upload" | "claims"

const TAB_QUERY = "inventory_tab"

export function InventoryPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { can } = useAdminPermissions()
  const [uploadBusy, setUploadBusy] = useState(false)
  const [tabLeaveDialogOpen, setTabLeaveDialogOpen] = useState(false)
  const [pendingTab, setPendingTab] = useState<InventoryTab | null>(null)

  const canUpload = can("admin:inventory_upload")
  const canClaims = can("admin:inventory_claims")

  const activeTab = useMemo((): InventoryTab => {
    const raw = searchParams.get(TAB_QUERY)
    if (raw === "upload" && canUpload) return "upload"
    if (raw === "claims" && canClaims) return "claims"
    return "browse"
  }, [searchParams, canUpload, canClaims])

  const setTab = (tab: InventoryTab) => {
    if (uploadBusy && tab !== activeTab) {
      setPendingTab(tab)
      setTabLeaveDialogOpen(true)
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("section", "artist_inventory")
    if (tab === "browse") params.delete(TAB_QUERY)
    else params.set(TAB_QUERY, tab)
    router.replace(`/admin/dashboard?${params.toString()}`)
  }

  const confirmTabLeave = () => {
    if (!pendingTab) {
      setTabLeaveDialogOpen(false)
      return
    }
    setUploadBusy(false)
    setTabLeaveDialogOpen(false)
    const tab = pendingTab
    setPendingTab(null)
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", "artist_inventory")
    if (tab === "browse") params.delete(TAB_QUERY)
    else params.set(TAB_QUERY, tab)
    router.replace(`/admin/dashboard?${params.toString()}`)
  }

  const tabs: Array<{ id: InventoryTab; label: string; visible: boolean }> = [
    { id: "browse", label: "Browse", visible: true },
    { id: "upload", label: "Upload", visible: canUpload },
    { id: "claims", label: "Claims", visible: canClaims },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-1">
        {tabs
          .filter((tab) => tab.visible)
          .map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                "rounded-t-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 text-foreground border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {activeTab === "browse" ? <InventoryTable /> : null}
      {activeTab === "upload" && canUpload ? (
        <InventoryUploadPanel onBusyChange={setUploadBusy} />
      ) : null}
      {activeTab === "claims" && canClaims ? <InventoryClaimsTable /> : null}

      <Dialog open={tabLeaveDialogOpen} onOpenChange={setTabLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave upload?</DialogTitle>
            <DialogDescription>
              An import is staged or in progress. Switching tabs may interrupt the upload or discard your
              staged file.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTabLeaveDialogOpen(false)
                setPendingTab(null)
              }}
            >
              Stay on upload
            </Button>
            <Button type="button" variant="destructive" onClick={confirmTabLeave}>
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
