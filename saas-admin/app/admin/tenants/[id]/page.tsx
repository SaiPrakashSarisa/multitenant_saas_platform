'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, CreditCard, Mail, MoreVertical, Shield, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTenant, useTenantActions } from '@/hooks/use-tenant';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: tenant, isLoading, error } = useTenant(id);
  const { suspendTenant, activateTenant, isSuspending, isActivating } = useTenantActions();
  
  const [suspendReason, setSuspendReason] = useState('');
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);

  const handleSuspend = async () => {
    try {
      await suspendTenant({ id, reason: suspendReason });
      setIsSuspendOpen(false);
      setSuspendReason('');
    } catch (err) {
      console.error('Failed to suspend', err);
    }
  };

  const handleActivate = async () => {
    try {
      await activateTenant(id);
    } catch (err) {
      console.error('Failed to activate', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <h2 className="text-xl font-semibold">Tenant not found</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
              <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className={
                tenant.status === 'active' ? 'bg-emerald-500' : 
                tenant.status === 'suspended' ? 'bg-red-500' : ''
              }>
                {tenant.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded mr-2">{tenant.id}</span>
              <span className="capitalize">{tenant.businessType}</span>
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Plan Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription Plan</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{tenant.plan?.displayName || 'Basic'}</div>
                <p className="text-xs text-muted-foreground capitalize">
                  {tenant.plan?.billingCycle || 'Monthly'} Billing
                </p>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Primary Contact</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium truncate">{tenant.users?.[0]?.email || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  {tenant.users?.[0]?.firstName} {tenant.users?.[0]?.lastName}
                </p>
              </CardContent>
            </Card>

            {/* Joined Date */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Joined On</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.floor((Date.now() - new Date(tenant.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Business Type</span>
                  <span className="text-sm font-medium capitalize">{tenant.businessType}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Slug</span>
                  <span className="text-sm font-medium">{tenant.slug}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Total Users</span>
                  <span className="text-sm font-medium">{tenant.users?.length || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge variant="outline" className="capitalize">{tenant.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enabled Modules</CardTitle>
              <CardDescription>
                Modules available to this tenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.tenantModules?.length === 0 ? (
                <div className="text-sm text-muted-foreground">No modules enabled.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {tenant.tenantModules?.map((tm: any) => (
                    <div key={tm.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-md border">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tm.module?.displayName}</p>
                          <p className="text-xs text-gray-500 capitalize">{tm.module?.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
              <CardDescription className="text-red-700">
                Actions here can significantly impact the tenant's access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.status === 'active' ? (
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="space-y-1">
                    <h4 className="font-medium text-red-900">Suspend Tenant</h4>
                    <p className="text-sm text-red-700">
                      Temporarily disable access for all users in this tenant.
                    </p>
                  </div>
                  <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Suspend Access
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Suspend Tenant Access</DialogTitle>
                        <DialogDescription>
                          Are you sure? This will immediately block access for {tenant.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 py-4">
                        <Label>Reason for Suspension</Label>
                        <Textarea 
                          placeholder="e.g. Non-payment, Violation of terms..."
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSuspendOpen(false)}>Cancel</Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleSuspend}
                          disabled={!suspendReason || isSuspending}
                        >
                          {isSuspending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Suspension'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border border-emerald-200 rounded-lg bg-emerald-50">
                  <div className="space-y-1">
                    <h4 className="font-medium text-emerald-900">Activate Tenant</h4>
                    <p className="text-sm text-emerald-700">
                      Restore full access to this tenant.
                    </p>
                  </div>
                  <Button variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-100" onClick={handleActivate} disabled={isActivating}>
                    {isActivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Activate Access</>}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
